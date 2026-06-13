import { redirect } from 'next/navigation';
import { createSupabaseServer } from '@/lib/supabase/server';
import { NavBar } from '@/components/NavBar';
import { LanguageSelector } from '@/components/LanguageSelector';
import { getTranslations } from 'next-intl/server';

export default async function SettingsPage() {
  const supabase = await createSupabaseServer();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect('/login');

  const { data: profile } = await supabase
    .from('profiles')
    .select('*')
    .eq('id', user.id)
    .maybeSingle();

  const t = await getTranslations('settings');
  const tCommon = await getTranslations('common');

  return (
    <>
      <NavBar />
      <main className="mx-auto max-w-2xl px-4 py-6 space-y-6">
        <h1 className="text-2xl font-semibold text-gray-900">{t('title')}</h1>

        <section className="card">
          <h2 className="text-sm font-medium text-gray-500">{t('accountSection')}</h2>
          <div className="mt-2 text-sm">
            <div>{tCommon('loggedInAs', { name: user.email })}</div>
            <div className="text-gray-500">
              {tCommon('name')}: {profile?.name || '—'}
            </div>
          </div>
        </section>

        <section className="card">
          <h2 className="text-sm font-medium text-gray-500">{t('languageSection')}</h2>
          <div className="mt-2">
            <LanguageSelector />
          </div>
        </section>
      </main>
    </>
  );
}
