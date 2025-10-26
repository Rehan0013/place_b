const userModel = require("../models/user.model");
const admin = require("../config/firebase"); // firebase-admin initialized
const jwt = require("jsonwebtoken");

const userRegisterController = async (req, res) => {
  const { firebaseId } = req.body;

  if (!firebaseId) {
    return res.status(400).json({
      success: false,
      message: "Firebase ID token is required",
    });
  }

  try {
    // Verify Firebase ID token
    const decodedToken = await admin.auth().verifyIdToken(firebaseId);
    const firebaseUid = decodedToken.uid;

    // Get user info from decoded token
    const email = decodedToken.email;
    const fullName = decodedToken.name;
    const profileImage = decodedToken.picture;

    if (!email || !fullName) {
      return res.status(400).json({
        success: false,
        message: "Invalid Firebase token data",
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

    // Create new user
    const user = await userModel.create({
      email,
      fullName,
      profileImage,
      firebaseId: firebaseUid,
      role: req.body.role || "student",
    });

    // Create backend JWT
    const token = jwt.sign({ id: user._id }, process.env.JWT_SECRET);

    // Send cookie and response
    res.cookie("token", token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "strict",
      maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days
    });

    res.status(201).json({
      success: true,
      message: "User registered successfully",
      data: user,
      token,
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({
      success: false,
      message: "User registration failed",
      error: error.message,
    });
  }
};

const userLoginController = async (req, res) => {
  const { firebaseId } = req.body;

  if (!firebaseId) {
    return res.status(400).json({
      success: false,
      message: "Firebase ID token is required",
    });
  }

  try {
    // Verify Firebase ID token
    const decodedToken = await admin.auth().verifyIdToken(firebaseId);
    const firebaseUid = decodedToken.uid;
    const email = decodedToken.email;

    if (!email) {
      return res.status(400).json({
        success: false,
        message: "Invalid Firebase token",
      });
    }

    // Find existing user
    const user = await userModel.findOne({ email });

    if (!user) {
      return res.status(404).json({
        success: false,
        message: "User not found. Please register first.",
      });
    }

    // Create backend JWT
    const token = jwt.sign({ id: user._id }, process.env.JWT_SECRET);

    // Send cookie + response
    res.cookie("token", token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "strict",
      maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days
    });

    res.status(200).json({
      success: true,
      message: "Login successful",
      data: user,
      token,
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({
      success: false,
      message: "Login failed",
      error: error.message,
    });
  }
};

const userLogoutController = async (req, res) => {
  res.clearCookie("token");
  res.status(200).json({
    success: true,
    message: "Logout successful",
  });
};

const userDetailsController = async (req, res) => {
  const userId = req.user._id;

  try {
    const user = await userModel.findById(userId);

    res.status(200).json({
      message: "user details received",
      user: user,
    });
  } catch (error) {
    return res.status(401).json({
      success: false,
      message: "Unauthorized - Invalid token",
    });
  }
};

module.exports = {
  userRegisterController,
  userLoginController,
  userLogoutController,
  userDetailsController,
};
