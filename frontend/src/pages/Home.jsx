import React from "react";
import Signup from "./Signup.jsx";
import Login from "./Login.jsx";
import ForgotPassword from "./ForgotPassword.jsx";
function Home() {
  return (
    <>
      {/* <Login></Login>
            <ForgotPassword></ForgotPassword>
            <Signup></Signup>
            <button>Login</button> */}

      <header class="section-navbar">
        <section class="top_txt">
          <div class="head container">
            <div class="head_txt">
              <p>Smart Campus - College Management Application</p>
            </div>
          </div>
        </section>
        <div class="container">
          <div class="navbar-brand">
            <p>SmartCampus</p>
          </div>

          <br />

          <nav>
            <ul>
              <li class="nav-item">
                <a href="/login">Login</a>
              </li>
              <li class="nav-item">
                <a href="signup" class="nav-link">
                  Signup
                </a>
              </li>
            </ul>
          </nav>
        </div>
      </header>
    </>
  );
}

export default Home;
