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
  { name: "In Progress", path: "/in-progress", icon: "⚡" },
  { name: "Resolved", path: "/my-queries", icon: "✅" },
  { name: "Profile", path: "/profile", icon: "👤" },
];

  // Supervisor Sidebar Menu with icons
const supervisorMenu = [
  { name: "Dashboard", path: "/supervisor-dashboard", icon: "📊" },
  { name: "Assigned Queries", path: "/assigned-queries", icon: "📌" },
  { name: "Resolved Queries", path: "/resolved-queries", icon: "✅" },
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
          className="fixed inset-0 z-40 bg-black/20 backdrop-blur-sm"
          onClick={() => setOpen(false)}
          aria-label="Close sidebar"
        />
      )}

      {/* Sidebar */}
      <aside
        className={`fixed left-0 top-0 z-50 h-screen w-72 border-r border-slate-200 px-4 py-6 bg-white text-slate-900 shadow-2xl transition-transform duration-300 ${
          open ? "translate-x-0" : "-translate-x-full"
        }`}
      >
        <div className="mb-6 border-b border-slate-200 pb-5">
          <div className="flex items-center justify-between">
            <div>
              <div className="text-lg font-bold tracking-tight text-slate-900">
                SmartCampus
              </div>
              <div className="text-xs text-slate-500">Query Command Center</div>
            </div>
            <button
              type="button"
              onClick={() => setOpen(false)}
              className="rounded-lg border border-slate-300 px-2 py-1 text-xs text-slate-600 transition hover:bg-slate-100 hover:text-slate-900"
            >
              Close
            </button>
          </div>
          {user && (
            <div className="mt-3 inline-flex rounded-full border border-sky-200 bg-sky-50 px-3 py-1 text-xs font-semibold uppercase tracking-wide text-sky-700">
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
                className="flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium text-slate-600 transition hover:bg-slate-100 hover:text-slate-900"
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
              className="flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium text-slate-600 transition hover:bg-slate-100 hover:text-slate-900"
              onClick={() => setOpen(false)}
            >
              <span className="text-base">🔐</span>
              <span>Login</span>
            </Link>
            <Link
              to="/signup"
              className="flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium text-slate-600 transition hover:bg-slate-100 hover:text-slate-900"
              onClick={() => setOpen(false)}
            >
              <span className="text-base">📝</span>
              <span>Sign Up</span>
            </Link>
          </nav>
        )}

        <div className="mt-8 rounded-xl border border-slate-200 bg-slate-50 p-3 text-xs text-slate-600">
          {/* Role-based Tip */}
          <div className="mt-8 rounded-xl border border-slate-200 bg-slate-50 p-3 text-xs text-slate-600">
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
