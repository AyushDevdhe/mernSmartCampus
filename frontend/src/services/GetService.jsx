import axios from "axios";

const api = axios.create({
  baseURL: process.env.REACT_APP_BASE_URL,
  withCredentials: true,
});

export const signupApi = (data) => {
  return api.post("/users/sign-up", data);
};

export const sendOtpApi = (email) => {
  return api.post("/users/send-otp", { email });
};

export const loginApi = (data) => {
  return api.post("/users/login", data);
};

