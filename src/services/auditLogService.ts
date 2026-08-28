import db from "../db/database";

export type AuditAction = "add" | "update" | "delete" | "login" | "register";

export const auditLogService = {
  log: async (data: {
    entity: string;
    action: AuditAction;
    entity_id?: number | null;
    description?: string;
    user_id?: number | null;
  }) => {
    try {
      return await db
        .insertInto("audit_logs")
        .values({
          entity: data.entity,
          action: data.action,
          entity_id: data.entity_id ?? null,
          description: data.description ?? null,
          user_id: data.user_id ?? null,
        })
        .returningAll()
        .executeTakeFirst();
    } catch (error) {
      console.error("Audit log write failed:", error);
      return null;
    }
  },

  getLogs: async (opts?: { entity?: string; limit?: number }) => {
    let q = db
      .selectFrom("audit_logs")
      .selectAll()
      .orderBy("created_at", "desc")
      .limit(Math.min(200, Math.max(1, opts?.limit ?? 50)));

    if (opts?.entity) {
      q = q.where("entity", "=", opts.entity);
    }

    return await q.execute();
  },
};
