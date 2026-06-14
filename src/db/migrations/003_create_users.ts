import { Kysely, sql } from "kysely";

export async function up(db: Kysely<any>) {
  await db.schema
    .createTable("users")
    .addColumn("id", "serial", (col) => col.primaryKey())
    .addColumn("username", "varchar(100)", (col) =>
      col.notNull().unique()
    )
    .addColumn("email", "varchar(255)", (col) =>
      col.notNull().unique()
    )
    .addColumn("password_hash", "text", (col) =>
      col.notNull()
    )
    .addColumn("role", "varchar(50)", (col) =>
      col.notNull().defaultTo("user")
    )
    .addColumn("created_at", "timestamp", (col) =>
      col.notNull().defaultTo(sql`now()`)
    )
    .execute();
}

export async function down(db: Kysely<any>) {
  await db.schema.dropTable("users").execute();
}