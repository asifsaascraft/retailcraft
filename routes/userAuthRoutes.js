import express from "express";
import {
  loginUser,
  refreshUserAccessToken,
  logoutUser,
  forgotUserPassword,
  resetUserPassword,
  updateUserProfile,
  getUserProfile,
} from "../controllers/userController.js";

import { protectUser } from "../middlewares/userAuth.js";
import { uploadUserImage } from "../middlewares/uploadMiddleware.js";

const router = express.Router();

// Auth
router.post("/login", loginUser);
router.get("/refresh-token", refreshUserAccessToken);
router.post("/logout", protectUser, logoutUser);

// Password
router.post("/forgot-password", forgotUserPassword);
router.post("/reset-password/:token", resetUserPassword);

// Profile
router.get("/profile", protectUser, getUserProfile);
router.put(
  "/profile",
  protectUser,
  uploadUserImage.single("profilePicture"),
  updateUserProfile
);

export default router;
