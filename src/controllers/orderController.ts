import { Request, Response } from "express";
import * as orderService from "../services/orderService";
import { OrderValidationError } from "../services/orderService";
import * as customerService from "../services/customerService";
import {
  validateCustomFields,
  FormFieldValidationError,
} from "../services/formFieldService";
import { getEffectiveFormFields } from "../services/formResolutionService";
import { auditLogService } from "../services/auditLogService";

export const getOrders = async (
  req: Request,
  res: Response
) => {
  try {
    const { page, pageSize, search, status } = req.query;

    const orders = await orderService.getOrders({
      page: page !== undefined ? Number(page) : undefined,
      pageSize: pageSize !== undefined ? Number(pageSize) : undefined,
      search: typeof search === "string" ? search : undefined,
      status: typeof status === "string" ? status : undefined,
    });

    res.json(orders);
  } catch (error) {
    console.error("Get Orders error:", error);
    res.status(500).json({
      message: "Failed to retrieve orders",
    });
  }
};

export const getOrdersById = async(
  req: Request,
  res: Response
) => {
  try {
    const order = await orderService.getOrderById(
      Number(req.params.id)
    )
    if (!order){
      return res.status(404).json({
        message: "Order not found"
      })
    }

    const items = await orderService.getOrderItems(order.id);

    res.json({ ...order, items })
  } catch (error) {
    res.status(500).json({
      message: "Failed to retrieve order",
    });
  }
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

export const createOrder = async(
  req: Request,
  res: Response
) => {
  try {
    const { customer_id, status, items } = req.body;

    if (customer_id === undefined){
      return res.status(400).json({
        message: "Please complete the mandatory inputs",
      });
    }

    const validatedItems = validateOrderItems(items);

    if (!validatedItems) {
      return res.status(400).json({
        message:
          "At least one order item with a valid product_id and quantity is required",
      });
    }

    const existingCustomer = await customerService.getCustomerById(
      Number(customer_id)
    );

    if (!existingCustomer) {
      return res.status(400).json({
        message: "Customer was not found",
      });
    }

    let customFields: Record<string, unknown> = {};
    try {
      const fields = await getEffectiveFormFields(Number(customer_id));
      customFields = validateCustomFields(fields, req.body?.custom_fields);
    } catch (error) {
      if (error instanceof FormFieldValidationError) {
        return res.status(400).json({ message: error.message });
      }
      throw error;
    }

    const order = await orderService.createOrder(
      Number(customer_id),
      validatedItems,
      status,
      (req as any).user?.id ?? null,
      customFields
    );

    await auditLogService.log({
      entity: "order",
      action: "add",
      entity_id: order?.id,
      description: `Created order #${order?.id ?? ""} for customer #${customer_id} with ${validatedItems.length} item(s)`,
      user_id: (req as any).user?.id ?? null,
    });

    return res.status(201).json({
      message: "Order created successfully",
      order,
    });

  }catch (error){
    console.error("Create Order error:", error);

    if (error instanceof OrderValidationError) {
      return res.status(400).json({
        message: error.message,
      });
    }

    return res.status(500).json({
      message: "Failed to create order",
    });
  }
}

export const updateOrder = async (
  req: Request,
  res: Response
) => {
  try {
    const { id } = req.params;
    const { status, items } = req.body;

    if (status === undefined && items === undefined) {
      return res.status(400).json({
        message: "At least one field is required",
      });
    }

    let validatedItems;
    if (items !== undefined) {
      validatedItems = validateOrderItems(items);

      if (!validatedItems) {
        return res.status(400).json({
          message:
            "Order items must include at least one item with a valid product_id and quantity",
        });
      }
    }

    const existingOrder = await orderService.getOrderById(Number(id));

    if (!existingOrder) {
      return res.status(404).json({
        message: "Order not found",
      });
    }

    let customFields: Record<string, unknown> | undefined;
    if (req.body?.custom_fields !== undefined) {
      try {
        const fields = await getEffectiveFormFields(
          existingOrder.customer_id
        );
        customFields = validateCustomFields(fields, req.body.custom_fields);
      } catch (error) {
        if (error instanceof FormFieldValidationError) {
          return res.status(400).json({ message: error.message });
        }
        throw error;
      }
    }

    const order = await orderService.updateOrder(Number(id), {
      ...(status !== undefined && { status }),
      ...(validatedItems !== undefined && { items: validatedItems }),
      ...(customFields !== undefined && { custom_fields: customFields }),
    });

    if (!order) {
      return res.status(404).json({
        message: "Order not found",
      });
    }

    await auditLogService.log({
      entity: "order",
      action: "update",
      entity_id: order.id,
      description: `Updated order #${order.id}${status ? ` status to '${status}'` : ""}`,
      user_id: (req as any).user?.id ?? null,
    });

    return res.json({
      message: "Order updated successfully",
      order,
    });
  } catch (error) {
    console.error("Update Order error:", error);

    if (error instanceof OrderValidationError) {
      return res.status(400).json({
        message: error.message,
      });
    }

    return res.status(500).json({
      message: "Failed to update order",
    });
  }
};

export const deleteOrder = async (
  req: Request,
  res: Response
) => {
  try {
    const id = Number(req.params.id);

    const order = await orderService.deleteOrder(id);

    if (!order) {
      return res.status(404).json({
        message: "Order not found",
      });
    }

    await auditLogService.log({
      entity: "order",
      action: "delete",
      entity_id: order.id,
      description: `Deleted order #${order.id} for customer #${order.customer_id}`,
      user_id: (req as any).user?.id ?? null,
    });

    return res.json({
      message: "Order deleted successfully",
    });
  } catch (error) {
    console.error("Delete Order error:", error);

    if (error instanceof OrderValidationError) {
      return res.status(400).json({
        message: error.message,
      });
    }

    return res.status(500).json({
      message: "Failed to delete order",
    });
  }
};
