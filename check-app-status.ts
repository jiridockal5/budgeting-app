/**
 * Comprehensive app status check
 * Run with: npx tsx check-app-status.ts
 */

import { PrismaClient } from "@prisma/client";
import * as fs from "fs";
import * as path from "path";

console.log("🔍 APP STATUS CHECK\n");
console.log("=".repeat(60));

// 1. Environment Variables
console.log("\n1️⃣  ENVIRONMENT VARIABLES");
console.log("-".repeat(60));

const envVars = {
  NEXT_PUBLIC_SUPABASE_URL: process.env.NEXT_PUBLIC_SUPABASE_URL,
  NEXT_PUBLIC_SUPABASE_ANON_KEY: process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
  DATABASE_URL: process.env.DATABASE_URL,
  POSTGRES_PRISMA_URL: process.env.POSTGRES_PRISMA_URL,
};

let hasDbUrl = false;
let hasSupabase = true;

for (const [key, value] of Object.entries(envVars)) {
  if (value) {
    if (key.includes("KEY")) {
      console.log(`✅ ${key}: Set (${value.substring(0, 15)}...)`);
    } else if (key.includes("URL")) {
      try {
        const url = new URL(value.replace("postgresql://", "http://"));
        console.log(`✅ ${key}: ${url.hostname}:${url.port || "default"}`);
        if (key.includes("DATABASE") || key.includes("POSTGRES")) {
          hasDbUrl = true;
        }
      } catch {
        console.log(`✅ ${key}: Set`);
        if (key.includes("DATABASE") || key.includes("POSTGRES")) {
          hasDbUrl = true;
        }
      }
    } else {
      console.log(`✅ ${key}: Set`);
    }
  } else {
    console.log(`❌ ${key}: NOT SET`);
    if (key.includes("SUPABASE")) {
      hasSupabase = false;
    }
  }
}

// 2. File Structure
console.log("\n2️⃣  FILE STRUCTURE");
console.log("-".repeat(60));

const importantFiles = [
  "package.json",
  "prisma/schema.prisma",
  "lib/prisma.ts",
  "lib/supabaseClient.ts",
  "lib/supabaseServer.ts",
  "app/layout.tsx",
  "app/page.tsx",
  "app/api/test-forecast/route.ts",
];

for (const file of importantFiles) {
  const filePath = path.join(process.cwd(), file);
  if (fs.existsSync(filePath)) {
    console.log(`✅ ${file}`);
  } else {
    console.log(`❌ ${file} - MISSING`);
  }
}

// 3. Dependencies
console.log("\n3️⃣  DEPENDENCIES");
console.log("-".repeat(60));

const nodeModulesPath = path.join(process.cwd(), "node_modules");
if (fs.existsSync(nodeModulesPath)) {
  console.log("✅ node_modules exists");
  
  const criticalDeps = [
    "@prisma/client",
    "next",
    "react",
    "@supabase/supabase-js",
  ];
  
  for (const dep of criticalDeps) {
    const depPath = path.join(nodeModulesPath, dep);
    if (fs.existsSync(depPath)) {
      console.log(`✅ ${dep}`);
    } else {
      console.log(`❌ ${dep} - NOT INSTALLED`);
    }
  }
} else {
  console.log("❌ node_modules NOT FOUND");
  console.log("   → Run: npm install");
}

// 4. Prisma Client
console.log("\n4️⃣  PRISMA CLIENT");
console.log("-".repeat(60));

const prismaClientPath = path.join(
  process.cwd(),
  "node_modules",
  ".prisma",
  "client",
  "index.js"
);

if (fs.existsSync(prismaClientPath)) {
  console.log("✅ Prisma client generated");
} else {
  console.log("❌ Prisma client NOT GENERATED");
  console.log("   → Run: npx prisma generate");
}

// 5. Configuration Consistency
console.log("\n5️⃣  CONFIGURATION");
console.log("-".repeat(60));

const schemaPath = path.join(process.cwd(), "prisma", "schema.prisma");
const libPrismaPath = path.join(process.cwd(), "lib", "prisma.ts");

if (fs.existsSync(schemaPath) && fs.existsSync(libPrismaPath)) {
  const schemaContent = fs.readFileSync(schemaPath, "utf-8");
  const libContent = fs.readFileSync(libPrismaPath, "utf-8");
  
  const schemaUsesDatabaseUrl = schemaContent.includes('env("DATABASE_URL")');
  const libUsesPostgresPrisma = libContent.includes("POSTGRES_PRISMA_URL");
  
  if (schemaUsesDatabaseUrl && libUsesPostgresPrisma) {
    console.log("⚠️  Configuration mismatch:");
    console.log("   - schema.prisma uses: DATABASE_URL");
    console.log("   - lib/prisma.ts prefers: POSTGRES_PRISMA_URL");
    console.log("   → This is OK if POSTGRES_PRISMA_URL falls back to DATABASE_URL");
  } else {
    console.log("✅ Configuration is consistent");
  }
}

// 6. Database Connection Test
console.log("\n6️⃣  DATABASE CONNECTION");
console.log("-".repeat(60));

async function testDatabase() {
  if (!hasDbUrl) {
    console.log("⏭️  Skipping (no database URL found)");
    return false;
  }

  try {
    const prisma = new PrismaClient({
      log: ["error"],
    });

    console.log("Attempting connection...");
    await prisma.$connect();
    console.log("✅ Database connection successful!");

    // Test query
    await prisma.$queryRaw`SELECT 1 as test`;
    console.log("✅ Database query successful");

    // Check tables
    const tables = await prisma.$queryRaw<Array<{ table_name: string }>>`
      SELECT table_name 
      FROM information_schema.tables 
      WHERE table_schema = 'public'
      ORDER BY table_name
    `;

    if (tables.length > 0) {
      console.log(`✅ Found ${tables.length} tables in database`);
      const tableNames = tables.map((t) => t.table_name);
      
      // Check for forecast tables
      const forecastTables = [
        "forecast_scenarios",
        "plg_revenue_assumptions",
        "sales_revenue_assumptions",
        "partner_revenue_assumptions",
      ];
      
      const missingForecastTables = forecastTables.filter(
        (t) => !tableNames.includes(t)
      );
      
      if (missingForecastTables.length > 0) {
        console.log(`⚠️  Missing forecast tables: ${missingForecastTables.join(", ")}`);
        console.log("   → Run migration: npm run migrate:forecast");
      } else {
        console.log("✅ All forecast tables exist");
      }
    } else {
      console.log("⚠️  No tables found - migrations may not have run");
    }

    await prisma.$disconnect();
    return true;
  } catch (error) {
    console.log("❌ Database connection FAILED");
    if (error instanceof Error) {
      console.log(`   Error: ${error.message}`);
      
      if (error.message.includes("P1001") || error.message.includes("Can't reach")) {
        console.log("   → Cannot reach database server");
        console.log("   → Check connection string and network");
      } else if (error.message.includes("P1000") || error.message.includes("Authentication")) {
        console.log("   → Authentication failed");
        console.log("   → Check username/password in connection string");
      } else if (error.message.includes("does not exist")) {
        console.log("   → Database does not exist");
      } else if (error.message.includes("Tenant or user not found")) {
        console.log("   → Username/password incorrect");
        console.log("   → Make sure password is URL-encoded (%24 for $, %21 for !)");
      }
    }
    return false;
  }
}

// Run all checks
console.log("\n" + "=".repeat(60));
testDatabase().then((dbConnected) => {
  console.log("\n" + "=".repeat(60));
  console.log("\n📊 SUMMARY");
  console.log("-".repeat(60));

  const issues: string[] = [];
  const warnings: string[] = [];

  if (!hasDbUrl) {
    issues.push("Missing database connection string (DATABASE_URL or POSTGRES_PRISMA_URL)");
  }
  
  if (!hasSupabase) {
    issues.push("Missing Supabase environment variables");
  }
  
  if (!dbConnected && hasDbUrl) {
    issues.push("Database connection failed");
  }

  if (!fs.existsSync(prismaClientPath)) {
    issues.push("Prisma client not generated");
  }

  if (issues.length === 0) {
    console.log("✅ All critical checks passed!");
    console.log("\n💡 Your app should be working!");
    console.log("   → Start dev server: npm run dev");
    console.log("   → Visit: http://localhost:3001");
  } else {
    console.log("❌ Issues found:");
    issues.forEach((issue) => console.log(`   - ${issue}`));
    
    console.log("\n💡 Fix these issues:");
    if (!hasDbUrl) {
      console.log("   1. Add DATABASE_URL or POSTGRES_PRISMA_URL to .env.local");
    }
    if (!hasSupabase) {
      console.log("   2. Add NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_ANON_KEY to .env.local");
    }
    if (!fs.existsSync(prismaClientPath)) {
      console.log("   3. Run: npx prisma generate");
    }
    if (!dbConnected && hasDbUrl) {
      console.log("   4. Fix database connection string");
      console.log("   5. Make sure Supabase project is not paused");
    }
  }

  process.exit(issues.length === 0 ? 0 : 1);
}).catch((err) => {
  console.error("\n❌ Diagnostic error:", err);
  process.exit(1);
});
