import db from "../db/database";

export class StockTransactionValidationError extends Error {}

export const TRANSACTION_TYPES = ["in", "out", "adjust"] as const;

export type TransactionType = (typeof TRANSACTION_TYPES)[number];

export const stockTransactionService = {
  createTransaction: async (data: {
    product_id: number;
    quantity: number;
    type: string;
    cost_price?: number | null;
    note?: string | null;
    created_by?: number | null;
  }) => {
    return await db.transaction().execute(async (trx) => {
      const product = await trx
        .selectFrom("products")
        .selectAll()
        .where("id", "=", data.product_id)
        .executeTakeFirst();

      if (!product) {
        throw new StockTransactionValidationError("Product not found");
      }

      if (!Number.isInteger(data.quantity) || data.quantity <= 0) {
        throw new StockTransactionValidationError(
          "Quantity must be a positive integer"
        );
      }

      if (data.type !== "in" && data.type !== "out" && data.type !== "adjust") {
        throw new StockTransactionValidationError("Invalid transaction type");
      }

      const change =
        data.type === "in" ? data.quantity : -data.quantity;

      const newStock = product.stock + change;

      if (newStock < 0) {
        throw new StockTransactionValidationError(
          `Insufficient stock for ${product.name} (available: ${product.stock})`
        );
      }

      await trx
        .updateTable("products")
        .set({ stock: newStock })
        .where("id", "=", data.product_id)
        .execute();

      return await trx
        .insertInto("stock_transactions")
        .values({
          product_id: data.product_id,
          quantity: change,
          type: data.type,
          cost_price: data.cost_price ?? null,
          note: data.note ?? null,
          created_by: data.created_by ?? null,
        })
        .returningAll()
        .executeTakeFirst();
    });
  },

  getTransactions: async (productId?: number) => {
    let q = db
      .selectFrom("stock_transactions")
      .selectAll()
      .orderBy("created_at", "desc")
      .limit(100);

    if (productId) {
      q = q.where("product_id", "=", productId);
    }

    return await q.execute();
  },

  getLowStock: async () => {
    return await db
      .selectFrom("products")
      .select(["id", "name", "stock", "reorder_level"])
      .where("reorder_level", "is not", null)
      .where((eb) =>
        eb.or([
          eb("stock", "<=", eb.ref("reorder_level")),
        ])
      )
      .orderBy("stock", "asc")
      .execute();
  },
};
