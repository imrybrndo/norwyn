import { PrismaClient } from '@prisma/client';
import { PrismaPg } from '@prisma/adapter-pg';

// Prisma 7 requires a driver adapter. We use node-postgres against Supabase's
// transaction pooler (DATABASE_URL, port 6543).
const globalForPrisma = globalThis as unknown as { prisma?: PrismaClient };

if (!process.env.DATABASE_URL) {
    throw new Error(
        'DATABASE_URL is not set. Ensure .env is loaded before importing server/db/prisma (see server/env.ts).'
    );
}

const adapter = new PrismaPg({ connectionString: process.env.DATABASE_URL });

export const prisma =
    globalForPrisma.prisma ??
    new PrismaClient({
        adapter,
        log: process.env.NODE_ENV === 'development' ? ['warn', 'error'] : ['error'],
    });

if (process.env.NODE_ENV !== 'production') {
    globalForPrisma.prisma = prisma;
}

export default prisma;
