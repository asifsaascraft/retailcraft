import mongoose from "mongoose";

const CustomerSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },

    customerType: {
      type: String,
      required: [true, "Customer type is required"],
      enum: {
        values: ["B2B", "B2C"],
        message: "Customer type must be either B2B or B2C",
      },
      default: "B2C",
      trim: true,
    },

    name: {
      type: String,
      required: [true, "Customer name is required"],
      trim: true,
    },

    email: {
      type: String,
      trim: true,
      match: [/^\S+@\S+\.\S+$/, "Invalid email format"],
    },

    mobile: {
      type: String,
      match: [/^\d{10}$/, "Mobile must be 10 digits"],
      trim: true,
    },

    country: {
      type: String,
      required: [true, "Country is required"],
      trim: true,
    },

    state: {
      type: String,
      required: [true, "State is required"],
      trim: true,
    },

    city: {
      type: String,
      required: [true, "City is required"],
      trim: true,
    },

    /* =========================
       B2B Conditional Fields
    ========================= */

    companyName: {
      type: String,
      required: function () {
        return this.customerType === "B2B";
      },
      trim: true,
    },

    GstRegistrationType: {
      type: String,
      required: function () {
        return this.customerType === "B2B";
      },
      trim: true,
    },

    gstIn: {
      type: String,
      required: function () {
        return this.customerType === "B2B";
      },
      trim: true,
    },

    contactName: {
      type: String,
      trim: true,
    },

    contactNumber: {
      type: String,
      match: [/^\d{10}$/, "Contact number must be 10 digits"],
      trim: true,
    },

    contactEmail: {
      type: String,
      trim: true,
      match: [/^\S+@\S+\.\S+$/, "Invalid contact email format"],
    },
  },
  { timestamps: true }
);

export default mongoose.models.Customer ||
  mongoose.model("Customer", CustomerSchema);
