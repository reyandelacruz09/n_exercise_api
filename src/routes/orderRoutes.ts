import { Router } from "express";
import * as orderController from "../controllers/orderController";
import { authenticateToken } from "../middleware/authMiddleware";

const router = Router();

router.get("/", authenticateToken, orderController.getOrders);
router.get("/:id", authenticateToken, orderController.getOrdersById);
router.post("/", authenticateToken, orderController.createOrder);
router.put("/:id", authenticateToken, orderController.updateOrder);
router.delete("/:id", authenticateToken, orderController.deleteOrder);

export default router;
