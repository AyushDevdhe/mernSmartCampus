const express = require("express");
const router = express.Router();

//importing controllers here
const {
  signUp,
  sendOTP,
  login,
  changePassword,
  getUser,
  logOut,
} = require("../controllers/userController");

//importing middlewares here
const { verifyJWT } = require("../middlewares/verifyJWT");

router.post("/send-otp", sendOTP);
router.post("/sign-up", signUp);
router.post("/login", login);
router.get("/get", verifyJWT, getUser);
router.put("/forgot-password", changePassword);
router.post("/logout", logOut);

module.exports = router;
