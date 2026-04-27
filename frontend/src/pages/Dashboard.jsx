import React, { useEffect, useState } from "react";
import { useSelector } from "react-redux";
import { useNavigate } from "react-router-dom";
import { getQueriesByUser, deleteQuery } from "../services/QueryApis";
import CommentSection from "../components/CommentSection";

const Dashboard = () => {
  const user = useSelector((state) => state.user.data);
  const navigate = useNavigate();
  const userRole = user?.role?.toLowerCase();

  const [userQueries, setUserQueries] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [deletingId, setDeletingId] = useState(null);
  const [expandedQueryId, setExpandedQueryId] = useState(null);

  useEffect(() => {
    // Redirect non-student users to their respective dashboards
    if (userRole === "admin") {
      navigate("/admin-dashboard", { replace: true });
    } else if (userRole === "supervisor") {
      navigate("/supervisor-dashboard", { replace: true });
    }
  }, [userRole, navigate]);

  // Fetch queries only for students
  useEffect(() => {
    if (userRole === "student") {
      const fetchQueries = async () => {
        setIsLoading(true);
        try {
          const res = await getQueriesByUser();
          if (res) {
            setUserQueries(res?.data?.queries || []);
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

  const toggleComments = (queryId) => {
    setExpandedQueryId(expandedQueryId === queryId ? null : queryId);
  };

  const handleDelete = async (id) => {
    if (window.confirm("Are you sure you want to delete this query?")) {
      setDeletingId(id);
      try {
        await deleteQuery(id);
        setUserQueries(userQueries.filter((query) => query._id !== id));
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

  const getPriorityColor = (priority) => {
    switch (priority) {
      case "High":
        return "bg-rose-100 text-rose-700";
      case "Medium":
        return "bg-amber-100 text-amber-700";
      case "Low":
        return "bg-emerald-100 text-emerald-700";
      default:
        return "bg-slate-100 text-slate-700";
    }
  };

  const getStatusColor = (status) => {
    switch (status) {
      case "Resolved":
        return "bg-emerald-100 text-emerald-700";
      case "In Progress":
        return "bg-sky-100 text-sky-700";
      default:
        return "bg-amber-100 text-amber-700";
    }
  };

  // Show loading while checking role
  if (!userRole || userRole === "admin" || userRole === "supervisor") {
    return (
      <div className="flex h-64 items-center justify-center">
        <p className="text-sm font-medium text-slate-600">
          Redirecting to your dashboard...
        </p>
      </div>
    );
  }

  if (isLoading) {
    return (
      <div className="flex h-64 items-center justify-center">
        <p className="text-sm font-medium text-slate-600">
          Loading your queries...
        </p>
      </div>
    );
  }

  return (
    <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
      <p className="text-sm text-slate-600">
        Hello {user?.firstName} {user?.lastName}
      </p>
      <p className="mt-1 text-2xl font-bold text-slate-900">Your Queries</p>

      {userQueries.length === 0 ? (
        <div className="mt-5 rounded-xl border border-dashed border-slate-300 bg-slate-50 px-4 py-8 text-center">
          <p className="text-sm text-slate-600">
            No queries yet. Click "Add Query" to create one.
          </p>
        </div>
      ) : (
        <div className="mt-5 overflow-x-auto rounded-xl border border-slate-200">
          <table className="min-w-full divide-y divide-slate-200">
            <thead className="bg-slate-50">
              <tr className="text-left text-xs font-semibold uppercase tracking-wide text-slate-500">
                <th className="px-4 py-3">Title</th>
                <th className="px-4 py-3">Description</th>
                <th className="px-4 py-3">Priority</th>
                <th className="px-4 py-3">Status</th>
                <th className="px-4 py-3">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 bg-white text-sm text-slate-700">
              {userQueries?.map((query) => {
                const isResolved = query.status === "Resolved";
                return (
                  <React.Fragment key={query._id}>
                    <tr className="align-top transition hover:bg-slate-50">
                      <td className="px-4 py-3 font-medium text-slate-800">
                        {query.title}
                      </td>
                      <td className="px-4 py-3 text-slate-600">
                        {query.description}
                      </td>
                      <td className="px-4 py-3">
                        <span
                          className={`inline-flex rounded-full px-2.5 py-1 text-xs font-semibold ${getPriorityColor(
                            query.priority,
                          )}`}
                        >
                          {query.priority}
                        </span>
                      </td>
                      <td className="px-4 py-3">
                        <span
                          className={`inline-flex rounded-full px-2.5 py-1 text-xs font-semibold ${getStatusColor(
                            query.status || "Pending",
                          )}`}
                        >
                          {query.status || "Pending"}
                        </span>
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex flex-wrap gap-2">
                          {!isResolved && (
                            <button
                              onClick={() => toggleComments(query._id)}
                              className="rounded-lg bg-violet-600 px-3 py-1.5 text-xs font-semibold text-white transition hover:bg-violet-700"
                            >
                              💬 Comments
                            </button>
                          )}

                          {!isResolved && (
                            <button
                              onClick={() => handleEdit(query._id)}
                              className="rounded-lg bg-emerald-600 px-3 py-1.5 text-xs font-semibold text-white transition hover:bg-emerald-700"
                            >
                              Edit
                            </button>
                          )}

                          {!isResolved && (
                            <button
                              onClick={() => handleDelete(query._id)}
                              disabled={deletingId === query._id}
                              className="rounded-lg bg-rose-600 px-3 py-1.5 text-xs font-semibold text-white transition hover:bg-rose-700 disabled:cursor-not-allowed disabled:opacity-70"
                            >
                              {deletingId === query._id
                                ? "Deleting..."
                                : "Delete"}
                            </button>
                          )}

                          <button
                            onClick={() => navigate(`/query/${query._id}`)}
                            className="rounded-lg bg-sky-600 px-3 py-1.5 text-xs font-semibold text-white transition hover:bg-sky-700"
                          >
                            👁️ View
                          </button>
                        </div>
                      </td>
                    </tr>

                    {expandedQueryId === query._id && (
                      <tr>
                        <td colSpan="5" className="bg-slate-50 px-4 py-4">
                          <CommentSection
                            queryId={query._id}
                            queryTitle={query.title}
                          />
                        </td>
                      </tr>
                    )}
                  </React.Fragment>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
};

export default Dashboard;
