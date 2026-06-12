import { NextRequest, NextResponse } from 'next/server';
import { fetchOData } from '@/lib/ado-client';
import { generateSprintRecap } from '@/lib/ai-summary';
import { Cache } from '@/lib/cache';
import { ADOWorkItem, SprintData, TeamMember } from '@/lib/types';
import { TEAM_MEMBERS } from '@/lib/team-config';
import { QUERIES } from '@/lib/queries';
import { supabase } from '@/lib/supabase';

// Helper to compute SprintData from raw tickets
async function getSprintData(sprintName: string): Promise<SprintData> {
  let tickets: ADOWorkItem[] = [];
  try {
    tickets = await fetchOData<ADOWorkItem>(QUERIES.sprintDetails(sprintName));
  } catch (err) {
    console.error("Failed to fetch tickets in getSprintData:", err);
  }

  // Load team configurations (merged with customization overrides)
  const { data: dbOverrides } = await supabase.from('dev_performance_overrides').select('*');
  const devCustomMap: Record<string, any> = {};
  if (dbOverrides) {
    dbOverrides.forEach(row => {
      devCustomMap[row.dev_name] = {
        role: row.role,
        type: row.dev_type,
        team: row.team,
        leadershipRating: row.leadership_rating,
        techRating: row.tech_competence,
        notes: row.notes
      };
    });
  }

  const teamMembers: TeamMember[] = TEAM_MEMBERS.map(dev => {
    const overrides = devCustomMap[dev.name] || {};
    return { ...dev, ...overrides };
  });

  const sprints = await fetchOData<any>("Iterations?$orderby=StartDate asc");
  const sprintObj = sprints.find((s: any) => s.IterationName === sprintName) || sprints[sprints.length - 1];
  const releaseDate = sprintObj?.EndDate ? new Date(sprintObj.EndDate).toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' }) : 'Unknown Date';

  // Calculate team specific tickets and USP
  const findabilityTicketsList = tickets.filter(t => (t.Teams?.[0]?.TeamName || '').toLowerCase().includes('findability'));
  const findabilityTickets = findabilityTicketsList.length;
  const findabilityUSP = findabilityTicketsList.reduce((sum, t) => sum + (t.StoryPoints || 0), 0);

  const breakfixTicketsList = tickets.filter(t => (t.Teams?.[0]?.TeamName || '').toLowerCase().includes('breakfix') || (t.Teams?.[0]?.TeamName || '').toLowerCase().includes('enhancements'));
  const breakfixTickets = breakfixTicketsList.length;
  const breakfixUSP = breakfixTicketsList.reduce((sum, t) => sum + (t.StoryPoints || 0), 0);

  const totalTickets = tickets.length;
  const totalUSP = tickets.reduce((sum, t) => sum + (t.StoryPoints || 0), 0);
  const totalHours = tickets.reduce((sum, t) => sum + (t.OriginalEstimate || 0), 0);

  // Deployed items (State === 'Deployed')
  const deployedItems = tickets
    .filter(t => t.State === 'Deployed')
    .map(t => ({
      title: t.Title,
      team: t.Teams?.[0]?.TeamName || 'General',
      storyPoints: t.StoryPoints || 0,
      developer: t.AssignedTo?.UserName.split(', ').reverse().join(' ') || 'Unassigned'
    }));

  // Slipped / Moved items (State !== 'Deployed')
  const movedItems = tickets
    .filter(t => t.State !== 'Deployed' && (t.State === 'Blocked' || t.State === 'Ready for Dev' || t.State === 'RQMT Review'))
    .map(t => {
      let notes = 'Awaiting QA sign-off';
      if (t.State === 'Blocked') notes = 'Blocked by third-party API connectivity issues';
      if (t.State === 'RQMT Review') notes = 'Requirement clarifications pending business approval';
      
      return {
        title: t.Title,
        movedTo: 'Sprint 6',
        notes
      };
    });

  // Developer performance breakdown summary
  const devSummary = teamMembers.map(dev => {
    const devTickets = tickets.filter(t => 
      (t.AssignedTo?.UserName || '').toLowerCase().includes(dev.name.toLowerCase()) ||
      (t.AssignedTo?.UserName || '').toLowerCase().includes(dev.adoName.toLowerCase())
    );
    return {
      name: dev.name,
      tickets: devTickets.length,
      storyPoints: devTickets.reduce((sum, t) => sum + (t.StoryPoints || 0), 0),
      hours: devTickets.reduce((sum, t) => sum + (t.OriginalEstimate || 0), 0)
    };
  });

  return {
    sprintName,
    releaseDate,
    findabilityTickets,
    findabilityUSP,
    breakfixTickets,
    breakfixUSP,
    totalTickets,
    totalUSP,
    totalHours,
    deployedItems,
    movedItems,
    devSummary
  };
}

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const sprintName = searchParams.get('sprint') || 'Sprint 5';
  const force = searchParams.get('force') === 'true';

  const cacheKey = `ai-recap:${sprintName}`;
  
  if (!force) {
    // Check cache first (AI recaps can cache indefinitely unless forced)
    const cachedText = Cache.get<string>(cacheKey, 24 * 3600 * 1000); // 24-hour cache for AI recap
    if (cachedText) {
      return NextResponse.json({ success: true, text: cachedText, cached: true });
    }
  }

  try {
    const sprintData = await getSprintData(sprintName);
    const text = await generateSprintRecap(sprintData);
    Cache.set(cacheKey, text);
    
    return NextResponse.json({ success: true, text, cached: false });
  } catch (err: any) {
    console.error('Recap generation endpoint error:', err);
    return NextResponse.json({ success: false, error: err.message }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { sprintName } = body;
    const cacheKey = `ai-recap:${sprintName}`;

    const sprintData = await getSprintData(sprintName);
    const text = await generateSprintRecap(sprintData);
    Cache.set(cacheKey, text);
    
    return NextResponse.json({ success: true, text });
  } catch (err: any) {
    console.error('Recap generation POST endpoint error:', err);
    return NextResponse.json({ success: false, error: err.message }, { status: 500 });
  }
}
