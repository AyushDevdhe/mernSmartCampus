import { Outlet } from "react-router-dom";
import { useState } from "react";

import NavBar from "./NavBar";
import SideBar from "./SideBar";

const Layout = () => {
  const [open, setOpen] = useState(false);

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
