import { Kysely, sql } from "kysely";

export async function up(db: Kysely<any>) {
  await db.schema
    .createTable("products")
    .addColumn("id", "serial", (col) => col.primaryKey())
    .addColumn("name", "varchar(255)", (col) => col.notNull())
    .addColumn("description", "text")
    .addColumn("price", "numeric")
    .addColumn("stock", "integer", (col) =>
      col.notNull().defaultTo(0)
    )
    .addColumn("created_at", "timestamp", (col) =>
      col.notNull().defaultTo(sql`now()`)
    )
    .execute();
}

export async function down(db: Kysely<any>) {
  await db.schema.dropTable("products").execute();
}