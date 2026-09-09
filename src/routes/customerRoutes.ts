import { Router } from "express";
import * as customerController from "../controllers/customerController";
import { authenticateToken } from "../middleware/authMiddleware";
import { requirePermission } from "../middleware/permissionMiddleware";

const router = Router();

router.get("/", authenticateToken, requirePermission("customers.view"), customerController.getCustomers);
router.get("/:id", authenticateToken, requirePermission("customers.view"), customerController.getCustomerById);
router.post(
    "/",
    authenticateToken,
    requirePermission("customers.manage"),
    customerController.createCustomer
);
router.put(
    "/:id",
    authenticateToken,
    requirePermission("customers.manage"),
    customerController.updateCustomer
);
router.delete(
    "/:id",
    authenticateToken,
    requirePermission("customers.manage"),
    customerController.deleteCustomer
);
router.get(
    "/:id/form-assignment",
    authenticateToken,
    requirePermission("orders.manage"),
    customerController.getFormAssignment
);
router.put(
    "/:id/form-assignment",
    authenticateToken,
    requirePermission("orders.manage"),
    customerController.setFormAssignment
);
router.put(
    "/:id/password",
    authenticateToken,
    requirePermission("customers.manage"),
    customerController.setCustomerPassword
);
router.get(
    "/:id/password-status",
    authenticateToken,
    requirePermission("customers.manage"),
    customerController.getCustomerPasswordStatus
);

export default router;