"use client";

import React, { useMemo } from "react";
import { BugItem } from "@/lib/types";

export default function BugTable({ bugs }: { bugs: BugItem[] }) {
  const oldestActiveBugs = useMemo(() => {
    return bugs
      .filter((b) => b.state === "Active")
      .map((b) => {
        let daysOpen = 0;
        if (b.createdDate) {
          const created = new Date(b.createdDate).getTime();
          const now = new Date().getTime();
          daysOpen = Math.floor((now - created) / (1000 * 3600 * 24));
        }
        return { ...b, daysOpen };
      })
      .sort((a, b) => b.daysOpen - a.daysOpen)
      .slice(0, 15); // Show top 15 oldest
  }, [bugs]);

  if (oldestActiveBugs.length === 0) {
    return (
      <div className="bg-white border border-[#DFE1E6] rounded-md p-8 text-center text-[#6B778C] shadow-sm">
        No active bugs found. Excellent!
      </div>
    );
  }

  return (
    <div className="bg-white border border-[#DFE1E6] rounded-md shadow-sm overflow-hidden">
      <div className="overflow-x-auto">
        <table className="w-full text-left border-collapse">
          <thead>
            <tr className="bg-[#FAFBFC] border-b border-[#DFE1E6]">
              <th className="py-3 px-4 text-xs font-bold text-[#6B778C] uppercase tracking-wider">ID</th>
              <th className="py-3 px-4 text-xs font-bold text-[#6B778C] uppercase tracking-wider">Title</th>
              <th className="py-3 px-4 text-xs font-bold text-[#6B778C] uppercase tracking-wider text-center">Priority</th>
              <th className="py-3 px-4 text-xs font-bold text-[#6B778C] uppercase tracking-wider">Assignee</th>
              <th className="py-3 px-4 text-xs font-bold text-[#6B778C] uppercase tracking-wider">Sprint</th>
              <th className="py-3 px-4 text-xs font-bold text-[#6B778C] uppercase tracking-wider">Created</th>
              <th className="py-3 px-4 text-xs font-bold text-[#6B778C] uppercase tracking-wider">Age</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-[#DFE1E6]">
            {oldestActiveBugs.map((bug) => {
              const isVeryOld = bug.daysOpen > 30;
              return (
                <tr key={bug.id} className="hover:bg-[#FAFBFC] transition-colors">
                  <td className="py-3 px-4 text-sm font-medium">
                    <a href={`https://dev.azure.com/org/project/_workitems/edit/${bug.id}`} target="_blank" rel="noreferrer" className="text-[#0052CC] hover:underline">
                      {bug.id}
                    </a>
                  </td>
                  <td className="py-3 px-4 text-sm text-[#172B4D] max-w-md truncate font-medium" title={bug.title}>
                    {bug.title}
                  </td>
                  <td className="py-3 px-4 text-sm text-center">
                    <span className={`inline-flex items-center justify-center w-6 h-6 rounded-full text-xs font-bold ${
                      bug.priority === 1 ? "bg-[#FFEBE6] text-[#BF2600]" :
                      bug.priority === 2 ? "bg-[#FFFAE6] text-[#FF8B00]" :
                      bug.priority === 3 ? "bg-[#E9F2FF] text-[#0052CC]" :
                      "bg-[#DFE1E6] text-[#42526E]"
                    }`}>
                      {bug.priority}
                    </span>
                  </td>
                  <td className="py-3 px-4 text-sm text-[#172B4D]">{bug.assignee}</td>
                  <td className="py-3 px-4 text-sm text-[#172B4D]">{bug.sprintName}</td>
                  <td className="py-3 px-4 text-sm text-[#6B778C]">
                    {bug.createdDate ? new Date(bug.createdDate).toLocaleDateString() : "Unknown"}
                  </td>
                  <td className="py-3 px-4 text-sm font-medium">
                    <span className={isVeryOld ? "text-[#BF2600]" : "text-[#172B4D]"}>
                      {bug.daysOpen} days
                    </span>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}
