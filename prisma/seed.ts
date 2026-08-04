import 'dotenv/config';
import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcrypt';

const SALT_ROUNDS = 10;

const prisma = new PrismaClient();

/**
 * Creates the initial admin user from ADMIN_EMAIL / ADMIN_PASSWORD env vars,
 * if one doesn't already exist. Idempotent so it's safe to re-run.
 * @returns a promise that resolves once seeding is complete.
 */
async function main(): Promise<void> {
  const email = process.env.ADMIN_EMAIL;
  const password = process.env.ADMIN_PASSWORD;

  if (!email || !password) {
    throw new Error('ADMIN_EMAIL and ADMIN_PASSWORD must be set to seed the admin user');
  }

  const passwordHash = await bcrypt.hash(password, SALT_ROUNDS);

  const admin = await prisma.user.upsert({
    where: { email },
    update: { passwordHash },
    create: { email, passwordHash },
  });

  console.log(`Seeded admin user: ${admin.email}`);
}

main()
  .catch((err) => {
    console.error(err);
    process.exitCode = 1;
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
