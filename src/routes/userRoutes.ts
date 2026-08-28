import { Router } from "express";
import { authenticateToken } from "../middleware/authMiddleware";
import * as usersController from "../controllers/usersController";

const router = Router();

router.get("/", authenticateToken, usersController.getUsers);
router.get("/:id", authenticateToken, usersController.getUserById);
router.post("/", authenticateToken, usersController.createUser);
router.put("/:id", authenticateToken, usersController.updateUser);
router.delete("/:id", authenticateToken, usersController.deleteUser);

export default router;
