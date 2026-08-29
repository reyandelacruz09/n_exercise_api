import { Request, Response } from "express";
import bcrypt from "bcrypt";
import { userService } from "../services/userService";

const VALID_ROLES = ["admin", "user"];

export const getUsers = async (req: Request, res: Response) => {
  try {
    const users = await userService.getAllUsersWithPermissions();
    res.json(users);
  } catch (error) {
    console.error("Get users error:", error);
    res.status(500).json({ message: "Failed to fetch users" });
  }
};

export const getUserById = async (req: Request, res: Response) => {
  try {
    const id = Number(req.params.id);

    if (isNaN(id)) {
      return res.status(400).json({ message: "Invalid user ID" });
    }

    const user = await userService.getUserById(id);

    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    res.json(user);
  } catch (error) {
    console.error("Get user error:", error);
    res.status(500).json({ message: "Failed to fetch user" });
  }
};

export const createUser = async (req: Request, res: Response) => {
  try {
    const { username, email, password, role } = req.body ?? {};

    if (!username || !email || !password) {
      return res
        .status(400)
        .json({ message: "Username, email, and password are required" });
    }

    const existingUser = await userService.getUserByEmail(email);

    if (existingUser) {
      return res.status(409).json({ message: "Email is already registered" });
    }

    const password_hash = await bcrypt.hash(password, 10);

    const userRole = role ?? "user";

    if (!VALID_ROLES.includes(userRole)) {
      return res.status(400).json({
        message: `Invalid role. Allowed roles: ${VALID_ROLES.join(", ")}`,
      });
    }

    const user = await userService.createUser({
      username,
      email,
      password_hash,
      role: userRole,
    });

    return res.status(201).json({
      message: "User created successfully",
      user,
    });
  } catch (error) {
    console.error("Create user error:", error);
    return res.status(500).json({ message: "Failed to create user" });
  }
};

export const updateUser = async (req: Request, res: Response) => {
  try {
    const id = Number(req.params.id);

    if (isNaN(id)) {
      return res.status(400).json({ message: "Invalid user ID" });
    }

    const existingUser = await userService.getUserById(id);

    if (!existingUser) {
      return res.status(404).json({ message: "User not found" });
    }

    const { username, email, role } = req.body ?? {};

    if (!username && !email && !role) {
      return res
        .status(400)
        .json({ message: "At least one field (username, email, role) is required" });
    }

    if (role && !VALID_ROLES.includes(role)) {
      return res.status(400).json({
        message: `Invalid role. Allowed roles: ${VALID_ROLES.join(", ")}`,
      });
    }

    const auth: any = (req as any).user;

    if (auth?.id === id && role && role !== existingUser.role) {
      return res.status(400).json({
        message: "You cannot change your own role",
      });
    }

    if (email && email !== existingUser.email) {
      const emailTaken = await userService.getUserByEmail(email);
      if (emailTaken) {
        return res.status(409).json({ message: "Email is already in use" });
      }
    }

    const updated = await userService.updateUser(id, { username, email, role });

    return res.json({
      message: "User updated successfully",
      user: updated,
    });
  } catch (error) {
    console.error("Update user error:", error);
    return res.status(500).json({ message: "Failed to update user" });
  }
};

export const deleteUser = async (req: Request, res: Response) => {
  try {
    const id = Number(req.params.id);

    if (isNaN(id)) {
      return res.status(400).json({ message: "Invalid user ID" });
    }

    const existingUser = await userService.getUserById(id);

    if (!existingUser) {
      return res.status(404).json({ message: "User not found" });
    }

    const auth: any = (req as any).user;

    if (auth?.id === id) {
      return res.status(400).json({ message: "You cannot delete your own account" });
    }

    await userService.deleteUser(id);

    return res.json({ message: "User deleted successfully" });
  } catch (error) {
    console.error("Delete user error:", error);
    return res.status(500).json({ message: "Failed to delete user" });
  }
};
