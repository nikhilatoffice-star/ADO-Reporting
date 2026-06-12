import React from 'react';

interface StatusBadgeProps {
  status: string;
}

export default function StatusBadge({ status }: StatusBadgeProps) {
  const normalized = status.toUpperCase().trim();

  // Ratings badge styling
  if (normalized === 'GOOD') {
    return (
      <span className="inline-flex items-center px-1.5 py-0.5 rounded text-[11px] font-bold uppercase bg-[#E3FCEF] text-[#006644]">
        GOOD
      </span>
    );
  }
  
  if (normalized === 'AVG' || normalized === 'AVERAGE') {
    return (
      <span className="inline-flex items-center px-1.5 py-0.5 rounded text-[11px] font-bold uppercase bg-[#FFFAE6] text-[#974F0C]">
        AVG
      </span>
    );
  }

  if (normalized === 'LOW') {
    return (
      <span className="inline-flex items-center px-1.5 py-0.5 rounded text-[11px] font-bold uppercase bg-[#FFEBE6] text-[#BF2600]">
        LOW
      </span>
    );
  }

  if (normalized === 'WIP' || normalized === 'WORK IN PROGRESS') {
    return (
      <span className="inline-flex items-center px-1.5 py-0.5 rounded text-[11px] font-bold uppercase bg-[#DFE1E6] text-[#42526E]">
        WIP
      </span>
    );
  }

  // Ticket status badge styling
  let badgeColor = 'bg-[#DFE1E6] text-[#42526E]'; // Default grey for TO DO / NOT STARTED

  if (normalized === 'DEPLOYED' || normalized === 'DONE' || normalized === 'COMPLETED' || normalized === 'CLOSED') {
    badgeColor = 'bg-[#E3FCEF] text-[#006644]'; // Green
  } else if (
    normalized === 'IN DEV' || 
    normalized === 'ACTIVE' || 
    normalized === 'IN PROGRESS' || 
    normalized === 'IN REVIEW' || 
    normalized === 'IN DEVELOPMENT' ||
    normalized === 'RQMT REVIEW' || 
    normalized === 'UNDER REVIEW' ||
    normalized === 'QA TESTING' || 
    normalized === 'READY FOR TEST'
  ) {
    badgeColor = 'bg-[#DEEBFF] text-[#0747A6]'; // Blue
  } else if (normalized === 'BLOCKED') {
    badgeColor = 'bg-[#FFEBE6] text-[#BF2600]'; // Red
  }

  return (
    <span className={`inline-flex items-center px-1.5 py-0.5 rounded text-[11px] font-bold uppercase ${badgeColor}`}>
      {status}
    </span>
  );
}
