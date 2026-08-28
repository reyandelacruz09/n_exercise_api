import bcrypt from "bcrypt";
import dotenv from "dotenv";
import db from "./database";

dotenv.config();

async function seed() {
  const users = await db
    .selectFrom("users")
    .selectAll()
    .execute();

  if (users.length > 0) {
    console.log("Seed skipped (already has data)");
    process.exit(0);
  }

  const adminEmail = process.env.ADMIN_EMAIL;
  const adminPassword = process.env.ADMIN_PASSWORD;
  const adminUsername = process.env.ADMIN_USERNAME;

  if (!adminEmail || !adminPassword || !adminUsername) {
    console.error(
      "Seed failed: ADMIN_EMAIL, ADMIN_PASSWORD, and ADMIN_USERNAME must be set in .env"
    );
    process.exit(1);
  }

  const password_hash = await bcrypt.hash(adminPassword, 10);

  await db
    .insertInto("users")
    .values([
      {
        username: adminUsername,
        email: adminEmail,
        password_hash,
      },
    ])
    .execute();

  console.log("Seed completed");
  process.exit(0);
}

seed();
