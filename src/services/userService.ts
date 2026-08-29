import db from "../db/database";

export const userService = {
  getAllUsers: async () => {
    return await db
      .selectFrom("users")
      .select(["id", "username", "email", "role", "created_at"])
      .execute();
  },

  getUserById: async (id: number) => {
    return await db
      .selectFrom("users")
      .select(["id", "username", "email", "role", "created_at"])
      .where("id", "=", id)
      .executeTakeFirst();
  },

  getUserByEmail: async (email: string) => {
    return await db
      .selectFrom("users")
      .selectAll()
      .where("email", "=", email)
      .executeTakeFirst();
  },

  createUser: async (data: {
    username: string;
    email: string;
    password_hash: string;
    role?: string;
  }) => {
    return await db
      .insertInto("users")
      .values({
        username: data.username,
        email: data.email,
        password_hash: data.password_hash,
        role: data.role ?? "user",
      })
      .returning(["id", "username", "email", "role", "created_at"])
      .executeTakeFirst();
  },

  updateUser: async (
    id: number,
    data: { username?: string; email?: string; role?: string }
  ) => {
    return await db
      .updateTable("users")
      .set(data)
      .where("id", "=", id)
      .returning(["id", "username", "email", "role", "created_at"])
      .executeTakeFirst();
  },

  updateUserProfile: async (
    id: number,
    data: { username?: string; email?: string; password_hash?: string }
  ) => {
    const updates: Record<string, unknown> = {};

    if (data.username !== undefined && data.username !== "") {
      updates.username = data.username;
    }

    if (data.email !== undefined && data.email !== "") {
      updates.email = data.email;
    }

    if (data.password_hash !== undefined) {
      updates.password_hash = data.password_hash;
    }

    return await db
      .updateTable("users")
      .set(updates)
      .where("id", "=", id)
      .returning(["id", "username", "email", "role", "created_at"])
      .executeTakeFirst();
  },

  deleteUser: async (id: number) => {
    return await db
      .deleteFrom("users")
      .where("id", "=", id)
      .executeTakeFirst();
  },
};
