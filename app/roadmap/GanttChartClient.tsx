"use client";

import React, { useState, useRef } from "react";
import { RoadmapItem, ADOIteration } from "@/lib/types";
import ExcelJS from 'exceljs';
import { saveAs } from 'file-saver';

interface Props {
  items: RoadmapItem[];
}

export default function GanttChartClient({ items: initialItems }: Props) {
  // Config item logic
  const configItem = initialItems.find(i => i.id === 'CONFIG_SPRINTS');
  let defaultStartNum = 1;
  let defaultStartDate = '2025-12-29'; // Backtracked from June 1st Sprint 12
  let defaultCurrentNum = 12;

  if (configItem && configItem.title.startsWith('{')) {
    try {
      const parsed = JSON.parse(configItem.title);
      if (parsed.startNum !== undefined) defaultStartNum = parsed.startNum;
      if (parsed.startDate !== undefined) defaultStartDate = parsed.startDate;
      
      // Backward compatibility with old settings format
      if (parsed.num !== undefined && parsed.date) {
        defaultStartNum = 1;
        const d = new Date(`${parsed.date}T00:00:00`);
        d.setDate(d.getDate() - ((parsed.num - 1) * 14));
        defaultStartDate = d.toISOString().split('T')[0];
      }
    } catch(e) {}
  }

  // Hide the config item from the main timeline
  const visibleItems = initialItems.filter(i => i.id !== 'CONFIG_SPRINTS');

  const [items, setItems] = useState<RoadmapItem[]>(visibleItems);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editTitle, setEditTitle] = useState("");
  const [saveStatus, setSaveStatus] = useState<'idle' | 'saving' | 'saved'>('idle');
  
  React.useEffect(() => {
    setItems(initialItems.filter(i => i.id !== 'CONFIG_SPRINTS'));
  }, [initialItems]);
  
  // Settings State
  const [showSettings, setShowSettings] = useState(false);
  const [baseStartNum, setBaseStartNum] = useState<number>(defaultStartNum);
  const [baseStartDate, setBaseStartDate] = useState<string>(defaultStartDate);
  const [zoom, setZoom] = useState<number>(1);

  const sprints = React.useMemo(() => {
    return Array.from({ length: 30 }, (_, i) => {
      const sprintNum = baseStartNum + i;
      const startDate = new Date(`${baseStartDate}T00:00:00`);
      startDate.setDate(startDate.getDate() + (i * 14));
      
      const endDate = new Date(startDate);
      endDate.setDate(endDate.getDate() + 13);
      
      const formatDate = (d: Date) => `${(d.getMonth()+1).toString().padStart(2, '0')}/${d.getDate().toString().padStart(2, '0')}`;
      
      return {
        IterationName: `Sprint ${sprintNum}`,
        StartDate: formatDate(startDate),
        EndDate: formatDate(endDate),
        Month: startDate.toLocaleString('en-US', { month: 'short' }).toUpperCase(),
        Year: startDate.getFullYear().toString()
      };
    });
  }, [baseStartNum, baseStartDate]);
  
  // Drag State
  const [dragItem, setDragItem] = useState<{ id: string; type: 'move' | 'left' | 'right'; startIdx: number; endIdx: number } | null>(null);

  const teamOrder = [
    "PROJECTS / TEAM [CORT/VALENTINA]",
    "PROJECTS / TEAM [BALARITHI]",
    "PROJECTS / TEAM [PIM / INTEGRATIONS]",
    "ENHANCEMENTS PRODUCT TEAM",
    "BREAKFIX PRODUCT TEAM",
    "SFMC PRODUCT TEAM",
    "SF COMMERCE TEAM",
    "SEO / SEM / GA4 TEAM"
  ];
  
  const teams = Array.from(new Set([...teamOrder, ...items.map(i => i.team)])).sort((a, b) => {
    const idxA = teamOrder.indexOf(a);
    const idxB = teamOrder.indexOf(b);
    if (idxA !== -1 && idxB !== -1) return idxA - idxB;
    if (idxA !== -1) return -1;
    if (idxB !== -1) return 1;
    return a.localeCompare(b);
  });

  const saveToSupabase = async (updatedItems: RoadmapItem[]) => {
    setSaveStatus('saving');
    try {
      const configItemStr = JSON.stringify({ startNum: baseStartNum, startDate: baseStartDate });
      const itemsToSave = [
        { id: 'CONFIG_SPRINTS', title: configItemStr, type: 'Config', state: 'New', team: 'CONFIG', startSprint: '', endSprint: '', progress: 0 },
        ...updatedItems
      ];
      await fetch('/api/roadmap', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ items: itemsToSave })
      });
      setSaveStatus('saved');
      setTimeout(() => setSaveStatus('idle'), 2000);
    } catch (e) {
      console.error("Failed to save roadmap to Supabase", e);
      setSaveStatus('idle');
    }
  };

  const getTodayPercentage = () => {
    const today = new Date();
    const todayMs = Date.UTC(today.getFullYear(), today.getMonth(), today.getDate());
    const [by, bm, bd] = baseStartDate.split('-').map(Number);
    const baseStartMs = Date.UTC(by, bm - 1, bd);
    
    if (todayMs < baseStartMs) return 0;
    
    const daysSince = Math.floor((todayMs - baseStartMs) / (1000 * 60 * 60 * 24));
    if (daysSince >= sprints.length * 14) return 100;
    
    return ((daysSince / 14) / sprints.length) * 100;
  };

  const handleDelete = async (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    if (!confirm("Are you sure you want to delete this initiative?")) return;

    setSaveStatus('saving');
    // Remove from local state immediately for snappy UX
    setItems(prev => prev.filter(i => i.id !== id));
    
    try {
      await fetch(`/api/roadmap?id=${id}`, { method: 'DELETE' });
      setSaveStatus('saved');
      setTimeout(() => setSaveStatus('idle'), 2000);
    } catch (e) {
      console.error("Failed to delete item", e);
      setSaveStatus('idle');
    }
  };

  const updateItem = (id: string, updates: Partial<RoadmapItem>) => {
    const newItems = items.map(i => i.id === id ? { ...i, ...updates } : i);
    setItems(newItems);
    saveToSupabase(newItems);
  };

  const handleTitleSubmit = (id: string) => {
    updateItem(id, { title: editTitle });
    setEditingId(null);
  };

  const handleAddInitiative = (team: string) => {
    const newItem: RoadmapItem = {
      id: `NEW-${Date.now()}`,
      title: "New Initiative",
      type: "Feature",
      state: "New",
      team,
      startSprint: "Sprint 12",
      endSprint: "Sprint 14",
      progress: 0
    };
    const newItems = [...items, newItem];
    setItems(newItems);
    saveToSupabase(newItems);
    
    // Auto-open editor
    setEditingId(newItem.id);
    setEditTitle(newItem.title);
  };

  // ----- DRAG LOGIC -----
  const trackRef = useRef<HTMLDivElement>(null);
  const dragStateRef = useRef<{ 
    id: string; 
    type: 'move' | 'left' | 'right'; 
    startIdx: number; 
    endIdx: number; 
    mouseOffsetIdx: number;
    lastHoverIdx?: number;
  } | null>(null);

  const getSprintIndexFromMouse = (clientX: number) => {
    if (!trackRef.current) return 0;
    const rect = trackRef.current.getBoundingClientRect();
    const x = clientX - rect.left;
    const colWidth = rect.width / sprints.length;
    return Math.max(0, Math.min(sprints.length - 1, Math.floor(x / colWidth)));
  };

  const onMouseMove = (e: React.MouseEvent) => {
    const dragItem = dragStateRef.current;
    if (!dragItem) return;
    
    const currentHoverIdx = getSprintIndexFromMouse(e.clientX);
    if (dragItem.lastHoverIdx === currentHoverIdx) return;
    
    dragItem.lastHoverIdx = currentHoverIdx;
    
    setItems(prev => prev.map(item => {
      if (item.id === dragItem.id) {
        let newStart = dragItem.startIdx;
        let newEnd = dragItem.endIdx;
        
        if (dragItem.type === 'move') {
          const duration = dragItem.endIdx - dragItem.startIdx;
          newStart = currentHoverIdx - dragItem.mouseOffsetIdx;
          // Constrain so it doesn't go out of bounds
          if (newStart < 0) newStart = 0;
          newEnd = newStart + duration;
          if (newEnd >= sprints.length) {
            newEnd = sprints.length - 1;
            newStart = newEnd - duration;
          }
        } else if (dragItem.type === 'left') {
          newStart = Math.min(currentHoverIdx, dragItem.endIdx);
        } else if (dragItem.type === 'right') {
          newEnd = Math.max(currentHoverIdx, dragItem.startIdx);
        }

        return {
          ...item,
          startSprint: sprints[newStart]?.IterationName || item.startSprint,
          endSprint: sprints[newEnd]?.IterationName || item.endSprint
        };
      }
      return item;
    }));
  };

  const onMouseUp = () => {
    if (dragStateRef.current) {
      document.body.style.userSelect = '';
      document.body.style.cursor = '';
      setItems(currentItems => {
        saveToSupabase(currentItems);
        return currentItems;
      });
      dragStateRef.current = null;
      setDragItem(null); // Just for UI re-render
    }
  };

  const startDrag = (e: React.MouseEvent, id: string, type: 'move' | 'left' | 'right') => {
    e.stopPropagation();
    const item = items.find(i => i.id === id);
    if (!item) return;
    
    const startIdx = Math.max(0, sprints.findIndex(s => s.IterationName === item.startSprint));
    const endIdx = Math.max(startIdx, sprints.findIndex(s => s.IterationName === item.endSprint));
    
    const hoverIdx = getSprintIndexFromMouse(e.clientX);
    const mouseOffsetIdx = hoverIdx - startIdx;
    
    document.body.style.userSelect = 'none';
    document.body.style.cursor = 'grabbing';
    
    const state = { id, type, startIdx, endIdx, mouseOffsetIdx, lastHoverIdx: hoverIdx };
    dragStateRef.current = state;
    setDragItem(state);
  };

  const getBarColor = (item: RoadmapItem) => {
    if (item.title.includes("Web AI Search") || item.title.includes("Mobile App") || item.title.includes("SFMC tool replacement")) {
      return "bg-[#FFFF00] border-black text-black"; 
    }
    if (item.title.includes("TP.com") || item.title.includes("TP FP SF CRM") || item.title.includes("Palantir") || item.title.includes("Pricing Integration")) {
      return "bg-[#FFE699] border-black text-black font-semibold italic"; 
    }
    if (item.title.includes("✔") && !item.team.includes("BREAKFIX") && !item.team.includes("SF COMMERCE") && !item.team.includes("SEO")) {
      return "bg-white border-[#548235] text-[#385723]"; 
    }
    if (item.team.includes("BREAKFIX") || item.team.includes("SFMC") || item.team.includes("SF COMMERCE") || item.team.includes("SEO")) {
      return "bg-[#FCE4D6] border-black text-black"; 
    }
    return "bg-[#E2EFDA] border-[#548235] text-black"; 
  };

  // Calculate month groupings
  const months: { name: string; count: number }[] = [];
  sprints.forEach(sprint => {
    const monthName = sprint.Month || "UNKNOWN";
    if (months.length > 0 && months[months.length - 1].name === monthName) {
      months[months.length - 1].count += 1;
    } else {
      months.push({ name: monthName, count: 1 });
    }
  });

  // Calculate year groupings
  const years: { name: string; count: number }[] = [];
  sprints.forEach(sprint => {
    const yearName = sprint.Year || "UNKNOWN";
    if (years.length > 0 && years[years.length - 1].name === yearName) {
      years[years.length - 1].count += 1;
    } else {
      years.push({ name: yearName, count: 1 });
    }
  });

  const exportToExcel = async () => {
    const workbook = new ExcelJS.Workbook();
    const sheet = workbook.addWorksheet('Roadmap', { views: [{ showGridLines: true }] });

    // Constants
    const SPRINT_WIDTH = 12;
    const FIRST_COL_WIDTH = 45;

    // Set columns
    const columns = [{ width: FIRST_COL_WIDTH }]; // Swimlane column
    for (let i = 0; i < sprints.length; i++) {
      columns.push({ width: SPRINT_WIDTH });
    }
    sheet.columns = columns;

    const HEADER_FILL: ExcelJS.Fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FF92D050' } };
    const THIN_BORDER: Partial<ExcelJS.Borders> = {
      top: { style: 'thin' }, left: { style: 'thin' },
      bottom: { style: 'thin' }, right: { style: 'thin' }
    };

    // Row 1: Years
    const yearRow = sheet.getRow(1);
    yearRow.height = 20;
    let currentCol = 2;
    years.forEach(yr => {
      const startCell = yearRow.getCell(currentCol);
      startCell.value = yr.name;
      startCell.fill = HEADER_FILL;
      startCell.border = THIN_BORDER;
      startCell.alignment = { horizontal: 'center', vertical: 'middle' };
      startCell.font = { bold: true };
      
      const endCol = currentCol + yr.count - 1;
      if (endCol > currentCol) {
        sheet.mergeCells(1, currentCol, 1, endCol);
      }
      currentCol = endCol + 1;
    });

    // Row 2: Months
    const monthRow = sheet.getRow(2);
    monthRow.height = 20;
    currentCol = 2;
    months.forEach(m => {
      const startCell = monthRow.getCell(currentCol);
      startCell.value = m.name;
      startCell.fill = HEADER_FILL;
      startCell.border = THIN_BORDER;
      startCell.alignment = { horizontal: 'center', vertical: 'middle' };
      startCell.font = { bold: true };

      const endCol = currentCol + m.count - 1;
      if (endCol > currentCol) {
        sheet.mergeCells(2, currentCol, 2, endCol);
      }
      currentCol = endCol + 1;
    });

    // Row 3: Sprints
    const sprintRow = sheet.getRow(3);
    const sprintDateRow = sheet.getRow(4);
    sprintRow.height = 15;
    sprintDateRow.height = 15;
    
    sprints.forEach((sprint, idx) => {
      const col = idx + 2;
      const cell1 = sprintRow.getCell(col);
      cell1.value = sprint.IterationName;
      cell1.fill = HEADER_FILL;
      cell1.border = THIN_BORDER;
      cell1.alignment = { horizontal: 'center', vertical: 'middle' };
      cell1.font = { bold: true, size: 9 };

      const cell2 = sprintDateRow.getCell(col);
      cell2.value = `${sprint.StartDate}-${sprint.EndDate}`;
      cell2.fill = HEADER_FILL;
      cell2.border = THIN_BORDER;
      cell2.alignment = { horizontal: 'center', vertical: 'middle' };
      cell2.font = { size: 8 };
    });

    let currentRow = 5;

    // Swimlanes
    teams.forEach(team => {
      const teamItems = items.filter(i => i.team === team);
      const rows: RoadmapItem[][] = [];
      teamItems.forEach(item => {
        const startIdx = sprints.findIndex(s => s.IterationName === item.startSprint);
        const endIdx = sprints.findIndex(s => s.IterationName === item.endSprint);
        const s = startIdx >= 0 ? startIdx : 0;
        const e = endIdx >= 0 ? endIdx : s;
        
        let placed = false;
        for (let r = 0; r < rows.length; r++) {
          const overlap = rows[r].some(existing => {
            const es = Math.max(0, sprints.findIndex(sp => sp.IterationName === existing.startSprint));
            const ee = Math.max(es, sprints.findIndex(sp => sp.IterationName === existing.endSprint));
            return Math.max(s, es) <= Math.min(e, ee);
          });
          if (!overlap) {
            rows[r].push(item);
            placed = true;
            break;
          }
        }
        if (!placed) rows.push([item]);
      });

      if (rows.length === 0) rows.push([]); // Ensure lane renders

      // Print rows for this team
      rows.forEach((rowItems, idx) => {
        const xlRow = sheet.getRow(currentRow);
        xlRow.height = 22;

        // Team label in first column
        if (idx === 0) {
          const cell = xlRow.getCell(1);
          cell.value = team;
          cell.font = { bold: true, size: 10 };
          cell.alignment = { vertical: 'middle', wrapText: true };
          cell.border = THIN_BORDER;
        }

        rowItems.forEach(item => {
          const startIndex = Math.max(0, sprints.findIndex(s => s.IterationName === item.startSprint));
          const endIndex = Math.max(startIndex, sprints.findIndex(s => s.IterationName === item.endSprint));
          
          const startCol = startIndex + 2;
          const endCol = endIndex + 2;

          const cell = xlRow.getCell(startCol);
          cell.value = item.title;
          cell.alignment = { horizontal: 'center', vertical: 'middle' };
          cell.border = THIN_BORDER;

          // Determine color based on title (similar to getBarColor)
          let argb = 'FFE2EFDA'; // default light green
          let isItalic = false;
          let isBold = false;
          let fontColor = 'FF000000';

          if (item.title.includes("Web AI Search") || item.title.includes("Mobile App") || item.title.includes("SFMC tool replacement")) {
            argb = 'FFFFFF00'; // yellow
          } else if (item.title.includes("TP.com") || item.title.includes("TP FP SF CRM") || item.title.includes("Palantir") || item.title.includes("Pricing Integration")) {
            argb = 'FFFFE699'; // pale yellow
            isItalic = true;
            isBold = true;
          } else if (item.title.includes("✔") && !item.team.includes("BREAKFIX") && !item.team.includes("SF COMMERCE") && !item.team.includes("SEO")) {
            argb = 'FFFFFFFF'; // white
            fontColor = 'FF385723'; // dark green text
          } else if (item.team.includes("BREAKFIX") || item.team.includes("SFMC") || item.team.includes("SF COMMERCE") || item.team.includes("SEO")) {
            argb = 'FFFCE4D6'; // pale orange
          }

          cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb } };
          cell.font = { italic: isItalic, bold: isBold, color: { argb: fontColor }, size: 9 };

          if (endCol > startCol) {
            sheet.mergeCells(currentRow, startCol, currentRow, endCol);
          }
        });

        // Add thin border to all empty grid cells
        for (let c = 2; c <= sprints.length + 1; c++) {
          const cell = xlRow.getCell(c);
          if (!cell.border) cell.border = THIN_BORDER;
        }

        currentRow++;
      });
      
      // Merge the team cell vertically if multiple rows
      if (rows.length > 1) {
        sheet.mergeCells(currentRow - rows.length, 1, currentRow - 1, 1);
      }
    });

    const buffer = await workbook.xlsx.writeBuffer();
    saveAs(new Blob([buffer]), 'Roadmap_Export.xlsx');
  };

  const downloadTemplate = () => {
    const headers = "Title,Team,Start Sprint,End Sprint\n";
    const example = "Example Feature,FINDABILITY PRODUCT TEAM,Sprint 12,Sprint 14\n";
    const blob = new Blob([headers + example], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'Roadmap_Import_Template.csv';
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      const text = event.target?.result as string;
      if (!text) return;

      const lines = text.split('\n').filter(l => l.trim().length > 0);
      if (lines.length <= 1) {
        alert("The CSV file seems to be empty or only contains headers.");
        return;
      }

      const newItems: RoadmapItem[] = [];
      
      for (let i = 1; i < lines.length; i++) {
        // Parse CSV line handling potential quotes but keep it simple
        const parts = lines[i].split(',').map(p => p.trim());
        if (parts.length >= 4) {
          const [title, team, startSprint, endSprint] = parts;
          newItems.push({
            id: 'item-csv-' + Date.now() + '-' + i,
            title: title.replace(/^"|"$/g, ''), // strip quotes if any
            team: team.replace(/^"|"$/g, ''),
            startSprint: startSprint.replace(/^"|"$/g, ''),
            endSprint: endSprint.replace(/^"|"$/g, ''),
            type: 'Feature',
            state: 'New',
            progress: 0
          });
        }
      }

      if (newItems.length > 0) {
        const merged = [...items, ...newItems];
        setItems(merged);
        saveToSupabase(merged);
        alert(`Successfully imported ${newItems.length} items!`);
      }
    };
    reader.readAsText(file);
    e.target.value = '';
  };

  return (
    <div className="w-full pb-8">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center">
          {saveStatus === 'saving' && (
            <span className="flex items-center gap-2 text-sm text-gray-500 italic bg-white px-3 py-1 rounded-full shadow-sm border">
              <svg className="animate-spin h-4 w-4 text-gray-500" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
              </svg>
              Saving to Cloud...
            </span>
          )}
          {saveStatus === 'saved' && (
            <span className="flex items-center gap-1 text-sm text-green-600 bg-green-50 px-3 py-1 rounded-full shadow-sm border border-green-200">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12"></polyline></svg>
              All changes saved
            </span>
          )}
        </div>
        <div className="flex items-center gap-3">
          <div className="flex items-center mr-2 bg-white rounded-md border border-gray-300 shadow-sm text-sm text-gray-700 h-[34px]">
            <button 
              onClick={() => setZoom(z => Math.max(0.3, z - 0.1))}
              className="px-3 h-full hover:bg-gray-100 border-r border-gray-300 transition-colors flex items-center justify-center font-bold text-lg"
              title="Zoom Out"
            >
              −
            </button>
            <div className="relative h-full flex items-center">
              <select 
                value={zoom.toFixed(1)} 
                onChange={e => setZoom(parseFloat(e.target.value))}
                className="appearance-none bg-transparent h-full px-3 pr-8 focus:outline-none cursor-pointer font-medium"
              >
                <option value="0.3">30%</option>
                <option value="0.5">50%</option>
                <option value="0.7">70%</option>
                <option value="0.8">80%</option>
                <option value="0.9">90%</option>
                <option value="1.0">100%</option>
                <option value="1.1">110%</option>
                <option value="1.2">120%</option>
                <option value="1.5">150%</option>
              </select>
              <div className="absolute right-2 pointer-events-none text-gray-500">
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="6 9 12 15 18 9"></polyline></svg>
              </div>
            </div>
            <button 
              onClick={() => setZoom(z => Math.min(1.5, z + 0.1))}
              className="px-3 h-full hover:bg-gray-100 border-l border-gray-300 transition-colors flex items-center justify-center font-bold text-lg"
              title="Zoom In"
            >
              +
            </button>
          </div>

          <button 
            onClick={downloadTemplate}
            className="flex items-center gap-2 bg-gray-100 hover:bg-gray-200 border border-gray-300 text-gray-700 px-3 py-2 rounded-md font-semibold text-sm transition-colors shadow-sm"
            title="Download CSV Template"
          >
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"></path><polyline points="7 10 12 15 17 10"></polyline><line x1="12" y1="15" x2="12" y2="3"></line></svg>
            Template
          </button>
          
          <label className="flex items-center gap-2 bg-blue-50 hover:bg-blue-100 border border-blue-200 text-blue-700 px-3 py-2 rounded-md font-semibold text-sm transition-colors shadow-sm cursor-pointer" title="Import from CSV">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"></path><polyline points="17 8 12 3 7 8"></polyline><line x1="12" y1="3" x2="12" y2="15"></line></svg>
            Import CSV
            <input type="file" accept=".csv" onChange={handleFileUpload} className="hidden" />
          </label>

          <button 
            onClick={() => setShowSettings(true)}
            className="flex items-center gap-2 bg-white hover:bg-gray-50 border border-gray-300 text-gray-700 px-3 py-2 rounded-md font-semibold text-sm transition-colors shadow-sm"
          >
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <circle cx="12" cy="12" r="3"></circle>
              <path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1 0 2.83 2 2 0 0 1-2.83 0l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-2 2 2 2 0 0 1-2-2v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83 0 2 2 0 0 1 0-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1-2-2 2 2 0 0 1 2-2h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 0-2.83 2 2 0 0 1 2.83 0l.06.06a1.65 1.65 0 0 0 1.82.33h.09a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 2-2 2 2 0 0 1 2 2v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 0 2 2 0 0 1 0 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 2 2 2 2 0 0 1-2 2h-.09a1.65 1.65 0 0 0-1.51 1z"></path>
            </svg>
            Settings
          </button>
          <button 
            onClick={exportToExcel}
            className="flex items-center gap-2 bg-[#107c41] hover:bg-[#0c5e31] text-white px-3 py-2 rounded-md font-semibold text-sm transition-colors shadow-sm"
          >
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"></path>
              <polyline points="7 10 12 15 17 10"></polyline>
              <line x1="12" y1="15" x2="12" y2="3"></line>
            </svg>
            Export
          </button>
        </div>
      </div>

      {showSettings && (
        <div className="fixed inset-0 z-[200] flex items-center justify-center bg-black/40 backdrop-blur-sm">
          <div className="bg-white rounded-lg shadow-2xl p-6 w-[400px]">
            <h2 className="text-xl font-bold mb-4">Roadmap Settings</h2>
            
            <div className="mb-4">
              <label className="block text-sm font-semibold text-gray-700 mb-1">Starting Sprint Number</label>
              <p className="text-xs text-gray-500 mb-2">The sprint number of the first column on the far left.</p>
              <input 
                type="number" 
                value={baseStartNum} 
                onChange={e => setBaseStartNum(parseInt(e.target.value) || 1)}
                className="w-full border rounded px-3 py-2 outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
            
            <div className="mb-4">
              <label className="block text-sm font-semibold text-gray-700 mb-1">Starting Sprint Date</label>
              <p className="text-xs text-gray-500 mb-2">The start date of the first column on the far left.</p>
              <input 
                type="date" 
                value={baseStartDate} 
                onChange={e => setBaseStartDate(e.target.value)}
                className="w-full border rounded px-3 py-2 outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>

            <div className="flex justify-end gap-3">
              <button 
                onClick={() => setShowSettings(false)}
                className="px-4 py-2 text-sm font-semibold text-gray-600 hover:bg-gray-100 rounded"
              >
                Cancel
              </button>
              <button 
                onClick={() => {
                  saveToSupabase(items);
                  setShowSettings(false);
                }}
                className="px-4 py-2 text-sm font-semibold bg-blue-600 text-white rounded hover:bg-blue-700 shadow-sm"
              >
                Apply & Save
              </button>
            </div>
          </div>
        </div>
      )}

      <div className="w-full overflow-x-auto relative pb-10">
      {/* Full-screen drag overlay to catch mouse events safely */}
      {dragItem && (
        <div 
          className="fixed inset-0 z-[100] cursor-grabbing" 
          onMouseMove={onMouseMove} 
          onMouseUp={onMouseUp} 
          onMouseLeave={onMouseUp}
        />
      )}
      
      <div 
        className="w-max min-w-full border border-black text-[11px] font-sans shadow-lg rounded-sm overflow-hidden select-none"
        style={{ zoom: zoom }}
      >
        
        {/* Red Arrow for Current Sprint */}
        <div className="flex h-8 bg-white border-b border-black">
          <div className="w-[300px] shrink-0 border-r border-black bg-white"></div>
          <div className="flex-1 relative">
            <div 
              className="absolute top-2 z-20 flex justify-center transition-all duration-300"
              style={{ 
                left: `calc(${getTodayPercentage()}% - 10px)`
              }}
            >
              <svg width="20" height="24" viewBox="0 0 24 24" fill="red" xmlns="http://www.w3.org/2000/svg" className="drop-shadow-md">
                <path d="M12 24L0 12h7V0h10v12h7L12 24z" />
              </svg>
            </div>
          </div>
        </div>

        {/* Timeline Headers: Years */}
        <div className="flex border-b border-black">
          <div className="w-[300px] shrink-0 border-r border-black bg-[#FAFBFC]"></div>
          <div className="flex flex-1">
            {years.map((y, idx) => (
              <div 
                key={`yr-${y.name}-${idx}`} 
                style={{ flex: y.count }} 
                className="border-r border-black bg-[#92D050] text-center font-bold text-[11px] text-black tracking-widest py-1"
              >
                {y.name}
              </div>
            ))}
          </div>
        </div>

        {/* Timeline Headers: Months */}
        <div className="flex border-b border-black">
          <div className="w-[300px] shrink-0 border-r border-black bg-[#FAFBFC]"></div>
          <div className="flex flex-1">
            {months.map((m, idx) => (
              <div 
                key={`${m.name}-${idx}`} 
                style={{ flex: m.count }} 
                className="border-r border-black bg-[#92D050] text-center font-bold text-[10px] text-black tracking-widest py-0.5"
              >
                {m.name}
              </div>
            ))}
          </div>
        </div>

        {/* Timeline Headers: Sprints & Dates */}
        <div className="flex border-b border-black">
          <div className="w-[300px] shrink-0 border-r border-black bg-[#FAFBFC]"></div>
          <div className="flex flex-1" ref={trackRef}>
            {sprints.map((sprint) => {
              const isCurrent = sprint.IterationName === "Sprint 12";
              return (
                <div 
                  key={sprint.IterationName} 
                  className={`flex-1 min-w-[60px] border-r border-black flex flex-col items-center justify-center relative ${isCurrent ? 'bg-[#92D050]' : 'bg-[#92D050]'}`}
                >
                  <span className="text-[9px] font-semibold text-black leading-tight mt-0.5">{sprint.StartDate} - {sprint.EndDate}</span>
                  <span className="text-[10px] font-bold text-black uppercase tracking-tight">{sprint.IterationName}</span>
                </div>
              );
            })}
          </div>
        </div>

        {/* Swimlanes */}
        {teams.map((team) => {
          const teamItems = items.filter((i) => i.team === team);
          const rows: RoadmapItem[][] = [];
          teamItems.forEach(item => {
            const startIdx = sprints.findIndex(s => s.IterationName === item.startSprint);
            const endIdx = sprints.findIndex(s => s.IterationName === item.endSprint);
            const s = startIdx >= 0 ? startIdx : 0;
            const e = endIdx >= 0 ? endIdx : s;
            
            let placed = false;
            for (let r = 0; r < rows.length; r++) {
              const overlap = rows[r].some(existing => {
                const es = Math.max(0, sprints.findIndex(sp => sp.IterationName === existing.startSprint));
                const ee = Math.max(es, sprints.findIndex(sp => sp.IterationName === existing.endSprint));
                return Math.max(s, es) <= Math.min(e, ee);
              });
              if (!overlap) {
                rows[r].push(item);
                placed = true;
                break;
              }
            }
            if (!placed) rows.push([item]);
          });

          if (rows.length === 0) rows.push([]); // Ensure lane renders

          return (
            <div key={team} className="flex border-b border-black bg-white hover:bg-gray-50 transition-colors">
              {/* Team Label */}
              <div className="w-[300px] shrink-0 border-r border-black flex flex-col justify-center px-3 py-2 bg-white z-20 shadow-[2px_0_5px_rgba(0,0,0,0.02)]">
                <span className="font-bold text-black uppercase text-[10px] tracking-tight">{team}</span>
                <button 
                  onClick={() => handleAddInitiative(team)}
                  className="mt-2 self-start text-[9px] font-bold text-blue-600 hover:text-blue-800 bg-blue-50 px-2 py-1 rounded transition-colors"
                >
                  + Add Initiative
                </button>
              </div>

              {/* Swimlane Track */}
              <div className="flex flex-1 relative bg-transparent py-1">
                {/* Grid Lines */}
                <div className="absolute inset-0 flex pointer-events-none z-0">
                  {sprints.map((_, idx) => (
                    <div key={idx} className="flex-1 border-r border-black opacity-10" />
                  ))}
                </div>

                <div 
                  className="absolute top-0 bottom-0 border-r-2 border-dashed border-blue-600 z-10 pointer-events-none opacity-50" 
                  style={{ left: `calc(${(11 / sprints.length) * 100}% - 1px)` }} 
                />

                {/* Items */}
                <div className="relative w-full z-10 flex flex-col gap-1 px-1">
                  {rows.map((rowItems, rowIdx) => (
                    <div key={rowIdx} className="relative h-6 w-full">
                      {rowItems.map(item => {
                        const startIndex = Math.max(0, sprints.findIndex(s => s.IterationName === item.startSprint));
                        const endIndex = Math.max(startIndex, sprints.findIndex(s => s.IterationName === item.endSprint));
                        const duration = endIndex - startIndex + 1;

                        const leftPct = (startIndex / sprints.length) * 100;
                        const widthPct = (duration / sprints.length) * 100;
                        const isDraggingThis = dragItem?.id === item.id;

                        return (
                          <div
                            key={item.id}
                            onMouseDown={(e) => startDrag(e, item.id, 'move')}
                            onDoubleClick={() => {
                              setEditingId(item.id);
                              setEditTitle(item.title);
                            }}
                            className={`group absolute h-6 flex items-center px-2 border rounded-sm cursor-grab active:cursor-grabbing hover:ring-2 hover:ring-blue-500 hover:z-50 transition-all ${isDraggingThis ? 'opacity-80 scale-[1.02] shadow-xl z-50 ring-2 ring-blue-500' : 'shadow-sm'} ${getBarColor(item)}`}
                            style={{
                              left: `calc(${leftPct}%)`,
                              width: `calc(${widthPct}%)`
                            }}
                            title={`${item.title}\nDouble-click to edit`}
                          >
                            {/* Left Resize Handle */}
                            <div 
                              className="absolute left-0 top-0 bottom-0 w-3 cursor-col-resize hover:bg-black/20 z-10"
                              onMouseDown={(e) => startDrag(e, item.id, 'left')}
                            />
                            {/* Right Resize Handle */}
                            <div 
                              className="absolute right-0 top-0 bottom-0 w-3 cursor-col-resize hover:bg-black/20 z-10"
                              onMouseDown={(e) => startDrag(e, item.id, 'right')}
                            />
                            
                            {editingId === item.id ? (
                              <input 
                                autoFocus
                                className="w-full bg-white/90 text-black px-1 rounded outline-none border border-blue-400 font-sans z-50 relative"
                                value={editTitle}
                                onChange={e => setEditTitle(e.target.value)}
                                onBlur={() => handleTitleSubmit(item.id)}
                                onKeyDown={e => e.key === 'Enter' && handleTitleSubmit(item.id)}
                              />
                            ) : (
                              <>
                                <span className="truncate w-full text-center drop-shadow-sm font-medium">{item.title}</span>
                                <button 
                                  onMouseDown={(e) => e.stopPropagation()}
                                  onClick={(e) => handleDelete(item.id, e)}
                                  className="absolute top-[2px] right-[2px] p-0.5 bg-red-500 text-white rounded-sm z-50 opacity-80 hover:opacity-100 hover:bg-red-600 cursor-pointer"
                                  title="Delete Initiative"
                                >
                                  <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                    <path d="M3 6h18"></path>
                                    <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path>
                                  </svg>
                                </button>
                              </>
                            )}

                            {/* Right Resize Handle */}
                            <div 
                              className="absolute right-0 top-0 bottom-0 w-2 cursor-col-resize hover:bg-black/20"
                              onMouseDown={(e) => startDrag(e, item.id, 'right')}
                            />
                          </div>
                        );
                      })}
                    </div>
                  ))}
                </div>
              </div>
            </div>
          );
        })}
      </div>
      </div>
    </div>
  );
}
