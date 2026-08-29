import { Kysely, sql } from "kysely";

export async function up(db: Kysely<any>) {
  await db.schema
    .createTable("permissions")
    .addColumn("id", "serial", (col) => col.primaryKey())
    .addColumn("name", "varchar(100)", (col) => col.notNull().unique())
    .addColumn("created_at", "timestamp", (col) =>
      col.notNull().defaultTo(sql`now()`)
    )
    .execute();

  await db.schema
    .createTable("role_permissions")
    .addColumn("id", "serial", (col) => col.primaryKey())
    .addColumn("role", "varchar(50)", (col) => col.notNull())
    .addColumn("permission_id", "integer", (col) =>
      col.references("permissions.id").onDelete("cascade").notNull()
    )
    .execute();

  await db.schema
    .createIndex("idx_role_permissions_role")
    .on("role_permissions")
    .columns(["role"])
    .execute();

  const permissions = [
    "dashboard.view",
    "products.view",
    "products.manage",
    "orders.view",
    "orders.manage",
    "customers.view",
    "customers.manage",
    "inventory.view",
    "inventory.manage",
    "audit.view",
    "users.manage",
  ];

  const inserted = await db
    .insertInto("permissions")
    .values(permissions.map((name) => ({ name })))
    .returningAll()
    .execute();

  const byName = new Map(inserted.map((p) => [p.name, p.id]));

  // Admin role gets every permission.
  await db
    .insertInto("role_permissions")
    .values(inserted.map((p) => ({ role: "admin", permission_id: p.id })))
    .execute();

  // Regular "user" role: view-only access.
  const userPermissions = [
    "dashboard.view",
    "products.view",
    "orders.view",
    "customers.view",
  ];

  await db
    .insertInto("role_permissions")
    .values(
      userPermissions
        .map((name) => byName.get(name))
        .filter((id): id is number => id !== undefined)
        .map((id) => ({ role: "user", permission_id: id }))
    )
    .execute();
}

export async function down(db: Kysely<any>) {
  await db.schema.dropTable("role_permissions").execute();
  await db.schema.dropTable("permissions").execute();
}
