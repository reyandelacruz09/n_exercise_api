import { Kysely, sql } from "kysely";

export async function up(db: Kysely<any>) {
  await db.schema
    .createTable("audit_logs")
    .addColumn("id", "serial", (col) => col.primaryKey())
    .addColumn("entity", "varchar(50)", (col) => col.notNull())
    .addColumn("action", "varchar(20)", (col) => col.notNull())
    .addColumn("entity_id", "integer")
    .addColumn("description", "text")
    .addColumn("user_id", "integer")
    .addColumn("created_at", "timestamp", (col) =>
      col.notNull().defaultTo(sql`now()`)
    )
    .addForeignKeyConstraint(
      "fk_audit_logs_user",
      ["user_id"],
      "users",
      ["id"]
    )
    .execute();

  await db.schema
    .createIndex("idx_audit_logs_entity")
    .on("audit_logs")
    .columns(["entity", "created_at"])
    .execute();
}

export async function down(db: Kysely<any>) {
  await db.schema.dropTable("audit_logs").execute();
}
