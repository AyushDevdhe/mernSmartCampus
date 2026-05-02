const express = require("express");
const router = express.Router();

//importing middlewares here (MUST come BEFORE using verifyJWT)
const { verifyJWT } = require("../middlewares/verifyJWT");

//importing controllers here
const {
  signUp,
  sendOTP,
  login,
  changePassword,
  getUser,
  logOut,
  getAllSupervisors,
  getEscalatedQueries,
  getAvailableSupervisors,
  getBlockedStudents, // Import from controller
  unblockStudent, // Import from controller
} = require("../controllers/userController");

// Public routes
router.post("/send-otp", sendOTP);
router.post("/sign-up", signUp);
router.post("/login", login);
router.put("/forgot-password", changePassword);

// Protected routes (authentication required)
router.get("/get", verifyJWT, getUser);
router.post("/logout", verifyJWT, logOut);
router.get("/supervisors", verifyJWT, getAllSupervisors);
router.get("/escalated-queries", verifyJWT, getEscalatedQueries);
router.get("/available-supervisors", verifyJWT, getAvailableSupervisors);

// Blocked students routes
router.get("/blocked-students", verifyJWT, getBlockedStudents);
router.put("/unblock/:studentId", verifyJWT, unblockStudent);

module.exports = router;
