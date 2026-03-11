import mongoose from "mongoose";
import Supplier from "../models/Supplier.js";

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

  return res.status(500).json({
    success: false,
    message: "Something went wrong",
  });
};


/* ======================================================
   Create Supplier
====================================================== */
export const createSupplier = async (req, res) => {
  try {

    const userId = req.user._id;

    const supplier = await Supplier.create({
      ...req.body,
      userId,
    });

    res.status(201).json({
      success: true,
      message: "Supplier created successfully",
      data: supplier,
    });

  } catch (error) {
    handleValidationError(error, res);
  }
};


/* ======================================================
   Get All Suppliers
====================================================== */
export const getSuppliers = async (req, res) => {
  try {

    const userId = req.user._id;

    const suppliers = await Supplier.find({ userId })
      .sort({ createdAt: -1 });

    res.json({
      success: true,
      count: suppliers.length,
      data: suppliers,
    });

  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Failed to fetch suppliers",
    });
  }
};


/* ======================================================
   Get Single Supplier
====================================================== */
export const getSupplierById = async (req, res) => {
  try {

    const { id } = req.params;
    const userId = req.user._id;

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({
        success: false,
        message: "Invalid supplier ID",
      });
    }

    const supplier = await Supplier.findOne({
      _id: id,
      userId,
    });

    if (!supplier) {
      return res.status(404).json({
        success: false,
        message: "Supplier not found",
      });
    }

    res.json({
      success: true,
      data: supplier,
    });

  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Failed to fetch supplier",
    });
  }
};


/* ======================================================
   Update Supplier
====================================================== */
export const updateSupplier = async (req, res) => {
  try {

    const { id } = req.params;
    const userId = req.user._id;

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({
        success: false,
        message: "Invalid supplier ID",
      });
    }

    const supplier = await Supplier.findOne({
      _id: id,
      userId,
    });

    if (!supplier) {
      return res.status(404).json({
        success: false,
        message: "Supplier not found",
      });
    }

    Object.assign(supplier, req.body);

    await supplier.save();

    res.json({
      success: true,
      message: "Supplier updated successfully",
      data: supplier,
    });

  } catch (error) {
    handleValidationError(error, res);
  }
};


/* ======================================================
   Delete Supplier
====================================================== */
export const deleteSupplier = async (req, res) => {
  try {

    const { id } = req.params;
    const userId = req.user._id;

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({
        success: false,
        message: "Invalid supplier ID",
      });
    }

    const supplier = await Supplier.findOne({
      _id: id,
      userId,
    });

    if (!supplier) {
      return res.status(404).json({
        success: false,
        message: "Supplier not found",
      });
    }

    await supplier.deleteOne();

    res.json({
      success: true,
      message: "Supplier deleted successfully",
    });

  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Failed to delete supplier",
    });
  }
};