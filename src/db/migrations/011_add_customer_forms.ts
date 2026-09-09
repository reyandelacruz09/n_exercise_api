import { Kysely, sql } from "kysely";

export async function up(db: Kysely<any>) {
  await db.schema
    .alterTable("customers")
    .addColumn("password_hash", "varchar(255)")
    .execute();

  await db.schema
    .alterTable("customers")
    .addColumn("is_active", "boolean", (col) =>
      col.notNull().defaultTo(true)
    )
    .execute();

  await db.schema
    .alterTable("products")
    .addColumn("is_active", "boolean", (col) =>
      col.notNull().defaultTo(true)
    )
    .execute();

  await db.schema
    .createTable("form_templates")
    .addColumn("id", "serial", (col) => col.primaryKey())
    .addColumn("name", "varchar(100)", (col) => col.notNull())
    .addColumn("description", "text")
    .addColumn("active", "boolean", (col) =>
      col.notNull().defaultTo(true)
    )
    .addColumn("created_at", "timestamp", (col) =>
      col.notNull().defaultTo(sql`now()`)
    )
    .addColumn("updated_at", "timestamp", (col) =>
      col.notNull().defaultTo(sql`now()`)
    )
    .execute();

  await db.schema
    .createTable("form_template_fields")
    .addColumn("id", "serial", (col) => col.primaryKey())
    .addColumn("template_id", "integer", (col) => col.notNull())
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
      "fk_form_template_fields_template",
      ["template_id"],
      "form_templates",
      ["id"],
      (cb) => cb.onDelete("cascade")
    )
    .execute();

  await db.schema
    .alterTable("form_template_fields")
    .addUniqueConstraint("uq_form_template_fields_key", [
      "template_id",
      "field_key",
    ])
    .execute();

  await db.schema
    .createTable("customer_form_assignments")
    .addColumn("id", "serial", (col) => col.primaryKey())
    .addColumn("customer_id", "integer", (col) => col.notNull())
    .addColumn("template_id", "integer", (col) => col.notNull())
    .addColumn("created_at", "timestamp", (col) =>
      col.notNull().defaultTo(sql`now()`)
    )
    .addForeignKeyConstraint(
      "fk_customer_form_assignments_customer",
      ["customer_id"],
      "customers",
      ["id"],
      (cb) => cb.onDelete("cascade")
    )
    .addForeignKeyConstraint(
      "fk_customer_form_assignments_template",
      ["template_id"],
      "form_templates",
      ["id"],
      (cb) => cb.onDelete("cascade")
    )
    .execute();

  await db.schema
    .alterTable("customer_form_assignments")
    .addUniqueConstraint("uq_customer_form_assignments", [
      "customer_id",
      "template_id",
    ])
    .execute();

  await db.schema
    .createTable("customer_groups")
    .addColumn("id", "serial", (col) => col.primaryKey())
    .addColumn("name", "varchar(100)", (col) => col.notNull())
    .addColumn("template_id", "integer")
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
      "fk_customer_groups_template",
      ["template_id"],
      "form_templates",
      ["id"],
      (cb) => cb.onDelete("set null")
    )
    .execute();

  await db.schema
    .createTable("customer_group_members")
    .addColumn("id", "serial", (col) => col.primaryKey())
    .addColumn("group_id", "integer", (col) => col.notNull())
    .addColumn("customer_id", "integer", (col) => col.notNull())
    .addColumn("created_at", "timestamp", (col) =>
      col.notNull().defaultTo(sql`now()`)
    )
    .addForeignKeyConstraint(
      "fk_customer_group_members_group",
      ["group_id"],
      "customer_groups",
      ["id"],
      (cb) => cb.onDelete("cascade")
    )
    .addForeignKeyConstraint(
      "fk_customer_group_members_customer",
      ["customer_id"],
      "customers",
      ["id"],
      (cb) => cb.onDelete("cascade")
    )
    .execute();

  await db.schema
    .alterTable("customer_group_members")
    .addUniqueConstraint("uq_customer_group_members", [
      "group_id",
      "customer_id",
    ])
    .execute();
}

export async function down(db: Kysely<any>) {
  await db.schema.dropTable("customer_group_members").execute();
  await db.schema.dropTable("customer_groups").execute();
  await db.schema.dropTable("customer_form_assignments").execute();
  await db.schema.dropTable("form_template_fields").execute();
  await db.schema.dropTable("form_templates").execute();

  await db.schema
    .alterTable("products")
    .dropColumn("is_active")
    .execute();

  await db.schema
    .alterTable("customers")
    .dropColumn("is_active")
    .execute();

  await db.schema
    .alterTable("customers")
    .dropColumn("password_hash")
    .execute();
}