import { appConfig } from '#/lib/config';
import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function main() {
  console.log('Seeding database...');
  if (!appConfig.ADMIN_MAIL || !appConfig.DEFAULT_PASS)
    throw new Error('Missing env variables for default creds');

  const hashPass = await bcrypt.hash(appConfig.DEFAULT_PASS, 10);
  await prisma.user.create({
    data: {
      email: appConfig.ADMIN_MAIL,
      password: hashPass,
      isActive: true,
    },
  });

  console.log('Database seeded successfully');
}

main()
  .catch(e => {
    throw e;
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
