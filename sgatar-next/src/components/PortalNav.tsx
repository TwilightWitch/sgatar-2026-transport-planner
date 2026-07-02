/**
 * @file PortalNav component.
 *
 * Compact horizontal navigation bar rendered in every portal header.  Links
 * to all four portals (Delegate, LO, Admin, Display) with the current portal
 * highlighted.  Uses Next.js `<Link>` for client-side navigation.
 *
 * Designed for dark header backgrounds — active links use `bg-white/20` and
 * inactive links use `text-white/70` to meet WCAG 4.5:1 contrast on dark
 * backgrounds.
 */
"use client";

import Link from "next/link";
import { useRouter } from "next/router";

const NAV_ITEMS = [
  { href: "/", label: "Delegate" },
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
          className={`rounded-md px-3 py-1.5 text-xs font-medium transition-colors ${
            isActive(item.href)
              ? "bg-white/20 text-white"
              : "text-white/70 hover:bg-white/10 hover:text-white"
          }`}
        >
          {item.label}
        </Link>
      ))}
    </nav>
  );
}
