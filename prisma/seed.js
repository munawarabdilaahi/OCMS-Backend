import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function main() {
  const hashedPassword = await bcrypt.hash('Campus123', 10);

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
          where: { name: 'Admin' },
          create: { name: 'Admin' }
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

  await prisma.role.upsert({
    where: { name: 'Admin' },
    update: {},
    create: { name: 'Admin' },
  });

  await prisma.role.upsert({
    where: { name: 'SuperAdmin' },
    update: {},
    create: { name: 'SuperAdmin' },
  });

  await prisma.role.upsert({
    where: { name: 'Teacher' },
    update: {},
    create: { name: 'Teacher' },
  });

  await prisma.role.upsert({
    where: { name: 'Accountant' },
    update: {},
    create: { name: 'Accountant' },
  });

  console.log('Roles seeded: Student, Admin, SuperAdmin, Teacher, Accountant.');

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