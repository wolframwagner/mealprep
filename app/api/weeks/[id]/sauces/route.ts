import { NextResponse } from 'next/server';
import { getSaucesForWeek } from '@/lib/supabase/data';

export async function GET(_req: Request, { params }: { params: { id: string } }) {
  const sauces = await getSaucesForWeek(params.id);
  return NextResponse.json({ sauces });
}
