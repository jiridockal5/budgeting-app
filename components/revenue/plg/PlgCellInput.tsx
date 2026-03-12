"use client";

import { useState, useRef, useEffect, useCallback } from "react";

interface PlgCellInputProps {
  value: number;
  isOverride: boolean;
  decimals: number;
  prefix?: string;
  suffix?: string;
  onChange: (value: number) => void;
  onClearOverride?: () => void;
}

export function PlgCellInput({
  value,
  isOverride,
  decimals,
  prefix,
  suffix,
  onChange,
  onClearOverride,
}: PlgCellInputProps) {
  const [editing, setEditing] = useState(false);
  const [editValue, setEditValue] = useState("");
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (editing && inputRef.current) {
      inputRef.current.focus();
      inputRef.current.select();
    }
  }, [editing]);

  const handleDoubleClick = useCallback(() => {
    setEditValue(String(value));
    setEditing(true);
  }, [value]);

  const commit = useCallback(() => {
    setEditing(false);
    const parsed = parseFloat(editValue);
    if (!isNaN(parsed) && parsed !== value) {
      onChange(parsed);
    }
  }, [editValue, onChange, value]);

  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent) => {
      if (e.key === "Enter") {
        commit();
      } else if (e.key === "Escape") {
        setEditing(false);
      }
    },
    [commit]
  );

  const formatted =
    decimals === 0
      ? Math.round(value).toLocaleString("en-US")
      : value.toFixed(decimals);

  const displayText = `${prefix ?? ""}${formatted}${suffix ?? ""}`;

  if (editing) {
    return (
      <input
        ref={inputRef}
        type="number"
        step="any"
        value={editValue}
        onChange={(e) => setEditValue(e.target.value)}
        onBlur={commit}
        onKeyDown={handleKeyDown}
        className="w-full h-full px-1.5 py-1 text-xs text-right bg-white border border-indigo-300 rounded outline-none ring-2 ring-indigo-100 tabular-nums"
      />
    );
  }

  return (
    <div
      onDoubleClick={handleDoubleClick}
      onContextMenu={
        isOverride && onClearOverride
          ? (e) => {
              e.preventDefault();
              onClearOverride();
            }
          : undefined
      }
      title={
        isOverride
          ? "Manual override \u2014 right-click to clear"
          : "Double-click to override"
      }
      className={`
        relative w-full h-full px-1.5 py-1 text-xs text-right cursor-default
        select-none tabular-nums transition-colors rounded
        ${
          isOverride
            ? "bg-indigo-50 text-indigo-900 font-medium"
            : "text-slate-700 hover:bg-slate-50"
        }
      `}
    >
      {displayText}
      {isOverride && (
        <span className="absolute top-0.5 left-0.5 w-1.5 h-1.5 rounded-full bg-indigo-400" />
      )}
    </div>
  );
}
