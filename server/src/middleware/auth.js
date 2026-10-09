const jwt = require("jsonwebtoken");
const User = require("../models/User");

const authMiddleware = async (req, res, next) => {
  try {
    let token;
    const authHeader = req.headers.authorization;

    if (authHeader && authHeader.startsWith("Bearer ")) {
      token = authHeader.split(" ")[1];
    }

    if (!token) {
      return res.status(401).json({
        success: false,
        message: "Authentication token missing. Please sign in.",
      });
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET || "photoproof_jwt_super_secret_key");
    const user = await User.findById(decoded.id).select("-password");

    if (!user) {
      return res.status(401).json({
        success: false,
        message: "User session expired or user no longer exists.",
      });
    }

    req.user = user;
    next();
  } catch (error) {
    return res.status(401).json({
      success: false,
      message: "Invalid or expired authorization token.",
      error: error.message,
    });
  }
};

module.exports = authMiddleware;
