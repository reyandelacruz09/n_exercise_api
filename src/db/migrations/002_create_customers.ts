import { Kysely, sql } from "kysely";

export async function up(db: Kysely<any>) {
  await db.schema
    .createTable("customers")
    .addColumn("id", "serial", (col) => col.primaryKey())
    .addColumn("first_name", "varchar(100)", (col) =>
      col.notNull()
    )
    .addColumn("last_name", "varchar(100)", (col) =>
      col.notNull()
    )
    .addColumn("email", "varchar(255)", (col) =>
      col.unique()
    )
    .addColumn("phone", "varchar(50)")
    .addColumn("address", "text")
    .addColumn("created_at", "timestamp", (col) =>
      col.notNull().defaultTo(sql`now()`)
    )
    .execute();
}

export async function down(db: Kysely<any>) {
  await db.schema.dropTable("customers").execute();
}