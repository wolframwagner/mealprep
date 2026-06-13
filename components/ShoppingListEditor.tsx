'use client';

import { useMemo, useState, useTransition } from 'react';
import { useFormatter, useTranslations } from 'next-intl';
import { useLocaleOverride } from './I18nProvider';
import type { ShoppingItem, WeekIngredient } from '@/lib/supabase/types';
import { pickI18n } from '@/lib/format';
import { computeImpact, totalMacros } from '@/lib/nutrition';

type Row = ShoppingItem & { ist: number; planned: WeekIngredient | null };

type Props = {
  weekId: string;
  store: 'denns' | 'rewe';
  items: ShoppingItem[];
  ingredients: WeekIngredient[];
};

export function ShoppingListEditor({ weekId, store, items, ingredients }: Props) {
  const t = useTranslations('shopping');
  const tTracking = useTranslations('tracking');
  const { locale } = useLocaleOverride();
  const format = useFormatter();
  const [rows, setRows] = useState<Row[]>(() =>
    items.map((i) => ({
      ...i,
      ist: i.amount_g,
      planned: ingredients.find(
        (ing) =>
          ing.ingredient_name_i18n.de === i.ingredient_name_i18n.de &&
          ing.ingredient_name_i18n.en === i.ingredient_name_i18n.en,
      ) ?? null,
    })),
  );
  const [pending, startTransition] = useTransition();
  const [saved, setSaved] = useState(false);

  const totalImpact = useMemo(
    () =>
      rows.reduce(
        (acc, r) => {
          if (!r.planned) return acc;
          const impact = computeImpact(r.planned, r.ist);
          acc.protein += impact.proteinDelta;
          acc.kcal += impact.kcalDelta;
          return acc;
        },
        { protein: 0, kcal: 0 },
      ),
    [rows],
  );

  function update(index: number, value: number) {
    setRows((rs) => rs.map((r, i) => (i === index ? { ...r, ist: value } : r)));
    setSaved(false);
  }

  function save() {
    setSaved(false);
    startTransition(async () => {
      const res = await fetch('/api/progress', {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({
          weekId,
          dayOffset: 0,
          istQuantities: Object.fromEntries(
            rows.map((r) => [
              `${r.ingredient_name_i18n.de}|${r.ingredient_name_i18n.en}`,
              r.ist,
            ]),
          ),
        }),
      });
      if (res.ok) setSaved(true);
    });
  }

  return (
    <div className="card space-y-3">
      <div className="flex items-center justify-between">
        <h2 className="text-lg font-semibold">
          {t('title')} · {t(store as 'denns' | 'rewe')}
        </h2>
        <span className="pill">{rows.length} {rows.length === 1 ? 'item' : 'items'}</span>
      </div>

      <ul className="divide-y divide-gray-100">
        {rows.map((row, idx) => {
          const impact = row.planned
            ? computeImpact(row.planned, row.ist)
            : null;
          return (
            <li key={idx} className="grid grid-cols-1 gap-2 py-3 sm:grid-cols-12 sm:items-center">
              <div className="sm:col-span-4">
                <div className="font-medium text-gray-900">
                  {pickI18n(row.ingredient_name_i18n, locale)}
                </div>
                <div className="text-xs text-gray-500">
                  {pickI18n(row.category_i18n, locale)} ·{' '}
                  {t('planned', { amount: format.number(row.amount_g) + ' g' })}
                </div>
              </div>
              <div className="sm:col-span-3">
                <input
                  className="input"
                  type="number"
                  min={0}
                  value={row.ist}
                  onChange={(e) => update(idx, Number(e.target.value || 0))}
                  placeholder={t('actualPlaceholder')}
                  aria-label={t('actual', { amount: '' })}
                />
              </div>
              <div className="sm:col-span-5 text-sm text-gray-600">
                {impact && Math.abs(impact.proteinDelta) > 0.5 && (
                  <div className={impact.proteinDelta < 0 ? 'text-red-600' : 'text-brand-700'}>
                    {t('impact', { delta: (impact.proteinDelta > 0 ? '+' : '') + format.number(impact.proteinDelta, { maximumFractionDigits: 1 }) })}
                  </div>
                )}
              </div>
            </li>
          );
        })}
      </ul>

      <div className="flex flex-col gap-2 border-t border-gray-100 pt-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="text-sm text-gray-700">
          {tTracking('summary', {
            protein: format.number(Math.round(totalMacros(ingredients).protein + totalImpact.protein)),
            kcal: format.number(Math.round(totalMacros(ingredients).kcal + totalImpact.kcal)),
          })}
        </div>
        <div className="flex items-center gap-2">
          {saved && <span className="text-sm text-brand-700">{t('saved')}</span>}
          <button onClick={save} className="btn-primary" disabled={pending}>
            {t('saveAll')}
          </button>
        </div>
      </div>
    </div>
  );
}
