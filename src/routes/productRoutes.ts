import { Router } from "express";
import * as productController from "../controllers/productController";
import { authenticateToken } from "../middleware/authMiddleware";
import { requirePermission } from "../middleware/permissionMiddleware";

const router = Router();

router.get("/", authenticateToken, requirePermission("products.view"), productController.getProducts);
router.get("/:id", authenticateToken, requirePermission("products.view"), productController.getProductById);
router.post("/", authenticateToken, requirePermission("products.manage"), productController.createProduct);
router.put("/:id", authenticateToken, requirePermission("products.manage"), productController.updateProduct);
router.delete("/:id", authenticateToken, requirePermission("products.manage"), productController.deleteProduct);

export default router;