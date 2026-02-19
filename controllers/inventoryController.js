import Inventory from "../models/Inventory.js";

const allowedSizes = ["S", "M", "L", "XL", "XXL"];

/* ======================================================
   Add Stock
====================================================== */
export const addStock = async (req, res) => {
  try {
    const { productId, size, quantity } = req.body;
    const branchId = req.user.branchId;

    if (!allowedSizes.includes(size)) {
      return res.status(400).json({
        success: false,
        message: "Invalid size",
      });
    }

    if (!quantity || quantity <= 0) {
      return res.status(400).json({
        success: false,
        message: "Quantity must be greater than 0",
      });
    }

    const inventory = await Inventory.findOne({
      branchId,
      productId,
      size,
    });

    if (!inventory) {
      return res.status(404).json({
        success: false,
        message: "Inventory not found",
      });
    }

    inventory.quantity += quantity;
    await inventory.save();

    res.json({
      success: true,
      message: "Stock added successfully",
      data: inventory,
    });

  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

/* ======================================================
   Reduce Stock
====================================================== */
export const reduceStock = async (req, res) => {
  try {
    const { productId, size, quantity } = req.body;
    const branchId = req.user.branchId;

    if (!allowedSizes.includes(size)) {
      return res.status(400).json({
        success: false,
        message: "Invalid size",
      });
    }

    if (!quantity || quantity <= 0) {
      return res.status(400).json({
        success: false,
        message: "Quantity must be greater than 0",
      });
    }

    const inventory = await Inventory.findOne({
      branchId,
      productId,
      size,
    });

    if (!inventory || inventory.quantity < quantity) {
      return res.status(400).json({
        success: false,
        message: "Insufficient stock",
      });
    }

    inventory.quantity -= quantity;
    await inventory.save();

    res.json({
      success: true,
      message: "Stock reduced successfully",
      data: inventory,
    });

  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};
