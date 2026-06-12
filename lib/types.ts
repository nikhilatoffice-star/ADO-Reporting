export interface ADOUser {
  UserName: string;
}

export interface ADOTeam {
  TeamName: string;
}

export interface ADOIteration {
  IterationName: string;
  ProjectName?: string;
  StartDate?: string;
  EndDate?: string;
  IsEnded?: boolean;
  Month?: string;
  Year?: string;
}

export interface ADOWorkItem {
  WorkItemId: number;
  Title: string;
  WorkItemType: string;
  State: string;
  StoryPoints: number | null;
  OriginalEstimate: number | null;
  CompletedWork: number | null;
  AssignedTo: ADOUser | null;
  Teams: ADOTeam[] | null;
  Iteration: ADOIteration | null;
  CreatedDate?: string;
  ClosedDate?: string;
  Priority?: number;
  ParentWorkItemId?: number | null;
  Developer1?: string;
  Developer2?: string;
  Tags?: string | null;
}

export interface DevSummary {
  name: string;
  tickets: number;
  storyPoints: number;
  hours: number;
}

export interface SprintData {
  sprintName: string;
  releaseDate: string;
  startDate?: string;
  endDate?: string;
  findabilityTickets: number;
  findabilityUSP: number;
  breakfixTickets: number;
  breakfixUSP: number;
  totalTickets: number;
  totalUSP: number;
  totalHours: number;
  deployedItems: Array<{
    title: string;
    team: string;
    storyPoints: number;
    developer: string;
  }>;
  movedItems: Array<{
    title: string;
    movedTo: string;
    notes: string;
  }>;
  devSummary: DevSummary[];
}

export interface TeamMember {
  name: string;
  adoName: string;
  role: string;
  type: string;
  team: string;
  notes: string;
  leadershipRating?: 'GOOD' | 'AVG' | 'LOW' | 'WIP';
  techRating?: 'GOOD' | 'AVG' | 'LOW' | 'WIP';
  baseTickets?: number;
  baseUsp?: number;
  baseSprints?: number;
}

export interface RoadmapItem {
  id: string; // Epic/Feature ID
  title: string;
  type: 'Feature' | 'Epic';
  state: string;
  team: string;
  startSprint: string;
  endSprint: string;
  startDate?: string;
  endDate?: string;
  progress?: number; // 0 to 100
}

export interface BugItem {
  id: number;
  title: string;
  state: string;
  priority: number;
  createdDate: string;
  closedDate: string | null;
  assignee: string;
  sprintName: string;
}
