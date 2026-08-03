const { PrismaClient } = require('@prisma/client');
const p = new PrismaClient();
p.$queryRawUnsafe("SELECT COLUMN_NAME, COLUMN_TYPE, IS_NULLABLE, COLUMN_DEFAULT FROM information_schema.COLUMNS WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'University' ORDER BY ORDINAL_POSITION")
  .then((rows) => { console.log(JSON.stringify(rows, null, 1)); return p.$disconnect(); })
  .catch((e) => { console.error('ERR', e.message); process.exit(1); });
