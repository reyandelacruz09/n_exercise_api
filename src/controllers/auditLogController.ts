import { Request, Response } from "express";
import { auditLogService } from "../services/auditLogService";

export const getAuditLogs = async (
  req: Request,
  res: Response
) => {
  try {
    const { entity } = req.query;
    const logs = await auditLogService.getLogs({
      entity: typeof entity === "string" ? entity : undefined,
    });

    res.json(logs);
  } catch (error) {
    console.error("Get audit logs error:", error);
    res.status(500).json({
      message: "Failed to retrieve audit logs",
    });
  }
};
