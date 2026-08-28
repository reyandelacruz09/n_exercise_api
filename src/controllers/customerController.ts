import { Request, Response } from "express";
import * as customerService from "../services/customerService";
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