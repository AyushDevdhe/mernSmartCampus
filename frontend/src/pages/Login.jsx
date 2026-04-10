import { useState } from "react";

import { loginApi } from "../services/GetService";

export const Login = () => {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  const handleLoginData = async () => {
    try {
      const res = await loginApi({ email, password });
      console.log(res.data);

      if (res.data.success) {
        localStorage.setItem("user", JSON.stringify(res.data.user));
        alert("Login Successful");
        window.location.href = "/dashboard"; //dashboard loc
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

  // useEffect(() => {
  //   getLoginData();
  // }, []);

  return (
    <>
      {/* <label id="email"></label> */}

      <input
        id="email"
        type="email"
        onChange={(e) => setEmail(e.target.value)}
      ></input>
      <input
        type="password"
        onChange={(e) => setPassword(e.target.value)}
      ></input>

      <button type="submit" onClick={handleLoginData}>
        Login
      </button>

      <h3>Forgot Password</h3>
      <h4>“don’t have an account? sign up</h4>
    </>
  );
};

export default Login;

// 123456
// 654321
