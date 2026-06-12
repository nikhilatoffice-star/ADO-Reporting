'use client';

import React from 'react';
import {
  LineChart, Line, XAxis, YAxis, CartesianGrid,
  Tooltip, Legend, ResponsiveContainer
} from 'recharts';
import { TrendingUp, BarChart3 } from 'lucide-react';

interface VelocityData {
  sprint: string;
  findability: number;
  breakfix: number;
  total: number;
}

interface TrendData {
  sprint: string;
  fullNames: string;
  tickets: number;
  usp: number;
  hours: number;
}

interface VelocityChartClientProps {
  velocityData: VelocityData[];
  trendData: TrendData[];
}

const CustomTooltip = ({ active, payload, label }: any) => {
  if (active && payload && payload.length) {
    const fullNames = payload[0].payload.fullNames;
    return (
      <div className="bg-white border border-[#DFE1E6] p-3 shadow-md rounded text-xs text-[#172B4D]">
        <p className="font-bold mb-1 text-sm text-[#0052CC]">{label}</p>
        {fullNames && (
          <p className="text-[10px] text-[#6B778C] mb-3 max-w-[200px] leading-tight">
            {fullNames}
          </p>
        )}
        {payload.map((entry: any, index: number) => (
          <div key={`item-${index}`} className="flex items-center justify-between space-x-4 my-1">
            <div className="flex items-center space-x-2">
              <div className="w-2 h-2 rounded-full" style={{ backgroundColor: entry.color }} />
              <span className="font-medium text-[#42526E]">{entry.name}</span>
            </div>
            <span className="font-bold">{entry.value}</span>
          </div>
        ))}
      </div>
    );
  }
  return null;
};

export default function VelocityChartClient({ velocityData, trendData }: VelocityChartClientProps) {
  return (
    <div className="grid grid-cols-1 xl:grid-cols-2 gap-8">
      {/* Velocity Line Chart */}
      <div className="bg-white border border-[#DFE1E6] rounded-md p-6 shadow-sm flex flex-col">
        <div className="flex items-center space-x-2 border-b border-[#DFE1E6] pb-3 mb-5">
          <BarChart3 className="w-5 h-5 text-[#0052CC]" />
          <div>
            <h4 className="font-bold text-[#172B4D] text-sm">Sprint Velocity Overview</h4>
            <p className="text-[11px] text-[#6B778C]">Tickets resolved per team per sprint</p>
          </div>
        </div>
        <div className="h-80 w-full text-xs">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={velocityData} margin={{ top: 10, right: 10, left: -25, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#EBECF0" />
              <XAxis dataKey="sprint" stroke="#6B778C" />
              <YAxis stroke="#6B778C" />
              <Tooltip content={<CustomTooltip />} />
              <Legend iconType="circle" />
              <Line
                type="monotone"
                dataKey="findability"
                name="Findability/ECOM"
                stroke="#f97316"
                strokeWidth={3}
                dot={{ r: 4 }}
                activeDot={{ r: 6 }}
              />
              <Line
                type="monotone"
                dataKey="breakfix"
                name="BreakFix/CRM"
                stroke="#38bdf8"
                strokeWidth={3}
                dot={{ r: 4 }}
                activeDot={{ r: 6 }}
              />
              <Line
                type="monotone"
                dataKey="total"
                name="Total tickets"
                stroke="#94a3b8"
                strokeWidth={2}
                strokeDasharray="4 4"
                dot={{ r: 3 }}
              />
            </LineChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Smooth Curves Trend Lines Chart */}
      <div className="bg-white border border-[#DFE1E6] rounded-md p-6 shadow-sm flex flex-col">
        <div className="flex items-center space-x-2 border-b border-[#DFE1E6] pb-3 mb-5">
          <TrendingUp className="w-5 h-5 text-[#0052CC]" />
          <div>
            <h4 className="font-bold text-[#172B4D] text-sm">Long-term Performance Trends</h4>
            <p className="text-[11px] text-[#6B778C]">Moving averages over the last 20 sprints</p>
          </div>
        </div>
        <div className="h-80 w-full text-xs">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={trendData} margin={{ top: 10, right: 15, left: -25, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#EBECF0" />
              <XAxis dataKey="sprint" stroke="#6B778C" interval={2} />

              {/* Dual Y-Axes */}
              <YAxis yAxisId="left" stroke="#6B778C" label={{ value: 'Count / USP', angle: -90, position: 'insideLeft', offset: 10, fill: '#6B778C' }} />
              <YAxis yAxisId="right" orientation="right" stroke="#006644" label={{ value: 'Avg Hours', angle: 90, position: 'insideRight', offset: 10, fill: '#006644' }} />

              <Tooltip content={<CustomTooltip />} />
              <Legend iconType="circle" />
              <Line
                yAxisId="left"
                type="basis"
                dataKey="tickets"
                name="Total Tickets"
                stroke="#6366f1"
                strokeWidth={2}
                dot={false}
              />
              <Line
                yAxisId="left"
                type="basis"
                dataKey="usp"
                name="Total USP"
                stroke="#a855f7"
                strokeWidth={2}
                dot={false}
              />
              <Line
                yAxisId="right"
                type="basis"
                dataKey="hours"
                name="Avg Hours / Ticket"
                stroke="#10b981"
                strokeWidth={2}
                dot={false}
              />
            </LineChart>
          </ResponsiveContainer>
        </div>
      </div>
    </div>
  );
}
