import { Router } from "express";
import * as stockTransactionController from "../controllers/stockTransactionController";
import { authenticateToken } from "../middleware/authMiddleware";

const router = Router();

router.get("/", authenticateToken, stockTransactionController.getTransactions);
router.get("/alerts", authenticateToken, stockTransactionController.getLowStock);
router.post("/", authenticateToken, stockTransactionController.createTransaction);

export default router;
