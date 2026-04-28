import React, { useEffect, useState } from "react";
import { useSelector } from "react-redux";
import { useNavigate } from "react-router-dom";
import { getQueriesByUser, deleteQuery } from "../services/QueryApis";
import CommentSection from "../components/CommentSection";
import "../css/InProgress.css";

const InProgress = () => {
  const user = useSelector((state) => state.user.data);
  const navigate = useNavigate();
  const [activeQueries, setActiveQueries] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [deletingId, setDeletingId] = useState(null);
  const [expandedCommentId, setExpandedCommentId] = useState(null);

  const fetchActiveQueries = async () => {
    setIsLoading(true);
    try {
      const res = await getQueriesByUser();
      if (res) {
        const allQueries = res?.data?.queries || [];
        // Filter only Pending and In Progress queries
        const active = allQueries.filter(
          (q) => q.status === "Pending" || q.status === "In Progress",
        );
        setActiveQueries(active);
      }
    } catch (err) {
      console.error(err.response?.data);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchActiveQueries();
  }, []);

  const handleDelete = async (id) => {
    if (window.confirm("Are you sure you want to delete this query?")) {
      setDeletingId(id);
      try {
        await deleteQuery(id);
        setActiveQueries(activeQueries.filter((query) => query._id !== id));
        alert("Query deleted successfully!");
      } catch (error) {
        console.error("Error deleting query:", error);
        alert(error.response?.data?.message || "Failed to delete query");
      } finally {
        setDeletingId(null);
      }
    }
  };

  const handleEdit = (id) => {
    navigate(`/update-query/${id}`);
  };

  const toggleComments = (id) => {
    setExpandedCommentId(expandedCommentId === id ? null : id);
  };

  const getPriorityClass = (priority) => {
    switch (priority) {
      case "High":
        return "priority-high";
      case "Medium":
        return "priority-medium";
      case "Low":
        return "priority-low";
      default:
        return "";
    }
  };

  const getStatusClass = (status) => {
    switch (status) {
      case "In Progress":
        return "status-progress";
      default:
        return "status-pending";
    }
  };

  // Count statistics
  const pendingCount = activeQueries.filter(
    (q) => q.status === "Pending",
  ).length;
  const inProgressCount = activeQueries.filter(
    (q) => q.status === "In Progress",
  ).length;

  if (isLoading) {
    return (
      <div className="inprogress-loading">
        <div className="spinner"></div>
        <p>Loading your active queries...</p>
      </div>
    );
  }

  return (
    <div className="inprogress-container">
      {/* Page Header */}
      <div className="page-header">
        <h1>⚡ Active Queries</h1>
        <p>Queries that are pending or in progress</p>
      </div>

      {/* Stats Cards */}
      <div className="stats-row">
        <div className="stat-card pending-stat">
          <div className="stat-icon">⏳</div>
          <div className="stat-info">
            <span className="stat-number">{pendingCount}</span>
            <span className="stat-label">Pending</span>
          </div>
        </div>
        <div className="stat-card progress-stat">
          <div className="stat-icon">⚙️</div>
          <div className="stat-info">
            <span className="stat-number">{inProgressCount}</span>
            <span className="stat-label">In Progress</span>
          </div>
        </div>
        <div className="stat-card total-stat">
          <div className="stat-icon">📋</div>
          <div className="stat-info">
            <span className="stat-number">{activeQueries.length}</span>
            <span className="stat-label">Total Active</span>
          </div>
        </div>
      </div>

      {/* Active Queries List */}
      {activeQueries.length === 0 ? (
        <div className="empty-state">
          <div className="empty-icon">✅</div>
          <h3>No Active Queries</h3>
          <p>You don't have any pending or in-progress queries right now.</p>
          <button
            className="btn-add-query"
            onClick={() => navigate("/add-query")}
          >
            + Raise New Query
          </button>
        </div>
      ) : (
        <div className="queries-list">
          {activeQueries.map((query) => (
            <div
              key={query._id}
              className={`query-card ${query.status === "In Progress" ? "progress-card" : "pending-card"}`}
            >
              <div className="card-header">
                <div className="header-left">
                  <h3 className="query-title">{query.title}</h3>
                  <div className="header-badges">
                    <span
                      className={`priority-badge ${getPriorityClass(query.priority)}`}
                    >
                      {query.priority}
                    </span>
                    <span
                      className={`status-badge ${getStatusClass(query.status)}`}
                    >
                      {query.status || "Pending"}
                    </span>
                  </div>
                </div>
                <div className="query-date">
                  Created: {new Date(query.createdAt).toLocaleDateString()}
                </div>
              </div>
              <div className="card-body">
                <p className="query-description">{query.description}</p>
                <div className="card-actions">
                  <button
                    className="btn-view"
                    onClick={() => navigate(`/query/${query._id}`)}
                  >
                    👁️ View Details
                  </button>
                  <button
                    className="btn-comment"
                    onClick={() => toggleComments(query._id)}
                  >
                    💬 Comments
                  </button>
                  <button
                    className="btn-edit"
                    onClick={() => handleEdit(query._id)}
                  >
                    ✏️ Edit
                  </button>
                  <button
                    className="btn-delete"
                    onClick={() => handleDelete(query._id)}
                    disabled={deletingId === query._id}
                  >
                    {deletingId === query._id ? "..." : "🗑️ Delete"}
                  </button>
                </div>
                {expandedCommentId === query._id && (
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

export default InProgress;
