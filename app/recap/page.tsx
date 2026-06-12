import React from 'react';
import { fetchOData, isDemoMode } from '../../lib/ado-client';
import { TEAM_MEMBERS } from '../../lib/team-config';
import { supabase } from '../../lib/supabase';
import { ADOWorkItem, TeamMember } from '../../lib/types';
import { generateSprintRecap } from '../../lib/ai-summary';
import RecapCard from '../../components/recap/RecapCard';
import ExportButton from '../../components/ui/ExportButton';
import { Sparkles, BarChart2, ShieldAlert, Award, AlertCircle } from 'lucide-react';

interface RecapPageProps {
  searchParams: { [key: string]: string | string[] | undefined };
}

// Helper to compute sprint aggregations
function calculateSprintData(tickets: ADOWorkItem[], teamMembers: TeamMember[], sprintId: string, releaseDate: string) {
  const findabilityTicketsList = tickets.filter(t => (t.Teams?.[0]?.TeamName || '').toLowerCase().includes('findability'));
  const findabilityTickets = findabilityTicketsList.length;
  const findabilityUSP = findabilityTicketsList.reduce((sum, t) => sum + (t.StoryPoints || 0), 0);

  const breakfixTicketsList = tickets.filter(t => (t.Teams?.[0]?.TeamName || '').toLowerCase().includes('breakfix') || (t.Teams?.[0]?.TeamName || '').toLowerCase().includes('enhancements'));
  const breakfixTickets = breakfixTicketsList.length;
  const breakfixUSP = breakfixTicketsList.reduce((sum, t) => sum + (t.StoryPoints || 0), 0);

  const totalTickets = tickets.length;
  const totalUSP = tickets.reduce((sum, t) => sum + (t.StoryPoints || 0), 0);
  const totalHours = tickets.reduce((sum, t) => sum + (t.OriginalEstimate || 0), 0);

  const deployedItems = tickets
    .filter(t => t.State === 'Deployed' || t.State === 'Closed' || t.State === 'Resolved')
    .map(t => ({
      title: t.Title,
      team: t.Teams?.[0]?.TeamName || 'General',
      storyPoints: t.StoryPoints || 0,
      developer: t.AssignedTo?.UserName.split(', ').reverse().join(' ') || 'Unassigned'
    }));

  const movedItems = tickets
    .filter(t => t.State !== 'Closed' && t.State !== 'Resolved' && (t.State === 'Blocked' || t.State === 'Ready for Dev' || t.State === 'RQMT Review'))
    .map(t => ({
      title: t.Title,
      movedTo: 'Next Sprint',
      notes: t.State === 'Blocked' ? 'Blocked by external API spec dependencies' : 'Extended QA validation requirements'
    }));

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
    sprintName: sprintId,
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

export default async function RecapPage({ searchParams }: RecapPageProps) {
  const crm = searchParams.crm as string || '';
  const bf = searchParams.bf as string || '';
  const find = searchParams.find as string || '';
  const enh = searchParams.enh as string || '';

  const sprintId = `Consolidated Sprints`;

  // Fetch tickets for aggregates
  let tickets: ADOWorkItem[] = [];
  try {
    const queryUrl = `MultiSprintWorkItems?crm=${encodeURIComponent(crm)}&bf=${encodeURIComponent(bf)}&find=${encodeURIComponent(find)}&enh=${encodeURIComponent(enh)}`;
    tickets = await fetchOData<ADOWorkItem>(queryUrl);
  } catch (err) {
    console.error("Failed to fetch tickets:", err);
  }

  // Fetch current team members
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

  const releaseDateStr = 'Varies by Project';

  const sprintData = calculateSprintData(tickets, teamMembers, sprintId, releaseDateStr);

  const cacheKey = `ai-recap:${crm}-${bf}-${find}-${enh}`;
  let recapText = '';
  // Generate live recap for the combined matrix
  try {
    recapText = await generateSprintRecap(sprintData);
  } catch (err) {
    recapText = 'Error generating sprint summary narrative.';
  }

  const demoActive = isDemoMode();

  return (
    <div className="flex flex-col space-y-8 print:p-0">
      {/* Header Panel */}
      <div className="flex justify-between items-center border-b border-[#DFE1E6] pb-5">
        <div>
          <h2 className="text-2xl font-bold tracking-tight text-[#172B4D] flex items-center space-x-2">
            <Sparkles className="w-6 h-6 text-[#403294] animate-pulse" />
            <span>AI Executive Sprint Recap</span>
          </h2>
          <p className="text-[#6B778C] text-sm mt-1">
            Automated C-level sprint summary powered by Anthropic Claude Sonnet
          </p>
        </div>
        <ExportButton pageName={`recap`} sprintName={sprintId} />
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

      {/* Grid Layout: Left Stats, Right AI Narrative */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        
        {/* Left Column: Sprint stats breakdown */}
        <div className="lg:col-span-1 flex flex-col space-y-6">
          
          {/* Summary Aggregates */}
          <div className="bg-white border border-[#DFE1E6] rounded-md p-5 shadow-sm">
            <h3 className="font-bold text-[#172B4D] mb-4 text-sm flex items-center space-x-2 border-b border-[#DFE1E6] pb-2.5">
              <BarChart2 className="w-4 h-4 text-[#0052CC]" />
              <span>Consolidated Deliverables Summary</span>
            </h3>
            <div className="grid grid-cols-3 gap-4 text-center">
              <div className="bg-[#FAFBFC] rounded-lg p-3 border border-[#DFE1E6]">
                <div className="text-[10px] text-[#6B778C] font-bold uppercase tracking-wider mb-1">Tickets</div>
                <div className="text-lg font-bold text-[#172B4D]">{sprintData.totalTickets}</div>
              </div>
              <div className="bg-[#FAFBFC] rounded-lg p-3 border border-[#DFE1E6]">
                <div className="text-[10px] text-[#6B778C] font-bold uppercase tracking-wider mb-1">Story Pts</div>
                <div className="text-lg font-bold text-[#403294]">{sprintData.totalUSP}</div>
              </div>
              <div className="bg-[#FAFBFC] rounded-lg p-3 border border-[#DFE1E6]">
                <div className="text-[10px] text-[#6B778C] font-bold uppercase tracking-wider mb-1">Hours</div>
                <div className="text-lg font-bold text-[#006644]">{sprintData.totalHours}h</div>
              </div>
            </div>

            <div className="mt-4 space-y-3.5 pt-4 border-t border-[#DFE1E6] text-xs">
              <div className="flex justify-between items-center">
                <span className="text-[#6B778C] font-medium">Findability:</span>
                <span className="text-[#172B4D] font-semibold">{sprintData.findabilityTickets} tkts ({sprintData.findabilityUSP} SP)</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-[#6B778C] font-medium">BreakFix / Enhancements:</span>
                <span className="text-[#172B4D] font-semibold">{sprintData.breakfixTickets} tkts ({sprintData.breakfixUSP} SP)</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-[#6B778C] font-medium">Sprint Release Date:</span>
                <span className="text-[#0052CC] font-semibold">{sprintData.releaseDate}</span>
              </div>
            </div>
          </div>

          {/* Developer Performance Breakdown */}
          <div className="bg-white border border-[#DFE1E6] rounded-md p-5 shadow-sm">
            <h3 className="font-bold text-[#172B4D] mb-4 text-sm flex items-center space-x-2 border-b border-[#DFE1E6] pb-2.5">
              <Award className="w-4 h-4 text-[#403294]" />
              <span>Developer Contribution Breakdown</span>
            </h3>
            <div className="space-y-3 overflow-y-auto max-h-[350px] pr-1">
              {sprintData.devSummary.map(d => (
                <div key={d.name} className="flex items-center justify-between p-2.5 bg-white border border-[#DFE1E6] rounded-md hover:bg-[#FAFBFC] transition-all text-xs">
                  <span className="font-bold text-[#172B4D]">{d.name}</span>
                  <div className="flex items-center space-x-4">
                    <span className="text-[#6B778C]">{d.tickets} tkts</span>
                    <span className="text-[#403294] font-bold font-mono">{d.storyPoints} SP</span>
                    <span className="text-[#6B778C] font-mono">{d.hours}h</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Right Column: AI narrative card */}
        <div className="lg:col-span-2">
          <RecapCard sprintName={sprintId} initialText={recapText} />
        </div>

      </div>
    </div>
  );
}
