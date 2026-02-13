import express from "express";
import cookieParser from "cookie-parser";
import {
  registerAdmin,
  loginAdmin,
  refreshAccessToken,
  logoutAdmin,
  forgotPassword,
  resetPassword,
  updateAdminProfile,
  getAdminProfile,
} from "../controllers/adminController.js";

import { protectAdmin } from "../middlewares/adminAuth.js";
import { uploadAdminImage } from "../middlewares/uploadMiddleware.js";

const router = express.Router();

router.use(cookieParser());

// Auth
router.post("/register", registerAdmin); // used only once
router.post("/login", loginAdmin);
router.get("/refresh-token", refreshAccessToken);
router.post("/logout", protectAdmin, logoutAdmin);


// Password
router.post("/forgot-password", forgotPassword);
router.post("/reset-password/:token", resetPassword);

// Profile
router.get("/profile", protectAdmin, getAdminProfile);
router.put(
  "/profile",
  protectAdmin,
  uploadAdminImage.single("profilePicture"),
  updateAdminProfile
);

export default router;
