import React from "react";


function Signup() {
    return (
      <>
        <input type="text" placeholder="First Name"></input>

        <input type="text" placeholder="Last Name"></input>

        <input type="email" placeholder="E-Mail"></input>

        <input type="password" placeholder="Password"></input>

        <input type="password" placeholder="Confirm Password"></input>

        <button type="submit">Sign Up</button>

        <h1>already have an account? login</h1>
      </>
    );
}

export default Signup;