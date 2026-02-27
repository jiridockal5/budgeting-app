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
    "MRR",
    "ARR",
    "PLG MRR",
    "Sales MRR",
    "Partner MRR",
    "Total Customers",
    "New MRR",
    "Churned MRR",
    "Expansion MRR",
    "Headcount Expense",
    "Non-Headcount Expense",
    "Total Expense",
    "Net Burn",
    "Cumulative Burn",
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
    m.churnedMrr.toFixed(2),
    m.expansionMrr.toFixed(2),
    m.headcountExpense.toFixed(2),
    m.nonHeadcountExpense.toFixed(2),
    m.totalExpense.toFixed(2),
    m.netBurn.toFixed(2),
    m.cumulativeBurn.toFixed(2),
    m.cashRemaining.toFixed(2),
  ]);

  const summaryRows = [
    [],
    ["Summary"],
    ["Projected ARR", forecast.summary.projectedArr.toFixed(2)],
    ["Projected MRR", forecast.summary.projectedMrr.toFixed(2)],
    ["Net New ARR", forecast.summary.netNewArr.toFixed(2)],
    ["NRR (annual)", `${forecast.summary.annualNrr.toFixed(1)}%`],
    ["GRR (annual)", `${forecast.summary.annualGrr.toFixed(1)}%`],
    ["CAC", forecast.summary.cac.toFixed(2)],
    ["CAC Payback (months)", forecast.summary.cacPaybackMonths.toFixed(1)],
    ["LTV/CAC", `${forecast.summary.ltvCacRatio.toFixed(1)}x`],
    ["Monthly Burn", forecast.summary.monthlyBurn.toFixed(2)],
    ["Burn Multiple", `${forecast.summary.burnMultiple.toFixed(1)}x`],
    ["Rule of 40", `${forecast.summary.ruleOf40.toFixed(1)}%`],
    ["Runway (months)", forecast.summary.runwayMonths >= 999 ? "∞" : forecast.summary.runwayMonths.toFixed(0)],
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
  const runway =
    s.runwayMonths >= 999 ? "Profitable" : `${Math.round(s.runwayMonths)} months`;

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
<h1>SaaS Forecast Report</h1>
<p style="color:#64748b">Generated on ${new Date().toLocaleDateString("en-GB", { year: "numeric", month: "long", day: "numeric" })}</p>

<h2>Key Metrics</h2>
<table>
<tr><td>Projected ARR</td><td class="value">${formatCompact(s.projectedArr)}</td></tr>
<tr><td>Projected MRR</td><td class="value">${formatCompact(s.projectedMrr)}</td></tr>
<tr><td>Net New ARR</td><td class="value">${formatCompact(s.netNewArr)}</td></tr>
<tr><td>Total Customers</td><td class="value">${s.totalCustomers}</td></tr>
<tr><td>NRR (annual)</td><td class="value ${s.annualNrr >= 100 ? "highlight" : ""}">${s.annualNrr.toFixed(1)}%</td></tr>
<tr><td>GRR (annual)</td><td class="value ${s.annualGrr >= 90 ? "highlight" : ""}">${s.annualGrr.toFixed(1)}%</td></tr>
</table>

<h2>Unit Economics</h2>
<table>
<tr><td>CAC</td><td class="value">${formatCompact(s.cac)}</td></tr>
<tr><td>CAC Payback</td><td class="value">${s.cacPaybackMonths.toFixed(0)} months</td></tr>
<tr><td>LTV / CAC</td><td class="value">${s.ltvCacRatio.toFixed(1)}x</td></tr>
</table>

<h2>Burn & Runway</h2>
<table>
<tr><td>Cash on Hand</td><td class="value">${formatCompact(s.cashOnHand)}</td></tr>
<tr><td>Monthly Burn</td><td class="value ${s.monthlyBurn > 0 ? "warn" : "highlight"}">${formatCompact(s.monthlyBurn)}</td></tr>
<tr><td>Burn Multiple</td><td class="value">${s.burnMultiple.toFixed(1)}x</td></tr>
<tr><td>Rule of 40</td><td class="value ${s.ruleOf40 >= 40 ? "highlight" : ""}">${s.ruleOf40.toFixed(1)}%</td></tr>
<tr><td>Runway</td><td class="value ${s.runwayMonths <= 12 && s.runwayMonths < 999 ? "warn" : "highlight"}">${runway}</td></tr>
</table>

<h2>Revenue by Channel (End of Period)</h2>
<table>
<tr><td>PLG MRR</td><td class="value">${last ? formatCompact(last.plgMrr) : "—"}</td></tr>
<tr><td>Sales MRR</td><td class="value">${last ? formatCompact(last.salesMrr) : "—"}</td></tr>
<tr><td>Partner MRR</td><td class="value">${last ? formatCompact(last.partnerMrr) : "—"}</td></tr>
</table>

<p class="footer">Generated by Runway Forecast — SaaS Budgeting Tool</p>
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
