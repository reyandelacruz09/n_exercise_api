import db from "./database";
import { Migrator, FileMigrationProvider } from "kysely";
import path from "path";
import fs from "fs/promises";

const migrator = new Migrator({
  db,
  provider: new FileMigrationProvider({
    fs,
    path,
    migrationFolder: path.resolve("src/db/migrations"),
  }),
});

async function migrate() {
  console.log(
    await fs.readdir(path.resolve("src/db/migrations"))
  );
  const result = await migrator.migrateToLatest();

  console.log("MIGRATION RESULT:", result);

  process.exit(0);
}

migrate();