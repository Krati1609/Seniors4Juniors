import React from 'react';
import { ShieldCheck } from 'lucide-react';

export default function VerifiedBadge({ className = "", size = "md" }) {
  const isSm = size === "sm";
  const sizeClasses = isSm
    ? "text-[10px] px-2 py-0.5 gap-1 border-[1.5px]"
    : "text-xs px-2.5 py-1 gap-1.5 border-2";
  const iconSize = isSm ? 12 : 14;

  return (
    <span
      className={`inline-flex items-center rounded-lg bg-[#FBF0A8] text-[#1B2E85] border-[#1B2E85] font-sans font-bold uppercase tracking-wider shadow-[2px_2px_0px_#1B2E85] shrink-0 select-none ${sizeClasses} ${className}`}
      title="Verified Senior by College Administration"
    >
      <ShieldCheck size={iconSize} className="text-[#1B2E85]" strokeWidth={2.5} />
      <span>Verified</span>
    </span>
  );
}
