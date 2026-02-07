-- CreateTable
CREATE TABLE "global_assumptions" (
    "id" TEXT NOT NULL,
    "planId" TEXT NOT NULL,
    "cac" DECIMAL(12,2) NOT NULL,
    "churnRate" DECIMAL(5,2) NOT NULL,
    "expansionRate" DECIMAL(5,2) NOT NULL,
    "baseAcv" DECIMAL(12,2) NOT NULL,
    "salaryTaxRate" DECIMAL(5,2) NOT NULL,
    "salaryGrowthRate" DECIMAL(5,2) NOT NULL,
    "inflationRate" DECIMAL(5,2) NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "global_assumptions_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "global_assumptions_planId_key" ON "global_assumptions"("planId");

-- AddForeignKey
ALTER TABLE "global_assumptions" ADD CONSTRAINT "global_assumptions_planId_fkey" FOREIGN KEY ("planId") REFERENCES "plans"("id") ON DELETE CASCADE ON UPDATE CASCADE;
