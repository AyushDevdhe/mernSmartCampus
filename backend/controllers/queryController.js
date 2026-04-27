const userModel = require("../models/userModel");
const queryModel = require("../models/queryModel");
const { createNotification } = require("./notificationController");
const mailSender = require("../utils/mailSender"); 
exports.createQuery = async (req, res) => {
  try {
    const { id } = req.user;
    const { title, description, priority } = req.body;

    if (!title || !description || !priority || !id) {
      return res.status(400).json({
        success: false,
        message: "all input fields required",
      });
    }

    const user = await userModel.findById(id);

    if (!user) {
      return res.status(404).json({
        success: false,
        message: "no such logged in user found in the db",
      });
    }

    const newQuery = await queryModel.create({
      user: id,
      title: title,
      description: description,
      priority: priority,
      status: "Pending",
      assignedTo: null,
    });

    // Emit WebSocket event for real-time update
    const io = req.app.get("io");
    if (io) {
      io.emit("queryCreated", newQuery);
    }

    return res.status(200).json({
      success: true,
      message: "query created successfully",
      query: newQuery,
      userEmail: user.email,
    });
  } catch (err) {
    console.error("Create Query Error:", err);
    return res.status(500).json({
      success: false,
      message: "internal server error in create query controller",
      error: err.message,
    });
  }
};

exports.getUserQueries = async (req, res) => {
  try {
    const { id } = req.user;

    if (!id) {
      return res.status(400).json({
        success: false,
        message: "no user id fetched from the middleware",
      });
    }

    const user = await userModel.findById(id);

    if (!user) {
      return res.status(404).json({
        success: false,
        message: "no such logged in user found",
      });
    }

    const queries = await queryModel.find({ user: user._id });

    return res.status(200).json({
      success: true,
      message: "all queries fetched successfully",
      queries: queries,
    });
  } catch (err) {
    console.error("Get User Queries Error:", err);
    return res.status(500).json({
      success: false,
      message: "internal server error in get query controller",
      error: err.message,
    });
  }
};

exports.getAllQueries = async (req, res) => {
  try {
    const queries = await queryModel
      .find()
      .populate("user", "firstName lastName email role")
      .populate("assignedTo", "firstName lastName email role")
      .sort({ createdAt: -1 });

    return res.status(200).json({
      success: true,
      queries: queries,
    });
  } catch (err) {
    console.error("Get All Queries Error:", err);
    return res.status(500).json({
      success: false,
      message: "internal server error in get all queries controller",
      error: err.message,
    });
  }
};

exports.assignQuery = async (req, res) => {
  try {
    const { id } = req.user;
    const { queryId } = req.params;

    const query = await queryModel.findById(queryId);

    if (!query) {
      return res.status(404).json({
        success: false,
        message: "Query not found",
      });
    }

    if (query.assignedTo) {
      return res.status(400).json({
        success: false,
        message: "Query already assigned to another supervisor",
      });
    }

    query.assignedTo = id;
    query.status = "In Progress";
    await query.save();

    // Emit WebSocket event for real-time update
    const io = req.app.get("io");
    if (io) {
      io.emit("queryAssigned", query);
    }

    return res.status(200).json({
      success: true,
      message: "Query assigned successfully",
      query: query,
    });
  } catch (err) {
    console.error("Assign Query Error:", err);
    return res.status(500).json({
      success: false,
      message: "internal server error in assign query controller",
      error: err.message,
    });
  }
};

exports.updateStatus = async (req, res) => {
  try {
    const { queryId } = req.params;
    const { status } = req.body;

    if (!status || !["Pending", "In Progress", "Resolved"].includes(status)) {
      return res.status(400).json({
        success: false,
        message: "Valid status is required",
      });
    }

    const query = await queryModel
      .findById(queryId)
      .populate("user", "firstName lastName email")
      .populate("assignedTo", "firstName lastName email");

    if (!query) {
      return res.status(404).json({
        success: false,
        message: "Query not found",
      });
    }

    const oldStatus = query.status;
    query.status = status;
    await query.save();

    // Send email notification to student when query is resolved
    if (status === "Resolved" && oldStatus !== "Resolved") {
      const student = query.user;
      const supervisor = query.assignedTo;

      const emailSubject = "✅ Your Query has been Resolved!";
      const emailBody = `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #e2e8f0; border-radius: 12px;">
          <div style="text-align: center; padding: 20px; background: linear-gradient(135deg, #22c55e, #16a34a); border-radius: 12px; margin-bottom: 20px;">
            <h1 style="color: white; margin: 0;">✅ Query Resolved!</h1>
          </div>
          
          <p style="font-size: 16px; color: #334155;">Dear <strong>${student.firstName} ${student.lastName}</strong>,</p>
          
          <p style="font-size: 16px; color: #334155;">Good news! Your query has been successfully resolved by our team.</p>
          
          <div style="background: #f0fdf4; padding: 16px; border-radius: 12px; margin: 20px 0; border-left: 4px solid #22c55e;">
            <h3 style="margin: 0 0 8px 0; color: #166534;">Query Details:</h3>
            <p style="margin: 4px 0;"><strong>Title:</strong> ${query.title}</p>
            <p style="margin: 4px 0;"><strong>Description:</strong> ${query.description}</p>
            <p style="margin: 4px 0;"><strong>Resolved By:</strong> ${supervisor ? supervisor.firstName + " " + supervisor.lastName : "Support Team"}</p>
            <p style="margin: 4px 0;"><strong>Resolved On:</strong> ${new Date().toLocaleString()}</p>
          </div>
          
          <p style="font-size: 16px; color: #334155;">Thank you for using SmartCampus. If you have any further issues, please feel free to raise a new query.</p>
          
          <hr style="margin: 20px 0; border: none; border-top: 1px solid #e2e8f0;">
          
          <p style="font-size: 12px; color: #94a3b8; text-align: center;">
            SmartCampus Support Team<br>
            <a href="${process.env.FRONTEND_URL || "http://localhost:3000"}" style="color: #3b82f6;">Visit Dashboard</a>
          </p>
        </div>
      `;

      try {
        await mailSender(student.email, emailSubject, emailBody);
        console.log(`✅ Resolution email sent to student: ${student.email}`);
      } catch (emailError) {
        console.error("Email sending failed:", emailError);
      }
    }

    // Emit WebSocket event for real-time update
    const io = req.app.get("io");
    if (io) {
      io.emit("queryUpdated", query);
    }

    return res.status(200).json({
      success: true,
      message: "Status updated successfully",
      query: query,
    });
  } catch (err) {
    console.error("Update Status Error:", err);
    return res.status(500).json({
      success: false,
      message: "internal server error in update status controller",
      error: err.message,
    });
  }
};

exports.updateQuery = async (req, res) => {
  try {
    const { id } = req.user;
    const { queryId } = req.params;
    const { title, description, priority } = req.body;

    if (!title || !description || !priority) {
      return res.status(400).json({
        success: false,
        message: "title, description and priority are required",
      });
    }

    const query = await queryModel.findById(queryId);

    if (!query) {
      return res.status(404).json({
        success: false,
        message: "Query not found",
      });
    }

    if (query.user.toString() !== id) {
      return res.status(403).json({
        success: false,
        message: "You are not authorized to update this query",
      });
    }

    const updatedQuery = await queryModel.findByIdAndUpdate(
      queryId,
      {
        title,
        description,
        priority,
      },
      { new: true, runValidators: true },
    );

    // Emit WebSocket event for real-time update
    const io = req.app.get("io");
    if (io) {
      io.emit("queryUpdated", updatedQuery);
    }

    return res.status(200).json({
      success: true,
      message: "Query updated successfully",
      query: updatedQuery,
    });
  } catch (err) {
    console.error("Update Query Error:", err);
    return res.status(500).json({
      success: false,
      message: "Internal server error in update query controller",
      error: err.message,
    });
  }
};

exports.deleteQuery = async (req, res) => {
  try {
    const { id } = req.user;
    const { queryId } = req.params;

    const query = await queryModel.findById(queryId);

    if (!query) {
      return res.status(404).json({
        success: false,
        message: "Query not found",
      });
    }

    if (query.user.toString() !== id) {
      return res.status(403).json({
        success: false,
        message: "You are not authorized to delete this query",
      });
    }

    await queryModel.findByIdAndDelete(queryId);

    // Emit WebSocket event for real-time update
    const io = req.app.get("io");
    if (io) {
      io.emit("queryDeleted", queryId);
    }

    return res.status(200).json({
      success: true,
      message: "Query deleted successfully",
    });
  } catch (err) {
    console.error("Delete Query Error:", err);
    return res.status(500).json({
      success: false,
      message: "Internal server error in delete query controller",
      error: err.message,
    });
  }
};

exports.takeAdminAction = async (req, res) => {
  try {
    const { queryId } = req.params;
    const { action, message } = req.body;

    if (
      !action ||
      !["warning", "penalty", "escalated"].includes(action.toLowerCase())
    ) {
      return res.status(400).json({
        success: false,
        message: "Valid action is required: warning, penalty, or escalated",
      });
    }

    const query = await queryModel.findById(queryId);

    if (!query) {
      return res.status(404).json({
        success: false,
        message: "Query not found",
      });
    }

    query.adminAction = action.toLowerCase();
    query.adminActionMessage =
      message || `Admin issued a ${action} for delayed resolution`;
    query.actionTakenAt = new Date();

    // ⚠️ CRITICAL: Reset escalation status
    query.escalationLevel = "none";
    query.lastEscalationNotified = null;

    await query.save();

    // Emit WebSocket event for real-time update
    const io = req.app.get("io");
    if (io) {
      io.emit("adminActionTaken", query);
    }

    return res.status(200).json({
      success: true,
      message: `Admin action '${action}' taken successfully. Query removed from escalations.`,
      query: query,
    });
  } catch (err) {
    console.error("Admin Action Error:", err);
    return res.status(500).json({
      success: false,
      message: "Internal server error in take admin action controller",
      error: err.message,
    });
  }
};



// NEW: Get escalated queries for supervisor (24hr warnings)
exports.getEscalatedWarnings = async (req, res) => {
  try {
    const { id } = req.user; // Logged-in supervisor ID
    
    const queries = await queryModel
      .find({
        status: { $ne: "Resolved" },
        escalationLevel: "warning_24hr",
        assignedTo: id, // ONLY queries assigned to THIS supervisor
      })
      .populate("user", "firstName lastName email")
      .populate("assignedTo", "firstName lastName email")
      .sort({ createdAt: 1 });

    return res.status(200).json({
      success: true,
      escalatedWarnings: queries,
    });
  } catch (err) {
    console.error("Get Escalated Warnings Error:", err);
    return res.status(500).json({
      success: false,
      message: "Error fetching escalated warnings",
      error: err.message,
    });
  }
};



// NEW: Check and update escalation status for all queries (WITH NOTIFICATIONS)
exports.checkEscalations = async () => {
  try {
    const now = new Date();
    const twentyFourHoursAgo = new Date(now - 24 * 60 * 60 * 1000);
    const fortyEightHoursAgo = new Date(now - 48 * 60 * 60 * 1000);

    // Queries that are not resolved and older than 24 hours
    const queries24hr = await queryModel.find({
      status: { $ne: "Resolved" },
      createdAt: { $lt: twentyFourHoursAgo },
      escalationLevel: { $ne: "warning_24hr" },
    }).populate("assignedTo", "firstName lastName email");

    // Queries that are not resolved and older than 48 hours
    const queries48hr = await queryModel.find({
      status: { $ne: "Resolved" },
      createdAt: { $lt: fortyEightHoursAgo },
      escalationLevel: { $ne: "critical_48hr" },
    }).populate("user", "firstName lastName email")
      .populate("assignedTo", "firstName lastName email");

    // Update 24hr escalations and send notifications
    for (const query of queries24hr) {
      query.escalationLevel = "warning_24hr";
      query.lastEscalationNotified = now;
      await query.save();
      console.log(`⚠️ Escalation Warning: Query ${query._id} exceeded 24 hours`);
      
      if (query.assignedTo) {
        await createNotification(
          query.assignedTo._id,
          "escalation_24hr",
          "⚠️ Query Escalation Warning",
          `Query "${query.title}" has exceeded 24 hours without resolution. Please take action.`,
          query._id
        );
      }
    }

    // Update 48hr escalations and send notifications
    for (const query of queries48hr) {
      query.escalationLevel = "critical_48hr";
      query.lastEscalationNotified = now;
      await query.save();
      console.log(`🚨 Critical Escalation: Query ${query._id} exceeded 48 hours`);
      
      const admins = await userModel.find({ role: "admin" });
      
      for (const admin of admins) {
        await createNotification(
          admin._id,
          "escalation_48hr",
          "🚨 CRITICAL: Query Escalation",
          `Query "${query.title}" has exceeded 48 hours! Immediate action required.`,
          query._id
        );
      }
    }

    return { updated24hr: queries24hr.length, updated48hr: queries48hr.length };
  } catch (err) {
    console.error("Error checking escalations:", err);
    return { error: err.message };
  }
};



exports.getCriticalEscalations = async (req, res) => {
  try {
    const queries = await queryModel
      .find({
        status: { $ne: "Resolved" },
        escalationLevel: "critical_48hr",
        adminAction: "none", // ← THIS IS KEY
      })
      .populate("user", "firstName lastName email")
      .populate("assignedTo", "firstName lastName email")
      .sort({ createdAt: 1 });

    return res.status(200).json({
      success: true,
      criticalEscalations: queries,
    });
  } catch (err) {
    console.error("Get Critical Escalations Error:", err);
    return res.status(500).json({
      success: false,
      message: "Error fetching critical escalations",
      error: err.message,
    });
  }
};

exports.getQueryById = async (req, res) => {
  try {
    const { queryId } = req.params;
    const { id } = req.user;

    const query = await queryModel
      .findById(queryId)
      .populate("user", "firstName lastName email prn role")
      .populate("assignedTo", "firstName lastName email role");

    if (!query) {
      return res.status(404).json({
        success: false,
        message: "Query not found",
      });
    }

    // Check if user has permission to view this query
    const user = await userModel.findById(id);
    const isAuthor = query.user._id.toString() === id;
    const isAssignedSupervisor = query.assignedTo && query.assignedTo._id.toString() === id;
    const isAdmin = user?.role === "admin";

    if (!isAuthor && !isAssignedSupervisor && !isAdmin) {
      return res.status(403).json({
        success: false,
        message: "You don't have permission to view this query",
      });
    }

    return res.status(200).json({
      success: true,
      query: query,
    });
  } catch (err) {
    console.error("Get Query By ID Error:", err);
    return res.status(500).json({
      success: false,
      message: "Error fetching query details",
      error: err.message,
    });
  }
};


exports.reassignSupervisor = async (req, res) => {
  try {
    const { oldSupervisorId, newSupervisorId, queryIds } = req.body;
    const adminId = req.user.id;

    if (!oldSupervisorId || !newSupervisorId || !queryIds || !queryIds.length) {
      return res.status(400).json({
        success: false,
        message: "Old supervisor, new supervisor, and query IDs are required",
      });
    }

    // Get old and new supervisor details
    const oldSupervisor = await userModel.findById(oldSupervisorId);
    const newSupervisor = await userModel.findById(newSupervisorId);

    if (!oldSupervisor || !newSupervisor) {
      return res.status(404).json({
        success: false,
        message: "Supervisor not found",
      });
    }

    // Update all queries
    const updatedQueries = [];
    for (const queryId of queryIds) {
      const query = await queryModel.findById(queryId);
      if (query && query.assignedTo && query.assignedTo.toString() === oldSupervisorId) {
        query.assignedTo = newSupervisorId;
        query.adminAction = "warning";
        query.adminActionMessage = `Reassigned from ${oldSupervisor.firstName} ${oldSupervisor.lastName} to ${newSupervisor.firstName} ${newSupervisor.lastName} by Admin`;
        query.actionTakenAt = new Date();
        await query.save();
        updatedQueries.push(query);
      }
    }

    // Email to removed supervisor (Strict warning)
    const removedEmailSubject = "⚠️ URGENT: Your Supervisor Assignment Has Been Removed";
    const removedEmailBody = `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #e2e8f0; border-radius: 12px;">
        <div style="text-align: center; padding: 20px; background: linear-gradient(135deg, #dc2626, #b91c1c); border-radius: 12px; margin-bottom: 20px;">
          <h1 style="color: white; margin: 0;">⚠️ URGENT NOTICE</h1>
        </div>
        
        <p style="font-size: 16px; color: #334155;">Dear <strong>${oldSupervisor.firstName} ${oldSupervisor.lastName}</strong>,</p>
        
        <p style="font-size: 16px; color: #334155;">This is a <strong style="color: #dc2626;">STRICT WARNING</strong> regarding your performance as a supervisor.</p>
        
        <div style="background: #fef2f2; padding: 16px; border-radius: 12px; margin: 20px 0; border-left: 4px solid #dc2626;">
          <h3 style="margin: 0 0 8px 0; color: #991b1b;">REASON FOR ACTION:</h3>
          <p style="margin: 4px 0;">You have failed to resolve the following queries within the SLA timeframe:</p>
          <ul style="margin: 8px 0;">
            ${updatedQueries.map(q => `<li>${q.title} - Created on ${new Date(q.createdAt).toLocaleDateString()}</li>`).join('')}
          </ul>
          <p style="margin-top: 12px;"><strong>Total Queries Reassigned:</strong> ${updatedQueries.length}</p>
        </div>
        
        <div style="background: #fef3c7; padding: 16px; border-radius: 12px; margin: 20px 0;">
          <h3 style="margin: 0 0 8px 0; color: #92400e;">📋 ACTION REQUIRED:</h3>
          <p>You are hereby <strong>STRICTLY WARNED</strong> and your assigned queries have been transferred to another supervisor.</p>
          <p>You are required to <strong>present yourself before the Admin during working hours</strong> to explain the delay in resolution.</p>
          <p>Failure to comply may result in further disciplinary action.</p>
        </div>
        
        <hr style="margin: 20px 0; border: none; border-top: 1px solid #e2e8f0;">
        
        <p style="font-size: 12px; color: #94a3b8; text-align: center;">
          SmartCampus Admin Team<br>
          Please report to Admin office at your earliest convenience.
        </p>
      </div>
    `;

    // Email to new supervisor (Instructions)
    const newEmailSubject = "📋 New Queries Assigned to You";
    const newEmailBody = `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #e2e8f0; border-radius: 12px;">
        <div style="text-align: center; padding: 20px; background: linear-gradient(135deg, #3b82f6, #2563eb); border-radius: 12px; margin-bottom: 20px;">
          <h1 style="color: white; margin: 0;">📋 New Queries Assigned</h1>
        </div>
        
        <p style="font-size: 16px; color: #334155;">Dear <strong>${newSupervisor.firstName} ${newSupervisor.lastName}</strong>,</p>
        
        <p style="font-size: 16px; color: #334155;">The following queries have been reassigned to you by the Admin for immediate resolution.</p>
        
        <div style="background: #eff6ff; padding: 16px; border-radius: 12px; margin: 20px 0;">
          <h3 style="margin: 0 0 8px 0; color: #1e40af;">📋 ASSIGNED QUERIES:</h3>
          <ul style="margin: 8px 0;">
            ${updatedQueries.map(q => `<li><strong>${q.title}</strong> - ${q.description.substring(0, 100)}...<br>
            <span style="font-size: 12px; color: #64748b;">Priority: ${q.priority} | Created: ${new Date(q.createdAt).toLocaleDateString()}</span></li>`).join('')}
          </ul>
        </div>
        
        <div style="background: #f0fdf4; padding: 16px; border-radius: 12px; margin: 20px 0; border-left: 4px solid #22c55e;">
          <h3 style="margin: 0 0 8px 0; color: #166534;">✅ INSTRUCTIONS:</h3>
          <ol style="margin: 0; padding-left: 20px;">
            <li>Please review each query and understand the issue</li>
            <li>Contact the students if you need more information via comments</li>
            <li>Resolve the queries within the SLA timeframe (24 hours)</li>
            <li>Mark them as "Resolved" once completed</li>
          </ol>
        </div>
        
        <p style="font-size: 16px; color: #334155;">We appreciate your prompt attention to these matters.</p>
        
        <hr style="margin: 20px 0; border: none; border-top: 1px solid #e2e8f0;">
        
        <p style="font-size: 12px; color: #94a3b8; text-align: center;">
          SmartCampus Support Team<br>
          <a href="${process.env.FRONTEND_URL || "http://localhost:3000"}/supervisor-dashboard" style="color: #3b82f6;">Go to Dashboard</a>
        </p>
      </div>
    `;

    try {
      await mailSender(oldSupervisor.email, removedEmailSubject, removedEmailBody);
      await mailSender(newSupervisor.email, newEmailSubject, newEmailBody);
      console.log(`✅ Reassignment emails sent to both supervisors`);
    } catch (emailError) {
      console.error("Email sending failed:", emailError);
    }

    // Emit WebSocket event
    const io = req.app.get("io");
    if (io) {
      io.emit("supervisorReassigned", { oldSupervisorId, newSupervisorId, queryIds });
    }

    return res.status(200).json({
      success: true,
      message: `${updatedQueries.length} queries reassigned successfully`,
      reassignedCount: updatedQueries.length,
    });
  } catch (err) {
    console.error("Reassign Supervisor Error:", err);
    return res.status(500).json({
      success: false,
      message: "Error reassigning supervisor",
      error: err.message,
    });
  }
};


// Get action history queries (where admin action was taken)
exports.getActionHistory = async (req, res) => {
  try {
    const queries = await queryModel
      .find({
        adminAction: { $ne: "none" }, // Has admin action
        // Optional: only show actions taken within last 30 days
        actionTakenAt: { $exists: true, $ne: null }
      })
      .populate("user", "firstName lastName email")
      .populate("assignedTo", "firstName lastName email")
      .sort({ actionTakenAt: -1 });

    return res.status(200).json({
      success: true,
      actionHistory: queries,
    });
  } catch (err) {
    console.error("Get Action History Error:", err);
    return res.status(500).json({
      success: false,
      message: "Error fetching action history",
      error: err.message,
    });
  }
};

