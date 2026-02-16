import mongoose from "mongoose";
import bcrypt from "bcryptjs";

const BranchSchema = new mongoose.Schema(
  {
    branchName: {
      type: String,
      required: [true, "Branch name is required"],
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
    timeZone: {
      type: String, // e.g., "Asia/Kolkata"
      required: [true, "Time Zone is required"],
    },
    branchCode: {
      type: String,
      required: [true, "Branch code is required"],
      trim: true,
    },
    branchGstNumber: {
      type: String,
      required: [true, "Branch GST number is required"],
      trim: true,
    },
  },
  { timestamps: true }
);


export default mongoose.models.Branch ||
  mongoose.model("Branch", BranchSchema);
