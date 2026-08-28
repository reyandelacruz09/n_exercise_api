import { sql } from "kysely";
import db from "../db/database";

export const dashboardService = {
  getCounts: async () => {
    const [ordersResult, productsResult, customersResult] = await Promise.all([
      db
        .selectFrom("orders")
        .select(db.fn.count("id").as("count"))
        .executeTakeFirst(),
      db
        .selectFrom("products")
        .select(db.fn.count("id").as("count"))
        .executeTakeFirst(),
      db
        .selectFrom("customers")
        .select(db.fn.count("id").as("count"))
        .executeTakeFirst(),
    ]);

    return {
      totalOrders: Number(ordersResult?.count ?? 0),
      totalProducts: Number(productsResult?.count ?? 0),
      totalCustomers: Number(customersResult?.count ?? 0),
    };
  },

  getMonthlyOrders: async () => {
    const rows = await sql<{ month: string; count: number }>`
      SELECT
        to_char(created_at, 'YYYY-MM') AS month,
        COUNT(id) AS count
      FROM orders
      GROUP BY to_char(created_at, 'YYYY-MM')
      ORDER BY month ASC
    `.execute(db);

    return rows.rows.map((row) => ({
      month: row.month,
      count: Number(row.count),
    }));
  },

  getRecentOrders: async () => {
    const rows = await db
      .selectFrom("orders")
      .select(["id", "order_number", "status", "total_amount", "created_at"])
      .orderBy("created_at", "desc")
      .limit(5)
      .execute();

    return rows.map((row) => ({
      ...row,
      created_at:
        row.created_at instanceof Date
          ? row.created_at.toISOString()
          : String(row.created_at),
    }));
  },
};
