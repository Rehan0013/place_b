const userModel = require("../models/user.model");
const admin = require("../config/firebase");
const jwt = require("jsonwebtoken");

const userRegisterController = async (req, res) => {
  const { email, fullName, profileImage, firebaseId, role } = req.body;

  if (!email || !fullName || !firebaseId) {
    return res.status(400).json({
      success: false,
      message: "Some fields are missing",
    });
  }

  try {
    // ✅ Verify Firebase ID token
    const decodedToken = await admin.auth().verifyIdToken(firebaseId);

    if (!decodedToken || !decodedToken.email) {
      return res.status(401).json({
        success: false,
        message: "Invalid Firebase ID token",
      });
    }

    // ✅ Check if the email from Firebase matches the request email
    if (decodedToken.email !== email) {
      return res.status(400).json({
        success: false,
        message: "Email mismatch with Firebase account",
      });
    }

    // ✅ Check if user already exists
    const existingUser = await userModel.findOne({ email });
    if (existingUser) {
      return res.status(400).json({
        success: false,
        message: "User already exists",
      });
    }

    // ✅ Create user
    const user = await userModel.create({
      email,
      fullName,
      profileImage,
      firebaseId: decodedToken.uid, // store Firebase UID, not token
      role,
    });

    // ✅ Generate your own JWT
    const token = jwt.sign({ id: user._id }, process.env.JWT_SECRET, {
      expiresIn: "7d",
    });

    res.cookie("token", token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "strict",
      expires: new Date(Date.now() + 1000 * 60 * 60 * 24 * 7), // 7 days
    });

    res.status(201).json({
      success: true,
      message: "User registered successfully",
      data: user,
      token,
    });
  } catch (error) {
    console.error("Firebase verification failed:", error);
    res.status(500).json({
      success: false,
      message: "User registration failed",
      error: error.message,
    });
  }
};

module.exports = {
  userRegisterController,
};
