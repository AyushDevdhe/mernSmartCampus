import axios from "axios";

const api = axios.create({
  baseURL: process.env.REACT_APP_BASE_URL,
  withCredentials: true,
});

export const getCommentsByQuery = (queryId) => {
  return api.get(`/comments/${queryId}`);
};

export const addComment = (queryId, text) => {
  return api.post(`/comments/${queryId}`, { text });
};

export const editComment = (commentId, text) => {
  return api.put(`/comments/${commentId}`, { text });
};

export const deleteComment = (commentId) => {
  return api.delete(`/comments/${commentId}`);
};
