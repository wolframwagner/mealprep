'use client';

import Link from 'next/link';
import { useFormatter, useTranslations } from 'next-intl';
import type { Week } from '@/lib/supabase/types';
import { pickI18n } from '@/lib/format';
import { useLocaleOverride } from './I18nProvider';

export function WeekCard({ week, active }: { week: Week; active?: boolean }) {
  const t = useTranslations('weeks');
  const { locale } = useLocaleOverride();
  const format = useFormatter();

  return (
    <div className="card flex flex-col gap-3">
      <div className="flex items-start justify-between gap-2">
        <div>
          <div className="text-xs uppercase tracking-wide text-gray-500">
            {t('weekLabel', { n: week.week_number })}
          </div>
          <h3 className="text-lg font-semibold text-gray-900">
            {pickI18n(week.theme_i18n, locale)}
          </h3>
        </div>
        {active && <span className="pill-accent">{t('currentWeek')}</span>}
      </div>

      <div className="grid grid-cols-2 gap-2 text-sm">
        <div>
          <div className="text-gray-500">{t('protein')}</div>
          <div className="font-medium">{pickI18n(week.protein_base_i18n, locale)}</div>
        </div>
        <div>
          <div className="text-gray-500">{t('carbs')}</div>
          <div className="font-medium">{pickI18n(week.carb_base_i18n, locale)}</div>
        </div>
      </div>

      <div className="flex flex-wrap gap-2 text-xs">
        <span className="pill">{t('proteinPerDay', { g: format.number(week.protein_g) })}</span>
        <span className="pill">{t('kcalPerDay', { kcal: format.number(week.kcal) })}</span>
        <span className="pill">{t('budget', { amount: format.number(week.budget_eur, { minimumFractionDigits: 2, maximumFractionDigits: 2 }) })}</span>
      </div>

      <div className="flex gap-2 pt-1">
        <Link href={`/shopping/${week.id}`} className="btn-secondary flex-1 text-center">
          {t('startWeek')}
        </Link>
        <Link href={`/cooking/${week.id}`} className="btn-primary flex-1 text-center">
          {t('weekLabel', { n: week.week_number })}
        </Link>
      </div>
    </div>
  );
}
