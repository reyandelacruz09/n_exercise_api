import { Router } from "express";
import * as stockTransactionController from "../controllers/stockTransactionController";
import { authenticateToken } from "../middleware/authMiddleware";
import { requirePermission } from "../middleware/permissionMiddleware";

const router = Router();

router.get("/", authenticateToken, requirePermission("inventory.view"), stockTransactionController.getTransactions);
router.get("/alerts", authenticateToken, requirePermission("inventory.view"), stockTransactionController.getLowStock);
router.post("/", authenticateToken, requirePermission("inventory.manage"), stockTransactionController.createTransaction);

export default router;
