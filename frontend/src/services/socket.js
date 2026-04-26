import { io } from "socket.io-client";

const SOCKET_URL = process.env.REACT_APP_BASE_URL || "http://localhost:5000";

export const socket = io(SOCKET_URL, {
  withCredentials: true,
});

export const connectSocket = () => {
  socket.connect();
};

export const disconnectSocket = () => {
  socket.disconnect();
};
