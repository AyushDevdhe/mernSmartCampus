import axios from "axios";

const api = axios.create({
  baseURL: process.env.REACT_APP_BASE_URL,
  withCredentials: true,
});

// For file upload, we need to send FormData
export const addQuery = (formData) => {
  return api.post("/queries/create", formData, {
    headers: { "Content-Type": "multipart/form-data" },
  });
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

// For file upload in update
export const updateQuery = (id, formData) => {
  return api.put(`/queries/update/${id}`, formData, {
    headers: { "Content-Type": "multipart/form-data" },
  });
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

export const markAsSpam = (queryId, reason) => {
  return api.put(`/queries/mark-spam/${queryId}`, { reason });
};

export const batchResolveQueries = (
  queryIds,
  resolutionNote = "Batch resolved from similar queries",
) => {
  return api.post("/queries/batch-resolve", { queryIds, resolutionNote });
};