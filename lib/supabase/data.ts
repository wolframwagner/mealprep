/**
 * Domain-level data accessors. The rest of the app should only go through these
 * helpers so the API layer can be reused by a Flutter client later.
 */
import { createSupabaseServer } from './server';
import type {
  Sauce,
  ShoppingList,
  UserProgress,
  Week,
  WeekIngredient,
} from './types';

export async function listWeeks(): Promise<Week[]> {
  const supabase = await createSupabaseServer();
  const { data, error } = await supabase
    .from('weeks')
    .select('*')
    .order('week_number', { ascending: true });
  if (error) throw error;
  return data ?? [];
}

export async function getWeek(weekId: string): Promise<Week | null> {
  const supabase = await createSupabaseServer();
  const { data, error } = await supabase
    .from('weeks')
    .select('*')
    .eq('id', weekId)
    .maybeSingle();
  if (error) throw error;
  return data;
}

export async function getIngredientsForWeek(weekId: string): Promise<WeekIngredient[]> {
  const supabase = await createSupabaseServer();
  const { data, error } = await supabase
    .from('week_ingredients')
    .select('*')
    .eq('week_id', weekId);
  if (error) throw error;
  return data ?? [];
}

export async function getSaucesForWeek(weekId: string): Promise<Sauce[]> {
  const supabase = await createSupabaseServer();
  const { data, error } = await supabase
    .from('sauces')
    .select('*')
    .eq('week_id', weekId)
    .order('day_of_week', { ascending: true });
  if (error) throw error;
  return data ?? [];
}

export async function getShoppingListsForWeek(weekId: string): Promise<ShoppingList[]> {
  const supabase = await createSupabaseServer();
  const { data, error } = await supabase
    .from('shopping_lists')
    .select('*')
    .eq('week_id', weekId);
  if (error) throw error;
  return data ?? [];
}

export async function getProgressForWeek(
  userId: string,
  weekId: string,
): Promise<UserProgress[]> {
  const supabase = await createSupabaseServer();
  const { data, error } = await supabase
    .from('user_progress')
    .select('*')
    .eq('user_id', userId)
    .eq('week_id', weekId);
  if (error) throw error;
  return data ?? [];
}

export async function upsertProgress(input: {
  userId: string;
  weekId: string;
  dayOffset: number;
  completed_ingredients?: Record<string, boolean>;
  ist_quantities?: Record<string, number>;
}): Promise<UserProgress> {
  const supabase = await createSupabaseServer();
  const { data, error } = await supabase
    .from('user_progress')
    .upsert(
      {
        user_id: input.userId,
        week_id: input.weekId,
        day_offset: input.dayOffset,
        completed_ingredients: input.completed_ingredients ?? {},
        ist_quantities: input.ist_quantities ?? {},
        updated_at: new Date().toISOString(),
      },
      { onConflict: 'user_id,week_id,day_offset' },
    )
    .select('*')
    .single();
  if (error) throw error;
  return data;
}
