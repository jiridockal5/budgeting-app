# Try updating .env with connection string wrapped in quotes (sometimes needed)

$encodedPassword = "CT5ya4CB3dSB%24X%21"
$rawPassword = "CT5ya4CB3dSB`$X!"

Write-Host "Trying connection strings with different password formats..."
Write-Host ""

# Option 1: URL-encoded password
$conn1 = "postgresql://postgres.puiswljpjrodpnflopdp:${encodedPassword}@aws-0-eu-north-1.pooler.supabase.com:6543/postgres?sslmode=require"

# Option 2: Try with quoted connection string
$conn2 = "`"postgresql://postgres.puiswljpjrodpnflopdp:${rawPassword}@aws-0-eu-north-1.pooler.supabase.com:6543/postgres?sslmode=require`""

$envContent = @"
# Try Option 1: URL-encoded password (most common)
DATABASE_URL=$conn1
POSTGRES_PRISMA_URL=$conn1

# Keep other vars
NEXT_PUBLIC_SUPABASE_URL=https://puiswljpjrodpnflopdp.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InB1aXN3bGpwanJvZHBuZmxvcGRwIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjQyNDc0ODEsImV4cCI6MjA3OTgyMzQ4MX0.cfCtx-pbcKBlZ34oL6lGqd7MztQvgEKkOjdzHfSDyUo
"@

$envContent | Out-File -FilePath ".env" -Encoding utf8 -NoNewline

Write-Host "✅ Updated .env with URL-encoded password"
Write-Host ""
Write-Host "If this still doesn't work, the password in Vercel might be different."
Write-Host "Please check:"
Write-Host "1. Go to Vercel → Settings → Environment Variables"
Write-Host "2. Click on DATABASE_URL to reveal the value"
Write-Host "3. Copy the ENTIRE connection string"
Write-Host "4. Make sure the password matches: CT5ya4CB3dSB`$X!"
Write-Host ""
Write-Host "If password is different, update the script with the correct one."
