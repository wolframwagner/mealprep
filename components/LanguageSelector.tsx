'use client';

import { useTranslations } from 'next-intl';
import { useLocaleOverride } from './I18nProvider';
import { LOCALES, type Locale } from '@/i18n/config';

export function LanguageSelector() {
  const t = useTranslations('common');
  const { locale, setLocale } = useLocaleOverride();

  return (
    <div className="flex items-center gap-1 rounded-lg border border-gray-200 bg-white p-1 text-sm">
      {LOCALES.map((l) => (
        <button
          key={l}
          type="button"
          onClick={() => setLocale(l as Locale, { persist: true })}
          className={`rounded-md px-2.5 py-1 transition ${
            locale === l ? 'bg-brand-600 text-white' : 'text-gray-600 hover:bg-gray-50'
          }`}
          aria-pressed={locale === l}
        >
          {l === 'en' ? t('english') : t('german')}
        </button>
      ))}
    </div>
  );
}
