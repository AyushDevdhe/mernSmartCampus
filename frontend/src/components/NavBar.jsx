//importing dependencies here
import { useSelector } from "react-redux";
import { Link } from "react-router-dom";
import { clearUserData } from "../app/userSlices";
import { logOut } from "../services/GetService";
import { useDispatch } from "react-redux";
import NotificationBell from "./NotificationBell"; // ADD THIS
import "../css/Navbar.css";
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
    <div className="flex justify-between items-center">
      <div className="flex items-center gap-4">
        <button onClick={toggleSideBar}>☰</button>
        <Link to={"/"}>
          <div>Smart Campus</div>
        </Link>
      </div>

      <div className="flex items-center gap-4">
        {user && <NotificationBell />} {/* ADD NOTIFICATION BELL */}
        {user ? (
          <div className="relative group">
            <button className="px-3 py-1 border rounded">
              {user?.firstName} ({user?.role}) ⌄
            </button>
            <div className="absolute right-0 mt-2 w-40 border rounded shadow-md opacity-0 group-hover:opacity-100 transition bg-black">
              <Link to={getDashboardLink()}>
                <div className="px-4 py-2 cursor-pointer">Dashboard</div>
              </Link>
              <div className="px-4 py-2 cursor-pointer">Profile</div>
              <div
                className="px-4 py-2 cursor-pointer text-red-500"
                onClick={handleLogout}
              >
                Logout
              </div>
            </div>
          </div>
        ) : (
          <div className="flex gap-2">
            <Link to={"/login"}>
              <button>Log In</button>
            </Link>
            <Link to={"/signup"}>
              <button>Sign Up</button>
            </Link>
          </div>
        )}
      </div>
    </div>
  );
};

export default Navbar;
