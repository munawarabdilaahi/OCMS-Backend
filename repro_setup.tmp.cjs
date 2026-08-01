const bcrypt = require('bcryptjs');
const { PrismaClient } = require('@prisma/client');
const p = new PrismaClient();
(async () => {
  const role = await p.role.findUnique({ where: { name: 'Admin' } });
  if (!role) throw new Error('Admin role missing');
  const user = await p.user.upsert({
    where: { email: 'repro@ocms.local' },
    update: { password: await bcrypt.hash('ReproTest123!', 12), status: 'ACTIVE', role_id: role.id },
    create: {
      email: 'repro@ocms.local',
      name: 'Repro Admin',
      password: await bcrypt.hash('ReproTest123!', 12),
      status: 'ACTIVE',
      role_id: role.id,
    },
  });
  console.log('REPRO_USER', user.id, user.email);
  await p.$disconnect();
})().catch((e) => { console.error(e.message); process.exit(1); });
