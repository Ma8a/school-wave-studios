"use client";

import {
  useEffect,
  useRef,
  type ClipboardEvent,
  type KeyboardEvent,
} from "react";
import { cn } from "@/lib/utils";

interface PinInputProps {
  value: string;
  onChange: (next: string) => void;
  /** Fires once when all `length` digits are filled. */
  onComplete?: (final: string) => void;
  length?: number;
  autoFocus?: boolean;
  disabled?: boolean;
  error?: boolean;
  ariaLabel?: string;
}

/**
 * Reusable N-digit PIN input. One <input> per digit so the on-screen
 * numeric keypad pops up nicely on phones, with auto-advance on type and
 * auto-step-back on backspace.
 *
 * Accepts paste of a full PIN (e.g. from a password manager) and distributes
 * the digits across the boxes.
 */
export function PinInput({
  value,
  onChange,
  onComplete,
  length = 4,
  autoFocus = false,
  disabled = false,
  error = false,
  ariaLabel = "PIN",
}: PinInputProps) {
  const refs = useRef<(HTMLInputElement | null)[]>([]);
  // Pad / clip the incoming value so we always render exactly `length` boxes.
  const digits: string[] = Array.from({ length }, (_, i) => value[i] ?? "");

  useEffect(() => {
    if (autoFocus && !disabled) {
      refs.current[0]?.focus();
    }
  }, [autoFocus, disabled]);

  function setDigitAt(i: number, ch: string) {
    if (ch && !/[0-9]/.test(ch)) return;
    const next = digits.slice();
    next[i] = ch;
    // Trim trailing empty slots — onChange contract is "string of digits so far".
    const joined = next.join("").replace(/\s+$/g, "");
    onChange(joined);
    if (ch && i < length - 1) {
      refs.current[i + 1]?.focus();
    }
    if (joined.length === length && onComplete) {
      onComplete(joined);
    }
  }

  function handleKeyDown(i: number, e: KeyboardEvent<HTMLInputElement>) {
    if (e.key === "Backspace" && !digits[i] && i > 0) {
      // Empty box + backspace = jump back and clear that box.
      const next = digits.slice();
      next[i - 1] = "";
      onChange(next.join("").replace(/\s+$/g, ""));
      refs.current[i - 1]?.focus();
      e.preventDefault();
    } else if (e.key === "ArrowLeft" && i > 0) {
      refs.current[i - 1]?.focus();
      e.preventDefault();
    } else if (e.key === "ArrowRight" && i < length - 1) {
      refs.current[i + 1]?.focus();
      e.preventDefault();
    }
  }

  function handlePaste(e: ClipboardEvent<HTMLInputElement>) {
    const text = e.clipboardData
      .getData("text")
      .replace(/\D/g, "")
      .slice(0, length);
    if (!text) return;
    onChange(text);
    const targetIdx = Math.min(text.length, length - 1);
    refs.current[targetIdx]?.focus();
    if (text.length === length && onComplete) onComplete(text);
    e.preventDefault();
  }

  return (
    <div
      role="group"
      aria-label={ariaLabel}
      className="flex items-center justify-center gap-2"
    >
      {Array.from({ length }).map((_, i) => (
        <input
          key={i}
          ref={(el) => {
            refs.current[i] = el;
          }}
          type="password"
          inputMode="numeric"
          autoComplete="one-time-code"
          maxLength={1}
          value={digits[i] ?? ""}
          onChange={(e) => setDigitAt(i, e.target.value.slice(-1))}
          onKeyDown={(e) => handleKeyDown(i, e)}
          onPaste={handlePaste}
          disabled={disabled}
          aria-label={`${ariaLabel} digit ${i + 1} of ${length}`}
          className={cn(
            "h-14 w-12 rounded-md border-2 bg-card text-center font-mono text-2xl tabular-nums shadow-sm transition-colors",
            "focus-visible:outline-none focus-visible:border-ring focus-visible:ring-2 focus-visible:ring-ring/30",
            error ? "border-destructive" : "border-input",
            disabled && "opacity-50 cursor-not-allowed",
          )}
        />
      ))}
    </div>
  );
}
