import mongoose from "mongoose";
import Inventory from "../models/Inventory.js";
import Product from "../models/Product.js";

/* ======================================================
   Add Stock
====================================================== */
export const addStock = async (req, res) => {

  try {

    const { productId, quantity } = req.body;
    const branchId = req.user.branchId;

    if (!mongoose.Types.ObjectId.isValid(productId))
      return res.status(400).json({
        success: false,
        message: "Invalid product ID",
      });

    if (!quantity || quantity <= 0)
      return res.status(400).json({
        success: false,
        message: "Quantity must be greater than 0",
      });

    const product = await Product.findOne({
      _id: productId,
      branchId,
      status: "Active",
    });

    if (!product)
      return res.status(404).json({
        success: false,
        message: "Product not found",
      });

    const inventory = await Inventory.findOne({
      branchId,
      productId,
      size: product.size,
    });

    if (!inventory)
      return res.status(404).json({
        success: false,
        message: "Inventory not found",
      });

    inventory.quantity += quantity;

    await inventory.save();

    res.json({
      success: true,
      message: "Stock added successfully",
      data: inventory,
    });

  } catch (error) {

    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};


/* ======================================================
   Reduce Stock
====================================================== */
export const reduceStock = async (req, res) => {

  try {

    const { productId, quantity } = req.body;
    const branchId = req.user.branchId;

    if (!mongoose.Types.ObjectId.isValid(productId))
      return res.status(400).json({
        success: false,
        message: "Invalid product ID",
      });

    if (!quantity || quantity <= 0)
      return res.status(400).json({
        success: false,
        message: "Quantity must be greater than 0",
      });

    const product = await Product.findOne({
      _id: productId,
      branchId,
      status: "Active",
    });

    if (!product)
      return res.status(404).json({
        success: false,
        message: "Product not found",
      });

    const inventory = await Inventory.findOne({
      branchId,
      productId,
      size: product.size,
    });

    if (!inventory)
      return res.status(404).json({
        success: false,
        message: "Inventory not found",
      });

    if (inventory.quantity < quantity)
      return res.status(400).json({
        success: false,
        message: "Insufficient stock",
      });

    inventory.quantity -= quantity;

    await inventory.save();

    res.json({
      success: true,
      message: "Stock reduced successfully",
      data: inventory,
    });

  } catch (error) {

    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};


/* ======================================================
   Get All Inventory
====================================================== */
export const getAllInventory = async (req, res) => {

  try {

    const branchId = req.user.branchId;

    const inventory = await Inventory.find({ branchId })
      .populate("productId", "productName barCode size");

    const formatted = inventory
      .filter(i => i.productId)
      .map(i => ({

        productId: i.productId._id,
        productName: i.productId.productName,
        barCode: i.productId.barCode,
        size: i.productId.size,
        quantity: i.quantity,
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
   Get Inventory By Product
====================================================== */
export const getInventoryByProduct = async (req, res) => {

  try {

    const { productId } = req.params;
    const branchId = req.user.branchId;

    if (!mongoose.Types.ObjectId.isValid(productId))
      return res.status(400).json({
        success: false,
        message: "Invalid product ID",
      });

    const product = await Product.findOne({
      _id: productId,
      branchId,
    }).select("productName barCode size");

    if (!product)
      return res.status(404).json({
        success: false,
        message: "Product not found",
      });

    const inventory = await Inventory.findOne({
      branchId,
      productId,
      size: product.size,
    }).select("size quantity -_id");

    res.json({
      success: true,
      product,
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
   Low Stock
====================================================== */
export const getLowStock = async (req, res) => {

  try {

    const branchId = req.user.branchId;

    const inventory = await Inventory.find({
      branchId,
      quantity: { $lte: 5 },
    }).populate("productId", "productName barCode size");

    const formatted = inventory
      .filter(i => i.productId)
      .map(i => ({
        productId: i.productId._id,
        productName: i.productId.productName,
        barCode: i.productId.barCode,
        size: i.productId.size,
        quantity: i.quantity,
      }));


    res.json({
      success: true,
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
   Stock Summary
====================================================== */
export const getStockSummary = async (req, res) => {

  try {

    const branchId = req.user.branchId;

    const totalProducts = await Product.countDocuments({
      branchId,
    });

    const totalStock = await Inventory.aggregate([
      { $match: { branchId } },
      {
        $group: {
          _id: null,
          total: { $sum: "$quantity" },
        },
      },
    ]);

    res.json({
      success: true,
      totalProducts,
      totalStock: totalStock[0]?.total || 0,
    });

  } catch (error) {

    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};
