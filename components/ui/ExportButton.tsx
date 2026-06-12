'use client';

import React, { useState } from 'react';
import { FileDown, Loader2 } from 'lucide-react';

interface ExportButtonProps {
  pageName: string;
  sprintName: string;
}

export default function ExportButton({ pageName, sprintName }: ExportButtonProps) {
  const [isExporting, setIsExporting] = useState(false);

  const handleExport = async () => {
    setIsExporting(true);
    const dateStr = new Date().toISOString().split('T')[0];
    const fileName = `sprint-report-${sprintName.replace(/\s+/g, '-')}-${dateStr}.pdf`;

    try {
      // API call to Puppeteer generator
      const res = await fetch(`/api/export/${pageName}?sprint=${encodeURIComponent(sprintName)}`);
      
      if (!res.ok) {
        throw new Error('Export service returned non-200');
      }

      const blob = await res.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = fileName;
      document.body.appendChild(a);
      a.click();
      a.remove();
      window.URL.revokeObjectURL(url);
    } catch (err) {
      console.warn('Puppeteer export failed or unavailable. Falling back to native browser print.', err);
      // Fallback: trigger standard browser printing (CSS styled for print)
      window.print();
    } finally {
      setIsExporting(false);
    }
  };

  return (
    <button
      onClick={handleExport}
      disabled={isExporting}
      className="flex items-center space-x-2 bg-[#091E420A] hover:bg-[#091E4214] disabled:opacity-50 text-[#42526E] hover:text-[#172B4D] font-medium px-3 py-1.5 rounded text-sm transition-colors cursor-pointer print:hidden"
    >
      {isExporting ? (
        <>
          <Loader2 className="w-4 h-4 animate-spin" />
          <span>Exporting...</span>
        </>
      ) : (
        <>
          <FileDown className="w-4 h-4" />
          <span>Export PDF</span>
        </>
      )}
    </button>
  );
}
