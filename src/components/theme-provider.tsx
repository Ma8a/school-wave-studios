"use client";

import { useEffect, useSyncExternalStore } from "react";
import {
  DEFAULT_THEME,
  normalizeTheme,
  resolveMode,
  themeDataValue,
  type ThemePreference,
} from "@/lib/theme";

const STORAGE_KEY = "sws:theme:v1";
const CHANGE_EVENT = "sws:theme-change";

// ── Preference store (localStorage-backed, same pattern as app-state) ───────

let cachedRaw: string | null | undefined = undefined;
let cachedPref: ThemePreference = DEFAULT_THEME;

function getPrefSnapshot(): ThemePreference {
  if (typeof window === "undefined") return DEFAULT_THEME;
  const raw = window.localStorage.getItem(STORAGE_KEY);
  if (raw === cachedRaw) return cachedPref;
  cachedRaw = raw;
  try {
    cachedPref = raw ? normalizeTheme(JSON.parse(raw)) : DEFAULT_THEME;
  } catch {
    cachedPref = DEFAULT_THEME;
  }
  return cachedPref;
}

function getPrefServerSnapshot(): ThemePreference {
  return DEFAULT_THEME;
}

function subscribePref(cb: () => void) {
  if (typeof window === "undefined") return () => {};
  const handle = () => cb();
  window.addEventListener(CHANGE_EVENT, handle);
  window.addEventListener("storage", handle);
  return () => {
    window.removeEventListener(CHANGE_EVENT, handle);
    window.removeEventListener("storage", handle);
  };
}

export function useTheme(): ThemePreference {
  return useSyncExternalStore(
    subscribePref,
    getPrefSnapshot,
    getPrefServerSnapshot,
  );
}

export function setTheme(pref: ThemePreference): void {
  if (typeof window === "undefined") return;
  window.localStorage.setItem(STORAGE_KEY, JSON.stringify(pref));
  window.dispatchEvent(new Event(CHANGE_EVENT));
}

// ── System preference listener (only relevant for "auto" mode) ──────────────

function subscribeSystemPref(cb: () => void) {
  if (typeof window === "undefined") return () => {};
  const mq = window.matchMedia("(prefers-color-scheme: dark)");
  const handle = () => cb();
  mq.addEventListener("change", handle);
  return () => mq.removeEventListener("change", handle);
}

function getSystemPrefersDark(): boolean {
  if (typeof window === "undefined") return true;
  return window.matchMedia("(prefers-color-scheme: dark)").matches;
}

function getSystemServerSnapshot(): boolean {
  return true; // Server default matches DEFAULT_THEME.mode = "dark".
}

export function useSystemPrefersDark(): boolean {
  return useSyncExternalStore(
    subscribeSystemPref,
    getSystemPrefersDark,
    getSystemServerSnapshot,
  );
}

// ── Provider: keeps <html> classes in sync with the current preference ──────

export function ThemeProvider({ children }: { children: React.ReactNode }) {
  const pref = useTheme();
  // Subscribing re-triggers the effect when the system flips dark/light in
  // "auto" mode. We don't use the value directly — it's a trigger signal.
  const systemDark = useSystemPrefersDark();

  useEffect(() => {
    if (typeof document === "undefined") return;
    const html = document.documentElement;

    // data-theme is the source of truth for palette × mode. Using an
    // attribute (not a class) means React never overwrites our value.
    html.setAttribute("data-theme", themeDataValue(pref));

    // Keep .dark for shadcn's dark: Tailwind variant. classList is safe
    // because the initial `.dark` comes from JSX and we only flip it,
    // not the whole className.
    if (resolveMode(pref) === "dark") html.classList.add("dark");
    else html.classList.remove("dark");

    // Reference systemDark so the linter knows we intentionally depend on it.
    void systemDark;
  }, [pref, systemDark]);

  return <>{children}</>;
}
