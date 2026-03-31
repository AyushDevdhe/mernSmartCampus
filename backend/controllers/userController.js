///all the imports here
//importing models here
const userModel = require("../models/userModel");
const otpModel = require("../models/otpModel");
//importing dependencies here
const otpGenerator = require("otp-generator");
const mailSender = require("../utils/mailSender");

exports.sendOTP = async (req, res) => {
  try {
    const { email } = req.body;

    if (!email) {
      return res.status(400).json({
        success: false,
        message: "Email is required",
      });
    }

    // check if user already exists
    const existingUser = await userModel.findOne({ email });
    if (existingUser) {
      return res.status(400).json({
        success: false,
        message: "User already registered",
      });
    }

    // generate OTP
    const otpToSend = otpGenerator.generate(6, {
      upperCaseAlphabets: false,
      lowerCaseAlphabets: false,
      specialChars: false,
    });

    // save OTP
    await otpModel.create({ email, otp: otpToSend });

    // send email
    const sendRes = await mailSender(
      email,
      "Here is your OTP",
      `<p>OTP: ${otpToSend}. Expires in 5 minutes</p>`,
    );

    if (!sendRes) {
      return res.status(400).json({
        success: false,
        message: "Error sending OTP",
      });
    }

    return res.status(200).json({
      success: true,
      message: "OTP sent successfully",
    });
  } catch (err) {
    return res.status(500).json({
      success: false,
      message: "Error in sending OTP",
    });
  }
};

exports.signUp = async (req, res) => {
  try {
    const { firstName, lastName, email, password, prn, otp } = req.body;

    if (!firstName || !lastName || !email || !password || !prn || !otp) {
      return res.status(400).json({
        success: false,
        message: "All input fields are required",
      });
    }

    // check if user already exists
    if (await userModel.findOne({ email })) {
      return res.status(400).json({
        success: false,
        message: "User already exists",
      });
    }

    // verify OTP
    const recentOTP = await otpModel.findOne({ email }).sort({ createdAt: -1 });

    if (!recentOTP) {
      return res.status(400).json({
        success: false,
        message: "OTP expired or not found",
      });
    }

    // check expiry (5 minutes)
    const currentTime = Date.now();
    const otpCreatedTime = new Date(recentOTP.createdAt).getTime();

    if (currentTime - otpCreatedTime > 5 * 60 * 1000) {
      return res.status(400).json({
        success: false,
        message: "OTP expired",
      });
    }

    if (recentOTP.otp !== otp) {
      return res.status(400).json({
        success: false,
        message: "Invalid OTP",
      });
    }

    // create user
    const user = await userModel.create({
      firstName,
      lastName,
      email,
      password,
      prn,
    });

    await otpModel.deleteMany({ email: email });

    return res.status(200).json({
      success: true,
      message: "User registered successfully",
      user,
    });
  } catch (err) {
    return res.status(500).json({
      success: false,
      message: "Internal server error in signup",
      error: err.message,
    });
  }
};

exports.login = async (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(403).json({
        success: false,
        message: "all input fields required",
      });
    }
  } catch (err) {
    return res.status().json({
      success: false,
      message: "internal server error in login controller",
    });
  }
};
