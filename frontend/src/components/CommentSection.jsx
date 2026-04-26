import { useEffect, useState } from "react";
import { useSelector } from "react-redux";
import {
  getCommentsByQuery,
  addComment,
  deleteComment,
} from "../services/CommentApis";

const CommentSection = ({ queryId, queryTitle }) => {
  const user = useSelector((state) => state.user.data);
  const [comments, setComments] = useState([]);
  const [newComment, setNewComment] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const fetchComments = async () => {
    setIsLoading(true);
    try {
      const res = await getCommentsByQuery(queryId);
      if (res?.data?.success) {
        setComments(res.data.comments);
      }
    } catch (error) {
      console.error("Error fetching comments:", error);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    if (queryId) {
      fetchComments();
    }
  }, [queryId]);

  const handleAddComment = async () => {
    if (!newComment.trim()) {
      alert("Please enter a comment");
      return;
    }

    setIsSubmitting(true);
    try {
      const res = await addComment(queryId, newComment);
      if (res?.data?.success) {
        setNewComment("");
        fetchComments();
      } else {
        alert(res?.data?.message || "Failed to add comment");
      }
    } catch (error) {
      console.error("Error adding comment:", error);
      alert(error.response?.data?.message || "Failed to add comment");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDeleteComment = async (commentId) => {
    if (window.confirm("Are you sure you want to delete this comment?")) {
      try {
        const res = await deleteComment(commentId);
        if (res?.data?.success) {
          fetchComments();
        } else {
          alert(res?.data?.message || "Failed to delete comment");
        }
      } catch (error) {
        console.error("Error deleting comment:", error);
        alert(error.response?.data?.message || "Failed to delete comment");
      }
    }
  };

  const getUserBadge = (role) => {
    switch (role) {
      case "student":
        return { bg: "#dbeafe", color: "#1e40af", text: "Student" };
      case "supervisor":
        return { bg: "#fef3c7", color: "#92400e", text: "Supervisor" };
      case "admin":
        return { bg: "#fee2e2", color: "#991b1b", text: "Admin" };
      default:
        return { bg: "#e2e8f0", color: "#475569", text: "User" };
    }
  };

  return (
    <div
      className="comment-section"
      style={{
        marginTop: "20px",
        borderTop: "1px solid #e2e8f0",
        paddingTop: "16px",
      }}
    >
      <h4
        style={{ marginBottom: "12px", fontSize: "16px", fontWeight: "bold" }}
      >
        💬 Comments ({comments.length})
      </h4>

      {/* Comment List */}
      <div
        className="comments-list"
        style={{ maxHeight: "300px", overflowY: "auto", marginBottom: "16px" }}
      >
        {isLoading ? (
          <p style={{ color: "#64748b", textAlign: "center", padding: "16px" }}>
            Loading comments...
          </p>
        ) : comments.length === 0 ? (
          <p style={{ color: "#64748b", textAlign: "center", padding: "16px" }}>
            No comments yet. Start the conversation!
          </p>
        ) : (
          comments.map((comment) => {
            const badge = getUserBadge(comment.user?.role);
            const isAuthor = comment.user?._id === user?._id;
            return (
              <div
                key={comment._id}
                style={{
                  padding: "12px",
                  marginBottom: "8px",
                  background: "#f8fafc",
                  borderRadius: "8px",
                  border: "1px solid #e2e8f0",
                }}
              >
                <div
                  style={{
                    display: "flex",
                    justifyContent: "space-between",
                    alignItems: "center",
                    marginBottom: "6px",
                  }}
                >
                  <div
                    style={{
                      display: "flex",
                      alignItems: "center",
                      gap: "8px",
                      flexWrap: "wrap",
                    }}
                  >
                    <span style={{ fontWeight: "bold", fontSize: "13px" }}>
                      {comment.user?.firstName} {comment.user?.lastName}
                    </span>
                    <span
                      style={{
                        background: badge.bg,
                        color: badge.color,
                        padding: "2px 8px",
                        borderRadius: "12px",
                        fontSize: "10px",
                        fontWeight: "bold",
                      }}
                    >
                      {badge.text}
                    </span>
                    {comment.isEdited && (
                      <span style={{ fontSize: "10px", color: "#94a3b8" }}>
                        (edited)
                      </span>
                    )}
                  </div>
                  <div style={{ display: "flex", gap: "8px" }}>
                    <span style={{ fontSize: "10px", color: "#94a3b8" }}>
                      {new Date(comment.createdAt).toLocaleString()}
                    </span>
                    {(isAuthor || user?.role === "admin") && (
                      <button
                        onClick={() => handleDeleteComment(comment._id)}
                        style={{
                          background: "none",
                          border: "none",
                          color: "#ef4444",
                          cursor: "pointer",
                          fontSize: "12px",
                        }}
                      >
                        Delete
                      </button>
                    )}
                  </div>
                </div>
                <p
                  style={{
                    fontSize: "14px",
                    color: "#334155",
                    margin: 0,
                    lineHeight: "1.5",
                  }}
                >
                  {comment.text}
                </p>
              </div>
            );
          })
        )}
      </div>

      {/* Add Comment Form */}
      <div style={{ display: "flex", gap: "8px" }}>
        <textarea
          placeholder="Write a comment..."
          value={newComment}
          onChange={(e) => setNewComment(e.target.value)}
          style={{
            flex: 1,
            padding: "10px",
            borderRadius: "8px",
            border: "1px solid #e2e8f0",
            resize: "vertical",
            fontSize: "14px",
            fontFamily: "inherit",
          }}
          rows="2"
        />
        <button
          onClick={handleAddComment}
          disabled={isSubmitting || !newComment.trim()}
          style={{
            padding: "8px 16px",
            background: "#3b82f6",
            color: "white",
            border: "none",
            borderRadius: "8px",
            cursor: "pointer",
            fontWeight: "bold",
            alignSelf: "flex-start",
            opacity: !newComment.trim() || isSubmitting ? 0.6 : 1,
          }}
        >
          {isSubmitting ? "Sending..." : "Send"}
        </button>
      </div>
    </div>
  );
};

export default CommentSection;
