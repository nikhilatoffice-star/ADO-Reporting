import { fetchOData } from "@/lib/ado-client";
import { QUERIES } from "@/lib/queries";
import BugCharts from "./BugCharts";
import BugTable from "./BugTable";
import { BugItem } from "@/lib/types";

export default async function BugsPage() {
  const rawBugs = await fetchOData<any>(QUERIES.BUGS);

  const bugs: BugItem[] = rawBugs.map((b) => ({
    id: b.WorkItemId,
    title: b.Title,
    state: b.State,
    priority: b.Priority || 3, // Default to 3 if missing
    createdDate: b.CreatedDate,
    closedDate: b.ClosedDate,
    assignee: b.AssignedTo?.UserName || "Unassigned",
    sprintName: b.Iteration?.IterationName || "Unknown",
  }));

  return (
    <div className="p-8 pb-24">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-[#172B4D] tracking-tight">Bug Trends & Analytics</h1>
        <p className="text-[#6B778C] mt-1">Review bug creation, resolution rates, and open bug aging.</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-8">
        <BugCharts bugs={bugs} />
      </div>

      <div>
        <h2 className="text-xl font-bold text-[#172B4D] mb-4 tracking-tight">Oldest Active Bugs</h2>
        <BugTable bugs={bugs} />
      </div>
    </div>
  );
}
