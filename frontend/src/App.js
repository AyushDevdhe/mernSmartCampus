//importing dependencies here
import { useEffect } from "react";
import { Provider } from "./components/ui/provider.jsx";
import { createBrowserRouter, RouterProvider } from "react-router-dom";

//importing redux stuff here
import { setUserData, setIsAuthenticated } from "../src/app/userSlices.js";
import { useDispatch } from "react-redux";


import Login from "./pages/Login.jsx";
import Home from "./pages/Home.jsx";
import Signup from "./pages/Signup.jsx";
import ForgotPassword from "./pages/ForgotPassword.jsx";
import Dashboard from "./pages/Dashboard.jsx"; 
import SupervisorDashboard from "./pages/SupervisorDashboard.jsx"; 
import AdminDashboard from "./pages/AdminDashboard.jsx"; 
import Layout from "./components/Layout.jsx";
import AddQuery from "./pages/AddQuery.jsx";
import UpdateQuery from "./pages/UpdateQuery.jsx";


import ProtectedRoute from "./components/ProtectedRoute.jsx";
import PublicRoute from "./components/PublicRoute.jsx";
import RoleBasedRoute from "./components/RoleBasedRoute.jsx"; 


import { getUser } from "./services/GetService.jsx";
import QueryDetails from "./pages/QueryDetails.jsx";
import Profile from "./pages/Profile.jsx";
import Escalations from "./pages/Escalations.jsx";
import ActionHistory from "./pages/ActionHistory.jsx";
import AssignedQueries from "./pages/AssignedQueries.jsx";
import ResolvedQueries from "./pages/ResolvedQueries.jsx";
import MyQueries from "./pages/MyQueries.jsx";
import InProgress from "./pages/InProgress.jsx";

function App() {
  const dispatch = useDispatch();

  useEffect(() => {
    const fetchUser = async () => {
      try {
        const res = await getUser();
        if (res) {
          dispatch(setUserData(res?.data?.user));
          dispatch(setIsAuthenticated(true));
        }
      } catch (err) {
        console.error(err.response?.data);
      }
    };
    fetchUser();
  }, [dispatch]);

  const router = createBrowserRouter([
    {
      path: "/",
      element: <Layout />,
      children: [
        { index: true, element: <Home /> },

        {
          path: "add-query",
          element: (
            <ProtectedRoute>
              <AddQuery />
            </ProtectedRoute>
          ),
        },

        {
          path: "update-query/:id",
          element: (
            <ProtectedRoute>
              <UpdateQuery />
            </ProtectedRoute>
          ),
        },

        // Student Dashboard (existing Dashboard component)
        {
          path: "dashboard",
          element: (
            <ProtectedRoute>
              <Dashboard />
            </ProtectedRoute>
          ),
        },

        // Supervisor Dashboard - NEW
        {
          path: "supervisor-dashboard",
          element: (
            <RoleBasedRoute allowedRoles={["supervisor"]}>
              <SupervisorDashboard />
            </RoleBasedRoute>
          ),
        },

        // Admin Dashboard - NEW
        {
          path: "admin-dashboard",
          element: (
            <RoleBasedRoute allowedRoles={["admin"]}>
              <AdminDashboard />
            </RoleBasedRoute>
          ),
        },

        {
          path: "login",
          element: (
            <PublicRoute>
              <Login />
            </PublicRoute>
          ),
        },

        {
          path: "signup",
          element: (
            <PublicRoute>
              <Signup />
            </PublicRoute>
          ),
        },

        {
          path: "forgotpassword",
          element: <ForgotPassword />,
        },

        {
          path: "query/:id",
          element: (
            <ProtectedRoute>
              <QueryDetails />
            </ProtectedRoute>
          ),
        },

        {
          path: "profile",
          element: (
            <ProtectedRoute>
              <Profile />
            </ProtectedRoute>
          ),
        },

        {
          path: "escalations",
          element: (
            <RoleBasedRoute allowedRoles={["admin"]}>
              <Escalations />
            </RoleBasedRoute>
          ),
        },

        {
          path: "action-history",
          element: (
            <RoleBasedRoute allowedRoles={["admin"]}>
              <ActionHistory />
            </RoleBasedRoute>
          ),
        },

        {
          path: "assigned-queries",
          element: (
            <RoleBasedRoute allowedRoles={["supervisor"]}>
              <AssignedQueries />
            </RoleBasedRoute>
          ),
        },
        {
          path: "resolved-queries",
          element: (
            <RoleBasedRoute allowedRoles={["supervisor"]}>
              <ResolvedQueries />
            </RoleBasedRoute>
          ),
        },

        {
          path: "my-queries",
          element: (
            <ProtectedRoute>
              <MyQueries />
            </ProtectedRoute>
          ),
        },

        {
          path: "in-progress",
          element: (
            <ProtectedRoute>
              <InProgress />
            </ProtectedRoute>
          ),
        },
      ],
    },
  ]);

  return (
    <Provider>
      <RouterProvider router={router} />
    </Provider>
  );
}

export default App;
