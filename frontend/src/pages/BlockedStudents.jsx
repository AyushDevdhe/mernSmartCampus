import React, { useEffect, useState } from "react";
import { useSelector } from "react-redux";
import { useNavigate } from "react-router-dom";
import axios from "axios";
import "../css/BlockedStudents.css";

const BlockedStudents = () => {
  const user = useSelector((state) => state.user.data);
  const navigate = useNavigate();
  const [blockedStudents, setBlockedStudents] = useState([]);
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    if (user?.role !== "admin") {
      navigate("/dashboard");
      return;
    }
    fetchBlockedStudents();
  }, [user]);

  const fetchBlockedStudents = async () => {
    setIsLoading(true);
    try {
      const res = await axios.get(
        `${process.env.REACT_APP_BASE_URL}/users/blocked-students`,
        {
          withCredentials: true,
        },
      );
      if (res?.data?.success) {
        setBlockedStudents(res.data.students);
      }
    } catch (error) {
      console.error("Error fetching blocked students:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const unblockStudent = async (studentId) => {
    if (window.confirm("Are you sure you want to unblock this student?")) {
      try {
        const res = await axios.put(
          `${process.env.REACT_APP_BASE_URL}/users/unblock/${studentId}`,
          {},
          { withCredentials: true },
        );
        if (res?.data?.success) {
          alert("Student unblocked successfully!");
          fetchBlockedStudents();
        }
      } catch (error) {
        console.error("Error unblocking student:", error);
        alert(error.response?.data?.message || "Failed to unblock");
      }
    }
  };

  if (isLoading) {
    return (
      <div className="blocked-loading">
        <div className="spinner"></div>
        <p>Loading blocked students...</p>
      </div>
    );
  }

  return (
    <div className="blocked-container">
      <div className="page-header">
        <h1>🚫 Blocked Students</h1>
        <p>Students who have been blocked due to policy violations</p>
      </div>

      {blockedStudents.length === 0 ? (
        <div className="empty-state">
          <div className="empty-icon">✅</div>
          <h3>No Blocked Students</h3>
          <p>All students are in good standing.</p>
        </div>
      ) : (
        <div className="blocked-list">
          {blockedStudents.map((student) => (
            <div key={student._id} className="blocked-card">
              <div className="card-header">
                <div className="student-info">
                  <span className="student-avatar">
                    {student.firstName?.charAt(0)}
                    {student.lastName?.charAt(0)}
                  </span>
                  <div>
                    <h3>
                      {student.firstName} {student.lastName}
                    </h3>
                    <p>{student.email}</p>
                    {student.prn && <p className="prn">PRN: {student.prn}</p>}
                  </div>
                </div>
                <span className="blocked-badge">🚫 BLOCKED</span>
              </div>
              <div className="card-body">
                <div className="violation-stats">
                  <div className="stat">
                    <span className="stat-label">Offense Count</span>
                    <span className="stat-value">{student.offenseCount}</span>
                  </div>
                  <div className="stat">
                    <span className="stat-label">Blocked On</span>
                    <span className="stat-value">
                      {new Date(student.blockedAt).toLocaleDateString()}
                    </span>
                  </div>
                </div>
                <div className="violation-history">
                  <h4>Violation History:</h4>
                  <ul>
                    {student.offenseHistory?.map((offense, idx) => (
                      <li key={idx}>
                        <span className="offense-reason">{offense.reason}</span>
                        <span className="offense-date">
                          {new Date(offense.createdAt).toLocaleDateString()}
                        </span>
                      </li>
                    ))}
                  </ul>
                </div>
                <div className="card-actions">
                  <button
                    className="btn-unblock"
                    onClick={() => unblockStudent(student._id)}
                  >
                    🔓 Unblock Student
                  </button>
                  <button
                    className="btn-notify"
                    onClick={() => alert("Email notification sent to student")}
                  >
                    📧 Send Reminder
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default BlockedStudents;
