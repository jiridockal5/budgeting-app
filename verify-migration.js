const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

async function verify() {
  try {
    console.log('🔍 Verifying migration...\n');
    
    // Try to query the forecast_scenarios table
    const result = await prisma.$queryRaw`
      SELECT table_name 
      FROM information_schema.tables 
      WHERE table_schema = 'public' 
      AND table_name IN ('forecast_scenarios', 'plg_revenue_assumptions', 'sales_revenue_assumptions', 'partner_revenue_assumptions')
      ORDER BY table_name;
    `;
    
    const tables = result.map(r => r.table_name);
    
    console.log('Tables found:');
    tables.forEach(table => console.log(`  ✅ ${table}`));
    
    const expectedTables = [
      'forecast_scenarios',
      'plg_revenue_assumptions', 
      'sales_revenue_assumptions',
      'partner_revenue_assumptions'
    ];
    
    const allExist = expectedTables.every(t => tables.includes(t));
    
    if (allExist) {
      console.log('\n✅ All forecast tables exist! Migration successful.');
      console.log('\nNext:');
      console.log('1. Run: npx prisma generate (if not done)');
      console.log('2. Restart dev server: npm run dev');
      console.log('3. Test: http://localhost:3001/api/test-forecast');
    } else {
      const missing = expectedTables.filter(t => !tables.includes(t));
      console.log(`\n⚠️  Missing tables: ${missing.join(', ')}`);
      console.log('Migration may not have completed. Check connection string.');
    }
    
  } catch (error) {
    console.error('\n❌ Verification failed:', error.message);
    if (error.message.includes('Tenant or user not found')) {
      console.error('\n💡 Database connection issue. Check:');
      console.error('   - DATABASE_URL in .env file');
      console.error('   - Password is URL-encoded');
      console.error('   - Connection string uses port 6543 (pooler)');
    }
  } finally {
    await prisma.$disconnect();
  }
}

verify();
