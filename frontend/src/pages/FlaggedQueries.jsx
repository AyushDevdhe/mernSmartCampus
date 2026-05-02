import React, { useEffect, useState } from "react";
import { useSelector } from "react-redux";
import { useNavigate } from "react-router-dom";
import { getAllQueries } from "../services/QueryApis";
import "../css/FlaggedQueries.css";

import SpamReasonModal from "../components/SpamReasonModal";
import { markAsSpam } from "../services/QueryApis"; // We'll create this
import axios from "axios";

const FlaggedQueries = () => {
  const user = useSelector((state) => state.user.data);
  const navigate = useNavigate();
  const [flaggedQueries, setFlaggedQueries] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [showSpamModal, setShowSpamModal] = useState(false);
  const [selectedQuery, setSelectedQuery] = useState(null);

  const fetchFlaggedQueries = async () => {
    setIsLoading(true);
    try {
      const res = await getAllQueries();
      if (res?.data?.success) {
        // Filter queries that are suspicious (not spam, just flagged)
        const suspicious = res.data.queries.filter(
          (q) => q.isSpam === "suspicious",
        );
        setFlaggedQueries(suspicious);
      }
    } catch (error) {
      console.error("Error fetching flagged queries:", error);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchFlaggedQueries();
  }, []);

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

  if (isLoading) {
    return (
      <div className="flagged-loading">
        <div className="spinner"></div>
        <p>Loading flagged queries...</p>
      </div>
    );
  }

  const handleMarkAsSpam = async (queryId, reason) => {
    try {
      const res = await axios.put(
        `${process.env.REACT_APP_BASE_URL}/queries/mark-spam/${queryId}`,
        { reason },
        { withCredentials: true },
      );
      if (res?.data?.success) {
        alert("✅ Query marked as spam successfully!");
        fetchFlaggedQueries(); // Refresh the list
      }
    } catch (error) {
      console.error("Error marking as spam:", error);
      alert(error.response?.data?.message || "Failed to mark as spam");
    } finally {
      setShowSpamModal(false);
      setSelectedQuery(null);
    }
  };

  return (
    <div className="flagged-queries-container">
      <div className="page-header">
        <h1>⚠️ Flagged Queries</h1>
        <p>
          Queries flagged by AI for suspicious content - Review before assigning
        </p>
      </div>

      {flaggedQueries.length === 0 ? (
        <div className="empty-state">
          <div className="empty-icon">✅</div>
          <h3>No Flagged Queries</h3>
          <p>All queries are clean. Good job!</p>
        </div>
      ) : (
        <div className="queries-grid">
          {flaggedQueries.map((query) => (
            <div key={query._id} className="flagged-card">
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
                  {query.priority}
                </div>
              </div>
              <div className="card-body">
                <p className="query-description">{query.description}</p>
                <div className="flagged-reason">
                  <span className="flag-icon">⚠️</span>
                  <span>AI flagged this query for review</span>
                </div>
                <div className="card-footer">
                  <button
                    className="btn-view"
                    onClick={() => navigate(`/query/${query._id}`)}
                  >
                    👁️ View Details
                  </button>
                  <button
                    className="btn-assign"
                    onClick={() => navigate("/supervisor-dashboard")}
                  >
                    📌 Assign to Me
                  </button>

                  <button
                    className="btn-spam"
                    onClick={() => {
                      setSelectedQuery(query);
                      setShowSpamModal(true);
                    }}
                  >
                    🚫 Mark as Spam
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      
      {showSpamModal && selectedQuery && (
        <SpamReasonModal
          query={selectedQuery}
          onClose={() => {
            setShowSpamModal(false);
            setSelectedQuery(null);
          }}
          onSubmit={(reason) => handleMarkAsSpam(selectedQuery._id, reason)}
        />
      )}
    </div>
  );
};

export default FlaggedQueries;
