export type SanitizeDecimalOptions = {
  /** Allow a leading minus (e.g. bulk −10% adjustments). */
  allowNegative?: boolean;
};

/**
 * Sanitize free-typed decimal input: strip leading zeros, reject invalid chars.
 * Returns null when the keystroke should be ignored.
 *
 * Examples: "05" → "5", "00" → "0", "0.5" → "0.5", "1." → "1.", "abc" → null
 */
export function sanitizeDecimalInput(
  raw: string,
  options: SanitizeDecimalOptions = {}
): string | null {
  const { allowNegative = false } = options;
  if (raw === "") return "";
  if (allowNegative && raw === "-") return "-";

  const pattern = allowNegative ? /^-?\d*\.?\d*$/ : /^\d*\.?\d*$/;
  if (!pattern.test(raw)) return null;

  const negative = allowNegative && raw.startsWith("-");
  const unsigned = negative ? raw.slice(1) : raw;

  if (unsigned === "") return negative ? "-" : "";
  if (unsigned === ".") return negative ? "-0." : "0.";

  let normalized: string;
  if (unsigned.endsWith(".") && unsigned.indexOf(".") === unsigned.length - 1) {
    const intPart = unsigned.slice(0, -1);
    const normalizedInt =
      intPart === "" ? "0" : String(parseInt(intPart, 10) || 0);
    normalized = `${normalizedInt}.`;
  } else if (unsigned.includes(".")) {
    const [intPart, frac = ""] = unsigned.split(".");
    const normalizedInt =
      intPart === "" ? "0" : String(parseInt(intPart, 10) || 0);
    normalized = `${normalizedInt}.${frac}`;
  } else {
    normalized = String(parseInt(unsigned, 10) || 0);
  }

  return negative ? `-${normalized}` : normalized;
}

/** Display a numeric field value without leading-zero artifacts. */
export function formatNumberInputValue(
  value: number | string | null | undefined
): string {
  if (value == null || value === "") return "";
  if (typeof value === "string") return value;
  if (!Number.isFinite(value)) return "";
  return String(value);
}
