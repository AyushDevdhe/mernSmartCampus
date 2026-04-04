///all the imports here
//importing models here
const userModel = require("../models/userModel");
const otpModel = require("../models/otpModel");
//importing dependencies here
const otpGenerator = require("otp-generator");
const mailSender = require("../utils/mailSender");
const jwt = require("jsonwebtoken");

exports.sendOTP = async (req, res) => {
  try {
    const { email } = req.body;

    if (!email) {
      return res.status(400).json({
        success: false,
        message: "Email is required",
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
      return res.status(400).json({
        success: false,
        message: "all input fields required",
      });
    }

    const user = await userModel.findOne({ email: email });

    if (!user) {
      return res.status(404).json({
        success: false,
        message: "no user exists with this email",
      });
    }

    //veryfying the passwords here
    const isPasswordMatch = await user.comparePassword(password);

    if (!isPasswordMatch) {
      return res.status(401).json({
        success: false,
        message: "invalid credentials",
      });
    }

    //generating the payload for signing jwt token
    const payload = {
      email: user.email,
      id: user._id,
    };

    //generating the token here
    const token = await jwt.sign(payload, process.env.JWT_SECRET, {
      expiresIn: "10d",
    });

    //setting the cookie with token here
    res.cookie("jwt", token, {
      httpOnly: true,
      secure: false,
      path: "/",
      sameSite: "lax",
      maxAge: 10 * 24 * 60 * 60 * 1000,
    });

    return res.status(200).json({
      success: true,
      message: "user logged in ",
      token: token,
    });
  } catch (err) {
    return res.status(500).json({
      success: false,
      message: "internal server error in login controller",
      error: err.message,
    });
  }
};

exports.changePassword = async (req, res) => {
  try {
    const { email, otp, newPassword } = req.body;

    if (!email || !otp || !newPassword) {
      return res.status(400).json({
        success: false,
        message: "all input fields required",
      });
    }

    //checking if user exists or not
    const user = await userModel.findOne({ email: email });

    if (!user) {
      return res.status().json({
        success: false,
        message: "no such user exists",
      });
    }

    //verifying the otp here
    const recentOTP = await otpModel.findOne({ email }).sort({ createdAt: -1 });

    if (!recentOTP) {
      return res.status(400).json({
        success: false,
        message: "no otp found",
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

    //changing the password
    user.password = newPassword;

    await user.save();

    //deleting the otp here
    await otpModel.deleteMany({ email: email });

    return res.status(200).json({
      success: true,
      message: "password updated successfully",
    });
  } catch (err) {
    return res.status(500).json({
      success: false,
      message: "internal server error in change password controller",
      error: err.message,
    });
  }
};
