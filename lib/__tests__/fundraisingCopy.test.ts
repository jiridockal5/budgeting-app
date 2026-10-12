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
    lowestCash: { month: "2026-11", amount: -1100000 },
    firstMonthBurn: 80000,
    lastMonthBurn: 80000,
    avgBurn: 80000,
    driver: "steady_burn",
    largeRaiseWarning: false,
    fundedMonths: null,
    fundraisingFeePercent: 0,
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
    expect(copy.derivation?.steps.map((step) => step.title)).toEqual([
      "When cash runs low",
      "How much cash is missing",
      "From shortfall to raise",
    ]);
    expect(copy.derivation?.steps[0].equation).toBe(
      "Buffer crossed September 2026 − 6 months lead time = start March 2026."
    );
    expect(copy.derivation?.steps[1].equation).toBe(
      "Cash buffer $100,000 − lowest balance −$1,100,000 = $1,200,000 missing."
    );
    expect(copy.derivation?.steps[1].rows[0].negative).toBe(true);
    expect(copy.derivation?.steps[2].result).toBe("$1.2M");
    expect(copy.derivation?.steps[2].equation).toContain("already a multiple of $10,000");
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
        lowestCash: { month: "2025-08", amount: -170000 },
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
    expect(copy.derivation?.plannedNote).toBe(
      "Replaces the planned round: June 2025, $200,000 before fees, $200,000 after fees."
    );
    expect(copy.derivation?.steps[2].equation).toContain("$180,000");
    expect(copy.derivation?.steps[2].equation).not.toContain("$60,000");
    expect(copy.derivation?.plannedNote).not.toMatch(/already included/i);
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
    expect(copy.derivation).toBeNull();
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
    expect(copy.derivation?.footnote).toBe(
      "The forecast ends in December 2026; months after that assume your last month's burn of $95,000."
    );
    expect(mainText(copy)).not.toMatch(BANNED);
  });

  it("says the computed start month is already past when fundraising is overdue", () => {
    setActiveCurrency("USD");
    const copy = buildFundraisingCopy(
      rec("raise_recommended", {
        overdue: true,
        bufferBreachMonth: "2025-04",
        recommendedStartMonth: "2025-01",
        fundraisingLeadMonths: 6,
      })
    );
    expect(copy.derivation?.steps[0].result).toBe("Now");
    expect(copy.derivation?.steps[0].equation).toBe(
      "Buffer crossed April 2025 − 6 months lead time = October 2024, already past. Start now."
    );
  });

  it("adds the planned round into the raise and keeps it out of the replacement path", () => {
    setActiveCurrency("USD");
    const adds = buildFundraisingCopy(
      rec("additional_capital_needed", {
        roundMode: "adds_to_planned",
        overdue: true,
        effectiveBuffer: 10000,
        recommendedNetAmount: 45000,
        recommendedGrossAmount: 50000,
        totalRoundGross: 70000,
        lowestCash: { month: "2025-05", amount: -35000 },
        bufferBreachMonth: "2025-03",
        recommendedStartMonth: "2025-01",
        fundraisingLeadMonths: 6,
        plannedRound: {
          month: "2025-02",
          grossAmount: 15000,
          netAmount: 15000,
          landsBeforeBreach: true,
        },
      })
    );
    expect(adds.derivation?.steps[2].equation).toContain(
      "Plus the planned $15,000 = $65,000, rounded up to $70,000."
    );
    expect(adds.derivation?.steps[2].result).toBe("$70K");
    expect(adds.derivation?.plannedNote).toMatch(/^Already in this plan:/);

    const replaced = buildFundraisingCopy(
      rec("planned_round_too_late", {
        roundMode: "replaces_planned",
        effectiveBuffer: 10000,
        recommendedNetAmount: 50000,
        recommendedGrossAmount: 50000,
        totalRoundGross: 130000,
        lowestCash: { month: "2025-08", amount: -120000 },
        bufferBreachMonth: "2025-03",
        recommendedCloseMonth: "2025-03",
        recommendedStartMonth: "2025-01",
        fundraisingLeadMonths: 2,
        overdue: false,
        plannedRound: {
          month: "2025-06",
          grossAmount: 200000,
          netAmount: 200000,
          landsBeforeBreach: false,
        },
      })
    );
    expect(replaced.derivation?.steps[1].equation).toBe(
      "Cash buffer $10,000 − lowest balance −$120,000 = $130,000 missing."
    );
    expect(replaced.derivation?.steps[2].result).toBe("$130K");
    expect(replaced.derivation?.steps[2].equation).not.toContain("$50,000");
    expect(replaced.derivation?.plannedNote).toMatch(/^Replaces the planned round:/);
  });

  it("shows the fee gross-up before the 10,000 rounding", () => {
    setActiveCurrency("USD");
    const copy = buildFundraisingCopy(
      rec("raise_recommended", {
        effectiveBuffer: 30000,
        recommendedNetAmount: 110000,
        recommendedGrossAmount: 130000,
        totalRoundGross: 130000,
        fundraisingFeePercent: 10,
        lowestCash: { month: "2025-04", amount: -80000 },
      })
    );
    expect(copy.derivation?.steps[2].equation).toBe(
      "$110,000 missing. Fees of 10% bring it to $122,222 before rounding, then up to $130,000."
    );
  });
});
