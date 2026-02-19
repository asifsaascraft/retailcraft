import express from "express";
import {
  createProduct,
  getProducts,
  getProductById,
  updateProduct,
  deleteProduct,
} from "../controllers/productController.js";

import { protectUser } from "../middlewares/userAuth.js";

const router = express.Router();

// 🔐 All routes protected
router.use(protectUser);

// Create
router.post("/", createProduct);

// Get all by branch
router.get("/", getProducts);

// Get single
router.get("/:id", getProductById);

// Update
router.put("/:id", updateProduct);

// Delete
router.delete("/:id", deleteProduct);

export default router;
