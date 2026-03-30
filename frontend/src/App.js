import "./App.css";

import {
  createBrowserRouter,
  RouterProvider,
  createRoutesFromElements,
  Route,
} from "react-router-dom";

import Login from './pages/Login.jsx';
import Home from './pages/Home.jsx';
import Signup from './pages/Signup.jsx';
import ForgotPassword from './pages/ForgotPassword.jsx';

function App() {

  const router = createBrowserRouter([
    {
      path: "/",
      element: <Home></Home>,
    },

    {
      path: "forgotpassword",
      element: <ForgotPassword></ForgotPassword>,
    },

    {
      path: "login",
      element: <Login></Login>,
    },

    {
      path: "signup",
      element: <Signup></Signup>,
    },

  ]);

  return <RouterProvider router = {router}></RouterProvider>
}

export default App;
