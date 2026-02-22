import mongoose from "mongoose";
import Product from "../models/Product.js";


/* ======================================================
   Helper: Format Errors (UNCHANGED)
====================================================== */
const handleValidationError = (error, res) => {

  if (error.name === "ValidationError") {

    const messages =
      Object.values(error.errors).map(val => val.message);

    return res.status(400).json({
      success: false,
      errors: messages,
    });
  }

  if (error.code === 11000) {

    return res.status(400).json({
      success: false,
      message:
        "Product already exists with same barcode",
    });
  }

  return res.status(500).json({
    success: false,
    message: error.message,
  });
};



/* ======================================================
   Create Product (same logic, quantity auto)
====================================================== */
export const createProduct = async (req, res) => {
  try {

    const userId = req.user._id;
    const branchId = req.user.branchId;

    const {
      productName,
      itemCode,
      barCode,
      color,
      size,
      quantity,
      hsnCode,
      salesTax,
      shortDescription,
      b2bSalePrice,
      b2cSalePrice,
      purchasePrice,
      status
    } = req.body;

    /* =============================
       REQUIRED FIELD VALIDATION
    ============================== */

    if (!productName)
      return res.status(400).json({
        success: false,
        message: "Product name is required",
      });

    if (!barCode)
      return res.status(400).json({
        success: false,
        message: "Barcode is required",
      });

    if (!color)
      return res.status(400).json({
        success: false,
        message: "Color is required",
      });

    if (!size)
      return res.status(400).json({
        success: false,
        message: "Size is required",
      });

    const validSizes = ["S", "M", "L", "XL", "XXL"];

    if (!validSizes.includes(size))
      return res.status(400).json({
        success: false,
        message: "Invalid size value",
      });

    if (!salesTax)
      return res.status(400).json({
        success: false,
        message: "Sales tax is required",
      });

    if (b2bSalePrice == null || b2bSalePrice < 0)
      return res.status(400).json({
        success: false,
        message: "Valid B2B sale price is required",
      });

    if (b2cSalePrice == null || b2cSalePrice < 0)
      return res.status(400).json({
        success: false,
        message: "Valid B2C sale price is required",
      });

    if (purchasePrice == null || purchasePrice < 0)
      return res.status(400).json({
        success: false,
        message: "Valid purchase price is required",
      });

    /* =============================
       QUANTITY VALIDATION
    ============================== */

    let finalQuantity = 0;

    if (quantity != null) {

      if (isNaN(quantity) || quantity < 0)
        return res.status(400).json({
          success: false,
          message: "Quantity must be a number ≥ 0",
        });

      finalQuantity = Number(quantity);
    }

    /* =============================
       CREATE PRODUCT
    ============================== */

    const product = await Product.create({

      userId,
      branchId,

      productName,
      itemCode,
      barCode,
      color,
      size,

      quantity: finalQuantity,

      hsnCode,
      salesTax,
      shortDescription,

      b2bSalePrice,
      b2cSalePrice,
      purchasePrice,

    });

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
   Get Products
====================================================== */
export const getAllProductsWithStatus = async (req, res) => {

  try {

    const branchId = req.user.branchId;
    const { status } = req.query;

    let filter = { branchId };

    if (!status)
      filter.status = "Active";

    if (status && status !== "All") {

      if (!["Active", "Inactive"].includes(status))
        return res.status(400).json({
          success: false,
          message: "Invalid status filter",
        });

      filter.status = status;
    }

    const products =
      await Product.find(filter)
        .sort({ createdAt: -1 });

    res.json({

      success: true,
      count: products.length,
      data: products,

    });

  } catch (error) {

    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};



/* ======================================================
   Get Product By Id
====================================================== */
export const getProductById = async (req, res) => {

  try {

    const { id } = req.params;
    const branchId = req.user.branchId;

    if (!mongoose.Types.ObjectId.isValid(id))
      return res.status(400).json({
        success: false,
        message: "Invalid product ID",
      });

    const product =
      await Product.findOne({
        _id: id,
        branchId,
      });

    if (!product)
      return res.status(404).json({
        success: false,
        message: "Product not found",
      });

    res.json({
      success: true,
      data: product,
    });

  } catch (error) {

    res.status(500).json({
      success: false,
      message: error.message,
    });

  }
};



/* ======================================================
   Update Product
====================================================== */
export const updateProduct = async (req, res) => {

  try {

    const { id } = req.params;
    const branchId = req.user.branchId;

    if (!mongoose.Types.ObjectId.isValid(id))
      return res.status(400).json({
        success: false,
        message: "Invalid product ID",
      });

    const product =
      await Product.findOne({
        _id: id,
        branchId,
      });

    if (!product)
      return res.status(404).json({
        success: false,
        message: "Product not found",
      });

    delete req.body.branchId;
    delete req.body.userId;
    delete req.body.quantity;
    delete req.body.status;

    if (
      req.body.status &&
      !["Active", "Inactive"].includes(req.body.status)
    )
      return res.status(400).json({
        success: false,
        message: "Invalid status",
      });

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

    if (!mongoose.Types.ObjectId.isValid(id))
      return res.status(400).json({
        success: false,
        message: "Invalid product ID",
      });

    const product =
      await Product.findOne({
        _id: id,
        branchId,
      });

    if (!product)
      return res.status(404).json({
        success: false,
        message: "Product not found",
      });

    await product.deleteOne();

    res.json({
      success: true,
      message: "Product deleted successfully",
    });

  } catch (error) {

    res.status(500).json({
      success: false,
      message: error.message,
    });

  }
};



/* ======================================================
   ADD STOCK (replaces inventory add)
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

    const product =
      await Product.findOne({
        _id: productId,
        branchId,
      });

    if (!product)
      return res.status(404).json({
        success: false,
        message: "Product not found",
      });

    product.quantity += quantity;

    await product.save();

    res.json({
      success: true,
      message: "Stock added successfully",
      data: product,
    });

  } catch (error) {

    res.status(500).json({
      success: false,
      message: error.message,
    });

  }
};



/* ======================================================
   REDUCE STOCK
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

    const product =
      await Product.findOne({
        _id: productId,
        branchId,
      });

    if (!product)
      return res.status(404).json({
        success: false,
        message: "Product not found",
      });

    if (product.quantity < quantity)
      return res.status(400).json({
        success: false,
        message: "Insufficient stock",
      });

    product.quantity -= quantity;

    await product.save();

    res.json({
      success: true,
      message: "Stock reduced successfully",
      data: product,
    });

  } catch (error) {

    res.status(500).json({
      success: false,
      message: error.message,
    });

  }
};



/* ======================================================
   LOW STOCK
====================================================== */
export const getLowStock = async (req, res) => {

  const branchId = req.user.branchId;

  const products =
    await Product.find({
      branchId,
      quantity: { $lte: 5 },
    });

  res.json({
    success: true,
    data: products,
  });

};



/* ======================================================
   STOCK SUMMARY
====================================================== */
export const getStockSummary = async (req, res) => {

  const branchId = req.user.branchId;

  const totalProducts =
    await Product.countDocuments({ branchId });

  const stock =
    await Product.aggregate([
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
    totalStock: stock[0]?.totalStock || 0,
  });

};
