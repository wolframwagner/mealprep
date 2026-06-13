import { notFound, redirect } from 'next/navigation';
import { createSupabaseServer } from '@/lib/supabase/server';
import { getSaucesForWeek, getWeek, getIngredientsForWeek } from '@/lib/supabase/data';
import { NavBar } from '@/components/NavBar';
import { CookingGuide } from '@/components/CookingGuide';
import { getTranslations } from 'next-intl/server';

export default async function CookingWeekPage({
  params,
}: {
  params: { weekId: string };
}) {
  const { weekId } = params;
  const supabase = await createSupabaseServer();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect('/login');

  const [week, sauces, ingredients] = await Promise.all([
    getWeek(weekId),
    getSaucesForWeek(weekId),
    getIngredientsForWeek(weekId),
  ]);
  if (!week) notFound();
  const t = await getTranslations('cooking');

  return (
    <>
      <NavBar />
      <main className="mx-auto max-w-3xl px-4 py-6 space-y-4">
        <h1 className="text-2xl font-semibold text-gray-900">
          {t('title')} · W{week.week_number}
        </h1>
        <CookingGuide sauces={sauces} />
        <div className="card text-sm text-gray-700">
          <div className="font-medium text-gray-900">Ingredients</div>
          <ul className="mt-2 grid grid-cols-2 gap-1 text-sm">
            {ingredients.map((i) => (
              <li key={i.id}>
                {i.ingredient_name_i18n.de} · {i.amount_g} g
              </li>
            ))}
          </ul>
        </div>
      </main>
    </>
  );
}
