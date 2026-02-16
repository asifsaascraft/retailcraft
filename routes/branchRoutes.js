import express from "express";
import {
  createBranch,
  getBranches,
  getBranchById,
  updateBranch,
  deleteBranch,
} from "../controllers/branchController.js";
import { protectAdmin } from "../middlewares/adminAuth.js";

const router = express.Router();

router.use(protectAdmin);

router.post("/", createBranch);
router.get("/", getBranches);
router.get("/:id", getBranchById);
router.put("/:id", updateBranch);
router.delete("/:id", deleteBranch);

export default router;
