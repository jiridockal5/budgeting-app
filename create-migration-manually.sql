-- Migration: add_revenue_forecast_models
-- This migration adds the forecast scenario and revenue assumptions tables

-- CreateTable
CREATE TABLE IF NOT EXISTS "forecast_scenarios" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "startMonth" TIMESTAMP(3) NOT NULL,
    "months" INTEGER NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "forecast_scenarios_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE IF NOT EXISTS "plg_revenue_assumptions" (
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
CREATE TABLE IF NOT EXISTS "sales_revenue_assumptions" (
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
CREATE TABLE IF NOT EXISTS "partner_revenue_assumptions" (
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
CREATE UNIQUE INDEX IF NOT EXISTS "plg_revenue_assumptions_scenarioId_key" ON "plg_revenue_assumptions"("scenarioId");

-- CreateIndex
CREATE UNIQUE INDEX IF NOT EXISTS "sales_revenue_assumptions_scenarioId_key" ON "sales_revenue_assumptions"("scenarioId");

-- CreateIndex
CREATE UNIQUE INDEX IF NOT EXISTS "partner_revenue_assumptions_scenarioId_key" ON "partner_revenue_assumptions"("scenarioId");

-- AddForeignKey
ALTER TABLE "plg_revenue_assumptions" ADD CONSTRAINT IF NOT EXISTS "plg_revenue_assumptions_scenarioId_fkey" FOREIGN KEY ("scenarioId") REFERENCES "forecast_scenarios"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "sales_revenue_assumptions" ADD CONSTRAINT IF NOT EXISTS "sales_revenue_assumptions_scenarioId_fkey" FOREIGN KEY ("scenarioId") REFERENCES "forecast_scenarios"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "partner_revenue_assumptions" ADD CONSTRAINT IF NOT EXISTS "partner_revenue_assumptions_scenarioId_fkey" FOREIGN KEY ("scenarioId") REFERENCES "forecast_scenarios"("id") ON DELETE CASCADE ON UPDATE CASCADE;
