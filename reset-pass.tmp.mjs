import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';

const p = new PrismaClient();
const email = process.argv[2] || 'admin@ocms.edu';
const password = process.argv[3] || 'ChangeMe123!';
const hash = await bcrypt.hash(password, 12);
await p.user.update({ where: { email }, data: { password: hash, status: 'ACTIVE' } });
console.log(`Password reset for ${email} -> ${password}`);
await p.$disconnect();
