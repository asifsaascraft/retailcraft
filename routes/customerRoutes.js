import express from "express";
import {
  createCustomer,
  getCustomers,
  getCustomerById,
  updateCustomer,
  deleteCustomer,
} from "../controllers/customerController.js";

import { protectUser } from "../middlewares/userAuth.js";

const router = express.Router();

//  All routes protected
router.use(protectUser);

// Create
router.post("/", createCustomer);

// Get All by user
router.get("/", getCustomers);

// Get single
router.get("/single/:id", getCustomerById);

// Update
router.put("/:id", updateCustomer);

// Delete
router.delete("/:id", deleteCustomer);

export default router;
