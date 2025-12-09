/*
  Warnings:

  - You are about to alter the column `amount` on the `expenses` table. The data in that column could be lost. The data in that column will be cast from `DoublePrecision` to `Decimal(18,2)`.
  - The `frequency` column on the `expenses` table would be dropped and recreated. This will lead to data loss if there is data in the column.
  - Added the required column `startMonth` to the `expenses` table without a default value. This is not possible if the table is not empty.
  - Added the required column `months` to the `plans` table without a default value. This is not possible if the table is not empty.
  - Added the required column `startMonth` to the `plans` table without a default value. This is not possible if the table is not empty.

*/
-- CreateEnum
CREATE TYPE "ExpenseFrequency" AS ENUM ('MONTHLY', 'ONE_TIME', 'YEARLY');

-- AlterTable
ALTER TABLE "expenses" ADD COLUMN     "endMonth" TIMESTAMP(3),
ADD COLUMN     "startMonth" TIMESTAMP(3) NOT NULL,
ALTER COLUMN "amount" SET DATA TYPE DECIMAL(18,2),
DROP COLUMN "frequency",
ADD COLUMN     "frequency" "ExpenseFrequency" NOT NULL DEFAULT 'MONTHLY';

-- AlterTable
ALTER TABLE "plans" ADD COLUMN     "currency" TEXT NOT NULL DEFAULT 'EUR',
ADD COLUMN     "months" INTEGER NOT NULL,
ADD COLUMN     "startMonth" TIMESTAMP(3) NOT NULL,
ALTER COLUMN "organizationId" DROP NOT NULL;

-- CreateTable
CREATE TABLE "forecast_scenarios" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "startMonth" TIMESTAMP(3) NOT NULL,
    "months" INTEGER NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "forecast_scenarios_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "plg_revenue_assumptions" (
    "id" TEXT NOT NULL,
    "scenarioId" TEXT NOT NULL,
    "monthlyTraffic" DECIMAL(12,2) NOT NULL,
    "trafficGrowthRate" DECIMAL(5,4) NOT NULL,
    "signupRate" DECIMAL(5,4) NOT NULL,
    "paidConversionRate" DECIMAL(5,4) NOT NULL,
    "churnRate" DECIMAL(5,4) NOT NULL,
    "arpa" DECIMAL(12,2) NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "plg_revenue_assumptions_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "sales_revenue_assumptions" (
    "id" TEXT NOT NULL,
    "scenarioId" TEXT NOT NULL,
    "monthlyLeads" DECIMAL(12,2) NOT NULL,
    "leadGrowthRate" DECIMAL(5,4) NOT NULL,
    "sqlRate" DECIMAL(5,4) NOT NULL,
    "winRate" DECIMAL(5,4) NOT NULL,
    "salesCycleMonths" INTEGER NOT NULL,
    "acv" DECIMAL(12,2) NOT NULL,
    "churnRate" DECIMAL(5,4) NOT NULL,
    "expansionRate" DECIMAL(5,4) NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "sales_revenue_assumptions_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "partner_revenue_assumptions" (
    "id" TEXT NOT NULL,
    "scenarioId" TEXT NOT NULL,
    "activePartners" DECIMAL(12,2) NOT NULL,
    "partnerGrowthRate" DECIMAL(5,4) NOT NULL,
    "leadsPerPartner" DECIMAL(12,2) NOT NULL,
    "conversionRate" DECIMAL(5,4) NOT NULL,
    "arpa" DECIMAL(12,2) NOT NULL,
    "revenueShare" DECIMAL(5,4) NOT NULL,
    "churnRate" DECIMAL(5,4) NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "partner_revenue_assumptions_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "plg_revenue_assumptions_scenarioId_key" ON "plg_revenue_assumptions"("scenarioId");

-- CreateIndex
CREATE UNIQUE INDEX "sales_revenue_assumptions_scenarioId_key" ON "sales_revenue_assumptions"("scenarioId");

-- CreateIndex
CREATE UNIQUE INDEX "partner_revenue_assumptions_scenarioId_key" ON "partner_revenue_assumptions"("scenarioId");

-- AddForeignKey
ALTER TABLE "plg_revenue_assumptions" ADD CONSTRAINT "plg_revenue_assumptions_scenarioId_fkey" FOREIGN KEY ("scenarioId") REFERENCES "forecast_scenarios"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "sales_revenue_assumptions" ADD CONSTRAINT "sales_revenue_assumptions_scenarioId_fkey" FOREIGN KEY ("scenarioId") REFERENCES "forecast_scenarios"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "partner_revenue_assumptions" ADD CONSTRAINT "partner_revenue_assumptions_scenarioId_fkey" FOREIGN KEY ("scenarioId") REFERENCES "forecast_scenarios"("id") ON DELETE CASCADE ON UPDATE CASCADE;
