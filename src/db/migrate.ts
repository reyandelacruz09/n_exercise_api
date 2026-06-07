import db from "./database";
import { Migrator, FileMigrationProvider } from "kysely";
import path from "path";
import fs from "fs";

const migrator = new Migrator({
  db,
  provider: new FileMigrationProvider({
    fs,
    path,
    migrationFolder: path.join(__dirname, "migrations"),
  }),
});

async function migrate() {
  const result = await migrator.migrateToLatest();

  console.log("MIGRATION RESULT:", result);

  process.exit(0);
}

migrate();