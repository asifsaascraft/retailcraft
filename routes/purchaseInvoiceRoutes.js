import express from "express";

import {
  createPurchaseInvoice,
  addProductByBarcode,
  removeProductFromPurchase,
  updatePurchaseProductQuantity,
  getPurchaseInvoiceById,
  completePurchaseInvoice,
  deletePurchaseInvoice
} from "../controllers/purchaseInvoiceController.js";

import { protectUser } from "../middlewares/userAuth.js";

const router = express.Router();

router.use(protectUser);

router.post("/create", createPurchaseInvoice);

router.post("/add-product", addProductByBarcode);

router.post("/remove-product", removeProductFromPurchase);

router.put("/update-quantity", updatePurchaseProductQuantity);

router.get("/:id", getPurchaseInvoiceById);

router.post("/complete/:id", completePurchaseInvoice);

router.delete("/:id", deletePurchaseInvoice);

export default router;