import { Request, Response, NextFunction } from "express";
import { AuthRequest } from "./authMiddleware";
import { permissionService } from "../services/permissionService";

export const requirePermission = (permission: string) => {
  return async (req: AuthRequest, res: Response, next: NextFunction) => {
    try {
      const auth: any = req.user;

      if (!auth?.role) {
        return res.status(403).json({ message: "Forbidden" });
      }

      // Admin always has full access.
      if (auth.role === "admin") {
        return next();
      }

      const permissions = await permissionService.getPermissionsForRole(
        auth.role
      );

      if (!permissions.includes(permission)) {
        return res.status(403).json({
          message: "You do not have permission to perform this action",
        });
      }

      return next();
    } catch (error) {
      console.error("Permission check error:", error);
      return res.status(500).json({ message: "Permission check failed" });
    }
  };
};

export const requireAdmin = (
  req: AuthRequest,
  res: Response,
  next: NextFunction
) => {
  const auth: any = req.user;

  if (!auth || auth.role !== "admin") {
    return res.status(403).json({ message: "Admin access required" });
  }

  return next();
};
