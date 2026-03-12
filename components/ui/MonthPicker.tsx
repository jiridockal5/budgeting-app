"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { Calendar, ChevronLeft, ChevronRight } from "lucide-react";

const MONTHS = [
  "Jan",
  "Feb",
  "Mar",
  "Apr",
  "May",
  "Jun",
  "Jul",
  "Aug",
  "Sep",
  "Oct",
  "Nov",
  "Dec",
] as const;

interface MonthPickerProps {
  value: string | null | undefined;
  onChange: (value: string) => void;
  placeholder?: string;
  disabled?: boolean;
  allowClear?: boolean;
  className?: string;
}

export function MonthPicker({
  value,
  onChange,
  placeholder = "Select month",
  disabled = false,
  allowClear = false,
  className = "",
}: MonthPickerProps) {
  const containerRef = useRef<HTMLDivElement | null>(null);
  const [open, setOpen] = useState(false);
  const [displayYear, setDisplayYear] = useState(getInitialYear(value));

  useEffect(() => {
    setDisplayYear(getInitialYear(value));
  }, [value]);

  useEffect(() => {
    function handlePointerDown(event: MouseEvent) {
      if (!containerRef.current?.contains(event.target as Node)) {
        setOpen(false);
      }
    }

    if (open) {
      document.addEventListener("mousedown", handlePointerDown);
    }

    return () => {
      document.removeEventListener("mousedown", handlePointerDown);
    };
  }, [open]);

  const selectedMonth = useMemo(() => {
    if (!value) return null;
    const [year, month] = value.split("-").map(Number);
    if (!year || !month) return null;
    return { year, month };
  }, [value]);

  return (
    <div ref={containerRef} className={`relative ${className}`}>
      <button
        type="button"
        disabled={disabled}
        onClick={() => setOpen((prev) => !prev)}
        className="flex w-full items-center justify-between rounded-xl border border-slate-200 bg-white px-3 py-2.5 text-left text-sm text-slate-900 shadow-sm transition hover:border-slate-300 focus:border-indigo-300 focus:outline-none focus:ring-2 focus:ring-indigo-100 disabled:cursor-not-allowed disabled:opacity-60"
      >
        <span className={value ? "text-slate-900" : "text-slate-400"}>
          {value ? formatMonthValue(value) : placeholder}
        </span>
        <Calendar className="h-4 w-4 text-slate-500" />
      </button>

      {open && (
        <div className="absolute left-0 z-20 mt-2 w-full min-w-[280px] rounded-2xl border border-slate-200 bg-white p-4 shadow-xl">
          <div className="mb-4 flex items-center justify-between">
            <button
              type="button"
              onClick={() => setDisplayYear((prev) => prev - 1)}
              className="rounded-lg p-2 text-slate-500 transition hover:bg-slate-100 hover:text-slate-700"
              aria-label="Previous year"
            >
              <ChevronLeft className="h-4 w-4" />
            </button>
            <div className="text-sm font-semibold text-slate-900">
              {displayYear}
            </div>
            <button
              type="button"
              onClick={() => setDisplayYear((prev) => prev + 1)}
              className="rounded-lg p-2 text-slate-500 transition hover:bg-slate-100 hover:text-slate-700"
              aria-label="Next year"
            >
              <ChevronRight className="h-4 w-4" />
            </button>
          </div>

          <div className="grid grid-cols-3 gap-2">
            {MONTHS.map((monthLabel, index) => {
              const month = index + 1;
              const monthValue = `${displayYear}-${String(month).padStart(2, "0")}`;
              const selected =
                selectedMonth?.year === displayYear &&
                selectedMonth.month === month;

              return (
                <button
                  key={monthValue}
                  type="button"
                  onClick={() => {
                    onChange(monthValue);
                    setOpen(false);
                  }}
                  className={`rounded-xl px-3 py-2 text-sm font-medium transition ${
                    selected
                      ? "bg-indigo-600 text-white shadow-sm"
                      : "bg-slate-50 text-slate-700 hover:bg-slate-100"
                  }`}
                >
                  {monthLabel}
                </button>
              );
            })}
          </div>

          <div className="mt-4 flex items-center justify-between border-t border-slate-100 pt-3">
            {allowClear ? (
              <button
                type="button"
                onClick={() => {
                  onChange("");
                  setOpen(false);
                }}
                className="text-sm font-medium text-slate-500 transition hover:text-slate-700"
              >
                Clear
              </button>
            ) : (
              <span />
            )}
            <button
              type="button"
              onClick={() => {
                const currentMonth = getCurrentMonthValue();
                onChange(currentMonth);
                setDisplayYear(getInitialYear(currentMonth));
                setOpen(false);
              }}
              className="text-sm font-medium text-indigo-600 transition hover:text-indigo-700"
            >
              This month
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

function getInitialYear(value: string | null | undefined): number {
  if (value) {
    const [year] = value.split("-").map(Number);
    if (year) return year;
  }

  return new Date().getFullYear();
}

function getCurrentMonthValue(): string {
  const now = new Date();
  return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}`;
}

function formatMonthValue(value: string): string {
  const [year, month] = value.split("-").map(Number);
  if (!year || !month) return value;
  return `${MONTHS[month - 1]} ${year}`;
}
