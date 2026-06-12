const items = [
  // PROJECTS TEAM (XCENTIUM)
  { id: "M1", title: "TP.com FP.com INT Unified eComm Platform - Phase 1 (aka MVP) ✔", type: "Epic", state: "Completed", team: "PROJECTS / TEAM [CORT/VALENTINA]", startSprint: "Sprint 2", endSprint: "Sprint 11", progress: 100 },
  { id: "M2", title: "TP.com FP.com INT Unified eComm Platform - Phase 2", type: "Epic", state: "In Progress", team: "PROJECTS / TEAM [CORT/VALENTINA]", startSprint: "Sprint 8", endSprint: "Sprint 12", progress: 0 },
  { id: "M3", title: "TP FP SF CRM - Phase 1 / Phase 2", type: "Epic", state: "In Progress", team: "PROJECTS / TEAM [CORT/VALENTINA]", startSprint: "Sprint 4", endSprint: "Sprint 14", progress: 0 },
  
  // PROJECTS TEAM (PALANTIR)
  { id: "M4", title: "Palantir AI POC / SDLC AI POC", type: "Feature", state: "In Progress", team: "PROJECTS / TEAM [BALARITHI]", startSprint: "Sprint 7", endSprint: "Sprint 13", progress: 0 },
  
  // PROJECTS TEAM (FP IT INTEGRATIONS)
  { id: "M5", title: "NEW Pricing Integration Azure for fp.com (Guest and LoggedIn users)", type: "Epic", state: "In Progress", team: "PROJECTS / TEAM [PIM / INTEGRATIONS]", startSprint: "Sprint 2", endSprint: "Sprint 12", progress: 0 },
  { id: "M6", title: "FP PDC.com ??? (2027 TBC)", type: "Epic", state: "New", team: "PROJECTS / TEAM [PIM / INTEGRATIONS]", startSprint: "Sprint 14", endSprint: "Sprint 20", progress: 0 },
  
  // PROJECTS TEAM ???
  { id: "M7", title: "TP CCC.com ??? (LATE 2026 TBC) + Canada TP.com ??? (LATE 2026 TBC)", type: "Epic", state: "New", team: "PROJECTS / TEAM [PIM / INTEGRATIONS]", startSprint: "Sprint 14", endSprint: "Sprint 20", progress: 0 },
  
  // FINDABILITY PRODUCT TEAM
  { id: "M8", title: "Coveo Update New Version ✔", type: "Feature", state: "Completed", team: "FINDABILITY PRODUCT TEAM", startSprint: "Sprint 2", endSprint: "Sprint 4", progress: 100 },
  { id: "M9", title: "Quick Reorder Links AB ✔", type: "Feature", state: "Completed", team: "FINDABILITY PRODUCT TEAM", startSprint: "Sprint 2", endSprint: "Sprint 4", progress: 100 },
  { id: "M10", title: "CTA Catch All ✔", type: "Feature", state: "Completed", team: "FINDABILITY PRODUCT TEAM", startSprint: "Sprint 4", endSprint: "Sprint 5", progress: 100 },
  { id: "M11", title: "Auto Order Approval ✔", type: "Feature", state: "Completed", team: "FINDABILITY PRODUCT TEAM", startSprint: "Sprint 5", endSprint: "Sprint 6", progress: 100 },
  { id: "M12", title: "SF Community Plus Profile/Licensing - DEV ✔", type: "Feature", state: "Completed", team: "FINDABILITY PRODUCT TEAM", startSprint: "Sprint 2", endSprint: "Sprint 6", progress: 100 },
  { id: "M13", title: "SF Community Plus Profile/Licensing - MIGRATION -> ABORTED", type: "Feature", state: "Closed", team: "FINDABILITY PRODUCT TEAM", startSprint: "Sprint 5", endSprint: "Sprint 8", progress: 0 },
  { id: "M14", title: "AB Mobile-3rd Party Payment ✔", type: "Feature", state: "Completed", team: "FINDABILITY PRODUCT TEAM", startSprint: "Sprint 7", endSprint: "Sprint 7", progress: 100 },
  { id: "M15", title: "Unit of Measure / Product Obj ✔", type: "Feature", state: "Completed", team: "FINDABILITY PRODUCT TEAM", startSprint: "Sprint 8", endSprint: "Sprint 11", progress: 100 },
  { id: "M16", title: "New Survey Tool (SurveyMonkey) ✔", type: "Feature", state: "Completed", team: "FINDABILITY PRODUCT TEAM", startSprint: "Sprint 9", endSprint: "Sprint 12", progress: 100 },
  { id: "M17", title: "AB PDP Update + PDP Top of Fold (was 3-column) ✔", type: "Feature", state: "Completed", team: "FINDABILITY PRODUCT TEAM", startSprint: "Sprint 10", endSprint: "Sprint 12", progress: 100 },
  { id: "M18", title: "Government Affiliation", type: "Feature", state: "In Progress", team: "FINDABILITY PRODUCT TEAM", startSprint: "Sprint 12", endSprint: "Sprint 13", progress: 0 },
  { id: "M19", title: "Loyalty Dash Redesign (TBC)", type: "Feature", state: "New", team: "FINDABILITY PRODUCT TEAM", startSprint: "Sprint 13", endSprint: "Sprint 14", progress: 0 },
  { id: "M20", title: "AB MyItems (TBC)", type: "Feature", state: "New", team: "FINDABILITY PRODUCT TEAM", startSprint: "Sprint 13", endSprint: "Sprint 14", progress: 0 },
  { id: "M21", title: "Quick Filters (TBC)", type: "Feature", state: "New", team: "FINDABILITY PRODUCT TEAM", startSprint: "Sprint 13", endSprint: "Sprint 14", progress: 0 },
  { id: "M22", title: "AB Item Out Of Stock (TBC)", type: "Feature", state: "New", team: "FINDABILITY PRODUCT TEAM", startSprint: "Sprint 14", endSprint: "Sprint 14", progress: 0 },
  
  // ENHANCEMENTS PRODUCT TEAM
  { id: "M23", title: "Link My Account ✔", type: "Feature", state: "Completed", team: "ENHANCEMENTS PRODUCT TEAM", startSprint: "Sprint 2", endSprint: "Sprint 3", progress: 100 },
  { id: "M24", title: "Advanced Availability UX ✔", type: "Feature", state: "Completed", team: "ENHANCEMENTS PRODUCT TEAM", startSprint: "Sprint 3", endSprint: "Sprint 5", progress: 100 },
  { id: "M25", title: "Advanced Availability POC (UIUX) ✔", type: "Feature", state: "Completed", team: "ENHANCEMENTS PRODUCT TEAM", startSprint: "Sprint 4", endSprint: "Sprint 6", progress: 100 },
  { id: "M26", title: "Pin Favorite Child Account aka Quick Changes Branch ✔", type: "Feature", state: "Completed", team: "ENHANCEMENTS PRODUCT TEAM", startSprint: "Sprint 4", endSprint: "Sprint 6", progress: 100 },
  { id: "M27", title: "Kount360 updates (HIGH PRIORITY ITEMS) ✔", type: "Feature", state: "Completed", team: "ENHANCEMENTS PRODUCT TEAM", startSprint: "Sprint 5", endSprint: "Sprint 7", progress: 100 },
  { id: "M28", title: "Preferred Catalog Item Tag ✔", type: "Feature", state: "Completed", team: "ENHANCEMENTS PRODUCT TEAM", startSprint: "Sprint 5", endSprint: "Sprint 7", progress: 100 },
  { id: "M29", title: "Homepage Update ✔", type: "Feature", state: "Completed", team: "ENHANCEMENTS PRODUCT TEAM", startSprint: "Sprint 8", endSprint: "Sprint 10", progress: 100 },
  { id: "M30", title: "Advanced Availability (OMS extras)", type: "Feature", state: "In Progress", team: "ENHANCEMENTS PRODUCT TEAM", startSprint: "Sprint 8", endSprint: "Sprint 12", progress: 0 },
  { id: "M31", title: "PunchOut Improvements ✔", type: "Feature", state: "Completed", team: "ENHANCEMENTS PRODUCT TEAM", startSprint: "Sprint 10", endSprint: "Sprint 11", progress: 100 },
  { id: "M32", title: "PO Number Validation", type: "Feature", state: "In Progress", team: "ENHANCEMENTS PRODUCT TEAM", startSprint: "Sprint 10", endSprint: "Sprint 12", progress: 0 },
  { id: "M33", title: "AI Assisted POC - Extended Invoice Details", type: "Feature", state: "In Progress", team: "ENHANCEMENTS PRODUCT TEAM", startSprint: "Sprint 11", endSprint: "Sprint 12", progress: 0 },
  { id: "M34", title: "Provisional Admin Setting", type: "Feature", state: "In Progress", team: "ENHANCEMENTS PRODUCT TEAM", startSprint: "Sprint 11", endSprint: "Sprint 12", progress: 0 },
  { id: "M35", title: "Cart Page Update (AFTER AB 3 COL)", type: "Feature", state: "In Progress", team: "ENHANCEMENTS PRODUCT TEAM", startSprint: "Sprint 13", endSprint: "Sprint 14", progress: 0 },
  { id: "M36", title: "SF CMS POC", type: "Feature", state: "In Progress", team: "ENHANCEMENTS PRODUCT TEAM", startSprint: "Sprint 13", endSprint: "Sprint 13", progress: 0 },
  { id: "M37", title: "Extended Invoice Details", type: "Feature", state: "In Progress", team: "ENHANCEMENTS PRODUCT TEAM", startSprint: "Sprint 13", endSprint: "Sprint 14", progress: 0 },
  { id: "M38", title: "Kount360 additions (TBC)", type: "Feature", state: "New", team: "ENHANCEMENTS PRODUCT TEAM", startSprint: "Sprint 13", endSprint: "Sprint 14", progress: 0 },
  { id: "M39", title: "Ship Complete (TBC)", type: "Feature", state: "New", team: "ENHANCEMENTS PRODUCT TEAM", startSprint: "Sprint 13", endSprint: "Sprint 14", progress: 0 },
  
  // BREAKFIX PRODUCT TEAM
  { id: "M40", title: "BreakFix Q1 priorities - latest priorities ✔", type: "Feature", state: "Completed", team: "BREAKFIX PRODUCT TEAM", startSprint: "Sprint 2", endSprint: "Sprint 7", progress: 100 },
  { id: "M41", title: "BreakFix Q2 priorities - latest priorities", type: "Feature", state: "In Progress", team: "BREAKFIX PRODUCT TEAM", startSprint: "Sprint 8", endSprint: "Sprint 13", progress: 0 },
  { id: "M42", title: "BreakFix Q3 priorities - latest priorities", type: "Feature", state: "New", team: "BREAKFIX PRODUCT TEAM", startSprint: "Sprint 14", endSprint: "Sprint 20", progress: 0 },
  
  // SFMC PRODUCT TEAM
  { id: "M43", title: "SFMC Q1 priorities - various ongoings ✔", type: "Feature", state: "Completed", team: "SFMC PRODUCT TEAM", startSprint: "Sprint 2", endSprint: "Sprint 7", progress: 100 },
  { id: "M44", title: "SFMC Q2 priorities - various ongoings", type: "Feature", state: "In Progress", team: "SFMC PRODUCT TEAM", startSprint: "Sprint 8", endSprint: "Sprint 13", progress: 0 },
  { id: "M45", title: "SFMC Q3 priorities - various ongoings", type: "Feature", state: "New", team: "SFMC PRODUCT TEAM", startSprint: "Sprint 14", endSprint: "Sprint 20", progress: 0 },
  
  // SF CRM PRODUCT TEAM
  { id: "M46", title: "SF CRM Q1 priorities - Phase 1 items ✔", type: "Feature", state: "Completed", team: "SF COMMERCE TEAM", startSprint: "Sprint 2", endSprint: "Sprint 7", progress: 100 },
  { id: "M47", title: "SF CRM Q2 priorities - Phase 1 items", type: "Feature", state: "In Progress", team: "SF COMMERCE TEAM", startSprint: "Sprint 8", endSprint: "Sprint 9", progress: 0 },
  { id: "M48", title: "Coveo ML recommendations (for SF CRM)", type: "Feature", state: "In Progress", team: "SF COMMERCE TEAM", startSprint: "Sprint 10", endSprint: "Sprint 11", progress: 0 },
  { id: "M49", title: "SF CRM Q3 priorities - Phase 1 items", type: "Feature", state: "New", team: "SF COMMERCE TEAM", startSprint: "Sprint 13", endSprint: "Sprint 20", progress: 0 },
  
  // SEO / SEM / GA4 TEAM
  { id: "M50", title: "SEO / SEM / GA4 Q1 priorities - various ongoings ✔", type: "Feature", state: "Completed", team: "SEO / SEM / GA4 TEAM", startSprint: "Sprint 2", endSprint: "Sprint 7", progress: 100 },
  { id: "M51", title: "SEO / SEM / GA4 Q2 priorities - various ongoings", type: "Feature", state: "In Progress", team: "SEO / SEM / GA4 TEAM", startSprint: "Sprint 8", endSprint: "Sprint 13", progress: 0 },
  { id: "M52", title: "SEO / SEM / GA4 Q3 priorities - various ongoings", type: "Feature", state: "New", team: "SEO / SEM / GA4 TEAM", startSprint: "Sprint 14", endSprint: "Sprint 20", progress: 0 }
];

async function seed() {
  try {
    console.log(`Seeding ${items.length} items to the API...`);
    const res = await fetch('http://localhost:3000/api/roadmap', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ items })
    });
    const json = await res.json();
    console.log("Response:", json);
  } catch (e) {
    console.error("Failed:", e);
  }
}

seed();
