import mongoose from "mongoose";
import Inventory from "../models/Inventory.js";
import Product from "../models/Product.js";

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

/* ======================================================
   Get Inventory By Product (with product details)
====================================================== */
export const getInventoryByProduct = async (req, res) => {
  try {
    const { productId } = req.params;
    const branchId = req.user.branchId;

    if (!mongoose.Types.ObjectId.isValid(productId)) {
      return res.status(400).json({
        success: false,
        message: "Invalid product ID",
      });
    }

    //  Check product exists in this branch
    const product = await Product.findOne({
      _id: productId,
      branchId,
    }).select("productName barCode");

    if (!product) {
      return res.status(404).json({
        success: false,
        message: "Product not found",
      });
    }

    //  Get inventory
    const inventory = await Inventory.find({
      branchId,
      productId,
    }).select("size quantity -_id");

    res.json({
      success: true,
      product: {
        id: product._id,
        productName: product.productName,
        barCode: product.barCode,
      },
      inventory,
    });

  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

/* ======================================================
   Get All Inventory (Branch)
====================================================== */
export const getAllInventory = async (req, res) => {
  try {
    const branchId = req.user.branchId;

    const inventory = await Inventory.find({ branchId })
      .populate("productId", "productName barCode")
      .select("productId size quantity");

    const formatted = inventory.map(item => ({
      productId: item.productId._id,
      productName: item.productId.productName,
      barCode: item.productId.barCode,
      size: item.size,
      quantity: item.quantity,
    }));

    res.json({
      success: true,
      count: formatted.length,
      data: formatted,
    });

  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

/* ======================================================
   Get All Low Stocks (Branch)
====================================================== */
export const getLowStock = async (req, res) => {
  try {
    const branchId = req.user.branchId;

    const inventory = await Inventory.find({
      branchId,
      quantity: { $lte: 5 },
    }).populate("productId", "productName barCode");

    res.json({
      success: true,
      data: inventory,
    });

  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

/* ======================================================
   Get All Product & Stocks (Branch)
====================================================== */
export const getStockSummary = async (req, res) => {
  try {
    const branchId = req.user.branchId;

    const totalProducts = await Product.countDocuments({ branchId });

    const result = await Inventory.aggregate([
      { $match: { branchId } },
      {
        $group: {
          _id: null,
          totalStock: { $sum: "$quantity" },
        },
      },
    ]);

    res.json({
      success: true,
      totalProducts,
      totalStock: result[0]?.totalStock || 0,
    });

  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};
