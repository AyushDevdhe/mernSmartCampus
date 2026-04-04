import "./App.css";
import { Provider } from "./components/ui/provider.jsx";

import { createBrowserRouter, RouterProvider } from "react-router-dom";

import Login from "./pages/Login.jsx";
import Home from "./pages/Home.jsx";
import Signup from "./pages/Signup.jsx";
import ForgotPassword from "./pages/ForgotPassword.jsx";

function App() {
  const router = createBrowserRouter([
    { path: "/", element: <Home /> },
    { path: "forgotpassword", element: <ForgotPassword /> },
    { path: "login", element: <Login /> },
    { path: "signup", element: <Signup /> },
  ]);

  return (
    <Provider>
      <RouterProvider router={router} />
    </Provider>
  );
}

export default App;
