import { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { useSelector } from "react-redux";
import { getQueryById } from "../services/QueryApis";
import CommentSection from "../components/CommentSection";
import QueryTimeline from "../components/QueryTimeline";

const QueryDetails = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const user = useSelector((state) => state.user.data);
  const userRole = user?.role?.toLowerCase();
  const [query, setQuery] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchQuery = async () => {
      setIsLoading(true);
      try {
        const res = await getQueryById(id);
        if (res?.data?.success) {
          setQuery(res.data.query);
        } else {
          setError("Query not found");
        }
      } catch (error) {
        console.error("Error fetching query:", error);
        setError(error.response?.data?.message || "Failed to load query");
      } finally {
        setIsLoading(false);
      }
    };

    if (id) {
      fetchQuery();
    }
  }, [id]);

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
      case "Pending":
        return "bg-amber-100 text-amber-700";
      case "In Progress":
        return "bg-sky-100 text-sky-700";
      case "Resolved":
        return "bg-emerald-100 text-emerald-700";
      default:
        return "bg-slate-100 text-slate-700";
    }
  };

  if (isLoading) {
    return (
      <div className="flex h-64 items-center justify-center">
        <p className="text-sm font-medium text-slate-600">
          Loading query details...
        </p>
      </div>
    );
  }

  if (error || !query) {
    return (
      <div className="flex h-64 flex-col items-center justify-center">
        <p className="mb-4 text-sm font-medium text-rose-600">
          {error || "Query not found"}
        </p>
        <button
          onClick={() => navigate(-1)}
          className="rounded-xl bg-sky-600 px-4 py-2 text-sm font-semibold text-white transition hover:bg-sky-700"
        >
          Go Back
        </button>
      </div>
    );
  }

  const priorityStyle = getPriorityColor(query.priority);
  const statusStyle = getStatusColor(query.status);

  return (
    <div className="mx-auto w-full max-w-4xl">
      <div className="mb-6 flex items-center gap-3">
        <button
          onClick={() => navigate(-1)}
          className="rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm font-medium text-slate-700 transition hover:bg-slate-100"
        >
          ← Back
        </button>
        <h1 className="text-2xl font-bold text-slate-900">Query Details</h1>
      </div>

      <div className="mb-6 overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
        <div className="border-b border-slate-200 bg-slate-50 px-6 py-5">
          <div className="flex flex-wrap items-start justify-between gap-3">
            <h2 className="text-xl font-bold text-slate-900">{query.title}</h2>
            <div className="flex flex-wrap gap-2">
              <span
                className={`inline-flex rounded-full px-3 py-1 text-xs font-semibold ${priorityStyle}`}
              >
                {query.priority}
              </span>
              <span
                className={`inline-flex rounded-full px-3 py-1 text-xs font-semibold ${statusStyle}`}
              >
                {query.status}
              </span>
            </div>
          </div>
        </div>

        <div className="px-6 py-5">
          <div className="mb-5">
            <h4 className="mb-2 text-xs font-semibold uppercase tracking-wide text-slate-500">
              Description
            </h4>
            <p className="text-sm leading-7 text-slate-700">
              {query.description}
            </p>
          </div>

          {/* Java AI Analysis Section - ONLY for Supervisor and Admin */}
          {(userRole === "supervisor" || userRole === "admin") &&
            query.javaAnalysis && (
              <div className="mb-5 rounded-xl border border-purple-200 bg-purple-50 p-4">
                <div className="flex items-center gap-2">
                  <span className="text-xl">🤖</span>
                  <h4 className="text-sm font-semibold text-purple-800">
                    Java AI Analysis
                  </h4>
                </div>
                <div className="mt-2 flex flex-wrap items-center gap-4">
                  <div>
                    <span className="text-xs text-purple-600">
                      Suggested Priority:
                    </span>
                    <span
                      className={`ml-2 inline-flex rounded-full px-2 py-0.5 text-xs font-semibold ${
                        query.javaAnalysis.priority === "High"
                          ? "bg-rose-100 text-rose-700"
                          : query.javaAnalysis.priority === "Medium"
                            ? "bg-amber-100 text-amber-700"
                            : "bg-emerald-100 text-emerald-700"
                      }`}
                    >
                      {query.javaAnalysis.priority}
                    </span>
                  </div>
                  <div>
                    <span className="text-xs text-purple-600">
                      Urgency Score:
                    </span>
                    <span className="ml-2 text-sm font-bold text-purple-800">
                      {query.javaAnalysis.score}
                    </span>
                  </div>
                  <div>
                    <span className="text-xs text-purple-600">
                      Analyzed At:
                    </span>
                    <span className="ml-2 text-xs text-purple-600">
                      {new Date(query.javaAnalysis.analyzedAt).toLocaleString()}
                    </span>
                  </div>
                </div>
                {query.javaAnalysis.matches &&
                  query.javaAnalysis.matches.length > 0 && (
                    <p className="mt-2 text-xs text-purple-600">
                      Matched keywords: {query.javaAnalysis.matches.join(", ")}
                    </p>
                  )}
              </div>
            )}

          {/* Image Section */}
          {query.imageUrl && (
            <div className="mb-5">
              <h4 className="mb-2 text-xs font-semibold uppercase tracking-wide text-slate-500">
                Attached Image
              </h4>
              <img
                src={`http://localhost:5000${query.imageUrl}`}
                alt="Query Attachment"
                className="max-h-96 rounded-xl border border-slate-200 object-contain"
                onError={(e) => {
                  console.error("Image failed to load:", e.target.src);
                  e.target.style.display = "none";
                  e.target.nextSibling.style.display = "block";
                }}
              />
              <p
                style={{
                  display: "none",
                  color: "red",
                  fontSize: "12px",
                  marginTop: "8px",
                }}
              >
                Image failed to load. File may be missing.
              </p>
            </div>
          )}

          <div className="grid gap-4 border-t border-slate-200 pt-4 sm:grid-cols-2">
            <div>
              <h4 className="mb-1 text-xs font-semibold uppercase tracking-wide text-slate-500">
                Created By
              </h4>
              <p className="text-sm font-semibold text-slate-800">
                {query.user?.firstName} {query.user?.lastName}
              </p>
              <p className="mt-1 text-xs text-slate-500">{query.user?.email}</p>
              {query.user?.prn && (
                <p className="mt-1 text-xs text-slate-500">
                  PRN: {query.user?.prn}
                </p>
              )}
            </div>

            <div>
              <h4 className="mb-1 text-xs font-semibold uppercase tracking-wide text-slate-500">
                Assigned To
              </h4>
              <p className="text-sm text-slate-700">
                {query.assignedTo ? (
                  <>
                    {query.assignedTo.firstName} {query.assignedTo.lastName}
                  </>
                ) : (
                  "Not Assigned"
                )}
              </p>
            </div>

            <div>
              <h4 className="mb-1 text-xs font-semibold uppercase tracking-wide text-slate-500">
                Created At
              </h4>
              <p className="text-sm text-slate-700">
                {new Date(query.createdAt).toLocaleString()}
              </p>
            </div>

            <div>
              <h4 className="mb-1 text-xs font-semibold uppercase tracking-wide text-slate-500">
                Last Updated
              </h4>
              <p className="text-sm text-slate-700">
                {new Date(query.updatedAt).toLocaleString()}
              </p>
            </div>
          </div>

          {query.adminAction && query.adminAction !== "none" && (
            <div className="mt-5 rounded-xl border border-rose-200 bg-rose-50 px-4 py-3">
              <h4 className="mb-1 text-sm font-semibold text-rose-700">
                👑 Admin Action
              </h4>
              <p className="text-sm text-rose-700">
                {query.adminActionMessage ||
                  `Admin issued a ${query.adminAction}`}
              </p>
            </div>
          )}
        </div>
      </div>

      <QueryTimeline query={query} />

      <div className="mt-6 rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
        <CommentSection queryId={query._id} queryTitle={query.title} />
      </div>
    </div>
  );
};

export default QueryDetails;
