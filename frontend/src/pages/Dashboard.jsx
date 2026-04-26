import { useEffect, useState } from "react";
import { useSelector } from "react-redux";
import { useNavigate } from "react-router-dom";
import { getQueriesByUser, deleteQuery } from "../services/QueryApis";
import CommentSection from "../components/CommentSection";
import "../css/StudentDashboard.css";

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
        return "text-red-600 font-bold";
      case "Medium":
        return "text-yellow-600 font-bold";
      case "Low":
        return "text-green-600 font-bold";
      default:
        return "";
    }
  };

  // Show loading while checking role
  if (!userRole || userRole === "admin" || userRole === "supervisor") {
    return (
      <div className="flex justify-center items-center h-64">
        <p>Redirecting to your dashboard...</p>
      </div>
    );
  }

  if (isLoading) {
    return (
      <div className="flex justify-center items-center h-64">
        <p>Loading your queries...</p>
      </div>
    );
  }

  return (
    <div className="dashboard-container">
      <p className="welcome-text">
        Hello {user?.firstName} {user?.lastName}
      </p>
      <p className="queries-title">Your Queries</p>

      {userQueries.length === 0 ? (
        <div className="no-queries">
          <p>No queries yet. Click "Add Query" to create one.</p>
        </div>
      ) : (
        <table className="min-w-full border border-gray-300 rounded-lg overflow-hidden mt-4 shadow-sm">
          <thead className="bg-gray-100">
            <tr className="text-left text-sm font-semibold text-gray-700">
              <th className="px-4 py-2">Title</th>
              <th className="px-4 py-2">Description</th>
              <th className="px-4 py-2">Priority</th>
              <th className="px-4 py-2">Status</th>
              <th className="px-4 py-2">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y">
            {userQueries?.map((query) => (
              <>
                <tr key={query._id} className="hover:bg-gray-50">
                  <td className="px-4 py-2">{query.title}</td>
                  <td className="px-4 py-2">{query.description}</td>
                  <td
                    className={`px-4 py-2 ${getPriorityColor(query.priority)}`}
                  >
                    {query.priority}
                  </td>
                  <td className="px-4 py-2">
                    <span
                      className={`status-badge ${query.status?.toLowerCase()}`}
                    >
                      {query.status || "Pending"}
                    </span>
                  </td>
                  <td className="px-4 py-2">
                    <button
                      onClick={() => toggleComments(query._id)}
                      style={{
                        marginRight: "8px",
                        padding: "5px 10px",
                        backgroundColor: "#8b5cf6",
                        color: "white",
                        border: "none",
                        borderRadius: "4px",
                        cursor: "pointer",
                      }}
                    >
                      💬 Comments
                    </button>
                    <button
                      onClick={() => handleEdit(query._id)}
                      className="edit-btn"
                      style={{
                        marginRight: "8px",
                        padding: "5px 10px",
                        backgroundColor: "#4CAF50",
                        color: "white",
                        border: "none",
                        borderRadius: "4px",
                        cursor: "pointer",
                      }}
                    >
                      Edit
                    </button>
                    <button
                      onClick={() => handleDelete(query._id)}
                      disabled={deletingId === query._id}
                      className="delete-btn"
                      style={{
                        padding: "5px 10px",
                        backgroundColor: "#f44336",
                        color: "white",
                        border: "none",
                        borderRadius: "4px",
                        cursor: "pointer",
                      }}
                    >
                      {deletingId === query._id ? "Deleting..." : "Delete"}
                    </button>

                    <button
                      onClick={() => navigate(`/query/${query._id}`)}
                      style={{
                        marginRight: "8px",
                        padding: "5px 10px",
                        backgroundColor: "#3b82f6",
                        color: "white",
                        border: "none",
                        borderRadius: "4px",
                        cursor: "pointer",
                      }}
                    >
                      👁️ View
                    </button>
                  </td>
                </tr>
                {expandedQueryId === query._id && (
                  <tr>
                    <td
                      colSpan="5"
                      style={{ padding: "16px", background: "#f9fafb" }}
                    >
                      <CommentSection
                        queryId={query._id}
                        queryTitle={query.title}
                      />
                    </td>
                  </tr>
                )}
              </>
            ))}
          </tbody>
        </table>
      )}
    </div>
  );
};

export default Dashboard;
