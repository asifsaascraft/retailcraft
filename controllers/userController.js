import mongoose from "mongoose";
import User from "../models/User.js";
import Branch from "../models/Branch.js";
import { generateStrongPassword } from "../utils/generatePassword.js";
import sendEmailWithTemplate from "../utils/sendEmail.js";

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
