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

    setAuthCookie(res, token);

    return res.status(200).json({
      message: "Login successful",
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

export const logout = (_req: Request, res: Response) => {
  res.clearCookie("token", {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.COOKIE_SECURE === "true",
    path: "/",
  });

  return res.status(200).json({
    message: "Logged out successfully",
  });
};

export const me = async (req: Request, res: Response) => {
  try {
    const auth: any = (req as any).user;
    const id = auth?.id ? Number(auth.id) : null;

    if (!id) {
      return res.status(401).json({ message: "Not authenticated" });
    }

    const user = await userService.getUserById(id);

    if (!user) {
      return res.status(401).json({ message: "Not authenticated" });
    }

    return res.json({
      user: {
        id: user.id,
        username: user.username,
        email: user.email,
        role: user.role,
      },
    });
  } catch (error) {
    console.error("Get current user error:", error);
    return res.status(500).json({
      message: "Failed to get current user",
    });
  }
};

export const updateProfile = async (req: Request, res: Response) => {
  try {
    const auth: any = (req as any).user;
    const id = auth?.id ? Number(auth.id) : null;

    if (!id) {
      return res.status(401).json({ message: "Not authenticated" });
    }

    const { username, email, current_password, new_password } = req.body ?? {};

    if (
      (username === undefined || username === "") &&
      (email === undefined || email === "") &&
      new_password === undefined
    ) {
      return res.status(400).json({
        message: "Provide at least one field to update",
      });
    }

    const existing = await userService.getUserByEmail(
      (await userService.getUserById(id))?.email ?? ""
    );

    if (!existing || existing.id !== id) {
      return res.status(404).json({ message: "User not found" });
    }

    let password_hash: string | undefined;

    if (new_password !== undefined && new_password !== "") {
      if (!current_password) {
        return res.status(400).json({
          message: "Current password is required to set a new password",
        });
      }

      const matches = await bcrypt.compare(
        current_password,
        existing.password_hash
      );

      if (!matches) {
        return res.status(400).json({
          message: "Current password is incorrect",
        });
      }

      password_hash = await bcrypt.hash(new_password, 10);
    }

    if (email && email !== existing.email) {
      const emailTaken = await userService.getUserByEmail(email);

      if (emailTaken && emailTaken.id !== id) {
        return res.status(409).json({ message: "Email is already in use" });
      }
    }

    const updated = await userService.updateUserProfile(id, {
      username: username || undefined,
      email: email || undefined,
      password_hash,
    });

    await auditLogService.log({
      entity: "user",
      action: "update",
      entity_id: id,
      description: `Updated own profile for '${updated?.username ?? existing.username}'`,
      user_id: id,
    });

    return res.json({
      message: "Profile updated successfully",
      user: {
        id: updated?.id,
        username: updated?.username,
        email: updated?.email,
        role: updated?.role,
      },
    });
  } catch (error) {
    console.error("Update profile error:", error);
    return res.status(500).json({
      message: "Failed to update profile",
    });
  }
};

const setAuthCookie = (res: Response, token: string) => {
  res.cookie("token", token, {
    httpOnly: true,
    secure: process.env.COOKIE_SECURE === "true",
    sameSite: "lax",
    maxAge: 24 * 60 * 60 * 1000,
    path: "/",
  });
};