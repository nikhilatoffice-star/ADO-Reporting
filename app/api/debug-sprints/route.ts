export const dynamic = 'force-dynamic';
import { NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';

export async function GET() {
  let dbAllParents: any[] = [];
  let fetchStart = 0;
  const fetchStep = 1000;
  let keepFetching = true;

  while (keepFetching) {
    const { data } = await supabase
      .from('ado_work_items')
      .select('iteration_name, work_item_type, state, story_points, original_estimate, team_name, work_item_id')
      .in('work_item_type', ['User Story', 'Bug', 'Feature', 'Epic'])
      .in('state', ['Closed', 'Ready for Prod', 'Resolved', 'Done', 'Completed', 'closed', 'ready for prod', 'resolved', 'done', 'completed'])
      .ilike('iteration_name', '%Sprint 12%')
      .order('work_item_id', { ascending: false })
      .range(fetchStart, fetchStart + fetchStep - 1);

    if (data && data.length > 0) {
      dbAllParents.push(...data);
      if (data.length < fetchStep) {
        keepFetching = false;
      } else {
        fetchStart += fetchStep;
      }
    } else {
      keepFetching = false;
    }
  }

  // Count by iteration name
  const iterCounts: Record<string, number> = {};
  dbAllParents.forEach(i => {
    iterCounts[i.iteration_name] = (iterCounts[i.iteration_name] || 0) + 1;
  });

  return NextResponse.json({ total: dbAllParents.length, iterations: iterCounts });
}
