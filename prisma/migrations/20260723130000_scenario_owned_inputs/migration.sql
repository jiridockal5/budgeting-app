-- Independent scenarios: move assumptions / people / expenses onto ForecastScenario.
-- Existing plan-scoped rows attach to each plan's Default scenario.
-- Non-Default scenarios get a clone of Default's assumptions/people/expenses so
-- historical compares keep their cost base instead of suddenly zeroing out.

-- 1) Ensure every plan has a Default scenario
INSERT INTO "forecast_scenarios" ("id", "planId", "name", "startMonth", "months", "config", "createdAt", "updatedAt")
SELECT
  'migrated_default_' || p."id",
  p."id",
  'Default',
  p."startMonth",
  p."months",
  NULL,
  NOW(),
  NOW()
FROM "plans" p
WHERE NOT EXISTS (
  SELECT 1 FROM "forecast_scenarios" fs
  WHERE fs."planId" = p."id" AND fs."name" = 'Default'
);

-- 2) Add nullable scenarioId columns
ALTER TABLE "global_assumptions" ADD COLUMN IF NOT EXISTS "scenarioId" TEXT;
ALTER TABLE "people" ADD COLUMN IF NOT EXISTS "scenarioId" TEXT;
ALTER TABLE "expenses" ADD COLUMN IF NOT EXISTS "scenarioId" TEXT;

-- 3) Attach existing rows to Default scenario
UPDATE "global_assumptions" ga
SET "scenarioId" = fs."id"
FROM "forecast_scenarios" fs
WHERE fs."planId" = ga."planId"
  AND fs."name" = 'Default'
  AND ga."scenarioId" IS NULL;

UPDATE "people" pe
SET "scenarioId" = fs."id"
FROM "forecast_scenarios" fs
WHERE fs."planId" = pe."planId"
  AND fs."name" = 'Default'
  AND pe."scenarioId" IS NULL;

UPDATE "expenses" ex
SET "scenarioId" = fs."id"
FROM "forecast_scenarios" fs
WHERE fs."planId" = ex."planId"
  AND fs."name" = 'Default'
  AND ex."scenarioId" IS NULL;

-- 4) Backfill non-Default scenarios: clone Default assumptions
INSERT INTO "global_assumptions" (
  "id", "planId", "scenarioId",
  "cashOnHand", "plannedRaiseMonth", "plannedRaiseAmount", "fundraisingFees",
  "minCashBuffer", "targetRunwayMonths",
  "churnRate", "expansionRate", "paymentTimingDays", "priceUplift",
  "salaryTaxRate", "salaryGrowthRate", "commissionRate",
  "inflationRate", "baseAcv",
  "createdAt", "updatedAt"
)
SELECT
  'cloned_asm_' || ns."id",
  src."planId",
  ns."id",
  src."cashOnHand", src."plannedRaiseMonth", src."plannedRaiseAmount", src."fundraisingFees",
  src."minCashBuffer", src."targetRunwayMonths",
  src."churnRate", src."expansionRate", src."paymentTimingDays", src."priceUplift",
  src."salaryTaxRate", src."salaryGrowthRate", src."commissionRate",
  src."inflationRate", src."baseAcv",
  NOW(), NOW()
FROM "forecast_scenarios" ns
JOIN "forecast_scenarios" ds
  ON ds."planId" = ns."planId" AND ds."name" = 'Default'
JOIN "global_assumptions" src
  ON src."scenarioId" = ds."id"
WHERE ns."name" <> 'Default'
  AND NOT EXISTS (
    SELECT 1 FROM "global_assumptions" existing WHERE existing."scenarioId" = ns."id"
  );

-- Clone Default people onto non-Default scenarios
INSERT INTO "people" (
  "id", "name", "role", "type", "salary", "category", "fte",
  "startDate", "endDate", "config",
  "planId", "scenarioId",
  "createdAt", "updatedAt"
)
SELECT
  'cloned_person_' || ns."id" || '_' || pe."id",
  pe."name", pe."role", pe."type", pe."salary", pe."category", pe."fte",
  pe."startDate", pe."endDate", pe."config",
  pe."planId", ns."id",
  NOW(), NOW()
FROM "forecast_scenarios" ns
JOIN "forecast_scenarios" ds
  ON ds."planId" = ns."planId" AND ds."name" = 'Default'
JOIN "people" pe
  ON pe."scenarioId" = ds."id"
WHERE ns."name" <> 'Default'
  AND NOT EXISTS (
    SELECT 1 FROM "people" existing
    WHERE existing."scenarioId" = ns."id"
  );

-- Clone Default expenses onto non-Default scenarios
INSERT INTO "expenses" (
  "id", "planId", "scenarioId",
  "name", "category", "amount", "frequency",
  "startMonth", "endMonth", "config",
  "createdAt", "updatedAt"
)
SELECT
  'cloned_expense_' || ns."id" || '_' || ex."id",
  ex."planId", ns."id",
  ex."name", ex."category", ex."amount", ex."frequency",
  ex."startMonth", ex."endMonth", ex."config",
  NOW(), NOW()
FROM "forecast_scenarios" ns
JOIN "forecast_scenarios" ds
  ON ds."planId" = ns."planId" AND ds."name" = 'Default'
JOIN "expenses" ex
  ON ex."scenarioId" = ds."id"
WHERE ns."name" <> 'Default'
  AND NOT EXISTS (
    SELECT 1 FROM "expenses" existing
    WHERE existing."scenarioId" = ns."id"
  );

-- 5) Drop any orphan rows that still lack scenarioId (should be none)
DELETE FROM "global_assumptions" WHERE "scenarioId" IS NULL;
DELETE FROM "people" WHERE "scenarioId" IS NULL;
DELETE FROM "expenses" WHERE "scenarioId" IS NULL;

-- 6) Enforce NOT NULL + FKs + indexes
ALTER TABLE "global_assumptions" ALTER COLUMN "scenarioId" SET NOT NULL;
ALTER TABLE "people" ALTER COLUMN "scenarioId" SET NOT NULL;
ALTER TABLE "expenses" ALTER COLUMN "scenarioId" SET NOT NULL;

-- Drop old planId uniqueness on assumptions (name may vary by earlier migrations)
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM pg_constraint
    WHERE conname = 'global_assumptions_planId_key'
  ) THEN
    ALTER TABLE "global_assumptions" DROP CONSTRAINT "global_assumptions_planId_key";
  END IF;
END $$;

CREATE UNIQUE INDEX IF NOT EXISTS "global_assumptions_scenarioId_key" ON "global_assumptions"("scenarioId");
CREATE INDEX IF NOT EXISTS "global_assumptions_planId_idx" ON "global_assumptions"("planId");
CREATE INDEX IF NOT EXISTS "people_scenarioId_idx" ON "people"("scenarioId");
CREATE INDEX IF NOT EXISTS "expenses_scenarioId_idx" ON "expenses"("scenarioId");

ALTER TABLE "global_assumptions"
  DROP CONSTRAINT IF EXISTS "global_assumptions_scenarioId_fkey";
ALTER TABLE "global_assumptions"
  ADD CONSTRAINT "global_assumptions_scenarioId_fkey"
  FOREIGN KEY ("scenarioId") REFERENCES "forecast_scenarios"("id")
  ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "people"
  DROP CONSTRAINT IF EXISTS "people_scenarioId_fkey";
ALTER TABLE "people"
  ADD CONSTRAINT "people_scenarioId_fkey"
  FOREIGN KEY ("scenarioId") REFERENCES "forecast_scenarios"("id")
  ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "expenses"
  DROP CONSTRAINT IF EXISTS "expenses_scenarioId_fkey";
ALTER TABLE "expenses"
  ADD CONSTRAINT "expenses_scenarioId_fkey"
  FOREIGN KEY ("scenarioId") REFERENCES "forecast_scenarios"("id")
  ON DELETE CASCADE ON UPDATE CASCADE;
