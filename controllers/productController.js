import mongoose from "mongoose";
import Product from "../models/Product.js";
import { Parser } from "json2csv";

/* ======================================================
   Helper: Format Errors
====================================================== */
const handleValidationError = (error, res) => {
  if (error.name === "ValidationError") {
    const messages = Object.values(error.errors).map((val) => val.message);

    return res.status(400).json({
      success: false,
      errors: messages,
    });
  }

  if (error.code === 11000) {
    return res.status(400).json({
      success: false,
      message: "Duplicate value detected",
    });
  }

  return res.status(500).json({
    success: false,
    message: error.message,
  });
};

/* ======================================================
   Create Product 
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
      purchaseTax,
      shortDescription,
      b2bSalePrice,
      b2cSalePrice,
      purchasePrice,
    } = req.body;

    /* =============================
       REQUIRED FIELD VALIDATION
    ============================== */

    if (!productName)
      return res.status(400).json({
        success: false,
        message: "Product name is required",
      });

    if (!itemCode)
      return res.status(400).json({
        success: false,
        message: "Item code is required",
      });

    if (!hsnCode)
      return res.status(400).json({
        success: false,
        message: "HSN code is required",
      });

    if (!barCode)
      return res.status(400).json({
        success: false,
        message: "Barcode is required",
      });

    if (!/^\d+$/.test(barCode))
      return res.status(400).json({
        success: false,
        message: "Barcode must contain only numbers",
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

    /* =============================
       SALES TAX VALIDATION
    ============================== */

    if (salesTax == null || salesTax === "")
      return res.status(400).json({
        success: false,
        message: "Sales tax is required",
      });

    const finalSalesTax = Number(salesTax);

    if (isNaN(finalSalesTax) || finalSalesTax < 0)
      return res.status(400).json({
        success: false,
        message: "Sales tax must be a valid number ≥ 0",
      });

    /* =============================
   PURCHASE TAX VALIDATION
============================== */

    if (purchaseTax == null || purchaseTax === "")
      return res.status(400).json({
        success: false,
        message: "Purchase tax is required",
      });

    const finalPurchaseTax = Number(purchaseTax);

    if (isNaN(finalPurchaseTax) || finalPurchaseTax < 0)
      return res.status(400).json({
        success: false,
        message: "Purchase tax must be a valid number ≥ 0",
      });

    /* =============================
       PRICE VALIDATION 
    ============================== */

    const finalB2BSalePrice = Number(b2bSalePrice);
    const finalB2CSalePrice = Number(b2cSalePrice);
    const finalPurchasePrice = Number(purchasePrice);

    if (isNaN(finalB2BSalePrice) || finalB2BSalePrice < 0)
      return res.status(400).json({
        success: false,
        message: "Valid B2B sale price is required",
      });

    if (isNaN(finalB2CSalePrice) || finalB2CSalePrice < 0)
      return res.status(400).json({
        success: false,
        message: "Valid B2C sale price is required",
      });

    if (isNaN(finalPurchasePrice) || finalPurchasePrice < 0)
      return res.status(400).json({
        success: false,
        message: "Valid purchase price is required",
      });

    /* =============================
       QUANTITY VALIDATION
    ============================== */

    let finalQuantity = 0;

    if (quantity != null) {
      const qty = Number(quantity);

      if (isNaN(qty) || qty < 0)
        return res.status(400).json({
          success: false,
          message: "Quantity must be a number ≥ 0",
        });

      finalQuantity = qty;
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
      salesTax: finalSalesTax,
      purchaseTax: finalPurchaseTax,
      shortDescription,

      b2bSalePrice: finalB2BSalePrice,
      b2cSalePrice: finalB2CSalePrice,
      purchasePrice: finalPurchasePrice,
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

    if (!status) filter.status = "Active";

    if (status && status !== "All") {
      if (!["Active", "Inactive"].includes(status))
        return res.status(400).json({
          success: false,
          message: "Invalid status filter",
        });

      filter.status = status;
    }

    const products = await Product.find(filter).sort({ createdAt: -1 });

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

    const product = await Product.findOne({
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

    const product = await Product.findOne({
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

    /* =============================
   EMPTY FIELD VALIDATION
============================= */

    if (req.body.itemCode === "")
      return res.status(400).json({
        success: false,
        message: "Item code cannot be empty",
      });

    if (req.body.hsnCode === "")
      return res.status(400).json({
        success: false,
        message: "HSN code cannot be empty",
      });

    if (req.body.barCode && !/^\d+$/.test(req.body.barCode))
      return res.status(400).json({
        success: false,
        message: "Barcode must contain only numbers",
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

    const product = await Product.findOne({
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
   ADD STOCK 
====================================================== */
export const addStock = async (req, res) => {
  try {
    const { productId, quantity } = req.body;
    const branchId = req.user.branchId;

    const qty = Number(quantity);

    if (!mongoose.Types.ObjectId.isValid(productId))
      return res.status(400).json({
        success: false,
        message: "Invalid product ID",
      });

    if (isNaN(qty) || qty <= 0)
      return res.status(400).json({
        success: false,
        message: "Quantity must be greater than 0",
      });

    const product = await Product.findOne({
      _id: productId,
      branchId,
    });

    if (!product)
      return res.status(404).json({
        success: false,
        message: "Product not found",
      });

    product.quantity += qty;

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

    const qty = Number(quantity);

    if (!mongoose.Types.ObjectId.isValid(productId))
      return res.status(400).json({
        success: false,
        message: "Invalid product ID",
      });

    if (isNaN(qty) || qty <= 0)
      return res.status(400).json({
        success: false,
        message: "Quantity must be greater than 0",
      });

    const product = await Product.findOne({
      _id: productId,
      branchId,
    });

    if (!product)
      return res.status(404).json({
        success: false,
        message: "Product not found",
      });

    if (product.quantity < qty)
      return res.status(400).json({
        success: false,
        message: "Insufficient stock",
      });

    product.quantity -= qty;

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

  const products = await Product.find({
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

  const totalProducts = await Product.countDocuments({ branchId });

  const stock = await Product.aggregate([
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

/* ======================================================
   SEARCH PRODUCTS (name + barcode + itemCode)
====================================================== */
export const searchProducts = async (req, res) => {
  try {
    const branchId = req.user.branchId;
    const { search } = req.query;

    if (!search) {
      return res.status(400).json({
        success: false,
        message: "Search query is required",
      });
    }

    const products = await Product.find({
      branchId,
      status: "Active",
      $or: [
        { productName: { $regex: search, $options: "i" } },
        { barCode: { $regex: search, $options: "i" } },
        { itemCode: { $regex: search, $options: "i" } },
      ],
    }).sort({ createdAt: -1 });

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
   EXPORT PRODUCTS CSV
====================================================== */
export const exportProductsCSV = async (req, res) => {
  try {
    const branchId = req.user.branchId;

    const products = await Product.find({ branchId })
      .sort({ createdAt: -1 });

    if (!products.length) {
      return res.status(404).json({
        success: false,
        message: "No products found",
      });
    }

    const data = products.map((product) => ({
      productName: product.productName,
      itemCode: product.itemCode,
      barCode: product.barCode,
      color: product.color,
      size: product.size,
      quantity: product.quantity,
      hsnCode: product.hsnCode,
      salesTax: product.salesTax,
      purchaseTax: product.purchaseTax,
      b2bSalePrice: product.b2bSalePrice,
      b2cSalePrice: product.b2cSalePrice,
      purchasePrice: product.purchasePrice,
      status: product.status,
      createdAt: new Date(product.createdAt).toLocaleString(),
    }));

    const fields = [
      { label: "Product Name", value: "productName" },
      { label: "Item Code", value: "itemCode" },
      { label: "Barcode", value: "barCode" },
      { label: "Color", value: "color" },
      { label: "Size", value: "size" },
      { label: "Quantity", value: "quantity" },
      { label: "HSN Code", value: "hsnCode" },
      { label: "Sales Tax (%)", value: "salesTax" },
      { label: "Purchase Tax (%)", value: "purchaseTax" },
      { label: "B2B Sale Price", value: "b2bSalePrice" },
      { label: "B2C Sale Price", value: "b2cSalePrice" },
      { label: "Purchase Price", value: "purchasePrice" },
      { label: "Status", value: "status" },
      { label: "Created At", value: "createdAt" },
    ];

    const parser = new Parser({ fields });
    const csv = parser.parse(data);

    res.header("Content-Type", "text/csv");
    res.attachment("products.csv");

    return res.status(200).send(csv);

  } catch (error) {
    return res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};
