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

    if (billing.status === "Completed")
      return res.status(400).json({
        success: false,
        message: "Invoice already completed. Cannot add more products.",
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

      if (billing.status === "Completed")
        return res.status(400).json({
          success: false,
          message: "Invoice already completed",
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

    const itemIndex =
      billing.items.findIndex(
        item =>
          item.productId.toString() === productId
      );

    if (itemIndex === -1)
      return res.status(404).json({
        success: false,
        message: "Product not found in billing",
      });

    const item = billing.items[itemIndex];

    /* restore stock */
    const product =
      await Product.findOne({
        _id: productId,
        branchId,
      });

    if (product) {
      product.quantity += item.quantity;
      await product.save();
    }

    /* update totals */
    billing.subTotal -= item.price * item.quantity;
    billing.totalTax -= item.taxAmount;
    billing.grandTotal -= item.totalAmount;

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

    const {
      billingId,
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

    const item =
      billing.items.find(
        i =>
          i.productId.toString() === productId
      );

    if (!item)
      return res.status(404).json({
        success: false,
        message: "Product not in billing",
      });

    const product =
      await Product.findOne({
        _id: productId,
        branchId,
      });

    const difference =
      newQty - item.quantity;

    if (difference > 0 &&
      product.quantity < difference)
      return res.status(400).json({
        success: false,
        message: "Insufficient stock",
      });

    /* restore or reduce stock */
    product.quantity -= difference;

    await product.save();

    /* remove old totals */
    billing.subTotal -= item.price * item.quantity;
    billing.totalTax -= item.taxAmount;
    billing.grandTotal -= item.totalAmount;

    /* recalculate */
    const taxAmount =
      (item.price * newQty *
        item.taxPercent) / 100;

    const totalAmount =
      item.price * newQty + taxAmount;

    item.quantity = newQty;
    item.taxAmount = taxAmount;
    item.totalAmount = totalAmount;

    /* add new totals */
    billing.subTotal += item.price * newQty;
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

      product.quantity += item.quantity;

      await product.save({ session });

    }

    /* =========================
       STEP 2: DELETE BILLING
    ========================= */

    await Billing.deleteOne({
      _id: billingId
    }).session(session);

    await session.commitTransaction();
    session.endSession();

    res.json({
      success: true,
      message:
        "Billing deleted successfully and stock restored",
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