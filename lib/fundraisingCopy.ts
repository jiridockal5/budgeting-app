import { formatCurrency } from "@/lib/assumptions";
import { formatCompactCurrency } from "@/lib/currency";
import {
  raiseAmountBreakdown,
  type FundraisingRecommendation,
  type FundraisingStatus,
} from "@/lib/revenueForecast";

export type FundraisingTone = "green" | "amber" | "red" | "grey";

export interface DerivationRow {
  label: string;
  /** Compact figure, same style as the raise in the card headline. */
  value: string;
  /** Exact amount, shown under the compact figure when they differ. */
  exact: string | null;
  negative: boolean;
}

export interface DerivationStep {
  number: number;
  title: string;
  result: string;
  resultExact: string | null;
  rows: DerivationRow[];
  equation: string;
}

export interface FundraisingDerivation {
  steps: DerivationStep[];
  plannedNote: string | null;
  footnote: string | null;
}

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
  derivation: FundraisingDerivation | null;
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

function round2(n: number): number {
  return Math.round(n * 100) / 100;
}

function shiftMonth(value: string, delta: number): string {
  const [year, month] = value.split("-").map(Number);
  const date = new Date(Date.UTC(year, month - 1 + delta, 1));
  return `${date.getUTCFullYear()}-${String(date.getUTCMonth() + 1).padStart(2, "0")}`;
}

function exactMoney(amount: number): string {
  return formatCurrency(amount);
}

function compactMoney(amount: number): string {
  return formatCompactCurrency(Math.abs(amount));
}

function signedExact(amount: number): string {
  if (amount < 0) return `−${exactMoney(Math.abs(amount))}`;
  return exactMoney(amount);
}

function signedCompact(amount: number): string {
  if (amount < 0) return `−${compactMoney(amount)}`;
  return compactMoney(amount);
}

function moneyRow(label: string, amount: number): DerivationRow {
  const value = signedCompact(amount);
  const exact = signedExact(amount);
  return {
    label,
    value,
    exact: exact === value ? null : exact,
    negative: amount < 0,
  };
}

function textRow(label: string, value: string): DerivationRow {
  return { label, value, exact: null, negative: false };
}

function leadLabel(months: number): string {
  return months === 1 ? "1 month" : `${months} months`;
}

function cashMissing(rec: FundraisingRecommendation): number {
  if (rec.roundMode === "replaces_planned" && rec.lowestCash) {
    return Math.max(0, round2(rec.effectiveBuffer - rec.lowestCash.amount));
  }
  return Math.max(0, rec.recommendedNetAmount);
}

function timingStep(rec: FundraisingRecommendation): DerivationStep {
  const crossed = formatMonthLong(rec.bufferBreachMonth);
  const lead = rec.fundraisingLeadMonths;
  const unclamped = rec.bufferBreachMonth
    ? formatMonthLong(shiftMonth(rec.bufferBreachMonth, -lead))
    : "";
  const start = rec.overdue ? "Now" : formatMonthLong(rec.recommendedStartMonth) || unclamped;
  const equation = rec.overdue
    ? `Buffer crossed ${crossed} − ${leadLabel(lead)} lead time = ${unclamped}, already past. Start now.`
    : `Buffer crossed ${crossed} − ${leadLabel(lead)} lead time = start ${start}.`;
  return {
    number: 1,
    title: "When cash runs low",
    result: start,
    resultExact: null,
    rows: [
      textRow("Buffer crossed", crossed),
      textRow("Lead time", leadLabel(lead)),
      textRow("Start fundraising", start),
    ],
    equation,
  };
}

function shortfallStep(rec: FundraisingRecommendation, missing: number): DerivationStep {
  const lowest = rec.lowestCash!;
  const aboveBuffer = missing <= 0 && lowest.amount >= rec.effectiveBuffer;
  const equation = aboveBuffer
    ? `Lowest balance ${signedExact(lowest.amount)} in ${formatMonthLong(lowest.month)} stays above the ${exactMoney(rec.effectiveBuffer)} cash buffer, so no extra cash is missing.`
    : `Cash buffer ${exactMoney(rec.effectiveBuffer)} − lowest balance ${signedExact(lowest.amount)} = ${exactMoney(missing)} missing.`;
  return {
    number: 2,
    title: "How much cash is missing",
    result: compactMoney(missing),
    resultExact: exactMoney(missing),
    rows: [
      moneyRow("Lowest balance", lowest.amount),
      textRow("Month", formatMonthLong(lowest.month)),
      moneyRow("Cash buffer", rec.effectiveBuffer),
      moneyRow("Cash missing", missing),
    ],
    equation,
  };
}

function raiseStep(rec: FundraisingRecommendation, missing: number): DerivationStep {
  const fee = Math.min(Math.max(rec.fundraisingFeePercent ?? 0, 0), 100);
  const breakdown = raiseAmountBreakdown(missing, fee);
  const roundedShortfall =
    rec.roundMode === "replaces_planned" ? rec.totalRoundGross : rec.recommendedGrossAmount;
  const before =
    Math.abs(breakdown.rounded - roundedShortfall) < 1 ? breakdown.exact : null;
  const step = exactMoney(10_000);
  let equation: string;
  if (fee <= 0 && before != null && Math.abs(before - missing) < 0.5 && Math.abs(roundedShortfall - missing) < 0.5) {
    equation = `${exactMoney(missing)} missing. No fees, and it is already a multiple of ${step}, so the raise is ${exactMoney(roundedShortfall)}.`;
  } else if (fee <= 0) {
    equation = `${exactMoney(missing)} missing. No fees. Rounded up to the next ${step} = ${exactMoney(roundedShortfall)}.`;
  } else if (before != null && Math.abs(before - roundedShortfall) < 0.5) {
    equation = `${exactMoney(missing)} missing. Fees of ${fee}% bring it to ${exactMoney(roundedShortfall)}, already a multiple of ${step}.`;
  } else if (before != null) {
    equation = `${exactMoney(missing)} missing. Fees of ${fee}% bring it to ${exactMoney(before)} before rounding, then up to ${exactMoney(roundedShortfall)}.`;
  } else {
    equation = `${exactMoney(missing)} missing. After fees the raise is ${exactMoney(roundedShortfall)}.`;
  }

  if (rec.roundMode === "adds_to_planned" && rec.plannedRound) {
    const planned = rec.plannedRound.grossAmount;
    const sum = planned + roundedShortfall;
    equation +=
      Math.abs(sum - rec.totalRoundGross) < 1
        ? ` Plus the planned ${exactMoney(planned)} = ${exactMoney(rec.totalRoundGross)}.`
        : ` Plus the planned ${exactMoney(planned)} = ${exactMoney(sum)}, rounded up to ${exactMoney(rec.totalRoundGross)}.`;
  }

  const rows: DerivationRow[] = [
    moneyRow("Cash missing", missing),
  ];
  if (before != null && Math.abs(before - roundedShortfall) >= 1) {
    rows.push(moneyRow("Before rounding", before));
  }
  rows.push(moneyRow("After rounding", roundedShortfall));
  if (rec.roundMode === "adds_to_planned" && rec.plannedRound) {
    rows.push(moneyRow("Planned round", rec.plannedRound.grossAmount));
  }
  rows.push(moneyRow("Raise", rec.totalRoundGross));

  return {
    number: 3,
    title: "From shortfall to raise",
    result: compactMoney(rec.totalRoundGross),
    resultExact: exactMoney(rec.totalRoundGross),
    rows,
    equation,
  };
}

function plannedNoteFor(rec: FundraisingRecommendation): string | null {
  if (!rec.plannedRound) return null;
  const month = formatMonthLong(rec.plannedRound.month);
  const before = exactMoney(rec.plannedRound.grossAmount);
  const after = exactMoney(rec.plannedRound.netAmount);
  if (rec.roundMode === "replaces_planned") {
    return `Replaces the planned round: ${month}, ${before} before fees, ${after} after fees.`;
  }
  return `Already in this plan: ${month}, ${before} before fees, ${after} after fees.`;
}

function buildDerivation(
  rec: FundraisingRecommendation,
  lastForecastMonth: string | null | undefined
): FundraisingDerivation | null {
  if (rec.status === "inputs_missing") return null;

  const steps: DerivationStep[] = [];
  const hasRaise = isRaise(rec.status) && rec.totalRoundGross > 0;
  const missing = cashMissing(rec);

  if (rec.bufferBreachMonth) {
    steps.push(timingStep(rec));
  } else if (!hasRaise) {
    steps.push({
      number: 1,
      title: "When cash runs low",
      result: "Not in this forecast",
      resultExact: null,
      rows: [],
      equation: "Cash stays above your cash buffer in this forecast.",
    });
  }

  if (rec.lowestCash && (hasRaise || rec.status === "planned_round_sufficient")) {
    steps.push(shortfallStep(rec, missing));
  }

  if (hasRaise) {
    steps.push(raiseStep(rec, missing));
  }

  steps.forEach((step, index) => {
    step.number = index + 1;
  });

  const plannedNote = plannedNoteFor(rec);
  const footnote =
    rec.extrapolated && lastForecastMonth
      ? `The forecast ends in ${formatMonthLong(lastForecastMonth)}; months after that assume your last month's burn of ${exactMoney(rec.lastMonthBurn)}.`
      : null;

  if (steps.length === 0 && !plannedNote && !footnote) return null;
  return { steps, plannedNote, footnote };
}

function detailLines(derivation: FundraisingDerivation | null): string[] {
  if (!derivation) return [];
  return [
    ...derivation.steps.map((step) => `${step.number}. ${step.title}. ${step.equation}`),
    ...(derivation.plannedNote ? [derivation.plannedNote] : []),
    ...(derivation.footnote ? [derivation.footnote] : []),
  ];
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
  const derivation = buildDerivation(rec, lastForecastMonth);

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
    details: detailLines(derivation),
    derivation,
    dashboardLine,
    largeRaiseWarningText: rec.largeRaiseWarning ? LARGE_RAISE_WARNING : null,
  };
}
