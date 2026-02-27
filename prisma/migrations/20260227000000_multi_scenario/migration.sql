-- DropIndex - Allow multiple forecast scenarios per plan
DROP INDEX IF EXISTS "forecast_scenarios_planId_key";

-- Add cash on hand to global assumptions
ALTER TABLE "global_assumptions" ADD COLUMN IF NOT EXISTS "cashOnHand" DECIMAL(14,2) NOT NULL DEFAULT 0;

-- Add Stripe customer ID to users
ALTER TABLE "users" ADD COLUMN IF NOT EXISTS "stripeCustomerId" TEXT UNIQUE;

-- Create subscription status enum
DO $$ BEGIN
  CREATE TYPE "SubscriptionStatus" AS ENUM ('ACTIVE', 'PAST_DUE', 'CANCELLED', 'TRIALING', 'INCOMPLETE');
EXCEPTION
  WHEN duplicate_object THEN null;
END $$;

-- Create subscriptions table
CREATE TABLE IF NOT EXISTS "subscriptions" (
  "id" TEXT NOT NULL,
  "userId" TEXT NOT NULL UNIQUE,
  "stripeSubscriptionId" TEXT NOT NULL UNIQUE,
  "stripePriceId" TEXT NOT NULL,
  "status" "SubscriptionStatus" NOT NULL DEFAULT 'ACTIVE',
  "currentPeriodEnd" TIMESTAMP(3) NOT NULL,
  "cancelAtPeriodEnd" BOOLEAN NOT NULL DEFAULT false,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "subscriptions_pkey" PRIMARY KEY ("id"),
  CONSTRAINT "subscriptions_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- Add indexes
CREATE INDEX IF NOT EXISTS "revenue_streams_planId_idx" ON "revenue_streams"("planId");
CREATE INDEX IF NOT EXISTS "expenses_planId_idx" ON "expenses"("planId");
CREATE INDEX IF NOT EXISTS "people_planId_idx" ON "people"("planId");
CREATE INDEX IF NOT EXISTS "metrics_planId_idx" ON "metrics"("planId");
CREATE INDEX IF NOT EXISTS "forecast_scenarios_planId_idx" ON "forecast_scenarios"("planId");
