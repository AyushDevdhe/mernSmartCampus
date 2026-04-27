import { useEffect, useState } from "react";
import { useSelector } from "react-redux";
import { useNavigate } from "react-router-dom";
import axios from "axios";
import "../css/ActionHistory.css";

const ActionHistory = () => {
  const user = useSelector((state) => state.user.data);
  const navigate = useNavigate();
  const [actions, setActions] = useState([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    if (user?.role !== "admin") {
      navigate("/dashboard");
      return;
    }
    fetchActionHistory();
  }, [user]);

  const fetchActionHistory = async () => {
    setIsLoading(true);
    try {
      const res = await axios.get(
        `${process.env.REACT_APP_BASE_URL}/queries/action-history`,
        {
          withCredentials: true,
        },
      );
      if (res?.data?.success) {
        setActions(res.data.actionHistory);
      }
    } catch (error) {
      console.error("Error fetching action history:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const getActionBadge = (action) => {
    switch (action) {
      case "warning":
        return { class: "warning", text: "⚠️ Warning" };
      case "penalty":
        return { class: "penalty", text: "💰 Penalty" };
      case "escalated":
        return { class: "escalated", text: "📢 Escalated" };
      case "reassigned":
        return { class: "reassigned", text: "🔄 Reassigned" };
      default:
        return { class: "none", text: action };
    }
  };

  if (isLoading) {
    return (
      <div className="action-history-loading">
        <div className="spinner"></div>
        <p>Loading action history...</p>
      </div>
    );
  }

  return (
    <div className="action-history-container">
      <div className="action-history-header">
        <h1>📋 Action History</h1>
        <p>Records of all admin actions taken on escalated queries</p>
      </div>

      {actions.length === 0 ? (
        <div className="no-actions">
          <div className="icon">✅</div>
          <h3>No Actions Taken Yet</h3>
          <p>
            When you take action on escalated queries, they will appear here.
          </p>
        </div>
      ) : (
        <div className="actions-list">
          {actions.map((action) => {
            const badge = getActionBadge(action.adminAction);
            return (
              <div key={action._id} className="action-card">
                <div className="action-card-header">
                  <div className="action-title">
                    <span className="action-icon">📌</span>
                    <h3>{action.title}</h3>
                  </div>
                  <span className={`action-badge ${badge.class}`}>
                    {badge.text}
                  </span>
                </div>
                <div className="action-card-body">
                  <div className="action-details">
                    <div className="detail-row">
                      <span className="detail-label">Student:</span>
                      <span className="detail-value">
                        {action.user?.firstName} {action.user?.lastName}
                      </span>
                    </div>
                    <div className="detail-row">
                      <span className="detail-label">Supervisor:</span>
                      <span className="detail-value">
                        {action.assignedTo?.firstName || "Not Assigned"}{" "}
                        {action.assignedTo?.lastName || ""}
                      </span>
                    </div>
                    <div className="detail-row">
                      <span className="detail-label">Action Date:</span>
                      <span className="detail-value">
                        {action.actionTakenAt
                          ? new Date(action.actionTakenAt).toLocaleString()
                          : "N/A"}
                      </span>
                    </div>
                    <div className="detail-row">
                      <span className="detail-label">Message:</span>
                      <span className="detail-value message">
                        {action.adminActionMessage || "No additional message"}
                      </span>
                    </div>
                  </div>
                  <button
                    className="view-query-btn"
                    onClick={() => navigate(`/query/${action._id}`)}
                  >
                    View Query Details
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};

export default ActionHistory;
