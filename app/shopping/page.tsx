import { redirect } from 'next/navigation';
import { createSupabaseServer } from '@/lib/supabase/server';
import { getShoppingListsForWeek, listWeeks } from '@/lib/supabase/data';
import { NavBar } from '@/components/NavBar';
import Link from 'next/link';
import { getTranslations } from 'next-intl/server';

export default async function ShoppingIndexPage() {
  const supabase = await createSupabaseServer();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect('/login');

  const weeks = await listWeeks();
  const listsByWeek = await Promise.all(
    weeks.map(async (w) => ({
      week: w,
      lists: await getShoppingListsForWeek(w.id),
    })),
  );
  const t = await getTranslations('shopping');

  return (
    <>
      <NavBar />
      <main className="mx-auto max-w-5xl px-4 py-6 space-y-4">
        <h1 className="text-2xl font-semibold text-gray-900">{t('title')}</h1>
        <div className="grid gap-3 sm:grid-cols-2">
          {listsByWeek.map(({ week, lists }) => (
            <Link
              key={week.id}
              href={`/shopping/${week.id}`}
              className="card hover:border-brand-300"
            >
              <div className="text-xs uppercase tracking-wide text-gray-500">
                Week {week.week_number}
              </div>
              <div className="text-lg font-semibold">
                {week.theme_i18n.de} / {week.theme_i18n.en}
              </div>
              <div className="mt-2 flex gap-2 text-xs">
                {lists.map((l) => (
                  <span key={l.id} className="pill">
                    {l.store} · {l.items.length}
                  </span>
                ))}
              </div>
            </Link>
          ))}
        </div>
      </main>
    </>
  );
}
