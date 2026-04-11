import { useSelector } from "react-redux";

const SideBar = ({ open, setOpen }) => {
  const isAuthenticated = useSelector((state) => state.user.isAuthenticated);

  return (
    <>
      {/* Overlay */}
      {open && (
        <div
          className="fixed inset-0 bg-black bg-opacity-30 z-40"
          onClick={() => setOpen(false)}
        ></div>
      )}

      {/* Sidebar */}
      <div
        className={`fixed top-0 left-0 h-full w-64 bg-black shadow-lg transform ${
          open ? "translate-x-0" : "-translate-x-full"
        } transition-transform duration-300 z-50`}
      >
        <div className="p-4 font-bold text-lg border-b">SmartCampus</div>

        {isAuthenticated ? (
          <div className="flex flex-col mt-2">
            <div className="px-4 py-2  cursor-pointer">Dashboard</div>
            <div className="px-4 py-2  cursor-pointer">Add Queries</div>
            <div className="px-4 py-2 cursor-pointer">Profile</div>
          </div>
        ) : (
          <div></div>
        )}
      </div>
    </>
  );
};

export default SideBar;
