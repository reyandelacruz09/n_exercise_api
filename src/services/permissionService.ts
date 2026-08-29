import db from "../db/database";

export const permissionService = {
  getPermissionsForRole: async (role: string) => {
    const rows = await db
      .selectFrom("role_permissions as rp")
      .innerJoin("permissions as p", "p.id", "rp.permission_id")
      .select("p.name")
      .where("rp.role", "=", role)
      .execute();

    return rows.map((r) => r.name);
  },

  getAllPermissions: async () => {
    const rows = await db.selectFrom("permissions").selectAll().execute();
    return rows;
  },
};
