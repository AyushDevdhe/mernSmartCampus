import axios from "axios";

const api = axios.create({
  baseURL: process.env.REACT_APP_BASE_URL,
  withCredentials: true,
});

export const addQuery = (data) => {
  return api.post("/queries/create", data);
};

export const getQueriesByUser = () => {
  return api.get("/queries/get-by-user");
};

export const getAllQueries = () => {
  return api.get("/queries/all");
};

export const assignQuery = (id) => {
  return api.put(`/queries/assign/${id}`);
};

export const updateQueryStatus = (id, status) => {
  return api.put(`/queries/status/${id}`, { status });
};

export const deleteQuery = (id) => {
  return api.delete(`/queries/delete/${id}`);
};

export const updateQuery = (id, data) => {
  return api.put(`/queries/update/${id}`, data);
};

export const getAllSupervisors = () => {
  return api.get("/users/supervisors");
};

export const getEscalatedQueries = () => {
  return api.get("/users/escalated-queries");
};

export const takeAdminAction = (queryId, action, message) => {
  return api.put(`/queries/admin-action/${queryId}`, { action, message });
};

// NEW ESCALATION API CALLS
export const getEscalatedWarnings = () => {
  return api.get("/queries/escalated-warnings");
};

export const getCriticalEscalations = () => {
  return api.get("/queries/critical-escalations");
};

export const getQueryById = (queryId) => {
  return api.get(`/queries/${queryId}`);
};