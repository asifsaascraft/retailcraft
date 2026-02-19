import crypto from "crypto";
import jwt from "jsonwebtoken";
import Admin from "../models/Admin.js";
import { generateTokens } from "../utils/generateTokens.js";
import sendEmailWithTemplate from "../utils/sendEmail.js";

/* ======================================================
   Admin Register (ONLY ONE ADMIN ALLOWED)
   ====================================================== */
export const registerAdmin = async (req, res) => {
  try {
    //  Check if any admin already exists
    const adminCount = await Admin.countDocuments();

    if (adminCount > 0) {
      return res.status(400).json({
        message: "Admin already createdd.",
      });
    }

    const admin = await Admin.create(req.body);

    res.status(201).json({
      message: "Admin registered successfully",
      adminId: admin._id,
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

/* ======================================================
   Admin Login
   ====================================================== */
export const loginAdmin = async (req, res) => {
  try {
    const { email, password } = req.body;

    const admin = await Admin.findOne({ email });
    if (!admin) return res.status(400).json({ message: "Email does not exist" });

    const isMatch = await admin.matchPassword(password);
    if (!isMatch) return res.status(400).json({ message: "Wrong password" });

    const { accessToken, refreshToken } = generateTokens(admin._id, "admin");

    res.cookie("refreshToken", refreshToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "none",
      maxAge: 30 * 24 * 60 * 60 * 1000,
    });

    res.json({
      message: "Login successful",
      accessToken,
      admin: {
        id: admin._id,
        companyName: admin.companyName,
        contactName: admin.contactName,
        email: admin.email,
      },
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

/* ======================================================
   Refresh Access Token
   ====================================================== */
export const refreshAccessToken = async (req, res) => {
  try {
    const token = req.cookies.refreshToken;
    if (!token) return res.status(401).json({ message: "No refresh token" });

    const decoded = jwt.verify(token, process.env.JWT_REFRESH_SECRET);

    const admin = await Admin.findById(decoded.id);
    if (!admin) return res.status(401).json({ message: "Admin not found" });

    const { accessToken, refreshToken } = generateTokens(admin._id, "admin");

    res.cookie("refreshToken", refreshToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "none",
      maxAge: 30 * 24 * 60 * 60 * 1000,
    });

    res.json({ accessToken });
  } catch (error) {
    res.status(401).json({ message: "Invalid refresh token" });
  }
};

/* ======================================================
   Logout
   ====================================================== */
export const logoutAdmin = (req, res) => {
  res.clearCookie("refreshToken");
  res.json({ message: "Logged out successfully" });
};

/* ======================================================
   Forgot Password
   ====================================================== */
export const forgotPassword = async (req, res) => {
  try {
    const { email } = req.body;

    const admin = await Admin.findOne({ email });
    if (!admin) return res.status(404).json({ message: "Admin not found" });

    const token = crypto.randomBytes(32).toString("hex");
    const resetToken = crypto.createHash("sha256").update(token).digest("hex");

    admin.passwordResetToken = resetToken;
    admin.passwordResetExpires = Date.now() + 24 * 60 * 60 * 1000;

    await admin.save({ validateBeforeSave: false });

    const resetUrl = `${process.env.FRONTEND_URL}/reset-password/${token}?type=admin`;

    await sendEmailWithTemplate({
      to: admin.email,
      name: admin.contactName,
      templateKey: "2518b.554b0da719bc314.k1.71f11960-08cd-11f1-97ec-62df313bf14d.19c56b775f6",
      mergeInfo: {
        name: admin.contactName,
        password_reset_link: resetUrl,
      },
    });

    res.json({ message: "Password reset link sent to email" });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Failed to send reset email" });
  }
};

/* ======================================================
   Reset Password
   ====================================================== */
export const resetPassword = async (req, res) => {
  try {
    let { token } = req.params;
    const { password } = req.body;

    token = token.trim();

    const hashedToken = crypto.createHash("sha256").update(token).digest("hex");

    const admin = await Admin.findOne({
      passwordResetToken: hashedToken,
      passwordResetExpires: { $gt: Date.now() },
    });

    if (!admin) {
      return res.status(400).json({ message: "Invalid or expired token" });
    }

    admin.password = password;
    admin.passwordResetToken = null;
    admin.passwordResetExpires = null;

    await admin.save();

    res.json({ message: "Password reset successful" });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

/* ======================================================
   Update Profile
   - cannot update email
   - can upload profile picture
   ====================================================== */
export const updateAdminProfile = async (req, res) => {
  try {
    const admin = await Admin.findById(req.admin._id);
    if (!admin) return res.status(404).json({ message: "Admin not found" });

    // ❌ Prevent email update
    if (req.body.email) delete req.body.email;

    // Update normal fields
    Object.keys(req.body).forEach((key) => {
      admin[key] = req.body[key];
    });

    // If new image uploaded
    if (req.file) {
      admin.profilePicture = req.file.location; // S3 URL
    }

    await admin.save();

    res.json({
      message: "Profile updated successfully",
      admin,
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

/* ======================================================
   Get Profile
   ====================================================== */
export const getAdminProfile = async (req, res) => {
  res.json(req.admin);
};
