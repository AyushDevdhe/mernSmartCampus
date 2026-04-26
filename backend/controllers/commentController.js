const commentModel = require("../models/commentModel");
const queryModel = require("../models/queryModel");
const userModel = require("../models/userModel");
const { createNotification } = require("./notificationController");

// Add a comment to a query
exports.addComment = async (req, res) => {
  try {
    const { id } = req.user;
    const { queryId } = req.params;
    const { text } = req.body;

    if (!text || !text.trim()) {
      return res.status(400).json({
        success: false,
        message: "Comment text is required",
      });
    }

    const query = await queryModel.findById(queryId);
    if (!query) {
      return res.status(404).json({
        success: false,
        message: "Query not found",
      });
    }

    const user = await userModel.findById(id);
    if (!user) {
      return res.status(404).json({
        success: false,
        message: "User not found",
      });
    }

    const comment = await commentModel.create({
      query: queryId,
      user: id,
      userRole: user.role,
      text: text.trim(),
    });

    // Populate user info for response
    const populatedComment = await commentModel
      .findById(comment._id)
      .populate("user", "firstName lastName role");

    // Send notification to the other party
    const io = req.app.get("io");

    if (user.role === "student" && query.assignedTo) {
      // Notify assigned supervisor
      await createNotification(
        query.assignedTo,
        "query_comment",
        "💬 New Comment on Assigned Query",
        `${user.firstName} ${user.lastName} commented on query "${query.title}"`,
        queryId,
      );
      if (io) io.emit("newComment", { queryId, comment: populatedComment });
    } else if (user.role === "supervisor" && query.user) {
      // Notify student who created query
      await createNotification(
        query.user,
        "query_comment",
        "💬 New Comment from Supervisor",
        `Supervisor ${user.firstName} ${user.lastName} commented on your query "${query.title}"`,
        queryId,
      );
      if (io) io.emit("newComment", { queryId, comment: populatedComment });
    }

    return res.status(201).json({
      success: true,
      message: "Comment added successfully",
      comment: populatedComment,
    });
  } catch (err) {
    console.error("Add Comment Error:", err);
    return res.status(500).json({
      success: false,
      message: "Error adding comment",
      error: err.message,
    });
  }
};

// Get all comments for a query
exports.getCommentsByQuery = async (req, res) => {
  try {
    const { queryId } = req.params;

    const comments = await commentModel
      .find({ query: queryId })
      .populate("user", "firstName lastName role")
      .sort({ createdAt: 1 });

    return res.status(200).json({
      success: true,
      comments: comments,
    });
  } catch (err) {
    console.error("Get Comments Error:", err);
    return res.status(500).json({
      success: false,
      message: "Error fetching comments",
      error: err.message,
    });
  }
};

// Edit a comment (only by the author)
exports.editComment = async (req, res) => {
  try {
    const { id } = req.user;
    const { commentId } = req.params;
    const { text } = req.body;

    if (!text || !text.trim()) {
      return res.status(400).json({
        success: false,
        message: "Comment text is required",
      });
    }

    const comment = await commentModel.findById(commentId);
    if (!comment) {
      return res.status(404).json({
        success: false,
        message: "Comment not found",
      });
    }

    if (comment.user.toString() !== id) {
      return res.status(403).json({
        success: false,
        message: "You can only edit your own comments",
      });
    }

    comment.text = text.trim();
    comment.isEdited = true;
    await comment.save();

    const updatedComment = await commentModel
      .findById(commentId)
      .populate("user", "firstName lastName role");

    return res.status(200).json({
      success: true,
      message: "Comment updated successfully",
      comment: updatedComment,
    });
  } catch (err) {
    console.error("Edit Comment Error:", err);
    return res.status(500).json({
      success: false,
      message: "Error editing comment",
      error: err.message,
    });
  }
};

// Delete a comment (only by author or admin)
exports.deleteComment = async (req, res) => {
  try {
    const { id } = req.user;
    const { commentId } = req.params;

    const comment = await commentModel.findById(commentId);
    if (!comment) {
      return res.status(404).json({
        success: false,
        message: "Comment not found",
      });
    }

    const user = await userModel.findById(id);

    if (comment.user.toString() !== id && user.role !== "admin") {
      return res.status(403).json({
        success: false,
        message: "You can only delete your own comments",
      });
    }

    await commentModel.findByIdAndDelete(commentId);

    return res.status(200).json({
      success: true,
      message: "Comment deleted successfully",
    });
  } catch (err) {
    console.error("Delete Comment Error:", err);
    return res.status(500).json({
      success: false,
      message: "Error deleting comment",
      error: err.message,
    });
  }
};
