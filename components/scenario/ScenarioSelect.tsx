"use client";

import {
  useCallback,
  useEffect,
  useId,
  useLayoutEffect,
  useRef,
  useState,
  type ReactNode,
} from "react";
import { createPortal } from "react-dom";
import { Check, ChevronDown } from "lucide-react";

export interface ScenarioSelectOption {
  id: string;
  name: string;
}

interface ScenarioSelectProps {
  options: ScenarioSelectOption[];
  value: string;
  onChange: (id: string) => void;
  label?: string;
  placeholder?: string;
  disabled?: boolean;
  className?: string;
  buttonClassName?: string;
  menuLabel?: string;
  leading?: ReactNode;
}

export function ScenarioSelect({
  options,
  value,
  onChange,
  label,
  placeholder = "Select scenario",
  disabled = false,
  className = "",
  buttonClassName = "",
  menuLabel = "Scenarios",
  leading,
}: ScenarioSelectProps) {
  const listId = useId();
  const containerRef = useRef<HTMLDivElement | null>(null);
  const menuRef = useRef<HTMLDivElement | null>(null);
  const [open, setOpen] = useState(false);
  const [pos, setPos] = useState({ top: 0, left: 0, width: 0 });

  const selected = options.find((o) => o.id === value);
  const displayName = selected?.name ?? placeholder;

  const updatePosition = useCallback(() => {
    if (!containerRef.current) return;
    const rect = containerRef.current.getBoundingClientRect();
    const menuWidth = Math.max(rect.width, 200);
    const padding = 12;
    const left = Math.min(
      rect.left,
      Math.max(padding, window.innerWidth - menuWidth - padding)
    );
    setPos({
      top: rect.bottom + 6,
      left,
      width: menuWidth,
    });
  }, []);

  useLayoutEffect(() => {
    if (!open) return;
    updatePosition();
  }, [open, updatePosition]);

  useEffect(() => {
    if (!open) return;
    window.addEventListener("scroll", updatePosition, true);
    window.addEventListener("resize", updatePosition);
    return () => {
      window.removeEventListener("scroll", updatePosition, true);
      window.removeEventListener("resize", updatePosition);
    };
  }, [open, updatePosition]);

  useEffect(() => {
    if (!open) return;

    function handlePointerDown(event: MouseEvent) {
      const target = event.target as Node;
      if (
        !containerRef.current?.contains(target) &&
        !menuRef.current?.contains(target)
      ) {
        setOpen(false);
      }
    }

    function handleKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape") setOpen(false);
    }

    document.addEventListener("mousedown", handlePointerDown);
    document.addEventListener("keydown", handleKeyDown);
    return () => {
      document.removeEventListener("mousedown", handlePointerDown);
      document.removeEventListener("keydown", handleKeyDown);
    };
  }, [open]);

  return (
    <div ref={containerRef} className={`relative min-w-0 ${className}`}>
      {label ? (
        <label className="sr-only" htmlFor={listId}>
          {label}
        </label>
      ) : null}
      <button
        type="button"
        id={listId}
        disabled={disabled || options.length === 0}
        aria-haspopup="listbox"
        aria-expanded={open}
        onClick={() => setOpen((prev) => !prev)}
        title={displayName}
        className={
          buttonClassName ||
          "inline-flex min-w-[160px] max-w-[240px] items-center justify-between gap-2 rounded-xl border border-neutral-200 bg-white px-3 py-2 text-sm font-medium text-neutral-900 shadow-sm transition hover:border-neutral-300 focus:outline-none focus-visible:ring-2 focus-visible:ring-turquoise-100 disabled:cursor-not-allowed disabled:opacity-60"
        }
      >
        {leading}
        <span className="min-w-0 flex-1 truncate text-left">{displayName}</span>
        <ChevronDown
          className={`h-3.5 w-3.5 shrink-0 text-neutral-400 transition ${
            open ? "rotate-180" : ""
          }`}
          aria-hidden
        />
      </button>

      {open &&
        createPortal(
          <div
            ref={menuRef}
            role="listbox"
            aria-label={menuLabel}
            style={{
              position: "fixed",
              top: pos.top,
              left: pos.left,
              width: pos.width,
              zIndex: 9999,
            }}
            className="overflow-hidden rounded-2xl border border-neutral-200 bg-white py-1.5 shadow-xl"
          >
            <p className="px-3 pb-1.5 pt-1 text-[11px] font-medium uppercase tracking-wider text-neutral-400">
              {menuLabel}
            </p>
            <ul className="max-h-64 overflow-y-auto px-1.5">
              {options.map((option) => {
                const isSelected = option.id === value;
                return (
                  <li key={option.id} role="presentation">
                    <button
                      type="button"
                      role="option"
                      aria-selected={isSelected}
                      onClick={() => {
                        onChange(option.id);
                        setOpen(false);
                      }}
                      className={`flex w-full items-center gap-2 rounded-xl px-2.5 py-2 text-left text-sm transition ${
                        isSelected
                          ? "bg-turquoise-50 font-semibold text-turquoise-900"
                          : "font-medium text-neutral-700 hover:bg-neutral-50"
                      }`}
                    >
                      <span className="min-w-0 flex-1 truncate">
                        {option.name}
                      </span>
                      {isSelected && (
                        <Check
                          className="h-4 w-4 shrink-0 text-turquoise-600"
                          aria-hidden
                        />
                      )}
                    </button>
                  </li>
                );
              })}
            </ul>
          </div>,
          document.body
        )}
    </div>
  );
}
