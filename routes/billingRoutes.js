import express from "express";

import {
  createBilling,
  addProductByBarcode,
  getBillingById,
  completeBilling
} from "../controllers/billingController.js";

import { protectUser }
from "../middlewares/userAuth.js";

const router = express.Router();

router.use(protectUser);

router.post("/create", createBilling);

router.post(
  "/add-product",
  addProductByBarcode
);

router.post(
  "/complete/:id",
  completeBilling
);

router.get("/:id", getBillingById);


export default router;