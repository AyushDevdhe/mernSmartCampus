import React, { useEffect, useState } from "react";
import { useSelector } from "react-redux";
import { useNavigate } from "react-router-dom";
import {
  getAllQueries,
  assignQuery,
  updateQueryStatus,
  getEscalatedWarnings,
} from "../services/QueryApis";
import "../css/SupervisorDashboard.css";

const SupervisorDashboard = () => {
  const user = useSelector((state) => state.user.data);
  const navigate = useNavigate();
  const userRole = user?.role?.toLowerCase();

  const [allQueries, setAllQueries] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [actionLoading, setActionLoading] = useState(null);
  const [escalationWarnings, setEscalationWarnings] = useState([]);

  useEffect(() => {
    if (userRole !== "supervisor") {
      if (userRole === "admin") {
        navigate("/admin-dashboard", { replace: true });
      } else if (userRole === "student") {
        navigate("/dashboard", { replace: true });
      } else {
        navigate("/", { replace: true });
      }
    }
  }, [userRole, navigate]);

  const fetchAllQueries = async () => {
    setIsLoading(true);
    try {
      const res = await getAllQueries();
      if (res?.data?.success) {
        setAllQueries(res.data.queries);
      }
    } catch (error) {
      console.error("Error fetching queries:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const fetchEscalationWarnings = async () => {
    try {
      const res = await getEscalatedWarnings();
      if (res?.data?.success) {
        const newWarnings = res.data.escalatedWarnings;
        setEscalationWarnings(newWarnings);

        const unseenWarnings = newWarnings.filter(
          (warning) => !localStorage.getItem(`warning_seen_${warning._id}`),
        );

        if (unseenWarnings.length > 0) {
          alert(
            `⚠️ Attention: ${unseenWarnings.length} new query(s) have exceeded 24 hours without resolution!`,
          );
          unseenWarnings.forEach((warning) => {
            localStorage.setItem(`warning_seen_${warning._id}`, "true");
          });
        }
      }
    } catch (error) {
      console.error("Error fetching escalation warnings:", error);
    }
  };

  useEffect(() => {
    if (userRole === "supervisor") {
      fetchAllQueries();
      fetchEscalationWarnings();
      const interval = setInterval(fetchEscalationWarnings, 60000);
      return () => clearInterval(interval);
    }
  }, [userRole]);

  const handleAssign = async (queryId) => {
    setActionLoading(queryId);
    try {
      const res = await assignQuery(queryId);
      if (res?.data?.success) {
        alert("Query assigned successfully!");
        fetchAllQueries();
      }
    } catch (error) {
      console.error("Error assigning query:", error);
      alert(error.response?.data?.message || "Failed to assign query");
    } finally {
      setActionLoading(null);
    }
  };

  const handleStatusUpdate = async (queryId, newStatus) => {
    setActionLoading(queryId);
    try {
      const res = await updateQueryStatus(queryId, newStatus);
      if (res?.data?.success) {
        alert(`Query marked as ${newStatus}!`);
        fetchAllQueries();
      }
    } catch (error) {
      console.error("Error updating status:", error);
      alert(error.response?.data?.message || "Failed to update status");
    } finally {
      setActionLoading(null);
    }
  };

  // Filter queries
  const pendingQueries = allQueries.filter(
    (q) => q.status === "Pending" && !q.assignedTo,
  );
  const assignedToMe = allQueries.filter(
    (q) => q.assignedTo?._id === user?._id && q.status !== "Resolved",
  );

  // Calculate stats
  const totalAssigned = assignedToMe.length;
  const totalPending = pendingQueries.length;
  const avgResolutionTime = "~2.5 days"; // This can be calculated from actual data

  const getPriorityIcon = (priority) => {
    switch (priority) {
      case "High":
        return "🔴";
      case "Medium":
        return "🟡";
      case "Low":
        return "🟢";
      default:
        return "⚪";
    }
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

  if (userRole !== "supervisor") {
    return (
      <div className="supervisor-loading">
        <div className="spinner"></div>
        <p>Redirecting...</p>
      </div>
    );
  }

  if (isLoading) {
    return (
      <div className="supervisor-loading">
        <div className="spinner"></div>
        <p>Loading your dashboard...</p>
      </div>
    );
  }

  return (
    <div className="supervisor-dashboard">
      {/* Welcome Section */}
      <div className="welcome-section">
        <div className="welcome-content">
          <h1>Welcome back, {user?.firstName}! 👋</h1>
          <p>Here's what's happening with your assigned queries today.</p>
        </div>
        <div className="welcome-stats">
          <div className="stat-badge">
            <span className="stat-value">{assignedToMe.length}</span>
            <span className="stat-label">Active Queries</span>
          </div>
        </div>
      </div>

      {/* Stats Grid */}
      <div className="stats-grid">
        <div className="stat-card assigned">
          <div className="stat-icon">📋</div>
          <div className="stat-info">
            <span className="stat-number">{totalAssigned}</span>
            <span className="stat-title">Assigned to Me</span>
          </div>
        </div>
        <div className="stat-card pending">
          <div className="stat-icon">⏳</div>
          <div className="stat-info">
            <span className="stat-number">{totalPending}</span>
            <span className="stat-title">Available to Assign</span>
          </div>
        </div>
        <div className="stat-card resolved">
          <div className="stat-icon">✅</div>
          <div className="stat-info">
            <span className="stat-number" id="resolvedCount">
              0
            </span>
            <span className="stat-title">Resolved This Month</span>
          </div>
        </div>
        <div className="stat-card time">
          <div className="stat-icon">⏱️</div>
          <div className="stat-info">
            <span className="stat-number">{avgResolutionTime}</span>
            <span className="stat-title">Avg Resolution Time</span>
          </div>
        </div>
      </div>

      {/* Escalation Warning Banner */}
      {escalationWarnings.length > 0 && (
        <div className="escalation-banner">
          <span className="banner-icon">⚠️</span>
          <div className="banner-content">
            <strong>Escalation Warning:</strong>
            <span>
              {escalationWarnings.length} query(s) have exceeded 24 hours.
              Please take action.
            </span>
          </div>
        </div>
      )}

      {/* Two Column Layout */}
      <div className="dashboard-columns">
        {/* Pending Queries Section */}
        <div className="column">
          <div className="section-header">
            <h2>📋 Available to Assign</h2>
            <span className="section-badge">
              {pendingQueries.length} pending
            </span>
          </div>

          {pendingQueries.length === 0 ? (
            <div className="empty-state">
              <div className="empty-icon">✅</div>
              <p>No pending queries to assign.</p>
            </div>
          ) : (
            <div className="queries-list">
              {pendingQueries.map((query) => (
                <div key={query._id} className="query-card pending-card">
                  <div className="card-header">
                    <div className="student-info">
                      <span className="student-avatar">
                        {query.user?.firstName?.charAt(0) || "S"}
                      </span>
                      <div>
                        <div className="student-name">
                          {query.user?.firstName} {query.user?.lastName}
                        </div>
                        <div className="query-title-small">{query.title}</div>
                      </div>
                    </div>
                    <div
                      className={`priority-tag ${getPriorityClass(query.priority)}`}
                    >
                      {getPriorityIcon(query.priority)} {query.priority}
                    </div>
                  </div>
                  <div className="card-body">
                    <p className="query-description">{query.description}</p>
                    <div className="card-footer">
                      <button
                        className="btn-assign"
                        onClick={() => handleAssign(query._id)}
                        disabled={actionLoading === query._id}
                      >
                        {actionLoading === query._id
                          ? "Assigning..."
                          : "📌 Assign to Me"}
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Assigned to Me Section */}
        <div className="column">
          <div className="section-header">
            <h2>🔧 In Progress</h2>
            <span className="section-badge">
              {assignedToMe.length} assigned
            </span>
          </div>

          {assignedToMe.length === 0 ? (
            <div className="empty-state">
              <div className="empty-icon">📋</div>
              <p>No queries assigned to you yet.</p>
            </div>
          ) : (
            <div className="queries-list">
              {assignedToMe.map((query) => (
                <div key={query._id} className="query-card assigned-card">
                  <div className="card-header">
                    <div className="student-info">
                      <span className="student-avatar">
                        {query.user?.firstName?.charAt(0) || "S"}
                      </span>
                      <div>
                        <div className="student-name">
                          {query.user?.firstName} {query.user?.lastName}
                        </div>
                        <div className="query-title-small">{query.title}</div>
                      </div>
                    </div>
                    <div
                      className={`priority-tag ${getPriorityClass(query.priority)}`}
                    >
                      {getPriorityIcon(query.priority)} {query.priority}
                    </div>
                  </div>
                  <div className="card-body">
                    <p className="query-description">{query.description}</p>

                    {/* ========== ADD FLAG BADGE HERE ========== */}
                    {query.isSpam === "suspicious" && (
                      <div className="flag-badge suspicious">
                        ⚠️ Flagged for Review
                      </div>
                    )}
                    {query.isSpam === "spam" && (
                      <div className="flag-badge spam">🚫 Blocked as Spam</div>
                    )}
                    {/* ======================================== */}

                    {query.adminAction && query.adminAction !== "none" && (
                      <div className="admin-warning-tag">
                        ⚠️ Admin Action: {query.adminAction.toUpperCase()}
                      </div>
                    )}
                    <div className="card-footer">
                      <button
                        className="btn-view"
                        onClick={() => navigate(`/query/${query._id}`)}
                      >
                        👁️ View
                      </button>
                      <button
                        className="btn-resolve"
                        onClick={() =>
                          handleStatusUpdate(query._id, "Resolved")
                        }
                        disabled={actionLoading === query._id}
                      >
                        {actionLoading === query._id
                          ? "..."
                          : "✅ Mark Resolved"}
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Quick Actions */}
      <div className="quick-actions">
        <h3>Quick Actions</h3>
        <div className="actions-grid">
          <div
            className="action-card"
            onClick={() => navigate("/assigned-queries")}
          >
            <span className="action-icon">📌</span>
            <span>View All Assigned</span>
          </div>
          <div
            className="action-card"
            onClick={() => navigate("/resolved-queries")}
          >
            <span className="action-icon">✅</span>
            <span>View Resolved History</span>
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

export default SupervisorDashboard;
