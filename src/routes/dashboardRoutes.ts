import { Router } from "express";
import { authenticateToken } from "../middleware/authMiddleware";
import { requirePermission } from "../middleware/permissionMiddleware";
import * as dashboardController from "../controllers/dashboardController";

const router = Router();

router.get("/", authenticateToken, requirePermission("dashboard.view"), dashboardController.getDashboard);

export default router;
