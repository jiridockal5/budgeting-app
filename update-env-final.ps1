# Update .env with connection string from Vercel (URL-encoded for local use)

# Raw connection string from Vercel (as shown)
$vercelConnectionString = "postgresql://postgres.puiswljpjrodpnflopdp:CT5ya4CB3dSB`$X!@aws-0-eu-north-1.pooler.supabase.com:6543/postgres?sslmode=require"

# URL-encoded version for .env file (local use)
$encodedConnectionString = "postgresql://postgres.puiswljpjrodpnflopdp:CT5ya4CB3dSB%24X%21@aws-0-eu-north-1.pooler.supabase.com:6543/postgres?sslmode=require"

Write-Host "Updating .env file..."
Write-Host "Using connection string from Vercel (with URL-encoded password for local use)"
Write-Host ""

$envContent = @"
DATABASE_URL=$encodedConnectionString
NEXT_PUBLIC_SUPABASE_URL=https://puiswljpjrodpnflopdp.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InB1aXN3bGpwanJvZHBuZmxvcGRwIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjQyNDc0ODEsImV4cCI6MjA3OTgyMzQ4MX0.cfCtx-pbcKBlZ34oL6lGqd7MztQvgEKkOjdzHfSDyUo
POSTGRES_PRISMA_URL=$encodedConnectionString
"@

$envContent | Out-File -FilePath ".env" -Encoding utf8 -NoNewline

Write-Host "✅ .env file updated!"
Write-Host ""
Write-Host "Password encoding:"
Write-Host "  Raw (Vercel):    CT5ya4CB3dSB`$X!"
Write-Host "  Encoded (.env):  CT5ya4CB3dSB%24X%21"
Write-Host ""
Write-Host "Now try: npm run migrate:forecast"
