export const dynamic = 'force-dynamic';
import { NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';

export async function GET() {
  const { data, error } = await supabase.from('ado_work_items').select('team_name, iteration_name, state, title').limit(20);
  return NextResponse.json({ data, error });
}
