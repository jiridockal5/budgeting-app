# Update .env file with correctly URL-encoded connection strings

$envContent = @"
DATABASE_URL=postgresql://postgres.puiswljpjrodpnflopdp:CT5ya4CB3dSB%24X%21@aws-0-eu-north-1.pooler.supabase.com:6543/postgres?sslmode=require
NEXT_PUBLIC_SUPABASE_URL=https://puiswljpjrodpnflopdp.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InB1aXN3bGpwanJvZHBuZmxvcGRwIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjQyNDc0ODEsImV4cCI6MjA3OTgyMzQ4MX0.cfCtx-pbcKBlZ34oL6lGqd7MztQvgEKkOjdzHfSDyUo
POSTGRES_PRISMA_URL=postgresql://postgres.puiswljpjrodpnflopdp:CT5ya4CB3dSB%24X%21@aws-0-eu-north-1.pooler.supabase.com:6543/postgres?sslmode=require
"@

$envContent | Out-File -FilePath ".env" -Encoding utf8 -NoNewline

Write-Host "✅ .env file updated with URL-encoded connection strings!"
Write-Host ""
Write-Host "Key changes:"
Write-Host "  - Password encoded: CT5ya4CB3dSB`$X! → CT5ya4CB3dSB%24X%21"
Write-Host "  - Both DATABASE_URL and POSTGRES_PRISMA_URL use pooler (port 6543)"
Write-Host ""
Write-Host "Next step: Run 'npm run migrate:forecast'"
