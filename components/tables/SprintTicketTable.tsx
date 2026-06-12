'use client';

import React, { useMemo, useRef, useCallback, useState } from 'react';
import { AgGridReact } from 'ag-grid-react';
import { ColDef, CellValueChangedEvent } from 'ag-grid-community';
import 'ag-grid-community/styles/ag-grid.css';
import 'ag-grid-community/styles/ag-theme-quartz.css';
import StatusBadge from '../ui/StatusBadge';
import { ADOWorkItem } from '../../lib/types';
import { Download } from 'lucide-react';
import { DEV_NAMES, getShortName } from '../../lib/team-config';

interface SprintTicketTableProps {
  tickets: ADOWorkItem[];
  overrides: Record<string, any>;
}

export default function SprintTicketTable({ tickets, overrides }: SprintTicketTableProps) {
  const gridRef = useRef<AgGridReact>(null);
  const [expandedParents, setExpandedParents] = useState<Set<number>>(new Set());

  const toggleParent = useCallback((id: number) => {
    setExpandedParents(prev => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }, []);

  const handleExpandAll = useCallback(() => {
    const parentTypes = ['User Story', 'Bug', 'Feature', 'Epic'];
    const parents = tickets.filter(t => parentTypes.includes(t.WorkItemType));
    setExpandedParents(new Set(parents.map(p => p.WorkItemId)));
  }, [tickets]);

  const handleCollapseAll = useCallback(() => {
    setExpandedParents(new Set());
  }, []);

  const getRowId = useCallback((params: any) => params.data.WorkItemId.toString(), []);

  const rowData = useMemo(() => {
    const parentTypes = ['User Story', 'Bug', 'Feature', 'Epic'];
    const parents = tickets.filter(t => parentTypes.includes(t.WorkItemType));
    const tasks = tickets.filter(t => t.WorkItemType === 'Task');
    
    // Group tasks by parent id
    const tasksByParent: Record<number, ADOWorkItem[]> = {};
    tasks.forEach(t => {
      if (t.ParentWorkItemId) {
        if (!tasksByParent[t.ParentWorkItemId]) tasksByParent[t.ParentWorkItemId] = [];
        tasksByParent[t.ParentWorkItemId].push(t);
      }
    });

    const rows: any[] = [];

    parents.forEach(p => {
      const childTasks = tasksByParent[p.WorkItemId] || [];
      const override = overrides[p.WorkItemId] || {};
      const devHours = override.dev_hours || {};
      
      // Auto-calculate dev hours from tasks if empty
      const computedDevHours: Record<string, string | number | null> = {};
      DEV_NAMES.forEach(name => {
        if (devHours[name]) {
          computedDevHours[name] = devHours[name];
        } else {
          // Sum up hours from child tasks assigned to this dev
          let sum = 0;
          childTasks.forEach(ct => {
            const shortAssignee = getShortName(ct.AssignedTo?.UserName || '');
            if (shortAssignee.toLowerCase() === name.toLowerCase()) {
              sum += (ct.OriginalEstimate || 0);
            }
          });
          computedDevHours[name] = sum > 0 ? sum : null;
        }
      });

      let parentDevHoursSum = 0;
      Object.values(computedDevHours).forEach(val => {
        if (typeof val === 'number') parentDevHoursSum += val;
        else if (typeof val === 'string' && val !== '') parentDevHoursSum += parseFloat(val);
      });

      const parentRow = {
        ...p,
        Notes: override.notes || '',
        Developer1: override.dev_1 || p.Developer1?.split(', ').reverse().join(' ') || '',
        Developer2: override.dev_2 || p.Developer2?.split(', ').reverse().join(' ') || '',
        Ritesh: computedDevHours['Ritesh'],
        Venky: computedDevHours['Venky'],
        Miles: computedDevHours['Miles'],
        Amarjit: computedDevHours['Amarjit'],
        Jasveer: computedDevHours['Jasveer'],
        Sanjay: computedDevHours['Sanjay'],
        Bharat: computedDevHours['Bharat'],
        Aditya: computedDevHours['Aditya'],
        Venkat: computedDevHours['Venkat'],
        Bert: computedDevHours['Bert'],
        Daulton: computedDevHours['Daulton'],
        Shan: computedDevHours['Shan'],
        Prasad: computedDevHours['Prasad'],
        Eva: computedDevHours['Eva'],
        childTasks,
        isExpanded: expandedParents.has(p.WorkItemId),
        isTask: false,
        OriginalEstimate: parentDevHoursSum > 0 ? parentDevHoursSum : p.OriginalEstimate
      };

      rows.push(parentRow);

      if (expandedParents.has(p.WorkItemId)) {
        childTasks.forEach(ct => {
          const ctOverride = overrides[ct.WorkItemId] || {};
          const ctDevHours = ctOverride.dev_hours || {};
          
          // Map task's own hours to the assigned developer column natively
          const taskDevHours: Record<string, string | number | null> = {};
          DEV_NAMES.forEach(name => {
            if (ctDevHours[name]) {
              taskDevHours[name] = ctDevHours[name];
            } else if (getShortName(ct.AssignedTo?.UserName || '').toLowerCase() === name.toLowerCase() && ct.OriginalEstimate) {
              taskDevHours[name] = ct.OriginalEstimate;
            } else {
              taskDevHours[name] = null;
            }
          });

          rows.push({
            ...ct,
            Notes: ctOverride.notes || '',
            Developer1: ctOverride.dev_1 || ct.Developer1?.split(', ').reverse().join(' ') || '',
            Developer2: ctOverride.dev_2 || ct.Developer2?.split(', ').reverse().join(' ') || '',
            Ritesh: taskDevHours['Ritesh'],
            Venky: taskDevHours['Venky'],
            Miles: taskDevHours['Miles'],
            Amarjit: taskDevHours['Amarjit'],
            Jasveer: taskDevHours['Jasveer'],
            Sanjay: taskDevHours['Sanjay'],
            Bharat: taskDevHours['Bharat'],
            Aditya: taskDevHours['Aditya'],
            Venkat: taskDevHours['Venkat'],
            Bert: taskDevHours['Bert'],
            Daulton: taskDevHours['Daulton'],
            Shan: taskDevHours['Shan'],
            Prasad: taskDevHours['Prasad'],
            Eva: taskDevHours['Eva'],
            isTask: true
          });
        });
      }
    });

    return rows;
  }, [tickets, overrides, expandedParents]);

  const onCellValueChanged = useCallback(async (event: CellValueChangedEvent) => {
    const data = event.data;
    const workItemId = data.WorkItemId;
    
    const payload = {
      work_item_id: workItemId,
      notes: data.Notes,
      dev_1: data.Developer1,
      dev_2: data.Developer2,
      dev_hours: {
        Ritesh: data.Ritesh,
        Venky: data.Venky,
        Miles: data.Miles,
        Amarjit: data.Amarjit,
        Jasveer: data.Jasveer,
        Sanjay: data.Sanjay,
        Bharat: data.Bharat,
        Aditya: data.Aditya,
        Venkat: data.Venkat,
        Bert: data.Bert,
        Daulton: data.Daulton,
        Shan: data.Shan,
        Prasad: data.Prasad,
        Eva: data.Eva
      }
    };

    try {
      await fetch('/api/overrides', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ overrides: [payload] })
      });
    } catch (err) {
      console.error('Failed to save override', err);
    }
  }, []);

  const columnDefs = useMemo<ColDef[]>(() => [
    { 
      field: 'State', 
      headerName: 'Status', 
      width: 140,
      cellRenderer: (params: any) => <StatusBadge status={params.value} />
    },
    { field: 'Notes', editable: true, width: 220, cellEditor: 'agLargeTextCellEditor' },
    { 
      field: 'team_name', 
      headerName: 'Product Team', 
      valueGetter: params => params.data.Area?.AreaName || params.data.Teams?.[0]?.TeamName || 'General',
      width: 180 
    },
    { 
      field: 'WorkItemId', 
      headerName: 'Ticket ID', 
      width: 110,
      cellRenderer: (params: any) => (
        <a href={`https://dev.azure.com/fleetpride/FP-IT/_workitems/edit/${params.value}`} target="_blank" rel="noreferrer" className="text-[#0052CC] font-mono hover:underline cursor-pointer">
          {params.value}
        </a>
      )
    },
    { field: 'WorkItemType', headerName: 'Work Item Type', width: 140 },
    { 
      field: 'Title', 
      headerName: 'Ticket Description', 
      flex: 1, 
      minWidth: 350,
      cellRenderer: (params: any) => {
        const isTask = params.data.isTask;
        const hasChildren = params.data.childTasks && params.data.childTasks.length > 0;
        const isExpanded = params.data.isExpanded;
        
        return (
          <div className="flex items-center space-x-2 h-full">
            {isTask ? (
               <div className="ml-6 w-4 h-4 border-l-2 border-b-2 border-gray-300 rounded-bl flex-shrink-0" style={{ transform: 'translateY(-4px)' }}></div>
            ) : hasChildren ? (
               <button 
                 onClick={() => params.context.toggleParent(params.data.WorkItemId)}
                 className="w-5 h-5 flex-shrink-0 flex items-center justify-center border border-[#DFE1E6] rounded text-[#172B4D] hover:bg-[#EBECF0] transition-colors focus:outline-none"
                 style={{ lineHeight: '10px' }}
               >
                 {isExpanded ? '−' : '+'}
               </button>
            ) : (
               <div className="w-5 flex-shrink-0" />
            )}
            <span className={`truncate ${isTask ? 'text-[#42526E] text-sm' : 'font-semibold text-[#172B4D]'}`} title={params.value}>
              {params.value}
            </span>
          </div>
        );
      }
    },
    { 
      field: 'AssignedTo', 
      headerName: 'Assignee', 
      valueGetter: params => params.data.AssignedTo?.UserName?.split(', ').reverse().join(' ') || 'Unassigned',
      width: 160 
    },
    { field: 'StoryPoints', headerName: 'Story Points', width: 120, type: 'numericColumn' },
    { field: 'OriginalEstimate', headerName: 'Hours', width: 100, type: 'numericColumn' },
    { field: 'Developer1', headerName: 'Developer 1', editable: true, width: 130 },
    { field: 'Developer2', headerName: 'Developer 2', editable: true, width: 130 },
    { field: 'Ritesh', editable: true, width: 100 },
    { field: 'Venky', editable: true, width: 100 },
    { field: 'Miles', editable: true, width: 100 },
    { field: 'Amarjit', editable: true, width: 100 },
    { field: 'Jasveer', editable: true, width: 100 },
    { field: 'Sanjay', editable: true, width: 100 },
    { field: 'Bharat', editable: true, width: 100 },
    { field: 'Aditya', editable: true, width: 100 },
    { field: 'Venkat', headerName: 'Venkat (PS)', editable: true, width: 100 },
    { field: 'Bert', headerName: 'Bert (Coveo)', editable: true, width: 100 },
    { field: 'Daulton', headerName: 'Daulton (XC)', editable: true, width: 100 },
    { field: 'Shan', headerName: 'Shan (XC)', editable: true, width: 100 },
    { field: 'Prasad', headerName: 'Prasad (PS)', editable: true, width: 100 },
    { field: 'Eva', headerName: 'Eva (Boomi)', editable: true, width: 100 }
  ], []);

  const defaultColDef = useMemo(() => ({
    resizable: true,
    sortable: true,
    filter: true,
    enableRowGroup: true,
    enablePivot: true,
    enableValue: true,
    cellDataType: false,
  }), []);

  const rowClassRules = useMemo(() => ({
    'bg-[#F4F5F7]': (params: any) => params.data.isTask,
    'bg-[#FFF0B3] text-[#FF8B00] border-l-4 border-[#FF8B00]': (params: any) => {
      if (params.data.isTask) return false;
      const sp = params.data.StoryPoints || 0;
      const hrs = params.data.OriginalEstimate || 0;
      return sp === 0 && hrs === 0;
    }
  }), []);

  const exportCsv = useCallback(() => {
    gridRef.current?.api.exportDataAsCsv({
      fileName: 'sprint_tickets_export.csv'
    });
  }, []);

  return (
    <div className="flex flex-col space-y-3">
      <div className="flex justify-between items-center">
        <div className="flex items-center space-x-2">
          <button 
            onClick={expandedParents.size > 0 ? handleCollapseAll : handleExpandAll}
            className="text-sm font-semibold bg-white border border-[#DFE1E6] px-3 py-1.5 rounded hover:bg-[#FAFBFC] text-[#172B4D] shadow-sm transition-colors"
          >
            {expandedParents.size > 0 ? 'Collapse All' : 'Expand All'}
          </button>
        </div>
        <button 
          onClick={exportCsv}
          className="flex items-center space-x-2 text-sm font-semibold bg-white border border-[#DFE1E6] px-4 py-2 rounded hover:bg-[#FAFBFC] text-[#172B4D] shadow-sm transition-colors"
        >
          <Download className="w-4 h-4" />
          <span>Export CSV</span>
        </button>
      </div>
      <div className="ag-theme-quartz w-full border border-[#DFE1E6] rounded overflow-hidden" style={{ height: 600 }}>
        <AgGridReact
          ref={gridRef}
          rowData={rowData}
          columnDefs={columnDefs}
          defaultColDef={defaultColDef}
          rowClassRules={rowClassRules}
          onCellValueChanged={onCellValueChanged}
          getRowId={getRowId}
          pagination={false}
          rowHeight={40}
          headerHeight={45}
          context={{ toggleParent }}
          animateRows={true}
        />
      </div>
    </div>
  );
}
