/**
 * @file QuickGuide component.
 *
 * A collapsible `<details>` panel rendered near the top of each portal page
 * to give first-time users contextual guidance without cluttering the main UI.
 *
 * Implemented with native HTML `<details>`/`<summary>` so no JavaScript state
 * is required and it degrades gracefully in any browser.  The panel starts
 * closed on mobile (screen width < sm) to keep the primary content visible.
 */
"use client";

import { HelpCircle } from "lucide-react";

interface GuideItem {
  /** Short emoji or symbol prefix shown before the text. */
  icon: string;
  /** One-line instruction or tip. */
  text: string;
}

interface QuickGuideProps {
  /** Section heading shown in the `<summary>` bar. */
  title: string;
  /** Ordered list of tips to display. */
  items: GuideItem[];
  /** When true the panel starts open (default: false). */
  defaultOpen?: boolean;
}

/**
 * Collapsible help panel with a list of contextual tips.
 *
 * @example
 * <QuickGuide
 *   title="How to use this page"
 *   items={[{ icon: "🔄", text: "Page refreshes every 4 seconds" }]}
 * />
 */
export function QuickGuide({
  title,
  items,
  defaultOpen = false,
}: Readonly<QuickGuideProps>) {
  return (
    <details
      open={defaultOpen}
      className="group rounded-xl border border-blue-200 bg-blue-50 dark:border-blue-800 dark:bg-blue-950/40"
    >
      <summary className="flex cursor-pointer list-none items-center gap-2 px-4 py-3 text-sm font-medium text-blue-800 dark:text-blue-200 [&::-webkit-details-marker]:hidden">
        <HelpCircle
          className="h-4 w-4 shrink-0 text-blue-500"
          aria-hidden="true"
        />
        <span className="flex-1">{title}</span>
        {/* Chevron rotates when open */}
        <svg
          className="h-4 w-4 shrink-0 text-blue-400 transition-transform group-open:rotate-180"
          viewBox="0 0 20 20"
          fill="currentColor"
          aria-hidden="true"
        >
          <path
            fillRule="evenodd"
            d="M5.23 7.21a.75.75 0 011.06.02L10 11.168l3.71-3.938a.75.75 0 111.08 1.04l-4.25 4.5a.75.75 0 01-1.08 0l-4.25-4.5a.75.75 0 01.02-1.06z"
            clipRule="evenodd"
          />
        </svg>
      </summary>

      <ul className="space-y-2 px-4 pb-4 pt-1">
        {items.map((item) => (
          <li key={item.text} className="flex items-start gap-2 text-sm">
            <span
              className="mt-0.5 shrink-0 text-base leading-none"
              aria-hidden="true"
            >
              {item.icon}
            </span>
            <span className="text-blue-900 dark:text-blue-100">
              {item.text}
            </span>
          </li>
        ))}
      </ul>
    </details>
  );
}
