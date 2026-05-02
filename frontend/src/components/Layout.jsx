import { Outlet } from "react-router-dom";
import { useState, useEffect } from "react";
import { useDispatch, useSelector } from "react-redux";
import { useNavigate } from "react-router-dom";
import { clearUserData } from "../app/userSlices";
import NavBar from "./NavBar";
import SideBar from "./SideBar";

const Layout = () => {
  const [open, setOpen] = useState(false);
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const user = useSelector((state) => state.user.data);

  // Check block status on every page load
  useEffect(() => {
    if (user?.isBlocked) {
      dispatch(clearUserData());
      localStorage.removeItem("user");
      alert("🚫 Your account has been BLOCKED. Contact Admin.");
      navigate("/login");
    }
  }, [user, dispatch, navigate]);

  return (
    <div className="min-h-screen bg-slate-50">
      <NavBar toggleSideBar={() => setOpen((prev) => !prev)} />
      <SideBar open={open} setOpen={setOpen} />

      <main className="mx-auto w-full max-w-7xl px-4 py-6 sm:px-6 lg:px-8">
        <Outlet />
      </main>
    </div>
  );
};

export default Layout;
