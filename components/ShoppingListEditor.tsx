'use client';

import { useEffect, useMemo, useState, useTransition } from 'react';
import { useFormatter, useTranslations } from 'next-intl';
import { useLocaleOverride } from './I18nProvider';
import type { ShoppingItem, WeekIngredient } from '@/lib/supabase/types';
import { formatGrams, pickI18n } from '@/lib/format';
import { computeImpact, totalMacros } from '@/lib/nutrition';
import { breakdown, type PackBreakdown, type PackUnit } from '@/lib/packages';

type Row = ShoppingItem & {
  ist: number;
  planned: WeekIngredient | null;
  pack: PackBreakdown | null;
  key: string;
};

type Mode = 'plan' | 'shop';

type Props = {
  weekId: string;
  store: 'denns' | 'rewe';
  items: ShoppingItem[];
  ingredients: WeekIngredient[];
};

function rowKey(item: ShoppingItem): string {
  return `${item.ingredient_name_i18n.de}|${item.ingredient_name_i18n.en}`;
}

export function ShoppingListEditor({ weekId, store, items, ingredients }: Props) {
  const t = useTranslations('shopping');
  const tTracking = useTranslations('tracking');
  const { locale } = useLocaleOverride();
  const format = useFormatter();

  const rows = useMemo<Row[]>(
    () =>
      items.map((i) => ({
        ...i,
        ist: i.amount_g,
        planned:
          ingredients.find(
            (ing) =>
              ing.ingredient_name_i18n.de === i.ingredient_name_i18n.de &&
              ing.ingredient_name_i18n.en === i.ingredient_name_i18n.en,
          ) ?? null,
        pack: breakdown(store, i.ingredient_name_i18n, i.amount_g),
        key: rowKey(i),
      })),
    [items, ingredients, store],
  );

  const [istByKey, setIstByKey] = useState<Record<string, number>>(() =>
    Object.fromEntries(rows.map((r) => [r.key, r.ist])),
  );
  const [mode, setMode] = useState<Mode>('plan');
  const [checked, setChecked] = useState<Record<string, boolean>>({});
  const [pending, startTransition] = useTransition();
  const [saved, setSaved] = useState(false);

  const checkedStorageKey = `mealprep.shop.checked.${weekId}.${store}`;

  useEffect(() => {
    if (typeof window === 'undefined') return;
    try {
      const raw = window.localStorage.getItem(checkedStorageKey);
      if (raw) setChecked(JSON.parse(raw));
    } catch {
      // ignore
    }
  }, [checkedStorageKey]);

  useEffect(() => {
    if (typeof window === 'undefined') return;
    try {
      window.localStorage.setItem(checkedStorageKey, JSON.stringify(checked));
    } catch {
      // ignore
    }
  }, [checked, checkedStorageKey]);

  const totalImpact = useMemo(
    () =>
      rows.reduce(
        (acc, r) => {
          if (!r.planned) return acc;
          const ist = istByKey[r.key] ?? r.ist;
          const impact = computeImpact(r.planned, ist);
          acc.protein += impact.proteinDelta;
          acc.kcal += impact.kcalDelta;
          return acc;
        },
        { protein: 0, kcal: 0 },
      ),
    [rows, istByKey],
  );

  const grouped = useMemo(() => {
    const map = new Map<string, { label: string; rows: Row[] }>();
    for (const r of rows) {
      const label = pickI18n(r.category_i18n, locale);
      const k = `${r.category_i18n.de}|${r.category_i18n.en}`;
      if (!map.has(k)) map.set(k, { label, rows: [] });
      map.get(k)!.rows.push(r);
    }
    return Array.from(map.values()).sort((a, b) => a.label.localeCompare(b.label));
  }, [rows, locale]);

  const doneCount = rows.reduce((n, r) => n + (checked[r.key] ? 1 : 0), 0);

  function update(key: string, value: number) {
    setIstByKey((m) => ({ ...m, [key]: value }));
    setSaved(false);
  }

  function toggle(key: string) {
    setChecked((m) => ({ ...m, [key]: !m[key] }));
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
          istQuantities: istByKey,
        }),
      });
      if (res.ok) setSaved(true);
    });
  }

  return (
    <div className="card space-y-3">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <h2 className="text-lg font-semibold">
          {t('title')} · {t(store as 'denns' | 'rewe')}
        </h2>
        <div className="flex items-center gap-2">
          {mode === 'shop' && (
            <span className="pill-accent">
              {t('progress', { done: doneCount, total: rows.length })}
            </span>
          )}
          <ModeToggle mode={mode} onChange={setMode} labels={{ plan: t('mode.plan'), shop: t('mode.shop') }} />
        </div>
      </div>

      {mode === 'plan' ? (
        <PlanList
          rows={rows}
          istByKey={istByKey}
          onChange={update}
          t={t}
          format={format}
          locale={locale}
        />
      ) : (
        <ShopList
          groups={grouped}
          checked={checked}
          onToggle={toggle}
          t={t}
          locale={locale}
        />
      )}

      {mode === 'plan' && (
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
      )}
    </div>
  );
}

function ModeToggle({
  mode,
  onChange,
  labels,
}: {
  mode: Mode;
  onChange: (m: Mode) => void;
  labels: { plan: string; shop: string };
}) {
  return (
    <div className="inline-flex rounded-lg border border-gray-200 bg-gray-50 p-0.5 text-xs font-medium">
      {(['plan', 'shop'] as const).map((m) => (
        <button
          key={m}
          type="button"
          onClick={() => onChange(m)}
          aria-pressed={mode === m}
          className={
            'rounded-md px-3 py-1 transition ' +
            (mode === m ? 'bg-white text-gray-900 shadow-sm' : 'text-gray-500 hover:text-gray-700')
          }
        >
          {labels[m]}
        </button>
      ))}
    </div>
  );
}

function PlanList({
  rows,
  istByKey,
  onChange,
  t,
  format,
  locale,
}: {
  rows: Row[];
  istByKey: Record<string, number>;
  onChange: (key: string, value: number) => void;
  t: ReturnType<typeof useTranslations>;
  format: ReturnType<typeof useFormatter>;
  locale: 'en' | 'de';
}) {
  return (
    <ul className="divide-y divide-gray-100">
      {rows.map((row) => {
        const ist = istByKey[row.key] ?? row.ist;
        const impact = row.planned ? computeImpact(row.planned, ist) : null;
        return (
          <li key={row.key} className="grid grid-cols-1 gap-2 py-3 sm:grid-cols-12 sm:items-center">
            <div className="sm:col-span-4">
              <div className="font-medium text-gray-900">
                {pickI18n(row.ingredient_name_i18n, locale)}
              </div>
              <div className="text-xs text-gray-500">
                {pickI18n(row.category_i18n, locale)} ·{' '}
                {t('planned', { amount: formatGrams(row.amount_g, locale) })}
              </div>
            </div>
            <div className="sm:col-span-3">
              <input
                className="input"
                type="number"
                min={0}
                value={ist}
                onChange={(e) => onChange(row.key, Number(e.target.value || 0))}
                placeholder={t('actualPlaceholder')}
                aria-label={t('actual', { amount: '' })}
              />
            </div>
            <div className="sm:col-span-5 text-sm text-gray-600">
              {impact && Math.abs(impact.proteinDelta) > 0.5 && (
                <div className={impact.proteinDelta < 0 ? 'text-red-600' : 'text-brand-700'}>
                  {t('impact', {
                    delta:
                      (impact.proteinDelta > 0 ? '+' : '') +
                      format.number(impact.proteinDelta, { maximumFractionDigits: 1 }),
                  })}
                </div>
              )}
            </div>
          </li>
        );
      })}
    </ul>
  );
}

function ShopList({
  groups,
  checked,
  onToggle,
  t,
  locale,
}: {
  groups: { label: string; rows: Row[] }[];
  checked: Record<string, boolean>;
  onToggle: (key: string) => void;
  t: ReturnType<typeof useTranslations>;
  locale: 'en' | 'de';
}) {
  return (
    <div className="space-y-3">
      {groups.map((g) => (
        <section key={g.label}>
          <h3 className="mb-1 text-xs font-semibold uppercase tracking-wide text-gray-500">
            {g.label}
          </h3>
          <ul className="divide-y divide-gray-100">
            {g.rows.map((row) => {
              const isChecked = !!checked[row.key];
              return (
                <li key={row.key}>
                  <label className="flex cursor-pointer items-center gap-3 py-2">
                    <input
                      type="checkbox"
                      className="h-5 w-5 shrink-0 rounded border-gray-300 text-brand-600 focus:ring-brand-500"
                      checked={isChecked}
                      onChange={() => onToggle(row.key)}
                    />
                    <span className="min-w-0 flex-1">
                      <span
                        className={
                          'block truncate text-sm font-medium ' +
                          (isChecked ? 'text-gray-400 line-through' : 'text-gray-900')
                        }
                      >
                        {pickI18n(row.ingredient_name_i18n, locale)}
                      </span>
                    </span>
                    <span
                      className={
                        'shrink-0 text-right text-xs tabular-nums ' +
                        (isChecked ? 'text-gray-400' : 'text-gray-600')
                      }
                    >
                      <PackLabel row={row} t={t} locale={locale} />
                    </span>
                  </label>
                </li>
              );
            })}
          </ul>
        </section>
      ))}
    </div>
  );
}

function PackLabel({
  row,
  t,
  locale,
}: {
  row: Row;
  t: ReturnType<typeof useTranslations>;
  locale: 'en' | 'de';
}) {
  if (!row.pack) {
    return <span>{formatGrams(row.amount_g, locale)}</span>;
  }
  const unitLabel = t(`unit.${row.pack.unit}` as `unit.${PackUnit}`, { n: row.pack.count });
  return (
    <span>
      <span className="font-semibold text-gray-900">
        {row.pack.count}× {formatGrams(row.pack.size_g, locale)}
      </span>{' '}
      <span className="text-gray-500">
        {unitLabel} · {formatGrams(row.pack.total_g, locale)}
      </span>
    </span>
  );
}
