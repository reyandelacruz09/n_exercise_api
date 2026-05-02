import { Kysely, PostgresDialect } from "kysely";
import { Pool } from "pg";

export interface Database {
  users: {
    id: number;
    name: string;
  };
}

const db = new Kysely<Database>({
  dialect: new PostgresDialect({
    pool: new Pool({
      host: "db",
      user: "postgres",
      password: "password",
      database: "mydb",
      port: 5432,
    }),
  }),
});

export default db;
