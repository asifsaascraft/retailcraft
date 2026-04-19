import express from "express";
import { getDashboardSummary } from "../controllers/dashboardController.js";
import { protectUser } from "../middlewares/userAuth.js";

const router = express.Router();

router.use(protectUser);

router.get("/summary", getDashboardSummary);

export default router;