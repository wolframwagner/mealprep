'use client';

import { useMemo, useState } from 'react';
import { useTranslations } from 'next-intl';
import { useLocaleOverride } from './I18nProvider';
import type { Sauce } from '@/lib/supabase/types';
import { pickI18n } from '@/lib/format';

const PORTIONS = [2, 3, 4, 5, 6] as const;

export function CookingGuide({ sauces }: { sauces: Sauce[] }) {
  const t = useTranslations('cooking');
  const tDays = useTranslations('days');
  const { locale } = useLocaleOverride();
  const [portions, setPortions] = useState<number>(4);
  const [active, setActive] = useState<string | null>(sauces[0]?.id ?? null);

  const sauce = useMemo(
    () => sauces.find((s) => s.id === active) ?? sauces[0] ?? null,
    [sauces, active],
  );

  if (!sauce) {
    return <div className="card text-sm text-gray-600">{t('noRecipe')}</div>;
  }

  const steps = sauce.recipe[locale] ?? sauce.recipe.de;

  return (
    <div className="card space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <h2 className="text-lg font-semibold">{pickI18n(sauce.name_i18n, locale)}</h2>
        <span className="pill">
          {tDays(String(sauce.day_of_week) as '0' | '1' | '2' | '3' | '4' | '5' | '6')}
        </span>
      </div>

      <div className="flex flex-wrap items-center gap-2">
        <span className="text-sm text-gray-600">{t('scaledFor', { n: portions })}</span>
        <div className="flex gap-1">
          {PORTIONS.map((n) => (
            <button
              key={n}
              type="button"
              onClick={() => setPortions(n)}
              className={`rounded-md px-2.5 py-1 text-sm ${
                portions === n ? 'bg-brand-600 text-white' : 'bg-gray-100 text-gray-700'
              }`}
            >
              {n}
            </button>
          ))}
        </div>
      </div>

      <ol className="space-y-3">
        {steps.map((step, i) => (
          <li key={i} className="flex gap-3">
            <span className="mt-0.5 inline-flex h-6 w-6 flex-none items-center justify-center rounded-full bg-brand-100 text-xs font-semibold text-brand-800">
              {i + 1}
            </span>
            <div className="text-sm text-gray-800">
              <div className="text-xs text-gray-500">
                {t('step', { n: i + 1, total: steps.length })}
              </div>
              {step}
            </div>
          </li>
        ))}
      </ol>

      {sauces.length > 1 && (
        <div className="flex flex-wrap gap-2 border-t border-gray-100 pt-3">
          {sauces.map((s) => (
            <button
              key={s.id}
              type="button"
              onClick={() => setActive(s.id)}
              className={`rounded-md px-3 py-1.5 text-sm ${
                s.id === sauce.id ? 'bg-brand-600 text-white' : 'bg-gray-100 text-gray-700'
              }`}
            >
              {pickI18n(s.name_i18n, locale)}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
