import mongoose from "mongoose";
import Billing from "../models/Billing.js";
import Product from "../models/Product.js";
import Customer from "../models/Customer.js";
import sendBillingSMS from "../utils/sendBillingSMS.js";

/* ======================================================
   Generate Invoice Number
====================================================== */
const generateInvoiceNumber = () => {
  return "INV-" + Date.now();
};

/* ======================================================
   Create Billing
====================================================== */
export const createBilling = async (req, res) => {
  try {
    const userId = req.user._id;
    const branchId = req.user.branchId;
    const { customerId } = req.body;

    if (!mongoose.Types.ObjectId.isValid(customerId))
      return res.status(400).json({
        success: false,
        message: "Invalid customerId",
      });

    const customer = await Customer.findById(customerId);

    if (!customer)
      return res.status(404).json({
        success: false,
        message: "Customer not found",
      });

    const billing = await Billing.create({
      userId,
      branchId,
      customerId,

      invoiceNumber: generateInvoiceNumber(),

      items: [],
      subTotal: 0,
      totalTax: 0,
      grandTotal: 0,
    });

    res.status(201).json({
      success: true,
      data: billing,
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

    const { billingId, barCode, quantity } = req.body;

    const qty = Number(quantity) || 1;

    if (isNaN(qty) || qty <= 0)
      return res.status(400).json({
        success: false,
        message: "Invalid quantity",
      });

    const billing = await Billing.findById(billingId);

    if (!billing)
      return res.status(404).json({
        success: false,
        message: "Billing not found",
      });

    if (billing.status === "Completed")
      return res.status(400).json({
        success: false,
        message: "Invoice already completed. Cannot add more products.",
      });

    const customer = await Customer.findById(billing.customerId);

    const products = await Product.find({
      branchId,
      barCode,
      status: "Active",
    });

    if (!products.length) {
      return res.status(404).json({
        success: false,
        message: "Product not found",
      });
    }

    /* ===============================
       MULTIPLE PRODUCT CASE
    =============================== */

    if (products.length > 1 && !req.body.productId) {
      return res.json({
        success: true,
        multiple: true,
        message: "Multiple products found, please select one",
        data: products.map((p) => ({
          _id: p._id,
          productName: p.productName,
          barCode: p.barCode,
          b2bSalePrice: p.b2bSalePrice,
          b2cSalePrice: p.b2cSalePrice,
          purchasePrice: p.purchasePrice,
          quantity: p.quantity,
        })),
      });
    }

    /* ===============================
       SELECT PRODUCT
    =============================== */

    let product;

    if (req.body.productId) {
      product = await Product.findOne({
        _id: req.body.productId,
        branchId,
      });
    } else {
      product = products[0];
    }

    if (!product) {
      return res.status(404).json({
        success: false,
        message: "Selected product not found",
      });
    }

    /* =============================
       STOCK CHECK
    ============================== */

    if (product.quantity < qty)
      return res.status(400).json({
        success: false,
        message: "Not enough stock available",
      });

    /* =============================
       SELECT PRICE BASED ON CUSTOMER TYPE
    ============================== */

    let price = 0;

    if (customer.customerType === "B2B") price = product.b2bSalePrice;
    else price = product.b2cSalePrice;

    /* =============================
   TAX CALCULATION (PRICE INCLUDES TAX)
============================= */

    const taxPercent = product.salesTax || 0;

    const priceWithQty = price * qty;

    const taxAmount = (priceWithQty * taxPercent) / (100 + taxPercent);

    const baseAmount = priceWithQty - taxAmount;

    const totalAmount = priceWithQty;

    /* =============================
       CHECK IF PRODUCT ALREADY EXISTS
    ============================== */

    const existingItem = billing.items.find(
      (item) => item.productId.toString() === product._id.toString(),
    );

    if (existingItem) {
      /* remove old totals */

      const oldPriceWithQty = existingItem.price * existingItem.quantity;

      const oldTax =
        (oldPriceWithQty * existingItem.taxPercent) /
        (100 + existingItem.taxPercent);

      const oldBase = oldPriceWithQty - oldTax;

      billing.subTotal -= oldBase;
      billing.totalTax -= oldTax;
      billing.grandTotal -= oldPriceWithQty;

      /* increase quantity */

      existingItem.quantity += qty;

      const newPriceWithQty = existingItem.price * existingItem.quantity;

      const newTaxAmount =
        (newPriceWithQty * existingItem.taxPercent) /
        (100 + existingItem.taxPercent);

      const newBaseAmount = newPriceWithQty - newTaxAmount;

      const newTotalAmount = newPriceWithQty;

      existingItem.taxAmount = newTaxAmount;
      existingItem.totalAmount = newTotalAmount;

      /* add new totals */

      billing.subTotal += newBaseAmount;
      billing.totalTax += newTaxAmount;
      billing.grandTotal += newTotalAmount;
    } else {
      /* ADD NEW PRODUCT */

      billing.items.push({
        productId: product._id,
        productName: product.productName,
        barCode: product.barCode,

        quantity: qty,

        price,

        taxPercent,
        taxAmount,

        totalAmount,
      });

      billing.subTotal += baseAmount;
      billing.totalTax += taxAmount;
      billing.grandTotal += totalAmount;
    }

    /* SAVE BILLING */
    await billing.save();

    /* =============================
       REDUCE PRODUCT STOCK
    ============================== */

    product.quantity -= qty;

    await product.save();

    res.json({
      success: true,
      message: "Product added",

      data: billing,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

/* ======================================================
   Get Billing By ID
====================================================== */
export const getBillingById = async (req, res) => {
  try {
    const billing = await Billing.findById(req.params.id)

      // populate customer with selected fields
      .populate("customerId", "customerType name email mobile")

      // populate branch with selected fields
      .populate(
        "branchId",
        "branchName branchPhoneNumber address country state city pincode branchCode branchGstNumber",
      );

    if (!billing) {
      return res.status(404).json({
        success: false,
        message: "Billing not found",
      });
    }

    /* =========================
       MERGE SAME PRODUCTS
    ========================== */

    const mergedItemsMap = {};

    billing.items.forEach((item) => {
      const key = item.productId.toString();

      if (!mergedItemsMap[key]) {
        mergedItemsMap[key] = { ...item.toObject() };
      } else {
        mergedItemsMap[key].quantity += item.quantity;
        mergedItemsMap[key].taxAmount += item.taxAmount;
        mergedItemsMap[key].totalAmount += item.totalAmount;
      }
    });

    const mergedItems = Object.values(mergedItemsMap);

    /* =========================
       CALCULATE AVERAGE TAX %
    ========================== */

    let totalTaxPercent = 0;

    if (mergedItems.length > 0) {
      const sumTaxPercent = mergedItems.reduce(
        (sum, item) => sum + item.taxPercent,
        0,
      );

      totalTaxPercent = sumTaxPercent / mergedItems.length;
    }

    const result = {
      ...billing.toObject(),
      items: mergedItems,
      totalTaxPercent,
    };

    res.json({
      success: true,
      data: result,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

/* ======================================================
   Complete Billing
====================================================== */
export const completeBilling = async (req, res) => {
  try {
    const { paymentMode, discount = 0, freightCharge = 0 } = req.body;

    const billing = await Billing.findById(req.params.id);

    if (!billing)
      return res.status(404).json({
        success: false,
        message: "Billing not found",
      });

    if (billing.status === "Completed")
      return res.status(400).json({
        success: false,
        message: "Invoice already completed",
      });

    /* =========================
       PAYMENT MODE VALIDATION
    ========================== */

    const validPaymentModes = ["UPI", "Debit/Credit Card", "Cash", "Pay Later"];

    if (!paymentMode || !validPaymentModes.includes(paymentMode))
      return res.status(400).json({
        success: false,
        message:
          "Valid paymentMode is required (UPI, Debit/Credit Card, Cash, Pay Later)",
      });

    /* =========================
   PAY LATER VALIDATION
========================= */

    if (paymentMode === "Pay Later") {
      if (!req.body.remarks || !req.body.remarks.trim()) {
        return res.status(400).json({
          success: false,
          message: "Remarks is required when payment mode is Pay Later",
        });
      }
    }

    /* =========================
       DISCOUNT VALIDATION
    ========================== */

    const discountValue = Number(discount);

    if (isNaN(discountValue) || discountValue < 0 || discountValue > 100)
      return res.status(400).json({
        success: false,
        message: "Discount must be between 0 to 100",
      });

    /* =========================
    FREIGHT VALIDATION
    ========================= */

    const freightValue = Number(freightCharge);

    if (isNaN(freightValue) || freightValue < 0)
      return res.status(400).json({
        success: false,
        message: "Freight charge must be a valid number ≥ 0",
      });

    /* =========================
       CALCULATE DISCOUNT
    ========================== */

    const discountAmount = (billing.subTotal * discountValue) / 100;

    const finalTotal =
      billing.subTotal - discountAmount + billing.totalTax + freightValue;

    /* =========================
       UPDATE BILLING
    ========================== */

    billing.paymentMode = paymentMode;
    billing.remarks =
      paymentMode === "Pay Later" ? req.body.remarks.trim() : "";
    billing.discount = discountValue;
    billing.discountAmount = discountAmount;
    billing.freightCharge = freightValue;
    billing.finalTotal = finalTotal;
    billing.status = "Completed";
    billing.paymentStatus = paymentMode === "Pay Later" ? "Pending" : "Paid";

    await billing.save();

    /* =========================
   SEND SMS TO CUSTOMER
========================= */

    try {
      const customer = await Customer.findById(billing.customerId);

      if (customer?.mobile) {
        await sendBillingSMS(
          customer.mobile,
          billing.invoiceNumber,
          billing.finalTotal,
        );
      }
    } catch (smsError) {
      console.error("SMS Failed:", smsError.message);
      // don't fail API if SMS fails
    }

    res.json({
      success: true,
      message: "Invoice completed successfully",
      data: billing,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

/* ======================================================
   Remove Product From Billing
====================================================== */
export const removeProductFromBilling = async (req, res) => {
  try {
    const { billingId, productId } = req.body;
    const branchId = req.user.branchId;

    if (
      !mongoose.Types.ObjectId.isValid(billingId) ||
      !mongoose.Types.ObjectId.isValid(productId)
    )
      return res.status(400).json({
        success: false,
        message: "Invalid billingId or productId",
      });

    const billing = await Billing.findById(billingId);

    if (!billing)
      return res.status(404).json({
        success: false,
        message: "Billing not found",
      });

    if (billing.status === "Completed")
      return res.status(400).json({
        success: false,
        message: "Cannot modify completed invoice",
      });

    const itemIndex = billing.items.findIndex(
      (item) => item.productId.toString() === productId,
    );

    if (itemIndex === -1)
      return res.status(404).json({
        success: false,
        message: "Product not found in billing",
      });

    const item = billing.items[itemIndex];

    /* restore stock */
    const product = await Product.findOne({
      _id: productId,
      branchId,
    });

    if (product) {
      product.quantity += item.quantity;
      await product.save();
    }

    /* update totals */
    const priceWithQty = item.price * item.quantity;

    const taxAmount =
      (priceWithQty * item.taxPercent) / (100 + item.taxPercent);

    const baseAmount = priceWithQty - taxAmount;

    billing.subTotal -= baseAmount;
    billing.totalTax -= taxAmount;
    billing.grandTotal -= priceWithQty;

    /* remove item */
    billing.items.splice(itemIndex, 1);

    await billing.save();

    res.json({
      success: true,
      message: "Product removed",
      data: billing,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

/* ======================================================
   Update Product Quantity
====================================================== */
export const updateProductQuantity = async (req, res) => {
  try {
    const { billingId, productId, quantity } = req.body;

    const branchId = req.user.branchId;

    const newQty = Number(quantity);

    if (isNaN(newQty) || newQty <= 0)
      return res.status(400).json({
        success: false,
        message: "Invalid quantity",
      });

    const billing = await Billing.findById(billingId);

    if (!billing)
      return res.status(404).json({
        success: false,
        message: "Billing not found",
      });

    if (billing.status === "Completed")
      return res.status(400).json({
        success: false,
        message: "Cannot modify completed invoice",
      });

    const item = billing.items.find(
      (i) => i.productId.toString() === productId,
    );

    if (!item)
      return res.status(404).json({
        success: false,
        message: "Product not in billing",
      });

    const product = await Product.findOne({
      _id: productId,
      branchId,
    });

    const difference = newQty - item.quantity;

    if (difference > 0 && product.quantity < difference)
      return res.status(400).json({
        success: false,
        message: "Insufficient stock",
      });

    /* restore or reduce stock */
    product.quantity -= difference;

    await product.save();

    /* remove old totals */
    const oldPriceWithQty = item.price * item.quantity;

    const oldTax =
      (oldPriceWithQty * item.taxPercent) / (100 + item.taxPercent);

    const oldBase = oldPriceWithQty - oldTax;

    billing.subTotal -= oldBase;
    billing.totalTax -= oldTax;
    billing.grandTotal -= oldPriceWithQty;

    /* recalculate */
    const priceWithQty = item.price * newQty;

    const taxAmount =
      (priceWithQty * item.taxPercent) / (100 + item.taxPercent);

    const baseAmount = priceWithQty - taxAmount;

    const totalAmount = priceWithQty;

    item.quantity = newQty;
    item.taxAmount = taxAmount;
    item.totalAmount = totalAmount;

    /* add new totals */
    billing.subTotal += baseAmount;
    billing.totalTax += taxAmount;
    billing.grandTotal += totalAmount;

    await billing.save();

    res.json({
      success: true,
      message: "Quantity updated",
      data: billing,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

/* ======================================================
   Delete Billing
====================================================== */
export const deleteBilling = async (req, res) => {
  const session = await mongoose.startSession();

  try {
    session.startTransaction();

    const billingId = req.params.id;
    const branchId = req.user.branchId;

    if (!mongoose.Types.ObjectId.isValid(billingId)) {
      await session.abortTransaction();
      session.endSession();

      return res.status(400).json({
        success: false,
        message: "Invalid billingId",
      });
    }

    const billing = await Billing.findById(billingId).session(session);

    if (!billing) {
      await session.abortTransaction();
      session.endSession();

      return res.status(404).json({
        success: false,
        message: "Billing not found",
      });
    }

    if (billing.status === "Completed") {
      await session.abortTransaction();
      session.endSession();

      return res.status(400).json({
        success: false,
        message: "Cannot delete completed invoice",
      });
    }

    /* =========================
       STEP 1: RESTORE STOCK
    ========================= */

    for (const item of billing.items) {
      const product = await Product.findOne({
        _id: item.productId,
        branchId,
      }).session(session);

      if (!product) {
        await session.abortTransaction();
        session.endSession();

        return res.status(404).json({
          success: false,
          message: `Product not found: ${item.productId}`,
        });
      }

      product.quantity += item.quantity;

      await product.save({ session });
    }

    /* =========================
       STEP 2: DELETE BILLING
    ========================= */

    await Billing.deleteOne({
      _id: billingId,
    }).session(session);

    await session.commitTransaction();
    session.endSession();

    res.json({
      success: true,
      message: "Billing deleted successfully and stock restored",
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

/* ======================================================
   Get All Completed Billing
====================================================== */
export const getCompletedBillings = async (req, res) => {
  try {
    const branchId = req.user.branchId;

    const billings = await Billing.find({
      branchId,
      status: "Completed",
    })
      .sort({ createdAt: -1 })
      .populate("customerId", "customerType name email mobile");

    res.json({
      success: true,
      count: billings.length,
      data: billings,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Failed to fetch completed billings",
    });
  }
};

/* ======================================================
   Updated Completed Billing Payment Status
====================================================== */
export const updateBillingPaymentStatus = async (req, res) => {
  try {
    const { id } = req.params;
    const { paymentStatus } = req.body;

    const validStatus = ["Pending", "Paid"];

    if (!validStatus.includes(paymentStatus))
      return res.status(400).json({
        success: false,
        message: "Invalid payment status",
      });

    const billing = await Billing.findById(id);

    if (!billing)
      return res.status(404).json({
        success: false,
        message: "Billing not found",
      });

    billing.paymentStatus = paymentStatus;

    await billing.save();

    res.json({
      success: true,
      message: "Payment status updated",
      data: billing,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};
