///all the imports here
import "./App.css";
//importing dependencies here
import { useEffect } from "react";
import { Provider } from "./components/ui/provider.jsx";
import { createBrowserRouter, RouterProvider } from "react-router-dom";

//importing redux stuff here
import { setUserData } from "../src/app/userSlices.js";
import { useDispatch } from "react-redux";

//importing pages here
import Login from "./pages/Login.jsx";
import Home from "./pages/Home.jsx";
import Signup from "./pages/Signup.jsx";
import ForgotPassword from "./pages/ForgotPassword.jsx";
import Dashboard from "./pages/Dashboard.jsx";

///importing apis here
import { getUser } from "./services/GetService.jsx";

function App() {
  const dispatch = useDispatch();
  useEffect(() => {
    const fetchUser = async () => {
      try {
        const res = await getUser();
        console.log(res);
        if (res) {
          dispatch(setUserData(res?.data?.user));
        }
      } catch (err) {
        console.error(err.response?.data);
      }
    };
    fetchUser();
  }, []);

  const router = createBrowserRouter([
    { path: "/", element: <Home /> },
    { path: "forgotpassword", element: <ForgotPassword /> },
    { path: "login", element: <Login /> },
    { path: "signup", element: <Signup /> },
    { path: "dashboard", element: <Dashboard /> },
  ]);

  return (
    <Provider>
      <RouterProvider router={router} />
    </Provider>
  );
}

export default App;
