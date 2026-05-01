const userModel = require("../models/userModel");
const queryModel = require("../models/queryModel");
const { createNotification } = require("./notificationController");
const mailSender = require("../utils/mailSender");

const { analyzeWithJava } = require("../services/javaAnalyzerService");
const { detectSpam } = require("../services/spamDetector");
const { validateQueryRelevance } = require("../services/aiValidator");

// ========== SPAM EMAIL TEMPLATES ==========
const generateWarningEmail = (user, spamCheck) => `
<div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #e2e8f0; border-radius: 12px;">
  <div style="text-align: center; padding: 20px; background: linear-gradient(135deg, #eab308, #ca8a04); border-radius: 12px; margin-bottom: 20px;">
    <h1 style="color: white; margin: 0;">⚠️ STRICT WARNING</h1>
  </div>
  <p style="font-size: 16px; color: #334155;">Dear <strong>${user.firstName} ${user.lastName}</strong>,</p>
  <p style="font-size: 16px; color: #334155;">Your query has been <strong>BLOCKED</strong> for violating our content policy.</p>
  <div style="background: #fef3c7; padding: 16px; border-radius: 12px; margin: 20px 0; border-left: 4px solid #eab308;">
    <h3 style="margin: 0 0 8px 0; color: #92400e;">Violation Details:</h3>
    <p style="margin: 4px 0;"><strong>Query:</strong> ${spamCheck.reasons[0]}</p>
    <p style="margin: 4px 0;"><strong>Spam Score:</strong> ${spamCheck.score}%</p>
  </div>
  <div style="background: #fee2e2; padding: 16px; border-radius: 12px; margin: 20px 0;">
    <h3 style="margin: 0 0 8px 0; color: #991b1b;">⚠️ FINAL WARNING</h3>
    <p>This is your <strong>FIRST OFFENSE</strong>. <strong style="color: #dc2626;">ONE MORE VIOLATION</strong> will result in:</p>
    <ul>
      <li>Immediate account BLOCK</li>
      <li>Report to administration</li>
      <li>Potential disciplinary action</li>
    </ul>
  </div>
  <hr style="margin: 20px 0; border: none; border-top: 1px solid #e2e8f0;">
  <p style="font-size: 12px; color: #94a3b8; text-align: center;">SmartCampus Disciplinary Committee</p>
</div>
`;

const generateBlockedEmail = (user, spamCheck) => `
<div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #e2e8f0; border-radius: 12px;">
  <div style="text-align: center; padding: 20px; background: linear-gradient(135deg, #dc2626, #991b1b); border-radius: 12px; margin-bottom: 20px;">
    <h1 style="color: white; margin: 0;">🚨 ACCOUNT BLOCKED</h1>
  </div>
  <p style="font-size: 16px; color: #334155;">Dear <strong>${user.firstName} ${user.lastName}</strong>,</p>
  <p style="font-size: 16px; color: #334155;">Your account has been <strong style="color: #dc2626;">PERMANENTLY BLOCKED</strong> due to repeated policy violations.</p>
  <div style="background: #fef2f2; padding: 16px; border-radius: 12px; margin: 20px 0;">
    <h3 style="margin: 0 0 8px 0; color: #991b1b;">Violation History:</h3>
    <p><strong>Total Offenses:</strong> ${user.offenseCount}</p>
    <p><strong>Last Violation:</strong> ${spamCheck.reasons[0]}</p>
  </div>
  <div style="background: #fef3c7; padding: 16px; border-radius: 12px; margin: 20px 0; border-left: 4px solid #eab308;">
    <h3 style="margin: 0 0 8px 0; color: #92400e;">📋 ACTION REQUIRED:</h3>
    <p>You are hereby <strong>DIRECTED</strong> to:</p>
    <ol>
      <li>Present yourself before the <strong>Admin during working hours</strong></li>
      <li>Explain the violations in writing</li>
      <li>Submit a formal undertaking</li>
    </ol>
    <p style="margin-top: 12px;"><strong>Failure to comply will result in immediate disciplinary action and possible suspension from campus facilities.</strong></p>
  </div>
  <p style="font-size: 14px; color: #334155; margin-top: 16px;">
    <strong>Contact:</strong> Admin Office - Room 101, Academic Block
  </p>
  <hr style="margin: 20px 0; border: none; border-top: 1px solid #e2e8f0;">
  <p style="font-size: 12px; color: #94a3b8; text-align: center;">
    SmartCampus Disciplinary Committee<br>
    This is an automated system-generated notice.
  </p>
</div>
`;

// ========== GET USER QUERIES ==========
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

// ========== GET ALL QUERIES ==========
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

// ========== ASSIGN QUERY ==========
exports.assignQuery = async (req, res) => {
  try {
    const { id } = req.user;
    const { queryId } = req.params;

    const query = await queryModel.findById(queryId);
    if (!query) {
      return res
        .status(404)
        .json({ success: false, message: "Query not found" });
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

    const io = req.app.get("io");
    if (io) io.emit("queryAssigned", query);

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

// ========== UPDATE STATUS ==========
exports.updateStatus = async (req, res) => {
  try {
    const { queryId } = req.params;
    const { status } = req.body;

    if (!status || !["Pending", "In Progress", "Resolved"].includes(status)) {
      return res
        .status(400)
        .json({ success: false, message: "Valid status is required" });
    }

    const query = await queryModel
      .findById(queryId)
      .populate("user", "firstName lastName email")
      .populate("assignedTo", "firstName lastName email");

    if (!query) {
      return res
        .status(404)
        .json({ success: false, message: "Query not found" });
    }

    const oldStatus = query.status;
    query.status = status;
    await query.save();

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

    const io = req.app.get("io");
    if (io) io.emit("queryUpdated", query);

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

// ========== UPDATE QUERY ==========
exports.updateQuery = async (req, res) => {
  try {
    const { id } = req.user;
    const { queryId } = req.params;
    const { title, description, priority } = req.body;
    const imageUrl = req.file ? `/uploads/${req.file.filename}` : undefined;

    if (!title || !description || !priority) {
      return res.status(400).json({
        success: false,
        message: "title, description and priority are required",
      });
    }

    const query = await queryModel.findById(queryId);
    if (!query) {
      return res
        .status(404)
        .json({ success: false, message: "Query not found" });
    }

    if (query.user.toString() !== id) {
      return res.status(403).json({
        success: false,
        message: "You are not authorized to update this query",
      });
    }

    const updateData = { title, description, priority };
    if (imageUrl) updateData.imageUrl = imageUrl;

    const updatedQuery = await queryModel.findByIdAndUpdate(
      queryId,
      updateData,
      {
        new: true,
        runValidators: true,
      },
    );

    const io = req.app.get("io");
    if (io) io.emit("queryUpdated", updatedQuery);

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

// ========== DELETE QUERY ==========
exports.deleteQuery = async (req, res) => {
  try {
    const { id } = req.user;
    const { queryId } = req.params;

    const query = await queryModel.findById(queryId);
    if (!query) {
      return res
        .status(404)
        .json({ success: false, message: "Query not found" });
    }

    if (query.user.toString() !== id) {
      return res.status(403).json({
        success: false,
        message: "You are not authorized to delete this query",
      });
    }

    await queryModel.findByIdAndDelete(queryId);

    const io = req.app.get("io");
    if (io) io.emit("queryDeleted", queryId);

    return res
      .status(200)
      .json({ success: true, message: "Query deleted successfully" });
  } catch (err) {
    console.error("Delete Query Error:", err);
    return res.status(500).json({
      success: false,
      message: "Internal server error in delete query controller",
      error: err.message,
    });
  }
};

// ========== TAKE ADMIN ACTION ==========
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
      return res
        .status(404)
        .json({ success: false, message: "Query not found" });
    }

    query.adminAction = action.toLowerCase();
    query.adminActionMessage =
      message || `Admin issued a ${action} for delayed resolution`;
    query.actionTakenAt = new Date();
    query.escalationLevel = "none";
    query.lastEscalationNotified = null;
    await query.save();

    const io = req.app.get("io");
    if (io) io.emit("adminActionTaken", query);

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

// ========== GET ESCALATED WARNINGS (24hr) ==========
exports.getEscalatedWarnings = async (req, res) => {
  try {
    const { id } = req.user;

    const queries = await queryModel
      .find({
        status: { $ne: "Resolved" },
        escalationLevel: "warning_24hr",
        assignedTo: id,
      })
      .populate("user", "firstName lastName email")
      .populate("assignedTo", "firstName lastName email")
      .sort({ createdAt: 1 });

    return res.status(200).json({ success: true, escalatedWarnings: queries });
  } catch (err) {
    console.error("Get Escalated Warnings Error:", err);
    return res.status(500).json({
      success: false,
      message: "Error fetching escalated warnings",
      error: err.message,
    });
  }
};

// ========== CHECK AND UPDATE ESCALATIONS (CRON JOB) ==========
exports.checkEscalations = async () => {
  try {
    const now = new Date();
    const twentyFourHoursAgo = new Date(now - 24 * 60 * 60 * 1000);
    const fortyEightHoursAgo = new Date(now - 48 * 60 * 60 * 1000);

    const queries24hr = await queryModel
      .find({
        status: { $ne: "Resolved" },
        createdAt: { $lt: twentyFourHoursAgo },
        escalationLevel: { $ne: "warning_24hr" },
      })
      .populate("assignedTo", "firstName lastName email");

    const queries48hr = await queryModel
      .find({
        status: { $ne: "Resolved" },
        createdAt: { $lt: fortyEightHoursAgo },
        escalationLevel: { $ne: "critical_48hr" },
      })
      .populate("user", "firstName lastName email")
      .populate("assignedTo", "firstName lastName email");

    for (const query of queries24hr) {
      query.escalationLevel = "warning_24hr";
      query.lastEscalationNotified = now;
      await query.save();
      console.log(
        `⚠️ Escalation Warning: Query ${query._id} exceeded 24 hours`,
      );

      if (query.assignedTo) {
        await createNotification(
          query.assignedTo._id,
          "escalation_24hr",
          "⚠️ Query Escalation Warning",
          `Query "${query.title}" has exceeded 24 hours without resolution. Please take action.`,
          query._id,
        );
      }
    }

    for (const query of queries48hr) {
      query.escalationLevel = "critical_48hr";
      query.lastEscalationNotified = now;
      await query.save();
      console.log(
        `🚨 Critical Escalation: Query ${query._id} exceeded 48 hours`,
      );

      const admins = await userModel.find({ role: "admin" });
      for (const admin of admins) {
        await createNotification(
          admin._id,
          "escalation_48hr",
          "🚨 CRITICAL: Query Escalation",
          `Query "${query.title}" has exceeded 48 hours! Immediate action required.`,
          query._id,
        );
      }
    }

    return { updated24hr: queries24hr.length, updated48hr: queries48hr.length };
  } catch (err) {
    console.error("Error checking escalations:", err);
    return { error: err.message };
  }
};

// ========== GET CRITICAL ESCALATIONS ==========
exports.getCriticalEscalations = async (req, res) => {
  try {
    const queries = await queryModel
      .find({
        status: { $ne: "Resolved" },
        escalationLevel: "critical_48hr",
        adminAction: "none",
      })
      .populate("user", "firstName lastName email")
      .populate("assignedTo", "firstName lastName email")
      .sort({ createdAt: 1 });

    return res
      .status(200)
      .json({ success: true, criticalEscalations: queries });
  } catch (err) {
    console.error("Get Critical Escalations Error:", err);
    return res.status(500).json({
      success: false,
      message: "Error fetching critical escalations",
      error: err.message,
    });
  }
};

// ========== GET QUERY BY ID ==========
// FIX: Supervisors can now view any query, not just ones assigned to them
exports.getQueryById = async (req, res) => {
  try {
    const { queryId } = req.params;
    const { id } = req.user;

    const query = await queryModel
      .findById(queryId)
      .populate("user", "firstName lastName email prn role")
      .populate("assignedTo", "firstName lastName email role");

    if (!query) {
      return res
        .status(404)
        .json({ success: false, message: "Query not found" });
    }

    const user = await userModel.findById(id);
    const isAuthor = query.user._id.toString() === id;
    const isSupervisor = user?.role === "supervisor";
    const isAdmin = user?.role === "admin";

    // FIX: Supervisors can view ALL queries (they need to see details to assign/resolve)
    // Students can only view their own queries
    if (!isAuthor && !isSupervisor && !isAdmin) {
      return res.status(403).json({
        success: false,
        message: "You don't have permission to view this query",
      });
    }

    return res.status(200).json({ success: true, query: query });
  } catch (err) {
    console.error("Get Query By ID Error:", err);
    return res.status(500).json({
      success: false,
      message: "Error fetching query details",
      error: err.message,
    });
  }
};

// ========== REASSIGN SUPERVISOR ==========
exports.reassignSupervisor = async (req, res) => {
  try {
    const { oldSupervisorId, newSupervisorId, queryIds } = req.body;

    if (!oldSupervisorId || !newSupervisorId || !queryIds || !queryIds.length) {
      return res.status(400).json({
        success: false,
        message: "Old supervisor, new supervisor, and query IDs are required",
      });
    }

    const oldSupervisor = await userModel.findById(oldSupervisorId);
    const newSupervisor = await userModel.findById(newSupervisorId);

    if (!oldSupervisor || !newSupervisor) {
      return res
        .status(404)
        .json({ success: false, message: "Supervisor not found" });
    }

    const updatedQueries = [];
    for (const queryId of queryIds) {
      const query = await queryModel.findById(queryId);
      if (
        query &&
        query.assignedTo &&
        query.assignedTo.toString() === oldSupervisorId
      ) {
        query.assignedTo = newSupervisorId;
        query.adminAction = "warning";
        query.adminActionMessage = `Reassigned from ${oldSupervisor.firstName} ${oldSupervisor.lastName} to ${newSupervisor.firstName} ${newSupervisor.lastName} by Admin`;
        query.actionTakenAt = new Date();
        await query.save();
        updatedQueries.push(query);
      }
    }

    const removedEmailSubject =
      "⚠️ URGENT: Your Supervisor Assignment Has Been Removed";
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
            ${updatedQueries.map((q) => `<li>${q.title} - Created on ${new Date(q.createdAt).toLocaleDateString()}</li>`).join("")}
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
            ${updatedQueries
              .map(
                (
                  q,
                ) => `<li><strong>${q.title}</strong> - ${q.description.substring(0, 100)}...<br>
            <span style="font-size: 12px; color: #64748b;">Priority: ${q.priority} | Created: ${new Date(q.createdAt).toLocaleDateString()}</span></li>`,
              )
              .join("")}
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
      await mailSender(
        oldSupervisor.email,
        removedEmailSubject,
        removedEmailBody,
      );
      await mailSender(newSupervisor.email, newEmailSubject, newEmailBody);
      console.log(`✅ Reassignment emails sent to both supervisors`);
    } catch (emailError) {
      console.error("Email sending failed:", emailError);
    }

    const io = req.app.get("io");
    if (io)
      io.emit("supervisorReassigned", {
        oldSupervisorId,
        newSupervisorId,
        queryIds,
      });

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

// ========== GET ACTION HISTORY ==========
exports.getActionHistory = async (req, res) => {
  try {
    const queries = await queryModel
      .find({
        adminAction: { $ne: "none" },
        actionTakenAt: { $exists: true, $ne: null },
      })
      .populate("user", "firstName lastName email")
      .populate("assignedTo", "firstName lastName email")
      .sort({ actionTakenAt: -1 });

    return res.status(200).json({ success: true, actionHistory: queries });
  } catch (err) {
    console.error("Get Action History Error:", err);
    return res.status(500).json({
      success: false,
      message: "Error fetching action history",
      error: err.message,
    });
  }
};

// ========== CREATE QUERY ==========
exports.createQuery = async (req, res) => {
  try {
    const { id } = req.user;
    const { title, description, priority } = req.body;
    const imageUrl = req.file ? `/uploads/${req.file.filename}` : null;

    if (!title || !description || !priority || !id) {
      return res
        .status(400)
        .json({ success: false, message: "all input fields required" });
    }

    // ===== STEP 1: SPAM DETECTION =====
    const spamCheck = await detectSpam(title, description, id);
    console.log("🔍 Spam Detection Result:", spamCheck);

    if (spamCheck.isSpam) {
      const user = await userModel.findById(id);
      const offenseReason = spamCheck.reasons.join(", ");

      if (!user.offenseHistory) user.offenseHistory = [];
      user.offenseHistory.push({
        reason: offenseReason,
        queryTitle: title,
        queryId: null,
        createdAt: new Date(),
      });
      user.offenseCount = (user.offenseCount || 0) + 1;
      user.lastOffenseAt = new Date();

      let isBlockedNow = false;
      if (user.offenseCount >= 2) {
        user.isBlocked = true;
        user.blockedAt = new Date();
        user.blockReason = "Multiple spam/inappropriate query submissions";
        isBlockedNow = true;
      }
      await user.save();

      const spamQuery = await queryModel.create({
        user: id,
        title,
        description,
        priority,
        status: "Resolved",
        assignedTo: null,
        imageUrl,
        isSpam: "spam",
        spamScore: spamCheck.score,
        spamReason: spamCheck.reasons.join(", "),
        spamMarkedBy: null,
        spamMarkedAt: new Date(),
        autoSpam: true,
      });

      if (user.offenseHistory && user.offenseHistory.length > 0) {
        user.offenseHistory[user.offenseHistory.length - 1].queryId =
          spamQuery._id;
        await user.save();
      }

      if (isBlockedNow) {
        await mailSender(
          user.email,
          "🚨 URGENT: Your Account Has Been Blocked",
          generateBlockedEmail(user, spamCheck),
        );
        const admins = await userModel.find({ role: "admin" });
        for (const admin of admins) {
          await createNotification(
            admin._id,
            "student_blocked",
            "🚫 Student Account Blocked",
            `${user.firstName} ${user.lastName} has been blocked due to repeated policy violations.`,
            spamQuery._id,
          );
        }
      } else {
        await mailSender(
          user.email,
          "⚠️ STRICT WARNING: Policy Violation",
          generateWarningEmail(user, spamCheck),
        );
      }

      return res.status(200).json({
        success: false,
        message: isBlockedNow
          ? "🚫 Your account has been BLOCKED due to repeated policy violations. Contact Admin."
          : "⚠️ Your query was blocked. This is your FIRST WARNING. ONE more violation will result in account BLOCK.",
        spamDetails: {
          score: spamCheck.score,
          reasons: spamCheck.reasons,
          autoBlocked: true,
          offenseCount: user.offenseCount,
          isBlocked: isBlockedNow,
        },
      });
    }

    // ===== STEP 2: AI RELEVANCE VALIDATION (GEMINI) =====
    const aiValidation = await validateQueryRelevance(title, description);
    console.log("🤖 Gemini AI Validation Result:", aiValidation);

    if (!aiValidation.isGenuine || aiValidation.relevanceScore < 40) {
      const user = await userModel.findById(id);
      const offenseReason = `AI Blocked: ${aiValidation.reason} (Score: ${aiValidation.relevanceScore})`;

      if (!user.offenseHistory) user.offenseHistory = [];
      user.offenseHistory.push({
        reason: offenseReason,
        queryTitle: title,
        queryId: null,
        createdAt: new Date(),
      });
      user.offenseCount = (user.offenseCount || 0) + 1;
      user.lastOffenseAt = new Date();

      let isBlockedNow = false;
      if (user.offenseCount >= 2) {
        user.isBlocked = true;
        user.blockedAt = new Date();
        user.blockReason = "Multiple fake/irrelevant query submissions";
        isBlockedNow = true;
      }
      await user.save();

      const spamQuery = await queryModel.create({
        user: id,
        title,
        description,
        priority,
        status: "Resolved",
        assignedTo: null,
        imageUrl,
        isSpam: "spam",
        spamScore: aiValidation.relevanceScore,
        spamReason: offenseReason,
        spamMarkedBy: null,
        spamMarkedAt: new Date(),
        autoSpam: true,
      });

      if (user.offenseHistory && user.offenseHistory.length > 0) {
        user.offenseHistory[user.offenseHistory.length - 1].queryId =
          spamQuery._id;
        await user.save();
      }

      if (isBlockedNow) {
        await mailSender(
          user.email,
          "🚨 URGENT: Your Account Has Been Blocked",
          generateBlockedEmail(user, {
            reasons: [aiValidation.reason],
            score: aiValidation.relevanceScore,
          }),
        );
      } else {
        await mailSender(
          user.email,
          "⚠️ STRICT WARNING: Fake Query Detected",
          generateWarningEmail(user, {
            reasons: [aiValidation.reason],
            score: aiValidation.relevanceScore,
          }),
        );
      }

      return res.status(403).json({
        success: false,
        message: isBlockedNow
          ? "🚫 Your account has been BLOCKED due to repeated fake submissions. Contact Admin."
          : "❌ Your query was rejected as it doesn't appear to be a genuine campus issue. This is your FIRST WARNING.",
        aiAnalysis: {
          reason: aiValidation.reason,
          score: aiValidation.relevanceScore,
          confidence: aiValidation.confidence,
          category: aiValidation.category,
        },
        offenseCount: user.offenseCount,
        isBlocked: isBlockedNow,
      });
    }

    // ===== STEP 3: FETCH USER =====
    const user = await userModel.findById(id);
    if (!user) {
      return res
        .status(404)
        .json({
          success: false,
          message: "no such logged in user found in the db",
        });
    }

    // ===== STEP 4: JAVA ANALYSIS =====
    // FIX: Run Java analysis and build javaAnalysis object BEFORE creating the query
    // so it gets saved in a single queryModel.create() call — no race condition
    let javaAnalysisData = null;
    try {
      console.log(
        "🤖 Calling Java analyzer for:",
        description.substring(0, 50),
      );
      const javaResult = await analyzeWithJava(description);
      console.log("✅ Java Analysis Result:", javaResult);

      if (javaResult && javaResult.priority && !javaResult.fallback) {
        javaAnalysisData = {
          priority: javaResult.priority,
          score: javaResult.score,
          matches: javaResult.matches || [],
          analyzedAt: new Date(),
        };
        console.log("✅ Java analysis ready to save:", javaAnalysisData);
      } else {
        console.log("⚠️ Java returned fallback result — not saving analysis");
      }
    } catch (err) {
      console.log("⚠️ Java analyzer not available:", err.message);
    }

    // ===== STEP 5: CREATE QUERY (with javaAnalysis included from start) =====
    const newQuery = await queryModel.create({
      user: id,
      title,
      description,
      priority,
      status: "Pending",
      assignedTo: null,
      imageUrl,
      isSpam: spamCheck.isSuspicious ? "suspicious" : "clean",
      spamScore: spamCheck.score,
      // FIX: Include javaAnalysis directly in create — no separate save needed
      javaAnalysis: javaAnalysisData,
    });

    console.log("✅ Query created with javaAnalysis:", newQuery.javaAnalysis);

    const io = req.app.get("io");
    if (io) io.emit("queryCreated", newQuery);

    const response = {
      success: true,
      message: spamCheck.isSuspicious
        ? "⚠️ Query submitted but flagged as suspicious. It will be reviewed."
        : "query created successfully",
      query: newQuery,
      userEmail: user.email,
    };

    if (spamCheck.isSuspicious) {
      response.spamWarning = {
        message:
          "Your query has been flagged for review due to suspicious content.",
        score: spamCheck.score,
        reasons: spamCheck.reasons,
      };
    }

    if (javaAnalysisData) {
      response.javaAnalysis = javaAnalysisData;
      if (javaAnalysisData.priority !== priority) {
        response.warning = `🤖 Java AI suggests "${javaAnalysisData.priority}" priority (Score: ${javaAnalysisData.score})`;
      }
    }

    return res.status(200).json(response);
  } catch (err) {
    console.error("Create Query Error:", err);
    return res.status(500).json({
      success: false,
      message: "internal server error in create query controller",
      error: err.message,
    });
  }
};

// ========== MARK AS SPAM ==========
exports.markAsSpam = async (req, res) => {
  try {
    const { queryId } = req.params;
    const { id } = req.user;
    const { reason } = req.body;

    if (!reason || reason.trim() === "") {
      return res.status(400).json({
        success: false,
        message: "Reason is required to mark query as spam",
      });
    }

    const query = await queryModel
      .findById(queryId)
      .populate("user", "firstName lastName email");

    if (!query) {
      return res
        .status(404)
        .json({ success: false, message: "Query not found" });
    }

    query.isSpam = "spam";
    query.spamReason = reason;
    query.spamMarkedBy = id;
    query.spamMarkedAt = new Date();
    query.status = "Resolved";
    await query.save();

    await createNotification(
      query.user._id,
      "query_spam",
      "⚠️ Your Query Was Marked as Spam",
      `Your query "${query.title}" has been marked as spam. Reason: ${reason}. Please avoid submitting irrelevant queries.`,
      query._id,
    );

    try {
      await mailSender(
        query.user.email,
        "⚠️ Your Query Was Marked as Spam",
        `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #e2e8f0; border-radius: 12px;">
          <div style="text-align: center; padding: 20px; background: linear-gradient(135deg, #dc2626, #b91c1c); border-radius: 12px; margin-bottom: 20px;">
            <h1 style="color: white; margin: 0;">⚠️ Query Marked as Spam</h1>
          </div>
          <p style="font-size: 16px; color: #334155;">Dear <strong>${query.user.firstName} ${query.user.lastName}</strong>,</p>
          <p style="font-size: 16px; color: #334155;">Your query has been reviewed and marked as spam.</p>
          <div style="background: #fef2f2; padding: 16px; border-radius: 12px; margin: 20px 0; border-left: 4px solid #dc2626;">
            <h3 style="margin: 0 0 8px 0; color: #991b1b;">Query Details:</h3>
            <p style="margin: 4px 0;"><strong>Title:</strong> ${query.title}</p>
            <p style="margin: 4px 0;"><strong>Reason:</strong> ${reason}</p>
          </div>
          <p style="font-size: 16px; color: #334155;">Please ensure your future queries are genuine and relevant to campus issues.</p>
          <hr style="margin: 20px 0; border: none; border-top: 1px solid #e2e8f0;">
          <p style="font-size: 12px; color: #94a3b8; text-align: center;">SmartCampus Support Team</p>
        </div>
        `,
      );
      console.log(
        `✅ Spam notification email sent to student: ${query.user.email}`,
      );
    } catch (emailError) {
      console.error("Email sending failed:", emailError);
    }

    const io = req.app.get("io");
    if (io) io.emit("queryMarkedAsSpam", query);

    return res.status(200).json({
      success: true,
      message: "Query marked as spam successfully",
      query: query,
    });
  } catch (err) {
    console.error("Mark as Spam Error:", err);
    return res.status(500).json({
      success: false,
      message: "Error marking query as spam",
      error: err.message,
    });
  }
};
