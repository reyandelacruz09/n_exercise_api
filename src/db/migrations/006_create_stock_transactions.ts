import { Kysely, sql } from "kysely";

export async function up(db: Kysely<any>) {
  await db.schema
    .alterTable("products")
    .addColumn("cost_price", "numeric")
    .addColumn("reorder_level", "integer", (col) => col.defaultTo(10))
    .execute();

  await db.schema
    .createTable("stock_transactions")
    .addColumn("id", "serial", (col) => col.primaryKey())
    .addColumn("product_id", "integer", (col) => col.notNull())
    .addColumn("quantity", "integer", (col) => col.notNull())
    .addColumn("type", "varchar(20)", (col) => col.notNull())
    .addColumn("cost_price", "numeric")
    .addColumn("note", "text")
    .addColumn("created_by", "integer")
    .addColumn("created_at", "timestamp", (col) =>
      col.notNull().defaultTo(sql`now()`)
    )
    .addForeignKeyConstraint(
      "fk_stock_transactions_product",
      ["product_id"],
      "products",
      ["id"]
    )
    .addForeignKeyConstraint(
      "fk_stock_transactions_user",
      ["created_by"],
      "users",
      ["id"]
    )
    .execute();
}

export async function down(db: Kysely<any>) {
  await db.schema.dropTable("stock_transactions").execute();
  await db.schema.alterTable("products").dropColumn("cost_price").execute();
  await db.schema.alterTable("products").dropColumn("reorder_level").execute();
}
