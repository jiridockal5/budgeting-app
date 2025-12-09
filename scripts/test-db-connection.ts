/**
 * Test database connection for migrations
 * Run with: npx tsx scripts/test-db-connection.ts
 */

import { PrismaClient } from "@prisma/client";

async function testConnection() {
  console.log("🔍 Testing Database Connection...\n");

  // Check environment variables
  const prismaUrl = process.env.POSTGRES_PRISMA_URL;
  const dbUrl = process.env.DATABASE_URL;

  console.log("Environment Variables:");
  console.log(`  POSTGRES_PRISMA_URL: ${prismaUrl ? "✅ SET" : "❌ NOT SET"}`);
  console.log(`  DATABASE_URL: ${dbUrl ? "✅ SET" : "❌ NOT SET"}\n`);

  if (!prismaUrl && !dbUrl) {
    console.error("❌ Error: Neither POSTGRES_PRISMA_URL nor DATABASE_URL is set!");
    console.log("\n💡 Solution:");
    console.log("   Add to your .env.local file:");
    console.log("   POSTGRES_PRISMA_URL=postgresql://postgres.xxx:password@aws-0-REGION.pooler.supabase.com:6543/postgres?sslmode=require");
    console.log("\n   See SETUP_LOCAL_DATABASE.md for details.");
    process.exit(1);
  }

  const url = prismaUrl || dbUrl;
  if (url) {
    // Check if it's using the pooler (port 6543)
    if (url.includes(":6543")) {
      console.log("✅ Connection string uses pooler port (6543) - Good for local dev!\n");
    } else if (url.includes(":5432")) {
      console.warn("⚠️  Connection string uses direct port (5432) - This won't work from localhost!");
      console.log("   Update to use port 6543 (pooler)\n");
    }
  }

  // Try to connect
  const prisma = new PrismaClient();
  try {
    console.log("Attempting to connect to database...");
    await prisma.$connect();
    console.log("✅ Successfully connected to database!\n");

    // Try a simple query
    await prisma.$queryRaw`SELECT 1`;
    console.log("✅ Database query test passed!\n");

    console.log("✅ Everything is ready! You can now run:");
    console.log("   npx prisma migrate dev --name add_revenue_forecast_models");
  } catch (error) {
    console.error("❌ Failed to connect to database:");
    if (error instanceof Error) {
      console.error(`   ${error.message}\n`);
      
      if (error.message.includes("Can't reach database server")) {
        console.log("💡 This usually means:");
        console.log("   1. You're using port 5432 (direct connection)");
        console.log("   2. Update to use port 6543 (pooler)");
        console.log("   3. See SETUP_LOCAL_DATABASE.md for the correct connection string");
      } else if (error.message.includes("P1001")) {
        console.log("💡 Check your connection string and make sure:");
        console.log("   - You're using the pooler URL (port 6543)");
        console.log("   - Your Supabase project is not paused");
        console.log("   - The password is correctly URL-encoded");
      }
    }
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
}

testConnection();