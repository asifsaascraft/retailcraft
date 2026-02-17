import mongoose from "mongoose";
import User from "../models/User.js";
import Branch from "../models/Branch.js";
import { generateStrongPassword } from "../utils/generatePassword.js";
import sendEmailWithTemplate from "../utils/sendEmail.js";
import crypto from "crypto";
import jwt from "jsonwebtoken";
import { generateTokens } from "../utils/generateTokens.js";


/* ======================================================
   Create User (Admin)
   ====================================================== */
export const createUser = async (req, res) => {
  try {
    const { branchId } = req.params;
    const { name, email } = req.body;

    //  required
    if (!name || !email) {
      return res.status(400).json({
        success: false,
        message: "name and email are required",
      });
    }

    //  validate branch
    if (!mongoose.Types.ObjectId.isValid(branchId)) {
      return res.status(400).json({
        success: false,
        message: "Invalid branch ID",
      });
    }

    const branch = await Branch.findById(branchId);
    if (!branch) {
      return res.status(404).json({
        success: false,
        message: "Branch not found",
      });
    }

    //  duplicate email
    const exists = await User.findOne({ email });
    if (exists) {
      return res.status(409).json({
        success: false,
        message: "User email already exists",
      });
    }

    //  generate password
    const plainPassword = generateStrongPassword();

    const user = await User.create({
      branchId,
      name,
      email,
      password: plainPassword,
      plainPassword,
    });

    //  send email
    await sendEmailWithTemplate({
      to: email,
      name,
      templateKey:
        "2518b.554b0da719bc314.k1.1b7332b0-0b36-11f1-ba18-525400c92439.19c6680d15b",
      mergeInfo: {
        name,
        email,
        plainPassword,
      },
    });

    res.status(201).json({
      success: true,
      message: "User created and email sent",
      data: {
        id: user._id,
        branch: branch.branchName,
        name: user.name,
        email: user.email,
      },
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({
      success: false,
      message: "Failed to create user",
    });
  }
};

/* ======================================================
   Get All Users
   ====================================================== */
export const getAllUsers = async (req, res) => {
  try {
    const users = await User.find()
      .populate("branchId", "branchName branchCode")
      .select("-password");

    res.json({
      success: true,
      count: users.length,
      data: users,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

/* ======================================================
   Get Users By Branch
   ====================================================== */
export const getUsersByBranch = async (req, res) => {
  try {
    const { branchId } = req.params;

    if (!mongoose.Types.ObjectId.isValid(branchId)) {
      return res.status(400).json({
        success: false,
        message: "Invalid branch ID",
      });
    }

    const users = await User.find({ branchId })
      .populate("branchId", "branchName branchCode")
      .select("-password");

    res.json({
      success: true,
      count: users.length,
      data: users,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

/* ======================================================
   Update User
   ====================================================== */
export const updateUser = async (req, res) => {
  try {
    const { id } = req.params;

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({
        success: false,
        message: "Invalid user ID",
      });
    }

    const user = await User.findById(id);
    if (!user) {
      return res.status(404).json({
        success: false,
        message: "User not found",
      });
    }

    //  do not allow password change from here
    if (req.body.password) delete req.body.password;
    if (req.body.email && req.body.email !== user.email) {
      const exists = await User.findOne({ email: req.body.email });
      if (exists) {
        return res.status(409).json({
          success: false,
          message: "Email already in use",
        });
      }
    }

    Object.assign(user, req.body);
    await user.save();

    // send update email
    await sendEmailWithTemplate({
      to: user.email,
      name: user.name,
      templateKey: "2518b.554b0da719bc314.k1.2a210f00-0b43-11f1-84b6-cabf48e1bf81.19c66d663f0",
      mergeInfo: {
        name: user.name,
        email: user.email,
      },

    });

    const safeUser = await User.findById(user._id).select(
      "-password -plainPassword -passwordResetToken -passwordResetExpires",
    );

    res.json({
      success: true,
      message: "User updated successfully and email sent",
      data: safeUser,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

/* ======================================================
   Delete User
   ====================================================== */
export const deleteUser = async (req, res) => {
  try {
    const { id } = req.params;

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({
        success: false,
        message: "Invalid user ID",
      });
    }

    const user = await User.findById(id);
    if (!user) {
      return res.status(404).json({
        success: false,
        message: "User not found",
      });
    }

    // send email before delete
    await sendEmailWithTemplate({
      to: user.email,
      name: user.name,
      templateKey: "2518b.554b0da719bc314.k1.abe366b1-0b42-11f1-84b6-cabf48e1bf81.19c66d32897",
      mergeInfo: {
        name: user.name,
      },
    });

    await user.deleteOne();

    res.json({
      success: true,
      message: "User deleted and email sent",
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

/* ======================================================
   User Login
====================================================== */
export const loginUser = async (req, res) => {
  try {
    const { email, password } = req.body;

    const user = await User.findOne({ email });
    if (!user) {
      return res.status(400).json({ message: "Email does not exist" });
    }

    const isMatch = await user.matchPassword(password);
    if (!isMatch) {
      return res.status(400).json({ message: "Wrong password" });
    }

    const { accessToken, refreshToken } = generateTokens(user._id, "user");

    res.cookie("refreshToken", refreshToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "none",
      maxAge: 30 * 24 * 60 * 60 * 1000,
    });

    res.json({
      message: "Login successful",
      accessToken,
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        branchId: user.branchId,
      },
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

/* ======================================================
   Refresh Access Token
   ====================================================== */
export const refreshUserAccessToken = async (req, res) => {
  try {
    const token = req.cookies.refreshToken;
    if (!token) return res.status(401).json({ message: "No refresh token" });

    const decoded = jwt.verify(token, process.env.JWT_REFRESH_SECRET);

    const user = await User.findById(decoded.id);
    if (!user) return res.status(401).json({ message: "User not found" });

    const { accessToken, refreshToken } = generateTokens(user._id, "user");

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
export const logoutUser = (req, res) => {
  res.clearCookie("refreshToken");
  res.json({ message: "Logged out successfully" });
};

/* ======================================================
   Forgot Password
   ====================================================== */
export const forgotUserPassword = async (req, res) => {
  try {
    const { email } = req.body;

    const user = await User.findOne({ email });
    if (!user) return res.status(404).json({ message: "User not found" });

    const token = crypto.randomBytes(32).toString("hex");
    const resetToken = crypto.createHash("sha256").update(token).digest("hex");

    user.passwordResetToken = resetToken;
    user.passwordResetExpires = Date.now() + 24 * 60 * 60 * 1000;

    await user.save({ validateBeforeSave: false });

    const resetUrl = `${process.env.FRONTEND_URL}/reset-password/${token}`;

    await sendEmailWithTemplate({
      to: user.email,
      name: user.name,
      templateKey: "2518b.554b0da719bc314.k1.71f11960-08cd-11f1-97ec-62df313bf14d.19c56b775f6",
      mergeInfo: {
        name: user.name,
        password_reset_link: resetUrl,
      },
    });

    res.json({ message: "Password reset link sent to email" });
  } catch (error) {
    res.status(500).json({ message: "Failed to send reset email" });
  }
};

/* ======================================================
   Reset Password
   ====================================================== */
export const resetUserPassword = async (req, res) => {
  try {
    let { token } = req.params;
    const { password } = req.body;

    const hashedToken = crypto.createHash("sha256").update(token).digest("hex");

    const user = await User.findOne({
      passwordResetToken: hashedToken,
      passwordResetExpires: { $gt: Date.now() },
    });

    if (!user) {
      return res.status(400).json({ message: "Invalid or expired token" });
    }

    user.password = password;
    user.passwordResetToken = null;
    user.passwordResetExpires = null;

    await user.save();

    res.json({ message: "Password reset successful" });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

/* ======================================================
   Get Profile
   ====================================================== */
export const getUserProfile = async (req, res) => {
  res.json(req.user);
};

/* ======================================================
   Update Profile
   - cannot update email
   - can upload profile picture
   ====================================================== */
export const updateUserProfile = async (req, res) => {
  try {
    const user = await User.findById(req.user._id);

    if (!user) return res.status(404).json({ message: "User not found" });

    if (req.body.email) delete req.body.email;
    if (req.body.password) delete req.body.password;

    Object.assign(user, req.body);

    if (req.file) {
      user.profilePicture = req.file.location;
    }

    await user.save();

    res.json({
      message: "Profile updated successfully",
      user,
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};
