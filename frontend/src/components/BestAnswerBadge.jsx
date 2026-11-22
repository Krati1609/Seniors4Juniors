import React from 'react';
import { Award } from 'lucide-react';

export default function BestAnswerBadge({ className = "" }) {
  return (
    <span
      className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-lg bg-[#FBF0A8] text-[#1B2E85] border-2 border-[#1B2E85] text-[10px] sm:text-xs font-sans font-bold uppercase tracking-wider shadow-[2px_2px_0px_#1B2E85] select-none ${className}`}
      title="Selected as the Best Answer by Question Author"
    >
      <Award size={14} className="text-[#1B2E85]" strokeWidth={2.5} />
      <span>Best Answer</span>
    </span>
  );
}
