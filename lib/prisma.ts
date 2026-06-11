import { PrismaClient } from "@prisma/client";

const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined;
};

/**
 * Supabase transaction pooler (port 6543) + Prisma requires pgbouncer=true,
 * otherwise Postgres returns "prepared statement already exists" (42P05).
 */
function getDatabaseUrl(): string {
  const raw = process.env.POSTGRES_PRISMA_URL || process.env.DATABASE_URL;
  if (!raw) {
    throw new Error(
      "Missing database URL. Please set POSTGRES_PRISMA_URL (preferred) or DATABASE_URL environment variable."
    );
  }

  if (raw.includes(":6543/") && !raw.includes("pgbouncer=true")) {
    const separator = raw.includes("?") ? "&" : "?";
    return `${raw}${separator}pgbouncer=true&connection_limit=1`;
  }

  return raw;
}

const databaseUrl = getDatabaseUrl();

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

globalForPrisma.prisma = prisma;

