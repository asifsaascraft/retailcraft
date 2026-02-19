import express from "express";
import { protectUser } from "../middlewares/userAuth.js";
import { 
  addStock, 
  reduceStock 
} from "../controllers/inventoryController.js";

const router = express.Router();

// 🔐 All routes protected
router.use(protectUser);

router.post("/add", addStock);
router.post("/reduce", reduceStock);

export default router;
