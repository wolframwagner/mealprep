import { NextResponse } from 'next/server';
import { z } from 'zod';
import { getShoppingListsForWeek, getIngredientsForWeek } from '@/lib/supabase/data';
import { totalMacros } from '@/lib/nutrition';

const Body = z.object({
  weekId: z.string().uuid(),
  store: z.enum(['denns', 'rewe']).optional(),
});

export async function POST(req: Request) {
  const json = await req.json().catch(() => ({}));
  const parsed = Body.safeParse(json);
  if (!parsed.success) {
    return NextResponse.json({ error: 'invalid_payload' }, { status: 400 });
  }

  const [lists, ingredients] = await Promise.all([
    getShoppingListsForWeek(parsed.data.weekId),
    getIngredientsForWeek(parsed.data.weekId),
  ]);
  const filtered = parsed.data.store
    ? lists.filter((l) => l.store === parsed.data.store)
    : lists;

  // Attach the SOLL ingredient metadata to each list item so the client can
  // compute the difference report without a second round-trip.
  const enriched = filtered.map((list) => ({
    ...list,
    items: list.items.map((item) => ({
      ...item,
      planned:
        ingredients.find(
          (i) =>
            i.ingredient_name_i18n.de === item.ingredient_name_i18n.de &&
            i.ingredient_name_i18n.en === item.ingredient_name_i18n.en,
        ) ?? null,
    })),
  }));

  return NextResponse.json({
    lists: enriched,
    macros: totalMacros(ingredients),
  });
}
