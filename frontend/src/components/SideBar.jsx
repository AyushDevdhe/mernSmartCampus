import { useSelector } from "react-redux";
import { Link } from "react-router-dom";

const SideBar = ({ open, setOpen }) => {
  const isAuthenticated = useSelector((state) => state.user.isAuthenticated);
  const user = useSelector((state) => state.user.data);
  const userRole = user?.role?.toLowerCase();

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

  
  const adminMenu = [
    { name: "Dashboard", path: "/admin-dashboard", icon: "📊" },
    { name: "Escalations", path: "/escalations", icon: "⚠️" },
    { name: "Action History", path: "/action-history", icon: "📜" },
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
        <button
          type="button"
          className="fixed inset-0 z-40 bg-slate-900/40 backdrop-blur-sm"
          onClick={() => setOpen(false)}
          aria-label="Close sidebar"
        />
      )}

      {/* Sidebar */}
      <aside
        className={`fixed left-0 top-0 z-50 h-screen w-72 border-r border-slate-800 bg-slate-950 px-4 py-6 text-slate-200 shadow-2xl transition-transform duration-300 ${
          open ? "translate-x-0" : "-translate-x-full"
        }`}
      >
        <div className="mb-6 border-b border-slate-800 pb-5">
          <div className="flex items-center justify-between">
            <div>
              <div className="text-lg font-bold tracking-tight text-white">
                SmartCampus
              </div>
              <div className="text-xs text-slate-400">Query Command Center</div>
            </div>
            <button
              type="button"
              onClick={() => setOpen(false)}
              className="rounded-lg border border-slate-700 px-2 py-1 text-xs text-slate-300 transition hover:bg-slate-800"
            >
              Close
            </button>
          </div>
          {user && (
            <div className="mt-3 inline-flex rounded-full border border-sky-500/40 bg-sky-500/10 px-3 py-1 text-xs font-semibold uppercase tracking-wide text-sky-300">
              {user?.role}
            </div>
          )}
        </div>

        {isAuthenticated ? (
          <nav className="space-y-2">
            {menuItems.map((item, index) => (
              <Link
                key={index}
                to={item.path}
                className="flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium text-slate-300 transition hover:bg-slate-800 hover:text-white"
                onClick={() => setOpen(false)}
              >
                <span className="text-base">{item.icon}</span>
                <span>{item.name}</span>
              </Link>
            ))}
          </nav>
        ) : (
          <nav className="space-y-2">
            <Link
              to="/login"
              className="flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium text-slate-300 transition hover:bg-slate-800 hover:text-white"
              onClick={() => setOpen(false)}
            >
              <span className="text-base">🔐</span>
              <span>Login</span>
            </Link>
            <Link
              to="/signup"
              className="flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium text-slate-300 transition hover:bg-slate-800 hover:text-white"
              onClick={() => setOpen(false)}
            >
              <span className="text-base">📝</span>
              <span>Sign Up</span>
            </Link>
          </nav>
        )}

        <div className="mt-8 rounded-xl border border-slate-800 bg-slate-900 p-3 text-xs text-slate-400">
          {/* Role-based Tip */}
          <div className="mt-8 rounded-xl border border-slate-800 bg-slate-900 p-3 text-xs text-slate-400">
            {userRole === "student" && (
              <>
                💡 Tip: Use "Add Query" to raise issues quickly and track
                progress in your dashboard.
              </>
            )}
            {userRole === "supervisor" && (
              <>
                💡 Tip: Assign unresolved queries to yourself and mark them
                resolved when completed.
              </>
            )}
            {userRole === "admin" && (
              <>
                💡 Tip: Monitor all queries, supervisor performance, and handle
                escalated issues.
              </>
            )}
            {!userRole && (
              <>
                💡 Tip: Login to access your personalized dashboard and manage
                queries.
              </>
            )}
          </div>
        </div>
      </aside>
    </>
  );
};

export default SideBar;
