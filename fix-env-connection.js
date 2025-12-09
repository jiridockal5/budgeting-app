const fs = require('fs');
const path = require('path');

const envPath = path.join(__dirname, '.env');

console.log('🔧 Fixing .env file...\n');

// Read current .env
let envContent = '';
if (fs.existsSync(envPath)) {
  envContent = fs.readFileSync(envPath, 'utf8');
}

// Connection string with URL-encoded password
const connectionString = 'postgresql://postgres.puiswljpjrodpnflopdp:CT5ya4CB3dSB%24X%21@aws-0-eu-north-1.pooler.supabase.com:6543/postgres?sslmode=require';

// Update or add DATABASE_URL
if (envContent.includes('DATABASE_URL=')) {
  envContent = envContent.replace(/DATABASE_URL=.*/g, `DATABASE_URL=${connectionString}`);
} else {
  envContent = `DATABASE_URL=${connectionString}\n${envContent}`;
}

// Update or add POSTGRES_PRISMA_URL
if (envContent.includes('POSTGRES_PRISMA_URL=')) {
  envContent = envContent.replace(/POSTGRES_PRISMA_URL=.*/g, `POSTGRES_PRISMA_URL=${connectionString}`);
} else {
  envContent = `${envContent}\nPOSTGRES_PRISMA_URL=${connectionString}`;
}

// Ensure other vars exist
if (!envContent.includes('NEXT_PUBLIC_SUPABASE_URL=')) {
  envContent = `${envContent}\nNEXT_PUBLIC_SUPABASE_URL=https://puiswljpjrodpnflopdp.supabase.co`;
}

if (!envContent.includes('NEXT_PUBLIC_SUPABASE_ANON_KEY=')) {
  envContent = `${envContent}\nNEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InB1aXN3bGpwanJvZHBuZmxvcGRwIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjQyNDc0ODEsImV4cCI6MjA3OTgyMzQ4MX0.cfCtx-pbcKBlZ34oL6lGqd7MztQvgEKkOjdzHfSDyUo`;
}

// Write back
fs.writeFileSync(envPath, envContent, 'utf8');

console.log('✅ .env file updated!');
console.log('\nConnection string:');
console.log(`DATABASE_URL=postgresql://postgres.puiswljpjrodpnflopdp:CT5ya4CB3dSB%24X%21@aws-0-eu-north-1.pooler.supabase.com:6543/postgres?sslmode=require`);
console.log('\nPassword encoding:');
console.log('  Raw: CT5ya4CB3dSB$X!');
console.log('  Encoded: CT5ya4CB3dSB%24X%21');
console.log('\n⚠️  IMPORTANT: Restart your dev server (Ctrl+C then npm run dev)');
console.log('   The .env file is only loaded when Next.js starts.');
