import React, { useEffect, useState } from "react";
import { useSelector } from "react-redux";
import { useNavigate } from "react-router-dom";
import { getQueriesByUser } from "../services/QueryApis";
import "../css/StudentDashboard.css";

const Dashboard = () => {
  const user = useSelector((state) => state.user.data);
  const navigate = useNavigate();
  const userRole = user?.role?.toLowerCase();

  const [userQueries, setUserQueries] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [recentQueries, setRecentQueries] = useState([]);

  useEffect(() => {
    if (userRole === "admin") {
      navigate("/admin-dashboard", { replace: true });
    } else if (userRole === "supervisor") {
      navigate("/supervisor-dashboard", { replace: true });
    }
  }, [userRole, navigate]);

  useEffect(() => {
    if (userRole === "student") {
      const fetchQueries = async () => {
        setIsLoading(true);
        try {
          const res = await getQueriesByUser();
          if (res) {
            const queries = res?.data?.queries || [];
            setUserQueries(queries);
            // Get last 3 queries for recent section
            setRecentQueries(queries.slice(0, 3));
          }
        } catch (err) {
          console.error(err.response?.data);
        } finally {
          setIsLoading(false);
        }
      };
      fetchQueries();
    }
  }, [user, userRole]);

  useEffect(() => {
    if (user?.isBlocked) {
      alert("🚫 Your account has been BLOCKED. Contact Admin.");
      navigate("/login");
    }
  }, [user, navigate]);

  // Calculate stats
  const totalQueries = userQueries.length;
  const resolvedQueries = userQueries.filter(
    (q) => q.status === "Resolved",
  ).length;
  const inProgressQueries = userQueries.filter(
    (q) => q.status === "In Progress",
  ).length;
  const pendingQueries = userQueries.filter(
    (q) => q.status === "Pending",
  ).length;

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
      case "Resolved":
        return "status-resolved";
      case "In Progress":
        return "status-progress";
      default:
        return "status-pending";
    }
  };

  if (!userRole || userRole === "admin" || userRole === "supervisor") {
    return (
      <div className="student-loading">
        <div className="spinner"></div>
        <p>Redirecting...</p>
      </div>
    );
  }

  if (isLoading) {
    return (
      <div className="student-loading">
        <div className="spinner"></div>
        <p>Loading your dashboard...</p>
      </div>
    );
  }

  return (
    <div className="student-dashboard">
      {/* Welcome Section */}
      <div className="welcome-section">
        <div className="welcome-content">
          <h1>Welcome back, {user?.firstName}! 👋</h1>
          <p>Track your queries and stay updated on their progress.</p>
        </div>
        <div className="welcome-stats">
          <div className="stat-badge">
            <span className="stat-value">{totalQueries}</span>
            <span className="stat-label">Total Queries</span>
          </div>
        </div>
      </div>

      {/* Stats Grid */}
      <div className="stats-grid">
        <div className="stat-card total">
          <div className="stat-icon">📋</div>
          <div className="stat-info">
            <span className="stat-number">{totalQueries}</span>
            <span className="stat-title">Total Queries</span>
          </div>
        </div>
        <div className="stat-card resolved">
          <div className="stat-icon">✅</div>
          <div className="stat-info">
            <span className="stat-number">{resolvedQueries}</span>
            <span className="stat-title">Resolved</span>
          </div>
        </div>
        <div className="stat-card progress">
          <div className="stat-icon">⚙️</div>
          <div className="stat-info">
            <span className="stat-number">{inProgressQueries}</span>
            <span className="stat-title">In Progress</span>
          </div>
        </div>
        <div className="stat-card pending">
          <div className="stat-icon">⏳</div>
          <div className="stat-info">
            <span className="stat-number">{pendingQueries}</span>
            <span className="stat-title">Pending</span>
          </div>
        </div>
      </div>

      {/* Recent Queries Section */}
      <div className="recent-section">
        <div className="section-header">
          <h2>📋 Recent Queries</h2>
          <button
            className="view-all-btn"
            onClick={() => navigate("/my-queries")}
          >
            View All →
          </button>
        </div>

        {recentQueries.length === 0 ? (
          <div className="empty-state">
            <div className="empty-icon">📝</div>
            <p>No queries yet. Click "Add Query" to create one.</p>
            <button
              className="btn-add-query"
              onClick={() => navigate("/add-query")}
            >
              + Add Your First Query
            </button>
          </div>
        ) : (
          <div className="recent-grid">
            {recentQueries.map((query) => (
              <div key={query._id} className="query-card">
                <div className="card-header">
                  <h3 className="query-title">{query.title}</h3>
                  <span
                    className={`priority-badge ${getPriorityClass(query.priority)}`}
                  >
                    {query.priority}
                  </span>
                </div>
                <div className="card-body">
                  <p className="query-description">
                    {query.description.length > 100
                      ? `${query.description.substring(0, 100)}...`
                      : query.description}
                  </p>
                  <div className="card-meta">
                    <span
                      className={`status-badge ${getStatusClass(query.status)}`}
                    >
                      {query.status || "Pending"}
                    </span>
                    <span className="query-date">
                      {new Date(query.createdAt).toLocaleDateString()}
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
        )}
      </div>

      {/* Quick Actions */}
      <div className="quick-actions">
        <h3>Quick Actions</h3>
        <div className="actions-grid">
          <div className="action-card" onClick={() => navigate("/add-query")}>
            <span className="action-icon">➕</span>
            <span>Raise New Query</span>
          </div>
          <div className="action-card" onClick={() => navigate("/my-queries")}>
            <span className="action-icon">📋</span>
            <span>View All Queries</span>
          </div>
          <div className="action-card" onClick={() => navigate("/profile")}>
            <span className="action-icon">👤</span>
            <span>View Profile</span>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;
