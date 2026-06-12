import { NextRequest, NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';
import { RoadmapItem } from '@/lib/types';

export async function GET() {
  try {
    const { data, error } = await supabase.from('roadmap_items').select('*');
    if (error) throw error;

    const items: RoadmapItem[] = data.map((d: any) => ({
      id: d.id,
      title: d.title,
      type: d.type,
      state: d.state,
      team: d.team,
      startSprint: d.start_sprint,
      endSprint: d.end_sprint,
      progress: d.progress
    }));

    return NextResponse.json({ success: true, items });
  } catch (err: any) {
    return NextResponse.json({ success: false, error: err.message }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { items } = body as { items: RoadmapItem[] };

    if (!items || !Array.isArray(items)) {
      throw new Error("Invalid payload");
    }

    // Convert to DB format
    const dbPayload = items.map(i => ({
      id: i.id,
      title: i.title,
      type: i.type,
      state: i.state,
      team: i.team,
      start_sprint: i.startSprint,
      end_sprint: i.endSprint,
      progress: i.progress || 0
    }));

    const { error } = await supabase.from('roadmap_items').upsert(dbPayload);
    if (error) throw error;

    return NextResponse.json({ success: true });
  } catch (err: any) {
    console.error('Error saving roadmap:', err);
    return NextResponse.json({ success: false, error: err.message }, { status: 500 });
  }
}

export async function DELETE(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const id = searchParams.get('id');
    
    if (!id) {
      throw new Error("Missing id parameter");
    }

    const { error } = await supabase.from('roadmap_items').delete().eq('id', id);
    if (error) throw error;

    return NextResponse.json({ success: true });
  } catch (err: any) {
    console.error('Error deleting roadmap item:', err);
    return NextResponse.json({ success: false, error: err.message }, { status: 500 });
  }
}
