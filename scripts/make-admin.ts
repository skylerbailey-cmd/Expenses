/**
 * Promote an existing user to ADMIN by email.
 * Usage: npm run make-admin -- you@example.com
 */
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

async function main() {
  const email = process.argv[2]?.trim().toLowerCase();
  if (!email) {
    console.error("Usage: npm run make-admin -- you@example.com");
    process.exit(1);
  }

  const user = await prisma.user.findUnique({ where: { email } });
  if (!user) {
    console.error(`No user found with email "${email}". Have them register first.`);
    process.exit(1);
  }

  await prisma.user.update({ where: { email }, data: { role: "ADMIN" } });
  console.log(`✓ ${email} is now an admin.`);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
