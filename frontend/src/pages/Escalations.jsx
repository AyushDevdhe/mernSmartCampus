import { useEffect, useState } from "react";
import { useSelector } from "react-redux";
import { useNavigate } from "react-router-dom";
import {
  getCriticalEscalations,
  getAvailableSupervisors,
  reassignSupervisor,
} from "../services/EscalationApis";
import "../css/Escalations.css";

const Escalations = () => {
  const user = useSelector((state) => state.user.data);
  const navigate = useNavigate();
  const [escalatedQueries, setEscalatedQueries] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [showReplaceModal, setShowReplaceModal] = useState(false);
  const [selectedSupervisor, setSelectedSupervisor] = useState(null);
  const [availableSupervisors, setAvailableSupervisors] = useState([]);
  const [selectedNewSupervisor, setSelectedNewSupervisor] = useState("");
  const [actionLoading, setActionLoading] = useState(false);

  useEffect(() => {
    if (user?.role !== "admin") {
      navigate("/dashboard");
      return;
    }
    fetchData();
  }, [user]);

  const fetchData = async () => {
    setIsLoading(true);
    try {
      const res = await getCriticalEscalations();
      if (res?.data?.success) {
        setEscalatedQueries(res.data.criticalEscalations);
      }
    } catch (error) {
      console.error("Error fetching escalations:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleReplaceSupervisor = async (supervisor) => {
    setSelectedSupervisor(supervisor);
    try {
      const res = await getAvailableSupervisors(supervisor._id);
      if (res?.data?.success) {
        setAvailableSupervisors(res.data.supervisors);
      }
    } catch (error) {
      console.error("Error fetching available supervisors:", error);
    }
    setShowReplaceModal(true);
  };

  const confirmReassign = async () => {
    if (!selectedNewSupervisor) {
      alert("Please select a new supervisor");
      return;
    }

    const queryIds = escalatedQueries
      .filter((q) => q.assignedTo?._id === selectedSupervisor._id)
      .map((q) => q._id);

    if (queryIds.length === 0) {
      alert("No queries found for this supervisor");
      return;
    }

    setActionLoading(true);
    try {
      const res = await reassignSupervisor(
        selectedSupervisor._id,
        selectedNewSupervisor,
        queryIds,
      );
      if (res?.data?.success) {
        alert(
          `✅ ${res.data.reassignedCount} queries reassigned successfully!`,
        );
        setShowReplaceModal(false);
        setSelectedSupervisor(null);
        setSelectedNewSupervisor("");
        fetchData(); // Refresh the list
      } else {
        alert(res?.data?.message || "Reassignment failed");
      }
    } catch (error) {
      console.error("Error reassigning:", error);
      alert(error.response?.data?.message || "Failed to reassign");
    } finally {
      setActionLoading(false);
    }
  };

  if (isLoading) {
    return (
      <div className="escalations-loading">
        <div className="spinner"></div>
        <p>Loading escalated issues...</p>
      </div>
    );
  }

  // Group queries by supervisor
  const groupedBySupervisor = escalatedQueries.reduce((acc, query) => {
    const supervisorId = query.assignedTo?._id || "unassigned";
    if (!acc[supervisorId]) {
      acc[supervisorId] = {
        supervisor: query.assignedTo || {
          firstName: "Unassigned",
          lastName: "",
          email: "",
        },
        queries: [],
      };
    }
    acc[supervisorId].queries.push(query);
    return acc;
  }, {});

  return (
    <div className="escalations-container">
      <div className="escalations-header">
        <h1>⚠️ Escalations Management</h1>
        <p>Queries exceeding 48 hours require immediate action</p>
      </div>

      {Object.keys(groupedBySupervisor).length === 0 ? (
        <div className="no-escalations">
          <div className="icon">✅</div>
          <h3>No Escalated Issues</h3>
          <p>All queries are within SLA limits. Great work!</p>
        </div>
      ) : (
        Object.values(groupedBySupervisor).map((group) => (
          <div
            key={group.supervisor._id || "unassigned"}
            className="supervisor-card"
          >
            <div className="supervisor-header">
              <div className="supervisor-info">
                <span className="avatar">
                  {group.supervisor.firstName?.charAt(0) || "?"}
                </span>
                <div>
                  <h3>
                    {group.supervisor.firstName} {group.supervisor.lastName}
                  </h3>
                  <p>{group.supervisor.email}</p>
                </div>
              </div>
              <div className="stats">
                <span className="badge danger">
                  {group.queries.length} Escalated Queries
                </span>
                <button
                  className="replace-btn"
                  onClick={() => handleReplaceSupervisor(group.supervisor)}
                  disabled={!group.supervisor._id}
                >
                  🔄 Replace Supervisor
                </button>
              </div>
            </div>

            <div className="queries-list">
              <h4>Escalated Queries ({group.queries.length})</h4>
              <table className="escalation-table">
                <thead>
                  <tr>
                    <th>Student</th>
                    <th>Title</th>
                    <th>Created</th>
                    <th>Hours Old</th>
                    <th>Priority</th>
                  </tr>
                </thead>
                <tbody>
                  {group.queries.map((query) => {
                    const hoursOld = Math.floor(
                      (new Date() - new Date(query.createdAt)) /
                        (1000 * 60 * 60),
                    );
                    return (
                      <tr key={query._id}>
                        <td>
                          {query.user?.firstName} {query.user?.lastName}
                        </td>
                        <td>{query.title}</td>
                        <td>
                          {new Date(query.createdAt).toLocaleDateString()}
                        </td>
                        <td className="hours-old">{hoursOld} hrs</td>
                        <td>
                          <span
                            className={`priority ${query.priority?.toLowerCase()}`}
                          >
                            {query.priority}
                          </span>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        ))
      )}

      {/* Replace Supervisor Modal */}
      {showReplaceModal && selectedSupervisor && (
        <div
          className="modal-overlay"
          onClick={() => setShowReplaceModal(false)}
        >
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h3>Replace Supervisor</h3>
              <button
                className="close-btn"
                onClick={() => setShowReplaceModal(false)}
              >
                ×
              </button>
            </div>
            <div className="modal-body">
              <p>
                <strong>Current Supervisor:</strong>{" "}
                {selectedSupervisor.firstName} {selectedSupervisor.lastName}
              </p>
              <p>
                <strong>Queries to Reassign:</strong>{" "}
                {
                  escalatedQueries.filter(
                    (q) => q.assignedTo?._id === selectedSupervisor._id,
                  ).length
                }
              </p>
              <div className="form-group">
                <label>Select New Supervisor:</label>
                <select
                  value={selectedNewSupervisor}
                  onChange={(e) => setSelectedNewSupervisor(e.target.value)}
                >
                  <option value="">-- Select Supervisor --</option>
                  {availableSupervisors.map((sup) => (
                    <option key={sup._id} value={sup._id}>
                      {sup.firstName} {sup.lastName}
                    </option>
                  ))}
                </select>
              </div>
              <div className="warning-box">
                <span>⚠️</span>
                <p>
                  This action will:
                  <br />• Send a STRICT WARNING email to the current supervisor
                  <br />• Send assignment email to the new supervisor
                  <br />• Reassign all escalated queries
                </p>
              </div>
            </div>
            <div className="modal-footer">
              <button
                className="cancel-btn"
                onClick={() => setShowReplaceModal(false)}
              >
                Cancel
              </button>
              <button
                className="confirm-btn"
                onClick={confirmReassign}
                disabled={actionLoading || !selectedNewSupervisor}
              >
                {actionLoading ? "Reassigning..." : "Confirm Reassignment"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Escalations;
