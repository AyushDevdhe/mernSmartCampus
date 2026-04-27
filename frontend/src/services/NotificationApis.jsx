import axios from "axios";

const api = axios.create({
  baseURL: process.env.REACT_APP_BASE_URL,
  withCredentials: true,
});

export const getUserNotifications = () => {
  return api.get("/notifications");
};

export const markNotificationAsRead = (notificationId) => {
  return api.put(`/notifications/read/${notificationId}`);
};

export const markAllNotificationsAsRead = () => {
  return api.put("/notifications/read-all");
};

export const deleteNotification = (notificationId) => {
  return api.delete(`/notifications/${notificationId}`);
};
