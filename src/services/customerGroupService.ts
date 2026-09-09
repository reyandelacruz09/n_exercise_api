import db from "../db/database";

export class GroupValidationError extends Error {}

export const customerGroupService = {
  getGroups: async () => {
    const groups = await db
      .selectFrom("customer_groups")
      .selectAll()
      .orderBy("created_at", "desc")
      .execute();

    const result = [];

    for (const group of groups) {
      const memberCount = await db
        .selectFrom("customer_group_members")
        .select(db.fn.count("id").as("count"))
        .where("group_id", "=", group.id)
        .executeTakeFirst();

      const template = group.template_id
        ? await db
            .selectFrom("form_templates")
            .select(["id", "name", "active"])
            .where("id", "=", group.template_id)
            .executeTakeFirst()
        : null;

      result.push({
        ...group,
        member_count: Number(memberCount?.count ?? 0),
        template,
      });
    }

    return result;
  },

  getGroupById: async (id: number) => {
    return await db
      .selectFrom("customer_groups")
      .selectAll()
      .where("id", "=", id)
      .executeTakeFirst();
  },

  create: async (input: {
    name: string;
    template_id?: number | null;
    active?: boolean;
  }) => {
    if (!input.name?.trim()) {
      throw new GroupValidationError("Group name is required");
    }

    if (input.template_id != null) {
      const template = await db
        .selectFrom("form_templates")
        .select("id")
        .where("id", "=", input.template_id)
        .executeTakeFirst();

      if (!template) {
        throw new GroupValidationError("Template was not found");
      }
    }

    return await db
      .insertInto("customer_groups")
      .values({
        name: input.name.trim(),
        template_id: input.template_id ?? null,
        active: input.active ?? true,
        created_at: new Date(),
        updated_at: new Date(),
      })
      .returningAll()
      .executeTakeFirst();
  },

  update: async (
    id: number,
    input: {
      name?: string;
      template_id?: number | null;
      active?: boolean;
    }
  ) => {
    const existing = await customerGroupService.getGroupById(id);

    if (!existing) {
      return undefined;
    }

    if (input.template_id != null) {
      const template = await db
        .selectFrom("form_templates")
        .select("id")
        .where("id", "=", input.template_id)
        .executeTakeFirst();

      if (!template) {
        throw new GroupValidationError("Template was not found");
      }
    }

    return await db
      .updateTable("customer_groups")
      .set({
        ...(input.name !== undefined && {
          name: input.name.trim() || undefined,
        }),
        ...(input.template_id !== undefined && { template_id: input.template_id }),
        ...(input.active !== undefined && { active: input.active }),
        updated_at: new Date(),
      })
      .where("id", "=", id)
      .returningAll()
      .executeTakeFirst();
  },

  remove: async (id: number) => {
    const existing = await customerGroupService.getGroupById(id);

    if (!existing) {
      return undefined;
    }

    await db.deleteFrom("customer_groups").where("id", "=", id).execute();

    return existing;
  },

  getMembers: async (groupId: number) => {
    return await db
      .selectFrom("customer_group_members")
      .innerJoin("customers", "customers.id", "customer_group_members.customer_id")
      .select([
        "customers.id",
        "customers.first_name",
        "customers.last_name",
        "customers.email",
        "customers.phone",
      ])
      .where("customer_group_members.group_id", "=", groupId)
      .orderBy("customers.first_name", "asc")
      .execute();
  },

  setMembers: async (groupId: number, customerIds: number[]) => {
    const existingIds = new Set(customerIds.map(Number));

    for (const id of existingIds) {
      if (!Number.isInteger(id) || id <= 0) {
        throw new GroupValidationError("Invalid customer ID in membership");
      }

      const customer = await db
        .selectFrom("customers")
        .select("id")
        .where("id", "=", id)
        .executeTakeFirst();

      if (!customer) {
        throw new GroupValidationError(`Customer #${id} was not found`);
      }
    }

    await db
      .deleteFrom("customer_group_members")
      .where("group_id", "=", groupId)
      .execute();

    if (existingIds.size > 0) {
      await db
        .insertInto("customer_group_members")
        .values(
          [...existingIds].map((customer_id) => ({
            group_id: groupId,
            customer_id,
            created_at: new Date(),
          }))
        )
        .execute();
    }
  },

  getGroupsForCustomer: async (customerId: number) => {
    return await db
      .selectFrom("customer_group_members")
      .innerJoin(
        "customer_groups",
        "customer_groups.id",
        "customer_group_members.group_id"
      )
      .selectAll("customer_groups")
      .where("customer_group_members.customer_id", "=", customerId)
      .orderBy("customer_groups.id", "asc")
      .execute();
  },
};