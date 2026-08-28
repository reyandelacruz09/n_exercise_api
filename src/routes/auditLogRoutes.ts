import { Router } from "express";
import * as auditLogController from "../controllers/auditLogController";
import { authenticateToken } from "../middleware/authMiddleware";

const router = Router();

router.get("/", authenticateToken, auditLogController.getAuditLogs);

export default router;
