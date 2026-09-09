import { Request, Response } from "express";
import bcrypt from "bcrypt";
import db from "../db/database";
import * as customerService from "../services/customerService";
import { formTemplateService } from "../services/formTemplateService";
import { auditLogService } from "../services/auditLogService";

export const getCustomers = async (
  req: Request,
  res: Response
) => {
  try {
    const customers = await customerService.getCustomers();
    res.status(200).json(customers);
  } catch (error) {
    res.status(500).json({
      message: "Failed to retrieve customers",
    });
  }
};

export const getCustomerById = async (
  req: Request,
  res: Response
) => {
  try {
    const customer = await customerService.getCustomerById(
      Number(req.params.id)
    );

    if (!customer) {
      return res.status(404).json({
        message: "Customer not found",
      });
    }

    res.json(customer);
  } catch (error) {
    res.status(500).json({
      message: "Failed to retrieve customer",
    });
  }
};

export const createCustomer = async(
  req: Request,
  res: Response
) => {
  try {
    const {
      first_name,
      last_name,
      email,
      phone
    } = req.body

    if (!first_name || last_name == undefined || !email || phone == undefined){
      return res.status(400).json({
        message: "Please complete the mandatory inputs",
      });
    }

    const customer = await customerService.createCustomer(
      first_name,
      last_name,
      email,
      phone
    );

    await auditLogService.log({
      entity: "customer",
      action: "add",
      entity_id: customer?.id,
      description: `Created customer '${customer?.first_name ?? ""} ${customer?.last_name ?? ""}' (${customer?.email ?? email})`,
      user_id: (req as any).user?.id ?? null,
    });

    return res.status(201).json({
      message: "Customer created successfully",
      customer,
    });

  }catch (error){
    console.error("Create customer error:", error);

    return res.status(500).json({
      message: "Failed to create customer",
    });
  }
}

export const updateCustomer = async (
  req: Request,
  res: Response
) => {
  try {
    const { id } = req.params;
    const { first_name, last_name, email, phone } = req.body;

    if (
      first_name === undefined &&
      last_name === undefined &&
      email === undefined &&
      phone === undefined
    ) {
      return res.status(400).json({
        message: "At least one field is required",
      });
    }

    const existing = await customerService.getCustomerById(Number(id));

    if (!existing) {
      return res.status(404).json({
        message: "Customer not found",
      });
    }

    const customer = await customerService.updateCustomer(Number(id), {
      ...(first_name !== undefined && { first_name }),
      ...(last_name !== undefined && { last_name }),
      ...(email !== undefined && { email }),
      ...(phone !== undefined && { phone }),
    });

    await auditLogService.log({
      entity: "customer",
      action: "update",
      entity_id: customer?.id,
      description: `Updated customer '${customer?.first_name ?? ""} ${customer?.last_name ?? ""}'`,
      user_id: (req as any).user?.id ?? null,
    });

    return res.json({
      message: "Customer updated successfully",
      customer,
    });
  } catch (error) {
    console.error("Update customer error:", error);

    return res.status(500).json({
      message: "Failed to update customer",
    });
  }
};

export const deleteCustomer = async (
  req: Request,
  res: Response
) => {
  try {
    const id = Number(req.params.id);

    const existing = await customerService.getCustomerById(id);

    if (!existing) {
      return res.status(404).json({
        message: "Customer not found",
      });
    }

    await customerService.deleteCustomer(id);

    await auditLogService.log({
      entity: "customer",
      action: "delete",
      entity_id: id,
      description: `Deleted customer '${existing.first_name} ${existing.last_name}' (${existing.email})`,
      user_id: (req as any).user?.id ?? null,
    });

    return res.json({
      message: "Customer deleted successfully",
    });
  } catch (error) {
    console.error("Delete customer error:", error);

    return res.status(500).json({
      message: "Failed to delete customer",
    });
  }
};

export const getCustomerPasswordStatus = async (
  req: Request,
  res: Response
) => {
  try {
    const id = Number(req.params.id);

    const customer = await customerService.getCustomerById(id);

    if (!customer) {
      return res.status(404).json({
        message: "Customer not found",
      });
    }

    return res.json({
      has_password: Boolean(customer.password_hash),
      email: customer.email,
    });
  } catch (error) {
    console.error("Get password status error:", error);

    return res.status(500).json({
      message: "Failed to fetch password status",
    });
  }
};

export const setCustomerPassword = async (req: Request, res: Response) => {
  try {
    const id = Number(req.params.id);
    const { password } = req.body ?? {};

    if (!password || String(password).length < 6) {
      return res.status(400).json({
        message: "Password must be at least 6 characters",
      });
    }

    const existing = await customerService.getCustomerById(id);

    if (!existing) {
      return res.status(404).json({
        message: "Customer not found",
      });
    }

    const password_hash = await bcrypt.hash(String(password), 10);

    await customerService.setCustomerPassword(id, password_hash);

    await auditLogService.log({
      entity: "customer",
      action: "update",
      entity_id: id,
      description: `Set portal password for customer '${existing.first_name} ${existing.last_name}' (${existing.email})`,
      user_id: (req as any).user?.id ?? null,
    });

    return res.json({
      message: "Customer password set successfully",
    });
  } catch (error) {
    console.error("Set customer password error:", error);

    return res.status(500).json({
      message: "Failed to set customer password",
    });
  }
};

export const getFormAssignment = async (req: Request, res: Response) => {
  try {
    const id = Number(req.params.id);

    const customer = await customerService.getCustomerById(id);

    if (!customer) {
      return res.status(404).json({
        message: "Customer not found",
      });
    }

    const assignment = await db
      .selectFrom("customer_form_assignments")
      .innerJoin(
        "form_templates",
        "form_templates.id",
        "customer_form_assignments.template_id"
      )
      .select([
        "customer_form_assignments.template_id",
        "form_templates.name as template_name",
      ])
      .where("customer_form_assignments.customer_id", "=", id)
      .executeTakeFirst();

    return res.json({
      template_id: assignment?.template_id ?? null,
      template_name: assignment?.template_name ?? null,
    });
  } catch (error) {
    console.error("Get form assignment error:", error);

    return res.status(500).json({
      message: "Failed to fetch form assignment",
    });
  }
};

export const setFormAssignment = async (req: Request, res: Response) => {
  try {
    const id = Number(req.params.id);
    const { template_id } = req.body ?? {};

    const customer = await customerService.getCustomerById(id);

    if (!customer) {
      return res.status(404).json({
        message: "Customer not found",
      });
    }

    if (template_id == null) {
      await db
        .deleteFrom("customer_form_assignments")
        .where("customer_id", "=", id)
        .execute();

      await auditLogService.log({
        entity: "customer",
        action: "update",
        entity_id: id,
        description: `Removed form template assignment from customer #${id}`,
        user_id: (req as any).user?.id ?? null,
      });

      return res.json({
        message: "Form template assignment cleared",
        template_id: null,
      });
    }

    const template = await formTemplateService.getTemplateById(
      Number(template_id)
    );

    if (!template) {
      return res.status(404).json({
        message: "Form template not found",
      });
    }

    await db.deleteFrom("customer_form_assignments").where("customer_id", "=", id).execute();

    await db
      .insertInto("customer_form_assignments")
      .values({
        customer_id: id,
        template_id: template.id,
        created_at: new Date(),
      })
      .execute();

    await auditLogService.log({
      entity: "customer",
      action: "update",
      entity_id: id,
      description: `Assigned form template '${template.name}' to customer #${id}`,
      user_id: (req as any).user?.id ?? null,
    });

    return res.json({
      message: "Form template assigned successfully",
      template_id: template.id,
    });
  } catch (error) {
    console.error("Set form assignment error:", error);

    return res.status(500).json({
      message: "Failed to update form assignment",
    });
  }
};