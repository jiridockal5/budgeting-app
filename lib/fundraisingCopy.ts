import { formatCurrency } from "@/lib/assumptions";
import { formatCompactCurrency } from "@/lib/currency";
import type { FundraisingRecommendation, FundraisingStatus } from "@/lib/revenueForecast";

export type FundraisingTone = "green" | "amber" | "red" | "grey";

export interface FundraisingCopy {
  tone: FundraisingTone;
  headline: string;
  showKeyNumbers: boolean;
  raiseAmount: string;
  raiseCaption: string | null;
  closeMonthLabel: string;
  startLabel: string;
  why: string | null;
  lastsLine: string | null;
  details: string[];
  dashboardLine: string;
  largeRaiseWarningText: string | null;
}

const RAISE_STATUSES: ReadonlySet<FundraisingStatus> = new Set([
  "raise_recommended",
  "additional_capital_needed",
  "planned_round_too_late",
]);

const LARGE_RAISE_WARNING =
  "This is a large raise driven by cost growth. Review your hiring plan and expenses.";

/** "June 2027". Empty string when the month is missing. */
export function formatMonthLong(value: string | null | undefined): string {
  if (!value) return "";
  const [year, month] = value.split("-").map(Number);
  if (!year || !month) return value;
  return new Intl.DateTimeFormat("en-US", {
    month: "long",
    year: "numeric",
    timeZone: "UTC",
  }).format(new Date(Date.UTC(year, month - 1, 1)));
}

function isRaise(status: FundraisingStatus): boolean {
  return RAISE_STATUSES.has(status);
}

function headlineFor(
  rec: FundraisingRecommendation,
  lastForecastMonth: string | null | undefined
): string {
  switch (rec.status) {
    case "inputs_missing":
      return "Set a cash buffer and target runway to get a recommendation.";
    case "no_raise_needed":
      if (rec.fundedMonths != null) {
        return `You're funded for the next ${rec.fundedMonths} months. No raise needed.`;
      }
      {
        const through = formatMonthLong(lastForecastMonth);
        return through
          ? `You're funded through ${through}. No raise needed.`
          : "You're funded. No raise needed.";
      }
    case "planned_round_sufficient": {
      const through = formatMonthLong(rec.coversThroughMonth ?? rec.plannedRound?.month);
      return through
        ? `Your planned round covers you through ${through}.`
        : "Your planned round covers you.";
    }
    default: {
      if (rec.overdue || !rec.recommendedStartMonth) return "Start fundraising now.";
      return `Start fundraising in ${formatMonthLong(rec.recommendedStartMonth)}.`;
    }
  }
}

function raiseCaption(rec: FundraisingRecommendation): string | null {
  if (!rec.plannedRound || rec.totalRoundGross <= 0) return null;
  const amount = formatCompactCurrency(rec.plannedRound.grossAmount);
  if (rec.roundMode === "replaces_planned") {
    return `instead of your planned ${amount} in ${formatMonthLong(rec.plannedRound.month)}`;
  }
  if (rec.roundMode === "adds_to_planned") {
    return `on top of your planned ${amount}`;
  }
  return null;
}

function whyLine(rec: FundraisingRecommendation): string | null {
  if (!isRaise(rec.status)) return null;
  if (rec.driver === "late_planned_round") {
    const month = rec.plannedRound ? formatMonthLong(rec.plannedRound.month) : "";
    return month
      ? `Your planned round in ${month} arrives after cash drops below your cash buffer.`
      : "Your planned round arrives after cash drops below your cash buffer.";
  }
  if (rec.driver === "burn_growth") {
    return `Your monthly burn grows from ${formatCompactCurrency(rec.firstMonthBurn)} to ${formatCompactCurrency(rec.lastMonthBurn)}`;
  }
  const burn = formatCompactCurrency(rec.avgBurn);
  const buffer = formatCompactCurrency(rec.effectiveBuffer);
  const when = formatMonthLong(rec.bufferBreachMonth);
  return when
    ? `At your current burn of ~${burn}/month, cash drops below your ${buffer} cash buffer in ${when}.`
    : `At your current burn of ~${burn}/month, cash drops below your ${buffer} cash buffer.`;
}

function lastsLine(rec: FundraisingRecommendation): string | null {
  if (rec.status === "inputs_missing" || rec.status === "no_raise_needed") return null;
  if (rec.targetRunwayMonths == null || rec.targetRunwayMonths <= 0 || !rec.coversThroughMonth) {
    return null;
  }
  return `This round lasts ${rec.targetRunwayMonths} months (through ${formatMonthLong(rec.coversThroughMonth)}) while keeping at least ${formatCompactCurrency(rec.effectiveBuffer)} in the bank.`;
}

function detailLines(
  rec: FundraisingRecommendation,
  lastForecastMonth: string | null | undefined
): string[] {
  if (rec.status === "inputs_missing") return [];
  const lines = [
    `Cash buffer crossed: ${
      rec.bufferBreachMonth ? formatMonthLong(rec.bufferBreachMonth) : "Not in this forecast"
    }`,
    `Lead time used: ${rec.fundraisingLeadMonths} months`,
  ];
  if (rec.lowestCash) {
    lines.push(
      `Lowest money in the bank: ${formatCurrency(rec.lowestCash.amount)} in ${formatMonthLong(rec.lowestCash.month)}`
    );
  }
  if (rec.plannedRound) {
    lines.push(
      `Planned round: ${formatMonthLong(rec.plannedRound.month)}, ${formatCurrency(rec.plannedRound.grossAmount)} before fees, ${formatCurrency(rec.plannedRound.netAmount)} after fees`
    );
  }
  if (rec.recommendedNetAmount > 0) {
    lines.push(`Extra cash needed: ${formatCurrency(rec.recommendedNetAmount)}`);
  }
  const raise = rec.totalRoundGross > 0 ? rec.totalRoundGross : rec.recommendedGrossAmount;
  if (rec.roundMode === "replaces_planned" && raise > 0) {
    lines.push(`Single raise: ${formatCurrency(raise)}`);
  }
  if (rec.recommendedGrossAmount > rec.recommendedNetAmount) {
    lines.push(
      `Fees: ${formatCurrency(rec.recommendedGrossAmount)} raise so ${formatCurrency(rec.recommendedNetAmount)} lands in the bank`
    );
  } else if (raise > 0) {
    lines.push("Fees: none");
  }
  if (rec.extrapolated && lastForecastMonth) {
    lines.push(
      `The forecast ends in ${formatMonthLong(lastForecastMonth)}; months after that assume your last month's burn of ${formatCurrency(rec.lastMonthBurn)}.`
    );
  }
  return lines;
}

export function buildFundraisingCopy(
  rec: FundraisingRecommendation,
  options?: { lastForecastMonth?: string | null }
): FundraisingCopy {
  const lastForecastMonth = options?.lastForecastMonth;
  const headline = headlineFor(rec, lastForecastMonth);
  const showKeyNumbers = isRaise(rec.status);
  const caption = raiseCaption(rec);
  const closeMonthLabel = formatMonthLong(rec.recommendedCloseMonth) || "—";
  const startLabel = rec.overdue
    ? "Now"
    : formatMonthLong(rec.recommendedStartMonth) || "—";
  const raiseAmount =
    rec.totalRoundGross > 0 ? formatCompactCurrency(rec.totalRoundGross) : "—";
  const dashboardLine =
    showKeyNumbers && rec.totalRoundGross > 0 && rec.recommendedCloseMonth
      ? `${headline} · Raise ${raiseAmount} by ${closeMonthLabel}`
      : headline;

  return {
    tone:
      rec.status === "inputs_missing"
        ? "grey"
        : rec.status === "no_raise_needed" || rec.status === "planned_round_sufficient"
          ? "green"
          : rec.overdue
            ? "red"
            : "amber",
    headline,
    showKeyNumbers,
    raiseAmount,
    raiseCaption: caption,
    closeMonthLabel,
    startLabel,
    why: whyLine(rec),
    lastsLine: lastsLine(rec),
    details: detailLines(rec, lastForecastMonth),
    dashboardLine,
    largeRaiseWarningText: rec.largeRaiseWarning ? LARGE_RAISE_WARNING : null,
  };
}
