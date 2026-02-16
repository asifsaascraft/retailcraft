import mongoose from "mongoose";
import Branch from "../models/Branch.js";

/* ======================================================
   Create Branch
   ====================================================== */
export const createBranch = async (req, res) => {
  try {
    const {
      branchName,
      address,
      country,
      state,
      city,
      pincode,
      timeZone,
      branchCode,
      branchGstNumber,
    } = req.body;

    //  Required validation
    if (
      !branchName ||
      !address ||
      !country ||
      !state ||
      !city ||
      !pincode ||
      !timeZone ||
      !branchCode ||
      !branchGstNumber
    ) {
      return res.status(400).json({
        success: false,
        message: "All fields are required",
      });
    }

    //  Duplicate branch code
    const codeExists = await Branch.findOne({ branchCode });
    if (codeExists) {
      return res.status(409).json({
        success: false,
        message: "Branch code already exists",
      });
    }

    //  Duplicate GST
    const gstExists = await Branch.findOne({ branchGstNumber });
    if (gstExists) {
      return res.status(409).json({
        success: false,
        message: "Branch GST number already exists",
      });
    }

    const branch = await Branch.create({
      branchName,
      address,
      country,
      state,
      city,
      pincode,
      timeZone,
      branchCode,
      branchGstNumber,
    });

    res.status(201).json({
      success: true,
      message: "Branch created successfully",
      data: branch,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

/* ======================================================
   Get All Branches
   ====================================================== */
export const getBranches = async (req, res) => {
  try {
    const branches = await Branch.find().sort({ createdAt: -1 });

    res.json({
      success: true,
      count: branches.length,
      data: branches,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

/* ======================================================
   Get Single Branch
   ====================================================== */
export const getBranchById = async (req, res) => {
  try {
    const { id } = req.params;

    //  Validate Mongo ID
    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({
        success: false,
        message: "Invalid branch ID",
      });
    }

    const branch = await Branch.findById(id);

    if (!branch) {
      return res.status(404).json({
        success: false,
        message: "Branch not found",
      });
    }

    res.json({
      success: true,
      data: branch,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

/* ======================================================
   Update Branch
   ====================================================== */
export const updateBranch = async (req, res) => {
  try {
    const { id } = req.params;

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({
        success: false,
        message: "Invalid branch ID",
      });
    }

    const branch = await Branch.findById(id);

    if (!branch) {
      return res.status(404).json({
        success: false,
        message: "Branch not found",
      });
    }

    if (Object.keys(req.body).length === 0) {
      return res.status(400).json({
        success: false,
        message: "No data provided for update",
      });
    }

    //  If branchCode updating → check duplicate
    if (req.body.branchCode && req.body.branchCode !== branch.branchCode) {
      const exists = await Branch.findOne({ branchCode: req.body.branchCode });
      if (exists) {
        return res.status(409).json({
          success: false,
          message: "Branch code already exists",
        });
      }
    }

    //  If GST updating → check duplicate
    if (
      req.body.branchGstNumber &&
      req.body.branchGstNumber !== branch.branchGstNumber
    ) {
      const exists = await Branch.findOne({
        branchGstNumber: req.body.branchGstNumber,
      });
      if (exists) {
        return res.status(409).json({
          success: false,
          message: "Branch GST number already exists",
        });
      }
    }

    Object.assign(branch, req.body);

    await branch.save();

    res.json({
      success: true,
      message: "Branch updated successfully",
      data: branch,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

/* ======================================================
   Delete Branch
   ====================================================== */
export const deleteBranch = async (req, res) => {
  try {
    const { id } = req.params;

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({
        success: false,
        message: "Invalid branch ID",
      });
    }

    const branch = await Branch.findById(id);

    if (!branch) {
      return res.status(404).json({
        success: false,
        message: "Branch not found",
      });
    }

    await branch.deleteOne();

    res.json({
      success: true,
      message: "Branch deleted successfully",
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};
