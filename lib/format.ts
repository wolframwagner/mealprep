import type { I18nString } from './supabase/types';
import type { Locale } from '@/i18n/config';

/**
 * Picks the active locale from an i18n JSONB field, falling back to `de` (the
 * original content language) and then to `en` as a last resort.
 */
export function pickI18n(field: I18nString | null | undefined, locale: Locale): string {
  if (!field) return '';
  return field[locale] ?? field.de ?? field.en ?? '';
}

export function formatNumber(value: number, locale: Locale): string {
  return new Intl.NumberFormat(locale === 'de' ? 'de-DE' : 'en-US').format(value);
}

export function formatCurrencyEUR(value: number, locale: Locale): string {
  return new Intl.NumberFormat(locale === 'de' ? 'de-DE' : 'en-US', {
    style: 'currency',
    currency: 'EUR',
  }).format(value);
}

export function formatDate(date: Date | string, locale: Locale): string {
  const d = typeof date === 'string' ? new Date(date) : date;
  return new Intl.DateTimeFormat(locale === 'de' ? 'de-DE' : 'en-US', {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  }).format(d);
}

export function formatGrams(value: number, locale: Locale): string {
  if (value >= 1000) {
    return `${formatNumber(value / 1000, locale)} kg`;
  }
  return `${formatNumber(value, locale)} g`;
}
