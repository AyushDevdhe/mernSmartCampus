import { useSelector } from "react-redux";
import { Navigate } from "react-router-dom";

const RoleBasedRoute = ({ children, allowedRoles }) => {
  const { isAuthenticated, data: user } = useSelector((state) => state.user);
  const userRole = user?.role?.toLowerCase();

  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }

  if (!allowedRoles.includes(userRole)) {
    // Redirect to appropriate dashboard based on role
    if (userRole === "student") return <Navigate to="/dashboard" replace />;
    if (userRole === "supervisor")
      return <Navigate to="/supervisor-dashboard" replace />;
    if (userRole === "admin") return <Navigate to="/admin-dashboard" replace />;
    return <Navigate to="/" replace />;
  }

  return children;
};

export default RoleBasedRoute;
