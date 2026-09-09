import { Router } from "express";
import { authenticateToken } from "../middleware/authMiddleware";
import { requirePermission } from "../middleware/permissionMiddleware";
import * as formFieldController from "../controllers/formFieldController";

const router = Router();

// Per-customer form configuration. Manage access required (admins bypass).
router.get(
  "/customers/:customerId/form-fields",
  authenticateToken,
  requirePermission("orders.manage"),
  formFieldController.getCustomerFormFields
);
router.post(
  "/customers/:customerId/form-fields",
  authenticateToken,
  requirePermission("orders.manage"),
  formFieldController.createFormField
);
router.put(
  "/customers/:customerId/form-fields/reorder",
  authenticateToken,
  requirePermission("orders.manage"),
  formFieldController.reorderFormFields
);
router.put(
  "/form-fields/:id",
  authenticateToken,
  requirePermission("orders.manage"),
  formFieldController.updateFormField
);
router.delete(
  "/form-fields/:id",
  authenticateToken,
  requirePermission("orders.manage"),
  formFieldController.deleteFormField
);

export default router;