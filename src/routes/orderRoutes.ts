import { Router } from "express";
import * as orderController from "../controllers/orderController";
import { authenticateToken } from "../middleware/authMiddleware";

const router = Router();

router.get("/", orderController.getOrders);
router.get("/:id", orderController.getOrdersById);
router.post(
    "/",
    authenticateToken,
    orderController.createOrder
);

export default router;