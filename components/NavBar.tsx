'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useTranslations } from 'next-intl';
import { LanguageSelector } from './LanguageSelector';
import { signOut } from '@/lib/supabase/auth';

const ITEMS = [
  { key: 'plan', href: '/' },
  { key: 'shopping', href: '/shopping' },
  { key: 'cooking', href: '/cooking' },
  { key: 'settings', href: '/settings' },
] as const;

export function NavBar() {
  const t = useTranslations('nav');
  const tCommon = useTranslations('common');
  const pathname = usePathname();

  return (
    <header className="sticky top-0 z-20 border-b border-gray-200 bg-white/90 backdrop-blur">
      <div className="mx-auto flex max-w-5xl items-center justify-between gap-3 px-4 py-3">
        <Link href="/" className="text-lg font-semibold text-brand-700">
          Mealprep
        </Link>
        <nav className="hidden gap-1 sm:flex">
          {ITEMS.map((it) => {
            const active = pathname === it.href || pathname.startsWith(it.href + '/');
            return (
              <Link
                key={it.key}
                href={it.href}
                className={`rounded-md px-3 py-1.5 text-sm font-medium ${
                  active ? 'bg-brand-50 text-brand-800' : 'text-gray-600 hover:bg-gray-50'
                }`}
              >
                {t(it.key as 'plan' | 'shopping' | 'cooking' | 'settings')}
              </Link>
            );
          })}
        </nav>
        <div className="flex items-center gap-2">
          <LanguageSelector />
          <form action={signOut}>
            <button className="btn-secondary" type="submit">
              {tCommon('logout')}
            </button>
          </form>
        </div>
      </div>
      <nav className="flex gap-1 overflow-x-auto px-2 pb-2 sm:hidden">
        {ITEMS.map((it) => {
          const active = pathname === it.href || pathname.startsWith(it.href + '/');
          return (
            <Link
              key={it.key}
              href={it.href}
              className={`whitespace-nowrap rounded-md px-3 py-1.5 text-sm ${
                active ? 'bg-brand-50 text-brand-800' : 'text-gray-600'
              }`}
            >
              {t(it.key as 'plan' | 'shopping' | 'cooking' | 'settings')}
            </Link>
          );
        })}
      </nav>
    </header>
  );
}
