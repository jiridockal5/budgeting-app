/**
 * Verification script to check if forecast engine setup is correct
 * Run with: npx tsx scripts/verify-forecast-setup.ts
 */

import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

async function verifySetup() {
  console.log("🔍 Verifying Revenue Forecast Engine Setup...\n");

  try {
    // Check 1: Prisma client models
    console.log("1. Checking Prisma client models...");
    console.warn(
      "[verify-forecast-setup] Skipping forecastScenario check – model not wired yet."
    );
    console.log("   ⚠️  Forecast model checks skipped\n");

    // Check 2: Database connection
    console.log("2. Checking database connection...");
    await prisma.$connect();
    console.log("   ✅ Database connected\n");

    // Check 3: Tables exist (try a simple query)
    console.log("3. Checking if tables exist...");
    console.warn(
      "[verify-forecast-setup] Skipping forecastScenario table check – model not wired yet."
    );
    console.log("   ⚠️  Forecast table checks skipped\n");

    console.log("✅ Basic checks passed!\n");
    console.log("Next steps:");
    console.log("1. Make sure your dev server is running: npm run dev");
    console.log("2. Test the endpoint: http://localhost:3001/api/test-forecast");
  } catch (error) {
    console.error("\n❌ Verification failed:");
    if (error instanceof Error) {
      console.error(`   Error: ${error.message}`);
      if (error.message.includes("Can't reach database")) {
        console.log("\n💡 Make sure your DATABASE_URL or POSTGRES_PRISMA_URL is set in .env.local");
      }
    }
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
}

verifySetup();
