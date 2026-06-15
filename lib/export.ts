import type { ForecastMonth, ForecastResult } from "./revenueForecast";
import { formatCurrency } from "./assumptions";

function formatCompact(value: number): string {
  if (Math.abs(value) >= 1_000_000)
    return `€${(value / 1_000_000).toFixed(1)}M`;
  if (Math.abs(value) >= 1_000) return `€${Math.round(value / 1_000)}K`;
  return formatCurrency(Math.round(value));
}

export function exportForecastCSV(forecast: ForecastResult) {
  const headers = [
    "Month",
    "Monthly Income",
    "Annualized Income",
    "Primary Income",
    "Secondary Income",
    "Other Income",
    "Total Income Sources",
    "New Monthly Income",
    "New Source Cash In",
    "Existing Source Cash In",
    "Total Cash In",
    "Reduced Income",
    "Increased Income",
    "COS Expense",
    "GTM Expense",
    "R&D Expense",
    "CS Expense",
    "Ops Expense",
    "Headcount Expense",
    "Non-Headcount Expense",
    "Total Expense",
    "Gross Profit",
    "Gross Margin %",
    "Operating Expenses",
    "EBIT",
    "EBIT Margin %",
    "Net Cash Flow",
    "Cumulative Cash Use",
    "Cash Remaining",
  ];

  const rows = forecast.months.map((m) => [
    m.date,
    m.totalMrr.toFixed(2),
    m.totalArr.toFixed(2),
    m.plgMrr.toFixed(2),
    m.salesMrr.toFixed(2),
    m.partnerMrr.toFixed(2),
    m.totalCustomers,
    m.newMrr.toFixed(2),
    m.newCustomerCashIn.toFixed(2),
    m.existingCustomerCashIn.toFixed(2),
    m.totalCashIn.toFixed(2),
    m.churnedMrr.toFixed(2),
    m.expansionMrr.toFixed(2),
    m.cosExpense.toFixed(2),
    m.gtmExpense.toFixed(2),
    m.rndExpense.toFixed(2),
    m.csExpense.toFixed(2),
    m.opsExpense.toFixed(2),
    m.headcountExpense.toFixed(2),
    m.nonHeadcountExpense.toFixed(2),
    m.totalExpense.toFixed(2),
    m.grossProfit.toFixed(2),
    m.grossMarginPct.toFixed(1),
    m.operatingExpenses.toFixed(2),
    m.ebit.toFixed(2),
    m.ebitMarginPct.toFixed(1),
    m.netBurn.toFixed(2),
    m.cumulativeBurn.toFixed(2),
    m.cashRemaining.toFixed(2),
  ]);

  const s = forecast.summary;
  const summaryRows = [
    [],
    ["Summary"],
    ["Projected Annualized Income", s.projectedArr.toFixed(2)],
    ["Projected Monthly Income", s.projectedMrr.toFixed(2)],
    ["Net New Income", s.netNewArr.toFixed(2)],
    ["Monthly Income Growth Rate", `${s.mrrGrowthRate.toFixed(1)}%`],
    ["Annualized Income Growth", `${s.arrGrowthRate.toFixed(1)}%`],
    ["Income Retained (annual)", `${s.annualNrr.toFixed(1)}%`],
    ["Base Income Retained (annual)", `${s.annualGrr.toFixed(1)}%`],
    ["Quick Ratio", s.quickRatio >= 999 ? "∞" : `${s.quickRatio.toFixed(1)}x`],
    ["CAC", s.cac.toFixed(2)],
    ["CAC Payback (months)", s.cacPaybackMonths.toFixed(1)],
    ["LTV", s.ltv.toFixed(2)],
    ["LTV/CAC", `${s.ltvCacRatio.toFixed(1)}x`],
    ["ARPA", s.arpa.toFixed(2)],
    ["Income Efficiency", s.salesEfficiency > 0 ? `${s.salesEfficiency.toFixed(2)}x` : "—"],
    ["Magic Number", s.magicNumber !== null ? `${s.magicNumber.toFixed(2)}x` : "—"],
    ["R&D % of Income", `${s.rndPctOfRevenue.toFixed(1)}%`],
    ["Gross Margin", `${s.grossMarginPct.toFixed(1)}%`],
    ["EBIT", s.ebit.toFixed(2)],
    ["EBIT Margin", `${s.ebitMarginPct.toFixed(1)}%`],
    ["Monthly Burn", s.monthlyBurn.toFixed(2)],
    ["Cash Use Ratio", `${s.burnMultiple.toFixed(1)}x`],
    ["Rule of 40", `${s.ruleOf40.toFixed(1)}%`],
    ["Cash Cushion (months)", s.runwayMonths >= 999 ? "∞" : s.runwayMonths.toFixed(0)],
  ];

  const csv = [
    headers.join(","),
    ...rows.map((r) => r.join(",")),
    ...summaryRows.map((r) => r.join(",")),
  ].join("\n");

  downloadFile(csv, "forecast.csv", "text/csv");
}

export function exportSummaryPDF(forecast: ForecastResult) {
  const s = forecast.summary;
  const last = forecast.months[forecast.months.length - 1];
  const cashCushion =
    s.runwayMonths >= 999 ? "Cash-positive" : `${Math.round(s.runwayMonths)} months`;

  const html = `
<!DOCTYPE html>
<html><head>
<meta charset="utf-8">
<title>Forecast Report</title>
<style>
  body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif; max-width: 800px; margin: 40px auto; color: #1e293b; }
  h1 { font-size: 24px; color: #0f172a; }
  h2 { font-size: 18px; color: #334155; margin-top: 32px; border-bottom: 1px solid #e2e8f0; padding-bottom: 8px; }
  table { width: 100%; border-collapse: collapse; margin-top: 16px; }
  th, td { text-align: left; padding: 10px 12px; border-bottom: 1px solid #f1f5f9; }
  th { font-size: 12px; text-transform: uppercase; letter-spacing: 0.05em; color: #64748b; }
  td { font-size: 14px; }
  .value { text-align: right; font-weight: 600; font-variant-numeric: tabular-nums; }
  .highlight { color: #059669; }
  .warn { color: #dc2626; }
  .footer { margin-top: 40px; font-size: 12px; color: #94a3b8; text-align: center; }
</style>
</head><body>
<h1>Budget Forecast Report</h1>
<p style="color:#64748b">Generated on ${new Date().toLocaleDateString("en-GB", { year: "numeric", month: "long", day: "numeric" })}</p>

<h2>Key Metrics</h2>
<table>
<tr><td>Projected Annualized Income</td><td class="value">${formatCompact(s.projectedArr)}</td></tr>
<tr><td>Projected Monthly Income</td><td class="value">${formatCompact(s.projectedMrr)}</td></tr>
<tr><td>Net New Income</td><td class="value">${formatCompact(s.netNewArr)}</td></tr>
<tr><td>Total Income Sources</td><td class="value">${s.totalCustomers}</td></tr>
<tr><td>Income Retained (annual)</td><td class="value ${s.annualNrr >= 100 ? "highlight" : ""}">${s.annualNrr.toFixed(1)}%</td></tr>
<tr><td>Base Income Retained (annual)</td><td class="value ${s.annualGrr >= 90 ? "highlight" : ""}">${s.annualGrr.toFixed(1)}%</td></tr>
</table>

<h2>Income Efficiency</h2>
<table>
<tr><td>Setup Cost</td><td class="value">${formatCompact(s.cac)}</td></tr>
<tr><td>Payback</td><td class="value">${s.cacPaybackMonths.toFixed(0)} months</td></tr>
<tr><td>Long-term Value</td><td class="value">${formatCompact(s.ltv)}</td></tr>
<tr><td>Value / Cost</td><td class="value">${s.ltvCacRatio.toFixed(1)}x</td></tr>
<tr><td>Average Income per Source</td><td class="value">${formatCompact(s.arpa)}</td></tr>
<tr><td>Quick Ratio</td><td class="value">${s.quickRatio >= 999 ? "∞" : `${s.quickRatio.toFixed(1)}x`}</td></tr>
</table>

<h2>Financial P&L (End of Period)</h2>
<table>
<tr><td>Monthly Income</td><td class="value">${last ? formatCompact(last.totalMrr) : "—"}</td></tr>
<tr><td>Direct Costs</td><td class="value">${last ? formatCompact(last.cosExpense) : "—"}</td></tr>
<tr><td>Gross Profit</td><td class="value">${formatCompact(s.grossProfit)}</td></tr>
<tr><td>Gross Margin</td><td class="value ${s.grossMarginPct >= 70 ? "highlight" : ""}">${s.grossMarginPct.toFixed(1)}%</td></tr>
<tr><td>Operating Expenses</td><td class="value">${formatCompact(s.operatingExpenses)}</td></tr>
<tr><td>EBIT</td><td class="value ${s.ebit >= 0 ? "highlight" : "warn"}">${formatCompact(s.ebit)}</td></tr>
<tr><td>EBIT Margin</td><td class="value">${s.ebitMarginPct.toFixed(1)}%</td></tr>
</table>

<h2>Cash Flow & Cushion</h2>
<table>
<tr><td>Cash on Hand</td><td class="value">${formatCompact(s.cashOnHand)}</td></tr>
<tr><td>Monthly Cash Use</td><td class="value ${s.monthlyBurn > 0 ? "warn" : "highlight"}">${formatCompact(s.monthlyBurn)}</td></tr>
<tr><td>Cash Use Ratio</td><td class="value">${s.burnMultiple.toFixed(1)}x</td></tr>
<tr><td>Rule of 40</td><td class="value ${s.ruleOf40 >= 40 ? "highlight" : ""}">${s.ruleOf40.toFixed(1)}%</td></tr>
<tr><td>Cash Cushion</td><td class="value ${s.runwayMonths <= 12 && s.runwayMonths < 999 ? "warn" : "highlight"}">${cashCushion}</td></tr>
</table>

<h2>Cash In (End of Period Month)</h2>
<table>
<tr><td>New Source Cash In</td><td class="value">${last ? formatCompact(last.newCustomerCashIn) : "—"}</td></tr>
<tr><td>Existing Source Cash In</td><td class="value">${last ? formatCompact(last.existingCustomerCashIn) : "—"}</td></tr>
<tr><td>Total Cash In</td><td class="value">${last ? formatCompact(last.totalCashIn) : "—"}</td></tr>
</table>

<h2>Income by Source (End of Period)</h2>
<table>
<tr><td>Primary Income</td><td class="value">${last ? formatCompact(last.plgMrr) : "—"}</td></tr>
<tr><td>Secondary Income</td><td class="value">${last ? formatCompact(last.salesMrr) : "—"}</td></tr>
<tr><td>Other Income</td><td class="value">${last ? formatCompact(last.partnerMrr) : "—"}</td></tr>
</table>

<p class="footer">Generated by Burnlytics — Budgeting Tool</p>
</body></html>`;

  const blob = new Blob([html], { type: "text/html" });
  const url = URL.createObjectURL(blob);
  const printWindow = window.open(url, "_blank");
  if (printWindow) {
    printWindow.onload = () => {
      printWindow.print();
      URL.revokeObjectURL(url);
    };
  }
}

function downloadFile(content: string, filename: string, mimeType: string) {
  const blob = new Blob([content], { type: mimeType });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}
