import { NextResponse } from 'next/server';
import { getIngredientsForWeek } from '@/lib/supabase/data';

export async function GET(_req: Request, { params }: { params: { id: string } }) {
  const ingredients = await getIngredientsForWeek(params.id);
  return NextResponse.json({ ingredients });
}
