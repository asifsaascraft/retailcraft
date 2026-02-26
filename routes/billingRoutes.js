import express from "express";

import {
  createBilling,
  addProductByBarcode,
  getBillingById,
  completeBilling,
  removeProductFromBilling,
  updateProductQuantity,
  deleteBilling,
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

router.post("/remove-product", removeProductFromBilling);

router.put("/update-quantity", updateProductQuantity);


router.post(
  "/complete/:id",
  completeBilling
);

router.get("/:id", getBillingById);

router.delete("/:id", deleteBilling);


export default router;