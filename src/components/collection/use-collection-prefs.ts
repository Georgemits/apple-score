"use client";

import * as React from "react";
import type { ViewMode } from "@/components/collection/types";

export type CollectionPrefs = {
  view: ViewMode;
  grouped: boolean;
};

const STORAGE_KEY = "apple-score:collection-prefs";
const DEFAULT_PREFS: CollectionPrefs = { view: "grid", grouped: false };

const listeners = new Set<() => void>();

/** In-memory copy so the toggles still work when storage is blocked (private mode, quota). */
let memory: string | null = null;

function subscribe(listener: () => void) {
  const onStorage = () => {
    memory = null;
    listener();
  };
  listeners.add(listener);
  window.addEventListener("storage", onStorage);
  return () => {
    listeners.delete(listener);
    window.removeEventListener("storage", onStorage);
  };
}

function getSnapshot(): string | null {
  if (memory !== null) return memory;
  try {
    return window.localStorage.getItem(STORAGE_KEY);
  } catch {
    return null;
  }
}

function getServerSnapshot(): string | null {
  return null;
}

function parse(raw: string | null): CollectionPrefs {
  if (!raw) return DEFAULT_PREFS;
  try {
    const value: unknown = JSON.parse(raw);
    if (!value || typeof value !== "object") return DEFAULT_PREFS;
    const record = value as Record<string, unknown>;
    return {
      view: record.view === "list" ? "list" : "grid",
      grouped: record.grouped === true,
    };
  } catch {
    return DEFAULT_PREFS;
  }
}

/**
 * Layout preferences for the collection page, remembered per browser.
 *
 * Backed by `useSyncExternalStore` so the server render and the first client
 * render agree (both see the defaults), and the stored choice applies on the
 * very next pass without a hydration mismatch.
 */
export function useCollectionPrefs() {
  const raw = React.useSyncExternalStore(subscribe, getSnapshot, getServerSnapshot);
  const prefs = React.useMemo(() => parse(raw), [raw]);

  const update = React.useCallback((patch: Partial<CollectionPrefs>) => {
    const next = JSON.stringify({ ...parse(getSnapshot()), ...patch });
    memory = next;
    try {
      window.localStorage.setItem(STORAGE_KEY, next);
    } catch {
      // Storage unavailable: the in-memory copy still drives the UI.
    }
    listeners.forEach((listener) => listener());
  }, []);

  return { prefs, update };
}
