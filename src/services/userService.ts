import { db } from "../db/database";

export const userService = {
  // GET all users
  getAllUsers: async () => {
    return await db
      .selectFrom("users")
      .selectAll()
      .execute();
  },

  // CREATE user
  createUser: async (data: { name: string; email: string }) => {
    return db
      .insertInto("users")
      .values(data)
      .returningAll()
      .execute();
  },

  // GET single user (optional)
  getUserById: async (id: number) => {
    return db
      .selectFrom("users")
      .selectAll()
      .where("id", "=", id)
      .executeTakeFirst();
  }
};
