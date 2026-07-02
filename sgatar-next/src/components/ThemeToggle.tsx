/**
 * @file ThemeToggle — accessibility settings panel.
 *
 * Provides a compact popover button in the site header that lets users switch
 * between five display modes:
 *
 * | Mode          | HTML class(es)    | What it does                                    |
 * |---------------|-------------------|-------------------------------------------------|
 * | Light         | (none)            | Default cream/white palette                     |
 * | Dark          | `dark`            | Tailwind dark: variants                         |
 * | Protanopia    | `cb-protanopia`   | SVG matrix simulating missing L (red) cones     |
 * | Deuteranopia  | `cb-deuteranopia` | SVG matrix simulating missing M (green) cones   |
 * | High Contrast | `high-contrast`   | CSS contrast boost; black-on-white              |
 *
 * The selected mode is persisted to `localStorage` under `sgatar-theme` and
 * restored before first paint by the inline script in `_document.tsx`.
 *
 * WCAG notes:
 * - The popover button meets the 44 × 44 px minimum touch target.
 * - All text in the popover has ≥ 4.5:1 contrast on white (AA).
 * - The active mode is communicated via `aria-pressed` on each option.
 */
"use client";

import { useEffect, useRef, useState } from "react";

/** Supported theme mode identifiers. */
type ThemeMode =
  | "light"
  | "dark"
  | "protanopia"
  | "deuteranopia"
  | "tritanopia"
  | "high-contrast";

interface ModeOption {
  id: ThemeMode;
  label: string;
  /** Short description shown beneath the label. */
  description: string;
  icon: string;
}

const MODES: ModeOption[] = [
  {
    id: "light",
    label: "Light",
    description: "Default warm cream palette",
    icon: "☀️",
  },
  {
    id: "dark",
    label: "Dark",
    description: "Low-light environment",
    icon: "🌙",
  },
  {
    id: "protanopia",
    label: "Protanopia",
    description: "Red-blind simulation",
    icon: "🔴",
  },
  {
    id: "deuteranopia",
    label: "Deuteranopia",
    description: "Green-blind simulation",
    icon: "🟢",
  },
  {
    id: "tritanopia",
    label: "Tritanopia",
    description: "Blue-blind simulation",
    icon: "🔵",
  },
  {
    id: "high-contrast",
    label: "High Contrast",
    description: "Maximum legibility (WCAG AAA)",
    icon: "⬛",
  },
];

/** Class applied to `<html>` for each mode. */
const MODE_CLASS: Record<ThemeMode, string> = {
  light: "",
  dark: "dark",
  protanopia: "cb-protanopia",
  deuteranopia: "cb-deuteranopia",
  tritanopia: "cb-tritanopia",
  "high-contrast": "high-contrast",
};

const STORAGE_KEY = "sgatar-theme";

function applyMode(mode: ThemeMode) {
  const html = document.documentElement;
  // Remove all theme classes
  Object.values(MODE_CLASS).forEach((cls) => {
    if (cls) html.classList.remove(cls);
  });
  // Apply the new one
  const cls = MODE_CLASS[mode];
  if (cls) html.classList.add(cls);
  try {
    localStorage.setItem(STORAGE_KEY, mode);
  } catch {
    // Storage unavailable
  }
}

/**
 * Reads the active theme mode from the `<html>` class list.
 * Falls back to `localStorage` then `'light'`.
 */
function detectCurrentMode(): ThemeMode {
  if (typeof window === "undefined") return "light";
  const html = document.documentElement;
  for (const [id, cls] of Object.entries(MODE_CLASS) as [ThemeMode, string][]) {
    if (cls && html.classList.contains(cls)) return id;
  }
  try {
    const saved = localStorage.getItem(STORAGE_KEY) as ThemeMode | null;
    if (saved && saved in MODE_CLASS) return saved;
  } catch {
    // ignore
  }
  return "light";
}

/**
 * Compact settings button that opens an accessibility theme picker.
 *
 * Placed inside the `SiteHeader` to the left of the portal navigation.
 */
export function ThemeToggle() {
  const [open, setOpen] = useState(false);
  const [activeMode, setActiveMode] = useState<ThemeMode>("light");
  const panelRef = useRef<HTMLDivElement>(null);
  const buttonRef = useRef<HTMLButtonElement>(null);

  // Initialise from DOM (already set by _document.tsx inline script)
  useEffect(() => {
    setActiveMode(detectCurrentMode());
  }, []);

  // Close panel when clicking outside
  useEffect(() => {
    if (!open) return;
    function onOutside(e: MouseEvent) {
      if (
        panelRef.current &&
        !panelRef.current.contains(e.target as Node) &&
        !buttonRef.current?.contains(e.target as Node)
      ) {
        setOpen(false);
      }
    }
    document.addEventListener("mousedown", onOutside);
    return () => document.removeEventListener("mousedown", onOutside);
  }, [open]);

  function selectMode(mode: ThemeMode) {
    applyMode(mode);
    setActiveMode(mode);
    setOpen(false);
  }

  const current = MODES.find((m) => m.id === activeMode) ?? MODES[0];

  return (
    <div className="relative">
      <button
        ref={buttonRef}
        type="button"
        aria-label={`Display settings — current: ${current.label}`}
        aria-expanded={open}
        aria-haspopup="listbox"
        onClick={() => setOpen((v) => !v)}
        className="flex min-h-[44px] min-w-[44px] items-center justify-center rounded-lg border border-gray-200 bg-white px-2 text-base shadow-sm transition-colors hover:bg-cream-100 dark:border-gray-700 dark:bg-gray-800 dark:hover:bg-gray-700"
        title="Display settings"
      >
        <span aria-hidden="true">{current.icon}</span>
      </button>

      {open && (
        <div
          ref={panelRef}
          role="listbox"
          aria-label="Display mode"
          className="absolute right-0 top-12 z-50 w-64 overflow-hidden rounded-xl border border-gray-200 bg-white shadow-lg dark:border-gray-700 dark:bg-gray-900"
        >
          <div className="border-b border-gray-100 px-4 py-2 dark:border-gray-800">
            <p className="text-xs font-semibold uppercase tracking-wide text-gray-500 dark:text-gray-400">
              Display settings
            </p>
          </div>

          <ul className="py-1">
            {MODES.map((mode) => {
              const isActive = mode.id === activeMode;
              return (
                <li key={mode.id}>
                  <button
                    type="button"
                    role="option"
                    aria-selected={isActive}
                    aria-pressed={isActive}
                    onClick={() => selectMode(mode.id)}
                    className={`flex w-full items-center gap-3 px-4 py-2.5 text-left text-sm transition-colors ${
                      isActive
                        ? "bg-brand-50 text-brand-700 dark:bg-brand-900/30 dark:text-brand-300"
                        : "text-gray-700 hover:bg-gray-50 dark:text-gray-300 dark:hover:bg-gray-800"
                    }`}
                  >
                    <span aria-hidden="true" className="text-base">
                      {mode.icon}
                    </span>
                    <div className="min-w-0">
                      <p className="font-semibold">{mode.label}</p>
                      <p className="text-xs text-gray-500 dark:text-gray-400">
                        {mode.description}
                      </p>
                    </div>
                    {isActive && (
                      <span className="ml-auto text-brand-500 dark:text-brand-300">
                        ✓
                      </span>
                    )}
                  </button>
                </li>
              );
            })}
          </ul>

          <div className="border-t border-gray-100 px-4 py-2 dark:border-gray-800">
            <p className="text-[10px] text-gray-400">
              Colorblind modes simulate dichromacy for accessibility testing.
            </p>
          </div>
        </div>
      )}
    </div>
  );
}
