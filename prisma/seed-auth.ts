import { PrismaClient } from "@prisma/client";
import { hash } from "bcryptjs";

const prisma = new PrismaClient();

/**
 * Creates (or updates) the demo accounts used by the sign-in page test-account
 * dropdown so the Credentials provider can authenticate them.
 *
 *   test@user.com  / 12345678  -> USER
 *   test@admin.com / 12345678  -> ADMIN
 *
 * Usage: npm run db:seed-auth
 */
const TEST_PASSWORD = "12345678";

const accounts: { name: string; email: string; role: "USER" | "ADMIN" }[] = [
  { name: "Test User", email: "test@user.com", role: "USER" },
  { name: "Test Admin", email: "test@admin.com", role: "ADMIN" },
];

async function main() {
  const hashedPassword = await hash(TEST_PASSWORD, 10);

  for (const account of accounts) {
    await prisma.user.upsert({
      where: { email: account.email },
      update: {
        name: account.name,
        password: hashedPassword,
        role: account.role,
      },
      create: {
        name: account.name,
        email: account.email,
        emailVerified: new Date(),
        password: hashedPassword,
        role: account.role,
      },
    });
    console.log(`✅ ${account.role} account ready (${account.email})`);
  }
}

main()
  .catch((error) => {
    console.error(error);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
