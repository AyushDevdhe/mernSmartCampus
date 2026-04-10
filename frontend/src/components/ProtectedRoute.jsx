///all the imports here
//importing redux stuff here
import { useSelector } from "react-redux";
//importing dependencies here
import { Navigate } from "react-router-dom";

const ProtectedRoute = ({ children }) => {
  const isAuthenticated = useSelector((state) => state.user.isAuthenticated);

  if (!isAuthenticated) {
    return <Navigate to={"/login"} />;
  }

  return children;
};

export default ProtectedRoute;
