import { useSelector } from "react-redux";
import { Link } from "react-router-dom";
import "../css/Sidebar.css";

const SideBar = ({ open, setOpen }) => {
  const isAuthenticated = useSelector((state) => state.user.isAuthenticated);
  const user = useSelector((state) => state.user.data);
  const userRole = user?.role?.toLowerCase();

  // Get dashboard link based on role
  const getDashboardLink = () => {
    if (userRole === "admin") return "/admin-dashboard";
    if (userRole === "supervisor") return "/supervisor-dashboard";
    return "/dashboard";
  };

  // Student Sidebar Menu with icons
  const studentMenu = [
    { name: "Dashboard", path: "/dashboard", icon: "📊" },
    { name: "Add Query", path: "/add-query", icon: "➕" },
    { name: "My Queries", path: "/dashboard", icon: "📋" },
    { name: "Profile", path: "/profile", icon: "👤" },
  ];

  // Supervisor Sidebar Menu with icons
  const supervisorMenu = [
    { name: "Dashboard", path: "/supervisor-dashboard", icon: "📊" },
    { name: "Assigned Queries", path: "/supervisor-dashboard", icon: "📌" },
    { name: "Resolve Queries", path: "/supervisor-dashboard", icon: "✅" },
    { name: "Profile", path: "/profile", icon: "👤" },
  ];

  // Admin Sidebar Menu with icons
  const adminMenu = [
    { name: "Dashboard", path: "/admin-dashboard", icon: "📊" },
    { name: "All Queries", path: "/admin-dashboard", icon: "📋" },
    { name: "Supervisors", path: "/admin-dashboard", icon: "👥" },
    { name: "Escalations", path: "/admin-dashboard", icon: "⚠️" },
    { name: "Profile", path: "/profile", icon: "👤" },
  ];

  // Select menu based on role
  const getMenuItems = () => {
    if (userRole === "admin") return adminMenu;
    if (userRole === "supervisor") return supervisorMenu;
    return studentMenu;
  };

  const menuItems = getMenuItems();

  return (
    <>
      {/* Overlay */}
      {open && (
        <div className="sidebar-overlay" onClick={() => setOpen(false)}></div>
      )}

      {/* Sidebar */}
      <div className={`sidebar ${open ? "open" : "closed"}`}>
        <div className="sidebar-header">
          <div className="sidebar-logo">SmartCampus</div>
          {user && <div className="sidebar-role">{user?.role}</div>}
        </div>

        {isAuthenticated ? (
          <div className="sidebar-menu">
            {menuItems.map((item, index) => (
              <Link
                key={index}
                to={item.path}
                className="menu-item"
                onClick={() => setOpen(false)}
              >
                <span className="menu-icon">{item.icon}</span>
                <span className="menu-text">{item.name}</span>
              </Link>
            ))}
          </div>
        ) : (
          <div className="sidebar-menu">
            <Link
              to="/login"
              className="menu-item"
              onClick={() => setOpen(false)}
            >
              <span className="menu-icon">🔐</span>
              <span className="menu-text">Login</span>
            </Link>
            <Link
              to="/signup"
              className="menu-item"
              onClick={() => setOpen(false)}
            >
              <span className="menu-icon">📝</span>
              <span className="menu-text">Sign Up</span>
            </Link>
          </div>
        )}
      </div>
    </>
  );
};

export default SideBar;
