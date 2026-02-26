import mongoose from "mongoose";
import Billing from "../models/Billing.js";
import Product from "../models/Product.js";
import Customer from "../models/Customer.js";


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

    const {
      billingId,
      barCode,
      quantity
    } = req.body;

    const qty = Number(quantity);

    if (isNaN(qty) || qty <= 0)
      return res.status(400).json({
        success: false,
        message: "Invalid quantity",
      });

    const billing =
      await Billing.findById(billingId);

    if (!billing)
      return res.status(404).json({
        success: false,
        message: "Billing not found",
      });

    const customer =
      await Customer.findById(
        billing.customerId
      );

    const product =
      await Product.findOne({
        branchId,
        barCode,
      });

    if (!product)
      return res.status(404).json({
        success: false,
        message: "Product not found",
      });

    /* =============================
       STOCK CHECK
    ============================== */

    if (product.quantity < qty)
      return res.status(400).json({
        success: false,
        message:
          "Not enough stock available",
      });


    /* =============================
       SELECT PRICE BASED ON CUSTOMER TYPE
    ============================== */

    let price = 0;

    if (customer.customerType === "B2B")
      price = product.b2bSalePrice;
    else
      price = product.b2cSalePrice;


    /* =============================
       TAX CALCULATION
    ============================== */

    const taxPercent = product.salesTax;

    const taxAmount =
      (price * qty * taxPercent) / 100;

    const totalAmount =
      price * qty + taxAmount;


    /* =============================
       ADD ITEM
    ============================== */

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


    /* =============================
       UPDATE TOTALS
    ============================== */

    billing.subTotal += price * qty;

    billing.totalTax += taxAmount;

    billing.grandTotal += totalAmount;

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

    const billing =
      await Billing.findById(
        req.params.id
      )
        .populate("customerId")
        .populate("items.productId");

    if (!billing)
      return res.status(404).json({
        success: false,
        message: "Billing not found",
      });

    res.json({
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
   Complete Billing
====================================================== */
export const completeBilling =
  async (req, res) => {

    try {

      const billing =
        await Billing.findById(
          req.params.id
        );

      if (!billing)
        return res.status(404).json({
          success: false,
          message: "Billing not found",
        });

      billing.status = "Completed";

      await billing.save();

      res.json({

        success: true,
        message:
          "Invoice completed",

        data: billing,

      });

    } catch (error) {

      res.status(500).json({
        success: false,
        message: error.message,
      });

    }

  };