import React, { useEffect, useState } from "react";
import { useSelector } from "react-redux";
import { useNavigate } from "react-router-dom";
import { getAllQueries } from "../services/QueryApis";
import "../css/ResolvedQueries.css";

const ResolvedQueries = () => {
  const user = useSelector((state) => state.user.data);
  const navigate = useNavigate();
  const [resolvedQueries, setResolvedQueries] = useState([]);
  const [isLoading, setIsLoading] = useState(false);

  const fetchResolvedQueries = async () => {
    setIsLoading(true);
    try {
      const res = await getAllQueries();
      if (res?.data?.success) {
        const myResolved = res.data.queries.filter(
          (q) => q.assignedTo?._id === user?._id && q.status === "Resolved",
        );
        setResolvedQueries(myResolved);
      }
    } catch (error) {
      console.error("Error fetching resolved queries:", error);
      alert(error.response?.data?.message || "Failed to fetch queries");
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    if (user?.role === "supervisor") {
      fetchResolvedQueries();
    }
  }, [user]);

  if (isLoading) {
    return (
      <div className="resolved-loading">
        <div className="spinner"></div>
        <p>Loading resolved queries...</p>
      </div>
    );
  }

  return (
    <div className="resolved-queries-container">
      <div className="page-header">
        <h1>✅ Resolved Queries</h1>
        <p>Queries successfully resolved by you</p>
      </div>

      {resolvedQueries.length === 0 ? (
        <div className="empty-state">
          <div className="empty-icon">📋</div>
          <h3>No Resolved Queries Yet</h3>
          <p>Queries you resolve will appear here.</p>
        </div>
      ) : (
        <div className="queries-list">
          <div className="stats-banner">
            <span className="stats-count">{resolvedQueries.length}</span>
            <span className="stats-label">Total Queries Resolved</span>
          </div>

          <div className="queries-grid">
            {resolvedQueries.map((query) => (
              <div key={query._id} className="resolved-card">
                <div className="card-header">
                  <div className="student-info">
                    <span className="student-avatar">
                      {query.user?.firstName?.charAt(0) || "S"}
                    </span>
                    <span className="student-name">
                      {query.user?.firstName} {query.user?.lastName}
                    </span>
                  </div>
                  <span className="resolved-badge">✅ Resolved</span>
                </div>
                <div className="card-body">
                  <h3 className="query-title">{query.title}</h3>
                  <p className="query-description">{query.description}</p>
                  <div className="card-meta">
                    <span className="resolved-date">
                      Resolved on: {new Date(query.updatedAt).toLocaleString()}
                    </span>
                    <span className="created-date">
                      Created: {new Date(query.createdAt).toLocaleDateString()}
                    </span>
                  </div>
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
        </div>
      )}
    </div>
  );
};

export default ResolvedQueries;
