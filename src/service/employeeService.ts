import { db } from "../db/database";

export const employeeService = {
  getAllEmployees: async () => {
    return db.selectFrom("employees").selectAll().execute();
  },

  createEmployee: async (data: {
    first_name: string;
    last_name: string;
    email: string;
    position?: string;
    salary?: number;
  }) => {
    return db
      .insertInto("employees")
      .values({
        ...data,
        created_at: new Date(),
      })
      .returningAll()
      .execute();
  },
};
