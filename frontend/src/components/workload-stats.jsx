import React, { useEffect, useState } from "react";
import axios from "axios";
import "../css/workload-stats.css";

const WorkloadStats = () => {
  const [workloads, setWorkloads] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [autoAssignEnabled, setAutoAssignEnabled] = useState(false);
  const [isAdmin, setIsAdmin] = useState(false);

  useEffect(() => {
    fetchWorkloadStats();
    fetchAutoAssignSetting();

    // Check if user is admin
    const user = JSON.parse(localStorage.getItem("user") || "{}");
    setIsAdmin(user?.role === "admin");
  }, []);

  const fetchWorkloadStats = async () => {
    setIsLoading(true);
    try {
      const res = await axios.get(
        `${process.env.REACT_APP_BASE_URL}/users/workload-stats`,
        {
          withCredentials: true,
        },
      );
      if (res?.data?.success) {
        setWorkloads(res.data.workloads);
      }
    } catch (error) {
      console.error("Error fetching workload stats:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const fetchAutoAssignSetting = async () => {
    try {
      const res = await axios.get(
        `${process.env.REACT_APP_BASE_URL}/users/auto-assign-setting`,
        {
          withCredentials: true,
        },
      );
      if (res?.data?.success) {
        setAutoAssignEnabled(res.data.enabled);
      }
    } catch (error) {
      console.error("Error fetching auto-assign setting:", error);
    }
  };

  const toggleAutoAssign = async () => {
    try {
      const res = await axios.put(
        `${process.env.REACT_APP_BASE_URL}/users/auto-assign-setting`,
        { enabled: !autoAssignEnabled },
        { withCredentials: true },
      );
      if (res?.data?.success) {
        setAutoAssignEnabled(!autoAssignEnabled);
        alert(`Auto-assign ${!autoAssignEnabled ? "enabled" : "disabled"}`);
      }
    } catch (error) {
      console.error("Error toggling auto-assign:", error);
      alert("Failed to update auto-assign setting");
    }
  };

  const getWorkloadColor = (score) => {
    if (score < 5) return "low";
    if (score < 15) return "medium";
    return "high";
  };

  if (isLoading) {
    return (
      <div className="workload-loading">
        <div className="spinner"></div>
        <p>Loading workload stats...</p>
      </div>
    );
  }

  return (
    <div className="workload-container">
      {isAdmin && (
        <div className="auto-assign-control">
          <div className="auto-assign-info">
            <span className="auto-assign-icon">🤖</span>
            <div>
              <h4>AI Auto-Assign</h4>
              <p>
                New queries are automatically assigned to the least loaded
                supervisor
              </p>
            </div>
          </div>
          <label className="toggle-switch">
            <input
              type="checkbox"
              checked={autoAssignEnabled}
              onChange={toggleAutoAssign}
            />
            <span className="toggle-slider"></span>
          </label>
        </div>
      )}

      <h3 className="workload-title">📊 Supervisor Workload Dashboard</h3>

      <div className="workload-grid">
        {workloads.map((sup) => (
          <div
            key={sup._id}
            className={`workload-card ${getWorkloadColor(sup.workloadScore)}`}
          >
            <div className="workload-card-header">
              <div className="supervisor-avatar">
                {sup.name?.charAt(0) || "S"}
              </div>
              <div className="supervisor-info">
                <h4>{sup.name}</h4>
                <span className="supervisor-email">{sup.email}</span>
              </div>
            </div>
            <div className="workload-stats">
              <div className="stat-item">
                <span className="stat-value">{sup.assignedCount}</span>
                <span className="stat-label">Assigned</span>
              </div>
              <div className="stat-item">
                <span className="stat-value">{sup.highPriorityCount}</span>
                <span className="stat-label">High Priority</span>
              </div>
              <div className="stat-item">
                <span className="stat-value">{sup.resolvedCount}</span>
                <span className="stat-label">Resolved (30d)</span>
              </div>
              <div className="stat-item">
                <span className="stat-value">{sup.avgResolutionTime}h</span>
                <span className="stat-label">Avg Resolution</span>
              </div>
            </div>
            <div className="workload-score">
              <div className="score-bar">
                <div
                  className="score-fill"
                  style={{ width: `${Math.min(sup.workloadScore, 100)}%` }}
                ></div>
              </div>
              <span className="score-value">Load: {sup.workloadScore}</span>
            </div>
            {sup.workloadScore === workloads[0]?.workloadScore &&
              sup.workloadScore < workloads[1]?.workloadScore && (
                <div className="least-loaded-badge">🟢 Least Loaded</div>
              )}
          </div>
        ))}
      </div>

      {workloads.length === 0 && (
        <div className="no-supervisors">
          <p>No supervisors found.</p>
        </div>
      )}
    </div>
  );
};

export default WorkloadStats;
