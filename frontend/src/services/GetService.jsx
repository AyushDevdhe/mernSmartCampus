import axios from "axios";

const api = axios.create({
  baseURL: "http://localhost:5000/api",
  withCredentials: true,
  headers: {
    "Content-Type": "application/json",
  },
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

export const getUser = () => {
  return api.get("/users/get");
};

export const logOut = () => {
  return api.post("/users/logout");
};

export const checkUserBlockStatus = async () => {
  try {
    const res = await getUser();
    if (res?.data?.user?.isBlocked) {
      return { isBlocked: true, reason: res.data.user.blockReason };
    }
    return { isBlocked: false };
  } catch (error) {
    console.error("Error checking block status:", error);
    return { isBlocked: false };
  }
};
