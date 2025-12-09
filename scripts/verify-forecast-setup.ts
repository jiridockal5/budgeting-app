/**
 * Verification script to check if forecast engine setup is correct
 * Run with: npx tsx scripts/verify-forecast-setup.ts
 */

import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

async function verifySetup() {
  console.log("🔍 Verifying Revenue Forecast Engine Setup...\n");

  try {
    // Check 1: Prisma client has the new models
    console.log("1. Checking Prisma client models...");
    if (!("forecastScenario" in prisma)) {
      console.error("❌ forecastScenario model not found in Prisma client");
      console.log("   → Run: npx prisma generate");
      process.exit(1);
    }
    if (!("plgRevenueAssumptions" in prisma)) {
      console.error("❌ plgRevenueAssumptions model not found");
      console.log("   → Run: npx prisma generate");
      process.exit(1);
    }
    console.log("   ✅ All models available in Prisma client\n");

    // Check 2: Database connection
    console.log("2. Checking database connection...");
    await prisma.$connect();
    console.log("   ✅ Database connected\n");

    // Check 3: Tables exist (try a simple query)
    console.log("3. Checking if tables exist...");
    try {
      await prisma.forecastScenario.findMany({ take: 1 });
      console.log("   ✅ forecast_scenarios table exists\n");
    } catch (error: unknown) {
      if (
        error instanceof Error &&
        (error.message.includes("does not exist") ||
          error.message.includes("relation") ||
          error.message.includes("table"))
      ) {
        console.error("   ❌ Tables do not exist in database");
        console.log("   → Run: npx prisma migrate dev");
        process.exit(1);
      }
      throw error;
    }

    console.log("✅ All checks passed! Forecast engine is ready to use.\n");
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