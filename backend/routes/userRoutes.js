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
} = require("../controllers/userController");

// Public routes (no authentication needed)
router.post("/send-otp", sendOTP);
router.post("/sign-up", signUp);
router.post("/login", login);
router.put("/forgot-password", changePassword);

// Protected routes (authentication required)
router.get("/get", verifyJWT, getUser);
router.post("/logout", verifyJWT, logOut);
router.get("/supervisors", verifyJWT, getAllSupervisors);
router.get("/escalated-queries", verifyJWT, getEscalatedQueries);

module.exports = router;
