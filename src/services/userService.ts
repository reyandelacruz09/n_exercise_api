import db from "../db/database";

export const userService = {
  getAllUsers: async () => {
    return await db
      .selectFrom("users")
      .selectAll()
      .execute();
  },

  createUser: async (data: {
    username: string;
    email: string;
    password_hash: string;
  }) => {
    return await db
      .insertInto("users")
      .values({
        username: data.username,
        email: data.email,
        password_hash: data.password_hash,
        role: "user",
      })
      .returningAll()
      .executeTakeFirst();
  },

  getUserById: async (id: number) => {
    return await db
      .selectFrom("users")
      .selectAll()
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
};