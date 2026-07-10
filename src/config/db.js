import { PrismaClient } from '@prisma/client';

// Use a single PrismaClient instance in development to avoid
// creating multiple engine instances which can trigger engine errors.
const globalForPrisma = globalThis;

const prisma = globalForPrisma.prisma || new PrismaClient();

if (process.env.NODE_ENV !== 'production') {
    globalForPrisma.__prismaClient = prisma;
}

export { prisma };
export default prisma;