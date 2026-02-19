import mongoose from "mongoose";

const InventorySchema = new mongoose.Schema(
  {
    branchId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Branch",
      required: true,
    },

    productId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Product",
      required: true,
    },

    size: {
      type: String,
      enum: ["S", "M", "L", "XL", "XXL"],
      required: true,
    },

    quantity: {
      type: Number,
      default: 0,
    },
  },
  { timestamps: true }
);

// One size only once per product per branch
InventorySchema.index(
  { branchId: 1, productId: 1, size: 1 },
  { unique: true }
);

export default mongoose.models.Inventory ||
  mongoose.model("Inventory", InventorySchema);
