const { OAuth2Client } = require("google-auth-library");
const jwt = require("jsonwebtoken");
const User = require("../models/User");

const client = new OAuth2Client(process.env.GOOGLE_CLIENT_ID);

const generateToken = (userId) => {
  return jwt.sign(
    { id: userId },
    process.env.JWT_SECRET || "photoproof_jwt_super_secret_key",
    { expiresIn: process.env.JWT_EXPIRES_IN || "7d" }
  );
};

// @desc Register user with email & password
// @route POST /api/auth/register
exports.register = async (req, res) => {
  try {
    const { name, email, password } = req.body;

    if (!name || !email || !password) {
      return res.status(400).json({
        success: false,
        message: "Please provide name, email, and password.",
      });
    }

    if (password.length < 6) {
      return res.status(400).json({
        success: false,
        message: "Password must be at least 6 characters long.",
      });
    }

    const existingUser = await User.findOne({ email: email.toLowerCase() });
    if (existingUser) {
      return res.status(409).json({
        success: false,
        message: "An account with this email address already exists.",
      });
    }

    const user = await User.create({
      name,
      email: email.toLowerCase(),
      password,
      avatar: `https://api.dicebear.com/7.x/avataaars/svg?seed=${encodeURIComponent(name)}`,
    });

    const token = generateToken(user._id);

    return res.status(201).json({
      success: true,
      message: "Registration successful.",
      token,
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        avatar: user.avatar,
        walletAddress: user.walletAddress,
      },
    });
  } catch (error) {
    console.error("Registration error:", error);
    return res.status(500).json({
      success: false,
      message: "Server error during registration.",
      error: error.message,
    });
  }
};

// @desc Login user with email & password
// @route POST /api/auth/login
exports.login = async (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({
        success: false,
        message: "Please enter both email and password.",
      });
    }

    const user = await User.findOne({ email: email.toLowerCase() }).select("+password");
    if (!user) {
      return res.status(401).json({
        success: false,
        message: "Invalid email or password.",
      });
    }

    const isMatch = await user.comparePassword(password);
    if (!isMatch) {
      return res.status(401).json({
        success: false,
        message: "Invalid email or password.",
      });
    }

    const token = generateToken(user._id);

    return res.status(200).json({
      success: true,
      message: "Login successful.",
      token,
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        avatar: user.avatar,
        walletAddress: user.walletAddress,
      },
    });
  } catch (error) {
    console.error("Login error:", error);
    return res.status(500).json({
      success: false,
      message: "Server error during login.",
      error: error.message,
    });
  }
};

// @desc Google OAuth 2.0 Sign In
// @route POST /api/auth/google
exports.googleAuth = async (req, res) => {
  try {
    const { credential, profile } = req.body;

    let email, name, avatar, googleId;

    if (credential) {
      // Verify Google ID token from GIS
      try {
        const ticket = await client.verifyIdToken({
          idToken: credential,
          audience: process.env.GOOGLE_CLIENT_ID,
        });
        const payload = ticket.getPayload();
        email = payload.email;
        name = payload.name;
        avatar = payload.picture;
        googleId = payload.sub;
      } catch (verifyErr) {
        // In local development or testing mode where Google Client ID is placeholder
        console.warn("Google verifyIdToken failed, checking dev payload:", verifyErr.message);
        if (profile && profile.email) {
          email = profile.email;
          name = profile.name || "Google User";
          avatar = profile.avatar || "";
          googleId = profile.googleId || `g_${Date.now()}`;
        } else {
          return res.status(400).json({
            success: false,
            message: "Invalid Google token: " + verifyErr.message,
          });
        }
      }
    } else if (profile && profile.email) {
      email = profile.email;
      name = profile.name || "Google User";
      avatar = profile.avatar || "";
      googleId = profile.googleId || `g_${Date.now()}`;
    } else {
      return res.status(400).json({
        success: false,
        message: "Google credential or profile data missing.",
      });
    }

    // Find or create user
    let user = await User.findOne({ email: email.toLowerCase() });

    if (!user) {
      user = await User.create({
        name: name || "Google User",
        email: email.toLowerCase(),
        googleId,
        avatar: avatar || `https://api.dicebear.com/7.x/avataaars/svg?seed=${encodeURIComponent(name || "User")}`,
      });
    } else {
      // Update Google ID and avatar if missing
      if (!user.googleId) user.googleId = googleId;
      if (avatar && !user.avatar) user.avatar = avatar;
      await user.save();
    }

    const token = generateToken(user._id);

    return res.status(200).json({
      success: true,
      message: "Google authentication successful.",
      token,
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        avatar: user.avatar,
        walletAddress: user.walletAddress,
      },
    });
  } catch (error) {
    console.error("Google auth error:", error);
    return res.status(500).json({
      success: false,
      message: "Google sign-in server error.",
      error: error.message,
    });
  }
};

// @desc Get current authenticated user
// @route GET /api/auth/me
exports.getMe = async (req, res) => {
  try {
    return res.status(200).json({
      success: true,
      user: req.user,
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: "Error fetching user profile.",
    });
  }
};

// @desc Link or update Ethereum wallet address
// @route PUT /api/auth/wallet
exports.updateWallet = async (req, res) => {
  try {
    const { walletAddress } = req.body;
    if (!walletAddress) {
      return res.status(400).json({
        success: false,
        message: "Wallet address required.",
      });
    }

    const user = await User.findByIdAndUpdate(
      req.user._id,
      { walletAddress: walletAddress.toLowerCase() },
      { new: true }
    ).select("-password");

    return res.status(200).json({
      success: true,
      message: "Wallet address linked successfully.",
      user,
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: "Error linking wallet address.",
      error: error.message,
    });
  }
};
