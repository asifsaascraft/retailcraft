import mongoose from "mongoose";
import PurchaseInvoice from "../models/PurchaseInvoice.js";
import Supplier from "../models/Supplier.js";
import Product from "../models/Product.js";



/* ======================================================
   Create Purchase Invoice
====================================================== */
export const createPurchaseInvoice = async (req, res) => {
  try {

    const userId = req.user._id;
    const branchId = req.user.branchId;

    const {
      supplierId,
      invoiceNumber,
      invoiceDate,
      placeOfSupply,
      reverseCharge
    } = req.body;

    /* =========================
       VALIDATE SUPPLIER ID
    ========================== */

    if (!mongoose.Types.ObjectId.isValid(supplierId)) {
      return res.status(400).json({
        success: false,
        message: "Invalid supplierId",
      });
    }

    /* =========================
       VALIDATE INVOICE NUMBER
    ========================== */

    if (!invoiceNumber || invoiceNumber.trim() === "") {
      return res.status(400).json({
        success: false,
        message: "Invoice number is required",
      });
    }

    /* =========================
       VALIDATE INVOICE DATE
    ========================== */

    if (!invoiceDate) {
      return res.status(400).json({
        success: false,
        message: "Invoice date is required",
      });
    }

    /* =========================
       VALIDATE PLACE OF SUPPLY
    ========================== */

    if (!placeOfSupply || placeOfSupply.trim() === "") {
      return res.status(400).json({
        success: false,
        message: "Place of supply is required",
      });
    }

    /* =========================
       VALIDATE REVERSE CHARGE
    ========================== */

    if (!reverseCharge || reverseCharge.trim() === "") {
      return res.status(400).json({
        success: false,
        message: "Reverse charge is required",
      });
    }

    /* =========================
       CHECK SUPPLIER
    ========================== */

    const supplier = await Supplier.findById(supplierId);

    if (!supplier) {
      return res.status(404).json({
        success: false,
        message: "Supplier not found",
      });
    }

    /* =========================
       CHECK DUPLICATE INVOICE
    ========================== */

    const existingInvoice = await PurchaseInvoice.findOne({
      invoiceNumber,
    });

    if (existingInvoice) {
      return res.status(400).json({
        success: false,
        message: "Invoice number already exists",
      });
    }

    /* =========================
       CREATE PURCHASE INVOICE
    ========================== */

    const purchase = await PurchaseInvoice.create({
      userId,
      branchId,
      supplierId,

      invoiceNumber,
      invoiceDate,
      placeOfSupply,
      reverseCharge,

      items: [],
      subTotal: 0,
      totalTax: 0,
      grandTotal: 0,
    });

    res.status(201).json({
      success: true,
      message: "Purchase invoice created successfully",
      data: purchase,
    });

  } catch (error) {

    res.status(500).json({
      success: false,
      message: error.message,
    });

  }
};


/* ======================================================
   Add Product using Barcode Scanner
====================================================== */
export const addProductByBarcode = async (req, res) => {

  try {

    const branchId = req.user.branchId;

    const {
      purchaseId,
      barCode,
      quantity
    } = req.body;

    const qty = Number(quantity) || 1;

    if (isNaN(qty) || qty <= 0)
      return res.status(400).json({
        success: false,
        message: "Invalid quantity",
      });

    const purchase = await PurchaseInvoice.findById(purchaseId);

    if (!purchase)
      return res.status(404).json({
        success: false,
        message: "Purchase invoice not found",
      });

    if (purchase.status === "Completed")
      return res.status(400).json({
        success: false,
        message: "Invoice already completed. Cannot add more products.",
      });

    const product = await Product.findOne({
      branchId,
      barCode,
    });

    if (!product)
      return res.status(404).json({
        success: false,
        message: "Product not found",
      });

    /* =============================
       PURCHASE PRICE
    ============================== */

    const purchasePrice = product.purchasePrice;

    /* =============================
       TAX CALCULATION
    ============================== */

    const taxPercent = product.salesTax || 0;

    const taxAmount =
      (purchasePrice * qty * taxPercent) / 100;

    const totalAmount =
      purchasePrice * qty + taxAmount;

    /* =============================
       CHECK IF PRODUCT ALREADY EXISTS
    ============================== */

    const existingItem = purchase.items.find(
      item =>
        item.productId.toString() ===
        product._id.toString()
    );

    if (existingItem) {

      /* remove old totals */

      purchase.subTotal -= existingItem.purchasePrice * existingItem.quantity;
      purchase.totalTax -= existingItem.taxAmount;
      purchase.grandTotal -= existingItem.totalAmount;

      /* increase quantity */

      existingItem.quantity += qty;

      /* recalc tax */

      const newTaxAmount =
        (existingItem.purchasePrice *
          existingItem.quantity *
          existingItem.taxPercent) / 100;

      const newTotalAmount =
        existingItem.purchasePrice *
        existingItem.quantity +
        newTaxAmount;

      existingItem.taxAmount = newTaxAmount;
      existingItem.totalAmount = newTotalAmount;

      /* add new totals */

      purchase.subTotal +=
        existingItem.purchasePrice * existingItem.quantity;

      purchase.totalTax += newTaxAmount;

      purchase.grandTotal += newTotalAmount;

    } else {

      /* ADD NEW PRODUCT */

      purchase.items.push({

        productId: product._id,
        productName: product.productName,
        barCode: product.barCode,

        quantity: qty,

        purchasePrice,

        taxPercent,
        taxAmount,

        totalAmount,

      });

      purchase.subTotal += purchasePrice * qty;
      purchase.totalTax += taxAmount;
      purchase.grandTotal += totalAmount;

    }

    /* SAVE PURCHASE */

    await purchase.save();

    /* =============================
       ADD PRODUCT STOCK
    ============================== */

    product.quantity += qty;

    await product.save();

    res.json({

      success: true,
      message: "Product added to purchase invoice",

      data: purchase,

    });

  } catch (error) {

    res.status(500).json({
      success: false,
      message: error.message,
    });

  }
};





/* ======================================================
   Complete Purchase Invoice
====================================================== */
export const completePurchaseInvoice = async (req, res) => {

  try {

    const purchase =
      await PurchaseInvoice.findById(req.params.id);

    if (!purchase)
      return res.status(404).json({
        success: false,
        message: "Purchase invoice not found",
      });

    if (purchase.status === "Completed")
      return res.status(400).json({
        success: false,
        message: "Invoice already completed",
      });

    purchase.status = "Completed";

    await purchase.save();

    res.json({
      success: true,
      message: "Purchase invoice completed",
      data: purchase,
    });

  } catch (error) {

    res.status(500).json({
      success: false,
      message: error.message,
    });

  }
};

/* ======================================================
   Remove Product From Purchase
====================================================== */
export const removeProductFromPurchase = async (req, res) => {

  try {

    const { purchaseId, productId } = req.body;
    const branchId = req.user.branchId;

    const purchase = await PurchaseInvoice.findById(purchaseId);

    if (!purchase)
      return res.status(404).json({
        success: false,
        message: "Purchase not found",
      });

    const itemIndex =
      purchase.items.findIndex(
        item =>
          item.productId.toString() === productId
      );

    if (itemIndex === -1)
      return res.status(404).json({
        success: false,
        message: "Product not found",
      });

    const item = purchase.items[itemIndex];

    const product = await Product.findOne({
      _id: productId,
      branchId,
    });

    /* reverse stock */
    if (product) {

      product.quantity -= item.quantity;

      await product.save();

    }

    purchase.subTotal -= item.purchasePrice * item.quantity;
    purchase.totalTax -= item.taxAmount;
    purchase.grandTotal -= item.totalAmount;

    purchase.items.splice(itemIndex, 1);

    await purchase.save();

    res.json({
      success: true,
      message: "Product removed",
      data: purchase,
    });

  } catch (error) {

    res.status(500).json({
      success: false,
      message: error.message,
    });

  }
};

/* ======================================================
   Get Purchase Invoice By ID
====================================================== */
export const getPurchaseInvoiceById = async (req, res) => {
  try {

    const purchase = await PurchaseInvoice.findById(req.params.id)
      .populate(
        "supplierId",
      )
      .populate(
        "branchId",
        "branchName branchPhoneNumber address country state city pincode branchCode branchGstNumber"
      );

    if (!purchase) {
      return res.status(404).json({
        success: false,
        message: "Purchase invoice not found",
      });
    }

    res.json({
      success: true,
      data: purchase
    });

  } catch (error) {

    res.status(500).json({
      success: false,
      message: error.message,
    });

  }
};

/* ======================================================
   Update Purchase Product Quantity
====================================================== */
export const updatePurchaseProductQuantity = async (req, res) => {

  try {

    const {
      purchaseId,
      productId,
      quantity
    } = req.body;

    const branchId = req.user.branchId;

    const newQty = Number(quantity);

    if (isNaN(newQty) || newQty <= 0)
      return res.status(400).json({
        success: false,
        message: "Invalid quantity",
      });

    const purchase = await PurchaseInvoice.findById(purchaseId);

    if (!purchase)
      return res.status(404).json({
        success: false,
        message: "Purchase invoice not found",
      });

    if (purchase.status === "Completed")
      return res.status(400).json({
        success: false,
        message: "Cannot modify completed invoice",
      });

    const item =
      purchase.items.find(
        i => i.productId.toString() === productId
      );

    if (!item)
      return res.status(404).json({
        success: false,
        message: "Product not in purchase invoice",
      });

    const product =
      await Product.findOne({
        _id: productId,
        branchId,
      });

    const difference = newQty - item.quantity;

    /* PURCHASE = ADD STOCK */

    product.quantity += difference;

    await product.save();

    /* remove old totals */

    purchase.subTotal -= item.purchasePrice * item.quantity;
    purchase.totalTax -= item.taxAmount;
    purchase.grandTotal -= item.totalAmount;

    const taxAmount =
      (item.purchasePrice * newQty * item.taxPercent) / 100;

    const totalAmount =
      item.purchasePrice * newQty + taxAmount;

    item.quantity = newQty;
    item.taxAmount = taxAmount;
    item.totalAmount = totalAmount;

    purchase.subTotal += item.purchasePrice * newQty;
    purchase.totalTax += taxAmount;
    purchase.grandTotal += totalAmount;

    await purchase.save();

    res.json({
      success: true,
      message: "Quantity updated",
      data: purchase,
    });

  } catch (error) {

    res.status(500).json({
      success: false,
      message: error.message,
    });

  }
};

/* ======================================================
   Delete Purchase Invoice
====================================================== */
export const deletePurchaseInvoice = async (req, res) => {

  const session = await mongoose.startSession();

  try {

    session.startTransaction();

    const purchaseId = req.params.id;
    const branchId = req.user.branchId;

    if (!mongoose.Types.ObjectId.isValid(purchaseId)) {
      await session.abortTransaction();
      session.endSession();

      return res.status(400).json({
        success: false,
        message: "Invalid purchaseId",
      });
    }

    const purchase =
      await PurchaseInvoice.findById(purchaseId)
        .session(session);

    if (!purchase) {
      await session.abortTransaction();
      session.endSession();

      return res.status(404).json({
        success: false,
        message: "Purchase invoice not found",
      });
    }

    if (purchase.status === "Completed") {
      await session.abortTransaction();
      session.endSession();

      return res.status(400).json({
        success: false,
        message: "Cannot delete completed invoice",
      });
    }

    /* REMOVE ADDED STOCK */

    for (const item of purchase.items) {

      const product =
        await Product.findOne({
          _id: item.productId,
          branchId
        }).session(session);

      if (!product) {
        await session.abortTransaction();
        session.endSession();

        return res.status(404).json({
          success: false,
          message:
            `Product not found: ${item.productId}`,
        });
      }

      product.quantity -= item.quantity;

      await product.save({ session });

    }

    await PurchaseInvoice.deleteOne({
      _id: purchaseId
    }).session(session);

    await session.commitTransaction();
    session.endSession();

    res.json({
      success: true,
      message:
        "Purchase invoice deleted and stock adjusted",
    });

  } catch (error) {

    await session.abortTransaction();
    session.endSession();

    res.status(500).json({
      success: false,
      message: error.message,
    });

  }
};