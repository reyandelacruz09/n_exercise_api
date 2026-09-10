import { Migrator, type Migration, type MigrationProvider } from "kysely";
import { Pool } from "pg";

import * as m001 from "../src/db/migrations/001_create_products";
import * as m002 from "../src/db/migrations/002_create_customers";
import * as m003 from "../src/db/migrations/003_create_users";
import * as m004 from "../src/db/migrations/004_create_orders";
import * as m005 from "../src/db/migrations/005_create_order_items";
import * as m006 from "../src/db/migrations/006_create_stock_transactions";
import * as m007 from "../src/db/migrations/007_create_audit_logs";
import * as m008 from "../src/db/migrations/008_create_permissions";
import * as m009 from "../src/db/migrations/009_create_form_fields";
import * as m010 from "../src/db/migrations/010_add_orders_custom_fields";
import * as m011 from "../src/db/migrations/011_add_customer_forms";

const ADMIN_DB_URL =
  process.env.TEST_ADMIN_URL ??
  "postgres://postgres:password@localhost:5432/postgres";

const TEST_DB_URL =
  process.env.TEST_DATABASE_URL ??
  "postgres://postgres:password@localhost:5432/n_api_test";

process.env.DATABASE_URL = TEST_DB_URL;

if (!process.env.JWT_SECRET) {
  process.env.JWT_SECRET = "test-jwt-secret";
}

const dbName = new URL(TEST_DB_URL).pathname.replace(/^\//, "");

const adminPool = new Pool({ connectionString: ADMIN_DB_URL });

try {
  const exists = await adminPool.query(
    "SELECT 1 FROM pg_database WHERE datname = $1",
    [dbName]
  );

  if (exists.rowCount === 0) {
    await adminPool.query(`CREATE DATABASE ${dbName}`);
  }
} finally {
  await adminPool.end();
}

const { default: db } = await import("../src/db/database");

const migrationModules: Array<[string, Migration]> = [
  ["001_create_products", m001],
  ["002_create_customers", m002],
  ["003_create_users", m003],
  ["004_create_orders", m004],
  ["005_create_order_items", m005],
  ["006_create_stock_transactions", m006],
  ["007_create_audit_logs", m007],
  ["008_create_permissions", m008],
  ["009_create_form_fields", m009],
  ["010_add_orders_custom_fields", m010],
  ["011_add_customer_forms", m011],
];

const provider: MigrationProvider = {
  async getMigrations() {
    return Object.fromEntries(migrationModules);
  },
};

const migrator = new Migrator({ db, provider });

const result = await migrator.migrateToLatest();

if (result.error) {
  throw result.error;
}