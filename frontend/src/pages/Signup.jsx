import React, { useState } from "react";

import { signupApi } from "../services/GetService";
import { sendOtpApi } from "../services/GetService";
export const Signup = () => {
  const [firstName, registerfirstName] = useState("");
  const [lastName, registerlastName] = useState("");
  const [email, registerEmail] = useState("");
  const [password, registerPassword] = useState("");
  const [confirmPass, registerConfirmPass] = useState("");
  const [prn, registerPrn] = useState("");
  const [otp, registerotp] = useState("");
  const [sentOtp, registerSentOtp] = useState(false);

  const registerUser = async () => {
    try {
      if (password !== confirmPass) {
        alert("Passwords Do not match");
        return;
      }
      if (!otp) {
        alert("Enter OTP");
        return;
      }

      const res = await signupApi({
        firstName,
        lastName,
        email,
        password,
        prn,
        otp,
      });
      console.log(res.data);

      if (res.data.success) {
        alert("User Created Successfully");
      } else {
        alert(res.data.message);
      }
    } catch (error) {
      console.log(error);
      console.log("Error: ", error.message);
      console.log("Error Status: ", error.response.status);
      console.log("Error Data: ", error.response.data);
    }
  };

  const verify = async () => {
    try {
      console.log("Clicked");

      // alert("OTP Sent");
      const res = await sendOtpApi(email);
      console.log(res.data);

      if (res.data.success) {
        alert("OTP Sent");
        registerSentOtp(true);
      } else {
        console.log(res.data.message);
      }
    } catch (error) {
      console.log(error);
      console.log("Error: ", error.message);
      console.log("Error Status: ", error.response.status);
      console.log("Error Data: ", error.response.data);
    }
  };

  return (
    <>
      <input
        type="text"
        placeholder="First Name"
        onChange={(e) => registerfirstName(e.target.value)}
      ></input>

      <input
        type="text"
        placeholder="Last Name"
        onChange={(e) => registerlastName(e.target.value)}
      ></input>

      <input
        type="number"
        placeholder="PRN"
        onChange={(e) => registerPrn(e.target.value)}
      ></input>

      <input
        type="email"
        placeholder="E-Mail"
        onChange={(e) => registerEmail(e.target.value)}
      ></input>

      <button onClick={verify}>Send Otp</button>

      {sentOtp && (
        <input
          type="number"
          placeholder="Enter OTP"
          onChange={(e) => registerotp(e.target.value)}
        />
      )}

      <input
        type="password"
        placeholder="Password"
        onChange={(e) => registerPassword(e.target.value)}
      ></input>

      <input
        type="password"
        placeholder="Confirm Password"
        onChange={(e) => registerConfirmPass(e.target.value)}
      ></input>

      <button type="submit" onClick={registerUser}>
        Sign Up
      </button>

      <h1>already have an account? login</h1>
    </>
  );
};

export default Signup;

// Signup button blovked -> otp field -> otp verfivcation -> matched with backend -> signup button unblock
