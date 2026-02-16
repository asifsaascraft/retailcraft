import express from "express";
import {
  createUser,
  getAllUsers,
  getUsersByBranch,
  updateUser,
  deleteUser,
} from "../controllers/userController.js";
import { protectAdmin } from "../middlewares/adminAuth.js";

const router = express.Router();

router.use(protectAdmin);

//  Create user INSIDE branch
router.post("/branches/:branchId/users", createUser);

// list
router.get("/users", getAllUsers);

//  list users by branch
router.get("/branches/:branchId/users", getUsersByBranch);

router.put("/users/:id", updateUser);
router.delete("/users/:id", deleteUser);

export default router;
