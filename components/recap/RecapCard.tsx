'use client';

import React, { useState } from 'react';
import { 
  Sparkles, 
  Copy, 
  Check, 
  RotateCw, 
  CheckCircle2, 
  AlertTriangle, 
  ShieldAlert,
  Loader2
} from 'lucide-react';

interface RecapCardProps {
  sprintName: string;
  initialText: string;
}

interface Section {
  title: string;
  content: string;
  type: 'delivery' | 'slippage' | 'risk';
}

export default function RecapCard({ sprintName, initialText }: RecapCardProps) {
  const [text, setText] = useState(initialText);
  const [isRegenerating, setIsRegenerating] = useState(false);
  const [isCopied, setIsCopied] = useState(false);

  // Parse the AI response into distinct sections
  const parseSections = (rawText: string): Section[] => {
    const sections: Section[] = [];
    
    // Split on headers (### 1., ### 2., ### 3. or similar)
    const matches = rawText.split(/(?=###?\s+\d+\.|\*\*What was delivered\*\*|\*\*What slipped and why\*\*|\*\*Risks & recommendations\*\*)/g);

    matches.forEach(chunk => {
      const trimmed = chunk.trim();
      if (!trimmed) return;

      let type: 'delivery' | 'slippage' | 'risk' = 'delivery';
      let title = 'Summary';
      let content = trimmed;

      if (trimmed.toLowerCase().includes('delivered')) {
        type = 'delivery';
        title = 'What Was Delivered & Business Value';
        content = trimmed.replace(/###?\s+\d+\.?\s*\*?\*?What was delivered\*?\*?/, '').trim();
      } else if (trimmed.toLowerCase().includes('slip') || trimmed.toLowerCase().includes('completed')) {
        type = 'slippage';
        title = 'What Slipped & Remediation';
        content = trimmed.replace(/###?\s+\d+\.?\s*\*?\*?What slipped and why\*?\*?/, '').trim();
      } else if (trimmed.toLowerCase().includes('risk') || trimmed.toLowerCase().includes('recommend')) {
        type = 'risk';
        title = 'Risks & Actionable Recommendations';
        content = trimmed.replace(/###?\s+\d+\.?\s*\*?\*?Risks & recommendations\*?\*?/, '').trim();
      }

      // Clean up markdown syntax inside content
      const cleanedContent = content
        .replace(/^###?\s+\d+\.?\s*.*$/m, '') // Remove remaining section title lines
        .replace(/^\s*-\s+/gm, '• ') // Convert hyphens to bullet points
        .trim();

      if (cleanedContent) {
        sections.push({ title, content: cleanedContent, type });
      }
    });

    // If parsing failed or returned too few sections, fall back to simple rendering
    if (sections.length === 0) {
      sections.push({
        title: 'Executive Sprint Summary Narrative',
        content: rawText,
        type: 'delivery'
      });
    }

    return sections;
  };

  const sections = parseSections(text);

  const copyToClipboard = async () => {
    try {
      // Clean up markdown markers for plain text copy
      const cleanText = text
        .replace(/###?\s+/g, '')
        .replace(/\*\*/g, '');

      await navigator.clipboard.writeText(cleanText);
      setIsCopied(true);
      setTimeout(() => setIsCopied(false), 2000);
    } catch (err) {
      console.error('Failed to copy to clipboard', err);
    }
  };

  const handleRegenerate = async () => {
    setIsRegenerating(true);
    try {
      const res = await fetch(`/api/recap?sprint=${encodeURIComponent(sprintName)}&force=true`);
      if (!res.ok) {
        throw new Error('Failed to regenerate recap');
      }
      const data = await res.json();
      if (data.success && data.text) {
        setText(data.text);
      }
    } catch (err) {
      console.error(err);
      alert('Error regenerating summary');
    } finally {
      setIsRegenerating(false);
    }
  };

  const getSectionStyles = (type: 'delivery' | 'slippage' | 'risk') => {
    switch (type) {
      case 'delivery':
        return {
          icon: CheckCircle2,
          iconColor: 'text-[#006644]',
          bgColor: 'bg-[#E3FCEF]',
          borderColor: 'border-[#006644]/20 hover:border-[#006644]/40',
        };
      case 'slippage':
        return {
          icon: AlertTriangle,
          iconColor: 'text-[#FF8B00]',
          bgColor: 'bg-[#FFFAE6]',
          borderColor: 'border-[#FF8B00]/20 hover:border-[#FF8B00]/40',
        };
      case 'risk':
        return {
          icon: ShieldAlert,
          iconColor: 'text-[#BF2600]',
          bgColor: 'bg-[#FFEBE6]',
          borderColor: 'border-[#BF2600]/20 hover:border-[#BF2600]/40',
        };
    }
  };

  return (
    <div className="flex flex-col space-y-6 relative">
      {/* Action Bar */}
      <div className="flex justify-between items-center bg-white border border-[#DFE1E6] rounded-md px-6 py-4 shadow-sm">
        <div className="flex items-center space-x-2">
          <Sparkles className="w-5 h-5 text-[#403294]" />
          <span className="text-sm font-bold text-[#172B4D]">Claude-Generated Narrative Summary</span>
        </div>
        <div className="flex items-center space-x-3">
          {/* Copy Button */}
          <button
            onClick={copyToClipboard}
            className="flex items-center space-x-1.5 bg-white hover:bg-[#FAFBFC] text-[#172B4D] font-semibold px-3 py-1.5 rounded-lg text-xs transition border border-[#DFE1E6] cursor-pointer"
          >
            {isCopied ? (
              <>
                <Check className="w-3.5 h-3.5 text-[#006644]" />
                <span className="text-[#006644]">Copied!</span>
              </>
            ) : (
              <>
                <Copy className="w-3.5 h-3.5" />
                <span>Copy to Clipboard</span>
              </>
            )}
          </button>

          {/* Regenerate Button */}
          <button
            onClick={handleRegenerate}
            disabled={isRegenerating}
            className="flex items-center space-x-1.5 bg-[#0052CC] hover:bg-[#0047B3] disabled:bg-[#DFE1E6] disabled:text-[#6B778C] text-white font-semibold px-3 py-1.5 rounded-lg text-xs transition cursor-pointer"
          >
            {isRegenerating ? (
              <>
                <Loader2 className="w-3.5 h-3.5 animate-spin" />
                <span>Regenerating...</span>
              </>
            ) : (
              <>
                <RotateCw className="w-3.5 h-3.5" />
                <span>Regenerate Summary</span>
              </>
            )}
          </button>
        </div>
      </div>

      {/* Recap Content Cards */}
      <div className="grid grid-cols-1 gap-6 relative">
        {isRegenerating && (
          <div className="absolute inset-0 bg-white/80 backdrop-blur-sm z-10 flex items-center justify-center rounded-md border border-[#DFE1E6]">
            <div className="flex flex-col items-center space-y-3">
              <Loader2 className="w-8 h-8 text-[#0052CC] animate-spin" />
              <span className="text-sm text-[#6B778C]">Recalculating tickets and querying Claude...</span>
            </div>
          </div>
        )}

        {sections.map((section, idx) => {
          const styles = getSectionStyles(section.type);
          const Icon = styles.icon;
          
          return (
            <div 
              key={idx}
              className={`border rounded-md p-6 transition-all duration-300 shadow-sm ${styles.bgColor} ${styles.borderColor}`}
            >
              <div className="flex items-center space-x-3 mb-4">
                <div className={`p-2 rounded-lg bg-white border border-[#DFE1E6]`}>
                  <Icon className={`w-5 h-5 ${styles.iconColor}`} />
                </div>
                <h4 className="font-bold text-[#172B4D] tracking-tight text-base">
                  {section.title}
                </h4>
              </div>
              <div className="text-[#172B4D] leading-relaxed text-sm space-y-2 whitespace-pre-line">
                {section.content}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
