'use client';

import { useEffect, useState } from 'react';
import { useTranslations } from 'next-intl';
import { useLocaleOverride } from './I18nProvider';
import { LOCALES, type Locale } from '@/i18n/config';

const STORAGE_KEY = 'mealprep.lang_prompt_seen';

export function LanguagePrompt() {
  const t = useTranslations('common');
  const { locale, setLocale } = useLocaleOverride();
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    if (typeof window === 'undefined') return;
    if (window.localStorage.getItem(STORAGE_KEY)) return;
    setVisible(true);
  }, []);

  function pick(l: Locale) {
    setLocale(l, { persist: true });
    if (typeof window !== 'undefined') {
      window.localStorage.setItem(STORAGE_KEY, '1');
    }
    setVisible(false);
  }

  function dismiss() {
    if (typeof window !== 'undefined') {
      window.localStorage.setItem(STORAGE_KEY, '1');
    }
    setVisible(false);
  }

  if (!visible) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center bg-black/40 sm:items-center">
      <div className="w-full max-w-sm rounded-t-2xl bg-white p-6 shadow-xl sm:rounded-2xl">
        <h2 className="text-lg font-semibold text-gray-900">{t('languagePrompt')}</h2>
        <p className="mt-1 text-sm text-gray-600">{t('languagePromptHint')}</p>
        <div className="mt-4 grid grid-cols-2 gap-2">
          {LOCALES.map((l) => (
            <button
              key={l}
              type="button"
              onClick={() => pick(l as Locale)}
              className={`btn ${
                locale === l ? 'btn-primary' : 'btn-secondary'
              }`}
            >
              {l === 'en' ? t('english') : t('german')}
            </button>
          ))}
        </div>
        <button
          type="button"
          onClick={dismiss}
          className="mt-3 w-full text-sm text-gray-500 hover:text-gray-700"
        >
          {t('cancel')}
        </button>
      </div>
    </div>
  );
}
