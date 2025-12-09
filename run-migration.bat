@echo off
echo ========================================
echo Revenue Forecast Migration Setup
echo ========================================
echo.

echo Step 1: Checking environment variables...
if not defined POSTGRES_PRISMA_URL (
    echo [WARNING] POSTGRES_PRISMA_URL is not set
    echo.
    echo Please add to your .env.local file:
    echo POSTGRES_PRISMA_URL=postgresql://postgres.puiswljpjrodpnflopdp:CT5ya4CB3dSB%%24X%%21@aws-0-eu-north-1.pooler.supabase.com:6543/postgres?sslmode=require
    echo.
    echo Press any key to continue anyway, or Ctrl+C to cancel and update .env.local first...
    pause
)

echo.
echo Step 2: Validating Prisma schema...
call npx prisma validate
if errorlevel 1 (
    echo [ERROR] Schema validation failed
    pause
    exit /b 1
)

echo.
echo Step 3: Running migration...
call npx prisma migrate dev --name add_revenue_forecast_models
if errorlevel 1 (
    echo [ERROR] Migration failed
    echo.
    echo Common issues:
    echo - POSTGRES_PRISMA_URL not set or incorrect
    echo - Using port 5432 instead of 6543
    echo - Database connection timeout
    echo.
    echo See SETUP_LOCAL_DATABASE.md for troubleshooting
    pause
    exit /b 1
)

echo.
echo Step 4: Generating Prisma client...
call npx prisma generate

echo.
echo ========================================
echo Migration completed successfully!
echo ========================================
echo.
echo Next steps:
echo 1. Restart your dev server: npm run dev
echo 2. Test the endpoint: http://localhost:3001/api/test-forecast
echo.
pause