import axios from "axios";

const api = axios.create({
  baseURL: process.env.REACT_APP_BASE_URL,
  withCredentials: true,
});

export const getQueriesByUser = () => {
  return api.get("/queries/get-by-user");
};
