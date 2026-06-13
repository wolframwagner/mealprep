import { redirect } from 'next/navigation';
import { createSupabaseServer } from '@/lib/supabase/server';
import { listWeeks } from '@/lib/supabase/data';
import { getLocale, getTranslations } from 'next-intl/server';
import { NavBar } from '@/components/NavBar';
import { WeekCard } from '@/components/WeekCard';
import { LanguagePrompt } from '@/components/LanguagePrompt';
import { OfflineBanner } from '@/components/OfflineBanner';

export default async function HomePage() {
  const supabase = await createSupabaseServer();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect('/login');

  const [weeks, t, locale] = await Promise.all([
    listWeeks(),
    getTranslations('weeks'),
    getLocale(),
  ]);

  return (
    <>
      <NavBar />
      <OfflineBanner />
      <main className="mx-auto max-w-5xl px-4 py-6">
        <div className="mb-6">
          <h1 className="text-2xl font-semibold text-gray-900">{t('title')}</h1>
          <p className="text-sm text-gray-600">{t('subtitle')}</p>
        </div>
        {weeks.length === 0 ? (
          <div className="card text-sm text-gray-600">
            {t('noActiveWeek')} ·{' '}
            <code className="rounded bg-gray-100 px-1">npm run db:seed</code>
          </div>
        ) : (
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {weeks.map((w) => (
              <WeekCard key={w.id} week={w} />
            ))}
          </div>
        )}
      </main>
      <LanguagePrompt />
    </>
  );
}
