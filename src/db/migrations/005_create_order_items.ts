import { Kysely } from "kysely";

export async function up(db: Kysely<any>) {
  await db.schema
    .createTable("order_items")
    .addColumn("id", "serial", (col) => col.primaryKey())
    .addColumn("order_id", "integer", (col) =>
      col.notNull()
    )
    .addColumn("product_id", "integer", (col) =>
      col.notNull()
    )
    .addColumn("quantity", "integer", (col) =>
      col.notNull()
    )
    .addColumn("unit_price", "numeric", (col) =>
      col.notNull()
    )
    .addForeignKeyConstraint(
      "fk_order_items_order",
      ["order_id"],
      "orders",
      ["id"],
      (cb) => cb.onDelete("cascade")
    )
    .addForeignKeyConstraint(
      "fk_order_items_product",
      ["product_id"],
      "products",
      ["id"]
    )
    .execute();
}

export async function down(db: Kysely<any>) {
  await db.schema.dropTable("order_items").execute();
}