const express = require("express");
const router = express.Router();
//importing controllers here
const {
  signUp,
  sendOTP,
  login,
  changePassword,
} = require("../controllers/userController");

router.post("/sign-up", signUp);
router.post("/send-otp", sendOTP);
router.post("/login", login);
router.put("/forgot-password", changePassword);

module.exports = router;
