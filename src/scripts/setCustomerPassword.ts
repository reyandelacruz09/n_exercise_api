import bcrypt from "bcrypt";
import db from "../db/database";
import * as customerService from "../services/customerService";

// Usage: npx ts-node src/scripts/setCustomerPassword.ts <email> <password>
const email = process.argv[2];
const password = process.argv[3];

if (!email || !password) {
  console.error('Usage: npx ts-node src/scripts/setCustomerPassword.ts <email> <password>');
  process.exit(1);
}

async function main() {
  const customer = await customerService.getCustomerByEmail(email);

  if (!customer) {
    console.error(`Customer with email '${email}' was not found`);
    process.exit(1);
  }

  const password_hash = await bcrypt.hash(password, 10);
  await customerService.setCustomerPassword(customer.id, password_hash);

  console.log(`Set password for customer #${customer.id} (${customer.first_name} ${customer.last_name})`);

  await db.destroy();
  process.exit(0);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});