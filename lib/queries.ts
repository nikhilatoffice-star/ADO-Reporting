export const QUERIES = {
  // Query to get overall velocity metrics grouped by sprint and team
  DASHBOARD_VELOCITY: `WorkItemSnapshot?$apply=filter(WorkItemType ne 'Task' and StateCategory ne 'Removed' and Iteration/IterationName ne null)/groupby((Iteration/IterationName,Iteration/StartDate,Iteration/EndDate),aggregate(Count with sum as TicketCount, StoryPoints with sum as TotalUSP, CompletedWork with sum as TotalCompletedWork))`,

  // Query to get tickets for a specific sprint
  sprintDetails: (sprintName: string) => 
    `WorkItems?$filter=Iteration/IterationName eq '${sprintName}' and WorkItemType ne 'Task' and StateCategory ne 'Removed'&$select=WorkItemId,Title,WorkItemType,State,StoryPoints,OriginalEstimate,CompletedWork,Tags&$expand=AssignedTo($select=UserName),Teams($select=TeamName),Iteration($select=IterationName,StartDate,EndDate)`,

  // Query to get Roadmap items (Epics and Features)
  ROADMAP: `WorkItems?$filter=(WorkItemType eq 'Feature' or WorkItemType eq 'Epic') and StateCategory ne 'Removed'&$select=WorkItemId,Title,WorkItemType,State,CreatedDate&$expand=Teams($select=TeamName),Iteration($select=IterationName,StartDate,EndDate)`,

  // Query to get bugs for trend lines and oldest open bugs table
  BUGS: `WorkItems?$filter=WorkItemType eq 'Bug' and StateCategory ne 'Removed'&$select=WorkItemId,Title,State,Priority,CreatedDate,ClosedDate&$expand=AssignedTo($select=UserName),Iteration($select=IterationName,StartDate,EndDate)`
};
