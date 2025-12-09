/**
 * Programmatic migration using Prisma Migrate API
 */

import { PrismaClient } from "@prisma/client";
import { execSync } from "child_process";
import * as fs from "fs";
import * as path from "path";

async function main() {
  console.log("🚀 Running Revenue Forecast Migration\n");
  console.log("=" .repeat(60) + "\n");

  // Load .env file manually
  try {
    const envPath = path.join(process.cwd(), ".env");
    if (fs.existsSync(envPath)) {
      const envContent = fs.readFileSync(envPath, "utf-8");
      envContent.split("\n").forEach((line) => {
        const match = line.match(/^([^#=]+)=(.*)$/);
        if (match) {
          const key = match[1].trim();
          const value = match[2].trim().replace(/^["']|["']$/g, "");
          if (!process.env[key]) {
            process.env[key] = value;
          }
        }
      });
      console.log("✅ Loaded environment variables from .env\n");
    }
  } catch (error) {
    console.warn("⚠️  Could not load .env file, using existing env vars\n");
  }

  // Verify POSTGRES_PRISMA_URL
  if (!process.env.POSTGRES_PRISMA_URL) {
    console.error("❌ POSTGRES_PRISMA_URL not found!");
    process.exit(1);
  }

  const url = process.env.POSTGRES_PRISMA_URL;
  console.log(`📍 Using database: ${url.split("@")[1]?.split("/")[0] || "unknown"}\n`);

  // Test connection
  console.log("🔌 Testing database connection...");
  const prisma = new PrismaClient();
  try {
    await prisma.$connect();
    await prisma.$queryRaw`SELECT 1`;
    console.log("✅ Connected!\n");
  } catch (error) {
    console.error("❌ Connection failed:", error instanceof Error ? error.message : error);
    await prisma.$disconnect();
    process.exit(1);
  }
  await prisma.$disconnect();

  // Check if migration already exists
  const migrationsDir = path.join(process.cwd(), "prisma", "migrations");
  const existingMigrations = fs.existsSync(migrationsDir)
    ? fs.readdirSync(migrationsDir).filter((f) => 
        fs.statSync(path.join(migrationsDir, f)).isDirectory() && 
        f.includes("revenue_forecast")
      )
    : [];

  if (existingMigrations.length > 0) {
    console.log(`⚠️  Migration already exists: ${existingMigrations[0]}`);
    console.log("   Skipping migration creation.\n");
  } else {
    // Run migration
    console.log("📝 Creating migration...\n");
    try {
      execSync(
        'npx prisma migrate dev --name add_revenue_forecast_models --skip-seed --create-only',
        {
          stdio: "inherit",
          cwd: process.cwd(),
          env: { ...process.env, FORCE_COLOR: "1" },
          shell: process.platform === "win32" ? process.env.ComSpec || "cmd.exe" : "/bin/sh",
        }
      );
      console.log("\n✅ Migration file created!\n");
    } catch (error) {
      console.error("\n❌ Failed to create migration");
      process.exit(1);
    }

    // Apply migration
    console.log("🔄 Applying migration to database...\n");
    try {
      execSync(
        'npx prisma migrate deploy',
        {
          stdio: "inherit",
          cwd: process.cwd(),
          env: { ...process.env, FORCE_COLOR: "1" },
          shell: process.platform === "win32" ? process.env.ComSpec || "cmd.exe" : "/bin/sh",
        }
      );
      console.log("\n✅ Migration applied!\n");
    } catch (error) {
      // Try migrate dev instead if deploy fails
      console.log("\n⚠️  migrate deploy failed, trying migrate dev...\n");
      try {
        execSync(
          'npx prisma migrate dev --name add_revenue_forecast_models',
          {
            stdio: "inherit",
            cwd: process.cwd(),
            env: { ...process.env, FORCE_COLOR: "1" },
            shell: process.platform === "win32" ? process.env.ComSpec || "cmd.exe" : "/bin/sh",
          }
        );
        console.log("\n✅ Migration applied!\n");
      } catch (error2) {
        console.error("\n❌ Failed to apply migration");
        process.exit(1);
      }
    }
  }

  // Generate Prisma client
  console.log("⚙️  Generating Prisma client...\n");
  try {
    execSync("npx prisma generate", {
      stdio: "inherit",
      cwd: process.cwd(),
      env: { ...process.env, FORCE_COLOR: "1" },
      shell: process.platform === "win32" ? process.env.ComSpec || "cmd.exe" : "/bin/sh",
    });
    console.log("\n✅ Prisma client generated!\n");
  } catch (error) {
    console.error("\n❌ Failed to generate Prisma client");
    process.exit(1);
  }

  console.log("=" .repeat(60));
  console.log("\n✅ All done! Migration is ready.\n");
  console.log("Next steps:");
  console.log("1. Restart your dev server: npm run dev");
  console.log("2. Test: http://localhost:3001/api/test-forecast\n");
}

main().catch((error) => {
  console.error("\n❌ Unexpected error:", error);
  process.exit(1);
});