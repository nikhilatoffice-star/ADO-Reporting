'use client';

import React, { useMemo, useEffect } from 'react';
import { useRouter, usePathname, useSearchParams } from 'next/navigation';
import { Calendar } from 'lucide-react';

interface SprintSelectorProps {
  sprints: Array<{ IterationName: string; ProjectName?: string; StartDate?: string; EndDate?: string }>;
}

const PROJECT_MAP = [
  { key: 'crm', name: '2026 SF CRM Enhancements', label: 'CRM Enhancements' },
  { key: 'bf', name: '2026 eCom BreakFix', label: 'eCom BreakFix' },
  { key: 'find', name: 'Findability', label: 'Findability' },
  { key: 'enh', name: 'Digital Enhancements', label: 'Digital Enh.' }
];

export default function SprintSelector({ sprints }: SprintSelectorProps) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  // Map out sprints by project
  const projectSprints = useMemo(() => {
    const map: Record<string, typeof sprints> = {};
    PROJECT_MAP.forEach(p => map[p.key] = []);
    
    sprints.forEach(s => {
      if (!s.ProjectName) return;
      const proj = PROJECT_MAP.find(p => p.name === s.ProjectName);
      if (proj) {
        map[proj.key].push(s);
      }
    });
    return map;
  }, [sprints]);

  // Current selections
  const selections: Record<string, string> = {};
  PROJECT_MAP.forEach(p => {
    selections[p.key] = searchParams.get(p.key) || '';
  });

  // Persist selections to localStorage
  useEffect(() => {
    PROJECT_MAP.forEach(p => {
      if (selections[p.key]) {
        localStorage.setItem(`saved_sprint_${p.key}`, selections[p.key]);
      }
    });
  }, [searchParams]); // Re-run when URL changes

  // Calculate defaults on mount
  useEffect(() => {
    let needsUpdate = false;
    const params = new URLSearchParams(searchParams.toString());
    
    PROJECT_MAP.forEach(p => {
      const current = params.get(p.key);
      if (!current) {
        const available = projectSprints[p.key];
        const saved = localStorage.getItem(`saved_sprint_${p.key}`);
        
        if (saved && available && available.some(s => s.IterationName === saved)) {
          // Restore from saved preference
          params.set(p.key, saved);
          needsUpdate = true;
        } else if (available && available.length > 0) {
          // Default to latest
          const latest = available[available.length - 1].IterationName;
          params.set(p.key, latest);
          needsUpdate = true;
        }
      }
    });

    if (needsUpdate) {
      router.replace(`${pathname}?${params.toString()}`);
    }
  }, [searchParams, pathname, projectSprints, router]);

  const handleChange = (projectKey: string, newValue: string) => {
    const params = new URLSearchParams(searchParams.toString());
    params.set(projectKey, newValue);
    router.push(`${pathname}?${params.toString()}`);
  };

  const formatDate = (dateStr?: string) => {
    if (!dateStr) return '';
    return new Date(dateStr).toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
  };

  return (
    <div className="flex flex-col space-y-1">
      {PROJECT_MAP.map(proj => {
        const availableSprints = projectSprints[proj.key] || [];
        const activeSprint = selections[proj.key] || '';
        
        return (
          <div key={proj.key} className="flex items-center space-x-2 bg-white border border-[#DFE1E6] rounded px-2 py-1 shadow-sm hover:bg-[#FAFBFC] transition-colors">
            <Calendar className="w-3.5 h-3.5 text-[#0052CC]" />
            <div className="flex flex-col w-full overflow-hidden">
              <label htmlFor={`sprint-dropdown-${proj.key}`} className="text-[8px] text-[#6B778C] uppercase font-bold tracking-wider mb-0.5">
                {proj.label}
              </label>
              <select
                id={`sprint-dropdown-${proj.key}`}
                value={activeSprint}
                onChange={(e) => handleChange(proj.key, e.target.value)}
                className="bg-transparent text-xs text-[#0052CC] font-bold focus:outline-none cursor-pointer pr-4 w-full truncate"
                title={activeSprint}
              >
                {availableSprints.map((sprint) => {
                  let dateLabel = '';
                  if (sprint.StartDate && sprint.EndDate) {
                    const sDate = new Date(sprint.StartDate).toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
                    const eDate = new Date(sprint.EndDate).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: '2-digit' });
                    dateLabel = ` (${sDate} - ${eDate})`;
                  }
                  
                  return (
                    <option key={sprint.IterationName} value={sprint.IterationName} className="bg-white text-[#172B4D]">
                      {sprint.IterationName}{dateLabel}
                    </option>
                  );
                })}
              </select>
            </div>
          </div>
        );
      })}
    </div>
  );
}
