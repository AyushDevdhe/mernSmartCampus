const jwt = require("jsonwebtoken");

exports.verifyJWT = async (req, res, next) => {
  try {
    const token = req.cookies.jwt;

    if (!token) {
      return res.status(401).json({
        success: false,
        message: "no token found",
      });
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET);

    req.user = decoded;

    next();
  } catch (err) {
    return res.status(500).json({
      success: false,
      message: "internal server error in verifyJWT middleware",
      error: err.message,
    });
  }
};
