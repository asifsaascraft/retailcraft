import mongoose from "mongoose";

const SupplierSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },

    name: {
      type: String,
      required: [true, "Supplier name is required"],
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

    address: {
      type: String,
      required: [true, "Address is required"],
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
    pincode: {
      type: String,
      required: [true, "Pincode is required"],
      trim: true,
    },

    gstIn: {
      type: String,
      required: [true, "GST is required"],
      trim: true,
    },

  },
  { timestamps: true }
);

export default mongoose.models.Supplier ||
  mongoose.model("Supplier", SupplierSchema);
