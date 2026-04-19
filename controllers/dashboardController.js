import Billing from "../models/Billing.js";
import PurchaseInvoice from "../models/PurchaseInvoice.js";
import Product from "../models/Product.js";
import Customer from "../models/Customer.js";
import Supplier from "../models/Supplier.js";

export const getDashboardSummary = async (req, res) => {
  try {
    const branchId = req.user.branchId;

    /* =========================
       SALES OVERVIEW
    ========================= */

    const salesAgg = await Billing.aggregate([
      { $match: { branchId, status: "Completed" } },
      {
        $group: {
          _id: null,
          totalSales: { $sum: "$finalTotal" },
          totalInvoices: { $sum: 1 },
        },
      },
    ]);

    const soldQtyAgg = await Billing.aggregate([
      { $match: { branchId } },
      { $unwind: "$items" },
      {
        $group: {
          _id: null,
          soldQty: { $sum: "$items.quantity" },
        },
      },
    ]);

    const totalCustomers = await Customer.countDocuments({ branchId });

    /* =========================
       RECEIVABLE (TABLE + TOTAL)
    ========================= */

    const receivableList = await Billing.find({
      branchId,
      status: "Completed",
    })
      .populate("customerId", "name")
      .sort({ createdAt: -1 });

    let totalReceivable = 0;
    let totalReceivablePending = 0;

    const receivableData = receivableList.map((bill) => {
      const pending =
        bill.paymentStatus === "Pending" ? bill.finalTotal : 0;

      totalReceivable += bill.finalTotal;
      totalReceivablePending += pending;

      return {
        customer: bill.customerId?.name,
        invoiceNo: bill.invoiceNumber,
        invoiceDate: bill.createdAt,
        dueDate: bill.createdAt, // you can customize later
        amount: bill.finalTotal,
        paid: bill.paymentStatus === "Paid" ? bill.finalTotal : 0,
        pending,
        status: bill.paymentStatus,
      };
    });

    /* =========================
       PURCHASE OVERVIEW
    ========================= */

    const purchaseAgg = await PurchaseInvoice.aggregate([
      { $match: { branchId, status: "Completed" } },
      {
        $group: {
          _id: null,
          totalPurchase: { $sum: "$finalTotal" },
          totalBills: { $sum: 1 },
        },
      },
    ]);

    const purchaseQtyAgg = await PurchaseInvoice.aggregate([
      { $match: { branchId } },
      { $unwind: "$items" },
      {
        $group: {
          _id: null,
          purchaseQty: { $sum: "$items.quantity" },
        },
      },
    ]);

    const totalSuppliers = await Supplier.countDocuments({ branchId });

    /* =========================
       PAYABLE (TABLE + TOTAL)
    ========================= */

    const payableList = await PurchaseInvoice.find({
      branchId,
      status: "Completed",
    })
      .populate("supplierId", "name")
      .sort({ createdAt: -1 });

    let totalPayable = 0;
    let totalPayablePending = 0;

    const payableData = payableList.map((bill) => {
      const pending =
        bill.paymentStatus === "Pending" ? bill.finalTotal : 0;

      totalPayable += bill.finalTotal;
      totalPayablePending += pending;

      return {
        supplier: bill.supplierId?.name,
        billNo: bill.invoiceNumber,
        invoiceDate: bill.invoiceDate,
        dueDate: bill.invoiceDate,
        amount: bill.finalTotal,
        paid: bill.paymentStatus === "Paid" ? bill.finalTotal : 0,
        pending,
        status: bill.paymentStatus,
      };
    });

    /* =========================
       INVENTORY (FULL LIKE UI)
    ========================= */

    const totalProducts = await Product.countDocuments({ branchId });

    const stockAgg = await Product.aggregate([
      { $match: { branchId } },
      {
        $group: {
          _id: null,
          stockQty: { $sum: "$quantity" },
          stockValue: {
            $sum: { $multiply: ["$quantity", "$purchasePrice"] },
          },
        },
      },
    ]);

    const totalPaid = totalReceivable - totalReceivablePending;

    const totalExpense = totalPayable;

    /* =========================
       FINAL RESPONSE
    ========================= */

    res.json({
      success: true,
      data: {
        sales: {
          totalSales: salesAgg[0]?.totalSales || 0,
          totalInvoices: salesAgg[0]?.totalInvoices || 0,
          soldQty: soldQtyAgg[0]?.soldQty || 0,
          totalCustomers,
          toReceive: totalReceivablePending,
        },

        purchase: {
          totalPurchase: purchaseAgg[0]?.totalPurchase || 0,
          totalBills: purchaseAgg[0]?.totalBills || 0,
          purchaseQty: purchaseQtyAgg[0]?.purchaseQty || 0,
          totalSuppliers,
          toPay: totalPayablePending,
        },

        inventory: {
          totalPaid,          
          totalExpense,       
          totalProducts,
          stockQty: stockAgg[0]?.stockQty || 0,
          stockValue: stockAgg[0]?.stockValue || 0,
        },

        receivable: {
          total: totalReceivable,
          pending: totalReceivablePending,
          list: receivableData,
        },

        payable: {
          total: totalPayable,
          pending: totalPayablePending,
          list: payableData,
        },
      },
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({
      success: false,
      message: "Failed to load dashboard",
    });
  }
};