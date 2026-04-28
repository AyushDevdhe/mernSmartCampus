const express = require("express");
const mongoose = require("mongoose");
const cors = require("cors");
const cookieParser = require("cookie-parser");
const cron = require("node-cron"); // ADD THIS
require("dotenv").config();
const { createServer } = require("http");
const { Server } = require("socket.io");

// Import routes
const userRoutes = require("./routes/userRoutes");
const queryRoutes = require("./routes/queryRoutes");
const { checkEscalations } = require("./controllers/queryController"); // ADD THIS

const app = express();
const httpServer = createServer(app);
const notificationRoutes = require("./routes/notificationRoutes");
const commentRoutes = require("./routes/commentRoutes");

// Socket.io setup with CORS
const io = new Server(httpServer, {
  cors: {
    origin: "http://localhost:3000",
    credentials: true,
    methods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
  },
});

// Make io accessible to routes
app.set("io", io);

// Socket connection
io.on("connection", (socket) => {
  console.log("New client connected:", socket.id);

  socket.on("disconnect", () => {
    console.log("Client disconnected:", socket.id);
  });
});

// CORS middleware
app.use(
  cors({
    origin: "http://localhost:3000",
    credentials: true,
    methods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
    allowedHeaders: ["Content-Type", "Authorization", "Cookie"],
  }),
);

// Other middleware
app.use(cookieParser());
app.use(express.json());
app.use("/api/notifications", notificationRoutes);
app.use("/api/comments", commentRoutes);

// MongoDB connection
mongoose
  .connect(process.env.MONGO_URI)
  .then(() => console.log("MongoDB connected"))
  .catch((err) => console.error("MongoDB connection error:", err));

// Routes
app.use("/api/users", userRoutes);
app.use("/api/queries", queryRoutes);
app.use("/uploads", express.static("uploads"));

// Test route
app.get("/api/test", (req, res) => {
  res.json({ message: "Backend is working!" });
});

// CRON JOB: Check escalations every hour
cron.schedule("0 * * * *", async () => {
  console.log("Running escalation check...");
  const result = await checkEscalations();
  console.log("Escalation check completed:", result);

  // Emit WebSocket events for real-time updates
  if (result.updated24hr > 0 || result.updated48hr > 0) {
    io.emit("escalationsUpdated", result);
  }
});

// Also run on server start
setTimeout(async () => {
  console.log("Initial escalation check on startup...");
  await checkEscalations();
}, 4000);

// Start server
httpServer.listen(4000, () => {
  console.log("Server running on port 4000");
});
