import { Request, Response, NextFunction } from "express";
import jwt, { JwtPayload } from "jsonwebtoken";

export interface CustomerAuthRequest extends Request {
  customer?: JwtPayload | string;
}

export const authenticateCustomerToken = (
  req: CustomerAuthRequest,
  res: Response,
  next: NextFunction
) => {
  const authHeader = req.headers.authorization;
  const headerToken = authHeader?.startsWith("Bearer ")
    ? authHeader.split(" ")[1]
    : null;

  const cookieToken = (req.headers.cookie ?? "")
    .split(";")
    .map((c) => c.trim())
    .find((c) => c.startsWith("customer_token="))
    ?.slice("customer_token=".length) as string | undefined;

  const token = headerToken ?? cookieToken;

  if (!token) {
    return res.status(401).json({
      message: "Access token is required",
    });
  }

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET as string, {
      algorithms: ["HS256"],
    }) as JwtPayload;

    if (decoded.scope !== "customer" || !decoded.customer_id) {
      return res.status(403).json({
        message: "Customer token required",
      });
    }

    req.customer = decoded;
    next();
  } catch (error) {
    return res.status(403).json({
      message: "Invalid or expired token",
    });
  }
};