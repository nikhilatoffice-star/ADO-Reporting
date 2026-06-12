import { Cache } from './cache';
import { ADOWorkItem, ADOIteration, SprintData, RoadmapItem, BugItem } from './types';
import { TEAM_MEMBERS } from './team-config';
import { supabase } from './supabase';

const ORG = process.env.ADO_ORG || '';
const PROJECT = process.env.ADO_PROJECT || '';
const PAT = process.env.ADO_PAT || '';

export function isDemoMode() {
  return false;
}

// Base Fetch Helper with Pagination support
export async function fetchOData<T>(entityAndQuery: string): Promise<T[]> {
  const cacheKey = `odata:${entityAndQuery}`;
  const cachedData = Cache.get<T[]>(cacheKey);
  if (cachedData) {
    return cachedData;
  }

  try {
    // 1. Snapshot / aggregates
    if (entityAndQuery.includes('WorkItemSnapshot')) {
      const { data, error } = await supabase.from('ado_work_items').select('*');
      if (error) throw error;
      
      const sprintMap: any = {};
      data.forEach(item => {
        if (!item.iteration_name) return;
        const team = item.team_name || "General";
        const key = `${item.iteration_name}-${team}`;
        if (!sprintMap[key]) {
          sprintMap[key] = {
            Iteration: { IterationName: item.iteration_name },
            Teams: { TeamName: team },
            TicketCount: 0,
            TotalUSP: 0
          };
        }
        sprintMap[key].TicketCount++;
        sprintMap[key].TotalUSP += (item.story_points || 0);
      });
      return Object.values(sprintMap) as T[];
    }

    // 2. Sprint Detail tickets (Multi-Project)
    if (entityAndQuery.includes('MultiSprintWorkItems') || (entityAndQuery.includes('WorkItems') && entityAndQuery.includes('Iteration/IterationName eq'))) {
      
      let crm: string | null = null;
      let bf: string | null = null;
      let find: string | null = null;
      let enh: string | null = null;
      let fallbackSprintName: string | null = null;
      
      if (entityAndQuery.includes('MultiSprintWorkItems')) {
        const urlParams = new URLSearchParams(entityAndQuery.split('?')[1] || '');
        crm = urlParams.get('crm');
        bf = urlParams.get('bf');
        find = urlParams.get('find');
        enh = urlParams.get('enh');
      } else {
        const sprintMatch = entityAndQuery.match(/Iteration\/IterationName eq '([^']+)'/);
        fallbackSprintName = sprintMatch ? sprintMatch[1] : 'Sprint 5';
      }

      let data: any[] = [];
      let error: any = null;

      if (crm !== null) {
        const iterNames = [crm, bf, find, enh].filter(Boolean);
        const result = await supabase.from('ado_work_items').select('*').in('iteration_name', iterNames).limit(5000);
        data = result.data || [];
        error = result.error;
      } else if (fallbackSprintName && fallbackSprintName.toLowerCase() !== 'all') {
        const result = await supabase.from('ado_work_items').select('*').eq('iteration_name', fallbackSprintName).limit(5000);
        data = result.data || [];
        error = result.error;
      } else {
        const result = await supabase.from('ado_work_items').select('*').limit(5000);
        data = result.data || [];
        error = result.error;
      }

      if (error) throw error;

      let filteredData = data;
      
      if (crm !== null) {
        // We are using multi-sprint logic
        filteredData = data.filter(item => {
           if (item.team_name === '2026 SF CRM Enhancements' && item.iteration_name === crm) return true;
           if (item.team_name === '2026 eCom BreakFix' && item.iteration_name === bf) return true;
           if (item.team_name === 'Findability' && item.iteration_name === find) return true;
           if (item.team_name === 'Digital Enhancements' && item.iteration_name === enh) return true;
           // If they somehow have tickets mapped to other teams, ignore them in the consolidated report
           return false;
        });
      } else if (fallbackSprintName && fallbackSprintName.toLowerCase() !== 'all') {
        filteredData = data.filter(item => item.iteration_name === fallbackSprintName);
      }

      const tickets = filteredData.map(item => ({
        WorkItemId: item.work_item_id,
        Title: item.title,
        WorkItemType: item.work_item_type,
        State: item.state,
        StoryPoints: item.story_points,
        OriginalEstimate: item.original_estimate,
        CompletedWork: item.completed_work,
        AssignedTo: { UserName: item.assigned_to },
        Teams: [{ TeamName: item.team_name }],
        Iteration: { IterationName: item.iteration_name, StartDate: item.created_date, EndDate: item.closed_date },
        ParentWorkItemId: item.parent_work_item_id,
        Developer1: item.developer_1,
        Developer2: item.developer_2,
        Tags: item.tags
      }));
      return tickets as T[];
    }

    // 3. Roadmap items (Epics/Features)
    if (entityAndQuery.includes('WorkItems') && (entityAndQuery.includes('Feature') || entityAndQuery.includes('Epic'))) {
      const { data, error } = await supabase.from('ado_work_items').select('*').in('work_item_type', ['Feature', 'Epic']);
      if (error) throw error;
      
      if (data.length === 0) {
        return [];
      }

      const roadmapItems = data.map(item => ({
        WorkItemId: item.work_item_id,
        Title: item.title,
        WorkItemType: item.work_item_type,
        State: item.state,
        Teams: [{ TeamName: item.team_name }],
        Iteration: { IterationName: item.iteration_name, StartDate: item.created_date, EndDate: item.closed_date }
      }));
      return roadmapItems as T[];
    }

    // 4. Bugs list
    if (entityAndQuery.includes('WorkItems') && entityAndQuery.includes('Bug')) {
      const { data, error } = await supabase.from('ado_work_items').select('*').eq('work_item_type', 'Bug');
      if (error) throw error;

      if (data.length === 0) {
        return [];
      }

      const bugs = data.map(item => ({
        WorkItemId: item.work_item_id,
        Title: item.title,
        State: item.state,
        Priority: item.priority,
        CreatedDate: item.created_date,
        ClosedDate: item.closed_date,
        AssignedTo: { UserName: item.assigned_to },
        Iteration: { IterationName: item.iteration_name }
      }));
      return bugs as T[];
    }

    // 5. Iterations (Sprints) list
    if (entityAndQuery.includes('Iterations')) {
      const filter = encodeURIComponent("contains(IterationPath, '2026') or contains(IterationPath, 'Findability') or contains(IterationPath, 'eCom BreakFix') or contains(IterationPath, 'Digital') or contains(IterationPath, 'crm')");
      const baseUrl = `https://analytics.dev.azure.com/${ORG}/${PROJECT}/_odata/v4.0-preview/Iterations?$select=IterationName,IterationPath,StartDate,EndDate&$filter=${filter}`;
      const authHeader = `Basic ${Buffer.from(`:${PAT}`).toString('base64')}`;
      
      try {
        const res = await fetch(baseUrl, {
          headers: {
            'Authorization': authHeader,
            'Accept': 'application/json;odata.metadata=minimal'
          },
          next: { revalidate: 3600 } // Cache for 1 hour
        });

        if (res.ok) {
          const data = await res.json();
          const items = data.value || [];
          
          const iterations = items.map((item: any) => {
            const iterPath = (item.IterationPath || '').toLowerCase();
            let mappedProjectName = 'Unknown Project';
            if (iterPath.includes('crm')) {
              mappedProjectName = '2026 SF CRM Enhancements';
            } else if (iterPath.includes('findab')) {
              mappedProjectName = 'Findability';
            } else if (iterPath.includes('breakfix') || iterPath.includes('ecombf')) {
              mappedProjectName = '2026 eCom BreakFix';
            } else if (iterPath.includes('digital') || iterPath.includes('ecomenh')) {
              mappedProjectName = 'Digital Enhancements';
            }
            
            return {
              IterationName: item.IterationName,
              ProjectName: mappedProjectName,
              StartDate: item.StartDate,
              EndDate: item.EndDate,
              IsEnded: item.EndDate ? new Date(item.EndDate).getTime() < Date.now() : false
            };
          });

          return iterations.filter((i: any) => i.ProjectName !== 'Unknown Project') as T[];
        }
      } catch(e) {
        console.error("Direct ADO fetch for Iterations failed:", e);
      }

      // Fallback to Supabase if ADO is unreachable
      const { data, error } = await supabase.from('ado_iterations').select('*').order('start_date', { ascending: true });
      if (error) throw error;
      
      if (data.length === 0) {
        return [];
      }

      const iterations = data.map(item => {
        const nameLower = (item.iteration_name || '').toLowerCase();
        let mappedProjectName = 'Unknown Project';
        if (nameLower.includes('crm')) {
          mappedProjectName = '2026 SF CRM Enhancements';
        } else if (nameLower.includes('findab') || nameLower.includes('findability')) {
          mappedProjectName = 'Findability';
        } else if (nameLower.includes('breakfix') || nameLower.includes('ecombf') || nameLower.includes('break fix')) {
          mappedProjectName = '2026 eCom BreakFix';
        } else if (nameLower.includes('digital') || nameLower.includes('ecomenh') || nameLower.includes('enhancement') || nameLower.includes('enh')) {
          mappedProjectName = 'Digital Enhancements';
        }

        return {
          IterationName: item.iteration_name,
          ProjectName: mappedProjectName,
          StartDate: item.start_date,
          EndDate: item.end_date,
          IsEnded: item.is_ended
        };
      });
      return iterations.filter((i: any) => i.ProjectName !== 'Unknown Project') as T[];
    }

    return [];
  } catch (err) {
    console.error('Supabase fetch error:', err);
    return [];
  }
}
