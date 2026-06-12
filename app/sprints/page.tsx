import React from 'react';
import { fetchOData, isDemoMode } from '../../lib/ado-client';
import { supabase } from '../../lib/supabase';
import { ADOWorkItem } from '../../lib/types';
import { DEV_NAMES, getShortName } from '../../lib/team-config';
import SprintTicketTable from '../../components/tables/SprintTicketTable';
import { Table, CheckCircle2, AlertCircle, TrendingUp } from 'lucide-react';

interface SprintDetailPageProps {
  searchParams: { [key: string]: string | string[] | undefined };
}

export default async function SprintDetailPage({ searchParams }: SprintDetailPageProps) {
  const crm = searchParams.crm as string || '';
  const bf = searchParams.bf as string || '';
  const find = searchParams.find as string || '';
  const enh = searchParams.enh as string || '';

  // Fetch tickets for this combination
  let tickets: ADOWorkItem[] = [];
  try {
    const queryUrl = `MultiSprintWorkItems?crm=${encodeURIComponent(crm)}&bf=${encodeURIComponent(bf)}&find=${encodeURIComponent(find)}&enh=${encodeURIComponent(enh)}`;
    tickets = await fetchOData<ADOWorkItem>(queryUrl);
  } catch (err) {
    console.error("Failed to fetch tickets:", err);
  }

  // Fetch ticket overrides (notes, custom dev hours, etc.)
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

  // Define completed logic
  const completedStatuses = ['closed', 'ready for prod', 'resolved', 'done', 'completed'];
  
  const isCompletedTicket = (t: ADOWorkItem): boolean => {
    const isCompletedState = completedStatuses.includes((t.State || '').toLowerCase().trim());
    if (!isCompletedState) return false;
    const tagsList = (t.Tags || '').split(',').map(s => s.trim().toLowerCase());
    return tagsList.some(tag => tag === 'packaged' || tag.startsWith('rel'));
  };

  // Calculate counts using ONLY Parent Tickets (Stories, Bugs, Features, Epics)
  const parentTypes = ['User Story', 'Bug', 'Feature', 'Epic'];
  const parentTickets = tickets.filter(t => parentTypes.includes(t.WorkItemType));
  const completedParents = parentTickets.filter(t => isCompletedTicket(t));
  const spilloverParents = parentTickets.filter(t => !isCompletedTicket(t));
  const tasks = tickets.filter(t => t.WorkItemType === 'Task');

  const completedParentIds = new Set(completedParents.map(p => p.WorkItemId));
  const spilloverParentIds = new Set(spilloverParents.map(p => p.WorkItemId));

  const completedTickets = [
    ...completedParents,
    ...tasks.filter(t => t.ParentWorkItemId && completedParentIds.has(t.ParentWorkItemId))
  ];
  const spilloverTickets = [
    ...spilloverParents,
    ...tasks.filter(t => t.ParentWorkItemId && spilloverParentIds.has(t.ParentWorkItemId))
  ];
  
  const effectiveHoursMap: Record<number, number> = {};
  parentTickets.forEach(p => {
    const override = overridesMap[p.WorkItemId] || {};
    const childTasks = tasks.filter(t => t.ParentWorkItemId === p.WorkItemId);
    let devHoursSum = 0;
    
    DEV_NAMES.forEach(name => {
      const manual = override.dev_hours?.[name];
      if (manual) {
        devHoursSum += (typeof manual === 'number' ? manual : parseFloat(manual || '0'));
      } else {
        let sum = 0;
        childTasks.forEach(ct => {
          const shortAssignee = getShortName(ct.AssignedTo?.UserName || '');
          if (shortAssignee.toLowerCase() === name.toLowerCase()) {
            sum += (ct.OriginalEstimate || 0);
          }
        });
        devHoursSum += sum;
      }
    });
    
    effectiveHoursMap[p.WorkItemId] = devHoursSum > 0 ? devHoursSum : (p.OriginalEstimate || 0);
  });

  const completedUSP = completedParents.reduce((sum, t) => sum + (t.StoryPoints || 0), 0);
  const completedHours = completedParents.reduce((sum, t) => sum + effectiveHoursMap[t.WorkItemId], 0);
  
  const spilloverUSP = spilloverParents.reduce((sum, t) => sum + (t.StoryPoints || 0), 0);
  const spilloverHours = spilloverParents.reduce((sum, t) => sum + effectiveHoursMap[t.WorkItemId], 0);

  // total Developer 1 across completed tickets
  const dev1Set = new Set<string>();
  completedParents.forEach(p => {
    const override = overridesMap[p.WorkItemId] || {};
    const d1 = override.dev_1 || p.Developer1?.split(', ').reverse().join(' ');
    if (d1 && d1.trim() !== '') dev1Set.add(d1.trim());
  });
  const totalDev1Count = dev1Set.size;

  const avgUSP = completedParents.length > 0 ? (completedUSP / completedParents.length).toFixed(1) : '0';
  const avgHours = totalDev1Count > 0 ? (completedHours / totalDev1Count).toFixed(1) : '0';

  const demoActive = isDemoMode();

  return (
    <div className="flex flex-col space-y-8 print:p-0">
      {/* Header Panel */}
      <div className="flex justify-between items-center border-b border-[#DFE1E6] pb-5">
        <div>
          <h2 className="text-2xl font-bold tracking-tight text-[#172B4D] flex items-center space-x-2">
            <Table className="w-6 h-6 text-[#0052CC]" />
            <span>Consolidated Sprint Detail</span>
          </h2>
          <p className="text-[#6B778C] text-sm mt-1">
            Total Work Items: {parentTickets.length}
          </p>
        </div>
      </div>

      {/* Demo Warning Banner */}
      {demoActive && (
        <div className="flex items-center space-x-3 bg-[#FFFAE6] border border-[#FF8B00] text-[#172B4D] px-4 py-3 rounded-md text-sm print:hidden">
          <AlertCircle className="w-4 h-4 text-[#FF8B00] flex-shrink-0" />
          <span>
            <strong>Demo Mode Active</strong>: Displaying high-fidelity mock sprint values. Update variables in your <code>.env.local</code> to pull live OData metrics.
          </span>
        </div>
      )}

      {/* Velocity Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-white border border-[#DFE1E6] rounded-md p-5 shadow-sm flex flex-col">
          <div className="flex items-center space-x-2 mb-2">
            <TrendingUp className="w-5 h-5 text-[#0052CC]" />
            <h3 className="font-bold text-[#172B4D] text-sm">Average Velocity</h3>
          </div>
          <div className="flex space-x-6 mt-2">
            <div>
              <div className="text-[10px] text-[#6B778C] font-bold uppercase tracking-wider mb-1">Story Pts/Ticket</div>
              <div className="text-2xl font-bold text-[#172B4D]">{avgUSP}</div>
            </div>
            <div>
              <div className="text-[10px] text-[#6B778C] font-bold uppercase tracking-wider mb-1">Hours/Dev</div>
              <div className="text-2xl font-bold text-[#172B4D]">{avgHours}h</div>
            </div>
          </div>
        </div>

        <div className="bg-white border border-[#DFE1E6] rounded-md p-5 shadow-sm flex flex-col">
          <div className="flex items-center space-x-2 mb-2">
            <CheckCircle2 className="w-5 h-5 text-[#006644]" />
            <h3 className="font-bold text-[#172B4D] text-sm">Completed Tickets</h3>
          </div>
          <div className="flex space-x-6 mt-2">
            <div>
              <div className="text-[10px] text-[#6B778C] font-bold uppercase tracking-wider mb-1">Story Points</div>
              <div className="text-2xl font-bold text-[#006644]">{completedUSP}</div>
            </div>
            <div>
              <div className="text-[10px] text-[#6B778C] font-bold uppercase tracking-wider mb-1">Hours</div>
              <div className="text-2xl font-bold text-[#006644]">{completedHours}h</div>
            </div>
            <div>
              <div className="text-[10px] text-[#6B778C] font-bold uppercase tracking-wider mb-1">Count</div>
              <div className="text-2xl font-bold text-[#006644]">{completedParents.length}</div>
            </div>
          </div>
        </div>

        <div className="bg-white border border-[#DFE1E6] rounded-md p-5 shadow-sm flex flex-col">
          <div className="flex items-center space-x-2 mb-2">
            <AlertCircle className="w-5 h-5 text-[#FF8B00]" />
            <h3 className="font-bold text-[#172B4D] text-sm">Spillover (Incomplete)</h3>
          </div>
          <div className="flex space-x-6 mt-2">
            <div>
              <div className="text-[10px] text-[#6B778C] font-bold uppercase tracking-wider mb-1">Story Points</div>
              <div className="text-2xl font-bold text-[#FF8B00]">{spilloverUSP}</div>
            </div>
            <div>
              <div className="text-[10px] text-[#6B778C] font-bold uppercase tracking-wider mb-1">Hours</div>
              <div className="text-2xl font-bold text-[#FF8B00]">{spilloverHours}h</div>
            </div>
            <div>
              <div className="text-[10px] text-[#6B778C] font-bold uppercase tracking-wider mb-1">Count</div>
              <div className="text-2xl font-bold text-[#FF8B00]">{spilloverParents.length}</div>
            </div>
          </div>
        </div>
      </div>

      {/* Tables Section */}
      <div className="flex flex-col space-y-8">
        
        {/* Completed Table */}
        <div className="flex flex-col space-y-4">
          <h3 className="text-lg font-bold text-[#172B4D] border-b border-[#DFE1E6] pb-2 flex items-center space-x-2">
            <CheckCircle2 className="w-5 h-5 text-[#006644]" />
            <span>Completed Tickets</span>
          </h3>
          <SprintTicketTable tickets={completedTickets} overrides={overridesMap} />
        </div>

        {/* Spillover Table */}
        <div className="flex flex-col space-y-4">
          <h3 className="text-lg font-bold text-[#172B4D] border-b border-[#DFE1E6] pb-2 flex items-center space-x-2">
            <AlertCircle className="w-5 h-5 text-[#FF8B00]" />
            <span>Spillover Tickets (Incomplete)</span>
          </h3>
          <SprintTicketTable tickets={spilloverTickets} overrides={overridesMap} />
        </div>

      </div>
    </div>
  );
}
