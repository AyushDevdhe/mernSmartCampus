import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useDispatch } from "react-redux";
import { loginApi } from "../services/GetService";
import { setUserData, setIsAuthenticated } from "../app/userSlices";

export const Login = () => {
  const navigate = useNavigate();
  const dispatch = useDispatch();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  const handleLoginData = async () => {
    setIsLoading(true);
    try {
      const res = await loginApi({ email, password });
      console.log(res.data);

      if (res.data.success) {
        const user = res.data.user;

        // Store user in localStorage
        localStorage.setItem("user", JSON.stringify(user));

        // Dispatch to Redux store
        dispatch(setUserData(user));
        dispatch(setIsAuthenticated(true));

        alert("Login Successful");

        // Navigate based on role
        switch (user.role?.toLowerCase()) {
          case "admin":
            navigate("/admin-dashboard");
            break;
          case "supervisor":
            navigate("/supervisor-dashboard");
            break;
          case "student":
          default:
            navigate("/dashboard");
            break;
        }
      } else {
        alert(res.data.message);
      }
    } catch (error) {
      console.log(error);
      console.log("Error: ", error.message);
      console.log("Error Status: ", error.response?.status);
      console.log("Error Data: ", error.response?.data);
      alert(error.response?.data?.message || "Login failed");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="mx-auto w-full max-w-md rounded-2xl border border-slate-200 bg-white p-6 shadow-sm sm:p-8">
      <h2 className="text-2xl font-bold text-slate-900">Welcome Back</h2>
      <p className="mt-2 text-sm text-slate-600">
        Login to manage your student queries and track resolutions.
      </p>

      <div className="mt-6 space-y-4">
        <div>
          <label
            htmlFor="email"
            className="mb-1 block text-sm font-medium text-slate-700"
          >
            Email
          </label>
          <input
            id="email"
            type="email"
            placeholder="you@college.edu"
            onChange={(e) => setEmail(e.target.value)}
            className="w-full rounded-xl border border-slate-300 px-3 py-2.5 text-sm outline-none transition focus:border-sky-500 focus:ring-2 focus:ring-sky-100"
          />
        </div>

        <div>
          <label className="mb-1 block text-sm font-medium text-slate-700">
            Password
          </label>
          <input
            type="password"
            placeholder="Enter your password"
            onChange={(e) => setPassword(e.target.value)}
            onKeyPress={(e) => e.key === "Enter" && handleLoginData()}
            className="w-full rounded-xl border border-slate-300 px-3 py-2.5 text-sm outline-none transition focus:border-sky-500 focus:ring-2 focus:ring-sky-100"
          />
        </div>

        <button
          type="submit"
          onClick={handleLoginData}
          disabled={isLoading}
          className="w-full rounded-xl bg-sky-600 px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-sky-700 disabled:cursor-not-allowed disabled:opacity-70"
        >
          {isLoading ? "Logging in..." : "Login"}
        </button>
      </div>

      <h3
        onClick={() => navigate("/forgotpassword")}
        className="mt-5 cursor-pointer text-sm font-medium text-sky-700 hover:text-sky-800"
      >
        Forgot Password
      </h3>

      <h4
        onClick={() => navigate("/signup")}
        className="mt-3 cursor-pointer text-sm text-slate-600"
      >
        Don't have an account?{" "}
        <span className="font-semibold text-sky-700">Sign up</span>
      </h4>
    </div>
  );
};

export default Login;
