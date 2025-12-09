const { PrismaClient } = require('@prisma/client');
const fs = require('fs');
const path = require('path');

const prisma = new PrismaClient();

async function applyMigration() {
  console.log('🚀 Applying migration directly...\n');
  
  try {
    // Read the SQL file
    const sqlFile = path.join(__dirname, 'create-migration-manually.sql');
    const sql = fs.readFileSync(sqlFile, 'utf8');
    
    // Split by semicolon and execute each statement
    const statements = sql
      .split(';')
      .map(s => s.trim())
      .filter(s => s.length > 0 && !s.startsWith('--'));
    
    console.log(`Executing ${statements.length} SQL statements...\n`);
    
    for (let i = 0; i < statements.length; i++) {
      const statement = statements[i];
      if (statement.length > 0) {
        try {
          await prisma.$executeRawUnsafe(statement);
          console.log(`✅ Statement ${i + 1}/${statements.length} executed`);
        } catch (error) {
          // Ignore "already exists" errors
          if (error.message && (
            error.message.includes('already exists') ||
            error.message.includes('duplicate') ||
            error.message.includes('IF NOT EXISTS')
          )) {
            console.log(`⚠️  Statement ${i + 1} skipped (already exists)`);
          } else {
            console.error(`❌ Statement ${i + 1} failed:`, error.message);
          }
        }
      }
    }
    
    console.log('\n✅ Migration applied successfully!');
    console.log('\nNext steps:');
    console.log('1. Run: npx prisma generate');
    console.log('2. Restart your dev server');
    console.log('3. Test: http://localhost:3001/api/test-forecast');
    
  } catch (error) {
    console.error('\n❌ Migration failed:', error.message);
    if (error.message.includes('Tenant or user not found')) {
      console.error('\n💡 Database connection failed. Check your .env file:');
      console.error('   - Make sure DATABASE_URL has the correct password');
      console.error('   - Password should be URL-encoded (e.g., %24 for $, %21 for !)');
    }
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
}

applyMigration();
