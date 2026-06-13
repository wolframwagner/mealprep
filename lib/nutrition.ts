import type { WeekIngredient } from './supabase/types';

export type MacroImpact = {
  proteinDelta: number;
  kcalDelta: number;
  fatDelta: number;
  carbsDelta: number;
};

function round1(n: number) {
  return Math.round(n * 10) / 10;
}

/**
 * Compute the macro deviation between the SOLL (planned) ingredient and the
 * IST (actual) quantity. If `substitutedWith` is provided, the IST amount uses
 * the substituted ingredient's per-100g values.
 */
export function computeImpact(
  planned: WeekIngredient,
  istGrams: number,
  substitutedWith: WeekIngredient | null = null,
): MacroImpact {
  const ref = substitutedWith ?? planned;
  const factor = istGrams / 100;
  const plannedFactor = planned.amount_g / 100;
  return {
    proteinDelta: round1(ref.protein_per_100g * factor - planned.protein_per_100g * plannedFactor),
    kcalDelta: round1(ref.kcal_per_100g * factor - planned.kcal_per_100g * plannedFactor),
    fatDelta: round1(ref.fat_per_100g * factor - planned.fat_per_100g * plannedFactor),
    carbsDelta: round1(ref.carbs_per_100g * factor - planned.carbs_per_100g * plannedFactor),
  };
}

export function totalMacros(ingredients: WeekIngredient[]) {
  return ingredients.reduce(
    (acc, i) => {
      const f = i.amount_g / 100;
      return {
        protein: acc.protein + i.protein_per_100g * f,
        kcal: acc.kcal + i.kcal_per_100g * f,
        fat: acc.fat + i.fat_per_100g * f,
        carbs: acc.carbs + i.carbs_per_100g * f,
      };
    },
    { protein: 0, kcal: 0, fat: 0, carbs: 0 },
  );
}
