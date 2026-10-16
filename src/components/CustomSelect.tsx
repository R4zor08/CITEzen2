import React, { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ChevronDownIcon, CheckIcon } from 'lucide-react';

export interface CustomSelectOption {
  value: string;
  label: string;
  icon?: React.ReactNode;
  badge?: string | number;
  badgeColor?: 'amber' | 'emerald' | 'sky' | 'rose' | 'slate' | 'purple';
  isDivider?: boolean;
  disabled?: boolean;
}

interface CustomSelectProps {
  value: string;
  onChange: (value: string) => void;
  options: CustomSelectOption[];
  placeholder?: string;
  icon?: React.ReactNode;
  className?: string;
  menuClassName?: string;
  align?: 'left' | 'right';
  disabled?: boolean;
  size?: 'sm' | 'md';
}

export function CustomSelect({
  value,
  onChange,
  options,
  placeholder = 'Select an option...',
  icon,
  className = '',
  menuClassName = '',
  align = 'left',
  disabled = false,
  size = 'md'
}: CustomSelectProps) {
  const [isOpen, setIsOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  const selectedOption = options.find((opt) => opt.value === value && !opt.isDivider);

  // Close when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        containerRef.current &&
        !containerRef.current.contains(event.target as Node)
      ) {
        setIsOpen(false);
      }
    };

    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isOpen]);

  // Close on Escape key
  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape' && isOpen) {
        setIsOpen(false);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen]);

  const badgeColorClasses: Record<string, string> = {
    amber:
      'bg-amber-50 dark:bg-amber-500/15 text-amber-700 dark:text-amber-400 border-amber-200 dark:border-amber-500/25',
    emerald:
      'bg-emerald-50 dark:bg-emerald-500/15 text-emerald-700 dark:text-emerald-400 border-emerald-200 dark:border-emerald-500/25',
    sky:
      'bg-sky-50 dark:bg-sky-500/15 text-sky-700 dark:text-sky-400 border-sky-200 dark:border-sky-500/25',
    rose:
      'bg-rose-50 dark:bg-rose-500/15 text-rose-700 dark:text-rose-400 border-rose-200 dark:border-rose-500/25',
    purple:
      'bg-purple-50 dark:bg-purple-500/15 text-purple-700 dark:text-purple-400 border-purple-200 dark:border-purple-500/25',
    slate:
      'bg-slate-100 dark:bg-white/10 text-slate-600 dark:text-gray-300 border-slate-200 dark:border-white/10'
  };

  const isSmall = size === 'sm';

  return (
    <div ref={containerRef} className={`relative inline-block ${className}`}>
      {/* Trigger Button */}
      <button
        type="button"
        disabled={disabled}
        onClick={() => setIsOpen((prev) => !prev)}
        aria-haspopup="listbox"
        aria-expanded={isOpen}
        className={`w-full flex items-center justify-between gap-2.5 bg-white dark:bg-dark-800 border rounded-xl text-slate-900 dark:text-white shadow-sm transition-all text-left ${
          isSmall ? 'py-1.5 px-3 text-xs' : 'py-2 px-3 text-sm'
        } ${
          isOpen
            ? 'border-sky-500 ring-2 ring-sky-500/20'
            : 'border-slate-200 dark:border-white/10 hover:border-sky-400 dark:hover:border-sky-500/50'
        } ${disabled ? 'opacity-60 cursor-not-allowed' : 'cursor-pointer active:scale-[0.99]'}`}
      >
        <div className="flex items-center gap-2 min-w-0 flex-1">
          {selectedOption ? (
            <div className="flex items-center gap-2 min-w-0 flex-1">
              {selectedOption.icon ? (
                <span className="shrink-0">{selectedOption.icon}</span>
              ) : icon ? (
                <span className="text-slate-400 dark:text-gray-500 shrink-0">{icon}</span>
              ) : null}
              <span className="truncate font-medium">
                {selectedOption.label}
              </span>
              {selectedOption.badge && (
                <span
                  className={`text-[10px] font-bold px-1.5 py-0.5 rounded-full border shrink-0 ${
                    badgeColorClasses[selectedOption.badgeColor || 'slate']
                  }`}
                >
                  {selectedOption.badge}
                </span>
              )}
            </div>
          ) : (
            <>
              {icon && <span className="text-slate-400 dark:text-gray-500 shrink-0">{icon}</span>}
              <span className="text-slate-400 dark:text-gray-500 truncate">
                {placeholder}
              </span>
            </>
          )}
        </div>

        <ChevronDownIcon
          className={`h-4 w-4 text-slate-400 dark:text-gray-500 shrink-0 transition-transform duration-200 ${
            isOpen ? 'rotate-180 text-sky-500' : ''
          }`}
        />
      </button>

      {/* Floating Menu Popup */}
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, y: -4, scale: 0.98 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -4, scale: 0.98 }}
            transition={{ duration: 0.15, ease: 'easeOut' }}
            className={`absolute z-[100] mt-1.5 min-w-[200px] w-max max-w-[340px] bg-white/95 dark:bg-dark-800/95 backdrop-blur-xl border border-slate-200/90 dark:border-white/10 rounded-2xl shadow-2xl shadow-slate-900/10 dark:shadow-black/60 p-1.5 overflow-hidden ${
              align === 'right' ? 'right-0' : 'left-0'
            } ${menuClassName}`}
          >
            <div className="max-h-60 overflow-y-auto custom-scrollbar space-y-0.5">
              {options.map((opt, idx) => {
                if (opt.isDivider) {
                  return (
                    <div
                      key={`divider-${idx}`}
                      className="my-1.5 border-t border-slate-200/70 dark:border-white/10"
                    />
                  );
                }

                const isSelected = opt.value === value;
                const badgeClass =
                  badgeColorClasses[opt.badgeColor || 'slate'];

                return (
                  <button
                    key={opt.value}
                    type="button"
                    disabled={opt.disabled}
                    onClick={() => {
                      if (!opt.disabled) {
                        onChange(opt.value);
                        setIsOpen(false);
                      }
                    }}
                    className={`w-full flex items-center justify-between gap-2.5 px-3 py-2 rounded-xl text-left transition-all text-xs sm:text-sm font-medium ${
                      opt.disabled
                        ? 'opacity-40 cursor-not-allowed'
                        : isSelected
                        ? 'bg-sky-50 dark:bg-sky-500/15 text-sky-700 dark:text-sky-300 font-bold border border-sky-200/60 dark:border-sky-500/30 shadow-sm'
                        : 'text-slate-700 dark:text-gray-200 hover:bg-slate-100/80 dark:hover:bg-white/10 hover:text-sky-600 dark:hover:text-sky-300'
                    }`}
                  >
                    <div className="flex items-center gap-2 min-w-0 flex-1">
                      {opt.icon && <span className="shrink-0">{opt.icon}</span>}
                      <span className="truncate">{opt.label}</span>
                    </div>

                    <div className="flex items-center gap-1.5 shrink-0">
                      {opt.badge && (
                        <span
                          className={`text-[10px] font-bold px-1.5 py-0.5 rounded-full border ${badgeClass}`}
                        >
                          {opt.badge}
                        </span>
                      )}
                      {isSelected && (
                        <CheckIcon className="h-4 w-4 text-sky-600 dark:text-sky-400 shrink-0" />
                      )}
                    </div>
                  </button>
                );
              })}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
