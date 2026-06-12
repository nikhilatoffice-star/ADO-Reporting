const { createClient } = require('@supabase/supabase-js');

const supabase = createClient('https://xffpaburnfrekuutolxm.supabase.co', 'sb_publishable_o-eGXbpGJAlXXece70knGA_C9mRO-6f');

const items = [
  // CONFIG
  { id: 'CONFIG_SPRINTS', title: JSON.stringify({ startNum: 8, startDate: '2026-04-06', currentNum: 12 }), type: 'Config', state: 'New', team: 'CONFIG', startSprint: '', endSprint: '', progress: 0 },

  // PROJECTS TEAM (XCENTIUM)
  { id: 'item-x1', title: 'Platform - Phase 2', team: 'PROJECTS TEAM (XCENTIUM)', startSprint: 'Sprint 8', endSprint: 'Sprint 12', type: 'Epic', state: 'Active', progress: 50 },
  { id: 'item-x2', title: '- Phase 1 / Phase 2', team: 'PROJECTS TEAM (XCENTIUM)', startSprint: 'Sprint 8', endSprint: 'Sprint 14', type: 'Epic', state: 'Active', progress: 40 },

  // PROJECTS TEAM (PALANTIR)
  { id: 'item-p1', title: 'Palantir AI POC / SDLC AI POC', team: 'PROJECTS TEAM (PALANTIR)', startSprint: 'Sprint 8', endSprint: 'Sprint 13', type: 'Epic', state: 'Active', progress: 30 },

  // PROJECTS TEAM (FP IT INTEGRATIONS)
  { id: 'item-fp1', title: 'FP PDC.com ??? (2027 TBC)', team: 'PROJECTS TEAM (FP IT INTEGRATIONS)', startSprint: 'Sprint 14', endSprint: 'Sprint 22', type: 'Epic', state: 'New', progress: 0 },

  // PROJECTS TEAM ???
  { id: 'item-tp1', title: 'TP CCC.com ??? (LATE 2026 TBC) + Canada TP.com ???', team: 'PROJECTS TEAM', startSprint: 'Sprint 14', endSprint: 'Sprint 24', type: 'Epic', state: 'New', progress: 0 },

  // FINDABILITY PRODUCT TEAM
  { id: 'item-f1', title: 'New Survey Tool (SurveyMonkey) ✅', team: 'FINDABILITY PRODUCT TEAM', startSprint: 'Sprint 8', endSprint: 'Sprint 12', type: 'Epic', state: 'Closed', progress: 100 },
  { id: 'item-f2', title: 'Product Obj ✅', team: 'FINDABILITY PRODUCT TEAM', startSprint: 'Sprint 8', endSprint: 'Sprint 11', type: 'Epic', state: 'Closed', progress: 100 },
  { id: 'item-f3', title: 'AB PDP Update + PDP Top of Fold ✅', team: 'FINDABILITY PRODUCT TEAM', startSprint: 'Sprint 8', endSprint: 'Sprint 12', type: 'Epic', state: 'Closed', progress: 100 },
  { id: 'item-f4', title: 'Government Affiliation', team: 'FINDABILITY PRODUCT TEAM', startSprint: 'Sprint 12', endSprint: 'Sprint 13', type: 'Epic', state: 'Active', progress: 0 },
  { id: 'item-f5', title: 'AB MyItems (TBC)', team: 'FINDABILITY PRODUCT TEAM', startSprint: 'Sprint 13', endSprint: 'Sprint 14', type: 'Epic', state: 'New', progress: 0 },
  { id: 'item-f6', title: 'Quick Filters (TBC)', team: 'FINDABILITY PRODUCT TEAM', startSprint: 'Sprint 13', endSprint: 'Sprint 14', type: 'Epic', state: 'New', progress: 0 },
  { id: 'item-f7', title: 'Loyalty Dash Redesign (TBC)', team: 'FINDABILITY PRODUCT TEAM', startSprint: 'Sprint 13', endSprint: 'Sprint 15', type: 'Epic', state: 'New', progress: 0 },
  { id: 'item-f8', title: 'AB Item Out Of Stock (TBC)', team: 'FINDABILITY PRODUCT TEAM', startSprint: 'Sprint 14', endSprint: 'Sprint 15', type: 'Epic', state: 'New', progress: 0 },

  // ENHANCEMENTS PRODUCT TEAM
  { id: 'item-e1', title: 'AI Assisted POC: ✅ / Extended Invoice Details', team: 'ENHANCEMENTS PRODUCT TEAM', startSprint: 'Sprint 8', endSprint: 'Sprint 11', type: 'Epic', state: 'Closed', progress: 100 },
  { id: 'item-e2', title: 'OMS extras', team: 'ENHANCEMENTS PRODUCT TEAM', startSprint: 'Sprint 8', endSprint: 'Sprint 11', type: 'Epic', state: 'Closed', progress: 100 },
  { id: 'item-e3', title: 'Update ✅', team: 'ENHANCEMENTS PRODUCT TEAM', startSprint: 'Sprint 8', endSprint: 'Sprint 11', type: 'Epic', state: 'Closed', progress: 100 },
  { id: 'item-e4', title: 'PunchOut Improvements ✅', team: 'ENHANCEMENTS PRODUCT TEAM', startSprint: 'Sprint 8', endSprint: 'Sprint 12', type: 'Epic', state: 'Closed', progress: 100 },
  { id: 'item-e5', title: 'PO Number Validation', team: 'ENHANCEMENTS PRODUCT TEAM', startSprint: 'Sprint 10', endSprint: 'Sprint 13', type: 'Epic', state: 'Active', progress: 50 },
  { id: 'item-e6', title: 'Provisional Admin Setting', team: 'ENHANCEMENTS PRODUCT TEAM', startSprint: 'Sprint 11', endSprint: 'Sprint 12', type: 'Epic', state: 'Active', progress: 50 },
  { id: 'item-e7', title: 'Extended Invoice Details', team: 'ENHANCEMENTS PRODUCT TEAM', startSprint: 'Sprint 12', endSprint: 'Sprint 14', type: 'Epic', state: 'Active', progress: 20 },
  { id: 'item-e8', title: 'SF CMS POC', team: 'ENHANCEMENTS PRODUCT TEAM', startSprint: 'Sprint 13', endSprint: 'Sprint 14', type: 'Epic', state: 'New', progress: 0 },
  { id: 'item-e9', title: 'Kount360 additions (TBC)', team: 'ENHANCEMENTS PRODUCT TEAM', startSprint: 'Sprint 13', endSprint: 'Sprint 14', type: 'Epic', state: 'New', progress: 0 },
  { id: 'item-e10', title: 'Ship Complete (TBC)', team: 'ENHANCEMENTS PRODUCT TEAM', startSprint: 'Sprint 13', endSprint: 'Sprint 14', type: 'Epic', state: 'New', progress: 0 },
  { id: 'item-e11', title: 'Cart Page Update (AFTER AB 3 COL)', team: 'ENHANCEMENTS PRODUCT TEAM', startSprint: 'Sprint 14', endSprint: 'Sprint 16', type: 'Epic', state: 'New', progress: 0 },

  // BREAKFIX PRODUCT TEAM
  { id: 'item-b1', title: 'BreakFix Q2 priorities - latest priorities', team: 'BREAKFIX PRODUCT TEAM', startSprint: 'Sprint 8', endSprint: 'Sprint 14', type: 'Epic', state: 'Active', progress: 80 },
  { id: 'item-b2', title: 'BreakFix Q3 priorities - latest priorities', team: 'BREAKFIX PRODUCT TEAM', startSprint: 'Sprint 15', endSprint: 'Sprint 22', type: 'Epic', state: 'New', progress: 0 },

  // SFMC PRODUCT TEAM
  { id: 'item-s1', title: 'SFMC Q2 priorities - various ongoings', team: 'SFMC PRODUCT TEAM', startSprint: 'Sprint 8', endSprint: 'Sprint 14', type: 'Epic', state: 'Active', progress: 80 },
  { id: 'item-s2', title: 'SFMC Q3 priorities - various ongoings', team: 'SFMC PRODUCT TEAM', startSprint: 'Sprint 15', endSprint: 'Sprint 22', type: 'Epic', state: 'New', progress: 0 }
];

async function run() {
  await supabase.from('roadmap_items').delete().neq('id', 'xxxxxx'); // Delete all
  
  const mappedItems = items.map(item => ({
    id: item.id,
    title: item.title,
    team: item.team,
    type: item.type,
    state: item.state,
    progress: item.progress,
    start_sprint: item.startSprint,
    end_sprint: item.endSprint
  }));

  const res = await supabase.from('roadmap_items').insert(mappedItems);
  console.log("Inserted!", res);
}

run();
