import { describe, expect, it, beforeAll } from "vitest";

import { adminCookie, request, resetDb } from "./helpers";

describe("customer management API", () => {
  beforeAll(async () => {
    await resetDb();
  });

  it("lists customers", async () => {
    const admin = await adminCookie();
    const res = await request.get("/api/customers").set("Cookie", admin);
    expect(res.status).toBe(200);
    expect(res.body).toHaveLength(7);
    expect(res.body[0].email).toBe("one@test.com");
  });

  it("creates a customer", async () => {
    const admin = await adminCookie();
    const res = await request
      .post("/api/customers")
      .set("Cookie", admin)
      .send({
        first_name: "New",
        last_name: "Customer",
        email: "new@test.com",
        phone: "12345",
      });
    expect(res.status).toBe(201);
    expect(res.body.customer.email).toBe("new@test.com");
  });

  it("reports password status as not set", async () => {
    const admin = await adminCookie();
    const res = await request
      .get("/api/customers/2/password-status")
      .set("Cookie", admin);
    expect(res.status).toBe(200);
    expect(res.body).toEqual({ has_password: false, email: "two@test.com" });
  });

  it("sets a customer password then reflects it in status", async () => {
    const admin = await adminCookie();

    const set = await request
      .put("/api/customers/2/password")
      .set("Cookie", admin)
      .send({ password: "abcdef12" });
    expect(set.status).toBe(200);

    const status = await request
      .get("/api/customers/2/password-status")
      .set("Cookie", admin);
    expect(status.body.has_password).toBe(true);
  });

  it("validates password length", async () => {
    const admin = await adminCookie();
    const res = await request
      .put("/api/customers/1/password")
      .set("Cookie", admin)
      .send({ password: "abc" });
    expect(res.status).toBe(400);
  });

  it("returns 404 for password status of a missing customer", async () => {
    const admin = await adminCookie();
    const res = await request
      .get("/api/customers/999/password-status")
      .set("Cookie", admin);
    expect(res.status).toBe(404);
  });

  it("reads and clears a form template assignment", async () => {
    const admin = await adminCookie();

    const assigned = await request
      .get("/api/customers/5/form-assignment")
      .set("Cookie", admin);
    expect(assigned.status).toBe(200);
    expect(assigned.body.template_id).toBe(1);

    const cleared = await request
      .put("/api/customers/5/form-assignment")
      .set("Cookie", admin)
      .send({ template_id: null });
    expect(cleared.status).toBe(200);
    expect(cleared.body.template_id).toBe(null);

    const after = await request
      .get("/api/customers/5/form-assignment")
      .set("Cookie", admin);
    expect(after.body.template_id).toBe(null);
  });

  it("rejects assignment to a missing template", async () => {
    const admin = await adminCookie();
    const res = await request
      .put("/api/customers/1/form-assignment")
      .set("Cookie", admin)
      .send({ template_id: 999 });
    expect(res.status).toBe(404);
  });
});