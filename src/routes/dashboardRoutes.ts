import { Router } from "express";
import { authenticateToken } from "../middleware/authMiddleware";
import * as dashboardController from "../controllers/dashboardController";

const router = Router();

router.get("/", authenticateToken, dashboardController.getDashboard);

export default router;
