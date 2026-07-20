import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

const SEED_ADMIN_EMAIL = process.env.SEED_ADMIN_EMAIL || 'admin@ocms.edu';
const SEED_ADMIN_PASSWORD = process.env.SEED_ADMIN_PASSWORD;
const SEED_ADMIN_NAME = process.env.SEED_ADMIN_NAME || 'System Administrator';
const BCRYPT_ROUNDS = 12;

async function main() {
    if (process.env.NODE_ENV === 'production' && !SEED_ADMIN_PASSWORD) {
        console.error('FATAL: SEED_ADMIN_PASSWORD must be set when seeding in production.');
        process.exit(1);
    }

    const adminPassword = SEED_ADMIN_PASSWORD || 'ChangeMe123!';
    console.log(`Seeding admin user: ${SEED_ADMIN_EMAIL}`);
    if (!SEED_ADMIN_PASSWORD) {
        console.warn('WARNING: Using default seed password. Set SEED_ADMIN_PASSWORD environment variable for production.');
    }

    const hashedPassword = await bcrypt.hash(adminPassword, BCRYPT_ROUNDS);

    const admin = await prisma.user.upsert({
        where: { email: SEED_ADMIN_EMAIL },
        update: {
            password: hashedPassword,
        },
        create: {
            email: SEED_ADMIN_EMAIL,
            password: hashedPassword,
            name: SEED_ADMIN_NAME,
            role: {
                connectOrCreate: {
                    where: { name: 'Admin' },
                    create: { name: 'Admin' },
                },
            },
        },
    });

    console.log(`Admin user seeded: ${admin.email}`);

    const roleNames = ['Student', 'Admin', 'SuperAdmin', 'Teacher', 'Accountant'];
    for (const name of roleNames) {
        await prisma.role.upsert({
            where: { name },
            update: {},
            create: { name },
        });
    }
    console.log(`Roles seeded: ${roleNames.join(', ')}`);

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
