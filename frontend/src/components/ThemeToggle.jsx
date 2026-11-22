import React from 'react';
import { Sun, Moon } from 'lucide-react';
import { useTheme } from '../context/ThemeContext';

export default function ThemeToggle({ className = "" }) {
  const { theme, toggleTheme } = useTheme();
  const isDark = theme === 'dark';

  return (
    <button
      onClick={toggleTheme}
      type="button"
      className={`p-2.5 rounded-xl border-2 border-cobalt dark:border-butter bg-butter dark:bg-cobalt-dark shadow-[2px_2px_0px_#121F5C] dark:shadow-[2px_2px_0px_#FBF0A8] btn-press flex items-center justify-center shrink-0 ${className}`}
      title={isDark ? 'Switch to Light Mode (Butter Cream)' : 'Switch to Dark Mode (Cobalt Blue)'}
      aria-label={isDark ? 'Switch to Light Mode' : 'Switch to Dark Mode'}
    >
      {isDark ? (
        <Sun size={18} strokeWidth={2.5} className="text-[#FBF0A8]" />
      ) : (
        <Moon size={18} strokeWidth={2.5} className="text-[#1B2E85]" />
      )}
    </button>
  );
}
