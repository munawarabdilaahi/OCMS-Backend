import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcrypt';

const prisma = new PrismaClient();

async function main() {
  const hashedPassword = await bcrypt.hash('campus123', 10);

  const admin = await prisma.user.upsert({
    where: { email: 'admin@ocms.edu' },
    update: {
      password: hashedPassword
    },
    create: {
      email: 'admin@ocms.edu',
      password: hashedPassword,
      name: 'Niko King',
      role: {
        connectOrCreate: {
          where: { name: 'ADMIN' },
          create: { name: 'ADMIN' }
        }
      }
    },
  });

  console.log('Super Admin:', admin.email);

  await prisma.role.upsert({
    where: { name: 'Student' },
    update: {},
    create: { name: 'Student' },
  });

  console.log('Student role ready.');

  const departmentNames = [
    'Computer Science',
    'Business',
    'Engineering',
    'Health Sciences',
    'Education',
  ];

  for (const name of departmentNames) {
    await prisma.department.upsert({
      where: { code: name.toLowerCase().replace(/\s+/g, '-') },
      update: {},
      create: {
        code: name.toLowerCase().replace(/\s+/g, '-'),
        name,
      },
    });
  }

  console.log(`Seeded ${departmentNames.length} departments.`);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });