import { useSelector } from "react-redux";
import { Link } from "react-router-dom";

const Navbar = () => {
  const user = useSelector((state) => state.user.data);

  return (
    <div className="flex justify-between">
      {/* for logo and labelling */}
      <div>Smart Campus</div>
      {/* for dropdown or login / sign up buttons */}
      {user ? (
        <div>{/* dropdown here */}</div>
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
