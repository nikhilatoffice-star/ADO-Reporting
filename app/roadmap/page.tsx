import { supabase } from "@/lib/supabase";
import GanttChart from "./GanttChartClient";
import { RoadmapItem } from "@/lib/types";

export const dynamic = 'force-dynamic';

const EXCEL_MOCK_ITEMS: RoadmapItem[] = [
  { id: "M1", title: "TP.com FP.com INT Unified eComm Platform - Phase 1 (aka MVP) ✔", type: "Epic", state: "Completed", team: "PROJECTS / TEAM [CORT/VALENTINA]", startSprint: "Sprint 1", endSprint: "Sprint 11" },
  { id: "M2", title: "TP.com FP.com INT Unified eComm Platform - Phase 2", type: "Epic", state: "In Progress", team: "PROJECTS / TEAM [CORT/VALENTINA]", startSprint: "Sprint 8", endSprint: "Sprint 13" },
  { id: "M3", title: "TP FP SF CRM - Phase 1 / Phase 2", type: "Epic", state: "In Progress", team: "PROJECTS / TEAM [CORT/VALENTINA]", startSprint: "Sprint 4", endSprint: "Sprint 14" },
  { id: "M4", title: "Palantir AI POC / SDLC AI POC", type: "Feature", state: "In Progress", team: "PROJECTS / TEAM [BALARITHI]", startSprint: "Sprint 6", endSprint: "Sprint 14" },
  { id: "M5", title: "NEW Pricing Integration Azure for fp.com (Guest and LoggedIn users)", type: "Epic", state: "In Progress", team: "PROJECTS / TEAM [PIM / INTEGRATIONS]", startSprint: "Sprint 1", endSprint: "Sprint 12" },
  { id: "M6", title: "Quick Order 2.0 ✔", type: "Feature", state: "Completed", team: "ENHANCEMENTS PRODUCT TEAM", startSprint: "Sprint 1", endSprint: "Sprint 3" },
  { id: "M7", title: "Web AI Search (TOOLS + COSTS DISCOVERY WIP / PROJECT LATER IN 2026 IF APPROVED BY ELT)", type: "Epic", state: "New", team: "ENHANCEMENTS PRODUCT TEAM", startSprint: "Sprint 18", endSprint: "Sprint 22" },
  { id: "M8", title: "BreakFix Q1 priorities - latest priorities ✔", type: "Feature", state: "Completed", team: "BREAKFIX PRODUCT TEAM", startSprint: "Sprint 1", endSprint: "Sprint 6" },
  { id: "M9", title: "BreakFix Q2 priorities - latest priorities", type: "Feature", state: "In Progress", team: "BREAKFIX PRODUCT TEAM", startSprint: "Sprint 7", endSprint: "Sprint 12" },
  { id: "M10", title: "SF CRM Q1 priorities - Phase 1 items ✔", type: "Feature", state: "Completed", team: "SF COMMERCE TEAM", startSprint: "Sprint 1", endSprint: "Sprint 6" },
  { id: "M11", title: "SEO / SEM / GA4 Q1 priorities - various ongoings ✔", type: "Feature", state: "Completed", team: "SEO / SEM / GA4 TEAM", startSprint: "Sprint 1", endSprint: "Sprint 6" }
];

export default async function RoadmapPage() {
  const { data: dbItems, error } = await supabase.from('roadmap_items').select('*');
  
  let formattedItems: RoadmapItem[] = [];
  
  if (dbItems && dbItems.length > 0) {
    formattedItems = dbItems.map((d: any) => ({
      id: d.id,
      title: d.title,
      type: d.type,
      state: d.state,
      team: d.team,
      startSprint: d.start_sprint,
      endSprint: d.end_sprint,
      progress: d.progress || 0
    }));
  } else {
    // Initial seed
    formattedItems = EXCEL_MOCK_ITEMS;
  }

  return (
    <div className="p-8 pb-24">
      <div className="flex justify-between items-end mb-8">
        <div>
          <h1 className="text-3xl font-bold text-[#172B4D] tracking-tight">2026 eComm Roadmap</h1>
          <p className="text-[#6B778C] mt-1">Strategic initiatives and major features timeline.</p>
        </div>
      </div>

      <div className="bg-white rounded-md shadow-sm border border-[#000] overflow-hidden">
        <div className="p-0">
          <GanttChart items={formattedItems} />
        </div>
      </div>
    </div>
  );
}
