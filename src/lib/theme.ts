/**
 * Theme system — two orthogonal dimensions:
 *   1. palette — the color family (warm, pastel, grayscale, midnight, custom)
 *   2. mode    — light or dark or "auto" (follows system preference)
 *
 * The resolved value on <html data-theme="..."> is `<palette>-<mode>`,
 * e.g. `warm-dark` or `pastel-light`. Each `[data-theme="..."]` block
 * in globals.css defines the same set of CSS custom properties
 * (--background, --primary, etc.), so every component stays identical —
 * only the values change. We use a data attribute (not a class) because
 * React never reconciles attributes it didn't render in JSX, so the
 * ThemeProvider's DOM writes always stick.
 */

export type ThemeMode = "light" | "dark" | "auto";

export type PaletteKey =
  | "warm"
  | "pastel"
  | "grayscale"
  | "midnight"
  | "custom";

export interface ThemePreference {
  palette: PaletteKey;
  mode: ThemeMode;
}

export interface PaletteMeta {
  key: PaletteKey;
  name: string;
  description: string;
  /**
   * If true, the palette has both light and dark CSS classes.
   * If false, the palette is single-mode — "Midnight" is dark-only,
   * and a custom palette you only design for one side would be too.
   */
  supportsLight: boolean;
  supportsDark: boolean;
  /** 3 representative hex colors for the preview swatch in the picker. */
  swatchLight: [string, string, string];
  swatchDark: [string, string, string];
}

export const PALETTE_META: Record<PaletteKey, PaletteMeta> = {
  warm: {
    key: "warm",
    name: "Warm",
    description: "Mustard and ochre on warm neutrals. The original.",
    supportsLight: true,
    supportsDark: true,
    swatchLight: ["#f8f5ec", "#c79a3a", "#8a6a26"],
    swatchDark: ["#211d18", "#c79a3a", "#e2b85c"],
  },
  pastel: {
    key: "pastel",
    name: "Pastel",
    description: "Soft pinks, lavenders, and cream. Gentle on the eyes.",
    supportsLight: true,
    supportsDark: true,
    swatchLight: ["#fbf4f4", "#c58ab5", "#8f6a9a"],
    swatchDark: ["#2a222a", "#d79fc5", "#b88bb1"],
  },
  grayscale: {
    key: "grayscale",
    name: "Grayscale",
    description: "Pure neutrals — black, white, and every gray in between.",
    supportsLight: true,
    supportsDark: true,
    swatchLight: ["#ffffff", "#222222", "#777777"],
    swatchDark: ["#121212", "#e8e8e8", "#9a9a9a"],
  },
  midnight: {
    key: "midnight",
    name: "Midnight",
    description: "Nearly black with cool indigo accents. Dark only.",
    supportsLight: false,
    supportsDark: true,
    swatchLight: ["#000000", "#000000", "#000000"],
    swatchDark: ["#0a0d14", "#6b7fe4", "#8b9cf0"],
  },
  custom: {
    key: "custom",
    name: "Custom",
    description: "Your own colors — defined in lib/theme.ts.",
    supportsLight: true,
    supportsDark: true,
    swatchLight: ["#f5f5f5", "#5e7a99", "#4a6282"],
    swatchDark: ["#1a1e24", "#8aa3c4", "#5e7a99"],
  },
};

export const PALETTE_ORDER: PaletteKey[] = [
  "warm",
  "pastel",
  "grayscale",
  "midnight",
  "custom",
];

export const DEFAULT_THEME: ThemePreference = {
  palette: "warm",
  mode: "dark",
};

/** Coerce any unknown value to a valid ThemePreference, falling back to defaults. */
export function normalizeTheme(input: unknown): ThemePreference {
  if (!input || typeof input !== "object") return DEFAULT_THEME;
  const { palette, mode } = input as Partial<ThemePreference>;
  const validPalette =
    palette && palette in PALETTE_META ? palette : DEFAULT_THEME.palette;
  const validMode: ThemeMode =
    mode === "light" || mode === "dark" || mode === "auto"
      ? mode
      : DEFAULT_THEME.mode;
  return { palette: validPalette as PaletteKey, mode: validMode };
}

/**
 * Resolves "auto" mode to a concrete "light" or "dark" based on the browser's
 * `prefers-color-scheme`. Safe to call on the server — returns "dark" as a
 * stable fallback so server + first-client render match.
 */
export function resolveAutoMode(): "light" | "dark" {
  if (typeof window === "undefined") return "dark";
  const prefers = window.matchMedia("(prefers-color-scheme: dark)").matches;
  return prefers ? "dark" : "light";
}

/**
 * The final "effective" mode after resolving auto + respecting palette
 * constraints (Midnight is dark-only, so it overrides a "light" pick).
 */
export function resolveMode(pref: ThemePreference): "light" | "dark" {
  const meta = PALETTE_META[pref.palette];
  const requested = pref.mode === "auto" ? resolveAutoMode() : pref.mode;
  if (requested === "light" && !meta.supportsLight) return "dark";
  if (requested === "dark" && !meta.supportsDark) return "light";
  return requested;
}

/**
 * The value to put on <html data-theme="..."> for the given preference.
 * We use a data attribute (rather than a class) because React never touches
 * attributes it didn't set in JSX, so direct DOM writes stick reliably.
 */
export function themeDataValue(pref: ThemePreference): string {
  return `${pref.palette}-${resolveMode(pref)}`;
}

/**
 * Small inline script that runs in <head> *before* React hydrates. Reads
 * the saved theme from localStorage and applies the right data-theme value
 * to <html> so there's no flash of the wrong theme on first paint.
 *
 * Must be self-contained, synchronous, and survive localStorage errors.
 */
export const NO_FOUC_SCRIPT = `
(function() {
  try {
    var raw = localStorage.getItem('sws:theme:v1');
    var palette = 'warm';
    var mode = 'dark';
    if (raw) {
      var p = JSON.parse(raw);
      if (p && typeof p === 'object') {
        if (['warm','pastel','grayscale','midnight','custom'].indexOf(p.palette) !== -1) palette = p.palette;
        if (['light','dark','auto'].indexOf(p.mode) !== -1) mode = p.mode;
      }
    }
    if (mode === 'auto') {
      mode = window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
    }
    if (palette === 'midnight') mode = 'dark';
    var html = document.documentElement;
    html.setAttribute('data-theme', palette + '-' + mode);
    // Keep .dark in sync for shadcn's dark: Tailwind variant.
    if (mode === 'dark') html.classList.add('dark');
    else html.classList.remove('dark');
  } catch (e) {}
})();
`.trim();
