import { Router } from "express";
import * as productController from "../controllers/productController";
import { authenticateToken } from "../middleware/authMiddleware";

const router = Router();

router.get("/", productController.getProducts);
router.get("/:id", productController.getProductById);
router.post("/", authenticateToken, productController.createProduct);
router.put("/:id", authenticateToken, productController.updateProduct);
router.delete("/:id", authenticateToken, productController.deleteProduct);

export default router;