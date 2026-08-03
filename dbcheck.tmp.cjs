const { PrismaClient } = require('@prisma/client');
const p = new PrismaClient();
(async () => {
  const users = await p.user.findMany({ select: { id: true, email: true, name: true, role_id: true, status: true } });
  const roles = await p.role.findMany({ select: { id: true, name: true } });
  console.log('ROLES', JSON.stringify(roles));
  console.log('USERS', JSON.stringify(users));
  await p.$disconnect();
})().catch((e) => { console.error(e.message); process.exit(1); });
