import { Router } from "express";
import * as customerAuthController from "../controllers/customerAuthController";
import { authenticateCustomerToken } from "../middleware/customerAuthMiddleware";

const router = Router();

router.post("/login", customerAuthController.customerLogin);
router.get("/me", authenticateCustomerToken, customerAuthController.customerMe);
router.post("/logout", authenticateCustomerToken, customerAuthController.customerLogout);

export default router;