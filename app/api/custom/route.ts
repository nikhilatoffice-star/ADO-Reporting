import { NextRequest, NextResponse } from 'next/server';
import { Cache } from '@/lib/cache';
import { supabase } from '@/lib/supabase';

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { roadmapItems, developerPerformance } = body;

    // We still keep roadmapItems in local Cache for now, but dev performance goes to Supabase
    const currentCustomizations = Cache.getCustomizations();

    if (roadmapItems !== undefined) {
      currentCustomizations.roadmapItems = roadmapItems;
      Cache.saveCustomizations(currentCustomizations);
    }

    if (developerPerformance !== undefined) {
      // Upsert into Supabase
      const devName = Object.keys(developerPerformance)[0];
      const overrides = developerPerformance[devName];
      
      const { error } = await supabase.from('dev_performance_overrides').upsert({
        dev_name: devName,
        role: overrides.role,
        dev_type: overrides.type,
        team: overrides.team,
        leadership_rating: overrides.leadershipRating,
        tech_competence: overrides.techRating,
        notes: overrides.notes,
        base_tickets: overrides.baseTickets,
        base_usp: overrides.baseUsp,
        base_sprints: overrides.baseSprints
      }, { onConflict: 'dev_name' });

      if (error) {
        console.error("Supabase override upsert error:", error);
      }
    }

    return NextResponse.json({ success: true });
  } catch (err: any) {
    console.error('Error saving customizations:', err);
    return NextResponse.json({ success: false, error: err.message }, { status: 500 });
  }
}

export async function GET() {
  try {
    const customizations = Cache.getCustomizations();
    
    // Fetch dev overrides from Supabase
    const { data: dbOverrides, error } = await supabase.from('dev_performance_overrides').select('*');
    if (dbOverrides) {
      customizations.developerPerformance = {};
      dbOverrides.forEach(row => {
        customizations.developerPerformance![row.dev_name] = {
          role: row.role,
          type: row.dev_type,
          team: row.team,
          leadershipRating: row.leadership_rating,
          techRating: row.tech_competence,
          notes: row.notes,
          baseTickets: row.base_tickets || 0,
          baseUsp: row.base_usp || 0,
          baseSprints: row.base_sprints || 0
        };
      });
    }

    return NextResponse.json({ success: true, customizations });
  } catch (err: any) {
    return NextResponse.json({ success: false, error: err.message }, { status: 500 });
  }
}
