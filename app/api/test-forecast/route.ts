import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { buildRevenueForecast } from "@/lib/revenueForecast";

/**
 * Test endpoint for the revenue forecast engine
 * 
 * GET /api/test-forecast
 * 
 * Creates a test scenario, runs the forecast, and returns results.
 * Optionally cleans up the test data after returning results.
 */
export async function GET() {
  try {
    // Verify Prisma client has the new models
    if (!prisma.forecastScenario) {
      return NextResponse.json(
        {
          success: false,
          error:
            "Prisma client not updated. Please run 'npx prisma generate' and restart your dev server.",
          hint: "The forecastScenario model is not available in the Prisma client. This usually means the client needs to be regenerated.",
        },
        { status: 500 }
      );
    }

    // Create test scenario with all 3 revenue streams
    const scenario = await prisma.forecastScenario.create({
      data: {
        name: "Test Forecast 2026",
        startMonth: new Date("2026-01-01"),
        months: 12,
        plgAssumptions: {
          create: {
            monthlyTraffic: 10000,
            trafficGrowthRate: 0.05, // 5% per month
            signupRate: 0.02, // 2%
            paidConversionRate: 0.10, // 10%
            churnRate: 0.03, // 3% per month
            arpa: 99, // $99/month
          },
        },
        salesAssumptions: {
          create: {
            monthlyLeads: 100,
            leadGrowthRate: 0.10, // 10% per month
            sqlRate: 0.30, // 30%
            winRate: 0.20, // 20%
            salesCycleMonths: 2,
            acv: 24000, // $24k ACV
            churnRate: 0.02, // 2% per month
            expansionRate: 0.05, // 5% per month
          },
        },
        partnerAssumptions: {
          create: {
            activePartners: 10,
            partnerGrowthRate: 0.05, // 5% per month
            leadsPerPartner: 5,
            conversionRate: 0.15, // 15%
            arpa: 149, // $149/month
            revenueShare: 0.20, // 20% to partners
            churnRate: 0.04, // 4% per month
          },
        },
      },
      include: {
        plgAssumptions: true,
        salesAssumptions: true,
        partnerAssumptions: true,
      },
    });

    // Run forecast calculation
    const forecast = await buildRevenueForecast(scenario.id);

    // Calculate summary stats
    const firstMonth = forecast[0];
    const lastMonth = forecast[forecast.length - 1];
    const totalNewCustomers = forecast.reduce(
      (sum, point) =>
        sum +
        point.newPlgCustomers +
        point.newSalesCustomers +
        point.newPartnerCustomers,
      0
    );

    const summary = {
      scenarioId: scenario.id,
      scenarioName: scenario.name,
      months: forecast.length,
      startingMrr: firstMonth.totalMrr,
      endingMrr: lastMonth.totalMrr,
      growthPercentage:
        firstMonth.totalMrr > 0
          ? ((lastMonth.totalMrr / firstMonth.totalMrr - 1) * 100).toFixed(2)
          : "0.00",
      totalNewCustomers: Math.round(totalNewCustomers),
      firstMonth: {
        plgMrr: firstMonth.plgMrr,
        salesMrr: firstMonth.salesMrr,
        partnerMrr: firstMonth.partnerMrr,
        totalMrr: firstMonth.totalMrr,
      },
      lastMonth: {
        plgMrr: lastMonth.plgMrr,
        salesMrr: lastMonth.salesMrr,
        partnerMrr: lastMonth.partnerMrr,
        totalMrr: lastMonth.totalMrr,
      },
    };

    // Return results (keeping test data for inspection)
    // To clean up: DELETE /api/test-forecast?cleanup=true&scenarioId=...
    return NextResponse.json({
      success: true,
      summary,
      forecast: forecast.map((point) => ({
        month: point.monthIndex + 1,
        date: point.date,
        plgMrr: Math.round(point.plgMrr * 100) / 100,
        salesMrr: Math.round(point.salesMrr * 100) / 100,
        partnerMrr: Math.round(point.partnerMrr * 100) / 100,
        totalMrr: Math.round(point.totalMrr * 100) / 100,
        newCustomers: {
          plg: Math.round(point.newPlgCustomers),
          sales: Math.round(point.newSalesCustomers),
          partner: Math.round(point.newPartnerCustomers),
          total: Math.round(
            point.newPlgCustomers +
              point.newSalesCustomers +
              point.newPartnerCustomers
          ),
        },
      })),
    });
  } catch (error) {
    console.error("Forecast test error:", error);
    return NextResponse.json(
      {
        success: false,
        error:
          error instanceof Error ? error.message : "Unknown error occurred",
        stack: process.env.NODE_ENV === "development" && error instanceof Error
          ? error.stack
          : undefined,
      },
      { status: 500 }
    );
  }
}

/**
 * DELETE endpoint to clean up test scenarios
 * 
 * DELETE /api/test-forecast?scenarioId=...
 */
export async function DELETE(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const scenarioId = searchParams.get("scenarioId");

    if (!scenarioId) {
      return NextResponse.json(
        { success: false, error: "scenarioId query parameter required" },
        { status: 400 }
      );
    }

    await prisma.forecastScenario.delete({
      where: { id: scenarioId },
    });

    return NextResponse.json({
      success: true,
      message: `Scenario ${scenarioId} deleted`,
    });
  } catch (error) {
    console.error("Cleanup error:", error);
    return NextResponse.json(
      {
        success: false,
        error:
          error instanceof Error ? error.message : "Unknown error occurred",
      },
      { status: 500 }
    );
  }
}