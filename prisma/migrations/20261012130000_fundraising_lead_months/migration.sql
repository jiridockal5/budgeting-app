-- Months of fundraising process before cash needs to land.
ALTER TABLE "global_assumptions"
  ADD COLUMN "fundraisingLeadMonths" INTEGER NOT NULL DEFAULT 6;
