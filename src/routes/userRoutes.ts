import { Router, Request, Response } from "express";
import db from "../db/database";

const router = Router();

router.get("/", async (req: Request, res: Response) => {
  try {
    const users = await db.selectFrom("users").selectAll().execute();
    res.json(users);
  } catch (error) {
    res.status(500).json({ error: "Failed to fetch users" });
  }
});

router.post("/", async (req: Request, res: Response) => {
  try {
    const { name, username, email, password_hash } = req.body;

    if (!name || !email) {
      return res.status(400).json({ error: "Missing fields" });
    }

    const result = await db
      .insertInto("users")
      .values({
        username,
        email,
        password_hash,
        role: "user",
      })
      .returningAll()
      .execute();

    res.json(result);
  } catch (error) {
    res.status(500).json({ error: "Failed to create user" });
  }
});

export default router;
