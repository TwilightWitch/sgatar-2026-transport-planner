/**
 * @file SiteHeader — shared branded header used on every portal page.
 *
 * Provides consistent logo placement (left, links to delegate home) and
 * portal navigation (right) on a white background so the logo's full colour
 * palette — navy, crimson, gold and periwinkle — is visible at maximum contrast.
 *
 * A two-pixel gradient strip at the bottom of the header echoes the logo
 * colours across the site without overwhelming the UI.
 *
 * @param children   Optional content rendered between logo and nav (e.g. page
 *                   title or status indicators for the admin control room).
 * @param maxWidth   Tailwind max-width class for the inner container.
 *                   Defaults to "max-w-4xl"; pass "max-w-7xl" for admin.
 */
"use client";

import Link from "next/link";
import type { ReactNode } from "react";
import { PortalNav } from "./PortalNav";
import { ThemeToggle } from "./ThemeToggle";

interface SiteHeaderProps {
  children?: ReactNode;
  maxWidth?: string;
}

export function SiteHeader({
  children,
  maxWidth = "max-w-4xl",
}: Readonly<SiteHeaderProps>) {
  return (
    <header className="bg-white shadow-sm dark:bg-gray-900">
      <div
        className={`mx-auto ${maxWidth} flex items-center justify-between gap-4 px-4 py-3 sm:px-6`}
      >
        {/* Logo — always links back to delegate home */}
        <Link
          href="/"
          aria-label="SGATAR 2026 — go to delegate home"
          className="shrink-0 transition-opacity hover:opacity-80"
        >
          <img
            src="/SGATAR-2026-Logo.png"
            alt="55th SGATAR Singapore 2026"
            className="h-12 w-auto"
          />
        </Link>

        {/* Middle slot: page-specific title / status indicators */}
        {children && <div className="min-w-0 flex-1">{children}</div>}

        {/* Right side: accessibility settings + portal navigation */}
        <div className="flex items-center gap-2">
          <ThemeToggle />
          <PortalNav />
        </div>
      </div>

      {/* Brand colour strip: logo navy → periwinkle → crimson */}
      <div className="h-0.5 bg-gradient-to-r from-brand-500 via-brand-300 to-accent-500" />
    </header>
  );
}
