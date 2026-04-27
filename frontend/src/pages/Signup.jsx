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
    <div className="mx-auto w-full max-w-xl rounded-2xl border border-slate-200 bg-white p-6 shadow-sm sm:p-8">
      <h2 className="text-2xl font-bold text-slate-900">Student Sign Up</h2>
      <p className="mt-2 text-sm text-slate-600">
        Only student accounts can be created here. Supervisor and Admin accounts
        must be created by an Admin.
      </p>

      <div className="mt-6 grid gap-4 sm:grid-cols-2">
        <input
          type="text"
          placeholder="First Name"
          onChange={(e) => registerfirstName(e.target.value)}
          className="rounded-xl border border-slate-300 px-3 py-2.5 text-sm outline-none transition focus:border-sky-500 focus:ring-2 focus:ring-sky-100"
        />

        <input
          type="text"
          placeholder="Last Name"
          onChange={(e) => registerlastName(e.target.value)}
          className="rounded-xl border border-slate-300 px-3 py-2.5 text-sm outline-none transition focus:border-sky-500 focus:ring-2 focus:ring-sky-100"
        />

        <input
          type="number"
          placeholder="PRN (Required)"
          onChange={(e) => registerPrn(e.target.value)}
          className="rounded-xl border border-slate-300 px-3 py-2.5 text-sm outline-none transition focus:border-sky-500 focus:ring-2 focus:ring-sky-100"
        />

        <input
          type="email"
          placeholder="E-Mail"
          onChange={(e) => registerEmail(e.target.value)}
          className="rounded-xl border border-slate-300 px-3 py-2.5 text-sm outline-none transition focus:border-sky-500 focus:ring-2 focus:ring-sky-100"
        />
      </div>

      <div className="mt-4 flex flex-wrap items-center gap-3">
        <button
          onClick={verify}
          className="rounded-xl border border-slate-300 bg-white px-4 py-2 text-sm font-semibold text-slate-700 transition hover:bg-slate-100"
        >
          Send OTP
        </button>
        {sentOtp && (
          <span className="rounded-full bg-emerald-100 px-3 py-1 text-xs font-semibold text-emerald-700">
            OTP sent
          </span>
        )}
      </div>

      {sentOtp && (
        <input
          type="number"
          placeholder="Enter OTP"
          onChange={(e) => registerotp(e.target.value)}
          className="mt-4 w-full rounded-xl border border-slate-300 px-3 py-2.5 text-sm outline-none transition focus:border-sky-500 focus:ring-2 focus:ring-sky-100"
        />
      )}

      <div className="mt-4 grid gap-4 sm:grid-cols-2">
        <input
          type="password"
          placeholder="Password"
          onChange={(e) => registerPassword(e.target.value)}
          className="rounded-xl border border-slate-300 px-3 py-2.5 text-sm outline-none transition focus:border-sky-500 focus:ring-2 focus:ring-sky-100"
        />

        <input
          type="password"
          placeholder="Confirm Password"
          onChange={(e) => registerConfirmPass(e.target.value)}
          className="rounded-xl border border-slate-300 px-3 py-2.5 text-sm outline-none transition focus:border-sky-500 focus:ring-2 focus:ring-sky-100"
        />
      </div>

      <button
        type="submit"
        onClick={registerUser}
        className="mt-6 w-full rounded-xl bg-sky-600 px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-sky-700"
      >
        Sign Up as Student
      </button>

      <h1
        onClick={() => navigate("/login")}
        className="mt-4 cursor-pointer text-center text-sm text-slate-600"
      >
        Already have an account?{" "}
        <span className="font-semibold text-sky-700">Login</span>
      </h1>
    </div>
  );
};

export default Signup;
