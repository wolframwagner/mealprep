import { NextResponse } from 'next/server';
import { z } from 'zod';
import { createSupabaseServer } from '@/lib/supabase/server';
import { upsertProgress } from '@/lib/supabase/data';

const Body = z.object({
  weekId: z.string().uuid(),
  dayOffset: z.number().int().min(0).max(6),
  istQuantities: z.record(z.string(), z.number().int().nonnegative()).optional(),
  completedIngredients: z.record(z.string(), z.boolean()).optional(),
});

export async function POST(req: Request) {
  const supabase = await createSupabaseServer();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) {
    return NextResponse.json({ error: 'unauthorized' }, { status: 401 });
  }

  const json = await req.json().catch(() => ({}));
  const parsed = Body.safeParse(json);
  if (!parsed.success) {
    return NextResponse.json({ error: 'invalid_payload' }, { status: 400 });
  }

  const updated = await upsertProgress({
    userId: user.id,
    weekId: parsed.data.weekId,
    dayOffset: parsed.data.dayOffset,
    completed_ingredients: parsed.data.completedIngredients,
    ist_quantities: parsed.data.istQuantities,
  });
  return NextResponse.json({ progress: updated });
}

export async function GET(req: Request) {
  const supabase = await createSupabaseServer();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ progress: [] });

  const { searchParams } = new URL(req.url);
  const weekId = searchParams.get('weekId');
  if (!weekId) return NextResponse.json({ error: 'missing_week' }, { status: 400 });

  const { data, error } = await supabase
    .from('user_progress')
    .select('*')
    .eq('user_id', user.id)
    .eq('week_id', weekId);
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ progress: data ?? [] });
}
