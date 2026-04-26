import { useEffect, useState } from "react";
import { useSelector } from "react-redux";
import { useNavigate } from "react-router-dom";
import {
  getAllQueries,
  getAllSupervisors,
  getEscalatedQueries,
  takeAdminAction,
} from "../services/QueryApis";
import "../css/AdminDashboard.css";
import { signupApi, sendOtpApi } from "../services/GetService";
import { getCriticalEscalations } from "../services/QueryApis";
const AdminDashboard = () => {
  const user = useSelector((state) => state.user.data);
  const navigate = useNavigate();
  const userRole = user?.role?.toLowerCase();

  const [activeTab, setActiveTab] = useState("dashboard");
  const [allQueries, setAllQueries] = useState([]);
  const [supervisors, setSupervisors] = useState([]);
  const [escalatedQueries, setEscalatedQueries] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [filter, setFilter] = useState("all");
  const [lastUpdated, setLastUpdated] = useState(new Date());
  const [criticalEscalations, setCriticalEscalations] = useState([]);

  const [showCreateUserModal, setShowCreateUserModal] = useState(false);
  const [newUser, setNewUser] = useState({
    firstName: "",
    lastName: "",
    email: "",
    password: "",
    role: "supervisor",
  });

  useEffect(() => {
    if (userRole !== "admin") {
      if (userRole === "supervisor") {
        navigate("/supervisor-dashboard", { replace: true });
      } else if (userRole === "student") {
        navigate("/dashboard", { replace: true });
      } else {
        navigate("/", { replace: true });
      }
    }
  }, [userRole, navigate]);

  const fetchCriticalEscalations = async () => {
    try {
      const res = await getCriticalEscalations();
      if (res?.data?.success) {
        setCriticalEscalations(res.data.criticalEscalations);
        if (
          res.data.criticalEscalations.length > 0 &&
          criticalEscalations.length === 0
        ) {
          alert(
            `🚨 URGENT: ${res.data.criticalEscalations.length} query(s) have exceeded 48 hours! Immediate attention required.`,
          );
        }
      }
    } catch (error) {
      console.error("Error fetching critical escalations:", error);
    }
  };

  useEffect(() => {
    if (userRole === "admin") {
      fetchCriticalEscalations();
      const interval = setInterval(fetchCriticalEscalations, 60000);
      return () => clearInterval(interval);
    }
  }, [userRole]);

  const handleCreateUser = async () => {
    try {
      // First send OTP
      const otpRes = await sendOtpApi(newUser.email);
      if (!otpRes?.data?.success) {
        alert("Failed to send OTP");
        return;
      }

      const otp = prompt("Enter OTP sent to the email:");
      if (!otp) return;

      const payload = {
        ...newUser,
        otp,
        createdByAdmin: true, // Flag to allow supervisor/admin creation
      };

      const res = await signupApi(payload);
      if (res?.data?.success) {
        alert(`${newUser.role} created successfully!`);
        setShowCreateUserModal(false);
        setNewUser({
          firstName: "",
          lastName: "",
          email: "",
          password: "",
          role: "supervisor",
        });
        fetchDashboardData(); // Refresh data
      } else {
        alert(res?.data?.message || "Creation failed");
      }
    } catch (error) {
      console.error("Error creating user:", error);
      alert(error.response?.data?.message || "Failed to create user");
    }
  };

  const fetchDashboardData = async () => {
    setIsLoading(true);
    try {
      const [queriesRes, supervisorsRes, escalatedRes] = await Promise.all([
        getAllQueries(),
        getAllSupervisors(),
        getEscalatedQueries(),
      ]);

      if (queriesRes?.data?.success) setAllQueries(queriesRes.data.queries);
      if (supervisorsRes?.data?.success)
        setSupervisors(supervisorsRes.data.supervisors);
      if (escalatedRes?.data?.success)
        setEscalatedQueries(escalatedRes.data.escalatedQueries);
      setLastUpdated(new Date());
    } catch (error) {
      console.error("Error fetching dashboard data:", error);
    } finally {
      setIsLoading(false);
    }
  };

  // Initial fetch
  useEffect(() => {
    if (userRole === "admin") {
      fetchDashboardData();
    }
  }, [userRole]);

  // Refresh when tab becomes visible
  useEffect(() => {
    const handleVisibilityChange = () => {
      if (!document.hidden && userRole === "admin") {
        fetchDashboardData();
      }
    };

    document.addEventListener("visibilitychange", handleVisibilityChange);

    return () => {
      document.removeEventListener("visibilitychange", handleVisibilityChange);
    };
  }, [userRole]);

  // Refresh when switching tabs
  useEffect(() => {
    if (userRole === "admin") {
      fetchDashboardData();
    }
  }, [activeTab]);

  // Auto-refresh every 30 seconds
  // useEffect(() => {
  //   if (userRole === "admin") {
  //     const interval = setInterval(() => {
  //       fetchDashboardData();
  //     }, 30000);

  //     return () => clearInterval(interval);
  //   }
  // }, [userRole]);

  // Statistics
  const totalQueries = allQueries.length;
  const pendingQueries = allQueries.filter(
    (q) => q.status === "Pending",
  ).length;
  const inProgressQueries = allQueries.filter(
    (q) => q.status === "In Progress",
  ).length;
  const resolvedQueries = allQueries.filter(
    (q) => q.status === "Resolved",
  ).length;

  const filteredQueries = allQueries.filter((q) => {
    if (filter === "all") return true;
    return q.status === filter;
  });

  const handleTakeAction = async (queryId, queryTitle) => {
    const action = prompt(
      `Select action for query: "${queryTitle}"\n\nEnter:\n- "warning" for written warning\n- "penalty" for penalty deduction\n- "escalated" for escalation notice`,
      "warning",
    );

    if (!action) return;

    if (!["warning", "penalty", "escalated"].includes(action.toLowerCase())) {
      alert("Invalid action. Use: warning, penalty, or escalated");
      return;
    }

    const message = prompt(
      "Enter additional message for the supervisor:",
      `Admin issued a ${action} for delayed resolution`,
    );

    try {
      const res = await takeAdminAction(queryId, action.toLowerCase(), message);
      if (res?.data?.success) {
        alert(`Action "${action}" taken successfully!`);
        fetchDashboardData();
      }
    } catch (error) {
      console.error("Error taking action:", error);
      alert(error.response?.data?.message || "Failed to take action");
    }
  };

  if (userRole !== "admin") {
    return (
      <div className="loading-container">
        <p>Redirecting...</p>
      </div>
    );
  }

  if (isLoading && allQueries.length === 0) {
    return (
      <div className="loading-container">
        <div className="spinner"></div>
      </div>
    );
  }

  // Render Dashboard Tab
  // Render Dashboard Tab
  const renderDashboard = () => (
    <>
      {/* Refresh Button */}
      <div style={{ textAlign: "right", marginBottom: "16px" }}>
        <button
          onClick={() => fetchDashboardData()}
          style={{
            backgroundColor: "#3b82f6",
            color: "white",
            padding: "8px 16px",
            borderRadius: "8px",
            border: "none",
            cursor: "pointer",
            fontWeight: "600",
          }}
        >
          🔄 Refresh Data
        </button>
      </div>

      {/* Stats Cards */}
      <div className="stats-grid">
        <div className="stat-card total" onClick={() => setFilter("all")}>
          <div className="stat-title">Total Queries</div>
          <div className="stat-number">{totalQueries}</div>
        </div>
        <div className="stat-card pending" onClick={() => setFilter("Pending")}>
          <div className="stat-title">Pending</div>
          <div className="stat-number">{pendingQueries}</div>
        </div>
        <div
          className="stat-card progress"
          onClick={() => setFilter("In Progress")}
        >
          <div className="stat-title">In Progress</div>
          <div className="stat-number">{inProgressQueries}</div>
        </div>
        <div
          className="stat-card resolved"
          onClick={() => setFilter("Resolved")}
        >
          <div className="stat-title">Resolved</div>
          <div className="stat-number">{resolvedQueries}</div>
        </div>
      </div>

      {/* Escalations Section */}
      {escalatedQueries.length > 0 && (
        <div className="section-card">
          <div className="section-header">
            <h2>⚠️ Escalated Issues (42hr+)</h2>
            <span className="section-badge">
              {escalatedQueries.length} Urgent
            </span>
          </div>
          <table className="query-table">
            <thead>
              <tr>
                <th>Student</th>
                <th>Title</th>
                <th>Created</th>
                <th>Hours Old</th>
                <th>Assigned To</th>
                <th>Action</th>
              </tr>
            </thead>
            <tbody>
              {escalatedQueries.map((query) => {
                const hoursOld = Math.floor(
                  (new Date() - new Date(query.createdAt)) / (1000 * 60 * 60),
                );
                return (
                  <tr key={query._id}>
                    <td>
                      {query.user?.firstName} {query.user?.lastName}
                    </td>
                    <td>{query.title}</td>
                    <td>{new Date(query.createdAt).toLocaleDateString()}</td>
                    <td className="priority-high">{hoursOld} hrs</td>
                    <td>{query.assignedTo?.firstName || "Not Assigned"}</td>
                    <td>
                      <button
                        className="action-btn action-btn-warning"
                        onClick={() => handleTakeAction(query._id, query.title)}
                      >
                        Take Action
                      </button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}

      {/* Filter Tabs */}
      <div className="filter-tabs">
        <button
          className={`filter-btn ${filter === "all" ? "active" : "inactive"}`}
          onClick={() => setFilter("all")}
        >
          All Queries
        </button>
        <button
          className={`filter-btn ${filter === "Pending" ? "active" : "inactive"}`}
          onClick={() => setFilter("Pending")}
        >
          Pending
        </button>
        <button
          className={`filter-btn ${filter === "In Progress" ? "active" : "inactive"}`}
          onClick={() => setFilter("In Progress")}
        >
          In Progress
        </button>
        <button
          className={`filter-btn ${filter === "Resolved" ? "active" : "inactive"}`}
          onClick={() => setFilter("Resolved")}
        >
          Resolved
        </button>
      </div>

      {/* All Queries Table */}
      <div className="section-card">
        <div className="section-header">
          <h2>📊 All Queries</h2>
          <span className="section-badge">
            {filteredQueries.length} Records
          </span>
        </div>
        {filteredQueries.length === 0 ? (
          <p>No queries found.</p>
        ) : (
          <table className="query-table">
            <thead>
              <tr>
                <th>Student</th>
                <th>Title</th>
                <th>Description</th>
                <th>Priority</th>
                <th>Status</th>
                <th>Assigned To</th>
                <th>Created</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {filteredQueries.map((query) => (
                <tr key={query._id}>
                  <td>
                    {query.user?.firstName} {query.user?.lastName}
                  </td>
                  <td>{query.title}</td>
                  <td>{query.description?.substring(0, 50)}...</td>
                  <td className={`priority-${query.priority?.toLowerCase()}`}>
                    {query.priority}
                  </td>
                  <td>
                    <span
                      className={`status-badge status-${query.status?.toLowerCase().replace(" ", "-")}`}
                    >
                      {query.status}
                    </span>
                  </td>
                  <td>{query.assignedTo?.firstName || "Not Assigned"}</td>
                  <td>{new Date(query.createdAt).toLocaleDateString()}</td>
                  <td>
                    <button
                      onClick={() => navigate(`/query/${query._id}`)}
                      style={{
                        padding: "4px 8px",
                        backgroundColor: "#3b82f6",
                        color: "white",
                        border: "none",
                        borderRadius: "4px",
                        cursor: "pointer",
                        fontSize: "11px",
                      }}
                    >
                      👁️ View
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </>
  );

  // Render All Queries Tab
  const renderAllQueries = () => (
    <div className="section-card">
      <div className="section-header">
        <h2>📋 All Queries</h2>
        <div style={{ display: "flex", gap: "10px", alignItems: "center" }}>
          <span className="section-badge">{allQueries.length} Total</span>
          <button
            onClick={() => fetchDashboardData()}
            style={{
              background: "#3b82f6",
              color: "white",
              border: "none",
              padding: "4px 12px",
              borderRadius: "6px",
              cursor: "pointer",
              fontSize: "12px",
            }}
          >
            🔄 Refresh
          </button>
        </div>
      </div>
      <div className="filter-tabs">
        <button
          className={`filter-btn ${filter === "all" ? "active" : "inactive"}`}
          onClick={() => setFilter("all")}
        >
          All
        </button>
        <button
          className={`filter-btn ${filter === "Pending" ? "active" : "inactive"}`}
          onClick={() => setFilter("Pending")}
        >
          Pending
        </button>
        <button
          className={`filter-btn ${filter === "In Progress" ? "active" : "inactive"}`}
          onClick={() => setFilter("In Progress")}
        >
          In Progress
        </button>
        <button
          className={`filter-btn ${filter === "Resolved" ? "active" : "inactive"}`}
          onClick={() => setFilter("Resolved")}
        >
          Resolved
        </button>
      </div>
      <table className="query-table">
        <thead>
          <tr>
            <th>Student</th>
            <th>Title</th>
            <th>Priority</th>
            <th>Status</th>
            <th>Assigned To</th>
            <th>Created</th>
          </tr>
        </thead>
        <tbody>
          {filteredQueries.map((query) => (
            <tr key={query._id}>
              <td>
                {query.user?.firstName} {query.user?.lastName}
              </td>
              <td>{query.title}</td>
              <td className={`priority-${query.priority?.toLowerCase()}`}>
                {query.priority}
              </td>
              <td>
                <span
                  className={`status-badge status-${query.status?.toLowerCase().replace(" ", "-")}`}
                >
                  {query.status}
                </span>
              </td>
              <td>{query.assignedTo?.firstName || "Not Assigned"}</td>
              <td>{new Date(query.createdAt).toLocaleDateString()}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );

  // Render Supervisors Tab
  const renderSupervisors = () => (
    <div className="section-card">
      <div className="section-header">
        <h2>👥 Supervisors</h2>
        <div style={{ display: "flex", gap: "10px", alignItems: "center" }}>
          <button
            onClick={() => setShowCreateUserModal(true)}
            style={{
              background: "#22c55e",
              color: "white",
              border: "none",
              padding: "6px 12px",
              borderRadius: "6px",
              cursor: "pointer",
              fontSize: "12px",
              fontWeight: "bold",
            }}
          >
            + New Supervisor/Admin
          </button>
          <span className="section-badge">{supervisors.length} Active</span>
          <button
            onClick={() => fetchDashboardData()}
            style={{
              background: "#3b82f6",
              color: "white",
              border: "none",
              padding: "4px 12px",
              borderRadius: "6px",
              cursor: "pointer",
              fontSize: "12px",
            }}
          >
            🔄 Refresh
          </button>
        </div>
      </div>
      {supervisors.length === 0 ? (
        <p>No supervisors registered.</p>
      ) : (
        <table className="query-table">
          <thead>
            <tr>
              <th>Name</th>
              <th>Email</th>
              <th>Assigned Queries</th>
              <th>Resolved Queries</th>
              <th>Status</th>
            </tr>
          </thead>
          <tbody>
            {supervisors.map((sup) => {
              const assignedCount = allQueries.filter(
                (q) => q.assignedTo?._id === sup._id && q.status !== "Resolved",
              ).length;
              const resolvedCount = allQueries.filter(
                (q) => q.assignedTo?._id === sup._id && q.status === "Resolved",
              ).length;
              return (
                <tr key={sup._id}>
                  <td>
                    {sup.firstName} {sup.lastName}
                  </td>
                  <td>{sup.email}</td>
                  <td>{assignedCount}</td>
                  <td>{resolvedCount}</td>
                  <td>
                    <span className="status-badge status-progress">Active</span>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      )}
    </div>
  );

  // Render Escalations Tab
  const renderEscalations = () => (
    <div className="section-card">
      <div className="section-header">
        <h2>⚠️ Escalated Issues</h2>
        <div style={{ display: "flex", gap: "10px", alignItems: "center" }}>
          <span className="section-badge">
            {escalatedQueries.length} Urgent
          </span>
          <button
            onClick={() => fetchDashboardData()}
            style={{
              background: "#3b82f6",
              color: "white",
              border: "none",
              padding: "4px 12px",
              borderRadius: "6px",
              cursor: "pointer",
              fontSize: "12px",
            }}
          >
            🔄 Refresh
          </button>
        </div>
      </div>
      {escalatedQueries.length === 0 ? (
        <p>No escalated issues. All queries are within SLA limits.</p>
      ) : (
        <table className="query-table">
          <thead>
            <tr>
              <th>Student</th>
              <th>Title</th>
              <th>Created</th>
              <th>Hours Old</th>
              <th>Assigned To</th>
              <th>Action</th>
            </tr>
          </thead>
          <tbody>
            {escalatedQueries.map((query) => {
              const hoursOld = Math.floor(
                (new Date() - new Date(query.createdAt)) / (1000 * 60 * 60),
              );
              return (
                <tr key={query._id}>
                  <td>
                    {query.user?.firstName} {query.user?.lastName}
                  </td>
                  <td>{query.title}</td>
                  <td>{new Date(query.createdAt).toLocaleDateString()}</td>
                  <td className="priority-high">{hoursOld} hrs</td>
                  <td>{query.assignedTo?.firstName || "Not Assigned"}</td>
                  <td>
                    <button
                      className="action-btn action-btn-warning"
                      onClick={() => handleTakeAction(query._id, query.title)}
                    >
                      Take Action
                    </button>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      )}
    </div>
  );

  return (
    <div className="admin-dashboard">
      <div className="admin-header">
        <h1>Admin Dashboard</h1>
        <div className="welcome-badge">
          Welcome, {user?.firstName} {user?.lastName}
          <span className="last-updated">
            Last updated: {lastUpdated.toLocaleTimeString()}
          </span>
        </div>
      </div>

      <div className="live-indicator">
        <span className="live-dot"></span>
        Live Updates Active
      </div>

      {criticalEscalations.length > 0 && (
        <div
          className="critical-escalation-banner"
          style={{
            background: "#fee2e2",
            borderLeft: "4px solid #dc2626",
            padding: "12px 16px",
            marginBottom: "20px",
            borderRadius: "8px",
          }}
        >
          <span style={{ fontWeight: "bold", color: "#dc2626" }}>
            🚨 CRITICAL:
          </span>
          <span style={{ marginLeft: "8px" }}>
            {criticalEscalations.length} query(s) have exceeded 48 hours!
            Immediate admin action required.
          </span>
        </div>
      )}

      {/* Navigation Tabs */}
      <div className="filter-tabs">
        <button
          className={`filter-btn ${activeTab === "dashboard" ? "active" : "inactive"}`}
          onClick={() => setActiveTab("dashboard")}
        >
          📊 Dashboard
        </button>
        <button
          className={`filter-btn ${activeTab === "queries" ? "active" : "inactive"}`}
          onClick={() => setActiveTab("queries")}
        >
          📋 All Queries
        </button>
        <button
          className={`filter-btn ${activeTab === "supervisors" ? "active" : "inactive"}`}
          onClick={() => setActiveTab("supervisors")}
        >
          👥 Supervisors
        </button>
        <button
          className={`filter-btn ${activeTab === "escalations" ? "active" : "inactive"}`}
          onClick={() => setActiveTab("escalations")}
        >
          ⚠️ Escalations
        </button>
      </div>

      {/* Tab Content */}
      {activeTab === "dashboard" && renderDashboard()}
      {activeTab === "queries" && renderAllQueries()}
      {activeTab === "supervisors" && renderSupervisors()}
      {activeTab === "escalations" && renderEscalations()}

      {/* Modal for creating new user */}
      {showCreateUserModal && (
        <div
          className="modal-overlay"
          style={{
            position: "fixed",
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            background: "rgba(0,0,0,0.5)",
            display: "flex",
            justifyContent: "center",
            alignItems: "center",
            zIndex: 1000,
          }}
        >
          <div
            className="modal-content"
            style={{
              background: "white",
              padding: "24px",
              borderRadius: "12px",
              width: "400px",
              maxWidth: "90%",
            }}
          >
            <h3 style={{ marginBottom: "16px" }}>Create New User</h3>

            <input
              type="text"
              placeholder="First Name"
              value={newUser.firstName}
              onChange={(e) =>
                setNewUser({ ...newUser, firstName: e.target.value })
              }
              style={{
                width: "100%",
                padding: "8px",
                margin: "8px 0",
                borderRadius: "4px",
                border: "1px solid #ccc",
              }}
            />

            <input
              type="text"
              placeholder="Last Name"
              value={newUser.lastName}
              onChange={(e) =>
                setNewUser({ ...newUser, lastName: e.target.value })
              }
              style={{
                width: "100%",
                padding: "8px",
                margin: "8px 0",
                borderRadius: "4px",
                border: "1px solid #ccc",
              }}
            />

            <input
              type="email"
              placeholder="Email"
              value={newUser.email}
              onChange={(e) =>
                setNewUser({ ...newUser, email: e.target.value })
              }
              style={{
                width: "100%",
                padding: "8px",
                margin: "8px 0",
                borderRadius: "4px",
                border: "1px solid #ccc",
              }}
            />

            <input
              type="password"
              placeholder="Password"
              value={newUser.password}
              onChange={(e) =>
                setNewUser({ ...newUser, password: e.target.value })
              }
              style={{
                width: "100%",
                padding: "8px",
                margin: "8px 0",
                borderRadius: "4px",
                border: "1px solid #ccc",
              }}
            />

            <select
              value={newUser.role}
              onChange={(e) => setNewUser({ ...newUser, role: e.target.value })}
              style={{
                width: "100%",
                padding: "8px",
                margin: "8px 0",
                borderRadius: "4px",
                border: "1px solid #ccc",
              }}
            >
              <option value="supervisor">Supervisor</option>
              <option value="admin">Admin</option>
            </select>

            <div style={{ display: "flex", gap: "8px", marginTop: "16px" }}>
              <button
                onClick={handleCreateUser}
                style={{
                  background: "#3b82f6",
                  color: "white",
                  padding: "8px 16px",
                  border: "none",
                  borderRadius: "6px",
                  cursor: "pointer",
                  flex: 1,
                }}
              >
                Create
              </button>
              <button
                onClick={() => setShowCreateUserModal(false)}
                style={{
                  background: "#ef4444",
                  color: "white",
                  padding: "8px 16px",
                  border: "none",
                  borderRadius: "6px",
                  cursor: "pointer",
                  flex: 1,
                }}
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};;

export default AdminDashboard;
