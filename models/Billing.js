import mongoose from "mongoose";

/* ======================================================
   Billing Item Schema
   Each product in invoice
====================================================== */
const BillingItemSchema = new mongoose.Schema(
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

    barCode: {
      type: String,
      required: true,
    },

    quantity: {
      type: Number,
      required: true,
      min: 1,
    },

    price: {
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
  { _id: false }
);


/* ======================================================
   Main Billing Schema
====================================================== */
const BillingSchema = new mongoose.Schema(
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

    customerId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Customer",
      required: true,
    },

    items: [BillingItemSchema],

    subTotal: {
      type: Number,
      required: true,
      default: 0,
    },

    totalTax: {
      type: Number,
      required: true,
      default: 0,
    },

    grandTotal: {
      type: Number,
      required: true,
      default: 0,
    },

    status: {
      type: String,
      enum: ["Draft", "Completed"],
      default: "Draft",
    },
  },
  { timestamps: true }
);

export default mongoose.models.Billing ||
  mongoose.model("Billing", BillingSchema);