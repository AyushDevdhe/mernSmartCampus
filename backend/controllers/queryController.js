const userModel = require("../models/userModel");
const queryModel = require("../models/queryModel");
const { createNotification } = require("./notificationController");
const mailSender = require("../utils/mailSender");

const { analyzeWithJava } = require("../services/javaAnalyzerService");
const { detectSpam } = require("../services/spamDetector");
const { validateQueryRelevance } = require("../services/aiValidator");

// ============================================================
// EMAIL TEMPLATES
// ============================================================

// Tier 2 — Account blocked after 8 spam offenses
const generateTier2BlockedEmail = (user) => `
<div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #e2e8f0; border-radius: 12px;">
  <div style="text-align: center; padding: 20px; background: linear-gradient(135deg, #1e293b, #0f172a); border-radius: 12px; margin-bottom: 20px;">
    <h1 style="color: white; margin: 0;">🔒 ACCOUNT SUSPENDED</h1>
  </div>
  <p style="font-size: 16px; color: #334155;">Dear <strong>${user.firstName} ${user.lastName}</strong>,</p>
  <p style="font-size: 16px; color: #334155;">
    This is to formally inform you that your SmartCampus account has been <strong>suspended</strong> due to repeated submission of non-genuine, irrelevant, or spam queries.
  </p>
  <div style="background: #f1f5f9; padding: 16px; border-radius: 12px; margin: 20px 0; border-left: 4px solid #334155;">
    <h3 style="margin: 0 0 8px 0; color: #1e293b;">Violation Summary:</h3>
    <p style="margin: 4px 0;"><strong>Total Spam Offenses:</strong> ${user.spamOffenseCount}</p>
    <p style="margin: 4px 0;"><strong>Suspended On:</strong> ${new Date().toLocaleString()}</p>
    <p style="margin: 4px 0;"><strong>Reason:</strong> Repeated submission of spam/irrelevant queries exceeding the allowed threshold.</p>
  </div>
  <div style="background: #fef3c7; padding: 16px; border-radius: 12px; margin: 20px 0; border-left: 4px solid #d97706;">
    <h3 style="margin: 0 0 8px 0; color: #92400e;">📋 NEXT STEPS — MANDATORY:</h3>
    <ol style="margin: 0; padding-left: 20px; color: #334155;">
      <li>Report to the <strong>Admin Office (Room 101, Academic Block)</strong> in person during working hours.</li>
      <li>Submit a written explanation for your repeated violations.</li>
      <li>Account reinstatement is subject to Admin approval only.</li>
    </ol>
    <p style="margin-top: 12px; color: #334155;"><strong>Failure to report within 3 working days may lead to further disciplinary action.</strong></p>
  </div>
  <hr style="margin: 20px 0; border: none; border-top: 1px solid #e2e8f0;">
  <p style="font-size: 12px; color: #94a3b8; text-align: center;">
    SmartCampus Administration<br>This is a system-generated notice. Do not reply to this email.
  </p>
</div>
`;

// Tier 3 — Warning email (first offensive offense)
const generateTier3WarningEmail = (user, reason) => `
<div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #fee2e2; border-radius: 12px;">
  <div style="text-align: center; padding: 20px; background: linear-gradient(135deg, #dc2626, #7f1d1d); border-radius: 12px; margin-bottom: 20px;">
    <h1 style="color: white; margin: 0;">🚨 FORMAL WARNING — ZERO TOLERANCE VIOLATION</h1>
  </div>
  <p style="font-size: 16px; color: #334155;">Dear <strong>${user.firstName} ${user.lastName}</strong>,</p>
  <p style="font-size: 16px; color: #334155;">
    It has come to the attention of the SmartCampus Disciplinary Committee that you have submitted content that is <strong>explicitly offensive, sexually inappropriate, or in gross violation</strong> of the institution's code of conduct.
  </p>
  <div style="background: #fef2f2; padding: 16px; border-radius: 12px; margin: 20px 0; border-left: 4px solid #dc2626;">
    <h3 style="margin: 0 0 8px 0; color: #991b1b;">Nature of Violation:</h3>
    <p style="margin: 4px 0;">${reason}</p>
    <p style="margin: 4px 0;"><strong>Offense Count (Offensive Category):</strong> ${user.offensiveOffenseCount} of 2</p>
    <p style="margin: 4px 0;"><strong>Date & Time:</strong> ${new Date().toLocaleString()}</p>
  </div>
  <div style="background: #7f1d1d; padding: 16px; border-radius: 12px; margin: 20px 0;">
    <h3 style="margin: 0 0 8px 0; color: #fca5a5;">⚠️ THIS IS YOUR FIRST AND ONLY WARNING</h3>
    <p style="color: #fecaca;">Under the institution's <strong>Zero Tolerance Policy</strong>, any further submission of offensive, sexual, racist, or abusive content will result in:</p>
    <ul style="color: #fecaca; margin: 8px 0;">
      <li><strong>Immediate and permanent account suspension</strong></li>
      <li><strong>Formal complaint filed with the Dean's office</strong></li>
      <li><strong>Disciplinary hearing before the Student Conduct Committee</strong></li>
      <li><strong>Potential suspension from campus facilities and academic programs</strong></li>
    </ul>
  </div>
  <div style="background: #fef3c7; padding: 16px; border-radius: 12px; margin: 20px 0; border-left: 4px solid #d97706;">
    <h3 style="margin: 0 0 8px 0; color: #92400e;">📋 IMMEDIATE ACTION REQUIRED:</h3>
    <p style="color: #334155;">You are hereby directed to report to the <strong>Admin Office (Room 101, Academic Block)</strong> within <strong>24 hours</strong> to acknowledge this warning in writing.</p>
    <p style="margin-top: 8px; color: #334155;"><strong>Failure to comply will be treated as a second offense and will trigger immediate suspension.</strong></p>
  </div>
  <hr style="margin: 20px 0; border: none; border-top: 1px solid #e2e8f0;">
  <p style="font-size: 12px; color: #94a3b8; text-align: center;">
    SmartCampus Disciplinary Committee<br>This notice has been officially recorded in your student file.
  </p>
</div>
`;

// Tier 3 — Account permanently suspended (2nd offensive offense)
const generateTier3BlockedEmail = (user, reason) => `
<div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #fca5a5; border-radius: 12px;">
  <div style="text-align: center; padding: 20px; background: linear-gradient(135deg, #7f1d1d, #450a0a); border-radius: 12px; margin-bottom: 20px;">
    <h1 style="color: #fca5a5; margin: 0;">🔴 ACCOUNT PERMANENTLY SUSPENDED</h1>
    <p style="color: #fecaca; margin: 8px 0 0 0; font-size: 14px;">DISCIPLINARY ACTION — OFFICIAL NOTICE</p>
  </div>
  <p style="font-size: 16px; color: #334155;">Dear <strong>${user.firstName} ${user.lastName}</strong>,</p>
  <p style="font-size: 16px; color: #991b1b;">
    <strong>Your SmartCampus account has been PERMANENTLY SUSPENDED</strong> following repeated and deliberate submission of explicitly offensive, sexual, racist, or abusive content — a gross violation of the institution's code of conduct.
  </p>
  <div style="background: #fef2f2; padding: 16px; border-radius: 12px; margin: 20px 0; border-left: 4px solid #dc2626;">
    <h3 style="margin: 0 0 8px 0; color: #991b1b;">Official Violation Record:</h3>
    <p style="margin: 4px 0;"><strong>Total Offensive Offenses:</strong> ${user.offensiveOffenseCount}</p>
    <p style="margin: 4px 0;"><strong>Last Violation:</strong> ${reason}</p>
    <p style="margin: 4px 0;"><strong>Suspended On:</strong> ${new Date().toLocaleString()}</p>
  </div>
  <div style="background: #450a0a; padding: 16px; border-radius: 12px; margin: 20px 0;">
    <h3 style="margin: 0 0 8px 0; color: #fca5a5;">ACTIONS BEING INITIATED:</h3>
    <ul style="color: #fecaca; margin: 8px 0;">
      <li>Formal complaint filed with the <strong>Dean of Student Affairs</strong></li>
      <li>Case referred to the <strong>Student Conduct Committee</strong></li>
      <li>A <strong>disciplinary hearing</strong> will be scheduled within 5 working days</li>
      <li>Access to all campus digital systems has been revoked</li>
    </ul>
  </div>
  <div style="background: #fef3c7; padding: 16px; border-radius: 12px; margin: 20px 0; border-left: 4px solid #d97706;">
    <h3 style="margin: 0 0 8px 0; color: #92400e;">📋 MANDATORY APPEARANCE:</h3>
    <p style="color: #334155;">You are <strong>legally required</strong> to present yourself before the:</p>
    <p style="color: #334155; margin: 8px 0;"><strong>SmartCampus Disciplinary Committee<br>Admin Office — Room 101, Academic Block<br>Within 24 hours of receiving this notice</strong></p>
    <p style="margin-top: 12px; color: #991b1b;"><strong>Non-appearance will result in escalation to the academic council and may impact your enrollment status.</strong></p>
  </div>
  <hr style="margin: 20px 0; border: none; border-top: 1px solid #e2e8f0;">
  <p style="font-size: 12px; color: #94a3b8; text-align: center;">
    SmartCampus Disciplinary Committee<br>
    This is an official notice permanently recorded in your student file.<br>
    Do not reply — contact Admin Office directly.
  </p>
</div>
`;

// ============================================================
// GET USER QUERIES
// ============================================================
exports.getUserQueries = async (req, res) => {
  try {
    const { id } = req.user;
    if (!id)
      return res
        .status(400)
        .json({
          success: false,
          message: "no user id fetched from the middleware",
        });
    const user = await userModel.findById(id);
    if (!user)
      return res
        .status(404)
        .json({ success: false, message: "no such logged in user found" });
    const queries = await queryModel.find({ user: user._id });
    return res
      .status(200)
      .json({
        success: true,
        message: "all queries fetched successfully",
        queries,
      });
  } catch (err) {
    console.error("Get User Queries Error:", err);
    return res
      .status(500)
      .json({
        success: false,
        message: "internal server error",
        error: err.message,
      });
  }
};

// ============================================================
// GET ALL QUERIES
// ============================================================
exports.getAllQueries = async (req, res) => {
  try {
    const queries = await queryModel
      .find()
      .populate("user", "firstName lastName email role")
      .populate("assignedTo", "firstName lastName email role")
      .sort({ createdAt: -1 });
    return res.status(200).json({ success: true, queries });
  } catch (err) {
    console.error("Get All Queries Error:", err);
    return res
      .status(500)
      .json({
        success: false,
        message: "internal server error",
        error: err.message,
      });
  }
};

// ============================================================
// ASSIGN QUERY
// ============================================================
exports.assignQuery = async (req, res) => {
  try {
    const { id } = req.user;
    const { queryId } = req.params;
    const query = await queryModel.findById(queryId);
    if (!query)
      return res
        .status(404)
        .json({ success: false, message: "Query not found" });
    if (query.assignedTo)
      return res
        .status(400)
        .json({
          success: false,
          message: "Query already assigned to another supervisor",
        });
    query.assignedTo = id;
    query.status = "In Progress";
    await query.save();
    const io = req.app.get("io");
    if (io) io.emit("queryAssigned", query);
    return res
      .status(200)
      .json({ success: true, message: "Query assigned successfully", query });
  } catch (err) {
    console.error("Assign Query Error:", err);
    return res
      .status(500)
      .json({
        success: false,
        message: "internal server error",
        error: err.message,
      });
  }
};

// ============================================================
// UPDATE STATUS
// ============================================================
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
    if (!query)
      return res
        .status(404)
        .json({ success: false, message: "Query not found" });
    const oldStatus = query.status;
    query.status = status;
    await query.save();
    if (status === "Resolved" && oldStatus !== "Resolved") {
      const student = query.user;
      const supervisor = query.assignedTo;
      try {
        await mailSender(
          student.email,
          "✅ Your Query has been Resolved!",
          `
          <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #e2e8f0; border-radius: 12px;">
            <div style="text-align: center; padding: 20px; background: linear-gradient(135deg, #22c55e, #16a34a); border-radius: 12px; margin-bottom: 20px;">
              <h1 style="color: white; margin: 0;">✅ Query Resolved!</h1>
            </div>
            <p>Dear <strong>${student.firstName} ${student.lastName}</strong>,</p>
            <p>Your query has been successfully resolved.</p>
            <div style="background: #f0fdf4; padding: 16px; border-radius: 12px; margin: 20px 0; border-left: 4px solid #22c55e;">
              <p><strong>Title:</strong> ${query.title}</p>
              <p><strong>Resolved By:</strong> ${supervisor ? supervisor.firstName + " " + supervisor.lastName : "Support Team"}</p>
              <p><strong>Resolved On:</strong> ${new Date().toLocaleString()}</p>
            </div>
            <hr style="margin: 20px 0; border: none; border-top: 1px solid #e2e8f0;">
            <p style="font-size: 12px; color: #94a3b8; text-align: center;">SmartCampus Support Team</p>
          </div>
        `,
        );
      } catch (emailError) {
        console.error("Resolution email failed:", emailError);
      }
    }
    const io = req.app.get("io");
    if (io) io.emit("queryUpdated", query);
    return res
      .status(200)
      .json({ success: true, message: "Status updated successfully", query });
  } catch (err) {
    console.error("Update Status Error:", err);
    return res
      .status(500)
      .json({
        success: false,
        message: "internal server error",
        error: err.message,
      });
  }
};

// ============================================================
// UPDATE QUERY
// ============================================================
exports.updateQuery = async (req, res) => {
  try {
    const { id } = req.user;
    const { queryId } = req.params;
    const { title, description, priority } = req.body;
    const imageUrl = req.file ? `/uploads/${req.file.filename}` : undefined;
    if (!title || !description || !priority) {
      return res
        .status(400)
        .json({
          success: false,
          message: "title, description and priority are required",
        });
    }
    const query = await queryModel.findById(queryId);
    if (!query)
      return res
        .status(404)
        .json({ success: false, message: "Query not found" });
    if (query.user.toString() !== id)
      return res
        .status(403)
        .json({ success: false, message: "Not authorized" });
    const updateData = { title, description, priority };
    if (imageUrl) updateData.imageUrl = imageUrl;
    const updatedQuery = await queryModel.findByIdAndUpdate(
      queryId,
      updateData,
      { new: true, runValidators: true },
    );
    const io = req.app.get("io");
    if (io) io.emit("queryUpdated", updatedQuery);
    return res
      .status(200)
      .json({
        success: true,
        message: "Query updated successfully",
        query: updatedQuery,
      });
  } catch (err) {
    console.error("Update Query Error:", err);
    return res
      .status(500)
      .json({
        success: false,
        message: "internal server error",
        error: err.message,
      });
  }
};

// ============================================================
// DELETE QUERY
// ============================================================
exports.deleteQuery = async (req, res) => {
  try {
    const { id } = req.user;
    const { queryId } = req.params;
    const query = await queryModel.findById(queryId);
    if (!query)
      return res
        .status(404)
        .json({ success: false, message: "Query not found" });
    if (query.user.toString() !== id)
      return res
        .status(403)
        .json({ success: false, message: "Not authorized" });
    await queryModel.findByIdAndDelete(queryId);
    const io = req.app.get("io");
    if (io) io.emit("queryDeleted", queryId);
    return res
      .status(200)
      .json({ success: true, message: "Query deleted successfully" });
  } catch (err) {
    console.error("Delete Query Error:", err);
    return res
      .status(500)
      .json({
        success: false,
        message: "internal server error",
        error: err.message,
      });
  }
};

// ============================================================
// TAKE ADMIN ACTION
// ============================================================
exports.takeAdminAction = async (req, res) => {
  try {
    const { queryId } = req.params;
    const { action, message } = req.body;
    if (
      !action ||
      !["warning", "penalty", "escalated"].includes(action.toLowerCase())
    ) {
      return res
        .status(400)
        .json({
          success: false,
          message: "Valid action required: warning, penalty, or escalated",
        });
    }
    const query = await queryModel.findById(queryId);
    if (!query)
      return res
        .status(404)
        .json({ success: false, message: "Query not found" });
    query.adminAction = action.toLowerCase();
    query.adminActionMessage =
      message || `Admin issued a ${action} for delayed resolution`;
    query.actionTakenAt = new Date();
    query.escalationLevel = "none";
    query.lastEscalationNotified = null;
    await query.save();
    const io = req.app.get("io");
    if (io) io.emit("adminActionTaken", query);
    return res
      .status(200)
      .json({
        success: true,
        message: `Admin action '${action}' taken successfully.`,
        query,
      });
  } catch (err) {
    console.error("Admin Action Error:", err);
    return res
      .status(500)
      .json({
        success: false,
        message: "internal server error",
        error: err.message,
      });
  }
};

// ============================================================
// GET ESCALATED WARNINGS
// ============================================================
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
    return res
      .status(500)
      .json({
        success: false,
        message: "Error fetching escalated warnings",
        error: err.message,
      });
  }
};

// ============================================================
// CHECK ESCALATIONS (CRON JOB)
// ============================================================
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
      if (query.assignedTo) {
        await createNotification(
          query.assignedTo._id,
          "escalation_24hr",
          "⚠️ Query Escalation Warning",
          `Query "${query.title}" has exceeded 24 hours without resolution.`,
          query._id,
        );
      }
    }
    for (const query of queries48hr) {
      query.escalationLevel = "critical_48hr";
      query.lastEscalationNotified = now;
      await query.save();
      const admins = await userModel.find({ role: "admin" });
      for (const admin of admins) {
        await createNotification(
          admin._id,
          "escalation_48hr",
          "🚨 CRITICAL: Query Escalation",
          `Query "${query.title}" has exceeded 48 hours!`,
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

// ============================================================
// GET CRITICAL ESCALATIONS
// ============================================================
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
    return res
      .status(500)
      .json({
        success: false,
        message: "Error fetching critical escalations",
        error: err.message,
      });
  }
};

// ============================================================
// GET QUERY BY ID
// ============================================================
exports.getQueryById = async (req, res) => {
  try {
    const { queryId } = req.params;
    const { id } = req.user;
    const query = await queryModel
      .findById(queryId)
      .populate("user", "firstName lastName email prn role")
      .populate("assignedTo", "firstName lastName email role");
    if (!query)
      return res
        .status(404)
        .json({ success: false, message: "Query not found" });
    const user = await userModel.findById(id);
    const isAuthor = query.user._id.toString() === id;
    const isSupervisor = user?.role === "supervisor";
    const isAdmin = user?.role === "admin";
    if (!isAuthor && !isSupervisor && !isAdmin) {
      return res
        .status(403)
        .json({
          success: false,
          message: "You don't have permission to view this query",
        });
    }
    return res.status(200).json({ success: true, query });
  } catch (err) {
    console.error("Get Query By ID Error:", err);
    return res
      .status(500)
      .json({
        success: false,
        message: "Error fetching query details",
        error: err.message,
      });
  }
};

// ============================================================
// REASSIGN SUPERVISOR
// ============================================================
exports.reassignSupervisor = async (req, res) => {
  try {
    const { oldSupervisorId, newSupervisorId, queryIds } = req.body;
    if (!oldSupervisorId || !newSupervisorId || !queryIds || !queryIds.length) {
      return res
        .status(400)
        .json({
          success: false,
          message: "Old supervisor, new supervisor, and query IDs are required",
        });
    }
    const oldSupervisor = await userModel.findById(oldSupervisorId);
    const newSupervisor = await userModel.findById(newSupervisorId);
    if (!oldSupervisor || !newSupervisor)
      return res
        .status(404)
        .json({ success: false, message: "Supervisor not found" });
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
    try {
      await mailSender(
        oldSupervisor.email,
        "⚠️ URGENT: Supervisor Assignment Removed",
        `
        <div style="font-family:Arial,sans-serif;max-width:600px;margin:0 auto;padding:20px;">
          <p>Dear <strong>${oldSupervisor.firstName} ${oldSupervisor.lastName}</strong>,</p>
          <p>This is a <strong style="color:#dc2626;">STRICT WARNING</strong>. ${updatedQueries.length} queries have been reassigned due to SLA breach. Report to Admin Office immediately.</p>
        </div>
      `,
      );
      await mailSender(
        newSupervisor.email,
        "📋 New Queries Assigned to You",
        `
        <div style="font-family:Arial,sans-serif;max-width:600px;margin:0 auto;padding:20px;">
          <p>Dear <strong>${newSupervisor.firstName} ${newSupervisor.lastName}</strong>,</p>
          <p>${updatedQueries.length} queries have been reassigned to you. Please resolve them within 24 hours.</p>
        </div>
      `,
      );
    } catch (emailError) {
      console.error("Reassignment email failed:", emailError);
    }
    const io = req.app.get("io");
    if (io)
      io.emit("supervisorReassigned", {
        oldSupervisorId,
        newSupervisorId,
        queryIds,
      });
    return res
      .status(200)
      .json({
        success: true,
        message: `${updatedQueries.length} queries reassigned successfully`,
        reassignedCount: updatedQueries.length,
      });
  } catch (err) {
    console.error("Reassign Supervisor Error:", err);
    return res
      .status(500)
      .json({
        success: false,
        message: "Error reassigning supervisor",
        error: err.message,
      });
  }
};

// ============================================================
// GET ACTION HISTORY
// ============================================================
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
    return res
      .status(500)
      .json({
        success: false,
        message: "Error fetching action history",
        error: err.message,
      });
  }
};

// ============================================================
// CREATE QUERY — 3-TIER VALIDATION SYSTEM
// ============================================================
exports.createQuery = async (req, res) => {
  try {
    const { id } = req.user;
    const { title, description, priority } = req.body;
    const imageUrl = req.file ? `/uploads/${req.file.filename}` : null;

    if (!title || !description || !priority || !id) {
      return res
        .status(400)
        .json({ success: false, message: "All input fields required" });
    }

    // ── STEP 1: SPAM & OFFENSIVE DETECTION ───────────────────
    const spamCheck = await detectSpam(title, description, id);
    console.log("🔍 Spam Detection Result:", spamCheck);

    // ════════════════════════════════════
    // TIER 3 — Offensive/Sexual/Racist
    // Email every time. 2 strikes = permanent block.
    // ════════════════════════════════════
    if (spamCheck.tier === 3) {
      const user = await userModel.findById(id);

      if (!user.offensiveOffenseHistory) user.offensiveOffenseHistory = [];
      user.offensiveOffenseHistory.push({
        reason: spamCheck.reasons[0],
        queryTitle: title,
        createdAt: new Date(),
      });
      user.offensiveOffenseCount = (user.offensiveOffenseCount || 0) + 1;
      user.lastOffenseAt = new Date();

      let isBlockedNow = false;
      if (user.offensiveOffenseCount >= 2) {
        user.isBlocked = true;
        user.blockedAt = new Date();
        user.blockReason =
          "Repeated submission of offensive/sexual/racist content";
        isBlockedNow = true;
      }
      await user.save();

      // Audit record
      await queryModel.create({
        user: id,
        title,
        description,
        priority,
        status: "Resolved",
        assignedTo: null,
        imageUrl,
        isSpam: "spam",
        spamScore: 100,
        spamReason: spamCheck.reasons[0],
        spamMarkedAt: new Date(),
        autoSpam: true,
      });

      // Always send email for Tier 3
      try {
        if (isBlockedNow) {
          await mailSender(
            user.email,
            "🔴 OFFICIAL NOTICE: Your Account Has Been Permanently Suspended",
            generateTier3BlockedEmail(user, spamCheck.reasons[0]),
          );
          const admins = await userModel.find({ role: "admin" });
          for (const admin of admins) {
            await createNotification(
              admin._id,
              "student_blocked",
              "🔴 Student Suspended — Offensive Content",
              `${user.firstName} ${user.lastName} suspended for repeated offensive submissions.`,
              null,
            );
          }
        } else {
          await mailSender(
            user.email,
            "🚨 FORMAL WARNING — Zero Tolerance Violation",
            generateTier3WarningEmail(user, spamCheck.reasons[0]),
          );
        }
      } catch (emailError) {
        console.error("Tier 3 email failed:", emailError);
      }

      return res.status(403).json({
        success: false,
        message: isBlockedNow
          ? "🔴 Your account has been permanently suspended. Report to Admin Office immediately."
          : "🚨 Your submission contains offensive content and violates our zero-tolerance policy. A formal warning has been issued to your registered email.",
        isBlocked: isBlockedNow,
      });
    }

    // ════════════════════════════════════
    // TIER 2 — Spam/Casual/Irrelevant
    // No email per offense. Email only when account is blocked at 8 offenses.
    // ════════════════════════════════════
    if (spamCheck.tier === 2 && spamCheck.isSpam) {
      const user = await userModel.findById(id);

      if (!user.spamOffenseHistory) user.spamOffenseHistory = [];
      user.spamOffenseHistory.push({
        reason: spamCheck.reasons.join(", "),
        queryTitle: title,
        createdAt: new Date(),
      });
      user.spamOffenseCount = (user.spamOffenseCount || 0) + 1;
      user.lastOffenseAt = new Date();

      let isBlockedNow = false;
      if (user.spamOffenseCount >= 8) {
        user.isBlocked = true;
        user.blockedAt = new Date();
        user.blockReason = "Repeated spam/irrelevant query submissions";
        isBlockedNow = true;
      }
      await user.save();

      // Audit record
      await queryModel.create({
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
        spamMarkedAt: new Date(),
        autoSpam: true,
      });

      // Email only if account just got blocked
      if (isBlockedNow) {
        try {
          await mailSender(
            user.email,
            "🔒 Your SmartCampus Account Has Been Suspended",
            generateTier2BlockedEmail(user),
          );
          const admins = await userModel.find({ role: "admin" });
          for (const admin of admins) {
            await createNotification(
              admin._id,
              "student_blocked",
              "🔒 Student Suspended — Spam",
              `${user.firstName} ${user.lastName} suspended after ${user.spamOffenseCount} spam offenses.`,
              null,
            );
          }
        } catch (emailError) {
          console.error("Tier 2 block email failed:", emailError);
        }

        return res.status(403).json({
          success: false,
          message:
            "🔒 Your account has been suspended due to repeated spam submissions. Report to Admin Office.",
          isBlocked: true,
        });
      }

      // Not yet blocked — frontend alert only, no email
      return res.status(400).json({
        success: false,
        message:
          "⚠️ Please submit only genuine campus issues. Repeated spam submissions may result in account suspension.",
        spamOffenseCount: user.spamOffenseCount,
        remainingChances: 8 - user.spamOffenseCount,
      });
    }

    // ── STEP 2: AI RELEVANCE VALIDATION (Gemini) ─────────────
    const aiValidation = await validateQueryRelevance(title, description);
    console.log("🤖 Gemini AI Validation:", aiValidation);

    // ════════════════════════════════════
    // TIER 1 — Soft block
    // Not malicious, just not genuine. Silent block.
    // No email, no offense count, no DB record.
    // ════════════════════════════════════
    if (
      aiValidation.tier === "soft_block" ||
      (!aiValidation.isGenuine &&
        aiValidation.relevanceScore < 40 &&
        aiValidation.tier !== "fake")
    ) {
      return res.status(400).json({
        success: false,
        message:
          "❌ Please describe a real campus issue you are currently facing. Vague or non-issue queries cannot be submitted.",
      });
    }

    // ════════════════════════════════════
    // TIER 2 from AI — fake/irrelevant
    // Offense tracked, no email unless blocked.
    // ════════════════════════════════════
    if (
      !aiValidation.isGenuine ||
      aiValidation.tier === "fake" ||
      aiValidation.relevanceScore < 40
    ) {
      const user = await userModel.findById(id);

      if (!user.spamOffenseHistory) user.spamOffenseHistory = [];
      user.spamOffenseHistory.push({
        reason: `AI Blocked: ${aiValidation.reason}`,
        queryTitle: title,
        createdAt: new Date(),
      });
      user.spamOffenseCount = (user.spamOffenseCount || 0) + 1;
      user.lastOffenseAt = new Date();

      let isBlockedNow = false;
      if (user.spamOffenseCount >= 8) {
        user.isBlocked = true;
        user.blockedAt = new Date();
        user.blockReason = "Repeated fake/irrelevant query submissions";
        isBlockedNow = true;
      }
      await user.save();

      await queryModel.create({
        user: id,
        title,
        description,
        priority,
        status: "Resolved",
        assignedTo: null,
        imageUrl,
        isSpam: "spam",
        spamScore: aiValidation.relevanceScore,
        spamReason: `AI Blocked: ${aiValidation.reason}`,
        spamMarkedAt: new Date(),
        autoSpam: true,
      });

      if (isBlockedNow) {
        try {
          await mailSender(
            user.email,
            "🔒 Your SmartCampus Account Has Been Suspended",
            generateTier2BlockedEmail(user),
          );
        } catch (emailError) {
          console.error("AI block email failed:", emailError);
        }
        return res.status(403).json({
          success: false,
          message:
            "🔒 Your account has been suspended. Report to Admin Office.",
          isBlocked: true,
        });
      }

      return res.status(400).json({
        success: false,
        message:
          "⚠️ Please submit only genuine campus issues. Repeated irrelevant queries may result in account suspension.",
        spamOffenseCount: user.spamOffenseCount,
        remainingChances: 8 - user.spamOffenseCount,
      });
    }

    // ── STEP 3: FETCH USER ────────────────────────────────────
    const user = await userModel.findById(id);
    if (!user)
      return res
        .status(404)
        .json({ success: false, message: "User not found" });

    // ── STEP 4: JAVA ANALYSIS ─────────────────────────────────
    let javaAnalysisData = null;
    try {
      console.log(
        "☕ Calling Java analyzer for:",
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
      } else {
        console.log("⚠️ Java returned fallback — analysis not saved");
      }
    } catch (err) {
      console.log("⚠️ Java analyzer not available:", err.message);
    }

    // ── STEP 5: CREATE QUERY (single DB write, no race condition) ─
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
      javaAnalysis: javaAnalysisData,
    });

    console.log(
      "✅ Query created. javaAnalysis:",
      newQuery.javaAnalysis ? "SAVED" : "NOT SAVED (Java unavailable)",
    );

    const io = req.app.get("io");
    if (io) io.emit("queryCreated", newQuery);

    const response = {
      success: true,
      message: spamCheck.isSuspicious
        ? "⚠️ Query submitted but flagged as suspicious. It will be reviewed."
        : "Query created successfully",
      query: newQuery,
      userEmail: user.email,
    };

    if (spamCheck.isSuspicious) {
      response.spamWarning = {
        message: "Your query has been flagged for review.",
        score: spamCheck.score,
        reasons: spamCheck.reasons,
      };
    }

    if (javaAnalysisData && javaAnalysisData.priority !== priority) {
      response.warning = `🤖 Java AI suggests "${javaAnalysisData.priority}" priority (Score: ${javaAnalysisData.score})`;
    }

    return res.status(200).json(response);
  } catch (err) {
    console.error("Create Query Error:", err);
    return res
      .status(500)
      .json({
        success: false,
        message: "internal server error",
        error: err.message,
      });
  }
};

// ============================================================
// MARK AS SPAM (Manual — Admin/Supervisor)
// ============================================================
exports.markAsSpam = async (req, res) => {
  try {
    const { queryId } = req.params;
    const { id } = req.user;
    const { reason } = req.body;
    if (!reason || reason.trim() === "") {
      return res
        .status(400)
        .json({
          success: false,
          message: "Reason is required to mark query as spam",
        });
    }
    const query = await queryModel
      .findById(queryId)
      .populate("user", "firstName lastName email");
    if (!query)
      return res
        .status(404)
        .json({ success: false, message: "Query not found" });
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
      `Your query "${query.title}" has been marked as spam. Reason: ${reason}.`,
      query._id,
    );
    try {
      await mailSender(
        query.user.email,
        "⚠️ Your Query Was Marked as Spam",
        `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
          <p>Dear <strong>${query.user.firstName} ${query.user.lastName}</strong>,</p>
          <p>Your query "<strong>${query.title}</strong>" has been marked as spam.</p>
          <p><strong>Reason:</strong> ${reason}</p>
          <p>Please submit only genuine campus issues in future.</p>
          <p style="font-size: 12px; color: #94a3b8;">SmartCampus Support Team</p>
        </div>
      `,
      );
    } catch (emailError) {
      console.error("Spam email failed:", emailError);
    }
    const io = req.app.get("io");
    if (io) io.emit("queryMarkedAsSpam", query);
    return res
      .status(200)
      .json({
        success: true,
        message: "Query marked as spam successfully",
        query,
      });
  } catch (err) {
    console.error("Mark as Spam Error:", err);
    return res
      .status(500)
      .json({
        success: false,
        message: "Error marking query as spam",
        error: err.message,
      });
  }
};

// Batch resolve similar queries
// Batch resolve similar queries
exports.batchResolveSimilar = async (req, res) => {
  try {
    const { queryIds, resolutionNote } = req.body;
    const { id } = req.user;
    
    if (!queryIds || queryIds.length === 0) {
      return res.status(400).json({
        success: false,
        message: "No queries selected for batch resolution"
      });
    }
    
    let resolvedCount = 0;
    
    for (const queryId of queryIds) {
      const query = await queryModel.findById(queryId);
      if (query && query.status !== "Resolved") {
        query.status = "Resolved";
        query.resolutionNote = resolutionNote;
        query.batchResolvedBy = id;
        query.batchResolvedAt = new Date();
        await query.save();
        resolvedCount++;
      }
    }
    
    return res.status(200).json({
      success: true,
      message: `${resolvedCount} queries resolved successfully`,
      resolvedCount: resolvedCount
    });
  } catch (err) {
    console.error("Batch Resolve Error:", err);
    return res.status(500).json({
      success: false,
      message: "Error in batch resolution",
      error: err.message
    });
  }
};