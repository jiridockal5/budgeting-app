import { afterEach, describe, expect, it } from "vitest";
import { setActiveCurrency } from "../currency";
import { buildFundraisingCopy } from "../fundraisingCopy";
import type { FundraisingRecommendation, FundraisingStatus } from "../revenueForecast";

afterEach(() => {
  setActiveCurrency("EUR");
});

function rec(
  status: FundraisingStatus,
  overrides: Partial<FundraisingRecommendation> = {}
): FundraisingRecommendation {
  return {
    status,
    effectiveBuffer: 100000,
    targetRunwayMonths: 18,
    fundraisingLeadMonths: 6,
    bufferBreachMonth: "2026-09",
    recommendedStartMonth: "2026-03",
    recommendedCloseMonth: "2026-09",
    overdue: false,
    recommendedNetAmount: 1200000,
    recommendedGrossAmount: 1200000,
    coversThroughMonth: "2028-02",
    extrapolated: false,
    plannedRound: null,
    totalRoundGross: 1200000,
    roundMode: "new",
    lowestCash: { month: "2026-11", amount: 12450 },
    firstMonthBurn: 80000,
    lastMonthBurn: 80000,
    avgBurn: 80000,
    driver: "steady_burn",
    largeRaiseWarning: false,
    fundedMonths: null,
    ...overrides,
  };
}

const BANNED = /\b(bridge|breach|gross|net|window)\b|additional capital/i;

function mainText(copy: ReturnType<typeof buildFundraisingCopy>): string {
  return [
    copy.headline,
    copy.raiseCaption,
    copy.why,
    copy.lastsLine,
    copy.dashboardLine,
    copy.largeRaiseWarningText,
  ]
    .filter(Boolean)
    .join("\n");
}

describe("fundraising copy", () => {
  it("uses the active currency and full month names", () => {
    setActiveCurrency("USD");
    const copy = buildFundraisingCopy(rec("raise_recommended"));
    expect(copy.tone).toBe("amber");
    expect(copy.headline).toBe("Start fundraising in March 2026.");
    expect(copy.raiseAmount).toBe("$1.2M");
    expect(copy.closeMonthLabel).toBe("September 2026");
    expect(copy.startLabel).toBe("March 2026");
    expect(copy.raiseCaption).toBeNull();
    expect(copy.why).toBe(
      "At your current burn of ~$80K/month, cash drops below your $100K cash buffer in September 2026."
    );
    expect(copy.lastsLine).toBe(
      "This round lasts 18 months (through February 2028) while keeping at least $100K in the bank."
    );
    expect(copy.dashboardLine).toBe(
      "Start fundraising in March 2026. · Raise $1.2M by September 2026"
    );
    expect(copy.details).toContain("Lead time used: 6 months");
    expect(copy.details).toContain("Lowest money in the bank: $12,450 in November 2026");
    expect(mainText(copy)).not.toMatch(BANNED);
  });

  it("says how many months of funding remain when cash later crosses the buffer", () => {
    setActiveCurrency("USD");
    const copy = buildFundraisingCopy(
      rec("no_raise_needed", {
        fundedMonths: 14,
        totalRoundGross: 0,
        recommendedNetAmount: 0,
        recommendedGrossAmount: 0,
        bufferBreachMonth: null,
        recommendedStartMonth: null,
        recommendedCloseMonth: null,
        coversThroughMonth: null,
        lowestCash: null,
      }),
      { lastForecastMonth: "2027-12" }
    );
    expect(copy.tone).toBe("green");
    expect(copy.headline).toBe("You're funded for the next 14 months. No raise needed.");
    expect(copy.showKeyNumbers).toBe(false);
    expect(copy.why).toBeNull();
    expect(copy.dashboardLine).toBe(copy.headline);
    expect(mainText(copy)).not.toMatch(BANNED);
  });

  it("names the last forecast month when cash stays above the buffer", () => {
    setActiveCurrency("USD");
    const copy = buildFundraisingCopy(
      rec("no_raise_needed", {
        fundedMonths: null,
        totalRoundGross: 0,
        recommendedNetAmount: 0,
        recommendedGrossAmount: 0,
        coversThroughMonth: null,
        lowestCash: null,
      }),
      { lastForecastMonth: "2027-12" }
    );
    expect(copy.headline).toBe("You're funded through December 2027. No raise needed.");
    expect(copy.showKeyNumbers).toBe(false);
    expect(copy.dashboardLine).toBe(copy.headline);
  });

  it("describes a planned round that already covers the target", () => {
    setActiveCurrency("USD");
    const copy = buildFundraisingCopy(
      rec("planned_round_sufficient", {
        totalRoundGross: 0,
        recommendedNetAmount: 0,
        recommendedGrossAmount: 0,
        coversThroughMonth: "2026-12",
        targetRunwayMonths: 18,
        effectiveBuffer: 100000,
        plannedRound: {
          month: "2026-06",
          grossAmount: 2000000,
          netAmount: 2000000,
          landsBeforeBreach: true,
        },
      })
    );
    expect(copy.tone).toBe("green");
    expect(copy.headline).toBe("Your planned round covers you through December 2026.");
    expect(copy.showKeyNumbers).toBe(false);
    expect(copy.why).toBeNull();
    expect(copy.lastsLine).toBe(
      "This round lasts 18 months (through December 2026) while keeping at least $100K in the bank."
    );
    expect(mainText(copy)).not.toMatch(BANNED);
  });

  it("says to start now when the process is already overdue", () => {
    setActiveCurrency("USD");
    const copy = buildFundraisingCopy(
      rec("raise_recommended", {
        overdue: true,
        totalRoundGross: 110000,
        recommendedGrossAmount: 110000,
        recommendedNetAmount: 110000,
        recommendedStartMonth: "2025-01",
        recommendedCloseMonth: "2025-04",
        bufferBreachMonth: "2025-04",
        coversThroughMonth: "2025-09",
        targetRunwayMonths: 6,
        effectiveBuffer: 30000,
        avgBurn: 20000,
        firstMonthBurn: 20000,
        lastMonthBurn: 20000,
      })
    );
    expect(copy.tone).toBe("red");
    expect(copy.headline).toBe("Start fundraising now.");
    expect(copy.raiseAmount).toBe("$110K");
    expect(copy.startLabel).toBe("Now");
    expect(copy.closeMonthLabel).toBe("April 2025");
    expect(copy.why).toBe(
      "At your current burn of ~$20K/month, cash drops below your $30K cash buffer in April 2025."
    );
    expect(copy.dashboardLine).toBe("Start fundraising now. · Raise $110K by April 2025");
    expect(mainText(copy)).not.toMatch(BANNED);
  });

  it("replaces a late planned round with one raise", () => {
    setActiveCurrency("USD");
    const copy = buildFundraisingCopy(
      rec("planned_round_too_late", {
        overdue: true,
        roundMode: "replaces_planned",
        driver: "late_planned_round",
        totalRoundGross: 180000,
        recommendedGrossAmount: 60000,
        recommendedNetAmount: 60000,
        recommendedStartMonth: "2025-01",
        recommendedCloseMonth: "2025-03",
        bufferBreachMonth: "2025-03",
        coversThroughMonth: "2025-08",
        targetRunwayMonths: 6,
        effectiveBuffer: 10000,
        plannedRound: {
          month: "2025-06",
          grossAmount: 200000,
          netAmount: 200000,
          landsBeforeBreach: false,
        },
      })
    );
    expect(copy.tone).toBe("red");
    expect(copy.headline).toBe("Start fundraising now.");
    expect(copy.raiseAmount).toBe("$180K");
    expect(copy.raiseCaption).toBe("instead of your planned $200K in June 2025");
    expect(copy.why).toBe(
      "Your planned round in June 2025 arrives after cash drops below your cash buffer."
    );
    expect(copy.details.some((line) => line.startsWith("Single raise:"))).toBe(true);
    expect(mainText(copy)).not.toMatch(BANNED);
  });

  it("shows one total on top of a planned round that is too small", () => {
    setActiveCurrency("USD");
    const copy = buildFundraisingCopy(
      rec("additional_capital_needed", {
        overdue: true,
        roundMode: "adds_to_planned",
        totalRoundGross: 60000,
        recommendedGrossAmount: 45000,
        recommendedNetAmount: 45000,
        recommendedStartMonth: "2025-01",
        recommendedCloseMonth: "2025-03",
        bufferBreachMonth: "2025-03",
        coversThroughMonth: "2025-05",
        targetRunwayMonths: 3,
        effectiveBuffer: 10000,
        avgBurn: 20000,
        plannedRound: {
          month: "2025-02",
          grossAmount: 15000,
          netAmount: 15000,
          landsBeforeBreach: true,
        },
      })
    );
    expect(copy.raiseAmount).toBe("$60K");
    expect(copy.raiseCaption).toBe("on top of your planned $15K");
    expect(copy.why).toBe(
      "At your current burn of ~$20K/month, cash drops below your $10K cash buffer in March 2025."
    );
    expect(copy.lastsLine).toBe(
      "This round lasts 3 months (through May 2025) while keeping at least $10K in the bank."
    );
    expect(mainText(copy)).not.toMatch(BANNED);
  });

  it("asks for the two inputs when they are missing", () => {
    const copy = buildFundraisingCopy(
      rec("inputs_missing", {
        effectiveBuffer: 0,
        targetRunwayMonths: null,
        totalRoundGross: 0,
        recommendedNetAmount: 0,
        recommendedGrossAmount: 0,
        bufferBreachMonth: null,
        recommendedStartMonth: null,
        recommendedCloseMonth: null,
        coversThroughMonth: null,
        lowestCash: null,
      })
    );
    expect(copy.tone).toBe("grey");
    expect(copy.headline).toBe(
      "Set a cash buffer and target runway to get a recommendation."
    );
    expect(copy.showKeyNumbers).toBe(false);
    expect(copy.why).toBeNull();
    expect(copy.details).toEqual([]);
    expect(copy.dashboardLine).toBe(copy.headline);
  });

  it("explains burn growth and warns when the raise is large", () => {
    setActiveCurrency("USD");
    const copy = buildFundraisingCopy(
      rec("raise_recommended", {
        driver: "burn_growth",
        largeRaiseWarning: true,
        firstMonthBurn: 40000,
        lastMonthBurn: 95000,
        extrapolated: true,
      }),
      { lastForecastMonth: "2026-12" }
    );
    expect(copy.why).toBe("Your monthly burn grows from $40K to $95K");
    expect(copy.largeRaiseWarningText).toBe(
      "This is a large raise driven by cost growth. Review your hiring plan and expenses."
    );
    expect(copy.details).toContain(
      "The forecast ends in December 2026; months after that assume your last month's burn of $95,000."
    );
    expect(mainText(copy)).not.toMatch(BANNED);
  });
});
