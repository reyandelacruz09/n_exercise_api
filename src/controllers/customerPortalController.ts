import { Request, Response } from "express";
import * as customerPortalService from "../services/customerPortalService";
import * as orderService from "../services/orderService";
import { OrderValidationError } from "../services/orderService";
import {
  validateCustomFields,
  FormFieldValidationError,
} from "../services/formFieldService";
import { getEffectiveFormFields } from "../services/formResolutionService";
import { auditLogService } from "../services/auditLogService";

const getCustomerId = (req: Request): number | null => {
  const auth: any = (req as any).customer;
  const id = auth?.customer_id ? Number(auth.customer_id) : null;

  return id && Number.isInteger(id) ? id : null;
};

const validateOrderItems = (
  items: unknown
): { product_id: number; quantity: number }[] | null => {
  if (!Array.isArray(items) || items.length === 0) {
    return null;
  }

  for (const item of items) {
    if (
      typeof item !== "object" ||
      item === null ||
      !Number.isInteger((item as any).product_id) ||
      (item as any).product_id <= 0 ||
      !Number.isInteger((item as any).quantity) ||
      (item as any).quantity <= 0
    ) {
      return null;
    }
  }

  return items as { product_id: number; quantity: number }[];
};

export const getCatalog = async (_req: Request, res: Response) => {
  try {
    const products = await customerPortalService.getCatalog();
    res.json(products);
  } catch (error) {
    console.error("Customer catalog error:", error);
    res.status(500).json({ message: "Failed to fetch catalog" });
  }
};

export const getForm = async (req: Request, res: Response) => {
  try {
    const customerId = getCustomerId(req);
    if (customerId === null) {
      return res.status(401).json({ message: "Not authenticated" });
    }

    const fields = await getEffectiveFormFields(customerId);
    res.json(fields);
  } catch (error) {
    console.error("Customer form error:", error);
    res.status(500).json({ message: "Failed to fetch form" });
  }
};

export const getOrders = async (req: Request, res: Response) => {
  try {
    const customerId = getCustomerId(req);
    if (customerId === null) {
      return res.status(401).json({ message: "Not authenticated" });
    }

    const orders = await customerPortalService.getCustomerOrders(customerId);
    res.json(orders);
  } catch (error) {
    console.error("Customer orders error:", error);
    res.status(500).json({ message: "Failed to fetch orders" });
  }
};

export const getOrderById = async (req: Request, res: Response) => {
  try {
    const customerId = getCustomerId(req);
    if (customerId === null) {
      return res.status(401).json({ message: "Not authenticated" });
    }

    const order = await customerPortalService.getCustomerOrderById(
      customerId,
      Number(req.params.id)
    );

    if (!order) {
      return res.status(404).json({ message: "Order not found" });
    }

    res.json(order);
  } catch (error) {
    console.error("Customer order error:", error);
    res.status(500).json({ message: "Failed to fetch order" });
  }
};

export const createOrder = async (req: Request, res: Response) => {
  try {
    const customerId = getCustomerId(req);
    if (customerId === null) {
      return res.status(401).json({ message: "Not authenticated" });
    }

    const { items } = req.body ?? {};

    const validatedItems = validateOrderItems(items);

    if (!validatedItems) {
      return res.status(400).json({
        message:
          "At least one order item with a valid product_id and quantity is required",
      });
    }

    let customFields: Record<string, unknown> = {};
    try {
      const fields = await getEffectiveFormFields(customerId);
      customFields = validateCustomFields(fields, req.body?.custom_fields);
    } catch (error) {
      if (error instanceof FormFieldValidationError) {
        return res.status(400).json({ message: error.message });
      }
      throw error;
    }

    const order = await customerPortalService.createCustomerOrder(
      customerId,
      validatedItems,
      customFields
    );

    await auditLogService.log({
      entity: "order",
      action: "add",
      entity_id: order?.id,
      description: `Customer #${customerId} placed order #${order?.id ?? ""} with ${validatedItems.length} item(s)`,
      user_id: null,
    });

    return res.status(201).json({
      message: "Order placed successfully",
      order,
    });
  } catch (error) {
    console.error("Customer create order error:", error);

    if (error instanceof OrderValidationError) {
      return res.status(400).json({ message: error.message });
    }

    return res.status(500).json({
      message: "Failed to place order",
    });
  }
};