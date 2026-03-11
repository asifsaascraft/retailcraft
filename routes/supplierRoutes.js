import express from "express";

import {
  createSupplier,
  getSuppliers,
  getSupplierById,
  updateSupplier,
  deleteSupplier,
} from "../controllers/supplierController.js";

import { protectUser } from "../middlewares/userAuth.js";

const router = express.Router();

/* ==========================
   Protect All Routes
========================== */

router.use(protectUser);


/* ==========================
   Supplier Routes
========================== */

// Create Supplier
router.post("/", createSupplier);

// Get All Suppliers
router.get("/", getSuppliers);

// Get Single Supplier
router.get("/single/:id", getSupplierById);

// Update Supplier
router.put("/:id", updateSupplier);

// Delete Supplier
router.delete("/:id", deleteSupplier);

export default router;