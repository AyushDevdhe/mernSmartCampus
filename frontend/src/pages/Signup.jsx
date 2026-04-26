import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { signupApi } from "../services/GetService";
import { sendOtpApi } from "../services/GetService";

export const Signup = () => {
  const navigate = useNavigate();
  const [firstName, registerfirstName] = useState("");
  const [lastName, registerlastName] = useState("");
  const [email, registerEmail] = useState("");
  const [password, registerPassword] = useState("");
  const [confirmPass, registerConfirmPass] = useState("");
  const [prn, registerPrn] = useState("");
  const [otp, registerotp] = useState("");
  const [sentOtp, registerSentOtp] = useState(false);
  // Role is now fixed to "student" for normal signup
  const role = "student";

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
      if (!prn) {
        alert("PRN is required for student registration");
        return;
      }

      const payload = {
        firstName,
        lastName,
        email,
        password,
        otp,
        role,
        createdByAdmin: false, // Normal user, not created by admin
      };

      if (prn) {
        payload.prn = prn;
      }

      const res = await signupApi(payload);
      console.log(res.data);

      if (res.data.success) {
        alert("Student account created successfully!");
        navigate("/login");
      } else {
        alert(res.data.message);
      }
    } catch (error) {
      console.log(error);
      alert(error.response?.data?.message || "Signup failed");
    }
  };

  const verify = async () => {
    try {
      const res = await sendOtpApi(email);
      console.log(res.data);

      if (res.data.success) {
        alert("OTP Sent! Check your email or server console.");
        registerSentOtp(true);
      } else {
        console.log(res.data.message);
      }
    } catch (error) {
      console.log(error);
      alert(error.response?.data?.message || "Failed to send OTP");
    }
  };

  return (
    <div className="signup-container">
      <h2>Student Sign Up</h2>
      <p style={{ color: "#666", fontSize: "14px", marginBottom: "16px" }}>
        Only student accounts can be created here. Supervisor and Admin accounts
        must be created by an Admin.
      </p>

      <input
        type="text"
        placeholder="First Name"
        onChange={(e) => registerfirstName(e.target.value)}
      />

      <input
        type="text"
        placeholder="Last Name"
        onChange={(e) => registerlastName(e.target.value)}
      />

      <input
        type="number"
        placeholder="PRN (Required)"
        onChange={(e) => registerPrn(e.target.value)}
      />

      <input
        type="email"
        placeholder="E-Mail"
        onChange={(e) => registerEmail(e.target.value)}
      />

      <button onClick={verify}>Send OTP</button>

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
      />

      <input
        type="password"
        placeholder="Confirm Password"
        onChange={(e) => registerConfirmPass(e.target.value)}
      />

      <button type="submit" onClick={registerUser}>
        Sign Up as Student
      </button>

      <h1
        onClick={() => navigate("/login")}
        style={{ cursor: "pointer", color: "blue" }}
      >
        Already have an account? Login
      </h1>
    </div>
  );
};

export default Signup;
