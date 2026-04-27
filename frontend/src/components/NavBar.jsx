//importing dependencies here
import { useSelector } from "react-redux";
import { Link } from "react-router-dom";
import { clearUserData } from "../app/userSlices";
import { logOut } from "../services/GetService";
import { useDispatch } from "react-redux";
import NotificationBell from "./NotificationBell"; // ADD THIS

const Navbar = ({ toggleSideBar }) => {
  const user = useSelector((state) => state.user.data);
  const dispatch = useDispatch();

  const handleLogout = async () => {
    try {
      const res = await logOut();
      if (res) {
        console.log(res);
        dispatch(clearUserData());
        localStorage.removeItem("user");
      }
    } catch (err) {
      console.error(err.response?.data);
    }
  };

  const getDashboardLink = () => {
    const role = user?.role?.toLowerCase();
    if (role === "admin") return "/admin-dashboard";
    if (role === "supervisor") return "/supervisor-dashboard";
    return "/dashboard";
  };

  return (
    <header className="sticky top-0 z-30 border-b border-slate-200 bg-white/95 backdrop-blur">
      <div className="mx-auto flex h-16 w-full max-w-7xl items-center justify-between px-4 sm:px-6 lg:px-8">
        <div className="flex items-center gap-3">
          <button
            onClick={toggleSideBar}
            className="rounded-xl border border-slate-300 bg-white px-3 py-2 text-base text-slate-700 transition hover:bg-slate-100"
            aria-label="Toggle sidebar"
          >
            ☰
          </button>

          <Link to="/" className="group flex items-center gap-2">
            <span className="inline-flex h-8 w-8 items-center justify-center rounded-lg bg-sky-100 text-sm font-bold text-sky-700">
              SQ
            </span>
            <div>
              <p className="text-sm font-semibold leading-none text-slate-900 sm:text-base">
                SmartCampus
              </p>
              <p className="hidden text-xs text-slate-500 sm:block">
                Student Query Platform
              </p>
            </div>
          </Link>
        </div>

        <div className="flex items-center gap-3 sm:gap-4">
          {user && <NotificationBell />} {/* ADD NOTIFICATION BELL */}
          {user ? (
            <div className="group relative">
              <button className="flex items-center gap-2 rounded-full border border-slate-300 bg-slate-50 px-2 py-1.5 pr-3 text-sm transition hover:bg-slate-100">
                <span className="inline-flex h-8 w-8 items-center justify-center rounded-full bg-sky-600 text-xs font-semibold uppercase text-white">
                  {user?.firstName?.charAt(0) || "U"}
                </span>
                <span className="hidden font-medium text-slate-700 sm:inline">
                  {user?.firstName} ({user?.role})
                </span>
                <span className="text-slate-500">⌄</span>
              </button>

              <div className="invisible absolute right-0 mt-2 w-48 rounded-xl border border-slate-200 bg-white p-2 opacity-0 shadow-lg transition-all duration-150 group-hover:visible group-hover:opacity-100">
                <Link
                  to={getDashboardLink()}
                  className="block rounded-lg px-3 py-2 text-sm text-slate-700 transition hover:bg-sky-50 hover:text-sky-700"
                >
                  Dashboard
                </Link>
                <div className="cursor-default rounded-lg px-3 py-2 text-sm text-slate-500">
                  Profile
                </div>
                <div
                  className="cursor-pointer rounded-lg px-3 py-2 text-sm font-medium text-rose-600 transition hover:bg-rose-50"
                  onClick={handleLogout}
                >
                  Logout
                </div>
              </div>
            </div>
          ) : (
            <div className="flex items-center gap-2">
              <Link to="/login">
                <button className="rounded-lg border border-slate-300 bg-white px-4 py-2 text-sm font-medium text-slate-700 transition hover:bg-slate-100">
                  Log In
                </button>
              </Link>
              <Link to="/signup">
                <button className="rounded-lg bg-sky-600 px-4 py-2 text-sm font-semibold text-white transition hover:bg-sky-700">
                  Sign Up
                </button>
              </Link>
            </div>
          )}
        </div>
      </div>
    </header>
  );
};

export default Navbar;
