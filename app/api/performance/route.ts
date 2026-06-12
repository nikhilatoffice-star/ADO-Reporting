import { NextResponse } from 'next/server';
import { fetchOData, isDemoMode } from '@/lib/ado-client';
import { TEAM_MEMBERS } from '@/lib/team-config';
import { Cache } from '@/lib/cache';
import { ADOWorkItem, TeamMember } from '@/lib/types';
import { supabase } from '@/lib/supabase';

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const crm = searchParams.get('crm') || '';
    const bf = searchParams.get('bf') || '';
    const find = searchParams.get('find') || '';
    const enh = searchParams.get('enh') || '';



    const isDemo = isDemoMode();
    const customizations = Cache.getCustomizations();
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
          notes: row.notes,
          baseTickets: row.base_tickets || 0,
          baseUsp: row.base_usp || 0
        };
      });
    }

    const mergedDevs: TeamMember[] = TEAM_MEMBERS.map(dev => {
      const overrides = devCustomMap[dev.name] || {};
      return {
        ...dev,
        role: overrides.role || dev.role,
        type: overrides.type || dev.type,
        team: overrides.team || dev.team,
        notes: overrides.notes || dev.notes,
        leadershipRating: overrides.leadershipRating || dev.leadershipRating,
        techRating: overrides.techRating || dev.techRating,
        baseTickets: overrides.baseTickets || 0,
        baseUsp: overrides.baseUsp || 0,
        baseSprints: overrides.baseSprints || 0
      };
    });

    // Group by exact end_date to perfectly align concurrent streams and fix the 2026 Year-Rollover bug
    const { data: dbIterations } = await supabase.from('ado_iterations').select('*');
    const iterToDate = new Map<string, number>();
    const iterToName = new Map<string, string>();
    dbIterations?.forEach(iter => {
      iterToDate.set(iter.iteration_name, new Date(iter.end_date).getTime());
      
      // Try to extract a clean name like "Sprint 4" or "Sprint 41" for the chart
      const match = iter.iteration_name.match(/Sprint\s*(\d+)/i);
      if (match) {
        // Distinguish 2025 vs 2026 to avoid confusion in the chart
        const yearMatch = iter.iteration_name.match(/^25|2025/);
        const year = yearMatch ? " '25" : " '26";
        iterToName.set(iter.iteration_name, `Sprint ${match[1]}${year}`);
      } else {
        iterToName.set(iter.iteration_name, iter.iteration_name);
      }
    });

    let dbWorkItems: any[] = [];
    let fetchStart = 0;
    const fetchStep = 1000;
    let keepFetching = true;

    while (keepFetching) {
      const { data } = await supabase
        .from('ado_work_items')
        .select('*')
        .in('work_item_type', ['Task'])
        .ilike('iteration_name', '%Sprint%')
        .order('work_item_id', { ascending: false })
        .range(fetchStart, fetchStart + fetchStep - 1);

      if (data && data.length > 0) {
        dbWorkItems.push(...data);
        if (data.length < fetchStep) {
          keepFetching = false;
        } else {
          fetchStart += fetchStep;
        }
      } else {
        keepFetching = false;
      }
    }

    // Find the anchor date based on dashboard selection
    let maxAnchorDate = new Date('2099-01-01').getTime();
    const selectedSprintNames = [crm, bf, find, enh].filter(p => p !== '');
    if (selectedSprintNames.length > 0) {
      maxAnchorDate = 0;
      selectedSprintNames.forEach(name => {
        const d = iterToDate.get(name);
        if (d && d > maxAnchorDate) maxAnchorDate = d;
      });
      if (maxAnchorDate === 0) maxAnchorDate = new Date('2099-01-01').getTime();
    }
    
    // Apply exact filtering
    const validWorkItems = (dbWorkItems || []).filter(item => {
      const state = (item.state || '').toLowerCase();
      const isCompleted = ['closed', 'ready for prod', 'resolved', 'done', 'completed'].includes(state);
      if (!isCompleted) return false;

      const tagsList = (item.tags || '').split(',').map((s: string) => s.trim().toLowerCase());
      const hasValidTag = tagsList.some((tag: string) => tag === 'packaged' || tag.startsWith('rel'));
      if (!hasValidTag) return false;

      const iterName = item.iteration_name || '';
      const teamName = item.team_name || '';
      const isCRM = teamName.includes('CRM') || iterName.includes('CRM');
      const isBF = teamName.includes('BreakFix') || iterName.includes('eComBF') || teamName.includes('Break Fix');
      const isFind = teamName.includes('Findability') || iterName.includes('eComFindability');
      const isEnh = teamName.includes('Enhancement') || iterName.includes('eComEnh') || teamName.includes('Projects');
      if (!(isCRM || isBF || isFind || isEnh)) return false;

      // Must be <= anchor date
      const eDate = iterToDate.get(iterName);
      if (!eDate || eDate > maxAnchorDate) return false;

      return true;
    });

    // Count sprints by unique sprint NUMBER (not end-date), so concurrent team streams
    // (CRM, BF, Findability, Enh) that share the same sprint cycle count as 1 sprint.
    const sprintNumSet = new Set<number>();
    validWorkItems.forEach(t => {
      const m = (t.iteration_name || '').match(/Sprint\s*(\d+)/i);
      if (m) sprintNumSet.add(parseInt(m[1], 10));
    });
    const sortedSprintNums = Array.from(sprintNumSet).sort((a, b) => a - b);

    // For Last-5/Last-10 date bucketing we still need end-dates (to handle year rollover)
    const dateSet = new Set<number>();
    validWorkItems.forEach(t => {
      const eDate = iterToDate.get(t.iteration_name);
      if (eDate) dateSet.add(eDate);
    });
    const sortedDates = Array.from(dateSet).sort((a, b) => a - b);
    const last5Dates = sortedDates.slice(-5);
    const last10Dates = sortedDates.slice(-10);

    // Unique sprint count = unique sprint numbers (one per cycle, not per stream)
    const uniqueSprintsCount = sortedSprintNums.length;

    // Build a map of parent work_item_id -> story_points
    // Tasks don't carry story points; inherit from parent User Story / Bug
    const parentIds = Array.from(
      new Set(validWorkItems.map(t => t.parent_work_item_id).filter(Boolean))
    );
    const parentUspMap = new Map<number, number>();
    if (parentIds.length > 0) {
      // Supabase .in() supports up to 1000 values at a time
      for (let i = 0; i < parentIds.length; i += 1000) {
        const chunk = parentIds.slice(i, i + 1000);
        const { data: parents } = await supabase
          .from('ado_work_items')
          .select('work_item_id, story_points')
          .in('work_item_id', chunk);
        parents?.forEach(p => parentUspMap.set(p.work_item_id, p.story_points || 0));
      }
    }

    // Helper: get the USP for a task via its parent
    const getUsp = (t: any) => parentUspMap.get(t.parent_work_item_id) ?? t.story_points ?? 0;

    const calculatedStats = mergedDevs.map(dev => {
      const devTickets = validWorkItems.filter(t => 
        (t.assigned_to || '').toLowerCase().includes(dev.name.toLowerCase()) ||
        (t.assigned_to || '').toLowerCase().includes(dev.adoName.toLowerCase())
      );

      // All Time
      let allTimeTickets = devTickets.length;
      let allTimeUsp = devTickets.reduce((sum, t) => sum + getUsp(t), 0);
      let allTimeSprintsCount = (dev.baseSprints || 0) + uniqueSprintsCount;

      // Last 5
      const last5TicketsArr = devTickets.filter(t => {
        const eDate = iterToDate.get(t.iteration_name);
        return eDate && last5Dates.includes(eDate);
      });
      const last5Tickets = last5TicketsArr.length;
      const last5Usp = last5TicketsArr.reduce((sum, t) => sum + getUsp(t), 0);
      const last5SprintsCount = last5Dates.length || 1;

      // Averages
      const allTimeAvgTickets = allTimeSprintsCount > 0 ? (allTimeTickets + (dev.baseTickets || 0)) / allTimeSprintsCount : 0;
      const allTimeAvgUsp = allTimeSprintsCount > 0 ? (allTimeUsp + (dev.baseUsp || 0)) / allTimeSprintsCount : 0;
      const last5AvgTickets = last5Tickets / last5SprintsCount;
      const last5AvgUsp = last5Usp / last5SprintsCount;

      let rating = 'WIP';
      if (last5AvgTickets >= 8 || last5AvgUsp >= 15) {
        rating = 'GOOD';
      } else if (last5AvgTickets >= 4 || last5AvgUsp >= 8) {
        rating = 'AVG';
      } else {
        rating = 'LOW';
      }

      return {
        developerName: dev.name,
        role: dev.role,
        type: dev.type,
        team: dev.team,
        last5Tickets,
        last5Usp,
        last5SprintsCount: last5Dates.length,
        last5AvgTickets: parseFloat(last5AvgTickets.toFixed(1)),
        last5AvgUsp: parseFloat(last5AvgUsp.toFixed(1)),
        allTimeTickets,
        allTimeUsp,
        allTimeSprintsCount,
        allTimeAvgTickets: parseFloat(allTimeAvgTickets.toFixed(1)),
        allTimeAvgUsp: parseFloat(allTimeAvgUsp.toFixed(1)),
        rating,
        leadership: dev.leadershipRating || 'WIP',
        techCompetence: dev.techRating || 'WIP',
        notes: dev.notes,
        sprintsHistory: [], // Retaining just in case UI needs it
        baseTickets: dev.baseTickets || 0,
        baseUsp: dev.baseUsp || 0,
        baseSprints: dev.baseSprints || 0
      };
    });

    const rechartsChartData = last10Dates.map(dateKey => {
      // Find a representative name for this date bucket
      const sampleItem = validWorkItems.find(t => iterToDate.get(t.iteration_name) === dateKey);
      const sprintNameStr = sampleItem ? iterToName.get(sampleItem.iteration_name) : 'Unknown Sprint';
      
      const entry: any = { sprint: sprintNameStr };
      mergedDevs.forEach(dev => {
        const devSprintTickets = validWorkItems.filter(t => {
          const isDev = (t.assigned_to || '').toLowerCase().includes(dev.name.toLowerCase()) ||
                        (t.assigned_to || '').toLowerCase().includes(dev.adoName.toLowerCase());
          return iterToDate.get(t.iteration_name) === dateKey && isDev;
        });
        
        entry[dev.name] = devSprintTickets.length;
        entry[`${dev.name}_usp`] = devSprintTickets.reduce((sum, t) => sum + getUsp(t), 0);
      });
      return entry;
    });

    return NextResponse.json({
      success: true,
      stats: calculatedStats,
      chartData: rechartsChartData,
      isDemo
    });
  } catch (error) {
    console.error('Error fetching dev performance:', error);
    return NextResponse.json({ success: false, error: 'Failed to fetch dev performance metrics' }, { status: 500 });
  }
}
