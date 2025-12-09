/**
 * Test Prisma connection directly
 */
import { PrismaClient } from "@prisma/client";

async function test() {
  console.log("Testing Prisma connection...\n");
  
  const prisma = new PrismaClient({
    log: ["query", "info", "warn", "error"],
  });

  try {
    console.log("Attempting to connect...");
    await prisma.$connect();
    console.log("✅ Connected successfully!\n");
    
    console.log("Testing query...");
    const result = await prisma.$queryRaw`SELECT 1 as test`;
    console.log("✅ Query successful:", result);
    
    await prisma.$disconnect();
    console.log("\n✅ Connection test passed! Migration should work now.");
  } catch (error) {
    console.error("\n❌ Connection failed:");
    if (error instanceof Error) {
      console.error("Error:", error.message);
      if (error.message.includes("Tenant or user not found")) {
        console.error("\n💡 This means:");
        console.error("  - Password might be wrong");
        console.error("  - Username format might be wrong for pooler");
        console.error("  - Try checking Supabase dashboard for the correct connection string");
      }
    }
    await prisma.$disconnect();
    process.exit(1);
  }
}

test();
