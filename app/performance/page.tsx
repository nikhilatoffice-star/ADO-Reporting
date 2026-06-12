'use client';

import React, { useEffect, useState } from 'react';
import { 
  BarChart, Bar, LineChart, Line, XAxis, YAxis, CartesianGrid, 
  Tooltip, Legend, ResponsiveContainer 
} from 'recharts';
import { Users, TrendingUp, BarChart3, AlertCircle } from 'lucide-react';
import DevPerformanceTable, { DevStats } from '../../components/tables/DevPerformanceTable';
import { TEAM_MEMBERS } from '../../lib/team-config';
import { TeamMember } from '../../lib/types';

export default function PerformancePage() {
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState<DevStats[]>([]);
  const [chartData, setChartData] = useState<any[]>([]);
  const [demoBanner, setDemoBanner] = useState(false);
  const [refreshTrigger, setRefreshTrigger] = useState(0);

  useEffect(() => {
    async function loadData() {
      setLoading(true);
      try {
        const params = new URLSearchParams(window.location.search);
        const res = await fetch(`/api/performance?${params.toString()}`);
        const data = await res.json();
        if (data.success) {
          setStats(data.stats);
          setChartData(data.chartData);
          setDemoBanner(data.isDemo);
        }
      } catch (err) {
        console.error('Failed to load performance metrics:', err);
      } finally {
        setLoading(false);
      }
    }

    loadData();
  }, [refreshTrigger]);

  const handleRefresh = () => {
    setRefreshTrigger(prev => prev + 1);
  };

  const devColors = [
    '#38bdf8', // sky-400
    '#f59e0b', // amber-500
    '#ec4899', // pink-500
    '#10b981', // emerald-500
    '#8b5cf6', // violet-500
    '#ef4444', // red-500
    '#6366f1', // indigo-500
  ];

  if (loading) {
    return (
      <div className="flex flex-col space-y-6 animate-pulse">
        <div className="h-10 bg-slate-900 rounded-lg w-1/3"></div>
        <div className="h-64 bg-slate-900 rounded-xl"></div>
        <div className="h-96 bg-slate-900 rounded-xl"></div>
      </div>
    );
  }

  return (
    <div className="flex flex-col space-y-8">
      {/* Header Panel */}
      <div className="flex justify-between items-center border-b border-[#DFE1E6] pb-5">
        <div>
          <h2 className="text-2xl font-bold tracking-tight text-[#172B4D] flex items-center space-x-2">
            <Users className="w-6 h-6 text-[#0052CC]" />
            <span>Developer Performance & Resource KPIs</span>
          </h2>
          <p className="text-[#6B778C] text-sm mt-1">
            Track deliverables, ticket velocities, and leadership assessments
          </p>
        </div>
      </div>

      {/* Demo Warning Banner */}
      {demoBanner && (
        <div className="flex items-center space-x-3 bg-[#FFFAE6] border border-[#FF8B00] text-[#172B4D] px-4 py-3 rounded text-sm print:hidden">
          <AlertCircle className="w-5 h-5 text-[#FF8B00] flex-shrink-0" />
          <span>
            <strong>Demo Mode Active</strong>: Displaying high-fidelity mock sprint values. Update variables in your <code>.env.local</code> to pull live OData metrics.
          </span>
        </div>
      )}

      {/* Main KPI Table */}
      <DevPerformanceTable initialStats={stats} onRefresh={handleRefresh} />

      {/* Recharts Performance Visualizations */}
      <div className="grid grid-cols-1 xl:grid-cols-2 gap-8">
        {/* Ticket Velocity Grouped Bar Chart */}
        <div className="bg-white border border-[#DFE1E6] rounded-md p-5 shadow-sm">
          <div className="flex items-center space-x-2 border-b border-[#DFE1E6] pb-3 mb-4">
            <BarChart3 className="w-5 h-5 text-[#0052CC]" />
            <h4 className="font-bold text-[#172B4D]">Tickets Delivered per Developer</h4>
          </div>
          <div className="h-80 w-full text-xs">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={chartData} margin={{ top: 10, right: 10, left: -25, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#EBECF0" />
                <XAxis dataKey="sprint" stroke="#6B778C" />
                <YAxis stroke="#6B778C" />
                <Tooltip 
                  contentStyle={{ backgroundColor: '#FFFFFF', borderColor: '#DFE1E6', color: '#172B4D', boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)' }}
                  itemStyle={{ fontSize: '11px' }}
                />
                <Legend iconType="circle" />
                {TEAM_MEMBERS.map((dev, idx) => (
                  <Bar 
                    key={dev.name} 
                    dataKey={dev.name} 
                    name={dev.name} 
                    fill={devColors[idx % devColors.length]} 
                    radius={[2, 2, 0, 0]}
                  />
                ))}
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* USP Trend Over Time Line Chart */}
        <div className="bg-white border border-[#DFE1E6] rounded-md p-5 shadow-sm">
          <div className="flex items-center space-x-2 border-b border-[#DFE1E6] pb-3 mb-4">
            <TrendingUp className="w-5 h-5 text-[#0052CC]" />
            <h4 className="font-bold text-[#172B4D]">User Story Points (USP) Trend</h4>
          </div>
          <div className="h-80 w-full text-xs">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={chartData} margin={{ top: 10, right: 10, left: -25, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#EBECF0" />
                <XAxis dataKey="sprint" stroke="#6B778C" />
                <YAxis stroke="#6B778C" />
                <Tooltip 
                  contentStyle={{ backgroundColor: '#FFFFFF', borderColor: '#DFE1E6', color: '#172B4D', boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)' }}
                  itemStyle={{ fontSize: '11px' }}
                />
                <Legend iconType="circle" />
                {TEAM_MEMBERS.map((dev, idx) => (
                  <Line 
                    key={dev.name} 
                    type="monotone"
                    dataKey={`${dev.name}_usp`} 
                    name={dev.name} 
                    stroke={devColors[idx % devColors.length]} 
                    strokeWidth={2}
                    dot={{ r: 3 }}
                    activeDot={{ r: 5 }}
                  />
                ))}
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>
    </div>
  );
}
