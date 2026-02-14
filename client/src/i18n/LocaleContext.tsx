import { createContext, useContext, useState, useCallback, useEffect, type ReactNode } from "react";
import en from "./en";
import fr from "./fr";
import type { Translations } from "./en";

export type Locale = "en" | "fr";

const translations: Record<Locale, Translations> = { en, fr };

interface LocaleContextValue {
  locale: Locale;
  setLocale: (locale: Locale) => void;
  toggleLocale: () => void;
  t: Translations;
}

const LocaleContext = createContext<LocaleContextValue | null>(null);

const STORAGE_KEY = "rusingacademy_locale";

function getInitialLocale(): Locale {
  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (stored === "en" || stored === "fr") return stored;
  } catch {}
  // Check browser language
  const browserLang = navigator.language?.toLowerCase();
  if (browserLang?.startsWith("fr")) return "fr";
  return "en";
}

export function LocaleProvider({ children }: { children: ReactNode }) {
  const [locale, setLocaleState] = useState<Locale>(getInitialLocale);

  const setLocale = useCallback((newLocale: Locale) => {
    setLocaleState(newLocale);
    try {
      localStorage.setItem(STORAGE_KEY, newLocale);
    } catch {}
    // Update html lang attribute
    document.documentElement.lang = newLocale;
  }, []);

  const toggleLocale = useCallback(() => {
    setLocale(locale === "en" ? "fr" : "en");
  }, [locale, setLocale]);

  // Set initial html lang
  useEffect(() => {
    document.documentElement.lang = locale;
  }, []);

  const value: LocaleContextValue = {
    locale,
    setLocale,
    toggleLocale,
    t: translations[locale],
  };

  return (
    <LocaleContext.Provider value={value}>
      {children}
    </LocaleContext.Provider>
  );
}

export function useLocale(): LocaleContextValue {
  const ctx = useContext(LocaleContext);
  if (!ctx) {
    throw new Error("useLocale must be used within a LocaleProvider");
  }
  return ctx;
}
