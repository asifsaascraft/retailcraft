import mongoose from "mongoose";

/* ======================================================
   Invoice Item
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
   Billing Schema
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

    invoiceNumber: {
      type: String,
      required: true,
      unique: true,
    },

    items: [BillingItemSchema],

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
    }
  },
  { timestamps: true }
);

export default mongoose.models.Billing ||
mongoose.model("Billing", BillingSchema);