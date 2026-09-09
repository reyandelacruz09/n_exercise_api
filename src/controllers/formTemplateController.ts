import { Request, Response } from "express";
import { formTemplateService } from "../services/formTemplateService";
import { FormFieldValidationError } from "../services/formFieldService";
import { auditLogService } from "../services/auditLogService";

export const getTemplates = async (_req: Request, res: Response) => {
  try {
    const templates = await formTemplateService.getTemplates();
    res.json(templates);
  } catch (error) {
    console.error("Get templates error:", error);
    res.status(500).json({ message: "Failed to fetch form templates" });
  }
};

export const getTemplateById = async (req: Request, res: Response) => {
  try {
    const id = Number(req.params.id);

    if (!Number.isInteger(id) || id <= 0) {
      return res.status(400).json({ message: "Invalid template ID" });
    }

    const template = await formTemplateService.getTemplateById(id);

    if (!template) {
      return res.status(404).json({ message: "Form template not found" });
    }

    const fields = await formTemplateService.getFieldsByTemplateId(id);

    res.json({ ...template, fields });
  } catch (error) {
    console.error("Get template error:", error);
    res.status(500).json({ message: "Failed to fetch form template" });
  }
};

export const createTemplate = async (req: Request, res: Response) => {
  try {
    const template = await formTemplateService.create(req.body ?? {});

    await auditLogService.log({
      entity: "template",
      action: "add",
      entity_id: template?.id,
      description: `Created form template '${template?.name}'`,
      user_id: (req as any).user?.id ?? null,
    });

    return res.status(201).json({
      message: "Form template created successfully",
      template,
    });
  } catch (error) {
    console.error("Create template error:", error);

    if (error instanceof FormFieldValidationError) {
      return res.status(400).json({ message: error.message });
    }

    return res.status(500).json({
      message: "Failed to create form template",
    });
  }
};

export const updateTemplate = async (req: Request, res: Response) => {
  try {
    const id = Number(req.params.id);

    const template = await formTemplateService.update(id, req.body ?? {});

    if (!template) {
      return res.status(404).json({ message: "Form template not found" });
    }

    await auditLogService.log({
      entity: "template",
      action: "update",
      entity_id: id,
      description: `Updated form template '${template.name}'`,
      user_id: (req as any).user?.id ?? null,
    });

    return res.json({
      message: "Form template updated successfully",
      template,
    });
  } catch (error) {
    console.error("Update template error:", error);

    if (error instanceof FormFieldValidationError) {
      return res.status(400).json({ message: error.message });
    }

    return res.status(500).json({
      message: "Failed to update form template",
    });
  }
};

export const deleteTemplate = async (req: Request, res: Response) => {
  try {
    const id = Number(req.params.id);

    const template = await formTemplateService.remove(id);

    if (!template) {
      return res.status(404).json({ message: "Form template not found" });
    }

    await auditLogService.log({
      entity: "template",
      action: "delete",
      entity_id: id,
      description: `Deleted form template '${template.name}'`,
      user_id: (req as any).user?.id ?? null,
    });

    return res.json({
      message: "Form template deleted successfully",
    });
  } catch (error) {
    console.error("Delete template error:", error);
    return res.status(500).json({ message: "Failed to delete form template" });
  }
};

export const createField = async (req: Request, res: Response) => {
  try {
    const templateId = Number(req.params.templateId);

    const template = await formTemplateService.getTemplateById(templateId);

    if (!template) {
      return res.status(404).json({ message: "Form template not found" });
    }

    const field = await formTemplateService.createField(templateId, req.body ?? {});

    await auditLogService.log({
      entity: "template",
      action: "update",
      entity_id: templateId,
      description: `Added field '${field?.label}' to template '${template.name}'`,
      user_id: (req as any).user?.id ?? null,
    });

    return res.status(201).json({
      message: "Template field created successfully",
      field,
    });
  } catch (error) {
    console.error("Create template field error:", error);

    if (error instanceof FormFieldValidationError) {
      return res.status(400).json({ message: error.message });
    }

    return res.status(500).json({
      message: "Failed to create template field",
    });
  }
};

export const updateField = async (req: Request, res: Response) => {
  try {
    const id = Number(req.params.fieldId);

    const field = await formTemplateService.updateField(id, req.body ?? {});

    if (!field) {
      return res.status(404).json({ message: "Template field not found" });
    }

    await auditLogService.log({
      entity: "template",
      action: "update",
      entity_id: field.template_id,
      description: `Updated field '${field.label}' in template #${field.template_id}`,
      user_id: (req as any).user?.id ?? null,
    });

    return res.json({
      message: "Template field updated successfully",
      field,
    });
  } catch (error) {
    console.error("Update template field error:", error);

    if (error instanceof FormFieldValidationError) {
      return res.status(400).json({ message: error.message });
    }

    return res.status(500).json({
      message: "Failed to update template field",
    });
  }
};

export const deleteField = async (req: Request, res: Response) => {
  try {
    const id = Number(req.params.fieldId);

    const field = await formTemplateService.removeField(id);

    if (!field) {
      return res.status(404).json({ message: "Template field not found" });
    }

    await auditLogService.log({
      entity: "template",
      action: "update",
      entity_id: field.template_id,
      description: `Removed field '${field.label}' from template #${field.template_id}`,
      user_id: (req as any).user?.id ?? null,
    });

    return res.json({
      message: "Template field deleted successfully",
    });
  } catch (error) {
    console.error("Delete template field error:", error);
    return res.status(500).json({ message: "Failed to delete template field" });
  }
};

export const reorderFields = async (req: Request, res: Response) => {
  try {
    const templateId = Number(req.params.templateId);
    const orderedIds = (req.body ?? {}).orderedIds;

    await formTemplateService.reorderFields(templateId, orderedIds);

    return res.json({ message: "Template fields reordered successfully" });
  } catch (error) {
    console.error("Reorder template fields error:", error);

    if (error instanceof FormFieldValidationError) {
      return res.status(400).json({ message: error.message });
    }

    return res.status(500).json({
      message: "Failed to reorder template fields",
    });
  }
};