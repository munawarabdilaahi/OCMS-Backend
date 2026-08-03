import { PrismaClient } from '@prisma/client';
const p = new PrismaClient();
const roles = await p.role.findMany();
console.log('ROLES:', JSON.stringify(roles));
const users = await p.user.findMany({ select: { id: true, name: true, email: true, status: true, role_id: true } });
console.log('USERS:', JSON.stringify(users));
const tables = await p.$queryRawUnsafe('SHOW TABLES');
console.log('TABLES:', tables.map(t => Object.values(t)[0]).join(', '));
try {
    const mig = await p.$queryRawUnsafe('SELECT * FROM _prisma_migrations');
    console.log('MIGRATIONS:', JSON.stringify(mig.map(m => ({ name: m.name, finished: m.finished_at }))));
} catch (e) {
    console.log('NO _prisma_migrations table');
}
await p.$disconnect();
