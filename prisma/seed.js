import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcrypt';

const prisma = new PrismaClient();

async function main() {
  // Waxaan halkan ku dhalinaynaa hash rasmiah oo kombuyuutarkaaga ka dhashay
  const hashedPassword = await bcrypt.hash('campus123', 10);

  const admin = await prisma.user.upsert({
    where: { email: 'admin@ocms.edu' },
    update: {
      password: hashedPassword // Mar walba dib u cusboonaysii haddii uu jiro
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

  console.log('🌱 Database-ka waxaa lagu shubay Super Admin rasmiah:', admin.email);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });