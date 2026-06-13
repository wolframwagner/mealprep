/**
 * Seeds the Supabase database with the 6 weekly meal plans.
 *
 *   npm run db:seed
 *
 * Requires:
 *   - NEXT_PUBLIC_SUPABASE_URL
 *   - SUPABASE_SERVICE_ROLE_KEY
 */
import { createClient } from '@supabase/supabase-js';
import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';

// Manually load .env.local so the script runs without `dotenv`.
try {
  const envFile = readFileSync(resolve(__dirname, '..', '.env.local'), 'utf8');
  for (const line of envFile.split('\n')) {
    const m = line.match(/^([A-Z0-9_]+)\s*=\s*"?([^"\n]*)"?$/);
    if (m && !process.env[m[1]]) process.env[m[1]] = m[2];
  }
} catch {
  // .env.local is optional
}

const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
const key = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!url || !key) {
  console.error('Missing NEXT_PUBLIC_SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY');
  process.exit(1);
}

const supabase = createClient(url, key, {
  auth: { autoRefreshToken: false, persistSession: false },
});

type Ingredient = {
  name: { de: string; en: string };
  category: { de: string; en: string };
  amount_g: number;
  protein_per_100g: number;
  kcal_per_100g: number;
  fat_per_100g: number;
  carbs_per_100g: number;
};

type Sauce = {
  name: { de: string; en: string };
  day_of_week: number;
  recipe: { de: string[]; en: string[] };
};

type Week = {
  week: string;
  theme: { de: string; en: string };
  protein_base: { de: string; en: string };
  carb_base: { de: string; en: string };
  protein_g: number;
  kcal: number;
  budget_eur: number;
  ingredients: Ingredient[];
  sauces: Sauce[];
};

const STORES = ['denns', 'rewe'] as const;

function splitForStore(items: Ingredient[]) {
  // Simple split rule for demo: dry goods / specialty → denns, fresh produce → rewe
  const denns = items.filter((i) =>
    /tofu|seitan|soja|tahini|edamame|mie|mirin|sriracha|reisessig/i.test(
      i.name.de + i.name.en,
    ),
  );
  const rewe = items.filter((i) => !denns.includes(i));
  return { denns, rewe };
}

async function main() {
  const file = resolve(__dirname, '..', 'AGENTS', 'mealprep_data.full.json');
  const weeks: Week[] = JSON.parse(readFileSync(file, 'utf8'));

  // Wipe existing data (idempotent reseed)
  await supabase.from('shopping_lists').delete().neq('id', '00000000-0000-0000-0000-000000000000');
  await supabase.from('sauces').delete().neq('id', '00000000-0000-0000-0000-000000000000');
  await supabase.from('week_ingredients').delete().neq('id', '00000000-0000-0000-0000-000000000000');
  await supabase.from('weeks').delete().neq('id', '00000000-0000-0000-0000-000000000000');

  for (const w of weeks) {
    const weekNumber = parseInt(w.week.replace('W', ''), 10);
    const { data: weekRow, error: weekErr } = await supabase
      .from('weeks')
      .insert({
        week_number: weekNumber,
        theme_i18n: w.theme,
        protein_base_i18n: w.protein_base,
        carb_base_i18n: w.carb_base,
        protein_g: w.protein_g,
        kcal: w.kcal,
        budget_eur: w.budget_eur,
      })
      .select('id')
      .single();

    if (weekErr) throw weekErr;
    const weekId = weekRow.id as string;

    const { error: ingErr } = await supabase.from('week_ingredients').insert(
      w.ingredients.map((i) => ({
        week_id: weekId,
        ingredient_name_i18n: i.name,
        category_i18n: i.category,
        amount_g: i.amount_g,
        protein_per_100g: i.protein_per_100g,
        kcal_per_100g: i.kcal_per_100g,
        fat_per_100g: i.fat_per_100g,
        carbs_per_100g: i.carbs_per_100g,
      })),
    );
    if (ingErr) throw ingErr;

    const { error: sauceErr } = await supabase.from('sauces').insert(
      w.sauces.map((s) => ({
        week_id: weekId,
        name_i18n: s.name,
        recipe: s.recipe,
        day_of_week: s.day_of_week,
      })),
    );
    if (sauceErr) throw sauceErr;

    const { denns, rewe } = splitForStore(w.ingredients);
    const lists = [
      { store: 'denns', items: denns },
      { store: 'rewe', items: rewe },
    ].filter((l) => l.items.length > 0);

    for (const l of lists) {
      const { error: listErr } = await supabase.from('shopping_lists').insert({
        week_id: weekId,
        store: l.store,
        items: l.items.map((i) => ({
          ingredient_name_i18n: i.name,
          category_i18n: i.category,
          amount_g: i.amount_g,
        })),
      });
      if (listErr) throw listErr;
    }

    console.log(`Seeded ${w.week} (${w.ingredients.length} ingredients, ${w.sauces.length} sauces)`);
  }

  console.log('Done.');
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
