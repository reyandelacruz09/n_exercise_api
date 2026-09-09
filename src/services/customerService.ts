import db from "../db/database";

export const getCustomers = async () => {
  return await db
    .selectFrom("customers")
    .selectAll()
    .execute();
};

export const getCustomerById = async (id: number) => {
  return await db
    .selectFrom("customers")
    .selectAll()
    .where("id", "=", id)
    .executeTakeFirst();
};

export const getCustomerByEmail = async (email: string) => {
  return await db
    .selectFrom("customers")
    .selectAll()
    .where("email", "=", email)
    .executeTakeFirst();
};

export const setCustomerPassword = async (id: number, password_hash: string) => {
  return await db
    .updateTable("customers")
    .set({ password_hash })
    .where("id", "=", id)
    .returningAll()
    .executeTakeFirst();
};

export const createCustomer = async (
  first_name: string,
  last_name: string,
  email: string,
  phone: string
) => {
  return await db
    .insertInto("customers")
    .values({
      first_name,
      last_name,
      email,
      phone,
      created_at: new Date(),
    })
    .returningAll()
    .executeTakeFirst();
};

export const updateCustomer = async (
  id: number,
  data: {
    first_name?: string;
    last_name?: string;
    email?: string;
    phone?: string;
  }
) => {
  return await db
    .updateTable("customers")
    .set(data)
    .where("id", "=", id)
    .returningAll()
    .executeTakeFirst();
};

export const deleteCustomer = async (id: number) => {
  return await db
    .deleteFrom("customers")
    .where("id", "=", id)
    .executeTakeFirst();
};