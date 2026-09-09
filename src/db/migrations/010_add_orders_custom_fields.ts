import { Kysely } from "kysely";

export async function up(db: Kysely<any>) {
  await db.schema
    .alterTable("orders")
    .addColumn("custom_fields", "jsonb")
    .execute();
}

export async function down(db: Kysely<any>) {
  await db.schema.alterTable("orders").dropColumn("custom_fields").execute();
}