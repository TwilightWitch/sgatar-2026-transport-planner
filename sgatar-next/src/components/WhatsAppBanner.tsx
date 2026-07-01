/**
 * @file WhatsAppBanner component.
 *
 * Delegate portal call-to-action that deep-links into the SGATAR 2026
 * WhatsApp group for live transport updates.  The invite URL is injected at
 * build time via the `NEXT_PUBLIC_WHATSAPP_INVITE_URL` environment variable
 * (must be in `sgatar-next/.env` or `sgatar-next/.env.local`).
 *
 * Falls back to `"#"` when the variable is absent so the banner is still
 * rendered without breaking the page.
 */
"use client";

import { useI18n } from "@/lib/i18n/provider";
import { MessageCircle } from "lucide-react";

export function WhatsAppBanner() {
  const { t } = useI18n();
  const whatsappUrl = process.env.NEXT_PUBLIC_WHATSAPP_INVITE_URL ?? "#";

  return (
    <a
      href={whatsappUrl}
      target="_blank"
      rel="noopener noreferrer"
      className="flex items-center gap-3 rounded-xl border border-green-200 bg-green-50 p-4 transition-colors hover:bg-green-100 dark:border-green-800 dark:bg-green-950 dark:hover:bg-green-900"
      aria-label={t.whatsappBanner}
    >
      <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-green-500">
        <MessageCircle className="h-5 w-5 text-white" aria-hidden="true" />
      </div>
      <div>
        <p className="text-sm font-semibold text-green-900 dark:text-green-100">
          {t.whatsappBanner}
        </p>
        <p className="text-xs text-green-700 dark:text-green-300">
          SGATAR 2026 Transport Updates
        </p>
      </div>
    </a>
  );
}
