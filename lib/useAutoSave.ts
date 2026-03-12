"use client";

import { useEffect, useRef, useState, useCallback } from "react";

interface AutoSaveStatus {
  saving: boolean;
  lastSaved: Date | null;
  error: string | null;
}

/**
 * Debounced auto-save hook.
 *
 * Watches `data` for changes and calls `saveFn` after a debounce period.
 * Skips the very first render so data loaded from the API isn't immediately
 * written back.
 */
export function useAutoSave<T>(
  data: T,
  saveFn: () => Promise<void>,
  {
    delay = 800,
    enabled = true,
  }: { delay?: number; enabled?: boolean } = {}
): AutoSaveStatus {
  const [saving, setSaving] = useState(false);
  const [lastSaved, setLastSaved] = useState<Date | null>(null);
  const [error, setError] = useState<string | null>(null);

  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const isFirstRender = useRef(true);
  const saveFnRef = useRef(saveFn);
  saveFnRef.current = saveFn;

  useEffect(() => {
    if (!enabled) return;

    if (isFirstRender.current) {
      isFirstRender.current = false;
      return;
    }

    if (timerRef.current) clearTimeout(timerRef.current);

    timerRef.current = setTimeout(async () => {
      try {
        setSaving(true);
        setError(null);
        await saveFnRef.current();
        setLastSaved(new Date());
      } catch (err) {
        setError(err instanceof Error ? err.message : "Failed to save");
      } finally {
        setSaving(false);
      }
    }, delay);

    return () => {
      if (timerRef.current) clearTimeout(timerRef.current);
    };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [data, delay, enabled]);

  return { saving, lastSaved, error };
}

/**
 * Small inline component-ready status text for auto-save.
 * Returns a descriptor string: "Saving…", "Saved", or null when idle.
 */
export function useAutoSaveLabel(status: AutoSaveStatus): string | null {
  const [visible, setVisible] = useState(false);
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    if (status.saving) {
      setVisible(true);
      if (timerRef.current) clearTimeout(timerRef.current);
    } else if (status.lastSaved) {
      setVisible(true);
      timerRef.current = setTimeout(() => setVisible(false), 2000);
    }
    return () => {
      if (timerRef.current) clearTimeout(timerRef.current);
    };
  }, [status.saving, status.lastSaved]);

  if (status.saving) return "Saving…";
  if (visible && status.lastSaved) return "Saved";
  return null;
}
