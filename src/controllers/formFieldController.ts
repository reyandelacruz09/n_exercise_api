import { Request, Response } from "express";
import * as customerService from "../services/customerService";
import {
  formFieldService,
  FormFieldValidationError,
} from "../services/formFieldService";
import { auditLogService } from "../services/auditLogService";

const parseCustomerId = (req: Request, res: Response): number | null => {
  const id = Number(req.params.customerId);

  if (!Number.isInteger(id) || id <= 0) {
    res.status(400).json({ message: "Invalid customer ID" });
    return null;
  }

  return id;
};

export const getCustomerFormFields = async (req: Request, res: Response) => {
  try {
    const customerId = parseCustomerId(req, res);
    if (customerId === null) return;

    const fields = await formFieldService.getByCustomerId(customerId);

    res.json(fields);
  } catch (error) {
    console.error("Get form fields error:", error);
    res.status(500).json({ message: "Failed to fetch form fields" });
  }
};

export const createFormField = async (req: Request, res: Response) => {
  try {
    const customerId = parseCustomerId(req, res);
    if (customerId === null) return;

    const customer = await customerService.getCustomerById(customerId);
    if (!customer) {
      return res.status(404).json({ message: "Customer not found" });
    }

    const field = await formFieldService.create(customerId, req.body ?? {});

    await auditLogService.log({
      entity: "customer",
      action: "update",
      entity_id: customerId,
      description: `Added form field '${field?.label}' to customer #${customerId}`,
      user_id: (req as any).user?.id ?? null,
    });

    return res.status(201).json({
      message: "Form field created successfully",
      field,
    });
  } catch (error) {
    console.error("Create form field error:", error);

    if (error instanceof FormFieldValidationError) {
      return res.status(400).json({ message: error.message });
    }

    return res.status(500).json({ message: "Failed to create form field" });
  }
};

export const updateFormField = async (req: Request, res: Response) => {
  try {
    const id = Number(req.params.id);

    if (!Number.isInteger(id) || id <= 0) {
      return res.status(400).json({ message: "Invalid field ID" });
    }

    const field = await formFieldService.update(id, req.body ?? {});

    if (!field) {
      return res.status(404).json({ message: "Form field not found" });
    }

    await auditLogService.log({
      entity: "customer",
      action: "update",
      entity_id: field.customer_id,
      description: `Updated form field '${field.label}' (customer #${field.customer_id})`,
      user_id: (req as any).user?.id ?? null,
    });

    return res.json({ message: "Form field updated successfully", field });
  } catch (error) {
    console.error("Update form field error:", error);

    if (error instanceof FormFieldValidationError) {
      return res.status(400).json({ message: error.message });
    }

    return res.status(500).json({ message: "Failed to update form field" });
  }
};

export const deleteFormField = async (req: Request, res: Response) => {
  try {
    const id = Number(req.params.id);

    if (!Number.isInteger(id) || id <= 0) {
      return res.status(400).json({ message: "Invalid field ID" });
    }

    const field = await formFieldService.remove(id);

    if (!field) {
      return res.status(404).json({ message: "Form field not found" });
    }

    await auditLogService.log({
      entity: "customer",
      action: "update",
      entity_id: field.customer_id,
      description: `Removed form field '${field.label}' from customer #${field.customer_id}`,
      user_id: (req as any).user?.id ?? null,
    });

    return res.json({ message: "Form field deleted successfully" });
  } catch (error) {
    console.error("Delete form field error:", error);
    return res.status(500).json({ message: "Failed to delete form field" });
  }
};

export const reorderFormFields = async (req: Request, res: Response) => {
  try {
    const customerId = parseCustomerId(req, res);
    if (customerId === null) return;

    const orderedIds = (req.body ?? {}).orderedIds;

    await formFieldService.reorder(customerId, orderedIds);

    return res.json({ message: "Form fields reordered successfully" });
  } catch (error) {
    console.error("Reorder form fields error:", error);

    if (error instanceof FormFieldValidationError) {
      return res.status(400).json({ message: error.message });
    }

    return res.status(500).json({ message: "Failed to reorder form fields" });
  }
};