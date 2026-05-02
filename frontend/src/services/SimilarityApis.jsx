import axios from "axios";

const api = axios.create({
  baseURL: process.env.REACT_APP_BASE_URL,
  withCredentials: true,
});

export const getSimilarQueries = (queryId, threshold = 0.4) => {
  return api.get(`/queries/similar/${queryId}?threshold=${threshold}`);
};
