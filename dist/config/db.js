import { PrismaClient } from '@prisma/client';
const globalForPrisma = globalThis;
export const prisma = globalForPrisma.prisma ||
    new PrismaClient({
        log: process.env.NODE_ENV === 'production' ? ['error'] : ['query', 'info', 'warn', 'error'],
    });
if (process.env.NODE_ENV !== 'production') {
    globalForPrisma.prisma = prisma;
}
export default prisma;
