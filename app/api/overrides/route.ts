export const dynamic = 'force-dynamic';
import { NextRequest, NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { overrides } = body; // Array of override objects

    if (!Array.isArray(overrides) || overrides.length === 0) {
      return NextResponse.json({ error: 'No overrides provided' }, { status: 400 });
    }

    // Format for Supabase upsert
    const upsertData = overrides.map((o: any) => ({
      work_item_id: o.work_item_id,
      notes: o.notes || null,
      dev_1: o.dev_1 || null,
      dev_2: o.dev_2 || null,
      dev_hours: o.dev_hours || {}
    }));

    const { error } = await supabase
      .from('dev_performance_overrides')
      .upsert(upsertData, { onConflict: 'work_item_id' });

    if (error) {
      throw new Error(`Supabase Upsert Error: ${error.message}`);
    }

    return NextResponse.json({ success: true, message: 'Overrides saved successfully' });
  } catch (error: any) {
    console.error('API Overrides Error:', error);
    return NextResponse.json({ error: error.message || 'Failed to save overrides' }, { status: 500 });
  }
}

export async function GET(req: NextRequest) {
  try {
    const { data, error } = await supabase
      .from('dev_performance_overrides')
      .select('*');

    if (error) {
      throw new Error(`Supabase Select Error: ${error.message}`);
    }

    // Convert array to a map for O(1) lookup on the client
    const overridesMap: Record<string, any> = {};
    if (data) {
      data.forEach(row => {
        overridesMap[row.work_item_id] = {
          notes: row.notes,
          dev_1: row.dev_1,
          dev_2: row.dev_2,
          dev_hours: row.dev_hours || {}
        };
      });
    }

    return NextResponse.json({ success: true, overrides: overridesMap });
  } catch (error: any) {
    console.error('API Overrides Error:', error);
    return NextResponse.json({ error: error.message || 'Failed to fetch overrides' }, { status: 500 });
  }
}
