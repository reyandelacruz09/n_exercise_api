import { Kysely, sql } from "kysely";

export async function up(db: Kysely<any>) {
  await db.schema
    .createTable("form_fields")
    .addColumn("id", "serial", (col) => col.primaryKey())
    .addColumn("customer_id", "integer", (col) => col.notNull())
    .addColumn("label", "varchar(100)", (col) => col.notNull())
    .addColumn("field_key", "varchar(100)", (col) => col.notNull())
    .addColumn("field_type", "varchar(50)", (col) => col.notNull())
    .addColumn("options", "jsonb")
    .addColumn("required", "boolean", (col) =>
      col.notNull().defaultTo(false)
    )
    .addColumn("placeholder", "varchar(255)")
    .addColumn("sort_order", "integer", (col) =>
      col.notNull().defaultTo(0)
    )
    .addColumn("active", "boolean", (col) =>
      col.notNull().defaultTo(true)
    )
    .addColumn("created_at", "timestamp", (col) =>
      col.notNull().defaultTo(sql`now()`)
    )
    .addColumn("updated_at", "timestamp", (col) =>
      col.notNull().defaultTo(sql`now()`)
    )
    .addForeignKeyConstraint(
      "fk_form_fields_customer",
      ["customer_id"],
      "customers",
      ["id"],
      (cb) => cb.onDelete("cascade")
    )
    .execute();

  await db.schema
    .alterTable("form_fields")
    .addUniqueConstraint("uq_form_fields_customer_key", [
      "customer_id",
      "field_key",
    ])
    .execute();

  await db.schema
    .createIndex("idx_form_fields_customer_sort")
    .on("form_fields")
    .columns(["customer_id", "sort_order"])
    .execute();
}

export async function down(db: Kysely<any>) {
  await db.schema.dropTable("form_fields").execute();
}