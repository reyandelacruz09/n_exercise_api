import { describe, expect, it, beforeAll } from "vitest";

import { customerCookie, request, resetDb } from "./helpers";

describe("customer portal", () => {
  beforeAll(async () => {
    await resetDb();
  });

  it("logs in an active customer and exposes /auth/customer/me", async () => {
    const login = await request.post("/auth/customer/login").send({
      email: "one@test.com",
      password: "portal123",
    });
    expect(login.status).toBe(200);
    expect(login.body.customer.email).toBe("one@test.com");

    const cookie = login.headers["set-cookie"]?.[0]?.split(";")[0] ?? "";
    const me = await request
      .get("/auth/customer/me")
      .set("Cookie", cookie);
    expect(me.status).toBe(200);
    expect(me.body.customer.first_name).toBe("One");
  });

  it("rejects a customer without a password yet", async () => {
    const res = await request.post("/auth/customer/login").send({
      email: "two@test.com",
      password: "anything",
    });
    expect(res.status).toBe(401);
  });

  it("rejects an inactive customer account", async () => {
    const res = await request.post("/auth/customer/login").send({
      email: "three@test.com",
      password: "password123",
    });
    expect(res.status).toBe(403);
  });

  it("exposes only active products with stock in the catalog", async () => {
    const res = await request
      .get("/api/customer/catalog")
      .set("Cookie", await customerCookie("one@test.com", "portal123"));

    expect(res.status).toBe(200);
    expect(res.body.map((p: { name: string }) => p.name)).toEqual(["Widget"]);
  });

  it("places an order, deducts stock, and stores custom fields", async () => {
    const cookie = await customerCookie("plain@test.com", "plain1234");

    const res = await request
      .post("/api/customer/orders")
      .set("Cookie", cookie)
      .send({ items: [{ product_id: 1, quantity: 2 }] });

    expect(res.status).toBe(201);
    expect(Number(res.body.order.total_amount)).toBe(200);
    expect(res.body.order.customer_id).toBe(7);

    const catalog = await request
      .get("/api/customer/catalog")
      .set("Cookie", cookie);
    const widget = catalog.body.find((p: { name: string }) => p.name === "Widget");
    expect(widget.stock).toBe(8);

    const orders = await request
      .get("/api/customer/orders")
      .set("Cookie", cookie);
    expect(orders.status).toBe(200);
    expect(orders.body).toHaveLength(1);
    expect(orders.body[0].order_number).toBeDefined();
  });

  it("rejects orders exceeding stock", async () => {
    const cookie = await customerCookie("one@test.com", "portal123");
    const res = await request
      .post("/api/customer/orders")
      .set("Cookie", cookie)
      .send({ items: [{ product_id: 1, quantity: 999 }] });
    expect(res.status).toBe(400);
  });

  it("rejects empty order items", async () => {
    const cookie = await customerCookie("one@test.com", "portal123");
    const res = await request
      .post("/api/customer/orders")
      .set("Cookie", cookie)
      .send({ items: [] });
    expect(res.status).toBe(400);
  });

  it("enforces required custom fields when placing an order", async () => {
    const cookie = await customerCookie("fields@test.com", "fields123");

    const missing = await request
      .post("/api/customer/orders")
      .set("Cookie", cookie)
      .send({ items: [{ product_id: 1, quantity: 1 }] });
    expect(missing.status).toBe(400);
    expect(missing.body.message).toContain("Special Notes");

    const ok = await request
      .post("/api/customer/orders")
      .set("Cookie", cookie)
      .send({
        items: [{ product_id: 1, quantity: 1 }],
        custom_fields: { notes: "Handle with care" },
      });
    expect(ok.status).toBe(201);
    expect(ok.body.order.custom_fields).toEqual({ notes: "Handle with care" });
  });

  it("keeps orders isolated between customers", async () => {
    const own = request.post("/api/customer/orders").set(
      "Cookie",
      await customerCookie("one@test.com", "portal123")
    );
    const created = await own.send({
      items: [{ product_id: 1, quantity: 1 }],
    });
    expect(created.status).toBe(201);

    const other = await request
      .get(`/api/customer/orders/${created.body.order.id}`)
      .set("Cookie", await customerCookie("plain@test.com", "plain1234"));
    expect(other.status).toBe(404);
  });
});