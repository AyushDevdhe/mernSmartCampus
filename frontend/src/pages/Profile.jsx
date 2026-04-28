import { useEffect, useState } from "react";
import { useSelector } from "react-redux";
import { useNavigate } from "react-router-dom";
import { getUser } from "../services/GetService";
import "../css/Profile.css";

const Profile = () => {
  const user = useSelector((state) => state.user.data);
  const navigate = useNavigate();
const [profile, setProfile] = useState(null);
const [isLoading, setIsLoading] = useState(true);
const [stats, setStats] = useState({
  totalQueries: 0,
  resolvedQueries: 0,
  pendingQueries: 0,
});

useEffect(() => {
  const fetchProfile = async () => {
    try {
      const res = await getUser();
      if (res?.data?.success) {
        const userData = res.data.user;
        setProfile(userData);

        // Use queryStats from backend if available
        if (userData.queryStats) {
          setStats({
            totalQueries: userData.queryStats.total,
            resolvedQueries: userData.queryStats.resolved,
            pendingQueries:
              userData.queryStats.pending + userData.queryStats.inProgress,
          });
        } else if (userData.role === "student" && userData.queries) {
          // Fallback calculation
          const queries = userData.queries || [];
          setStats({
            totalQueries: queries.length,
            resolvedQueries: queries.filter((q) => q.status === "Resolved")
              .length,
            pendingQueries: queries.filter((q) => q.status !== "Resolved")
              .length,
          });
        }
      }
    } catch (error) {
      console.error("Error fetching profile:", error);
    } finally {
      setIsLoading(false);
    }
  };

  fetchProfile();
}, []);

  const getRoleBadge = (role) => {
    switch (role) {
      case "admin":
        return { bg: "#fee2e2", color: "#dc2626", label: "Administrator" };
      case "supervisor":
        return { bg: "#fef3c7", color: "#d97706", label: "Supervisor" };
      case "student":
        return { bg: "#dbeafe", color: "#2563eb", label: "Student" };
      default:
        return { bg: "#e2e8f0", color: "#475569", label: role };
    }
  };

  if (isLoading) {
    return (
      <div className="profile-loading">
        <div className="spinner"></div>
        <p>Loading profile...</p>
      </div>
    );
  }

  if (!profile) {
    return (
      <div className="profile-error">
        <p>Failed to load profile. Please try again.</p>
        <button onClick={() => navigate("/dashboard")}>Go Back</button>
      </div>
    );
  }

  const roleBadge = getRoleBadge(profile.role);
  const memberSince = new Date(profile.createdAt).toLocaleDateString("en-US", {
    year: "numeric",
    month: "long",
    day: "numeric",
  });

  return (
    <div className="profile-container">
      {/* Header Section */}
      <div className="profile-header">
        <div className="profile-avatar">
          <span className="avatar-initials">
            {profile.firstName?.charAt(0)}
            {profile.lastName?.charAt(0)}
          </span>
        </div>
        <div className="profile-title">
          <h1>
            {profile.firstName} {profile.lastName}
          </h1>
          <span
            className="role-badge"
            style={{ background: roleBadge.bg, color: roleBadge.color }}
          >
            {roleBadge.label}
          </span>
        </div>
      </div>

      {/* Stats Cards - Only for Students */}
      {profile.role === "student" && (
        <div className="profile-stats">
          <div className="stat-card total">
            <div className="stat-icon">📋</div>
            <div className="stat-info">
              <span className="stat-value">{stats.totalQueries}</span>
              <span className="stat-label">Total Queries</span>
            </div>
          </div>
          <div className="stat-card resolved">
            <div className="stat-icon">✅</div>
            <div className="stat-info">
              <span className="stat-value">{stats.resolvedQueries}</span>
              <span className="stat-label">Resolved</span>
            </div>
          </div>
          <div className="stat-card pending">
            <div className="stat-icon">⏳</div>
            <div className="stat-info">
              <span className="stat-value">{stats.pendingQueries}</span>
              <span className="stat-label">Pending</span>
            </div>
          </div>
        </div>
      )}

      {/* Profile Info Cards */}
      <div className="profile-info-grid">
        {/* Personal Information */}
        <div className="info-card">
          <div className="card-header">
            <span className="card-icon">👤</span>
            <h3>Personal Information</h3>
          </div>
          <div className="card-body">
            <div className="info-row">
              <span className="info-label">First Name</span>
              <span className="info-value">{profile.firstName}</span>
            </div>
            <div className="info-row">
              <span className="info-label">Last Name</span>
              <span className="info-value">{profile.lastName}</span>
            </div>
            <div className="info-row">
              <span className="info-label">Email</span>
              <span className="info-value">{profile.email}</span>
            </div>
            {profile.prn && (
              <div className="info-row">
                <span className="info-label">PRN Number</span>
                <span className="info-value">{profile.prn}</span>
              </div>
            )}
          </div>
        </div>

        {/* Account Information */}
        <div className="info-card">
          <div className="card-header">
            <span className="card-icon">⚙️</span>
            <h3>Account Information</h3>
          </div>
          <div className="card-body">
            <div className="info-row">
              <span className="info-label">Role</span>
              <span className="info-value capitalize">{profile.role}</span>
            </div>
            <div className="info-row">
              <span className="info-label">Member Since</span>
              <span className="info-value">{memberSince}</span>
            </div>
            <div className="info-row">
              <span className="info-label">Account Status</span>
              <span className="info-value status-active">Active</span>
            </div>
          </div>
        </div>
      </div>

      {/* Quick Actions */}
      <div className="profile-actions">
        <button
          className="action-btn change-password"
          onClick={() => alert("Change Password - To be implemented")}
        >
          🔑 Change Password
        </button>
        <button
          className="action-btn dashboard"
          onClick={() => navigate("/dashboard")}
        >
          📊 Go to Dashboard
        </button>
      </div>
    </div>
  );
};

export default Profile;
