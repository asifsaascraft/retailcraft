import express from "express";

import {
  createPurchaseInvoice,
  addProductByBarcode,
  removeProductFromPurchase,
  updatePurchaseProductQuantity,
  getPurchaseInvoiceById,
  completePurchaseInvoice,
  deletePurchaseInvoice,
  getCompletedPurchaseInvoices,
  updatePurchasePaymentStatus,
} from "../controllers/purchaseInvoiceController.js";

import { protectUser } from "../middlewares/userAuth.js";

const router = express.Router();

router.use(protectUser);

router.post("/create", createPurchaseInvoice);

router.post("/add-product", addProductByBarcode);

router.post("/remove-product", removeProductFromPurchase);

router.put("/update-quantity", updatePurchaseProductQuantity);

router.get("/complete/all", getCompletedPurchaseInvoices);

router.post("/complete/:id", completePurchaseInvoice);

router.put("/payment-status/:id", updatePurchasePaymentStatus);

router.get("/:id", getPurchaseInvoiceById);


router.delete("/:id", deletePurchaseInvoice);

export default router;