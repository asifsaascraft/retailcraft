import express from "express";
import {
  createProduct,
  getProductById,
  updateProduct,
  deleteProduct,
  getAllProductsWithStatus,
  addStock,
  reduceStock,
  getLowStock,
  getStockSummary,
} from "../controllers/productController.js";

import { protectUser } from "../middlewares/userAuth.js";

const router = express.Router();

/*
=========================================================
All routes below require logged-in USER authentication
Branch is automatically detected from logged-in user
=========================================================
*/

router.use(protectUser);

// Stock
router.post("/add-stock", addStock);
router.post("/reduce-stock", reduceStock);
router.get("/low-stock", getLowStock);
router.get("/stock-summary", getStockSummary);

/*
GET /products
Default → Active products
GET /products?status=Inactive
GET /products?status=All
*/

// Product
router.get("/", getAllProductsWithStatus);
router.get("/:id", getProductById);
router.post("/", createProduct);
router.put("/:id", updateProduct);
router.delete("/:id", deleteProduct);




export default router;
