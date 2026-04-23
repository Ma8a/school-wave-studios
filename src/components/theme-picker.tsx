"use client";

import { Check, MonitorSmartphone, Moon, Sun } from "lucide-react";
import {
  setTheme,
  useSystemPrefersDark,
  useTheme,
} from "@/components/theme-provider";
import {
  PALETTE_META,
  PALETTE_ORDER,
  resolveMode,
  type PaletteKey,
  type ThemeMode,
} from "@/lib/theme";
import { cn } from "@/lib/utils";

const MODES: { key: ThemeMode; label: string; icon: typeof Sun }[] = [
  { key: "light", label: "Light", icon: Sun },
  { key: "dark", label: "Dark", icon: Moon },
  { key: "auto", label: "Auto", icon: MonitorSmartphone },
];

export function ThemePicker() {
  const pref = useTheme();
  // Subscribing keeps the swatch preview in sync when the system flips
  // dark/light while the user has Auto mode on.
  const systemDark = useSystemPrefersDark();
  // Resolve once so palette cards show the swatch matching the active mode.
  const effective = resolveMode(pref);
  void systemDark;

  function pickPalette(palette: PaletteKey) {
    setTheme({ ...pref, palette });
  }

  function pickMode(mode: ThemeMode) {
    setTheme({ ...pref, mode });
  }

  return (
    <div className="space-y-5">
      <ModeRow currentMode={pref.mode} onPick={pickMode} palette={pref.palette} />
      <PaletteGrid
        currentPalette={pref.palette}
        effectiveMode={effective}
        onPick={pickPalette}
      />
    </div>
  );
}

function ModeRow({
  currentMode,
  onPick,
  palette,
}: {
  currentMode: ThemeMode;
  onPick: (m: ThemeMode) => void;
  palette: PaletteKey;
}) {
  const meta = PALETTE_META[palette];
  return (
    <div>
      <div className="mb-2 text-sm font-semibold">Mode</div>
      <div className="grid grid-cols-3 gap-2">
        {MODES.map(({ key, label, icon: Icon }) => {
          const selected = currentMode === key;
          // Disable an unsupported mode (e.g. Light when Midnight is selected).
          const disabled =
            (key === "light" && !meta.supportsLight) ||
            (key === "dark" && !meta.supportsDark);
          return (
            <button
              key={key}
              type="button"
              disabled={disabled}
              onClick={() => onPick(key)}
              aria-pressed={selected}
              className={cn(
                "flex flex-col items-center gap-1.5 rounded-md border-2 px-3 py-3 text-xs font-medium transition-all",
                selected
                  ? "border-primary text-primary scale-[1.02]"
                  : "border-border text-muted-foreground hover:text-foreground",
                disabled && "cursor-not-allowed opacity-40 hover:text-muted-foreground",
              )}
              title={
                disabled
                  ? `${meta.name} doesn't support ${label.toLowerCase()} mode`
                  : undefined
              }
            >
              <Icon className="h-4 w-4" />
              {label}
            </button>
          );
        })}
      </div>
      {currentMode === "auto" && (
        <p className="mt-2 text-xs text-muted-foreground">
          Following your device&apos;s light / dark setting.
        </p>
      )}
    </div>
  );
}

function PaletteGrid({
  currentPalette,
  effectiveMode,
  onPick,
}: {
  currentPalette: PaletteKey;
  effectiveMode: "light" | "dark";
  onPick: (p: PaletteKey) => void;
}) {
  return (
    <div>
      <div className="mb-2 text-sm font-semibold">Palette</div>
      <div className="grid grid-cols-2 gap-2 sm:grid-cols-3">
        {PALETTE_ORDER.map((key) => (
          <PaletteCard
            key={key}
            paletteKey={key}
            selected={currentPalette === key}
            mode={effectiveMode}
            onPick={() => onPick(key)}
          />
        ))}
      </div>
      {currentPalette === "custom" && (
        <p className="mt-2 text-xs text-muted-foreground">
          Custom is a stub palette — open{" "}
          <code className="rounded bg-muted px-1 py-0.5 text-[11px]">
            src/app/globals.css
          </code>{" "}
          and edit the{" "}
          <code className="rounded bg-muted px-1 py-0.5 text-[11px]">
            [data-theme=&quot;custom-light&quot;]
          </code>{" "}
          and{" "}
          <code className="rounded bg-muted px-1 py-0.5 text-[11px]">
            [data-theme=&quot;custom-dark&quot;]
          </code>{" "}
          rules to make it your own.
        </p>
      )}
    </div>
  );
}

function PaletteCard({
  paletteKey,
  selected,
  mode,
  onPick,
}: {
  paletteKey: PaletteKey;
  selected: boolean;
  mode: "light" | "dark";
  onPick: () => void;
}) {
  const meta = PALETTE_META[paletteKey];
  // If the palette doesn't support the active mode, show its other side.
  const swatch =
    (mode === "light" && meta.supportsLight) ||
    (mode === "dark" && !meta.supportsDark)
      ? meta.swatchLight
      : meta.swatchDark;

  return (
    <button
      type="button"
      onClick={onPick}
      aria-pressed={selected}
      className={cn(
        "group relative flex flex-col gap-2 overflow-hidden rounded-lg border-2 p-3 text-left transition-all",
        selected
          ? "border-primary"
          : "border-border hover:border-primary/40",
      )}
    >
      {/* Preview strip: 3 representative colors */}
      <div className="flex h-10 overflow-hidden rounded-md border border-border">
        {swatch.map((hex, i) => (
          <span
            key={i}
            aria-hidden
            className="flex-1"
            style={{ backgroundColor: hex }}
          />
        ))}
      </div>
      <div>
        <div className="flex items-center gap-1.5">
          <span className="text-sm font-semibold">{meta.name}</span>
          {selected && (
            <Check className="h-3.5 w-3.5 text-primary" strokeWidth={3} />
          )}
        </div>
        <p className="line-clamp-2 text-xs text-muted-foreground leading-snug">
          {meta.description}
        </p>
      </div>
    </button>
  );
}
