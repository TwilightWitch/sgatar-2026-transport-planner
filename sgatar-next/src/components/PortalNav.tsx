/**
 * @file PortalNav component.
 *
 * Compact horizontal navigation bar rendered in every portal header.  Links
 * to all four portals (Delegates, LO, Admin, Display) with the current portal
 * highlighted.  Uses Next.js `<Link>` for client-side navigation.
 *
 * Designed for light / white header backgrounds — active links use the brand
 * navy, inactive links are muted brand-400 that darken on hover.
 */
"use client";

import Link from "next/link";
import { useRouter } from "next/router";

const NAV_ITEMS = [
  { href: "/", label: "Delegates" },
  { href: "/lo", label: "LO Portal" },
  { href: "/admin", label: "Admin" },
  { href: "/display", label: "Display" },
] as const;

export function PortalNav() {
  const { pathname } = useRouter();

  function isActive(href: string) {
    if (href === "/") return pathname === "/";
    return pathname.startsWith(href);
  }

  return (
    <nav aria-label="Portal navigation" className="flex gap-1">
      {NAV_ITEMS.map((item) => (
        <Link
          key={item.href}
          href={item.href}
          className={`rounded-md px-3 py-1.5 text-xs font-semibold transition-colors ${
            isActive(item.href)
              ? "bg-brand-500 text-white"
              : // inactive: brand-400 (#3d56a0) on white = 6.3:1 AA ✓
                // dark inactive: gray-200 (#e5e7eb) on gray-900 (#111827) = 13:1 AAA ✓
                "text-brand-400 hover:bg-brand-50 hover:text-brand-600 dark:text-gray-200 dark:hover:bg-gray-700 dark:hover:text-white"
          }`}
        >
          {item.label}
        </Link>
      ))}
    </nav>
  );
}
