import { Request, Response } from "express";
import bcrypt from "bcrypt";
import jwt from "jsonwebtoken";
import { userService } from "../services/userService";
import { auditLogService } from "../services/auditLogService";

export const register = async (req: Request, res: Response) => {
  try {
    const { username, email, password } = req.body ?? {};
    console.log("LOGIN BODY:", req.body);
    if (!username || !email || !password) {
      return res.status(400).json({
        message: "Username, email, and password are required",
      });
    }

    const existingUser = await userService.getUserByEmail(email);

    if (existingUser) {
      return res.status(409).json({
        message: "Email is already registered",
      });
    }

    const password_hash = await bcrypt.hash(password, 10);

    const user = await userService.createUser({
      username,
      email,
      password_hash,
    });

    await auditLogService.log({
      entity: "user",
      action: "register",
      entity_id: user?.id,
      description: `Registered user '${username}' (${email})`,
      user_id: user?.id ?? null,
    });

    return res.status(201).json({
      message: "User registered successfully",
      user: {
        id: user?.id,
        username: user?.username,
        email: user?.email,
        role: user?.role,
      },
    });
  } catch (error) {
    console.error("Register error:", error);

    return res.status(500).json({
      message: "Failed to register user",
    });
  }
};

export const login = async (
  req: Request,
  res: Response
) => {
  try {
    const { email, password } = req.body ?? {};
    console.log("LOGIN BODY:", req.body);

    if (!email || !password) {
      return res.status(400).json({
        message: "Email and password are required",
      });
    }

    const user = await userService.getUserByEmail(email);
    console.log("USER FOUND:", user);

    if (!user) {
      return res.status(401).json({
        message: "Invalid email or password",
      });
    }

    console.log("HAS PASSWORD HASH:", Boolean(user.password_hash));
    // Database column is password_hash
    const passwordMatches = await bcrypt.compare(
      password,
      user.password_hash
    );
    console.log("PASSWORD MATCHES:", passwordMatches);
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
        id: user.id,
        email: user.email,
        role: user.role,
      },
      process.env.JWT_SECRET as string,
      {
        expiresIn: "1d"
      }
    );

    await auditLogService.log({
      entity: "user",
      action: "login",
      entity_id: user.id,
      description: `User '${user.username}' (${user.email}) logged in`,
      user_id: user.id,
    });

    return res.status(200).json({
      message: "Login successful",
      token,
      user: {
        id: user.id,
        username: user.username,
        email: user.email,
        role: user.role,
      },
    });
  } catch (error) {
    console.error("Login error:", error);

    return res.status(500).json({
      message: "Login failed",
    });
  }
};