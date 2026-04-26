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
        return { bg: "#fee2e2", color: "#dc2626" };
      case "Medium":
        return { bg: "#fef3c7", color: "#d97706" };
      case "Low":
        return { bg: "#d1fae5", color: "#059669" };
      default:
        return { bg: "#e2e8f0", color: "#475569" };
    }
  };

  const getStatusColor = (status) => {
    switch (status) {
      case "Pending":
        return { bg: "#fef3c7", color: "#d97706" };
      case "In Progress":
        return { bg: "#dbeafe", color: "#2563eb" };
      case "Resolved":
        return { bg: "#d1fae5", color: "#059669" };
      default:
        return { bg: "#e2e8f0", color: "#475569" };
    }
  };

  if (isLoading) {
    return (
      <div className="flex justify-center items-center h-64">
        <p>Loading query details...</p>
      </div>
    );
  }

  if (error || !query) {
    return (
      <div className="flex justify-center items-center h-64 flex-col">
        <p style={{ color: "#ef4444", marginBottom: "16px" }}>
          {error || "Query not found"}
        </p>
        <button
          onClick={() => navigate(-1)}
          style={{
            padding: "8px 16px",
            background: "#3b82f6",
            color: "white",
            border: "none",
            borderRadius: "6px",
            cursor: "pointer",
          }}
        >
          Go Back
        </button>
      </div>
    );
  }

  const priorityStyle = getPriorityColor(query.priority);
  const statusStyle = getStatusColor(query.status);
  const isAuthor = query.user?._id === user?._id;
  const isAssignedSupervisor = query.assignedTo?._id === user?._id;
  const isAdmin = user?.role === "admin";

  return (
    <div
      className="query-details-container"
      style={{ maxWidth: "900px", margin: "0 auto", padding: "20px" }}
    >
      {/* Header with Back Button */}
      <div
        style={{
          display: "flex",
          alignItems: "center",
          gap: "16px",
          marginBottom: "24px",
        }}
      >
        <button
          onClick={() => navigate(-1)}
          style={{
            padding: "8px 12px",
            background: "#e2e8f0",
            border: "none",
            borderRadius: "6px",
            cursor: "pointer",
          }}
        >
          ← Back
        </button>
        <h1 style={{ fontSize: "24px", fontWeight: "bold", margin: 0 }}>
          Query Details
        </h1>
      </div>

      {/* Query Card */}
      <div
        style={{
          background: "white",
          borderRadius: "12px",
          border: "1px solid #e2e8f0",
          overflow: "hidden",
          marginBottom: "24px",
        }}
      >
        {/* Header */}
        <div
          style={{
            padding: "20px",
            borderBottom: "1px solid #e2e8f0",
            background: "#f8fafc",
          }}
        >
          <div
            style={{
              display: "flex",
              justifyContent: "space-between",
              alignItems: "flex-start",
              flexWrap: "wrap",
              gap: "12px",
            }}
          >
            <h2 style={{ fontSize: "20px", fontWeight: "bold", margin: 0 }}>
              {query.title}
            </h2>
            <div style={{ display: "flex", gap: "8px" }}>
              <span
                style={{
                  background: priorityStyle.bg,
                  color: priorityStyle.color,
                  padding: "4px 12px",
                  borderRadius: "20px",
                  fontSize: "12px",
                  fontWeight: "bold",
                }}
              >
                {query.priority}
              </span>
              <span
                style={{
                  background: statusStyle.bg,
                  color: statusStyle.color,
                  padding: "4px 12px",
                  borderRadius: "20px",
                  fontSize: "12px",
                  fontWeight: "bold",
                }}
              >
                {query.status}
              </span>
            </div>
          </div>
        </div>

        {/* Body */}
        <div style={{ padding: "20px" }}>
          {/* Description */}
          <div style={{ marginBottom: "20px" }}>
            <h4
              style={{
                fontSize: "14px",
                fontWeight: "bold",
                marginBottom: "8px",
                color: "#475569",
              }}
            >
              Description
            </h4>
            <p
              style={{
                fontSize: "15px",
                color: "#334155",
                lineHeight: "1.6",
                margin: 0,
              }}
            >
              {query.description}
            </p>
          </div>

          {/* Info Grid */}
          <div
            style={{
              display: "grid",
              gridTemplateColumns: "repeat(auto-fit, minmax(250px, 1fr))",
              gap: "16px",
              marginBottom: "20px",
              paddingTop: "16px",
              borderTop: "1px solid #e2e8f0",
            }}
          >
            <div>
              <h4
                style={{
                  fontSize: "12px",
                  fontWeight: "bold",
                  color: "#64748b",
                  marginBottom: "4px",
                }}
              >
                Created By
              </h4>
              <p style={{ fontSize: "14px", fontWeight: "bold", margin: 0 }}>
                {query.user?.firstName} {query.user?.lastName}
              </p>
              <p
                style={{
                  fontSize: "12px",
                  color: "#64748b",
                  margin: "4px 0 0 0",
                }}
              >
                {query.user?.email}
              </p>
              {query.user?.prn && (
                <p
                  style={{
                    fontSize: "12px",
                    color: "#64748b",
                    margin: "4px 0 0 0",
                  }}
                >
                  PRN: {query.user?.prn}
                </p>
              )}
            </div>
            <div>
              <h4
                style={{
                  fontSize: "12px",
                  fontWeight: "bold",
                  color: "#64748b",
                  marginBottom: "4px",
                }}
              >
                Assigned To
              </h4>
              <p style={{ fontSize: "14px", margin: 0 }}>
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
              <h4
                style={{
                  fontSize: "12px",
                  fontWeight: "bold",
                  color: "#64748b",
                  marginBottom: "4px",
                }}
              >
                Created At
              </h4>
              <p style={{ fontSize: "14px", margin: 0 }}>
                {new Date(query.createdAt).toLocaleString()}
              </p>
            </div>
            <div>
              <h4
                style={{
                  fontSize: "12px",
                  fontWeight: "bold",
                  color: "#64748b",
                  marginBottom: "4px",
                }}
              >
                Last Updated
              </h4>
              <p style={{ fontSize: "14px", margin: 0 }}>
                {new Date(query.updatedAt).toLocaleString()}
              </p>
            </div>
          </div>

          {/* Admin Action Section */}
          {query.adminAction && query.adminAction !== "none" && (
            <div
              style={{
                background: "#fef2f2",
                padding: "12px",
                borderRadius: "8px",
                marginBottom: "20px",
                border: "1px solid #fee2e2",
              }}
            >
              <h4
                style={{
                  fontSize: "13px",
                  fontWeight: "bold",
                  color: "#dc2626",
                  marginBottom: "4px",
                }}
              >
                👑 Admin Action
              </h4>
              <p style={{ fontSize: "13px", color: "#991b1b", margin: 0 }}>
                {query.adminActionMessage ||
                  `Admin issued a ${query.adminAction}`}
              </p>
            </div>
          )}
        </div>
      </div>

      {/* Timeline Component */}
      <QueryTimeline query={query} />

      {/* Comments Section */}
      <div style={{ marginTop: "24px" }}>
        <CommentSection queryId={query._id} queryTitle={query.title} />
      </div>
    </div>
  );
};

export default QueryDetails;
