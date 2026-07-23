"use client";

import type { InputHTMLAttributes } from "react";
import {
  formatNumberInputValue,
  sanitizeDecimalInput,
} from "@/lib/numberInput";

type NumberInputProps = Omit<
  InputHTMLAttributes<HTMLInputElement>,
  "type" | "value" | "onChange" | "inputMode"
> & {
  value: number | string | null | undefined;
  onChange: (value: string) => void;
  allowNegative?: boolean;
};

/**
 * Text decimal input that avoids the React type="number" leading-zero bug
 * (e.g. typing after 0 producing a sticky "05").
 */
export function NumberInput({
  value,
  onChange,
  allowNegative = false,
  className,
  ...rest
}: NumberInputProps) {
  return (
    <input
      {...rest}
      type="text"
      inputMode="decimal"
      value={formatNumberInputValue(value)}
      onChange={(e) => {
        const next = sanitizeDecimalInput(e.target.value, { allowNegative });
        if (next === null) return;
        onChange(next);
      }}
      className={className}
    />
  );
}
