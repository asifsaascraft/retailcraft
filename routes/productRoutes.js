import express from "express";
import {
  createProduct,
  getProducts,
  getProductById,
  updateProduct,
  deleteProduct,
} from "../controllers/productController.js";

import { protectUser } from "../middlewares/userAuth.js";

const router = express.Router();

/*
=========================================================
All routes below require logged-in USER authentication
Branch is automatically detected from logged-in user
=========================================================
*/
router.use(protectUser);


/*
=========================================================
POST /
Create new product in logged-in user's branch

Purpose:
- Add new product (Shirt, Jeans, etc.)
- Automatically creates inventory for each size

Body Example:
{
  productName,
  barCode,
  sizes,
  purchasePrice,
  b2bSalePrice,
  b2cSalePrice
}
=========================================================
*/
router.post("/", createProduct);


/*
=========================================================
GET /
Get all products of logged-in user's branch

Purpose:
- List all products available in branch
- Used in product listing page
=========================================================
*/
router.get("/", getProducts);


/*
=========================================================
GET /:id
Get single product details by product ID

Purpose:
- View one specific product details
- Used in product details page
=========================================================
*/
router.get("/:id", getProductById);


/*
=========================================================
PUT /:id
Update product details

Purpose:
- Update name, price, description, etc.
- Cannot change branchId or userId
=========================================================
*/
router.put("/:id", updateProduct);


/*
=========================================================
DELETE /:id
Delete product

Purpose:
- Removes product from branch
- Also deletes all related inventory automatically
=========================================================
*/
router.delete("/:id", deleteProduct);


export default router;
