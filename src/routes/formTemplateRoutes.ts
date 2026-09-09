import { Router } from "express";
import { authenticateToken } from "../middleware/authMiddleware";
import { requirePermission } from "../middleware/permissionMiddleware";
import * as formTemplateController from "../controllers/formTemplateController";

const router = Router();

router.use(authenticateToken, requirePermission("orders.manage"));

router.get("/", formTemplateController.getTemplates);
router.get("/:id", formTemplateController.getTemplateById);
router.post("/", formTemplateController.createTemplate);
router.put("/:id", formTemplateController.updateTemplate);
router.delete("/:id", formTemplateController.deleteTemplate);
router.post("/:templateId/fields", formTemplateController.createField);
router.put(
  "/:templateId/fields/reorder",
  formTemplateController.reorderFields
);
router.put("/fields/:fieldId", formTemplateController.updateField);
router.delete("/:templateId/fields/:fieldId", formTemplateController.deleteField);

export default router;