import { Concern } from '../types';
import { StatusBadge, PriorityBadge } from './StatusBadge';
import {
  CalendarIcon,
  BuildingIcon,
  UserIcon,
  ChevronRightIcon,
  SparklesIcon
} from 'lucide-react';

interface ConcernCardProps {
  concern: Concern;
  onClick?: () => void;
  showStudent?: boolean;
}

export function ConcernCard({
  concern,
  onClick,
  showStudent = false
}: ConcernCardProps) {
  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return new Intl.DateTimeFormat('en-US', {
      month: 'short',
      day: 'numeric',
      hour: 'numeric',
      minute: '2-digit'
    }).format(date);
  };

  return (
    <div
      role={onClick ? 'button' : undefined}
      tabIndex={onClick ? 0 : undefined}
      onClick={onClick}
      onKeyDown={
        onClick
          ? (e) => {
              if (e.key === 'Enter' || e.key === ' ') {
                e.preventDefault();
                onClick();
              }
            }
          : undefined
      }
      className={`concern-card glass-card p-4 sm:p-5 rounded-2xl group transition-all duration-200 ${
        concern.priority === 'urgent'
          ? 'border-2 border-red-500/70 dark:border-rose-500/60 bg-red-50/20 dark:bg-rose-950/15 shadow-md shadow-red-500/10 hover:border-red-500'
          : 'border border-slate-200/80 dark:border-white/10 hover:border-sky-500/30'
      } ${
        onClick
          ? 'cursor-pointer touch-manipulation active:scale-[0.99] hover:shadow-xl hover:shadow-sky-500/5'
          : ''
      }`}
    >
      <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-3 mb-2.5">
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-2 flex-wrap">
            <span className="concern-card-id text-xs font-mono font-medium text-slate-500 dark:text-gray-400 bg-slate-100 dark:bg-white/[0.04] px-2 py-0.5 rounded-md border border-slate-200 dark:border-white/5">
              {concern.id}
            </span>
            <span className="concern-card-category text-xs font-semibold text-sky-700 dark:text-sky-300 bg-sky-50 dark:bg-sky-500/10 px-2.5 py-0.5 rounded-full border border-sky-200 dark:border-sky-500/20">
              {concern.category}
            </span>
            {concern.subcategory && (
              <>
                <span className="text-xs text-slate-400 dark:text-gray-500 hidden sm:inline-block">•</span>
                <span className="text-xs text-slate-500 dark:text-gray-400 truncate">
                  {concern.subcategory}
                </span>
              </>
            )}
            {(concern.adminReviewStatus === 'pending' || concern.isConfirmed === false) && (
              <span className="concern-card-awaiting inline-flex items-center gap-1 text-[11px] font-medium text-amber-700 dark:text-amber-300 bg-amber-50 dark:bg-amber-500/10 px-2 py-0.5 rounded-full border border-amber-200 dark:border-amber-500/20">
                <SparklesIcon className="h-3 w-3 text-amber-500 dark:text-amber-400 animate-pulse" />
                Awaiting Admin Confirmation
              </span>
            )}
          </div>
          <h3 className="concern-card-title text-base sm:text-lg font-bold text-slate-900 dark:text-white line-clamp-2 sm:truncate group-hover:text-sky-600 dark:group-hover:text-sky-300 transition-colors leading-snug">
            {concern.title}
          </h3>
        </div>

        <div className="flex items-center gap-2 shrink-0 self-start">
          <PriorityBadge priority={concern.priority} size="sm" />
          <StatusBadge status={concern.status} size="sm" />
        </div>
      </div>

      <p className="concern-card-desc text-xs sm:text-sm text-slate-600 dark:text-gray-400 line-clamp-2 mb-3.5 leading-relaxed">
        {concern.description}
      </p>

      <div className="concern-card-footer flex flex-wrap items-center justify-between gap-3 pt-3 border-t border-slate-200/80 dark:border-white/5 text-xs text-slate-500 dark:text-gray-400">
        <div className="flex flex-wrap items-center gap-4">
          <div className="flex items-center gap-1.5">
            <CalendarIcon className="h-3.5 w-3.5 text-slate-400 dark:text-gray-500" />
            <span>{formatDate(concern.createdAt)}</span>
          </div>

          <div className="flex items-center gap-1.5">
            <BuildingIcon className="h-3.5 w-3.5 text-slate-400 dark:text-gray-500" />
            <span className="truncate max-w-[140px] sm:max-w-none">{concern.department}</span>
          </div>

          {showStudent && (
            <div className="flex items-center gap-1.5">
              <UserIcon className="h-3.5 w-3.5 text-slate-400 dark:text-gray-500" />
              <span>{concern.studentName}</span>
            </div>
          )}
        </div>

        {onClick && (
          <div className={`concern-card-action flex items-center text-xs font-semibold transition-colors ${
            concern.priority === 'urgent'
              ? 'text-red-600 dark:text-rose-400 group-hover:text-red-700 dark:group-hover:text-rose-300'
              : 'text-sky-600 dark:text-sky-400 group-hover:text-sky-700 dark:group-hover:text-cyan-300'
          }`}>
            <span>View Details</span>
            <ChevronRightIcon className="h-4 w-4 ml-1 group-hover:translate-x-1 transition-transform" />
          </div>
        )}
      </div>
    </div>
  );
}