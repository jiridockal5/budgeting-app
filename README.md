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
