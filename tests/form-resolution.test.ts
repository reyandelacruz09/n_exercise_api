import { describe, expect, it, beforeAll } from "vitest";

import { customerCookie, request, resetDb } from "./helpers";

async function getForm(email: string, password: string) {
  const cookie = await customerCookie(email, password);
  return request.get("/api/customer/form").set("Cookie", cookie);
}

describe("form resolution precedence", () => {
  beforeAll(async () => {
    await resetDb();
  });

  it("requires authentication", async () => {
    const res = await request.get("/api/customer/form");
    expect(res.status).toBe(401);
  });

  it("uses the customer's own fields over a direct template assignment", async () => {
    const res = await getForm("fields@test.com", "fields123");
    expect(res.status).toBe(200);

    expect(res.body).toHaveLength(1);
    expect(res.body[0]).toMatchObject({
      source_type: "customer",
      label: "Special Notes",
      field_key: "notes",
      required: true,
    });
  });

  it("falls back to a directly assigned template", async () => {
    const res = await getForm("tpl@test.com", "tpl123456");
    expect(res.status).toBe(200);

    expect(res.body.map((f: { field_key: string }) => f.field_key)).toEqual([
      "quantity_needed",
      "approver",
    ]);
    expect(res.body[0].source_type).toBe("template");
  });

  it("falls back to the group template when no direct assignment exists", async () => {
    const res = await getForm("grp@test.com", "grp123456");
    expect(res.status).toBe(200);

    expect(res.body.map((f: { field_key: string }) => f.field_key)).toEqual([
      "quantity_needed",
      "approver",
    ]);
    expect(res.body[0].source_type).toBe("group");
  });

  it("skips inactive group templates and inactive groups", async () => {
    // customer 7 belongs to group 2, which is inactive -> empty form
    const res = await getForm("plain@test.com", "plain1234");
    expect(res.status).toBe(200);
    expect(res.body).toEqual([]);
  });
});