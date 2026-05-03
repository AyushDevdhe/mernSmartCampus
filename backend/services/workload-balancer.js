const userModel = require("../models/userModel");
const queryModel = require("../models/queryModel");

// Calculate workload score for a supervisor
const calculateWorkloadScore = async (supervisorId) => {
  // Get all queries assigned to this supervisor (not resolved)
  const assignedQueries = await queryModel.find({
    assignedTo: supervisorId,
    status: { $ne: "Resolved" },
  });

  // Get resolved queries count (last 30 days)
  const thirtyDaysAgo = new Date();
  thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

  const resolvedQueries = await queryModel.countDocuments({
    assignedTo: supervisorId,
    status: "Resolved",
    updatedAt: { $gte: thirtyDaysAgo },
  });

  // Calculate average resolution time (in hours)
  const resolvedWithTime = await queryModel
    .find({
      assignedTo: supervisorId,
      status: "Resolved",
      createdAt: { $exists: true },
      updatedAt: { $exists: true },
    })
    .limit(50);

  let avgResolutionTime = 48; // Default 48 hours
  if (resolvedWithTime.length > 0) {
    const totalTime = resolvedWithTime.reduce((sum, q) => {
      const diffHours =
        (new Date(q.updatedAt) - new Date(q.createdAt)) / (1000 * 60 * 60);
      return sum + diffHours;
    }, 0);
    avgResolutionTime = totalTime / resolvedWithTime.length;
  }

  // Get count of high priority pending queries
  const highPriorityCount = assignedQueries.filter(
    (q) => q.priority === "High",
  ).length;

  // Workload Score Formula:
  // Score = (assignedCount * 1.5) + (highPriorityCount * 2) + (avgResolutionTime / 24)
  const score =
    assignedQueries.length * 1.5 +
    highPriorityCount * 2 +
    avgResolutionTime / 24;

  return {
    supervisorId,
    assignedCount: assignedQueries.length,
    highPriorityCount,
    resolvedCount: resolvedQueries,
    avgResolutionTime: Math.round(avgResolutionTime * 10) / 10,
    workloadScore: Math.round(score * 10) / 10,
  };
};

// Get all supervisors with workload scores
const getAllSupervisorWorkload = async () => {
  const supervisors = await userModel.find({
    role: "supervisor",
    isBlocked: { $ne: true },
  });

  const workloads = [];
  for (const supervisor of supervisors) {
    const workload = await calculateWorkloadScore(supervisor._id);
    workloads.push({
      ...workload,
      name: `${supervisor.firstName} ${supervisor.lastName}`,
      email: supervisor.email,
      _id: supervisor._id,
    });
  }

  // Sort by workload score (lowest first - least loaded)
  workloads.sort((a, b) => a.workloadScore - b.workloadScore);

  return workloads;
};

// Find best supervisor to assign a new query
const findBestSupervisor = async () => {
  const workloads = await getAllSupervisorWorkload();
  if (workloads.length === 0) return null;

  // Return the supervisor with lowest workload score
  return workloads[0];
};

module.exports = {
  calculateWorkloadScore,
  getAllSupervisorWorkload,
  findBestSupervisor,
};
