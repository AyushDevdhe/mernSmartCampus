const express = require("express");
const router = express.Router();
//importing controllers here
const { signUp, sendOTP } = require("../controllers/userController");

router.post("/sign-up", signUp);
router.post("/send-otp", sendOTP);

module.exports = router;
