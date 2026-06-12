import { NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';

const ORG = process.env.ADO_ORG || '';
const PROJECT = process.env.ADO_PROJECT || '';
const PAT = process.env.ADO_PAT || '';

export async function POST(req: Request) {
  try {
    // Basic Auth Check (optional: add a secret key here to protect this endpoint)
    // const authHeader = req.headers.get('authorization');
    // if (authHeader !== `Bearer ${process.env.SYNC_SECRET}`) {
    //   return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    // }

    if (!ORG || !PAT || ORG.includes('your-org')) {
      return NextResponse.json({ error: 'ADO credentials not configured properly' }, { status: 400 });
    }

    const baseUrl = `https://analytics.dev.azure.com/${ORG}/${PROJECT}/_odata/v4.0-preview/WorkItems?$select=WorkItemId,Title,WorkItemType,State,Priority,StoryPoints,OriginalEstimate,CompletedWork,CreatedDate,ClosedDate,ParentWorkItemId&$expand=AssignedTo($select=UserName),Iteration($select=IterationName,IterationPath,StartDate,EndDate),Teams($select=TeamName),Area($select=AreaPath,AreaName),Custom_Developer1($select=UserName),Custom_Developer2($select=UserName),Tags($select=TagName)`;
    const authHeader = `Basic ${Buffer.from(`:${PAT}`).toString('base64')}`;

    let url = baseUrl;
    let allWorkItems: any[] = [];

    // Fetch from ADO with pagination
    while (url) {
      const response = await fetch(url, {
        headers: {
          'Authorization': authHeader,
          'Accept': 'application/json;odata.metadata=minimal',
          'Content-Type': 'application/json'
        }
      });

      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`ADO API HTTP ${response.status}: ${errorText || response.statusText}`);
      }

      const data = await response.json();
      const value = data.value || [];
      allWorkItems = allWorkItems.concat(value);

      url = data['@odata.nextLink'] || '';
    }

    // Filter down to the specific Area or Iteration paths requested by the user
    const allowedProjects = [
      '2026 sf crm enhancements',
      'findability',
      'findablity',
      '2026 ecom breakfix',
      'digital enhancements'
    ];

    const filteredWorkItems = allWorkItems.filter(item => {
      const areaName = (item.Area?.AreaName || '').toLowerCase();
      const areaPath = (item.Area?.AreaPath || '').toLowerCase();
      const iterName = (item.Iteration?.IterationName || '').toLowerCase();
      const iterPath = (item.Iteration?.IterationPath || '').toLowerCase();
      
      return allowedProjects.some(proj => 
        areaName.includes(proj) || areaPath.includes(proj) ||
        iterName.includes(proj) || iterPath.includes(proj)
      );
    });

    // Process and upsert to Supabase
    // 1. Upsert Iterations
    const iterationsMap = new Map();
    for (const item of filteredWorkItems) {
      if (item.Iteration && item.Iteration.IterationName) {
        iterationsMap.set(item.Iteration.IterationName, {
          iteration_name: item.Iteration.IterationName,
          start_date: item.Iteration.StartDate || null,
          end_date: item.Iteration.EndDate || null,
          is_ended: item.Iteration.EndDate ? new Date(item.Iteration.EndDate).getTime() < Date.now() : false
        });
      }
    }
    
    const iterationsToUpsert = Array.from(iterationsMap.values());
    if (iterationsToUpsert.length > 0) {
      const { error: iterError } = await supabase
        .from('ado_iterations')
        .upsert(iterationsToUpsert, { onConflict: 'iteration_name' });

      if (iterError) throw new Error(`Supabase Iteration Upsert Error: ${iterError.message}`);
    }

    // 2. Upsert Work Items
    const workItemsToUpsert = filteredWorkItems.map(item => {
      const areaName = (item.Area?.AreaName || '').toLowerCase();
      const areaPath = (item.Area?.AreaPath || '').toLowerCase();
      const iterName = (item.Iteration?.IterationName || '').toLowerCase();
      const iterPath = (item.Iteration?.IterationPath || '').toLowerCase();
      
      let mappedProjectName = 'General';
      if (areaName.includes('crm') || areaPath.includes('crm') || iterName.includes('crm') || iterPath.includes('crm')) {
         mappedProjectName = '2026 SF CRM Enhancements';
      } else if (areaName.includes('findab') || areaPath.includes('findab') || iterName.includes('findab') || iterPath.includes('findab')) {
         mappedProjectName = 'Findability';
      } else if (areaName.includes('breakfix') || areaPath.includes('breakfix') || iterName.includes('breakfix') || iterPath.includes('breakfix') || areaName.includes('ecombf') || iterName.includes('ecombf') || iterPath.includes('ecombf')) {
         mappedProjectName = '2026 eCom BreakFix';
      } else if (areaName.includes('digital') || areaPath.includes('digital') || iterName.includes('digital') || iterPath.includes('digital') || areaName.includes('ecomenh') || iterName.includes('ecomenh') || iterPath.includes('ecomenh')) {
         mappedProjectName = 'Digital Enhancements';
      } else {
         // Fallback, but filter should catch it
         mappedProjectName = item.Area?.AreaName || item.Teams?.[0]?.TeamName || 'General';
      }

      return {
        work_item_id: item.WorkItemId,
        title: item.Title,
        work_item_type: item.WorkItemType,
        state: item.State,
        priority: item.Priority || 3,
        story_points: item.StoryPoints || 0,
        original_estimate: item.OriginalEstimate || 0,
        completed_work: item.CompletedWork || 0,
        assigned_to: item.AssignedTo?.UserName || 'Unassigned',
        team_name: mappedProjectName,
        iteration_name: item.Iteration?.IterationName || null,
        created_date: item.CreatedDate || null,
        closed_date: item.ClosedDate || null,
        parent_work_item_id: item.ParentWorkItemId || null,
        developer_1: item.Custom_Developer1?.UserName || null,
        developer_2: item.Custom_Developer2?.UserName || null,
        tags: item.Tags ? item.Tags.map((t: any) => t.TagName).join(', ') : null,
        last_synced_at: new Date().toISOString()
      };
    });

    // Deduplicate work items based on work_item_id to prevent ON CONFLICT DO UPDATE errors
    const uniqueWorkItemsMap = new Map();
    for (const item of workItemsToUpsert) {
      if (!uniqueWorkItemsMap.has(item.work_item_id)) {
        uniqueWorkItemsMap.set(item.work_item_id, item);
      }
    }
    const finalWorkItemsToUpsert = Array.from(uniqueWorkItemsMap.values());

    // Upsert in batches to avoid payload size limits
    const batchSize = 1000;
    for (let i = 0; i < finalWorkItemsToUpsert.length; i += batchSize) {
      const batch = finalWorkItemsToUpsert.slice(i, i + batchSize);
      const { error: wiError } = await supabase
        .from('ado_work_items')
        .upsert(batch, { onConflict: 'work_item_id' });

      if (wiError) throw new Error(`Supabase WorkItem Upsert Error: ${wiError.message}`);
    }

    return NextResponse.json({
      success: true,
      message: `Successfully synced ${iterationsToUpsert.length} iterations and ${workItemsToUpsert.length} work items.`
    });

  } catch (error: any) {
    console.error('ADO Sync Error:', error);
    return NextResponse.json({ error: error.message || 'Failed to sync with ADO' }, { status: 500 });
  }
}
