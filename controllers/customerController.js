import mongoose from "mongoose";
import Customer from "../models/Customer.js";

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
   Create Customer
====================================================== */
export const createCustomer = async (req, res) => {
  try {
    const userId = req.user._id;

    const customer = await Customer.create({
      ...req.body,
      userId,
    });

    res.status(201).json({
      success: true,
      message: "Customer created successfully",
      data: customer,
    });
  } catch (error) {
    handleValidationError(error, res);
  }
};

/* ======================================================
   Get All Customers
====================================================== */
export const getCustomers = async (req, res) => {
  try {
    const userId = req.user._id;

    const customers = await Customer.find({ userId }).sort({
      createdAt: -1,
    });

    res.json({
      success: true,
      count: customers.length,
      data: customers,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Failed to fetch customers",
    });
  }
};

/* ======================================================
   Get Single Customer
====================================================== */
export const getCustomerById = async (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.user._id;

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({
        success: false,
        message: "Invalid customer ID",
      });
    }

    const customer = await Customer.findOne({ _id: id, userId });

    if (!customer) {
      return res.status(404).json({
        success: false,
        message: "Customer not found",
      });
    }

    res.json({
      success: true,
      data: customer,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Failed to fetch customer",
    });
  }
};

/* ======================================================
   Update Customer
====================================================== */
export const updateCustomer = async (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.user._id;

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({
        success: false,
        message: "Invalid customer ID",
      });
    }

    const customer = await Customer.findOne({ _id: id, userId });

    if (!customer) {
      return res.status(404).json({
        success: false,
        message: "Customer not found",
      });
    }

    Object.assign(customer, req.body);

    await customer.save();

    res.json({
      success: true,
      message: "Customer updated successfully",
      data: customer,
    });
  } catch (error) {
    handleValidationError(error, res);
  }
};

/* ======================================================
   Delete Customer
====================================================== */
export const deleteCustomer = async (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.user._id;

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({
        success: false,
        message: "Invalid customer ID",
      });
    }

    const customer = await Customer.findOne({ _id: id, userId });

    if (!customer) {
      return res.status(404).json({
        success: false,
        message: "Customer not found",
      });
    }

    await customer.deleteOne();

    res.json({
      success: true,
      message: "Customer deleted successfully",
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Failed to delete customer",
    });
  }
};
