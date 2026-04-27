import React, { useEffect, useState } from "react";
import { useSelector } from "react-redux";
import { useNavigate } from "react-router-dom";
import {
  getAllQueries,
  assignQuery,
  updateQueryStatus,
  getEscalatedWarnings,
} from "../services/QueryApis";
import CommentSection from "../components/CommentSection";

const SupervisorDashboard = () => {
  const user = useSelector((state) => state.user.data);
  const navigate = useNavigate();
  const userRole = user?.role?.toLowerCase();

  const [allQueries, setAllQueries] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [actionLoading, setActionLoading] = useState(null);
  const [, setAdminActions] = useState([]);
  const [escalationWarnings, setEscalationWarnings] = useState([]);
  const [expandedQueryId, setExpandedQueryId] = useState(null);

  useEffect(() => {
    // Redirect if not supervisor
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

  const toggleComments = (queryId) => {
    setExpandedQueryId(expandedQueryId === queryId ? null : queryId);
  };

  const fetchAllQueries = async () => {
    setIsLoading(true);
    try {
      const res = await getAllQueries();
      if (res?.data?.success) {
        setAllQueries(res.data.queries);
      }
    } catch (error) {
      console.error("Error fetching queries:", error);
      alert(error.response?.data?.message || "Failed to fetch queries");
    } finally {
      setIsLoading(false);
    }
  };

  const fetchEscalationWarnings = async () => {
    try {
      const res = await getEscalatedWarnings();
      if (res?.data?.success) {
        setEscalationWarnings(res.data.escalatedWarnings);
        // Show alert for new escalations
        if (res.data.escalatedWarnings.length > 0) {
          const warningCount = res.data.escalatedWarnings.length;
          alert(
            `⚠️ Attention: ${warningCount} query(s) have exceeded 24 hours without resolution!`,
          );
        }
      }
    } catch (error) {
      console.error("Error fetching escalation warnings:", error);
    }
  };
  useEffect(() => {
    if (userRole === "supervisor") {
      fetchEscalationWarnings();
      const interval = setInterval(fetchEscalationWarnings, 60000); // Check every minute
      return () => clearInterval(interval);
    }
  }, [userRole]);

  useEffect(() => {
    if (userRole === "supervisor") {
      fetchAllQueries();
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

  // Filter queries (DEFINE THESE FIRST)
  const pendingQueries = allQueries.filter(
    (q) => q.status === "Pending" && !q.assignedTo,
  );
  const assignedToMe = allQueries.filter(
    (q) => q.assignedTo?._id === user?._id && q.status !== "Resolved",
  );
  const resolvedQueries = allQueries.filter(
    (q) => q.assignedTo?._id === user?._id && q.status === "Resolved",
  );

  // Check for admin actions on assigned queries (MOVE THIS AFTER assignedToMe is defined)
  useEffect(() => {
    // Create a copy of assignedToMe to compare
    const actions = assignedToMe.filter(
      (q) => q.adminAction && q.adminAction !== "none",
    );

    // Only update state if actions actually changed
    setAdminActions((prevActions) => {
      if (JSON.stringify(prevActions) !== JSON.stringify(actions)) {
        return actions;
      }
      return prevActions;
    });

    // Show alerts for new actions (only once per action)
    actions.forEach((action) => {
      const seenKey = `action_seen_${action._id}`;
      if (!localStorage.getItem(seenKey)) {
        alert(
          `⚠️ ADMIN ACTION on query "${action.title}": ${action.adminActionMessage || `Admin issued a ${action.adminAction}`}`,
        );
        localStorage.setItem(seenKey, "true");
      }
    });
  }, [assignedToMe]); // Keep the dependency but it won't loop infinitely now

  if (userRole !== "supervisor") {
    return (
      <div className="flex h-64 items-center justify-center">
        <p>Redirecting...</p>
      </div>
    );
  }

  if (isLoading) {
    return (
      <div className="flex h-64 items-center justify-center">
        <p>Loading queries...</p>
      </div>
    );
  }

  return (
    <div className="space-y-6 rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
      <h1 className="text-2xl font-bold text-slate-900">
        Supervisor Dashboard
      </h1>
      <p className="text-sm text-slate-600">
        Welcome, Supervisor {user?.firstName} {user?.lastName}
      </p>

      {/* ADD ESCALATION WARNING BANNER HERE */}
      {escalationWarnings.length > 0 && (
        <div className="rounded-xl border border-amber-200 bg-amber-50 px-4 py-3">
          <span className="font-semibold text-amber-700">
            ⚠️ Escalation Warning:
          </span>
          <span className="ml-2 text-sm text-amber-700">
            {escalationWarnings.length} query(s) have exceeded 24 hours. Please
            take action.
          </span>
        </div>
      )}

      {/* Pending Queries Section */}
      <div className="mb-8 border rounded-lg p-4 shadow">
        <h2 className="text-xl font-semibold mb-3 text-yellow-600">
          📋 Incoming Student Queries ({pendingQueries.length})
        </h2>
        {pendingQueries.length === 0 ? (
          <p className="text-gray-600">No pending queries to assign.</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full border">
              <thead className="bg-gray-100">
                <tr>
                  <th className="px-4 py-2">Student</th>
                  <th className="px-4 py-2">Title</th>
                  <th className="px-4 py-2">Description</th>
                  <th className="px-4 py-2">Priority</th>
                  <th className="px-4 py-2">Action</th>
                </tr>
              </thead>
              <tbody>
                {pendingQueries.map((query) => (
                  <tr key={query._id} className="border-t">
                    <td className="px-4 py-2">
                      {query.user?.firstName} {query.user?.lastName}
                    </td>
                    <td className="px-4 py-2">{query.title}</td>
                    <td className="px-4 py-2">{query.description}</td>
                    <td className="px-4 py-2">
                      <span
                        className={`font-bold ${
                          query.priority === "High"
                            ? "text-red-600"
                            : query.priority === "Medium"
                              ? "text-yellow-600"
                              : "text-green-600"
                        }`}
                      >
                        {query.priority}
                      </span>
                    </td>
                    <td className="px-4 py-2">
                      <button
                        onClick={() => handleAssign(query._id)}
                        disabled={actionLoading === query._id}
                        className="bg-blue-500 text-white px-3 py-1 rounded hover:bg-blue-600"
                      >
                        {actionLoading === query._id
                          ? "Assigning..."
                          : "Assign to Me"}
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Assigned to Me Section */}
      <div className="mb-8 border rounded-lg p-4 shadow">
        <h2 className="text-xl font-semibold mb-3 text-blue-600">
          🔧 Assigned to Me ({assignedToMe.length})
        </h2>
        {assignedToMe.length === 0 ? (
          <p className="text-gray-600">No queries assigned yet.</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full border">
              <thead className="bg-gray-100">
                <tr>
                  <th className="px-4 py-2">Student</th>
                  <th className="px-4 py-2">Title</th>
                  <th className="px-4 py-2">Description</th>
                  <th className="px-4 py-2">Priority</th>
                  <th className="px-4 py-2">Status</th>
                  <th className="px-4 py-2">Admin Action</th>
                  <th className="px-4 py-2">Actions</th>
                </tr>
              </thead>
              <tbody>
                {assignedToMe.map((query) => (
                  <React.Fragment key={query._id}>
                    <tr className="border-t">
                      <td className="px-4 py-2">
                        {query.user?.firstName} {query.user?.lastName}
                      </td>
                      <td className="px-4 py-2">{query.title}</td>
                      <td className="px-4 py-2">{query.description}</td>
                      <td className="px-4 py-2">{query.priority}</td>
                      <td className="px-4 py-2">
                        <span
                          className={`px-2 py-1 rounded text-white text-sm ${
                            query.status === "In Progress"
                              ? "bg-blue-500"
                              : "bg-yellow-500"
                          }`}
                        >
                          {query.status}
                        </span>
                      </td>
                      <td className="px-4 py-2">
                        {query.adminAction && query.adminAction !== "none" ? (
                          <span className="bg-red-100 text-red-700 px-2 py-1 rounded text-xs font-bold">
                            ⚠️ {query.adminAction.toUpperCase()}
                          </span>
                        ) : (
                          <span className="text-gray-400 text-xs">None</span>
                        )}
                      </td>
                      <td className="px-4 py-2">
                        {/* View Details Button */}
                        <button
                          onClick={() => navigate(`/query/${query._id}`)}
                          className="mr-2 rounded bg-sky-600 px-3 py-1 text-sm font-medium text-white transition hover:bg-sky-700"
                        >
                          👁️ View
                        </button>

                        {/* Comments Button */}
                        <button
                          onClick={() => toggleComments(query._id)}
                          className="mr-2 rounded bg-violet-600 px-3 py-1 text-sm font-medium text-white transition hover:bg-violet-700"
                        >
                          💬 Comments
                        </button>

                        {/* Mark Resolved Button */}
                        {query.status === "In Progress" && (
                          <button
                            onClick={() =>
                              handleStatusUpdate(query._id, "Resolved")
                            }
                            disabled={actionLoading === query._id}
                            className="bg-green-500 text-white px-3 py-1 rounded hover:bg-green-600"
                          >
                            {actionLoading === query._id
                              ? "Updating..."
                              : "Mark Resolved"}
                          </button>
                        )}
                      </td>
                    </tr>

                    {/* Expandable row for comments */}
                    {expandedQueryId === query._id && (
                      <tr>
                        <td colSpan="7" className="bg-slate-50 p-4">
                          <CommentSection
                            queryId={query._id}
                            queryTitle={query.title}
                          />
                        </td>
                      </tr>
                    )}
                  </React.Fragment>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Resolved Queries Section */}
      <div className="border rounded-lg p-4 shadow">
        <h2 className="text-xl font-semibold mb-3 text-green-600">
          ✅ Resolved Queries ({resolvedQueries.length})
        </h2>
        {resolvedQueries.length === 0 ? (
          <p className="text-gray-600">No resolved queries yet.</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full border">
              <thead className="bg-gray-100">
                <tr>
                  <th className="px-4 py-2">Student</th>
                  <th className="px-4 py-2">Title</th>
                  <th className="px-4 py-2">Resolved On</th>
                </tr>
              </thead>
              <tbody>
                {resolvedQueries.map((query) => (
                  <tr key={query._id} className="border-t">
                    <td className="px-4 py-2">
                      {query.user?.firstName} {query.user?.lastName}
                    </td>
                    <td className="px-4 py-2">{query.title}</td>
                    <td className="px-4 py-2">
                      {new Date(query.updatedAt).toLocaleDateString()}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
};

export default SupervisorDashboard;
