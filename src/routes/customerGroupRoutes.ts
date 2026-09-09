import { Router } from "express";
import { authenticateToken } from "../middleware/authMiddleware";
import { requirePermission } from "../middleware/permissionMiddleware";
import * as customerGroupController from "../controllers/customerGroupController";

const router = Router();

router.use(authenticateToken, requirePermission("orders.manage"));

router.get("/", customerGroupController.getGroups);
router.post("/", customerGroupController.createGroup);
router.get("/:id/members", customerGroupController.getGroupMembers);
router.put("/:id/members", customerGroupController.setMembers);
router.put("/:id", customerGroupController.updateGroup);
router.delete("/:id", customerGroupController.deleteGroup);

export default router;