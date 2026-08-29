import { Router } from "express";
import * as auditLogController from "../controllers/auditLogController";
import { authenticateToken } from "../middleware/authMiddleware";
import { requirePermission } from "../middleware/permissionMiddleware";

const router = Router();

router.get("/", authenticateToken, requirePermission("audit.view"), auditLogController.getAuditLogs);

export default router;
