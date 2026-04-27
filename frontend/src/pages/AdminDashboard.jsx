import { useCallback, useEffect, useState } from "react";
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

const fetchCriticalEscalations = useCallback(async () => {
  try {
    const res = await getCriticalEscalations();
    if (res?.data?.success) {
      const newEscalations = res.data.criticalEscalations;

      // Check for NEW escalations (not seen before)
      const unseenEscalations = newEscalations.filter(
        (esc) => !localStorage.getItem(`critical_seen_${esc._id}`),
      );

      // Show alert only for new escalations
      if (unseenEscalations.length > 0) {
        alert(
          `🚨 URGENT: ${unseenEscalations.length} new query(s) have exceeded 48 hours! Immediate attention required.`,
        );
        // Mark these escalations as seen
        unseenEscalations.forEach((esc) => {
          localStorage.setItem(`critical_seen_${esc._id}`, "true");
        });
      }

      setCriticalEscalations(newEscalations);
    }
  } catch (error) {
    console.error("Error fetching critical escalations:", error);
  }
}, []);

  useEffect(() => {
    if (userRole === "admin") {
      fetchCriticalEscalations();
      const interval = setInterval(fetchCriticalEscalations, 60000);
      return () => clearInterval(interval);
    }
  }, [userRole, fetchCriticalEscalations]);

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

  const fetchDashboardData = useCallback(async () => {
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
  }, []);

  // Initial fetch
  useEffect(() => {
    if (userRole === "admin") {
      fetchDashboardData();
    }
  }, [userRole, fetchDashboardData]);

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
  }, [userRole, fetchDashboardData]);

  // Refresh when switching tabs
  useEffect(() => {
    if (userRole === "admin") {
      fetchDashboardData();
    }
  }, [activeTab, userRole, fetchDashboardData]);

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
      <div className="mb-4 text-right">
        <button
          onClick={() => fetchDashboardData()}
          className="rounded-lg bg-sky-600 px-4 py-2 text-sm font-semibold text-white transition hover:bg-sky-700"
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
      {criticalEscalations.length > 0 && (
        <div className="section-card">
          <div className="section-header">
            <h2>⚠️ Escalated Issues (42hr+)</h2>
            <span className="section-badge">
              {criticalEscalations.length} Urgent
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
              {criticalEscalations.map((query) => {
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
                      className="rounded bg-sky-600 px-2.5 py-1 text-xs font-semibold text-white transition hover:bg-sky-700"
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
        <div className="flex items-center gap-2">
          <span className="section-badge">{allQueries.length} Total</span>
          <button
            onClick={() => fetchDashboardData()}
            className="rounded-lg bg-sky-600 px-3 py-1.5 text-xs font-semibold text-white transition hover:bg-sky-700"
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
        <div className="flex flex-wrap items-center gap-2">
          <button
            onClick={() => setShowCreateUserModal(true)}
            className="rounded-lg bg-emerald-600 px-3 py-1.5 text-xs font-semibold text-white transition hover:bg-emerald-700"
          >
            + New Supervisor/Admin
          </button>
          <span className="section-badge">{supervisors.length} Active</span>
          <button
            onClick={() => fetchDashboardData()}
            className="rounded-lg bg-sky-600 px-3 py-1.5 text-xs font-semibold text-white transition hover:bg-sky-700"
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
  // Render Escalations Tab
  const renderEscalations = () => (
    <div className="section-card">
      <div className="section-header">
        <h2>⚠️ Escalated Issues</h2>
        <div className="flex items-center gap-2">
          <span className="section-badge">
            {criticalEscalations.length} Urgent
          </span>
          <button
            onClick={() => fetchDashboardData()}
            className="rounded-lg bg-sky-600 px-3 py-1.5 text-xs font-semibold text-white transition hover:bg-sky-700"
          >
            🔄 Refresh
          </button>
        </div>
      </div>
      {criticalEscalations.length === 0 ? (
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
            {criticalEscalations.map((query) => {
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
        <div className="mb-5 rounded-xl border border-rose-200 bg-rose-50 px-4 py-3">
          <span className="font-semibold text-rose-700">🚨 CRITICAL:</span>
          <span className="ml-2 text-sm text-rose-700">
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
        <div className="modal-overlay">
          <div className="modal-content">
            <h3 className="mb-4 text-lg font-semibold text-slate-900">
              Create New User
            </h3>

            <input
              type="text"
              placeholder="First Name"
              value={newUser.firstName}
              onChange={(e) =>
                setNewUser({ ...newUser, firstName: e.target.value })
              }
              className="my-2 w-full rounded-lg border border-slate-300 px-3 py-2 text-sm outline-none transition focus:border-sky-500 focus:ring-2 focus:ring-sky-100"
            />

            <input
              type="text"
              placeholder="Last Name"
              value={newUser.lastName}
              onChange={(e) =>
                setNewUser({ ...newUser, lastName: e.target.value })
              }
              className="my-2 w-full rounded-lg border border-slate-300 px-3 py-2 text-sm outline-none transition focus:border-sky-500 focus:ring-2 focus:ring-sky-100"
            />

            <input
              type="email"
              placeholder="Email"
              value={newUser.email}
              onChange={(e) =>
                setNewUser({ ...newUser, email: e.target.value })
              }
              className="my-2 w-full rounded-lg border border-slate-300 px-3 py-2 text-sm outline-none transition focus:border-sky-500 focus:ring-2 focus:ring-sky-100"
            />

            <input
              type="password"
              placeholder="Password"
              value={newUser.password}
              onChange={(e) =>
                setNewUser({ ...newUser, password: e.target.value })
              }
              className="my-2 w-full rounded-lg border border-slate-300 px-3 py-2 text-sm outline-none transition focus:border-sky-500 focus:ring-2 focus:ring-sky-100"
            />

            <select
              value={newUser.role}
              onChange={(e) => setNewUser({ ...newUser, role: e.target.value })}
              className="my-2 w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm outline-none transition focus:border-sky-500 focus:ring-2 focus:ring-sky-100"
            >
              <option value="supervisor">Supervisor</option>
              <option value="admin">Admin</option>
            </select>

            <div className="mt-4 flex gap-2">
              <button
                onClick={handleCreateUser}
                className="flex-1 rounded-lg bg-sky-600 px-4 py-2 text-sm font-semibold text-white transition hover:bg-sky-700"
              >
                Create
              </button>
              <button
                onClick={() => setShowCreateUserModal(false)}
                className="flex-1 rounded-lg bg-rose-600 px-4 py-2 text-sm font-semibold text-white transition hover:bg-rose-700"
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
