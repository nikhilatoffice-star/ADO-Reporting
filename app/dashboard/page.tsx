import React from 'react';
import {
  fetchOData,
  isDemoMode
} from '../../lib/ado-client';
import { ADOWorkItem, ADOIteration } from '../../lib/types';
import { supabase } from '../../lib/supabase';
import { DEV_NAMES, getShortName } from '../../lib/team-config';
import { QUERIES } from '../../lib/queries';
import ExportButton from '../../components/ui/ExportButton';
import {
  FileCheck,
  Target,
  Clock,
  Activity,
  AlertCircle
} from 'lucide-react';
import VelocityChartClient from './VelocityChartClient';
import ActiveDevsModal from './ActiveDevsModal';

interface DashboardPageProps {
  searchParams: { [key: string]: string | string[] | undefined };
}

export default async function DashboardPage({ searchParams }: DashboardPageProps) {
  const crm = searchParams.crm as string || '';
  const bf = searchParams.bf as string || '';
  const find = searchParams.find as string || '';
  const enh = searchParams.enh as string || '';

  const activeSprintName = 'Consolidated Sprints';
  const projects = [crm, bf, find, enh].filter(p => p !== '');
  const displayProjects = projects.length > 0 ? projects.join(', ') : 'All Projects / Consolidated Sprints';

  const sprints = await fetchOData<ADOIteration>("Iterations?$orderby=StartDate asc");

  // Fetch current sprint tickets
  let tickets: ADOWorkItem[] = [];
  try {
    const queryUrl = `MultiSprintWorkItems?crm=${encodeURIComponent(crm)}&bf=${encodeURIComponent(bf)}&find=${encodeURIComponent(find)}&enh=${encodeURIComponent(enh)}`;
    tickets = await fetchOData<ADOWorkItem>(queryUrl);
  } catch (err) {
    console.error("Failed to fetch tickets:", err);
  }

  // Fetch overrides for accurate hours mapping
  const { data: dbOverrides } = await supabase.from('dev_performance_overrides').select('*');
  const overridesMap: Record<string, any> = {};
  if (dbOverrides) {
    dbOverrides.forEach(row => {
      overridesMap[row.work_item_id] = {
        notes: row.notes,
        dev_1: row.dev_1,
        dev_2: row.dev_2,
        dev_hours: row.dev_hours || {}
      };
    });
  }

  // Compute KPI card stats using strictly completed Parent tickets
  const completedStatuses = ['closed', 'ready for prod', 'resolved', 'done', 'completed'];
  const parentTypes = ['User Story', 'Bug', 'Feature', 'Epic'];

  const parentTickets = tickets.filter(t => parentTypes.includes(t.WorkItemType));
  const completedParents = parentTickets.filter(t => {
    const isCompletedState = completedStatuses.includes((t.State || '').toLowerCase().trim());
    if (!isCompletedState) return false;
    const tagsList = (t.Tags || '').split(',').map(s => s.trim().toLowerCase());
    return tagsList.some(tag => tag === 'packaged' || tag.startsWith('rel'));
  });
  const completedIds = completedParents.map(t => t.WorkItemId);
  let adoQueryUrl = '#';
  if (completedIds.length > 0) {
    const wiql = `SELECT [System.Id], [System.Title], [System.WorkItemType], [System.State], [Microsoft.VSTS.Scheduling.StoryPoints] FROM WorkItems WHERE [System.Id] IN (${completedIds.join(',')})`;
    adoQueryUrl = `https://dev.azure.com/fleetpride/FP-IT/_workitems?_a=query&wiql=${encodeURIComponent(wiql)}`;
  }

  const totalTickets = completedParents.length;
  const totalUSP = completedParents.reduce((sum, t) => sum + (t.StoryPoints || 0), 0);

  // Calculate average hours per ticket using effective Dev Hours (like the Sprints page)
  const tasks = tickets.filter(t => t.WorkItemType === 'Task');

  let totalHours = 0;
  const activeDevsSet = new Set<string>();

  const devStatsMap: Record<string, { name: string; hours: number; storyPoints: number }> = {};
  
  const getOrCreateDev = (name: string) => {
    if (!devStatsMap[name]) {
      devStatsMap[name] = { name, hours: 0, storyPoints: 0 };
    }
    return devStatsMap[name];
  };

  completedParents.forEach(p => {
    const override = overridesMap[p.WorkItemId] || {};
    const rawDev = override.dev_1 || p.Developer1;
    const d1 = rawDev ? rawDev.split(',').map((s: string) => s.trim()).reverse().join(' ') : '';
    const primaryDev = d1.trim() !== '' ? d1.trim() : 'Unassigned';
    
    if (primaryDev !== 'Unassigned') {
      activeDevsSet.add(primaryDev);
      getOrCreateDev(primaryDev).storyPoints += (p.StoryPoints || 0);
    }

    const childTasks = tasks.filter(t => t.ParentWorkItemId === p.WorkItemId);
    let devHoursSum = 0;
    const hoursByDevName: Record<string, number> = {};

    DEV_NAMES.forEach(name => {
      const manual = override.dev_hours?.[name];
      if (manual) {
        const val = typeof manual === 'number' ? manual : parseFloat(manual || '0');
        if (val > 0) {
          hoursByDevName[name] = (hoursByDevName[name] || 0) + val;
          devHoursSum += val;
        }
      } else {
        let sum = 0;
        childTasks.forEach(ct => {
          const shortAssignee = getShortName(ct.AssignedTo?.UserName || '');
          if (shortAssignee.toLowerCase() === name.toLowerCase()) {
            sum += (ct.OriginalEstimate || 0);
          }
        });
        if (sum > 0) {
          hoursByDevName[name] = (hoursByDevName[name] || 0) + sum;
          devHoursSum += sum;
        }
      }
    });

    if (devHoursSum > 0) {
      totalHours += devHoursSum;
      for (const [shortName, hrs] of Object.entries(hoursByDevName)) {
        let matchedFullName = Array.from(activeDevsSet).find(fullName => {
          const sName = getShortName(fullName);
          return sName.toLowerCase() === shortName.toLowerCase();
        });
        
        if (!matchedFullName) {
          matchedFullName = shortName;
        }
        
        getOrCreateDev(matchedFullName).hours += hrs;
      }
    } else {
      const parentHours = p.OriginalEstimate || 0;
      totalHours += parentHours;
      if (parentHours > 0 && primaryDev !== 'Unassigned') {
        getOrCreateDev(primaryDev).hours += parentHours;
      }
    }
  });

  const avgHours = totalTickets > 0 ? (totalHours / totalTickets).toFixed(1) : '0.0';
  const activeDevsCount = activeDevsSet.size;
  
  const activeDevsArray = Array.from(activeDevsSet).map(fullName => {
    const stats = devStatsMap[fullName] || { name: fullName, hours: 0, storyPoints: 0 };
    return {
      name: fullName,
      hours: stats.hours,
      storyPoints: stats.storyPoints
    };
  }).sort((a, b) => b.storyPoints - a.storyPoints || a.name.localeCompare(b.name));

  // Retrieve Historical Data for Velocity & Trends
  // We use pagination via .range() to bypass Supabase's hard server-side max_rows limit (which caps at 1000)
  let dbAllParents: any[] = [];
  let fetchStart = 0;
  const fetchStep = 1000;
  let keepFetching = true;

  while (keepFetching) {
    const { data } = await supabase
      .from('ado_work_items')
      .select('iteration_name, work_item_type, state, story_points, original_estimate, team_name, work_item_id, tags')
      .in('work_item_type', ['User Story', 'Bug', 'Feature', 'Epic'])
      .ilike('iteration_name', '%Sprint%')
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

  // Format Velocity Data for Recharts
  // Find the max Sprint Number from the currently selected sprints to act as "now/selected"
  let maxSprintNum = 999999;
  const selectedSprintNames = [crm, bf, find, enh].filter(p => p !== '');
  if (selectedSprintNames.length > 0) {
    let maxFound = -1;
    selectedSprintNames.forEach(name => {
      const m = name.match(/Sprint\s*(\d+)/i);
      if (m) {
        const num = parseInt(m[1], 10);
        if (num > maxFound) maxFound = num;
      }
    });
    if (maxFound > -1) {
      maxSprintNum = maxFound;
    }
  }

  // Aggregate tickets directly from the DB so we don't drop old sprints missing from the Iterations API
  const rawVelocityMap: Record<number, { sprint: string; fullNames: Set<string>; findability: number; breakfix: number; total: number; usp: number; hours: number }> = {};

  // Filter dbAllParents in memory to solve case-sensitivity issues with 'state' that Supabase ignores
  const closedHistoricalParents = dbAllParents.filter(t => {
    const state = t.state || '';
    const isCompletedState = ['Closed', 'Ready for Prod', 'Resolved', 'Done', 'Completed'].includes(state) ||
      ['closed', 'ready for prod', 'resolved', 'done', 'completed'].includes(state.toLowerCase());
    if (!isCompletedState) return false;
    const tagsList = (t.tags || '').split(',').map((s: string) => s.trim().toLowerCase());
    return tagsList.some((tag: string) => tag === 'packaged' || tag.startsWith('rel'));
  });

  // In Azure DevOps, estimate hours are typically logged on Child Tasks, not the Parent Tickets.
  // We need to fetch all child tasks for our valid historical parents to calculate the true hours trend.
  const validHistoricalParentIds: number[] = [];
  closedHistoricalParents.forEach(item => {
    const iterName = item.iteration_name || '';
    const teamName = item.team_name || '';
    const isCRM = teamName.includes('CRM') || iterName.includes('CRM');
    const isBF = teamName.includes('BreakFix') || iterName.includes('eComBF') || teamName.includes('Break Fix');
    const isFind = teamName.includes('Findability') || iterName.includes('eComFindability');
    const isEnh = teamName.includes('Enhancement') || iterName.includes('eComEnh') || teamName.includes('Projects');
    if (!isCRM && !isBF && !isFind && !isEnh) return;

    const match = iterName.match(/Sprint\s*(\d+)/i);
    if (match) {
      const sprintNum = parseInt(match[1], 10);
      if (sprintNum <= maxSprintNum && item.work_item_id) {
        validHistoricalParentIds.push(item.work_item_id);
      }
    }
  });

  // Chunk the parent IDs into groups of 500 to fetch their children safely
  const childHoursByParent: Record<number, number> = {};
  for (let i = 0; i < validHistoricalParentIds.length; i += 500) {
    const chunk = validHistoricalParentIds.slice(i, i + 500);
    const { data: children } = await supabase
      .from('ado_work_items')
      .select('parent_work_item_id, original_estimate')
      .in('parent_work_item_id', chunk);

    if (children) {
      children.forEach(c => {
        const pid = c.parent_work_item_id;
        if (pid) {
          childHoursByParent[pid] = (childHoursByParent[pid] || 0) + (c.original_estimate || 0);
        }
      });
    }
  }

  if (closedHistoricalParents) {
    closedHistoricalParents.forEach(item => {
      const iterName = item.iteration_name || '';
      const teamName = item.team_name || '';

      // ONLY include tickets from the 4 selected streams! Skip Platform, Mobile, etc.
      const isCRM = teamName.includes('CRM') || iterName.includes('CRM');
      const isBF = teamName.includes('BreakFix') || iterName.includes('eComBF') || teamName.includes('Break Fix');
      const isFind = teamName.includes('Findability') || iterName.includes('eComFindability');
      const isEnh = teamName.includes('Enhancement') || iterName.includes('eComEnh') || teamName.includes('Projects');

      if (!isCRM && !isBF && !isFind && !isEnh) {
        return; // Exclude foreign team tickets
      }

      const match = iterName.match(/Sprint\s*(\d+)/i);
      if (match) {
        const sprintNum = parseInt(match[1], 10);

        // Only count if it's <= maxSprintNum (cutting off future sprints)
        if (sprintNum <= maxSprintNum) {
          if (!rawVelocityMap[sprintNum]) {
            rawVelocityMap[sprintNum] = {
              sprint: `Sprint ${sprintNum}`,
              fullNames: new Set(),
              findability: 0,
              breakfix: 0,
              total: 0,
              usp: 0,
              hours: 0
            };
          }

          rawVelocityMap[sprintNum].fullNames.add(iterName);

          if (isFind) {
            rawVelocityMap[sprintNum].findability += 1;
          } else {
            // BreakFix, Projects, Enhancements merged into blue line
            rawVelocityMap[sprintNum].breakfix += 1;
          }

          rawVelocityMap[sprintNum].total += 1;
          rawVelocityMap[sprintNum].usp += (item.story_points || 0);

          // Use the aggregated child hours we fetched above instead of the empty parent hours!
          rawVelocityMap[sprintNum].hours += (childHoursByParent[item.work_item_id] || 0);
        }
      }
    });
  }

  // Sort by sprint number numerically
  let sortedSprintNums = Object.keys(rawVelocityMap).map(Number).sort((a, b) => a - b);

  // Take exactly the last 10 historical sprints
  sortedSprintNums = sortedSprintNums.slice(-10);

  // Format the raw data for Recharts display
  const formattedVelocityData = sortedSprintNums.map(num => {
    const bucket = rawVelocityMap[num];
    return {
      sprint: bucket.sprint,
      fullNames: Array.from(bucket.fullNames).join(', '),
      findability: bucket.findability,
      breakfix: bucket.breakfix,
      total: bucket.total,
      usp: bucket.usp,
      hours: bucket.hours
    };
  });

  // Generate historical trends curve over those 10 sprints
  const trendData = formattedVelocityData.map(v => ({
    sprint: v.sprint,
    fullNames: v.fullNames,
    tickets: v.total,
    usp: v.usp,
    hours: v.total > 0 ? parseFloat((v.hours / v.total).toFixed(1)) : 0
  }));

  const demoActive = isDemoMode();

  return (
    <div className="flex flex-col space-y-8 print:p-0">
      {/* Page Header */}
      <div className="flex justify-between items-center border-b border-[#DFE1E6] pb-5">
        <div>
          <h2 className="text-2xl font-bold tracking-tight text-[#172B4D] flex items-center space-x-2">
            <Activity className="w-6 h-6 text-[#0052CC]" />
            <span>eCommerce IT Reporting Dashboard</span>
          </h2>
          <p className="text-[#6B778C] text-sm mt-1">
            Real-time executive performance metrics for C-level engineering stakeholders
          </p>
          <div className="text-xs text-[#0052CC] font-semibold mt-2 bg-[#E9F2FF] inline-block px-2 py-1 rounded">
            Reporting on: {displayProjects}
          </div>
        </div>
        <ExportButton pageName="dashboard" sprintName={activeSprintName} />
      </div>

      {/* Demo Warning Banner */}
      {demoActive && (
        <div className="flex items-center space-x-3 bg-[#FFFAE6] border border-[#FF8B00] text-[#172B4D] px-4 py-3 rounded text-sm print:hidden">
          <AlertCircle className="w-5 h-5 text-[#FF8B00] flex-shrink-0" />
          <span>
            <strong>Demo Mode Active</strong>: Displaying high-fidelity mock sprint values. Update variables in your <code>.env.local</code> to pull live OData metrics.
          </span>
        </div>
      )}

      {/* KPI Cards Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {/* KPI Card 1: Total Tickets */}
        <a 
          href={adoQueryUrl}
          target="_blank"
          rel="noreferrer"
          className="bg-white border border-[#DFE1E6] rounded-md p-5 shadow-sm flex items-center justify-between hover:shadow-md hover:border-[#B3BAC5] transition cursor-pointer"
        >
          <div className="flex flex-col space-y-1">
            <span className="text-xs text-[#6B778C] uppercase font-bold tracking-wider flex items-center gap-1">
              Total Tickets
              <span className="text-[10px] text-[#0052CC] font-semibold underline underline-offset-2">(Verify in ADO)</span>
            </span>
            <span className="text-3xl font-extrabold text-[#172B4D]">{totalTickets}</span>
            <span className="text-[10px] text-[#42526E]">Delivered this sprint</span>
          </div>
          <div className="bg-[#E9F2FF] p-3 rounded">
            <FileCheck className="w-6 h-6 text-[#0052CC]" />
          </div>
        </a>

        {/* KPI Card 2: Total USP */}
        <a 
          href={adoQueryUrl}
          target="_blank"
          rel="noreferrer"
          className="bg-white border border-[#DFE1E6] rounded-md p-5 shadow-sm flex items-center justify-between hover:shadow-md hover:border-[#B3BAC5] transition cursor-pointer"
        >
          <div className="flex flex-col space-y-1">
            <span className="text-xs text-[#6B778C] uppercase font-bold tracking-wider flex items-center gap-1">
              Total Story Points
              <span className="text-[10px] text-[#0052CC] font-semibold underline underline-offset-2">(Verify in ADO)</span>
            </span>
            <span className="text-3xl font-extrabold text-[#172B4D]">{totalUSP}</span>
            <span className="text-[10px] text-[#42526E]">Completed points (USP)</span>
          </div>
          <div className="bg-[#EAE6FF] p-3 rounded">
            <Target className="w-6 h-6 text-[#403294]" />
          </div>
        </a>

        {/* KPI Card 3: Avg Hours per Ticket */}
        <a 
          href={adoQueryUrl}
          target="_blank"
          rel="noreferrer"
          className="bg-white border border-[#DFE1E6] rounded-md p-5 shadow-sm flex items-center justify-between hover:shadow-md hover:border-[#B3BAC5] transition cursor-pointer"
        >
          <div className="flex flex-col space-y-1">
            <span className="text-xs text-[#6B778C] uppercase font-bold tracking-wider cursor-help border-b border-dotted border-[#6B778C] inline-block w-max pb-0.5" title="Calculated by summing all Dev Task hours associated with completed Parent Tickets, divided by the total number of completed Parent Tickets.">
              Avg Estimate Hours
            </span>
            <span className="text-3xl font-extrabold text-[#172B4D]">{avgHours}h</span>
            <span className="text-[10px] text-[#0052CC] font-semibold underline underline-offset-2">Verify parent tickets in ADO</span>
          </div>
          <div className="bg-[#E3FCEF] p-3 rounded">
            <Clock className="w-6 h-6 text-[#006644]" />
          </div>
        </a>

        {/* KPI Card 4: Active Devs (Interactive Modal) */}
        <ActiveDevsModal count={activeDevsCount} devs={activeDevsArray} />
      </div>

      {/* Velocity and Trend Charts Component Wrapper */}
      <VelocityChartClient
        velocityData={formattedVelocityData}
        trendData={trendData}
      />
    </div>
  );
}
