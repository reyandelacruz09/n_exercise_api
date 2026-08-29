import { Router } from "express";
import * as orderController from "../controllers/orderController";
import { authenticateToken } from "../middleware/authMiddleware";
import { requirePermission } from "../middleware/permissionMiddleware";

const router = Router();

router.get("/", authenticateToken, requirePermission("orders.view"), orderController.getOrders);
router.get("/:id", authenticateToken, requirePermission("orders.view"), orderController.getOrdersById);
router.post("/", authenticateToken, requirePermission("orders.manage"), orderController.createOrder);
router.put("/:id", authenticateToken, requirePermission("orders.manage"), orderController.updateOrder);
router.delete("/:id", authenticateToken, requirePermission("orders.manage"), orderController.deleteOrder);

export default router;
