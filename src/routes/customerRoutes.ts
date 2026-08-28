import { Router } from "express";
import * as customerController from "../controllers/customerController";
import { authenticateToken } from "../middleware/authMiddleware";

const router = Router();

router.get("/", customerController.getCustomers);
router.get("/:id", customerController.getCustomerById);
router.post(
    "/",
    authenticateToken,
    customerController.createCustomer
);
router.put(
    "/:id",
    authenticateToken,
    customerController.updateCustomer
);

export default router;