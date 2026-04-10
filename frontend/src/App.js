import "./App.css";
import { useEffect } from "react";
import { Provider } from "./components/ui/provider.jsx";

import { createBrowserRouter, RouterProvider } from "react-router-dom";

import Login from "./pages/Login.jsx";
import Home from "./pages/Home.jsx";
import Signup from "./pages/Signup.jsx";
import ForgotPassword from "./pages/ForgotPassword.jsx";
import Dashboard from "./pages/Dashboard.jsx";


function App() {
 

  const router = createBrowserRouter([
    { path: "/", element: <Home /> },
    { path: "forgotpassword", element: <ForgotPassword /> },
    { path: "login", element: <Login /> },
    { path: "signup", element: <Signup /> },
    {path: "dashboard", element: <Dashboard />}
  ]);

  return (
    <Provider>
      <RouterProvider router={router} />
    </Provider>
  );
}

export default App;
