import React from 'react';

export default function LoadingSpinner({ size = "md", label = "Loading..." }) {
  const sizeMap = {
    sm: "w-5 h-5 border-2",
    md: "w-8 h-8 border-[3px]",
    lg: "w-12 h-12 border-4",
  };

  return (
    <div className="flex flex-col items-center justify-center p-8 gap-3 select-none">
      <div
        className={`${sizeMap[size] || sizeMap.md} rounded-full border-butter-dark dark:border-cobalt-light border-t-crimson animate-spin`}
      />
      {label && (
        <p className="text-xs font-sans font-bold uppercase tracking-wider text-cobalt/80 dark:text-butter/80">
          {label}
        </p>
      )}
    </div>
  );
}
