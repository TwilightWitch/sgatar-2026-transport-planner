"use client";

import {
  createContext,
  useContext,
  useMemo,
  useState,
  type ReactNode,
} from "react";
import { getDictionary, type Dictionary, type Locale } from "./dictionaries";

interface I18nContextValue {
  locale: Locale;
  t: Dictionary["strings"];
  setLocale: (locale: Locale) => void;
}

const I18nContext = createContext<I18nContextValue | null>(null);

export function I18nProvider({ children }: Readonly<{ children: ReactNode }>) {
  const [locale, setLocale] = useState<Locale>("en");
  const dictionary = getDictionary(locale);

  const contextValue = useMemo<I18nContextValue>(
    () => ({ locale, t: dictionary.strings, setLocale }),
    [locale, dictionary.strings],
  );

  return (
    <I18nContext.Provider value={contextValue}>{children}</I18nContext.Provider>
  );
}

export function useI18n(): I18nContextValue {
  const context = useContext(I18nContext);
  if (!context) {
    throw new Error("useI18n must be used within an I18nProvider");
  }
  return context;
}
