import express from "express";
import { protectUser } from "../middlewares/userAuth.js";
import { 
  getAllInventory,
  getStockSummary,
  getLowStock,
  addStock, 
  reduceStock,
  getInventoryByProduct,
} from "../controllers/inventoryController.js";

const router = express.Router();

/*
=========================================================
All routes require logged-in USER authentication
Branch is automatically detected
=========================================================
*/
router.use(protectUser);


/*
=========================================================
GET /
Get ALL inventory of branch

Purpose:
- Shows all products stock size-wise
- Used in inventory list page

Response Example:
[
 { productName, size, quantity }
]
=========================================================
*/
router.get("/", getAllInventory);


/*
=========================================================
GET /summary
Get stock summary of branch

Purpose:
- Total number of products
- Total stock quantity in branch

Used in dashboard
=========================================================
*/
router.get("/summary", getStockSummary);


/*
=========================================================
GET /low-stock
Get products with low stock

Purpose:
- Shows products with stock <= 5
- Used for low stock alerts
=========================================================
*/
router.get("/low-stock", getLowStock);


/*
POST /add
Add stock to product

Body:
{
 productId,
 quantity
}
*/
router.post("/add", addStock);


/*
POST /reduce
Reduce stock

Body:
{
 productId,
 quantity
}
*/
router.post("/reduce", reduceStock);


/*
=========================================================
GET /:productId
Get inventory of specific product

Purpose:
- Shows stock of product size-wise
- Used in product details page

Response Example:
{
 product,
 inventory: [
   { size, quantity }
 ]
}
=========================================================
*/
router.get("/:productId", getInventoryByProduct);


export default router;
