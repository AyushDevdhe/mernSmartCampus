const queryModel = require("../models/queryModel");
const { findSimilarQueries } = require("../services/similarityService");

// Get similar queries for a given query
exports.getSimilarQueries = async (req, res) => {
  try {
    const { queryId } = req.params;
    const { threshold = 0.4 } = req.query;

    // Get the target query
    const targetQuery = await queryModel
      .findById(queryId)
      .populate("assignedTo", "firstName lastName");

    if (!targetQuery) {
      return res.status(404).json({
        success: false,
        message: "Query not found",
      });
    }

    // Get RESOLVED queries (for reference/stats)
    const resolvedQueries = await queryModel
      .find({
        status: "Resolved",
        _id: { $ne: queryId },
        isSpam: { $ne: "spam" },
        spamScore: { $lt: 50 },
      })
      .populate("assignedTo", "firstName lastName");

    // Get UNRESOLVED queries (for batch resolve)
    const unresolvedQueries = await queryModel
      .find({
        status: { $in: ["Pending", "In Progress"] },
        _id: { $ne: queryId },
        isSpam: { $ne: "spam" },
        spamScore: { $lt: 50 },
      })
      .populate("assignedTo", "firstName lastName");

    // Find similar RESOLVED queries (for stats/history)
    const similarResolved =
      resolvedQueries.length > 0
        ? await findSimilarQueries(
            targetQuery,
            resolvedQueries,
            parseFloat(threshold),
            "resolved",
          )
        : [];

    // Find similar UNRESOLVED queries (for batch resolve)
    const similarUnresolved =
      unresolvedQueries.length > 0
        ? await findSimilarQueries(
            targetQuery,
            unresolvedQueries,
            parseFloat(threshold),
            "unresolved",
          )
        : [];

    // Calculate statistics for resolved queries
    const resolvedStats = similarResolved.map((query) => ({
      ...query,
      occurrenceCount: 1, // Can be enhanced to count duplicates
      avgResolutionTime: "~2.5 days", // Can be calculated from timestamps
    }));

    return res.status(200).json({
      success: true,
      similarResolved: resolvedStats,
      similarUnresolved: similarUnresolved,
      targetQuery: {
        _id: targetQuery._id,
        title: targetQuery.title,
        description: targetQuery.description,
        priority: targetQuery.priority,
      },
    });
  } catch (error) {
    console.error("Get Similar Queries Error:", error);
    return res.status(500).json({
      success: false,
      message: "Error finding similar queries",
      error: error.message,
    });
  }
};
