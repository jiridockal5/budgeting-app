-- Cash & fundraising defaults
ALTER TABLE "global_assumptions"
  ADD COLUMN IF NOT EXISTS "raiseMonth" TEXT,
  ADD COLUMN IF NOT EXISTS "fundraisingFees" DECIMAL(5,2) NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS "minCashBuffer" DECIMAL(14,2),
  ADD COLUMN IF NOT EXISTS "targetRunwayMonths" INTEGER;

-- Revenue defaults
ALTER TABLE "global_assumptions"
  ADD COLUMN IF NOT EXISTS "paymentTimingDays" INTEGER NOT NULL DEFAULT 30,
  ADD COLUMN IF NOT EXISTS "priceUplift" DECIMAL(5,2);

-- Team defaults
ALTER TABLE "global_assumptions"
  ADD COLUMN IF NOT EXISTS "commissionRate" DECIMAL(5,2) NOT NULL DEFAULT 0;

-- Legacy compatibility defaults
ALTER TABLE "global_assumptions"
  ALTER COLUMN "cac" SET DEFAULT 0,
  ALTER COLUMN "baseAcv" SET DEFAULT 0;
