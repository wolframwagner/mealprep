'use client';

import { NextIntlClientProvider, type AbstractIntlMessages } from 'next-intl';
import { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';
import type { Locale } from '@/i18n/config';
import en from '@/messages/en.json';
import de from '@/messages/de.json';

type LocaleContextValue = {
  locale: Locale;
  setLocale: (next: Locale, options?: { persist?: boolean }) => void;
};

const LocaleContext = createContext<LocaleContextValue | null>(null);

const ALL_MESSAGES: Record<Locale, AbstractIntlMessages> = {
  en: en as unknown as AbstractIntlMessages,
  de: de as unknown as AbstractIntlMessages,
};

export function I18nProvider({
  initialLocale,
  children,
}: {
  initialLocale: Locale;
  initialMessages?: AbstractIntlMessages;
  children: React.ReactNode;
}) {
  const [locale, setLocaleState] = useState<Locale>(initialLocale);

  const setLocale = useCallback((next: Locale, options?: { persist?: boolean }) => {
    setLocaleState(next);
    if (options?.persist !== false && typeof window !== 'undefined') {
      window.localStorage.setItem('mealprep.lang', next);
      document.cookie = `mealprep.lang=${next}; path=/; max-age=31536000; samesite=lax`;
    }
  }, []);

  useEffect(() => {
    if (typeof window === 'undefined') return;
    const stored = window.localStorage.getItem('mealprep.lang');
    if (stored === 'en' || stored === 'de') {
      if (stored !== locale) {
        setLocaleState(stored);
        document.cookie = `mealprep.lang=${stored}; path=/; max-age=31536000; samesite=lax`;
      }
    }
    // run once on mount
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const value = useMemo(() => ({ locale, setLocale }), [locale, setLocale]);

  return (
    <LocaleContext.Provider value={value}>
      <NextIntlClientProvider locale={locale} messages={ALL_MESSAGES[locale]}>
        {children}
      </NextIntlClientProvider>
    </LocaleContext.Provider>
  );
}

export function useLocaleOverride() {
  const ctx = useContext(LocaleContext);
  if (!ctx) throw new Error('useLocaleOverride must be used inside I18nProvider');
  return ctx;
}
