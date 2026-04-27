import axios from "axios";

const api = axios.create({
  baseURL: process.env.REACT_APP_BASE_URL,
  withCredentials: true,
});

export const getCriticalEscalations = () => {
  return api.get("/queries/critical-escalations");
};

export const getAvailableSupervisors = (excludeId) => {
  return api.get(`/users/available-supervisors?excludeId=${excludeId}`);
};

export const reassignSupervisor = (
  oldSupervisorId,
  newSupervisorId,
  queryIds,
) => {
  return api.post("/queries/reassign-supervisor", {
    oldSupervisorId,
    newSupervisorId,
    queryIds,
  });
};
