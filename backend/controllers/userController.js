///all the imports here
//importing models here
const userModel = require("../models/userModel");
const otpModel = require("../models/otpModel");
const queryModel = require("../models/queryModel");
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
    console.error("Send OTP Error:", err);
    return res.status(500).json({
      success: false,
      message: "Error in sending OTP",
      error: err.message,
    });
  }
};

exports.signUp = async (req, res) => {
  try {
    const {
      firstName,
      lastName,
      email,
      password,
      prn,
      otp,
      role,
      createdByAdmin,
    } = req.body;

    console.log("Signup request body:", req.body);

    // Basic validation for all users
    if (!firstName || !lastName || !email || !password || !otp) {
      return res.status(400).json({
        success: false,
        message: "All input fields are required",
      });
    }

    // Set role - default to "student"
    let userRole = "student";

    // Role restriction logic
    if (role && role.toLowerCase() !== "student") {
      // Only admin can create supervisor or admin accounts
      if (!createdByAdmin) {
        return res.status(403).json({
          success: false,
          message:
            "Only admin can create supervisor or admin accounts. Please sign up as student.",
        });
      }

      // Validate role from admin request
      if (["supervisor", "admin"].includes(role.toLowerCase())) {
        userRole = role.toLowerCase();
      }
    }

    console.log("User role determined:", userRole);

    // PRN validation: Required only for students
    if (userRole === "student" && !prn) {
      return res.status(400).json({
        success: false,
        message: "PRN is required for student registration",
      });
    }

    // Check if user already exists
    const existingUser = await userModel.findOne({ email });
    if (existingUser) {
      return res.status(400).json({
        success: false,
        message: "User already exists",
      });
    }

    // For students, check if PRN is unique
    if (userRole === "student" && prn) {
      const existingUserWithPrn = await userModel.findOne({ prn });
      if (existingUserWithPrn) {
        return res.status(400).json({
          success: false,
          message: "User with this PRN already exists",
        });
      }
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

    // Prepare user data
    const userData = {
      firstName,
      lastName,
      email,
      password,
      role: userRole,
    };

    if (userRole === "student" && prn) {
      userData.prn = Number(prn);
    }

    console.log("Final userData before create:", {
      ...userData,
      password: "***",
    });

    // create user
    const user = await userModel.create(userData);

    await otpModel.deleteMany({ email });

    // Remove password from response
    const userResponse = user.toObject();
    delete userResponse.password;

    return res.status(200).json({
      success: true,
      message: "User registered successfully",
      user: userResponse,
    });
  } catch (err) {
    console.error("Signup Error FULL:", err);
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

    console.log("=== LOGIN ATTEMPT ===");
    console.log("Email:", email);
    console.log("Password received:", password ? "Yes" : "No");

    if (!email || !password) {
      console.log("Missing email or password");
      return res.status(400).json({
        success: false,
        message: "all input fields required",
      });
    }

    const user = await userModel.findOne({ email });
    console.log("User found in DB:", user ? "Yes" : "No");

    if (!user) {
      console.log("User not found for email:", email);
      return res.status(404).json({
        success: false,
        message: "no user exists with this email",
      });
    }

    const isPasswordMatch = await user.comparePassword(password);
    console.log("Password match:", isPasswordMatch);

    if (!isPasswordMatch) {
      console.log("Password incorrect for:", email);
      return res.status(401).json({
        success: false,
        message: "invalid credentials",
      });
    }

    const payload = {
      email: user.email,
      id: user._id,
      role: user.role,
    };

    const token = jwt.sign(payload, process.env.JWT_SECRET, {
      expiresIn: "10d",
    });

    res.cookie("jwt", token, {
      httpOnly: true,
      secure: false,
      path: "/",
      sameSite: "lax",
      maxAge: 10 * 24 * 60 * 60 * 1000,
    });

    const userResponse = user.toObject();
    delete userResponse.password;

    console.log("Login successful for:", email);

    return res.status(200).json({
      success: true,
      message: "user logged in",
      user: userResponse,
    });
  } catch (err) {
    console.error("Login Error:", err);
    return res.status(500).json({
      success: false,
      message: "internal server error in login controller",
      error: err.message,
    });
  }
};

exports.getUser = async (req, res) => {
  try {
    const { id } = req.user;

    if (!id) {
      return res.status(400).json({
        success: false,
        message: "no user id fetched from the token",
      });
    }

    const user = await userModel.findById(id).select("-password");

    if (!user) {
      return res.status(404).json({
        success: false,
        message: "no user found with this id",
      });
    }

    // Fetch queries for students to calculate stats
    let userResponse = user.toObject();

    if (user.role === "student") {
      const queries = await queryModel.find({ user: id });
      userResponse.queries = queries;
      userResponse.queryStats = {
        total: queries.length,
        pending: queries.filter((q) => q.status === "Pending").length,
        inProgress: queries.filter((q) => q.status === "In Progress").length,
        resolved: queries.filter((q) => q.status === "Resolved").length,
      };
    }

    return res.status(200).json({
      success: true,
      message: "user details fetched successfully",
      user: userResponse,
    });
  } catch (err) {
    console.error("Get User Error:", err);
    return res.status(500).json({
      success: false,
      message: "internal server error in get user controller",
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

    const user = await userModel.findOne({ email });

    if (!user) {
      return res.status(404).json({
        success: false,
        message: "no such user exists",
      });
    }

    const recentOTP = await otpModel.findOne({ email }).sort({ createdAt: -1 });

    if (!recentOTP) {
      return res.status(400).json({
        success: false,
        message: "no otp found",
      });
    }

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

    user.password = newPassword;
    await user.save();

    await otpModel.deleteMany({ email });

    return res.status(200).json({
      success: true,
      message: "password updated successfully",
    });
  } catch (err) {
    console.error("Change Password Error:", err);
    return res.status(500).json({
      success: false,
      message: "internal server error in change password controller",
      error: err.message,
    });
  }
};

exports.logOut = async (req, res) => {
  try {
    res.clearCookie("jwt", {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      path: "/",
      sameSite: "lax",
    });

    return res.status(200).json({
      success: true,
      message: "Logged out successfully",
    });
  } catch (err) {
    console.error("Logout Error:", err);
    return res.status(500).json({
      success: false,
      error: err.message,
    });
  }
};


// Get all supervisors (for admin)
exports.getAllSupervisors = async (req, res) => {
  try {
    const supervisors = await userModel
      .find({ role: "supervisor" })
      .select("-password");
    
    return res.status(200).json({
      success: true,
      supervisors: supervisors,
    });
  } catch (err) {
    console.error("Get Supervisors Error:", err);
    return res.status(500).json({
      success: false,
      message: "Error fetching supervisors",
      error: err.message,
    });
  }
};

// Get escalated queries (42+ hours)
exports.getEscalatedQueries = async (req, res) => {
  try {
    const fortyTwoHoursAgo = new Date(Date.now() - 42 * 60 * 60 * 1000);
    
    const escalatedQueries = await queryModel
      .find({
        status: { $ne: "Resolved" },
        createdAt: { $lt: fortyTwoHoursAgo }
      })
      .populate("user", "firstName lastName email")
      .populate("assignedTo", "firstName lastName email");
    
    return res.status(200).json({
      success: true,
      escalatedQueries: escalatedQueries,
    });
  } catch (err) {
    console.error("Get Escalated Queries Error:", err);
    return res.status(500).json({
      success: false,
      message: "Error fetching escalated queries",
      error: err.message,
    });
  }
};


exports.getAvailableSupervisors = async (req, res) => {
  try {
    const { excludeId } = req.query;
    const query = { role: "supervisor" };
    if (excludeId) {
      query._id = { $ne: excludeId };
    }
    
    const supervisors = await userModel
      .find(query)
      .select("firstName lastName email");
    
    return res.status(200).json({
      success: true,
      supervisors: supervisors,
    });
  } catch (err) {
    console.error("Get Available Supervisors Error:", err);
    return res.status(500).json({
      success: false,
      message: "Error fetching available supervisors",
      error: err.message,
    });
  }
};