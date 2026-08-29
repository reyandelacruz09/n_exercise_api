import { Router } from "express";
import { authenticateToken } from "../middleware/authMiddleware";
import { requireAdmin } from "../middleware/permissionMiddleware";
import * as usersController from "../controllers/usersController";

const router = Router();

router.get("/", authenticateToken, requireAdmin, usersController.getUsers);
router.get("/:id", authenticateToken, requireAdmin, usersController.getUserById);
router.post("/", authenticateToken, requireAdmin, usersController.createUser);
router.put("/:id", authenticateToken, requireAdmin, usersController.updateUser);
router.delete("/:id", authenticateToken, requireAdmin, usersController.deleteUser);

export default router;
