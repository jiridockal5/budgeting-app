require('dotenv').config();

console.log('🔍 Database Connection Diagnostics\n');
console.log('='.repeat(60) + '\n');

const dbUrl = process.env.DATABASE_URL || process.env.POSTGRES_PRISMA_URL;

if (!dbUrl) {
  console.error('❌ No DATABASE_URL or POSTGRES_PRISMA_URL found!');
  process.exit(1);
}

console.log('Connection String Found:\n');

// Parse the URL to show details
try {
  // Replace postgresql:// with http:// for URL parsing
  const urlStr = dbUrl.replace('postgresql://', 'http://');
  const url = new URL(urlStr);
  
  console.log('Host:', url.hostname);
  console.log('Port:', url.port);
  console.log('Username:', url.username);
  console.log('Password length:', url.password ? url.password.length : 0);
  
  // Show password encoding status
  const password = url.password || '';
  console.log('\nPassword Analysis:');
  console.log('  Contains %24 (encoded $):', password.includes('%24') ? '✅ YES' : '❌ NO');
  console.log('  Contains %21 (encoded !):', password.includes('%21') ? '✅ YES' : '❌ NO');
  console.log('  Contains raw $:', password.includes('$') && !password.includes('%24') ? '⚠️  YES - PROBLEM!' : '✅ NO');
  console.log('  Contains raw !:', password.includes('!') && !password.includes('%21') ? '⚠️  YES - PROBLEM!' : '✅ NO');
  
  // Show first/last few chars of password (for debugging)
  if (password.length > 0) {
    const masked = password.substring(0, 5) + '...' + password.substring(password.length - 5);
    console.log('  Password preview:', masked);
  }
  
  console.log('\n' + '='.repeat(60));
  console.log('\nExpected password format: CT5ya4CB3dSB%24X%21');
  console.log('(Where %24 = $ and %21 = !)\n');
  
  if (password.includes('$') || password.includes('!')) {
    console.log('⚠️  ISSUE DETECTED: Password contains raw special characters!');
    console.log('   These need to be URL-encoded in .env files.');
    console.log('\nSolution:');
    console.log('  1. Make sure password uses %24 instead of $');
    console.log('  2. Make sure password uses %21 instead of !');
    console.log('  3. Restart dev server after updating .env');
  } else if (password.includes('%24') && password.includes('%21')) {
    console.log('✅ Password appears correctly URL-encoded.');
    console.log('\nIf connection still fails:');
    console.log('  1. Restart dev server (env vars load at startup)');
    console.log('  2. Password in Supabase might have changed');
    console.log('  3. Try resetting password in Supabase dashboard');
  }
  
} catch (error) {
  console.error('❌ Could not parse connection string:', error.message);
  console.log('\nFull connection string (first 100 chars):');
  console.log(dbUrl.substring(0, 100) + '...');
}
