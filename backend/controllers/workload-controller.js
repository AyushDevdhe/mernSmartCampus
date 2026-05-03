const settingModel = require("../models/setting-model");
const {
  getAllSupervisorWorkload,
  findBestSupervisor,
} = require("../services/workload-balancer");
const queryModel = require("../models/queryModel");
const { createNotification } = require("./notificationController");

// Get auto-assign setting
exports.getAutoAssignSetting = async (req, res) => {
  try {
    let setting = await settingModel.findOne({ key: "auto_assign_enabled" });
    if (!setting) {
      setting = await settingModel.create({
        key: "auto_assign_enabled",
        value: false,
        description:
          "Enable automatic assignment of new queries to least loaded supervisor",
      });
    }
    return res.status(200).json({
      success: true,
      enabled: setting.value,
    });
  } catch (err) {
    console.error("Get Auto Assign Setting Error:", err);
    return res.status(500).json({
      success: false,
      message: "Error fetching auto-assign setting",
    });
  }
};

// Update auto-assign setting (Admin only)
exports.updateAutoAssignSetting = async (req, res) => {
  try {
    const { enabled } = req.body;
    const { id } = req.user;

    const setting = await settingModel.findOneAndUpdate(
      { key: "auto_assign_enabled" },
      {
        value: enabled,
        updatedBy: id,
      },
      { upsert: true, new: true },
    );

    return res.status(200).json({
      success: true,
      message: `Auto-assign ${enabled ? "enabled" : "disabled"}`,
      enabled: setting.value,
    });
  } catch (err) {
    console.error("Update Auto Assign Setting Error:", err);
    return res.status(500).json({
      success: false,
      message: "Error updating auto-assign setting",
    });
  }
};

// Get supervisor workload stats (for Admin)
exports.getWorkloadStats = async (req, res) => {
  try {
    const workloads = await getAllSupervisorWorkload();
    return res.status(200).json({
      success: true,
      workloads,
    });
  } catch (err) {
    console.error("Get Workload Stats Error:", err);
    return res.status(500).json({
      success: false,
      message: "Error fetching workload stats",
    });
  }
};

// Auto-assign a query (called when query is created)
exports.autoAssignQuery = async (query) => {
  try {
    const setting = await settingModel.findOne({ key: "auto_assign_enabled" });
    if (!setting || !setting.value) {
      console.log("Auto-assign is disabled");
      return null;
    }

    const bestSupervisor = await findBestSupervisor();
    if (!bestSupervisor) {
      console.log("No supervisors available for auto-assign");
      return null;
    }

    // Assign the query
    query.assignedTo = bestSupervisor._id;
    query.status = "In Progress";
    query.autoAssigned = true;
    query.assignedAt = new Date();
    await query.save();

    // Notify the supervisor
    await createNotification(
      bestSupervisor._id,
      "query_assigned",
      "📋 New Query Auto-Assigned",
      `A new query "${query.title}" has been automatically assigned to you.`,
      query._id,
    );

    console.log(
      `✅ Query ${query._id} auto-assigned to ${bestSupervisor.name}`,
    );
    return bestSupervisor;
  } catch (err) {
    console.error("Auto Assign Error:", err);
    return null;
  }
};
