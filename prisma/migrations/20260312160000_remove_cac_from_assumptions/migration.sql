-- AlterTable: remove legacy CAC column (now computed from GTM expenses)
ALTER TABLE "global_assumptions" DROP COLUMN IF EXISTS "cac";
