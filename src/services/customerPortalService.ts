import db from "../db/database";
import * as orderService from "../services/orderService";

export const getCatalog = async () => {
  return await db
    .selectFrom("products")
    .selectAll()
    .where("is_active", "=", true)
    .where("stock", ">", 0)
    .orderBy("name", "asc")
    .execute();
};

export const getCustomerOrders = async (customerId: number) => {
  return await db
    .selectFrom("orders")
    .selectAll()
    .where("customer_id", "=", customerId)
    .orderBy("created_at", "desc")
    .execute();
};

export const getCustomerOrderById = async (
  customerId: number,
  orderId: number
) => {
  const order = await db
    .selectFrom("orders")
    .selectAll()
    .where("id", "=", orderId)
    .where("customer_id", "=", customerId)
    .executeTakeFirst();

  if (!order) {
    return undefined;
  }

  const items = await orderService.getOrderItems(order.id);

  return { ...order, items };
};

export const createCustomerOrder = async (
  customerId: number,
  items: { product_id: number; quantity: number }[],
  customFields: Record<string, unknown>
) => {
  return await orderService.createOrder(
    customerId,
    items,
    "Pending",
    null,
    customFields
  );
};