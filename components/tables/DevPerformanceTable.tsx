'use client';

import React, { useState } from 'react';
import { Edit2, Check, X } from 'lucide-react';
import StatusBadge from '../ui/StatusBadge';
import { TeamMember } from '../../lib/types';

export interface DevStats {
  developerName: string;
  role: string;
  type: string;
  team: string;
  last5Tickets: number;
  last5Usp: number;
  last5SprintsCount: number;
  last5AvgTickets: number;
  last5AvgUsp: number;
  allTimeTickets: number;
  allTimeUsp: number;
  allTimeSprintsCount: number;
  allTimeAvgTickets: number;
  allTimeAvgUsp: number;
  rating: string;
  leadership: string;
  techCompetence: string;
  notes: string;
  sprintsHistory?: { sprintName: string; tickets: number; usp: number }[];
  baseTickets?: number;
  baseUsp?: number;
  baseSprints?: number;
}

interface DevPerformanceTableProps {
  initialStats: DevStats[];
  onRefresh: () => void;
}

export default function DevPerformanceTable({ initialStats, onRefresh }: DevPerformanceTableProps) {
  const [editingRow, setEditingRow] = useState<string | null>(null);
  const [editData, setEditData] = useState<Partial<DevStats> | null>(null);
  const [isSaving, setIsSaving] = useState(false);
  const [viewMode, setViewMode] = useState<'summary' | 'matrix'>('summary');

  const startEdit = (row: DevStats) => {
    setEditingRow(row.developerName);
    setEditData({ ...row });
  };

  const cancelEdit = () => {
    setEditingRow(null);
    setEditData(null);
  };

  const handleInputChange = (field: keyof DevStats, value: string | number) => {
    if (editData) {
      setEditData({
        ...editData,
        [field]: value
      });
    }
  };

  const saveEdit = async () => {
    if (!editData || !editingRow) return;
    setIsSaving(true);

    try {
      const payload = {
        developerPerformance: {
          [editingRow]: {
            role: editData.role,
            type: editData.type,
            team: editData.team,
            notes: editData.notes,
            leadershipRating: editData.leadership,
            techRating: editData.techCompetence,
            baseTickets: editData.baseTickets,
            baseUsp: editData.baseUsp,
            baseSprints: editData.baseSprints
          }
        }
      };

      const res = await fetch('/api/custom', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(payload)
      });

      if (!res.ok) {
        throw new Error('Failed to save developer edits');
      }

      setEditingRow(null);
      setEditData(null);
      onRefresh(); // Refresh parent state
    } catch (err) {
      console.error(err);
      alert('Error saving changes');
    } finally {
      setIsSaving(false);
    }
  };

  // Group by team
  const teamsMap = new Map<string, DevStats[]>();
  initialStats.forEach(stat => {
    const team = stat.team || 'Unassigned';
    if (!teamsMap.has(team)) teamsMap.set(team, []);
    teamsMap.get(team)!.push(stat);
  });

  const uniqueSprints = initialStats[0]?.sprintsHistory?.map(s => s.sprintName) || [];

  return (
    <div className="bg-white border border-[#DFE1E6] rounded-md overflow-hidden shadow-sm">
      <div className="p-5 border-b border-[#DFE1E6] flex justify-between items-center bg-white">
        <div>
          <h3 className="text-lg font-bold text-[#172B4D]">Developer KPIs & Performance</h3>
          <p className="text-xs text-[#6B778C] mt-1">
            Aggregated sprint data linked with leadership evaluations (Click edit icon to modify configs)
          </p>
        </div>
        <div className="flex bg-[#EBECF0] rounded-md p-1">
          <button 
            onClick={() => setViewMode('summary')}
            className={`px-3 py-1.5 text-xs font-bold rounded-sm transition-colors ${viewMode === 'summary' ? 'bg-white text-[#0052CC] shadow-sm' : 'text-[#6B778C] hover:text-[#172B4D]'}`}
          >
            Summary View
          </button>
          <button 
            onClick={() => setViewMode('matrix')}
            className={`px-3 py-1.5 text-xs font-bold rounded-sm transition-colors ${viewMode === 'matrix' ? 'bg-white text-[#0052CC] shadow-sm' : 'text-[#6B778C] hover:text-[#172B4D]'}`}
          >
            Sprint Matrix
          </button>
        </div>
      </div>

      <div className="overflow-x-auto">
        <table className="w-full text-left border-collapse text-sm">
          <thead>
            <tr className="bg-[#FAFBFC] text-[#6B778C] border-b border-[#DFE1E6] text-xs font-bold tracking-wider uppercase">
              <th className="py-4 px-5 border-b-0" rowSpan={viewMode === 'summary' ? 2 : 1}>Developer</th>
              <th className="py-4 px-4 border-b-0" rowSpan={viewMode === 'summary' ? 2 : 1}>Role</th>
              <th className="py-4 px-4 border-b-0" rowSpan={viewMode === 'summary' ? 2 : 1}>Type</th>
              <th className="py-4 px-4 border-b-0" rowSpan={viewMode === 'summary' ? 2 : 1}>Team</th>
              {viewMode === 'summary' ? (
                <>
                  <th colSpan={5} className="py-2 px-3 text-center border-l border-b border-[#DFE1E6] bg-[#E9F2FF] text-[#172B4D]">Section A: Last 5 Sprints</th>
                  <th colSpan={5} className="py-2 px-3 text-center border-l border-b border-[#DFE1E6] bg-[#FFFAE6] text-[#172B4D]">Section B: Overall Sprints</th>
                  <th className="py-4 px-4 text-center border-l border-[#DFE1E6] border-b-0" rowSpan={2}>Rating</th>
                  <th className="py-4 px-4 text-center border-b-0" rowSpan={2}>Leadership</th>
                  <th className="py-4 px-4 text-center border-b-0" rowSpan={2}>Tech Competence</th>
                  <th className="py-4 px-5 border-b-0" rowSpan={2}>Notes</th>
                  <th className="py-4 px-5 text-right border-b-0" rowSpan={2}>Actions</th>
                </>
              ) : (
                <>
                  <th className="py-4 px-3 text-center bg-[#FFF4D2] border-l border-[#DFE1E6]">Tot</th>
                  <th className="py-4 px-3 text-center bg-[#FFF4D2]">Avg</th>
                  {uniqueSprints.map(s => (
                    <th key={s} className="py-4 px-3 text-center border-l border-[#DFE1E6] whitespace-nowrap bg-[#E9F2FF]">{s.replace('Sprint ', 'S')}</th>
                  ))}
                </>
              )}
            </tr>
            {viewMode === 'summary' && (
              <tr className="bg-[#FAFBFC] text-[#6B778C] border-b border-[#DFE1E6] text-[10px] font-bold tracking-wider uppercase">
                {/* Last 5 Sprints */}
                <th className="py-2 px-2 text-center border-l border-[#DFE1E6]">Num Tkt</th>
                <th className="py-2 px-2 text-center border-l border-[#DFE1E6]">User S.P</th>
                <th className="py-2 px-2 text-center border-l border-[#DFE1E6]">Num Spr</th>
                <th className="py-2 px-2 text-center border-l border-[#DFE1E6]">Tkt / S</th>
                <th className="py-2 px-2 text-center border-l border-[#DFE1E6]">USP / S</th>
                {/* Overall Sprints */}
                <th className="py-2 px-2 text-center border-l border-[#DFE1E6]">Num Tkt</th>
                <th className="py-2 px-2 text-center border-l border-[#DFE1E6]">User S.P</th>
                <th className="py-2 px-2 text-center border-l border-[#DFE1E6]">Num Spr</th>
                <th className="py-2 px-2 text-center border-l border-[#DFE1E6]">Tkt / S</th>
                <th className="py-2 px-2 text-center border-l border-[#DFE1E6]">USP / S</th>
              </tr>
            )}
          </thead>
          <tbody className="divide-y divide-[#DFE1E6]">
            {Array.from(teamsMap.entries()).map(([teamName, devs]) => (
              <React.Fragment key={teamName}>
                {/* Team Divider Row */}
                <tr className="bg-[#FFF4D2]">
                  <td colSpan={viewMode === 'summary' ? 15 : 6 + uniqueSprints.length} className="py-2 px-5 font-extrabold text-[#172B4D] text-xs uppercase tracking-widest border-y border-[#DFE1E6]">
                    {teamName}
                  </td>
                </tr>
                
                {devs.map(row => {
                  const isEditing = editingRow === row.developerName;
                  
                  if (viewMode === 'summary') {
                    return (
                      <tr 
                        key={row.developerName} 
                        className={`hover:bg-[#FAFBFC] transition-colors bg-white ${
                          isEditing ? 'bg-[#E9F2FF] hover:bg-[#E9F2FF]' : ''
                        }`}
                      >
                        {/* Developer Name */}
                        <td className="py-3.5 px-5 font-bold text-[#172B4D] whitespace-nowrap">
                          {row.developerName}
                        </td>

                        {/* Role */}
                        <td className="py-3.5 px-4 whitespace-nowrap">
                          {isEditing ? (
                            <input
                              type="text"
                              value={editData?.role || ''}
                              onChange={(e) => handleInputChange('role', e.target.value)}
                              className="bg-white border border-[#DFE1E6] rounded px-2 py-1 text-[#172B4D] w-32 focus:outline-none focus:border-[#0052CC] text-xs"
                            />
                          ) : (
                            <span className="text-[#172B4D]">{row.role}</span>
                          )}
                        </td>

                        {/* Type */}
                        <td className="py-3.5 px-4 whitespace-nowrap">
                          {isEditing ? (
                            <select
                              value={editData?.type || ''}
                              onChange={(e) => handleInputChange('type', e.target.value)}
                              className="bg-white border border-[#DFE1E6] rounded px-2 py-1 text-[#172B4D] focus:outline-none focus:border-[#0052CC] text-xs"
                            >
                              <option value="FTE">FTE</option>
                              <option value="Consultant Offshore">Consultant Offshore</option>
                              <option value="Consultant Onshore">Consultant Onshore</option>
                            </select>
                          ) : (
                            <span className="text-[#6B778C] text-xs">{row.type}</span>
                          )}
                        </td>

                        {/* Team */}
                        <td className="py-3.5 px-4 whitespace-nowrap">
                          {isEditing ? (
                            <input
                              type="text"
                              value={editData?.team || ''}
                              onChange={(e) => handleInputChange('team', e.target.value)}
                              className="bg-white border border-[#DFE1E6] rounded px-2 py-1 text-[#172B4D] w-32 focus:outline-none focus:border-[#0052CC] text-xs"
                            />
                          ) : (
                            <span className="text-[#172B4D]">{row.team}</span>
                          )}
                        </td>

                        {/* Section A: Last 5 Sprints */}
                        <td className="py-3.5 px-2 text-center text-[#172B4D] font-medium border-l border-[#DFE1E6] bg-[#F4F5F7]">{row.last5Tickets}</td>
                        <td className="py-3.5 px-2 text-center text-[#0052CC] font-bold border-l border-[#DFE1E6] bg-[#F4F5F7]">{row.last5Usp}</td>
                        <td className="py-3.5 px-2 text-center text-[#6B778C] border-l border-[#DFE1E6] bg-[#F4F5F7]">{row.last5SprintsCount}</td>
                        <td className="py-3.5 px-2 text-center text-[#172B4D] border-l border-[#DFE1E6] bg-[#F4F5F7]">{row.last5AvgTickets.toFixed(1)}</td>
                        <td className="py-3.5 px-2 text-center text-[#0052CC] border-l border-[#DFE1E6] bg-[#F4F5F7]">{row.last5AvgUsp.toFixed(1)}</td>

                        {/* Section B: Overall Sprints */}
                        <td className="py-3.5 px-2 text-center border-l border-[#DFE1E6]">
                          {isEditing ? (
                            <div className="flex flex-col items-center">
                              <span className="text-[9px] text-[#6B778C] font-bold">Base Tkt</span>
                              <input
                                type="number"
                                value={editData?.baseTickets ?? 0}
                                onChange={(e) => handleInputChange('baseTickets', e.target.value ? parseInt(e.target.value, 10) : 0)}
                                className="bg-white border border-[#DFE1E6] rounded px-1 py-1 text-[#172B4D] w-12 text-center focus:outline-none focus:border-[#0052CC] text-xs"
                              />
                            </div>
                          ) : (
                            <span className="text-[#172B4D] font-medium">{row.allTimeTickets}</span>
                          )}
                        </td>
                        <td className="py-3.5 px-2 text-center border-l border-[#DFE1E6]">
                          {isEditing ? (
                            <div className="flex flex-col items-center">
                              <span className="text-[9px] text-[#6B778C] font-bold">Base USP</span>
                              <input
                                type="number"
                                value={editData?.baseUsp ?? 0}
                                onChange={(e) => handleInputChange('baseUsp', e.target.value ? parseFloat(e.target.value) : 0)}
                                className="bg-white border border-[#DFE1E6] rounded px-1 py-1 text-[#0052CC] w-12 text-center focus:outline-none focus:border-[#0052CC] text-xs"
                              />
                            </div>
                          ) : (
                            <span className="text-[#0052CC] font-bold">{row.allTimeUsp}</span>
                          )}
                        </td>
                        <td className="py-3.5 px-2 text-center border-l border-[#DFE1E6]">
                          {isEditing ? (
                            <div className="flex flex-col items-center">
                              <span className="text-[9px] text-[#6B778C] font-bold">Base Spr</span>
                              <input
                                type="number"
                                value={editData?.baseSprints ?? 0}
                                onChange={(e) => handleInputChange('baseSprints', e.target.value ? parseInt(e.target.value, 10) : 0)}
                                className="bg-white border border-[#DFE1E6] rounded px-1 py-1 text-[#6B778C] w-12 text-center focus:outline-none focus:border-[#0052CC] text-xs"
                              />
                            </div>
                          ) : (
                            <span className="text-[#6B778C]">{row.allTimeSprintsCount}</span>
                          )}
                        </td>
                        <td className="py-3.5 px-2 text-center text-[#172B4D] border-l border-[#DFE1E6]">{row.allTimeAvgTickets.toFixed(1)}</td>
                        <td className="py-3.5 px-2 text-center text-[#0052CC] border-l border-[#DFE1E6]">{row.allTimeAvgUsp.toFixed(1)}</td>

                        {/* Calculated Overall Rating */}
                        <td className="py-3.5 px-4 text-center whitespace-nowrap border-l border-[#DFE1E6]">
                          <StatusBadge status={row.rating} />
                        </td>

                        {/* Leadership Rating */}
                        <td className="py-3.5 px-4 text-center whitespace-nowrap">
                          {isEditing ? (
                            <select
                              value={editData?.leadership || ''}
                              onChange={(e) => handleInputChange('leadership', e.target.value)}
                              className="bg-white border border-[#DFE1E6] rounded px-2 py-1 text-[#172B4D] focus:outline-none focus:border-[#0052CC] text-xs"
                            >
                              <option value="GOOD">GOOD</option>
                              <option value="AVG">AVG</option>
                              <option value="LOW">LOW</option>
                              <option value="WIP">WIP</option>
                            </select>
                          ) : (
                            <StatusBadge status={row.leadership} />
                          )}
                        </td>

                        {/* Tech Competence Rating */}
                        <td className="py-3.5 px-4 text-center whitespace-nowrap">
                          {isEditing ? (
                            <select
                              value={editData?.techCompetence || ''}
                              onChange={(e) => handleInputChange('techCompetence', e.target.value)}
                              className="bg-white border border-[#DFE1E6] rounded px-2 py-1 text-[#172B4D] focus:outline-none focus:border-[#0052CC] text-xs"
                            >
                              <option value="GOOD">GOOD</option>
                              <option value="AVG">AVG</option>
                              <option value="LOW">LOW</option>
                              <option value="WIP">WIP</option>
                            </select>
                          ) : (
                            <StatusBadge status={row.techCompetence} />
                          )}
                        </td>

                        {/* Notes */}
                        <td className="py-3.5 px-5 min-w-[200px]">
                          {isEditing ? (
                            <textarea
                              value={editData?.notes || ''}
                              onChange={(e) => handleInputChange('notes', e.target.value)}
                              className="bg-white border border-[#DFE1E6] rounded px-2 py-1 text-[#172B4D] w-full h-10 focus:outline-none focus:border-[#0052CC] text-xs resize-none"
                            />
                          ) : (
                            <span className="text-[#6B778C] text-xs line-clamp-2">{row.notes}</span>
                          )}
                        </td>

                        {/* Actions Column */}
                        <td className="py-3.5 px-5 text-right whitespace-nowrap">
                          {isEditing ? (
                            <div className="flex justify-end space-x-2">
                              <button
                                onClick={saveEdit}
                                disabled={isSaving}
                                className="p-1.5 text-[#006644] hover:bg-[#E3FCEF] rounded transition"
                                title="Save Changes"
                              >
                                <Check className="w-4 h-4" />
                              </button>
                              <button
                                onClick={cancelEdit}
                                disabled={isSaving}
                                className="p-1.5 text-[#BF2600] hover:bg-[#FFEBE6] rounded transition"
                                title="Cancel Edit"
                              >
                                <X className="w-4 h-4" />
                              </button>
                            </div>
                          ) : (
                            <button
                              onClick={() => startEdit(row)}
                              className="p-1.5 text-[#6B778C] hover:text-[#172B4D] hover:bg-[#091E4214] rounded transition"
                              title="Edit Row"
                            >
                              <Edit2 className="w-3.5 h-3.5" />
                            </button>
                          )}
                        </td>
                      </tr>
                    );
                  } else {
                    // MATRIX VIEW
                    return (
                      <React.Fragment key={row.developerName}>
                        {/* Top Row: Tickets */}
                        <tr className="bg-white hover:bg-[#FAFBFC] transition-colors border-t border-[#DFE1E6]">
                          <td className="py-2 px-5 font-bold text-[#172B4D] whitespace-nowrap border-b-0" rowSpan={2}>{row.developerName}</td>
                          <td className="py-2 px-4 whitespace-nowrap text-xs border-b-0" rowSpan={2}>{row.role}</td>
                          <td className="py-2 px-4 whitespace-nowrap text-xs text-[#6B778C] border-b-0" rowSpan={2}>{row.type}</td>
                          <td className="py-2 px-4 whitespace-nowrap text-xs border-b-0" rowSpan={2}>{row.team}</td>
                          
                          <td className="py-1 px-3 text-center text-[#172B4D] font-bold bg-[#FFFAE6] border-l border-[#DFE1E6]">{row.allTimeTickets}</td>
                          <td className="py-1 px-3 text-center text-[#172B4D] font-bold bg-[#FFFAE6]">{row.allTimeAvgTickets.toFixed(1)}</td>
                          
                          {uniqueSprints.map(sName => {
                            const sh = row.sprintsHistory?.find(s => s.sprintName === sName);
                            return <td key={sName} className="py-1 px-3 text-center text-[#172B4D] font-medium border-l border-[#DFE1E6]">{sh?.tickets || 0}</td>;
                          })}
                        </tr>
                        {/* Bottom Row: USP */}
                        <tr className="bg-white hover:bg-[#FAFBFC] transition-colors border-b border-[#DFE1E6]">
                          <td className="py-1 px-3 text-center text-[#0052CC] font-bold bg-[#FFFAE6] border-l border-[#DFE1E6]">{row.allTimeUsp}</td>
                          <td className="py-1 px-3 text-center text-[#0052CC] font-bold bg-[#FFFAE6]">{row.allTimeAvgUsp.toFixed(1)}</td>
                          
                          {uniqueSprints.map(sName => {
                            const sh = row.sprintsHistory?.find(s => s.sprintName === sName);
                            return <td key={sName} className="py-1 px-3 text-center text-[#0052CC] font-medium border-l border-[#DFE1E6]">{sh?.usp?.toFixed(1) || '0.0'}</td>;
                          })}
                        </tr>
                      </React.Fragment>
                    );
                  }
                })}
              </React.Fragment>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
