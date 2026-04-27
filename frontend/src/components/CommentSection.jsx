import { useCallback, useEffect, useState } from "react";
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

  const fetchComments = useCallback(async () => {
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
  }, [queryId]);

  useEffect(() => {
    if (queryId) {
      fetchComments();
    }
  }, [queryId, fetchComments]);

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
        return {
          className: "bg-sky-100 text-sky-700",
          text: "Student",
        };
      case "supervisor":
        return {
          className: "bg-amber-100 text-amber-700",
          text: "Supervisor",
        };
      case "admin":
        return {
          className: "bg-rose-100 text-rose-700",
          text: "Admin",
        };
      default:
        return {
          className: "bg-slate-100 text-slate-700",
          text: "User",
        };
    }
  };

  return (
    <div className="border-t border-slate-200 pt-4">
      <h4 className="mb-3 text-base font-semibold text-slate-900">
        💬 Comments ({comments.length})
      </h4>

      {/* Comment List */}
      <div className="mb-4 max-h-[300px] space-y-2 overflow-y-auto pr-1">
        {isLoading ? (
          <p className="py-4 text-center text-sm text-slate-500">
            Loading comments...
          </p>
        ) : comments.length === 0 ? (
          <p className="py-4 text-center text-sm text-slate-500">
            No comments yet. Start the conversation!
          </p>
        ) : (
          comments.map((comment) => {
            const badge = getUserBadge(comment.user?.role);
            const isAuthor = comment.user?._id === user?._id;
            return (
              <div
                key={comment._id}
                className="rounded-xl border border-slate-200 bg-slate-50 p-3"
              >
                <div className="mb-1.5 flex flex-wrap items-center justify-between gap-2">
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="text-sm font-semibold text-slate-800">
                      {comment.user?.firstName} {comment.user?.lastName}
                    </span>
                    <span
                      className={`rounded-full px-2 py-0.5 text-[10px] font-semibold ${badge.className}`}
                    >
                      {badge.text}
                    </span>
                    {comment.isEdited && (
                      <span className="text-[10px] text-slate-400">
                        (edited)
                      </span>
                    )}
                  </div>

                  <div className="flex items-center gap-2">
                    <span className="text-[10px] text-slate-400">
                      {new Date(comment.createdAt).toLocaleString()}
                    </span>
                    {(isAuthor || user?.role === "admin") && (
                      <button
                        onClick={() => handleDeleteComment(comment._id)}
                        className="text-xs font-medium text-rose-600 transition hover:text-rose-700"
                      >
                        Delete
                      </button>
                    )}
                  </div>
                </div>
                <p className="text-sm leading-6 text-slate-700">
                  {comment.text}
                </p>
              </div>
            );
          })
        )}
      </div>

      {/* Add Comment Form */}
      <div className="flex flex-col gap-2 sm:flex-row">
        <textarea
          placeholder="Write a comment..."
          value={newComment}
          onChange={(e) => setNewComment(e.target.value)}
          className="min-h-[72px] flex-1 resize-y rounded-xl border border-slate-300 px-3 py-2 text-sm outline-none transition focus:border-sky-500 focus:ring-2 focus:ring-sky-100"
          rows="2"
        />
        <button
          onClick={handleAddComment}
          disabled={isSubmitting || !newComment.trim()}
          className="self-end rounded-xl bg-sky-600 px-4 py-2 text-sm font-semibold text-white transition hover:bg-sky-700 disabled:cursor-not-allowed disabled:opacity-60 sm:self-start"
        >
          {isSubmitting ? "Sending..." : "Send"}
        </button>
      </div>
    </div>
  );
};

export default CommentSection;
