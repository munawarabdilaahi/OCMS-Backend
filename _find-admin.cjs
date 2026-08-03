const { PrismaClient } = require('@prisma/client');
const p = new PrismaClient();
p.user.findMany({ where: { role: { name: { in: ['Admin', 'SuperAdmin'] } } }, select: { id: true, email: true, role: { select: { name: true } } } })
  .then((u) => { console.log(JSON.stringify(u)); return p.$disconnect(); })
  .catch((e) => { console.error('ERR', e.message); process.exit(1); });
