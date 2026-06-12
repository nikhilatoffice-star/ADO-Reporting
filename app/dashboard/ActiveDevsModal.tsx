'use client';

import React, { useState } from 'react';
import { UserCheck, X } from 'lucide-react';

interface ActiveDevsModalProps {
  count: number;
  devs: {
    name: string;
    hours: number;
    storyPoints: number;
  }[];
}

export default function ActiveDevsModal({ count, devs }: ActiveDevsModalProps) {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <>
      {/* Clickable KPI Card */}
      <div 
        className="bg-white border border-[#DFE1E6] rounded-md p-5 shadow-sm flex items-center justify-between hover:shadow-md hover:border-[#B3BAC5] transition cursor-pointer"
        onClick={() => setIsOpen(true)}
      >
        <div className="flex flex-col space-y-1">
          <span className="text-xs text-[#6B778C] uppercase font-bold tracking-wider">Active Devs</span>
          <span className="text-3xl font-extrabold text-[#172B4D]">{count}</span>
          <span className="text-[10px] text-[#0052CC] font-semibold underline underline-offset-2">View active devs</span>
        </div>
        <div className="bg-[#FFEBE6] p-3 rounded">
          <UserCheck className="w-6 h-6 text-[#BF2600]" />
        </div>
      </div>

      {/* Modal Popup */}
      {isOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50">
          <div className="bg-white rounded-md shadow-lg w-full max-w-lg mx-4 overflow-hidden flex flex-col max-h-[80vh] animate-in fade-in zoom-in duration-200">
            {/* Modal Header */}
            <div className="flex items-center justify-between px-5 py-4 border-b border-[#DFE1E6] bg-white">
              <h3 className="text-lg font-bold text-[#172B4D] flex items-center space-x-2">
                <UserCheck className="w-5 h-5 text-[#BF2600]" />
                <span>Active Developers ({count})</span>
              </h3>
              <button 
                onClick={(e) => { e.stopPropagation(); setIsOpen(false); }}
                className="text-[#6B778C] hover:text-[#172B4D] transition p-1"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            
            {/* Modal Body with Table */}
            <div className="overflow-y-auto p-5 bg-white">
              <table className="w-full text-sm text-left text-[#172B4D]">
                <thead className="text-xs text-[#6B778C] uppercase bg-[#F4F5F7] border-b border-[#DFE1E6]">
                  <tr>
                    <th scope="col" className="px-4 py-3 rounded-tl-md rounded-bl-md w-12 text-center">#</th>
                    <th scope="col" className="px-4 py-3">Developer Name</th>
                    <th scope="col" className="px-4 py-3 text-right">Story Points</th>
                    <th scope="col" className="px-4 py-3 text-right rounded-tr-md rounded-br-md">Hours</th>
                  </tr>
                </thead>
                <tbody>
                  {devs.map((dev, idx) => (
                    <tr key={idx} className="border-b border-[#EBECF0] hover:bg-[#FAFBFC] transition">
                      <td className="px-4 py-3 text-[#6B778C] font-medium text-center">{idx + 1}</td>
                      <td className="px-4 py-3 font-semibold">{dev.name}</td>
                      <td className="px-4 py-3 text-right font-bold text-[#0052CC]">{dev.storyPoints} SP</td>
                      <td className="px-4 py-3 text-right font-bold text-[#006644]">{dev.hours.toFixed(1)}h</td>
                    </tr>
                  ))}
                  {devs.length === 0 && (
                    <tr>
                      <td colSpan={4} className="px-4 py-6 text-center text-[#6B778C] italic">
                        No active developers found for the selected sprints.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
            
            {/* Modal Footer */}
            <div className="px-5 py-3 border-t border-[#DFE1E6] bg-[#F4F5F7] flex justify-end">
              <button 
                onClick={(e) => { e.stopPropagation(); setIsOpen(false); }}
                className="px-4 py-2 bg-[#0052CC] text-white text-sm font-semibold rounded hover:bg-[#0047B3] transition"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
