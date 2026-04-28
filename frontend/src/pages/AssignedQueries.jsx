import React, { useEffect, useState } from "react";
import { useSelector } from "react-redux";
import { useNavigate } from "react-router-dom";
import { getAllQueries, updateQueryStatus } from "../services/QueryApis";
import CommentSection from "../components/CommentSection";
import "../css/AssignedQueries.css";

const AssignedQueries = () => {
  const user = useSelector((state) => state.user.data);
  const navigate = useNavigate();
  const [assignedQueries, setAssignedQueries] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [actionLoading, setActionLoading] = useState(null);
  const [expandedQueryId, setExpandedQueryId] = useState(null);

  const fetchAssignedQueries = async () => {
    setIsLoading(true);
    try {
      const res = await getAllQueries();
      if (res?.data?.success) {
        const myQueries = res.data.queries.filter(
          (q) => q.assignedTo?._id === user?._id && q.status !== "Resolved",
        );
        setAssignedQueries(myQueries);
      }
    } catch (error) {
      console.error("Error fetching assigned queries:", error);
      alert(error.response?.data?.message || "Failed to fetch queries");
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    if (user?.role === "supervisor") {
      fetchAssignedQueries();
    }
  }, [user]);

  const handleStatusUpdate = async (queryId, newStatus) => {
    setActionLoading(queryId);
    try {
      const res = await updateQueryStatus(queryId, newStatus);
      if (res?.data?.success) {
        alert(`Query marked as ${newStatus}!`);
        fetchAssignedQueries();
      }
    } catch (error) {
      console.error("Error updating status:", error);
      alert(error.response?.data?.message || "Failed to update status");
    } finally {
      setActionLoading(null);
    }
  };

  const toggleComments = (queryId) => {
    setExpandedQueryId(expandedQueryId === queryId ? null : queryId);
  };

  if (isLoading) {
    return (
      <div className="assigned-loading">
        <div className="spinner"></div>
        <p>Loading assigned queries...</p>
      </div>
    );
  }

  return (
    <div className="assigned-queries-container">
      <div className="page-header">
        <h1>📌 Assigned Queries</h1>
        <p>Queries assigned to you for resolution</p>
      </div>

      {assignedQueries.length === 0 ? (
        <div className="empty-state">
          <div className="empty-icon">✅</div>
          <h3>No Assigned Queries</h3>
          <p>You don't have any assigned queries at the moment.</p>
        </div>
      ) : (
        <div className="queries-grid">
          {assignedQueries.map((query) => (
            <div key={query._id} className="query-card">
              <div className="card-header">
                <div className="student-info">
                  <span className="student-avatar">
                    {query.user?.firstName?.charAt(0) || "S"}
                  </span>
                  <span className="student-name">
                    {query.user?.firstName} {query.user?.lastName}
                  </span>
                </div>
                <span
                  className={`priority-badge priority-${query.priority?.toLowerCase()}`}
                >
                  {query.priority}
                </span>
              </div>
              <div className="card-body">
                <h3 className="query-title">{query.title}</h3>
                <p className="query-description">{query.description}</p>
                <div className="card-meta">
                  <span
                    className={`status-badge status-${query.status?.toLowerCase().replace(" ", "-")}`}
                  >
                    {query.status}
                  </span>
                  <span className="query-date">
                    Created: {new Date(query.createdAt).toLocaleDateString()}
                  </span>
                </div>
                {query.adminAction && query.adminAction !== "none" && (
                  <div className="admin-warning">
                    <span>
                      ⚠️ Admin Action: {query.adminAction.toUpperCase()}
                    </span>
                    <p>{query.adminActionMessage}</p>
                  </div>
                )}
                <div className="card-actions">
                  <button
                    className="btn-view"
                    onClick={() => navigate(`/query/${query._id}`)}
                  >
                    👁️ View
                  </button>
                  <button
                    className="btn-comment"
                    onClick={() => toggleComments(query._id)}
                  >
                    💬 Comments
                  </button>
                  <button
                    className="btn-resolve"
                    onClick={() => handleStatusUpdate(query._id, "Resolved")}
                    disabled={actionLoading === query._id}
                  >
                    {actionLoading === query._id
                      ? "Updating..."
                      : "✅ Mark Resolved"}
                  </button>
                </div>
                {expandedQueryId === query._id && (
                  <div className="comments-section">
                    <CommentSection
                      queryId={query._id}
                      queryTitle={query.title}
                    />
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default AssignedQueries;
