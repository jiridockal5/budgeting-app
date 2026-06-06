-- People: support contractors/advisors, departures, and a flexible cost model
ALTER TABLE "people" ADD COLUMN IF NOT EXISTS "type" TEXT NOT NULL DEFAULT 'employee';
ALTER TABLE "people" ADD COLUMN IF NOT EXISTS "endDate" TIMESTAMP(3);
ALTER TABLE "people" ADD COLUMN IF NOT EXISTS "config" JSONB;

-- Non-people expenses: flexible cost model (growth, % of revenue, per-unit, steps, overrides)
ALTER TABLE "expenses" ADD COLUMN IF NOT EXISTS "config" JSONB;
