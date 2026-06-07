import db from "../db/database";

export const getProducts = async () => {
  return await db
    .selectFrom("products")
    .selectAll()
    .execute();
};

export const getProductById = async (id: number) => {
  return await db
    .selectFrom("products")
    .selectAll()
    .where("id", "=", id)
    .executeTakeFirst();
};

export const createProduct = async (
  name: string,
  price: number,
  stock: number
) => {
  return await db
    .insertInto("products")
    .values({
      name,
      price,
      stock,
    })
    .returningAll()
    .executeTakeFirst();
};

export const updateProduct = async (
  id: number,
  data: {
    name?: string;
    price?: number;
    stock?: number;
  }
) => {
  return await db
    .updateTable("products")
    .set(data)
    .where("id", "=", id)
    .returningAll()
    .executeTakeFirst();
};

export const deleteProduct = async (id: number) => {
  return await db
    .deleteFrom("products")
    .where("id", "=", id)
    .executeTakeFirst();
};