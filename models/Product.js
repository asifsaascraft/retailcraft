import mongoose from "mongoose";

const ProductSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },

    productName: {
      type: String,
      required: [true, "Product name is required"],
      trim: true,
    },

    itemCode: {
      type: String,
      trim: true,
    },

    barCode: {
      type: String,
      required: [true, "Barcode is required"],
      trim: true,
    },

    unit: {
      type: Number,
      required: [true, "Unit is required"],
      trim: true,
    },

    hsnCode: {
      type: String,
      trim: true,
    },

    salesTax: {
      type: String,
      required: [true, "Sale tax is required"],
      trim: true,
    },

    shortDescription: {
      type: String,
      trim: true,
    },

    b2bSalePrice: {
      type: Number,
      required: [true, "B2B Sale Price is required"],
    },

    b2cSalePrice: {
      type: Number,
      required: [true, "B2C Sale Price is required"],
    },

    purchasePrice: {
      type: Number,
      required: [true, "Purchase Price is required"],
    },
  },
  { timestamps: true }
);

export default mongoose.models.Product ||
  mongoose.model("Product", ProductSchema);
