import React from "react";

function ForgotPassword() {
  return (
    <div className="mx-auto w-full max-w-md rounded-2xl border border-slate-200 bg-white p-6 shadow-sm sm:p-8">
      <h2 className="text-xl font-bold text-slate-900">Forgot Password</h2>
      <p className="mt-2 text-sm text-slate-600">
        Enter your email to receive a password reset link.
      </p>

      <input
        type="email"
        placeholder="Email Input"
        className="mt-5 w-full rounded-xl border border-slate-300 px-3 py-2.5 text-sm outline-none transition focus:border-sky-500 focus:ring-2 focus:ring-sky-100"
      ></input>

      <button
        type="submit"
        className="mt-4 w-full rounded-xl bg-sky-600 px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-sky-700"
      >
        Send reset Link
      </button>

      <h3 className="mt-4 text-center text-sm font-medium text-slate-600">
        back to login
      </h3>
    </div>
  );
}

export default ForgotPassword;
