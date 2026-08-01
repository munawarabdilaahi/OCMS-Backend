import { PrismaClient } from '@prisma/client';
const p = new PrismaClient();
for (const t of ['campus', 'department', 'faculty', 'university', 'program', 'level', 'semester', 'academicyear', 'course', 'enrollment', 'invoice', 'payment']) {
    const cols = await p.$queryRawUnsafe(`SHOW COLUMNS FROM \`${t}\` WHERE Field IN ('created_at','updated_at')`);
    console.log(t, cols.map(c => `${c.Field}: ${c.Type} default=${c.Default} extra=${c.Extra}`).join(' | '));
}
await p.$disconnect();
