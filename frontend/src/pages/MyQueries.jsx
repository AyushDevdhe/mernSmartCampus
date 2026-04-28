import React, { useEffect, useState } from "react";
import { useSelector } from "react-redux";
import { useNavigate } from "react-router-dom";
import { getQueriesByUser, deleteQuery } from "../services/QueryApis";
import CommentSection from "../components/CommentSection";
import "../css/MyQueries.css";

const MyQueries = () => {
  const user = useSelector((state) => state.user.data);
  const navigate = useNavigate();
  const [resolvedQueries, setResolvedQueries] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [deletingId, setDeletingId] = useState(null);
  const [expandedCommentId, setExpandedCommentId] = useState(null);

  const fetchResolvedQueries = async () => {
    setIsLoading(true);
    try {
      const res = await getQueriesByUser();
      if (res) {
        const allQueries = res?.data?.queries || [];
        // Filter ONLY Resolved queries
        const resolved = allQueries.filter((q) => q.status === "Resolved");
        setResolvedQueries(resolved);
      }
    } catch (err) {
      console.error(err.response?.data);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchResolvedQueries();
  }, []);

  const handleDelete = async (id) => {
    if (window.confirm("Are you sure you want to delete this query?")) {
      setDeletingId(id);
      try {
        await deleteQuery(id);
        setResolvedQueries(resolvedQueries.filter((query) => query._id !== id));
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

  if (isLoading) {
    return (
      <div className="myqueries-loading">
        <div className="spinner"></div>
        <p>Loading your resolved queries...</p>
      </div>
    );
  }

  return (
    <div className="myqueries-container">
      <div className="page-header">
        <h1>✅ Resolved Queries</h1>
        <p>Queries that have been resolved by the support team</p>
        <button
          className="btn-new-query"
          onClick={() => navigate("/add-query")}
        >
          + Raise New Query
        </button>
      </div>

      {resolvedQueries.length === 0 ? (
        <div className="empty-state">
          <div className="empty-icon">📋</div>
          <h3>No Resolved Queries Yet</h3>
          <p>Your resolved queries will appear here once they are resolved.</p>
          <button
            className="btn-add-first"
            onClick={() => navigate("/add-query")}
          >
            + Raise a Query
          </button>
        </div>
      ) : (
        <div className="queries-grid">
          {resolvedQueries.map((query) => (
            <div key={query._id} className="query-card resolved-card">
              <div className="card-header">
                <div className="header-left">
                  <h3 className="query-title">{query.title}</h3>
                  <div className="header-badges">
                    <span
                      className={`priority-badge ${getPriorityClass(query.priority)}`}
                    >
                      {query.priority}
                    </span>
                    <span className="status-badge status-resolved">
                      Resolved
                    </span>
                  </div>
                </div>
                <div className="query-date">
                  Resolved: {new Date(query.updatedAt).toLocaleDateString()}
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
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default MyQueries;
