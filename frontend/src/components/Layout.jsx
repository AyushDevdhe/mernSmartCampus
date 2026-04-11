import { Outlet } from "react-router-dom";
import { useState } from "react";

import NavBar from "./NavBar";
import SideBar from "./SideBar";

const Layout = () => {
  const [open, setOpen] = useState(false);

  return (
    <>
      <NavBar toggleSideBar={() => setOpen((prev) => !prev)} />
      <SideBar open={open} setOpen={setOpen} />
      <Outlet />
    </>
  );
};

export default Layout;
