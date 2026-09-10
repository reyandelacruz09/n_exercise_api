import { describe, expect, it, beforeAll } from "vitest";

import db from "../src/db/database";
import { adminCookie, request, resetDb } from "./helpers";

describe("referential integrity", () => {
  beforeAll(async () => {
    await resetDb();
  });

  it("cascades form fields, assignments, and group members when a customer is deleted", async () => {
    const admin = await adminCookie();

    const res = await request
      .delete("/api/customers/4")
      .set("Cookie", admin);
    expect(res.status).toBe(200);

    const fields = await db
      .selectFrom("form_fields")
      .selectAll()
      .where("customer_id", "=", 4)
      .execute();
    expect(fields).toHaveLength(0);

    const assignments = await db
      .selectFrom("customer_form_assignments")
      .selectAll()
      .where("customer_id", "=", 4)
      .execute();
    expect(assignments).toHaveLength(0);

    const members = await db
      .selectFrom("customer_group_members")
      .selectAll()
      .where("customer_id", "=", 6)
      .execute();
    expect(members).toHaveLength(1);

    await request.delete("/api/customers/6").set("Cookie", admin);
    const membersAfter = await db
      .selectFrom("customer_group_members")
      .selectAll()
      .where("customer_id", "=", 6)
      .execute();
    expect(membersAfter).toHaveLength(0);
  });

  it("cascades template fields and assignments when a template is deleted", async () => {
    const admin = await adminCookie();

    // reassign customer 5 first so we can observe the cascade cleanly
    await request
      .put("/api/customers/5/form-assignment")
      .set("Cookie", admin)
      .send({ template_id: 2 });

    const res = await request
      .delete("/api/form-templates/2")
      .set("Cookie", admin);
    expect(res.status).toBe(200);

    const fields = await db
      .selectFrom("form_template_fields")
      .selectAll()
      .where("template_id", "=", 2)
      .execute();
    expect(fields).toHaveLength(0);

    const assignments = await db
      .selectFrom("customer_form_assignments")
      .selectAll()
      .where("template_id", "=", 2)
      .execute();
    expect(assignments).toHaveLength(0);
  });

  it("sets a customer group template to null when the template is deleted", async () => {
    const admin = await adminCookie();

    const res = await request
      .delete("/api/form-templates/1")
      .set("Cookie", admin);
    expect(res.status).toBe(200);

    const groups = await db
      .selectFrom("customer_groups")
      .selectAll()
      .where("id", "=", 1)
      .executeTakeFirst();
    expect(groups?.template_id).toBeNull();
  });

  it("cascades group members when a group is deleted", async () => {
    const admin = await adminCookie();

    const membersBefore = await db
      .selectFrom("customer_group_members")
      .selectAll()
      .where("group_id", "=", 2)
      .execute();
    expect(membersBefore.length).toBeGreaterThan(0);

    const res = await request
      .delete("/api/groups/2")
      .set("Cookie", admin);
    expect(res.status).toBe(200);

    const membersAfter = await db
      .selectFrom("customer_group_members")
      .selectAll()
      .where("group_id", "=", 2)
      .execute();
    expect(membersAfter).toHaveLength(0);
  });
});