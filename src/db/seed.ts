import db from "./database";

async function seed() {
  const users = await db
    .selectFrom("users")
    .selectAll()
    .execute();

  if (users.length > 0) {
    console.log("Seed skipped (already has data)");
    process.exit(0);
  }

  await db.insertInto("users").values([
    {
      username: "admin",
      email: "admin@test.com",
      password_hash: "hashed",
    },
  ]).execute();

  console.log("Seed completed");
  process.exit(0);
}

seed();