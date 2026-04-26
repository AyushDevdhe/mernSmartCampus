const userModel = require("../models/userModel");
const queryModel = require("../models/queryModel");
const { createNotification } = require("./notificationController");

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

    const query = await queryModel.findById(queryId);

    if (!query) {
      return res.status(404).json({
        success: false,
        message: "Query not found",
      });
    }

    query.status = status;
    await query.save();

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

    await query.save();

    // Emit WebSocket event for real-time update
    const io = req.app.get("io");
    if (io) {
      io.emit("adminActionTaken", query);
    }

    return res.status(200).json({
      success: true,
      message: `Admin action '${action}' taken successfully`,
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
    const queries = await queryModel
      .find({
        status: { $ne: "Resolved" },
        escalationLevel: "warning_24hr",
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
    }).populate("assignedTo", "user", "firstName lastName email");

    // Update 24hr escalations and send notifications
    for (const query of queries24hr) {
      query.escalationLevel = "warning_24hr";
      query.lastEscalationNotified = now;
      await query.save();
      console.log(`⚠️ Escalation Warning: Query ${query._id} exceeded 24 hours`);
      
      // Send notification to assigned supervisor
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
      
      // Find admin users
      const admins = await userModel.find({ role: "admin" });
      
      // Send notification to all admins
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

// NEW: Get escalated queries for supervisor (24hr warnings)
exports.getEscalatedWarnings = async (req, res) => {
  try {
    const queries = await queryModel
      .find({
        status: { $ne: "Resolved" },
        escalationLevel: "warning_24hr",
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

// NEW: Get critical escalations for admin (48hr+)
exports.getCriticalEscalations = async (req, res) => {
  try {
    const queries = await queryModel
      .find({
        status: { $ne: "Resolved" },
        escalationLevel: "critical_48hr",
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

// Get single query by ID with all details
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