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
    <div className="login-container">
      <h2>Login</h2>

      <input
        id="email"
        type="email"
        placeholder="Email"
        onChange={(e) => setEmail(e.target.value)}
      />

      <input
        type="password"
        placeholder="Password"
        onChange={(e) => setPassword(e.target.value)}
        onKeyPress={(e) => e.key === "Enter" && handleLoginData()}
      />

      <button type="submit" onClick={handleLoginData} disabled={isLoading}>
        {isLoading ? "Logging in..." : "Login"}
      </button>

      <h3
        onClick={() => navigate("/forgotpassword")}
        style={{ cursor: "pointer", color: "blue" }}
      >
        Forgot Password
      </h3>

      <h4
        onClick={() => navigate("/signup")}
        style={{ cursor: "pointer", color: "blue" }}
      >
        Don't have an account? Sign up
      </h4>
    </div>
  );
};

export default Login;
