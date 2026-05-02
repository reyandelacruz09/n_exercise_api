import { db } from "../db/database";

export const taskService = {
  getAllTasks: async () => {
    return db.selectFrom("tasks").selectAll().execute();
  },

  createTask: async (data: {
    title: string;
    status: "pending" | "running" | "done";
  }) => {
    return db
      .insertInto("tasks")
      .values({
        ...data,
        created_at: new Date(),
      })
      .returningAll()
      .execute();
  },
};
