import { Kysely, PostgresDialect } from "kysely";
import { Pool } from "pg";
import { Database } from "./schema";

const db = new Kysely<Database>({
  dialect: new PostgresDialect({
    pool: new Pool({
      host: process.env.DB_HOST || "localhost",
      user: "postgres",
      password: "password",
      database: "mydb",
      port: 5432,
    }),
  }),
});

export default db;