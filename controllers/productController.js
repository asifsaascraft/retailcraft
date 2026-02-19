import mongoose from "mongoose";
import Product from "../models/Product.js";
import Inventory from "../models/Inventory.js";

/* ======================================================
   Helper: Format Mongoose Errors
====================================================== */
const handleValidationError = (error, res) => {
  if (error.name === "ValidationError") {
    const messages = Object.values(error.errors).map(
      (val) => val.message
    );

    return res.status(400).json({
      success: false,
      errors: messages,
    });
  }

  if (error.code === 11000) {
    return res.status(400).json({
      success: false,
      message: "Barcode already exists in this branch",
    });
  }

  return res.status(500).json({
    success: false,
    message: "Something went wrong",
  });
};

/* ======================================================
   Create Product
====================================================== */
export const createProduct = async (req, res) => {
  try {
    const userId = req.user._id;
    const branchId = req.user.branchId;

    const { sizes } = req.body;

    if (!sizes || sizes.length === 0) {
      return res.status(400).json({
        success: false,
        message: "At least one size is required",
      });
    }

    const product = await Product.create({
      ...req.body,
      userId,
      branchId,
    });

    for (let size of sizes) {
      await Inventory.create({
        branchId,
        productId: product._id,
        size,
        quantity: 0,
      });
    }

    res.status(201).json({
      success: true,
      message: "Product created successfully",
      data: product,
    });

  } catch (error) {
    handleValidationError(error, res);
  }
};

/* ======================================================
   Get All Products (by Branch)
====================================================== */
export const getProducts = async (req, res) => {
  try {
    const branchId = req.user.branchId;

    const products = await Product.find({ branchId }).sort({
      createdAt: -1,
    });

    res.json({
      success: true,
      count: products.length,
      data: products,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Failed to fetch products",
    });
  }
};


/* ======================================================
   Get Single Product
====================================================== */
export const getProductById = async (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.user._id;

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({
        success: false,
        message: "Invalid product ID",
      });
    }

    const product = await Product.findOne({ _id: id, userId });

    if (!product) {
      return res.status(404).json({
        success: false,
        message: "Product not found",
      });
    }

    res.json({
      success: true,
      data: product,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Failed to fetch product",
    });
  }
};

/* ======================================================
   Update Product
====================================================== */
export const updateProduct = async (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.user._id;

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({
        success: false,
        message: "Invalid product ID",
      });
    }

    const product = await Product.findOne({ _id: id, userId });

    if (!product) {
      return res.status(404).json({
        success: false,
        message: "Product not found",
      });
    }

    Object.assign(product, req.body);

    await product.save();

    res.json({
      success: true,
      message: "Product updated successfully",
      data: product,
    });
  } catch (error) {
    handleValidationError(error, res);
  }
};

/* ======================================================
   Delete Product
====================================================== */
export const deleteProduct = async (req, res) => {
  try {
    const { id } = req.params;
    const branchId = req.user.branchId;

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({
        success: false,
        message: "Invalid product ID",
      });
    }

    const product = await Product.findOne({ _id: id, branchId });

    if (!product) {
      return res.status(404).json({
        success: false,
        message: "Product not found",
      });
    }

    //  Delete related inventory
    await Inventory.deleteMany({
      branchId,
      productId: product._id,
    });

    await product.deleteOne();

    res.json({
      success: true,
      message: "Product deleted successfully",
    });

  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Failed to delete product",
    });
  }
};