import mongoose from "mongoose";

/* ======================================================
   Purchase Item Schema
====================================================== */

const PurchaseItemSchema = new mongoose.Schema(
  {
    productId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Product",
      required: true,
    },

    productName: {
      type: String,
      required: true,
    },

    itemCode: {
      type: String,
      required: true,
    },

    barCode: {
      type: String,
      required: true,
    },

    quantity: {
      type: Number,
      required: true,
      min: 1,
    },

    purchasePrice: {
      type: Number,
      required: true,
    },

    taxPercent: {
      type: Number,
      required: true,
    },

    taxAmount: {
      type: Number,
      required: true,
    },

    totalAmount: {
      type: Number,
      required: true,
    },
  },
  { _id: false },
);

/* ======================================================
   Purchase Invoice Schema
====================================================== */

const PurchaseInvoiceSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },

    branchId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Branch",
      required: true,
    },

    supplierId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Supplier",
      required: true,
    },

    invoiceNumber: {
      type: String,
      required: true,
      unique: true,
    },

    referenceInvoiceNumber: {
      type: String,
      required: true,
      unique: true,
    },

    invoiceDate: {
      type: Date,
      required: true,
    },

    placeOfSupply: {
      type: String,
      required: true,
    },

    items: [PurchaseItemSchema],

    subTotal: {
      type: Number,
      default: 0,
    },

    totalTax: {
      type: Number,
      default: 0,
    },

    grandTotal: {
      type: Number,
      default: 0,
    },

    /* ===============================
   DISCOUNT
=============================== */
    discount: {
      type: Number, // percentage
      default: 0,
    },

    discountAmount: {
      type: Number,
      default: 0,
    },

    finalTotal: {
      type: Number,
      default: 0,
    },

    // this is a double number (like amount 4.50)
    freightCharge: {
      type: Number,
      default: 0,
    },

    status: {
      type: String,
      enum: ["Draft", "Completed"],
      default: "Draft",
    },

    paymentMode: {
      type: String,
      enum: ["UPI", "Debit/Credit Card", "Cash", "Pay Later"],
    },
    remarks: {
      type: String,
    },

    paymentStatus: {
      type: String,
      enum: ["Pending", "Paid"],
      default: "Pending",
    },
  },
  { timestamps: true },
);

export default mongoose.models.PurchaseInvoice ||
  mongoose.model("PurchaseInvoice", PurchaseInvoiceSchema);
