//importing dependencies here
import { useSelector } from "react-redux";
import { Link } from "react-router-dom";
import { clearUserData } from "../app/userSlices";
import { logOut } from "../services/GetService";
import { useDispatch } from "react-redux";

const Navbar = ({ toggleSideBar }) => {
  const user = useSelector((state) => state.user.data);
  const dispatch = useDispatch();

  const handleLogout = async () => {
    try {
      const res = await logOut();
      if (res) {
        console.log(res);
        dispatch(clearUserData());
      }
    } catch (err) {
      console.error(err.response?.data);
    }
  };

  return (
    <div className="flex justify-between">
      <div>
        {/* the burger menu for sidebar toggling */}
        <button onClick={toggleSideBar}>☰</button>
        {/* for logo and labelling */}
        <Link to={"/"}>
          <div>Smart Campus</div>
        </Link>
      </div>
      {/* for dropdown or login / sign up buttons */}
      {user ? (
        <div className="relative group">
          <button className="px-3 py-1 border rounded">
            {user?.firstName} ⌄
          </button>

          <div className="absolute right-0 mt-2 w-40  border rounded shadow-md opacity-0 group-hover:opacity-100 transition bg-black">
            <Link to="/dashboard">
              <div className="px-4 py-2  cursor-pointer">Dashboard</div>
            </Link>

            <div className="px-4 py-2  cursor-pointer">Profile</div>

            <div
              className="px-4 py-2  cursor-pointer text-red-500"
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
  );
};

export default Navbar;
