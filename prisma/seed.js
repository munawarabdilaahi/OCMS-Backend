import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';
import { ROLE_PERMISSIONS_DEFAULTS } from '../src/constants/permissions.js';

const prisma = new PrismaClient();

const SEED_ADMIN_EMAIL = process.env.SEED_ADMIN_EMAIL || 'admin@ocms.edu';
const SEED_ADMIN_PASSWORD = process.env.SEED_ADMIN_PASSWORD;
const SEED_ADMIN_NAME = process.env.SEED_ADMIN_NAME || 'System Administrator';
const BCRYPT_ROUNDS = 12;

const CANONICAL_ROLES = Object.keys(ROLE_PERMISSIONS_DEFAULTS);

const CASE_MAP = {
    ADMIN: 'Admin',
    SUPERADMIN: 'SuperAdmin',
    SUPER_ADMIN: 'SuperAdmin',
    REGISTRAR: 'Registrar',
    TEACHER: 'Teacher',
    ACCOUNTANT: 'Accountant',
    STUDENT: 'Student',
};

async function normalizeRoleNames() {
    const roles = await prisma.role.findMany();
    let normalized = 0;
    for (const role of roles) {
        const canonical = CASE_MAP[role.name] || CASE_MAP[role.name.toUpperCase()];
        if (!canonical || role.name === canonical) continue;

        const existing = await prisma.role.findUnique({ where: { name: canonical } });
        if (existing) {
            if (existing.id === role.id) {
                await prisma.role.update({ where: { id: role.id }, data: { name: canonical } });
                console.log(`  Renamed role "${role.name}" → "${canonical}"`);
            } else {
                await prisma.$transaction(async (tx) => {
                    const affectedUsers = await tx.user.findMany({ where: { role_id: role.id }, select: { id: true } });
                    for (const u of affectedUsers) {
                        await tx.user.update({ where: { id: u.id }, data: { role_id: existing.id } });
                    }
                    await tx.role.delete({ where: { id: role.id } });
                });
                console.log(`  Merged duplicate role "${role.name}" → "${canonical}"`);
            }
        } else {
            await prisma.role.update({ where: { id: role.id }, data: { name: canonical } });
            console.log(`  Renamed role "${role.name}" → "${canonical}"`);
        }
        normalized++;
    }
    return normalized;
}

async function main() {
    if (!SEED_ADMIN_PASSWORD) {
        console.error('FATAL: SEED_ADMIN_PASSWORD must be set. Generate a strong password and set it as an environment variable.');
        process.exit(1);
    }

    console.log('Normalizing role names to PascalCase...');
    const normalized = await normalizeRoleNames();
    if (normalized === 0) {
        console.log('  All role names already correct.');
    }

    const adminPassword = SEED_ADMIN_PASSWORD;
    console.log(`Seeding admin user: ${SEED_ADMIN_EMAIL}`);

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
                    create: { name: 'Admin', permissions: ROLE_PERMISSIONS_DEFAULTS.Admin },
                },
            },
        },
    });

    console.log(`Admin user seeded: ${admin.email}`);

    for (const name of CANONICAL_ROLES) {
        const permissions = ROLE_PERMISSIONS_DEFAULTS[name];
        await prisma.role.upsert({
            where: { name },
            update: { permissions },
            create: { name, permissions },
        });
    }
    console.log(`Roles seeded: ${CANONICAL_ROLES.join(', ')}`);

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
