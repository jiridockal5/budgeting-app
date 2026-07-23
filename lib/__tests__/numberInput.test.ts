import { describe, it, expect } from "vitest";
import {
  formatNumberInputValue,
  sanitizeDecimalInput,
} from "../numberInput";

describe("sanitizeDecimalInput", () => {
  it("strips leading zeros from integers", () => {
    expect(sanitizeDecimalInput("05")).toBe("5");
    expect(sanitizeDecimalInput("00")).toBe("0");
    expect(sanitizeDecimalInput("007")).toBe("7");
    expect(sanitizeDecimalInput("100")).toBe("100");
  });

  it("preserves decimal typing", () => {
    expect(sanitizeDecimalInput("0.5")).toBe("0.5");
    expect(sanitizeDecimalInput("1.")).toBe("1.");
    expect(sanitizeDecimalInput(".")).toBe("0.");
    expect(sanitizeDecimalInput("01.25")).toBe("1.25");
  });

  it("rejects invalid characters", () => {
    expect(sanitizeDecimalInput("12a")).toBeNull();
    expect(sanitizeDecimalInput("-1")).toBeNull();
    expect(sanitizeDecimalInput("1.2.3")).toBeNull();
  });

  it("allows negatives when enabled", () => {
    expect(sanitizeDecimalInput("-", { allowNegative: true })).toBe("-");
    expect(sanitizeDecimalInput("-05", { allowNegative: true })).toBe("-5");
    expect(sanitizeDecimalInput("-0.5", { allowNegative: true })).toBe("-0.5");
  });

  it("allows empty", () => {
    expect(sanitizeDecimalInput("")).toBe("");
  });
});

describe("formatNumberInputValue", () => {
  it("stringifies finite numbers", () => {
    expect(formatNumberInputValue(5)).toBe("5");
    expect(formatNumberInputValue(0)).toBe("0");
    expect(formatNumberInputValue(null)).toBe("");
  });
});
