import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function main() {
  const password = process.env.SEED_ADMIN_PASSWORD ?? 'Admin3msu';
  const hash = await bcrypt.hash(password, 10);

  await prisma.user.upsert({
    where: { email: 'admin@nemsu.edu.ph' },
    update: {
      passwordHash: hash
    },
    create: {
      email: 'admin@nemsu.edu.ph',
      name: 'System Administrator',
      passwordHash: hash,
      role: 'admin',
      department: 'Administration'
    }
  });

  console.log('Seeded admin user: admin@nemsu.edu.ph');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
