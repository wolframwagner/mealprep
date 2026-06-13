import { notFound, redirect } from 'next/navigation';
import { createSupabaseServer } from '@/lib/supabase/server';
import {
  getIngredientsForWeek,
  getShoppingListsForWeek,
  getWeek,
} from '@/lib/supabase/data';
import { NavBar } from '@/components/NavBar';
import { ShoppingListEditor } from '@/components/ShoppingListEditor';
import { getTranslations } from 'next-intl/server';

export default async function ShoppingWeekPage({
  params,
}: {
  params: { weekId: string };
}) {
  const { weekId } = params;
  const supabase = await createSupabaseServer();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect('/login');

  const [week, lists, ingredients] = await Promise.all([
    getWeek(weekId),
    getShoppingListsForWeek(weekId),
    getIngredientsForWeek(weekId),
  ]);
  if (!week) notFound();

  const t = await getTranslations('shopping');

  return (
    <>
      <NavBar />
      <main className="mx-auto max-w-3xl px-4 py-6 space-y-4">
        <h1 className="text-2xl font-semibold text-gray-900">
          {t('title')} · W{week.week_number}
        </h1>
        {lists.length === 0 ? (
          <div className="card text-sm text-gray-600">{t('title')}: —</div>
        ) : (
          lists.map((list) => (
            <ShoppingListEditor
              key={list.id}
              weekId={week.id}
              store={list.store}
              items={list.items}
              ingredients={ingredients}
            />
          ))
        )}
      </main>
    </>
  );
}
