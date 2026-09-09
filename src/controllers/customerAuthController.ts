import { Request, Response } from "express";
import bcrypt from "bcrypt";
import jwt from "jsonwebtoken";
import * as customerService from "../services/customerService";

const setCustomerAuthCookie = (res: Response, token: string) => {
  res.cookie("customer_token", token, {
    httpOnly: true,
    secure: process.env.COOKIE_SECURE === "true",
    sameSite: "lax",
    maxAge: 24 * 60 * 60 * 1000,
    path: "/",
  });
};

export const customerLogin = async (req: Request, res: Response) => {
  try {
    const { email, password } = req.body ?? {};

    if (!email || !password) {
      return res.status(400).json({
        message: "Email and password are required",
      });
    }

    const customer = await customerService.getCustomerByEmail(email);

    if (!customer || !customer.password_hash) {
      return res.status(401).json({
        message: "Invalid email or password",
      });
    }

    if (!customer.is_active) {
      return res.status(403).json({
        message: "This account is not active",
      });
    }

    const passwordMatches = await bcrypt.compare(
      password,
      customer.password_hash
    );

    if (!passwordMatches) {
      return res.status(401).json({
        message: "Invalid email or password",
      });
    }

    if (!process.env.JWT_SECRET) {
      throw new Error("JWT_SECRET is missing in .env");
    }

    const token = jwt.sign(
      {
        scope: "customer",
        customer_id: customer.id,
        email: customer.email,
        first_name: customer.first_name,
        last_name: customer.last_name,
      },
      process.env.JWT_SECRET as string,
      {
        expiresIn: "1d",
      }
    );

    setCustomerAuthCookie(res, token);

    return res.json({
      message: "Login successful",
      customer: {
        id: customer.id,
        first_name: customer.first_name,
        last_name: customer.last_name,
        email: customer.email,
      },
    });
  } catch (error) {
    console.error("Customer login error:", error);

    return res.status(500).json({
      message: "Login failed",
    });
  }
};

export const customerMe = async (req: Request, res: Response) => {
  try {
    const auth: any = (req as any).customer;
    const customerId = auth?.customer_id ? Number(auth.customer_id) : null;

    if (!customerId) {
      return res.status(401).json({ message: "Not authenticated" });
    }

    const customer = await customerService.getCustomerById(customerId);

    if (!customer || !customer.is_active) {
      return res.status(401).json({ message: "Not authenticated" });
    }

    return res.json({
      customer: {
        id: customer.id,
        first_name: customer.first_name,
        last_name: customer.last_name,
        email: customer.email,
      },
    });
  } catch (error) {
    console.error("Get customer me error:", error);

    return res.status(500).json({
      message: "Failed to get customer",
    });
  }
};

export const customerLogout = (_req: Request, res: Response) => {
  res.clearCookie("customer_token", {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.COOKIE_SECURE === "true",
    path: "/",
  });

  return res.status(200).json({
    message: "Logged out successfully",
  });
};