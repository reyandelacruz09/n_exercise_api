import { Transaction } from "kysely";
import db from "../db/database";
import type { Database } from "../db/schemas";

export class OrderValidationError extends Error {}

type Trx = Transaction<Database>;

export const ORDER_STATUSES = [
  "Pending",
  "Processing",
  "Completed",
  "Cancelled",
] as const;

export type OrderStatus = (typeof ORDER_STATUSES)[number];

export const isAllowedStatus = (status: string): status is OrderStatus => {
  return (ORDER_STATUSES as readonly string[]).includes(status);
};

export type OrderItemInput = {
  product_id: number;
  quantity: number;
};

export type OrderQuery = {
  page?: number;
  pageSize?: number;
  search?: string;
  status?: string;
};

export const getOrders = async (query: OrderQuery = {}) => {
  const page = Math.max(1, Number(query.page) || 1);
  const pageSize = Math.min(100, Math.max(1, Number(query.pageSize) || 20));
  const offset = (page - 1) * pageSize;

  let q = db
    .selectFrom("orders")
    .selectAll()
    .orderBy("created_at", "desc");

  if (query.search) {
    q = q.where("order_number", "ilike", `%${query.search}%`);
  }

  if (query.status && isAllowedStatus(query.status)) {
    q = q.where("status", "=", query.status);
  }

  const items = await q.limit(pageSize).offset(offset).execute();

  let countQ = db
    .selectFrom("orders")
    .select(db.fn.count("id").as("count"));

  if (query.search) {
    countQ = countQ.where("order_number", "ilike", `%${query.search}%`);
  }

  if (query.status && isAllowedStatus(query.status)) {
    countQ = countQ.where("status", "=", query.status);
  }

  const totalResult = await countQ.executeTakeFirst();
  const total = Number(totalResult?.count ?? 0);

  return {
    items,
    pagination: {
      page,
      pageSize,
      total,
      totalPages: Math.ceil(total / pageSize),
    },
  };
};

export const getOrderById = async (id: number) => {
  return await db
    .selectFrom("orders")
    .selectAll()
    .where("id", "=", id)
    .executeTakeFirst();
};

export const getOrderItems = async (orderId: number) => {
  return await db
    .selectFrom("order_items")
    .selectAll()
    .where("order_id", "=", orderId)
    .execute();
};

const generateOrderNumber = () => {
  return `ORD-${Date.now()}-${Math.floor(Math.random() * 10000)
    .toString()
    .padStart(4, "0")}`;
};

type PreparedItem = {
  product_id: number;
  quantity: number;
  unit_price: number;
  line_total: number;
};

const prepareItems = async (
  trx: Trx,
  items: OrderItemInput[]
): Promise<{ items: PreparedItem[]; total: number }> => {
  const merged = new Map<number, number>();

  for (const item of items) {
    if (!Number.isInteger(item.product_id) || item.product_id <= 0) {
      throw new OrderValidationError("Each order item must have a valid product_id");
    }

    if (!Number.isInteger(item.quantity) || item.quantity <= 0) {
      throw new OrderValidationError("Each order item must have a positive integer quantity");
    }

    merged.set(item.product_id, (merged.get(item.product_id) ?? 0) + item.quantity);
  }

  const productIds = [...merged.keys()];

  const products = await trx
    .selectFrom("products")
    .selectAll()
    .where("id", "in", productIds)
    .execute();

  if (products.length !== productIds.length) {
    throw new OrderValidationError("One or more products were not found");
  }

  const prepared: PreparedItem[] = [];
  let total = 0;

  for (const [productId, quantity] of merged.entries()) {
    const product = products.find((p) => p.id === productId)!;

    if (product.stock < quantity) {
      throw new OrderValidationError(
        `Insufficient stock for ${product.name} (available: ${product.stock})`
      );
    }

    const unit_price = Number(product.price);
    const line_total = unit_price * quantity;

    prepared.push({
      product_id: product.id,
      quantity,
      unit_price,
      line_total,
    });

    total += line_total;
  }

  return { items: prepared, total };
};

const adjustStock = async (
  trx: Trx,
  productId: number,
  change: number
) => {
  const product = await trx
    .selectFrom("products")
    .selectAll()
    .where("id", "=", productId)
    .executeTakeFirst();

  if (!product) {
    throw new OrderValidationError(`Product ${productId} was not found`);
  }

  const nextStock = product.stock + change;

  if (nextStock < 0) {
    throw new OrderValidationError(`Insufficient stock for product ${productId}`);
  }

  await trx
    .updateTable("products")
    .set({ stock: nextStock })
    .where("id", "=", productId)
    .execute();
};

export const createOrder = async (
  customer_id: number,
  items: OrderItemInput[],
  status?: string,
  created_by?: number | null,
  custom_fields: Record<string, unknown> = {}
) => {
  const finalStatus = status ?? "Pending";

  if (!isAllowedStatus(finalStatus)) {
    throw new OrderValidationError("Invalid order status");
  }

  return await db.transaction().execute(async (trx) => {
    const { items: prepared, total } = await prepareItems(trx, items);

    const order = await trx
      .insertInto("orders")
      .values({
        customer_id,
        order_number: generateOrderNumber(),
        status: finalStatus,
        total_amount: total,
        created_by: created_by ?? null,
        custom_fields,
        created_at: new Date(),
      })
      .returningAll()
      .executeTakeFirst();

    await trx
      .insertInto("order_items")
      .values(
        prepared.map((item) => ({
          order_id: order!.id,
          product_id: item.product_id,
          quantity: item.quantity,
          unit_price: item.unit_price,
        }))
      )
      .execute();

    for (const item of prepared) {
      await adjustStock(trx, item.product_id, -item.quantity);
    }

    return order;
  });
};

export const updateOrder = async (
  id: number,
  data: {
    status?: string;
    items?: OrderItemInput[];
    custom_fields?: Record<string, unknown>;
  }
) => {
  if (data.status !== undefined && !isAllowedStatus(data.status)) {
    throw new OrderValidationError("Invalid order status");
  }

  return await db.transaction().execute(async (trx) => {
    const existing = await trx
      .selectFrom("orders")
      .selectAll()
      .where("id", "=", id)
      .executeTakeFirst();

    if (!existing) {
      return undefined;
    }

    let total_amount: number | undefined;

    if (data.items !== undefined) {
      const oldItems = await trx
        .selectFrom("order_items")
        .selectAll()
        .where("order_id", "=", id)
        .execute();

      for (const old of oldItems) {
        await adjustStock(trx, old.product_id, old.quantity);
      }

      const { items: prepared, total } = await prepareItems(trx, data.items);

      await trx.deleteFrom("order_items").where("order_id", "=", id).execute();

      await trx
        .insertInto("order_items")
        .values(
          prepared.map((item) => ({
            order_id: id,
            product_id: item.product_id,
            quantity: item.quantity,
            unit_price: item.unit_price,
          }))
        )
        .execute();

      for (const item of prepared) {
        await adjustStock(trx, item.product_id, -item.quantity);
      }

      total_amount = total;
    }

    return await trx
      .updateTable("orders")
      .set({
        ...(data.status !== undefined && { status: data.status }),
        ...(total_amount !== undefined && { total_amount }),
        ...(data.custom_fields !== undefined && {
          custom_fields: data.custom_fields,
        }),
      })
      .where("id", "=", id)
      .returningAll()
      .executeTakeFirst();
  });
};

export const deleteOrder = async (id: number) => {
  return await db.transaction().execute(async (trx) => {
    const existing = await trx
      .selectFrom("orders")
      .selectAll()
      .where("id", "=", id)
      .executeTakeFirst();

    if (!existing) {
      return undefined;
    }

    const items = await trx
      .selectFrom("order_items")
      .selectAll()
      .where("order_id", "=", id)
      .execute();

    for (const item of items) {
      await adjustStock(trx, item.product_id, item.quantity);
    }

    await trx.deleteFrom("orders").where("id", "=", id).execute();

    return existing;
  });
};
