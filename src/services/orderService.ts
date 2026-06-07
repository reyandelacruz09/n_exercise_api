import db from "../db/database";

export const getOrders = async () => {
  return await db
    .selectFrom("orders")
    .selectAll()
    .execute();
};

export const getOrderById = async (id: number) => {
  return await db
    .selectFrom("orders")
    .selectAll()
    .where("id", "=", id)
    .executeTakeFirst();
};

export const createOrder = async (
  customer_id: number,
  total_amount: number
) => {
  return await db
    .insertInto("orders")
    .values({
      customer_id,
      total_amount,
      created_at: new Date(),
    })
    .returningAll()
    .executeTakeFirst();
};

export const updateOrder = async (
  id: number,
  data: {
    total_amount?: number;
  }
) => {
  return await db
    .updateTable("orders")
    .set(data)
    .where("id", "=", id)
    .returningAll()
    .executeTakeFirst();
};

export const deleteOrder = async (id: number) => {
  return await db
    .deleteFrom("orders")
    .where("id", "=", id)
    .executeTakeFirst();
};