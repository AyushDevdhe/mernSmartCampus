///all the imports here
import "./App.css";
//importing dependencies here
import { useEffect } from "react";
import { Provider } from "./components/ui/provider.jsx";
import { createBrowserRouter, RouterProvider } from "react-router-dom";

//importing redux stuff here
import { setUserData, setIsAuthenticated } from "../src/app/userSlices.js";
import { useDispatch } from "react-redux";

//importing pages here
import Login from "./pages/Login.jsx";
import Home from "./pages/Home.jsx";
import Signup from "./pages/Signup.jsx";
import ForgotPassword from "./pages/ForgotPassword.jsx";
import Dashboard from "./pages/Dashboard.jsx";
import NavBar from "./components/NavBar.jsx";
import Layout from "./components/Layout.jsx";

//importing components here
import ProtectedRoute from "./components/ProtectedRoute.jsx";
import PublicRoute from "./components/PublicRoute.jsx";

///importing apis here
import { getUser } from "./services/GetService.jsx";

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
  }, []);

  const router = createBrowserRouter([
    {
      path: "/",
      element: <Layout />,
      children: [
        { index: true, element: <Home /> },
        {
          path: "dashboard",
          element: (
            <ProtectedRoute>
              <Dashboard />
            </ProtectedRoute>
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
