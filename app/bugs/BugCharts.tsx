"use client";

import React, { useMemo } from "react";
import { BugItem } from "@/lib/types";
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  BarChart,
  Bar,
  Cell,
} from "recharts";
import { Activity, AlertTriangle } from "lucide-react";

export default function BugCharts({ bugs }: { bugs: BugItem[] }) {
  const { trendData, priorityData } = useMemo(() => {
    const sprintsMap: Record<string, { sprint: string; opened: number; closed: number }> = {};
    const priorityCounts: Record<string, number> = { "1": 0, "2": 0, "3": 0, "4": 0 };

    bugs.forEach((b) => {
      // Priority
      const p = b.priority?.toString() || "3";
      if (priorityCounts[p] !== undefined) priorityCounts[p]++;

      // Sprint opened vs closed
      if (!sprintsMap[b.sprintName]) {
        sprintsMap[b.sprintName] = { sprint: b.sprintName, opened: 0, closed: 0 };
      }
      sprintsMap[b.sprintName].opened++;
      
      if (b.state === "Closed" || b.closedDate) {
        // Technically it might be closed in a different sprint, but we'll approximate based on the sprint it was tagged in, or just count closed.
        // For accurate tracking, we'd look at closedDate, but using sprintName simplifies it for the mock.
        sprintsMap[b.sprintName].closed++;
      }
    });

    // Sort sprints numerically if they are "Sprint X"
    const sortedSprints = Object.values(sprintsMap).sort((a, b) => {
      const numA = parseInt(a.sprint.replace(/\\D/g, "")) || 0;
      const numB = parseInt(b.sprint.replace(/\\D/g, "")) || 0;
      return numA - numB;
    });

    const pData = [
      { name: "P1 (Critical)", value: priorityCounts["1"] || 0, color: "#BF2600" },
      { name: "P2 (High)", value: priorityCounts["2"] || 0, color: "#FF8B00" },
      { name: "P3 (Medium)", value: priorityCounts["3"] || 0, color: "#0052CC" },
      { name: "P4 (Low)", value: priorityCounts["4"] || 0, color: "#42526E" },
    ];

    return { trendData: sortedSprints, priorityData: pData };
  }, [bugs]);

  return (
    <>
      <div className="bg-white border border-[#DFE1E6] rounded-md p-6 shadow-sm flex flex-col">
        <div className="flex items-center space-x-2 border-b border-[#DFE1E6] pb-3 mb-5">
          <Activity className="w-5 h-5 text-[#0052CC]" />
          <div>
            <h4 className="font-bold text-[#172B4D] text-sm">Bug Discovery vs Resolution</h4>
            <p className="text-[11px] text-[#6B778C]">Opened vs Closed bugs per sprint</p>
          </div>
        </div>
        <div className="h-72 w-full text-xs">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={trendData} margin={{ top: 10, right: 10, left: -25, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#EBECF0" />
              <XAxis dataKey="sprint" stroke="#6B778C" />
              <YAxis stroke="#6B778C" />
              <Tooltip
                contentStyle={{ backgroundColor: "#FFFFFF", borderColor: "#DFE1E6", color: "#172B4D", boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)' }}
                itemStyle={{ fontSize: "11px" }}
              />
              <Legend iconType="circle" />
              <Line
                type="monotone"
                dataKey="opened"
                name="Bugs Opened"
                stroke="#ef4444"
                strokeWidth={3}
                dot={{ r: 4 }}
                activeDot={{ r: 6 }}
              />
              <Line
                type="monotone"
                dataKey="closed"
                name="Bugs Closed"
                stroke="#10b981"
                strokeWidth={3}
                dot={{ r: 4 }}
                activeDot={{ r: 6 }}
              />
            </LineChart>
          </ResponsiveContainer>
        </div>
      </div>

      <div className="bg-white border border-[#DFE1E6] rounded-md p-6 shadow-sm flex flex-col">
        <div className="flex items-center space-x-2 border-b border-[#DFE1E6] pb-3 mb-5">
          <AlertTriangle className="w-5 h-5 text-[#FF8B00]" />
          <div>
            <h4 className="font-bold text-[#172B4D] text-sm">Bugs by Priority</h4>
            <p className="text-[11px] text-[#6B778C]">Distribution across severity levels</p>
          </div>
        </div>
        <div className="h-72 w-full text-xs">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={priorityData} margin={{ top: 10, right: 10, left: -25, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#EBECF0" />
              <XAxis dataKey="name" stroke="#6B778C" />
              <YAxis stroke="#6B778C" />
              <Tooltip
                cursor={{ fill: "#FAFBFC" }}
                contentStyle={{ backgroundColor: "#FFFFFF", borderColor: "#DFE1E6", color: "#172B4D", boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)' }}
                itemStyle={{ fontSize: "11px" }}
              />
              <Bar dataKey="value" radius={[4, 4, 0, 0]}>
                {priorityData.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={entry.color} />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>
    </>
  );
}
