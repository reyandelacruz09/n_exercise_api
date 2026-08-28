import { Kysely, sql } from "kysely";

export async function up(db: Kysely<any>) {
  await db.schema
    .createTable("orders")
    .addColumn("id", "serial", (col) => col.primaryKey())
    .addColumn("customer_id", "integer", (col) =>
      col.notNull()
    )
    .addColumn("order_number", "varchar(50)", (col) =>
      col.notNull().unique()
    )
    .addColumn("status", "varchar(50)", (col) =>
      col.notNull().defaultTo("Pending")
    )
    .addColumn("total_amount", "numeric", (col) =>
      col.notNull().defaultTo(0)
    )
    .addColumn("created_by", "integer")
    .addColumn("created_at", "timestamp", (col) =>
      col.notNull().defaultTo(sql`now()`)
    )
    .addForeignKeyConstraint(
      "fk_orders_customer",
      ["customer_id"],
      "customers",
      ["id"]
    )
    .addForeignKeyConstraint(
      "fk_orders_user",
      ["created_by"],
      "users",
      ["id"]
    )
    .execute();
}

export async function down(db: Kysely<any>) {
  await db.schema.dropTable("orders").execute();
}