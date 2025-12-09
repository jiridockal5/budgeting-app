# Budgeting App (Forecasting SaaS for Startups)

A lightweight, fast-to-setup forecasting tool designed for early-stage SaaS companies.  

The app focuses purely on **forecasting**, not reporting — helping founders plan their runway, hiring, expansion, churn, and future ARR for fundraising.

## 🚀 Tech Stack

- Next.js 15 (App Router)
- TypeScript
- Supabase (Auth + Postgres)
- Prisma ORM
- TailwindCSS
- Vercel Deployment

## 🧩 Features (MVP)

- User authentication (Supabase Auth)
- Forecasting models for ARR, churn, hiring, runway
- Clean UI inspired by Mixpanel, Chargebee, Linear
- Simple inputs → fast financial plans
- Designed for companies without a CFO

## ▶️ Running the project locally

```bash
npm install
npm run dev
```

## 🔧 Environment Variables

This project uses Supabase for authentication and database. The recommended way to set up environment variables is through the [Supabase + Vercel Integration](https://supabase.com/dashboard/project/_/integrations/vercel).

### Required Environment Variables

- `NEXT_PUBLIC_SUPABASE_URL` - Your Supabase project URL
- `NEXT_PUBLIC_SUPABASE_ANON_KEY` - Your Supabase anonymous key
- `POSTGRES_PRISMA_URL` - PostgreSQL connection string for Prisma (automatically set by Supabase integration)

### Local Development

Create a `.env.local` file in the root directory:

```env
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
POSTGRES_PRISMA_URL=postgresql://postgres:password@db.your-project.supabase.co:6543/postgres?sslmode=require
```

**Note:** The Supabase + Vercel integration automatically sets these variables. If you're using the integration, you don't need to manually set them in Vercel.

## 🧪 Testing the Revenue Forecast Engine

### 1. Run Database Migrations

**IMPORTANT:** Make sure your database connection is configured in `.env.local`:

The Prisma schema uses `POSTGRES_PRISMA_URL` (Supabase connection pooler with port 6543).

Add to `.env.local`:
```env
POSTGRES_PRISMA_URL=postgresql://postgres.puiswljpjrodpnflopdp:CT5ya4CB3dSB%24X%21@aws-0-eu-north-1.pooler.supabase.com:6543/postgres?sslmode=require
```

**⚠️ Make sure you use port 6543 (pooler), not 5432 (direct connection).**

See `SETUP_LOCAL_DATABASE.md` for detailed setup instructions.

Then run:

```bash
npx prisma migrate dev --name add_revenue_forecast_models
```

This will:
- Create the migration file
- Apply it to your database (creates the forecast tables)
- Automatically regenerate the Prisma client

**Tables created:**
- `forecast_scenarios`
- `plg_revenue_assumptions`
- `sales_revenue_assumptions`
- `partner_revenue_assumptions`

### 2. Generate Prisma Client (if migration doesn't auto-generate)

```bash
npx prisma generate
```

**Note:** After generating the Prisma client, you MUST restart your Next.js dev server for the changes to take effect.

### 3. Restart Dev Server

**CRITICAL:** After running migrations and generating the Prisma client, restart your dev server:

```bash
# Stop the server (Ctrl+C if running)
# Then restart:
npm run dev
```

### 4. Test the Forecast Engine

Then visit the test endpoint:

```
http://localhost:3001/api/test-forecast
```

This will:
- Create a test scenario with all 3 revenue streams (PLG, Sales, Partners)
- Run a 12-month forecast calculation
- Return JSON with monthly projections and summary stats

**Example Response:**
```json
{
  "success": true,
  "summary": {
    "scenarioId": "...",
    "months": 12,
    "startingMrr": 0,
    "endingMrr": 12345.67,
    "growthPercentage": "..." 
  },
  "forecast": [...]
}
```

### 5. Troubleshooting

If you get an error like `Cannot read properties of undefined (reading 'create')`:

1. ✅ **Run the migration:**
   ```bash
   npx prisma migrate dev
   ```

2. ✅ **Regenerate Prisma client:**
   ```bash
   npx prisma generate --force
   ```

3. ✅ **Restart your dev server** (this is critical!)

4. ✅ **Verify database connection** - check your `.env.local` has the correct `DATABASE_URL` or `POSTGRES_PRISMA_URL`

### 6. Using the Forecast Engine in Your App

```typescript
import { buildRevenueForecast } from "@/lib/revenueForecast";

const forecast = await buildRevenueForecast(scenarioId);
// Returns array of MonthlyPoint with MRR and customer data
```

### Revenue Streams

The engine supports 3 revenue streams:

1. **PLG (Self-service)**: Traffic → Signups → Paid conversions → MRR
2. **Sales-led**: Leads → SQLs → Wins (with sales cycle delay) → MRR
3. **Partners/Affiliates**: Partners → Leads → Conversions → MRR (with revenue share)
