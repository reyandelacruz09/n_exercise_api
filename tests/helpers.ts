import bcrypt from "bcrypt";
import supertest from "supertest";
import { sql } from "kysely";

import app from "../src/app";
import db from "../src/db/database";

const toJson = (value: unknown) =>
  sql`${JSON.stringify(value)}::jsonb`;

export const request = supertest(app);

const hashCache = new Map<string, string>();

async function hash(pw: string): Promise<string> {
  let cached = hashCache.get(pw);

  if (!cached) {
    cached = await bcrypt.hash(pw, 4);
    hashCache.set(pw, cached);
  }

  return cached;
}

const TRUNCATE_TABLES = [
  "users",
  "customers",
  "products",
  "orders",
  "order_items",
  "stock_transactions",
  "audit_logs",
  "form_fields",
  "form_templates",
  "form_template_fields",
  "customer_form_assignments",
  "customer_groups",
  "customer_group_members",
];

export const resetDb = async () => {
  await sql`TRUNCATE TABLE ${sql.raw(
    TRUNCATE_TABLES.join(", ")
  )} RESTART IDENTITY CASCADE`.execute(db);

  const adminHash = await hash("password123");
  const customerPasses = {
    c1: await hash("portal123"),
    c4: await hash("fields123"),
    c5: await hash("tpl123456"),
    c6: await hash("grp123456"),
    c7: await hash("plain1234"),
  };

  await db.insertInto("users").values([
    { username: "admin", email: "admin@test.com", role: "admin", password_hash: adminHash },
    { username: "staff", email: "staff@test.com", role: "user", password_hash: adminHash },
  ]).execute();

  await db.insertInto("customers").values([
    { first_name: "One", last_name: "Customer", email: "one@test.com", phone: "1", password_hash: customerPasses.c1, is_active: true },
    { first_name: "Two", last_name: "Customer", email: "two@test.com", phone: "2", password_hash: null, is_active: true },
    { first_name: "Three", last_name: "Customer", email: "three@test.com", phone: "3", password_hash: adminHash, is_active: false },
    { first_name: "Fields", last_name: "Customer", email: "fields@test.com", phone: "4", password_hash: customerPasses.c4, is_active: true },
    { first_name: "Tpl", last_name: "Customer", email: "tpl@test.com", phone: "5", password_hash: customerPasses.c5, is_active: true },
    { first_name: "Grp", last_name: "Customer", email: "grp@test.com", phone: "6", password_hash: customerPasses.c6, is_active: true },
    { first_name: "Plain", last_name: "Customer", email: "plain@test.com", phone: "7", password_hash: customerPasses.c7, is_active: true },
  ]).execute();

  await db.insertInto("products").values([
    { name: "Widget", price: 100, stock: 10, cost_price: 50, reorder_level: 5, is_active: true },
    { name: "Gadget", price: 50, stock: 0, cost_price: 20, reorder_level: 5, is_active: true },
    { name: "Archived", price: 200, stock: 5, cost_price: 100, reorder_level: 5, is_active: false },
  ]).execute();

  await db.insertInto("form_templates").values([
    { name: "Material Request", description: "Standard request", active: true },
    { name: "Legacy", description: "Retired template", active: false },
  ]).execute();

  await db.insertInto("form_template_fields").values([
    { template_id: 1, label: "Quantity Needed", field_key: "quantity_needed", field_type: "text", required: true, sort_order: 1, active: true },
    { template_id: 1, label: "Approver", field_key: "approver", field_type: "select", options: toJson([{ label: "CEO", value: "ceo" }, { label: "Manager", value: "manager" }]), required: false, sort_order: 2, active: true },
    { template_id: 2, label: "Old Field", field_key: "obsolete", field_type: "text", required: false, sort_order: 1, active: true },
  ]).execute();

  await db.insertInto("customer_groups").values([
    { name: "Distributors", template_id: 1, active: true },
    { name: "Inactive Group", template_id: 2, active: false },
  ]).execute();

  await db.insertInto("customer_form_assignments").values([
    { customer_id: 4, template_id: 2 },
    { customer_id: 5, template_id: 1 },
  ]).execute();

  await db.insertInto("customer_group_members").values([
    { group_id: 1, customer_id: 6 },
    { group_id: 2, customer_id: 7 },
  ]).execute();

  await db.insertInto("form_fields").values([
    { customer_id: 4, label: "Special Notes", field_key: "notes", field_type: "text", required: true, sort_order: 1, active: true },
  ]).execute();
};

export async function adminCookie(): Promise<string> {
  const res = await request.post("/auth/login").send({
    email: "admin@test.com",
    password: "password123",
  });
  return res.headers["set-cookie"]?.[0]?.split(";")[0] ?? "";
}

export async function staffCookie(): Promise<string> {
  const res = await request.post("/auth/login").send({
    email: "staff@test.com",
    password: "password123",
  });
  return res.headers["set-cookie"]?.[0]?.split(";")[0] ?? "";
}

export async function customerCookie(
  email: string,
  password: string
): Promise<string> {
  const res = await request
    .post("/auth/customer/login")
    .send({ email, password });
  return res.headers["set-cookie"]?.[0]?.split(";")[0] ?? "";
}