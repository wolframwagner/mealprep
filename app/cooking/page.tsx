import { redirect } from 'next/navigation';
import { createSupabaseServer } from '@/lib/supabase/server';
import { listWeeks } from '@/lib/supabase/data';
import { NavBar } from '@/components/NavBar';
import Link from 'next/link';
import { getTranslations } from 'next-intl/server';

export default async function CookingIndexPage() {
  const supabase = await createSupabaseServer();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect('/login');

  const weeks = await listWeeks();
  const t = await getTranslations('cooking');

  return (
    <>
      <NavBar />
      <main className="mx-auto max-w-3xl px-4 py-6 space-y-4">
        <h1 className="text-2xl font-semibold text-gray-900">{t('title')}</h1>
        <div className="grid gap-3 sm:grid-cols-2">
          {weeks.map((w) => (
            <Link key={w.id} href={`/cooking/${w.id}`} className="card hover:border-brand-300">
              <div className="text-xs uppercase tracking-wide text-gray-500">
                Week {w.week_number}
              </div>
              <div className="text-lg font-semibold">
                {w.theme_i18n.de} / {w.theme_i18n.en}
              </div>
              <div className="mt-1 text-sm text-gray-600">
                {w.protein_base_i18n.de} · {w.carb_base_i18n.de}
              </div>
            </Link>
          ))}
        </div>
      </main>
    </>
  );
}
