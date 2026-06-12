import { TeamMember } from './types';

export const TEAM_MEMBERS: TeamMember[] = [
  { 
    name: "Ritesh", 
    adoName: "Wagh, Ritesh", 
    role: "SF Dev Lead", 
    type: "FTE", 
    team: "Findability/ToF", 
    notes: "Interested in career path opportunities",
    leadershipRating: "GOOD",
    techRating: "GOOD"
  },
  { 
    name: "Venky", 
    adoName: "Mekala, Venkaiah", 
    role: "SF Dev Lead", 
    type: "FTE", 
    team: "Enhancements/BoF", 
    notes: "Moving admin tasks to Miles",
    leadershipRating: "GOOD",
    techRating: "AVG"
  },
  { 
    name: "Rohit", 
    adoName: "Taralkar,Rohit", 
    role: "SF Dev Sr", 
    type: "Consultant Offshore", 
    team: "Enhancements/BoF", 
    notes: "",
    leadershipRating: "WIP",
    techRating: "AVG"
  },
  { 
    name: "Jasveer", 
    adoName: "Singh,Jasveer", 
    role: "SF Dev Sr", 
    type: "Consultant Offshore", 
    team: "Enhancements/BoF", 
    notes: "Stable perf overall",
    leadershipRating: "AVG",
    techRating: "AVG"
  },
  { 
    name: "Sumedh", 
    adoName: "Agarwal,Sumedh", 
    role: "SF Dev", 
    type: "Consultant Offshore", 
    team: "Enhancements/BoF", 
    notes: "",
    leadershipRating: "WIP",
    techRating: "AVG"
  },
  { 
    name: "Devanshu", 
    adoName: "Verma,Devanshu", 
    role: "SF Dev", 
    type: "Consultant Offshore", 
    team: "Enhancements/BoF", 
    notes: "",
    leadershipRating: "WIP",
    techRating: "AVG"
  },
  { 
    name: "Amarjit", 
    adoName: "Singh,Amarjit", 
    role: "SF Dev Sr", 
    type: "Consultant Offshore", 
    team: "Enhancements/BoF", 
    notes: "Stable perf overall",
    leadershipRating: "AVG",
    techRating: "AVG"
  },
  { 
    name: "Sanjay", 
    adoName: "Kumar,Sanjay", 
    role: "SF Dev", 
    type: "Consultant Offshore", 
    team: "BreakFix", 
    notes: "Recently moved to BreakFix",
    leadershipRating: "WIP",
    techRating: "AVG"
  },
  { 
    name: "Bharat", 
    adoName: "Periyadurai,P", 
    role: "SF Dev Lead", 
    type: "Consultant Offshore", 
    team: "Findability/ToF", 
    notes: "Coveo dev KT/learning curve",
    leadershipRating: "WIP",
    techRating: "WIP"
  },
  { 
    name: "Aditya", 
    adoName: "Singh,Aditya Vikram", 
    role: "SF Dev", 
    type: "Consultant Offshore", 
    team: "2026 SF CRM Enhancements", 
    notes: "",
    leadershipRating: "WIP",
    techRating: "WIP"
  }
];

export const DEV_NAMES = ['Ritesh', 'Venky', 'Miles', 'Amarjit', 'Jasveer', 'Sanjay', 'Bharat', 'Aditya', 'Venkat', 'Bert', 'Daulton', 'Shan', 'Prasad', 'Eva'];

export function getShortName(fullName: string): string {
  if (!fullName) return '';
  const cleanFull = fullName.toLowerCase().replace(/[\s,]+/g, '');
  
  // Custom alias mapping for full names to short names (cleaned keys)
  const aliasMap: Record<string, string> = {
    "venkaiahmekala": "Venky",
    "mekalavenkaiah": "Venky",
    "waghritesh": "Ritesh",
    "riteshwagh": "Ritesh",
    "taralkarrohit": "Rohit",
    "rohittaralkar": "Rohit",
    "singhjasveer": "Jasveer",
    "jasveersingh": "Jasveer",
    "agarwalsumedh": "Sumedh",
    "sumedhagarwal": "Sumedh",
    "vermadevanshu": "Devanshu",
    "devanshuverma": "Devanshu",
    "singhamarjit": "Amarjit",
    "amarjitsingh": "Amarjit",
    "kumarsanjay": "Sanjay",
    "sanjaykumar": "Sanjay",
    "periyaduraip": "Bharat",
    "pperiyadurai": "Bharat",
    "rajpalibharatsingh": "Bharat",
    "bharatsinghrajpali": "Bharat",
    "singhadityavikram": "Aditya",
    "adityavikramsingh": "Aditya",
    "mileshummedson": "Miles",
    "evasmith": "Eva",
    "bert": "Bert",
    "daulton": "Daulton",
    "shan": "Shan",
    "prasad": "Prasad"
  };

  for (const [key, val] of Object.entries(aliasMap)) {
    if (cleanFull.includes(key)) return val;
  }

  for (const name of DEV_NAMES) {
    if (cleanFull.includes(name.toLowerCase())) {
      return name;
    }
  }

  const parts = fullName.split(/[\s,]+/);
  return parts[0] || fullName;
}
