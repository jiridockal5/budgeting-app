/**
 * Programmatic migration runner
 * Run with: npx tsx scripts/run-migration.ts
 */

import { execSync } from "child_process";
import { PrismaClient } from "@prisma/client";

async function runMigration() {
  console.log("🚀 Revenue Forecast Migration Setup\n");
  console.log("=" .repeat(50) + "\n");

  // Step 1: Check environment variables
  console.log("Step 1: Checking environment variables...");
  const prismaUrl = process.env.POSTGRES_PRISMA_URL;
  const dbUrl = process.env.DATABASE_URL;

  if (!prismaUrl) {
    console.error("❌ ERROR: POSTGRES_PRISMA_URL is not set!");
    console.log("\nPlease add to your .env file:");
    console.log("POSTGRES_PRISMA_URL=postgresql://postgres.xxx:password@aws-0-REGION.pooler.supabase.com:6543/postgres?sslmode=require\n");
    process.exit(1);
  }

  if (prismaUrl.includes(":5432")) {
    console.error("❌ ERROR: POSTGRES_PRISMA_URL uses port 5432 (direct connection)");
    console.log("Please update to use port 6543 (pooler)");
    process.exit(1);
  }

  if (prismaUrl.includes(":6543")) {
    console.log("✅ POSTGRES_PRISMA_URL is set and uses pooler port (6543)");
  } else {
    console.warn("⚠️  POSTGRES_PRISMA_URL doesn't specify port 6543");
  }
  console.log();

  // Step 2: Test database connection
  console.log("Step 2: Testing database connection...");
  const prisma = new PrismaClient();
  try {
    await prisma.$connect();
    console.log("✅ Database connection successful!\n");
  } catch (error) {
    console.error("❌ Failed to connect to database:");
    if (error instanceof Error) {
      console.error(`   ${error.message}\n`);
    }
    await prisma.$disconnect();
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }

  // Step 3: Validate schema
  console.log("Step 3: Validating Prisma schema...");
  try {
    execSync("npx prisma validate", { 
      stdio: "inherit",
      cwd: process.cwd()
    });
    console.log("✅ Schema validation passed!\n");
  } catch (error) {
    console.error("❌ Schema validation failed\n");
    process.exit(1);
  }

  // Step 4: Run migration
  console.log("Step 4: Running migration...");
  console.log("Creating migration: add_revenue_forecast_models\n");
  try {
    execSync("npx prisma migrate dev --name add_revenue_forecast_models", {
      stdio: "inherit",
      cwd: process.cwd(),
      env: process.env
    });
    console.log("\n✅ Migration completed successfully!\n");
  } catch (error) {
    console.error("\n❌ Migration failed!");
    if (error instanceof Error) {
      console.error(`   ${error.message}`);
    }
    process.exit(1);
  }

  // Step 5: Verify migration was created
  console.log("Step 5: Verifying migration files...");
  try {
    const fs = await import("fs");
    const path = await import("path");
    const migrationsDir = path.join(process.cwd(), "prisma", "migrations");
    const files = fs.readdirSync(migrationsDir, { withFileTypes: true });
    const migrationDirs = files.filter(f => f.isDirectory() && f.name.includes("add_revenue_forecast"));
    
    if (migrationDirs.length > 0) {
      console.log(`✅ Migration file created: ${migrationDirs[0].name}\n`);
    } else {
      console.warn("⚠️  Could not find migration directory (this might be okay if migration already existed)\n");
    }
  } catch (error) {
    console.warn("⚠️  Could not verify migration files\n");
  }

  console.log("=" .repeat(50));
  console.log("\n✅ All steps completed successfully!\n");
  console.log("Next steps:");
  console.log("1. Restart your dev server: npm run dev");
  console.log("2. Test the endpoint: http://localhost:3001/api/test-forecast\n");
}

runMigration().catch((error) => {
  console.error("Unexpected error:", error);
  process.exit(1);
});