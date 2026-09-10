import { describe, expect, it, beforeAll } from "vitest";

import { adminCookie, request, resetDb, staffCookie } from "./helpers";

describe("staff authentication", () => {
  beforeAll(async () => {
    await resetDb();
  });

  it("logs in an admin and returns permissions", async () => {
    const res = await request.post("/auth/login").send({
      email: "admin@test.com",
      password: "password123",
    });

    expect(res.status).toBe(200);
    expect(res.body.user.email).toBe("admin@test.com");
    expect(res.body.user.role).toBe("admin");
    expect(res.body.user.permissions).toContain("users.manage");
  });

  it("rejects invalid credentials", async () => {
    const res = await request.post("/auth/login").send({
      email: "admin@test.com",
      password: "wrong-password",
    });

    expect(res.status).toBe(401);
  });

  it("requires a token on /auth/me", async () => {
    const res = await request.get("/auth/me");
    expect(res.status).toBe(401);
  });

  it("returns the current user via cookie", async () => {
    const cookie = await adminCookie();
    const res = await request.get("/auth/me").set("Cookie", cookie);
    expect(res.status).toBe(200);
    expect(res.body.user.email).toBe("admin@test.com");
  });

  it("rejects a forged/expired token", async () => {
    const res = await request
      .get("/auth/me")
      .set("Authorization", "Bearer not-a-real-token");
    expect(res.status).toBe(403);
  });
});

describe("RBAC permission matrix", () => {
  beforeAll(async () => {
    await resetDb();
  });

  it("lets a regular user view customers but not manage them", async () => {
    const staff = await staffCookie();

    const view = await request.get("/api/customers").set("Cookie", staff);
    expect(view.status).toBe(200);
    expect(view.body).toHaveLength(7);

    const manage = await request
      .post("/api/customers")
      .set("Cookie", staff)
      .send({
        first_name: "Blocked",
        last_name: "User",
        email: "blocked@test.com",
        phone: "000",
      });
    expect(manage.status).toBe(403);
  });

  it("forbids a regular user from creating products", async () => {
    const staff = await staffCookie();
    const res = await request
      .post("/api/products")
      .set("Cookie", staff)
      .send({ name: "Hacker", price: 1, stock: 1 });
    expect(res.status).toBe(403);
  });

  it("lets a regular user create nothing under orders.manage permission", async () => {
    const staff = await staffCookie();
    const res = await request
      .get("/api/customers/1/form-assignment")
      .set("Cookie", staff);
    expect(res.status).toBe(403);
  });

  it("admins can create products", async () => {
    const admin = await adminCookie();
    const res = await request
      .post("/api/products")
      .set("Cookie", admin)
      .send({ name: "Test Product", price: 99, stock: 3 });
    expect(res.status).toBe(201);
    expect(res.body.product.name).toBe("Test Product");
  });

  it("blocks unauthenticated access to protected routes", async () => {
    const res = await request.get("/api/products");
    expect(res.status).toBe(401);
  });
});