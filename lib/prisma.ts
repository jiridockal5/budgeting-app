import { PrismaClient } from "@prisma/client";

const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined;
};

// Support both POSTGRES_PRISMA_URL (from Supabase integration) and DATABASE_URL (fallback)
// POSTGRES_PRISMA_URL is preferred as it's optimized for Prisma with connection pooling
const databaseUrl = process.env.POSTGRES_PRISMA_URL || process.env.DATABASE_URL;

if (!databaseUrl) {
  throw new Error(
    'Missing database URL. Please set POSTGRES_PRISMA_URL (preferred) or DATABASE_URL environment variable.'
  );
}

export const prisma =
  globalForPrisma.prisma ??
  new PrismaClient({
    log: process.env.NODE_ENV === "development" ? ["query"] : [],
    datasources: {
      db: {
        url: databaseUrl,
      },
    },
  });

if (process.env.NODE_ENV !== "production") globalForPrisma.prisma = prisma;

