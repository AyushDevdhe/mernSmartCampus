import React from "react";
import {
  createBrowserRouter,
  RouterProvider,
  createRoutesFromElements,
  Route,
} from "react-router-dom";


function Login(){
    return (
      <>
        {/* <label id="email"></label> */}
        <input id="email" type="email"></input>
        <input type="password"></input>

        <button type="submit">Login</button>

        <h3>Forgot Password</h3>
        <h4>“don’t have an account? sign up</h4>
      </>
    );
}

export default Login;