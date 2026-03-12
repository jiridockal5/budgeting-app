-- Rename raiseMonth -> plannedRaiseMonth (preserve existing data)
ALTER TABLE "global_assumptions"
  RENAME COLUMN "raiseMonth" TO "plannedRaiseMonth";

-- Add plannedRaiseAmount for expected gross funding proceeds
ALTER TABLE "global_assumptions"
  ADD COLUMN "plannedRaiseAmount" DECIMAL(14,2);
