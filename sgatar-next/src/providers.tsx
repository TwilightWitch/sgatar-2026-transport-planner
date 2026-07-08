"use client";

import { I18nProvider } from "@/lib/i18n/provider";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { useEffect, useState, type ReactNode } from "react";

const THEME_STORAGE_KEY = "sgatar-theme";

/**
 * Ensures the app respects `prefers-color-scheme` when no explicit theme is saved.
 */
function ThemePreferenceSync() {
  useEffect(() => {
    const html = document.documentElement;

    try {
      const savedTheme = localStorage.getItem(THEME_STORAGE_KEY);
      if (savedTheme) return;
    } catch {
      return;
    }

    if (globalThis.matchMedia("(prefers-color-scheme: dark)").matches) {
      html.classList.add("dark");
    } else {
      html.classList.remove("dark");
    }
  }, []);

  return null;
}

export function Providers({ children }: Readonly<{ children: ReactNode }>) {
  const [queryClient] = useState(
    () =>
      new QueryClient({
        defaultOptions: {
          queries: {
            retry: 2,
            refetchOnWindowFocus: true,
          },
        },
      }),
  );

  return (
    <QueryClientProvider client={queryClient}>
      <ThemePreferenceSync />
      <I18nProvider>{children}</I18nProvider>
    </QueryClientProvider>
  );
}
