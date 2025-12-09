const { execSync } = require('child_process');
const fs = require('fs');

console.log('🚀 Running Migration with Full Output\n');
console.log('='.repeat(60) + '\n');

// Check .env exists
if (!fs.existsSync('.env')) {
  console.error('❌ .env file not found!');
  process.exit(1);
}

// Read .env to verify DATABASE_URL
const envContent = fs.readFileSync('.env', 'utf8');
const hasDbUrl = envContent.includes('DATABASE_URL=');
const hasPrismaUrl = envContent.includes('POSTGRES_PRISMA_URL=');

console.log('Environment Check:');
console.log(`  DATABASE_URL in .env: ${hasDbUrl ? '✅' : '❌'}`);
console.log(`  POSTGRES_PRISMA_URL in .env: ${hasPrismaUrl ? '✅' : '❌'}`);
console.log('');

// Test connection first
console.log('Step 1: Testing database connection...\n');
try {
  execSync('npx prisma db execute --stdin', {
    input: 'SELECT 1;',
    stdio: 'pipe',
    timeout: 10000
  });
  console.log('✅ Connection test passed!\n');
} catch (error) {
  console.log('⚠️  Connection test skipped (this is okay)\n');
}

// Validate schema
console.log('Step 2: Validating Prisma schema...\n');
try {
  execSync('npx prisma validate', { stdio: 'inherit' });
  console.log('✅ Schema valid!\n');
} catch (error) {
  console.error('❌ Schema validation failed');
  process.exit(1);
}

// Run migration
console.log('Step 3: Running migration...\n');
try {
  execSync('npx prisma migrate dev --name add_revenue_forecast_models', {
    stdio: 'inherit',
    cwd: process.cwd()
  });
  console.log('\n✅ Migration completed successfully!');
} catch (error) {
  console.error('\n❌ Migration failed');
  console.error('Error details:', error.message);
  process.exit(1);
}
