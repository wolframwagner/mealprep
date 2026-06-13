import { NextResponse } from 'next/server';
import { listWeeks } from '@/lib/supabase/data';

export async function GET() {
  const weeks = await listWeeks();
  return NextResponse.json({ weeks });
}
