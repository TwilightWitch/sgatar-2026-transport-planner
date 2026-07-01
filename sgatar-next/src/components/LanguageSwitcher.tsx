"use client";

import { Globe } from "lucide-react";
import { useI18n } from "@/lib/i18n/provider";
import { getLocaleList, type Locale } from "@/lib/i18n/dictionaries";

export function LanguageSwitcher() {
  const { locale, setLocale } = useI18n();
  const locales = getLocaleList();

  return (
    <div className="relative inline-block">
      <label htmlFor="language-select" className="sr-only">
        Select language
      </label>
      <div className="flex items-center gap-2">
        <Globe
          className="h-4 w-4 text-gray-600 dark:text-gray-400"
          aria-hidden="true"
        />
        <select
          id="language-select"
          value={locale}
          onChange={(e) => setLocale(e.target.value as Locale)}
          className="appearance-none rounded-md border border-gray-300 bg-white px-3 py-1.5 text-sm font-medium text-gray-700 shadow-sm hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-brand-500 dark:border-gray-600 dark:bg-gray-800 dark:text-gray-200 dark:hover:bg-gray-700"
        >
          {locales.map((l) => (
            <option key={l.locale} value={l.locale}>
              {l.label}
            </option>
          ))}
        </select>
      </div>
    </div>
  );
}
