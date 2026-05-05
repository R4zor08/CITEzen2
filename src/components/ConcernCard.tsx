import { Concern } from '../types';
import { StatusBadge, PriorityBadge } from './StatusBadge';
import {
  CalendarIcon,
  BuildingIcon,
  UserIcon,
  ChevronRightIcon } from
'lucide-react';
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
      className={`glass-card p-4 sm:p-5 rounded-2xl group ${onClick ? 'cursor-pointer touch-manipulation active:scale-[0.99] transition-transform hover:border-purple-500/25' : ''}`}>
      
      <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4 mb-3">
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-1.5 flex-wrap">
            <span className="text-xs font-mono text-gray-500">
              {concern.id}
            </span>
            <span className="text-xs font-medium text-purple-400 bg-purple-400/10 px-2 py-0.5 rounded-full border border-purple-400/20">
              {concern.category}
            </span>
            <span className="text-xs text-gray-400 hidden sm:inline-block">
              •
            </span>
            <span className="text-xs text-gray-400 truncate">
              {concern.subcategory}
            </span>
          </div>
          <h3 className="text-base sm:text-lg font-semibold text-white line-clamp-2 sm:truncate group-hover:text-purple-300 transition-colors leading-snug">
            {concern.title}
          </h3>
        </div>

        <div className="flex items-center gap-2 shrink-0">
          <PriorityBadge priority={concern.priority} size="sm" />
          <StatusBadge status={concern.status} size="sm" />
        </div>
      </div>

      <p className="text-sm text-gray-400 line-clamp-2 mb-4">
        {concern.description}
      </p>

      <div className="flex flex-wrap items-center justify-between gap-3 pt-3 border-t border-white/5">
        <div className="flex flex-wrap items-center gap-4 text-xs text-gray-500">
          <div className="flex items-center gap-1.5">
            <CalendarIcon className="h-3.5 w-3.5" />
            <span>{formatDate(concern.createdAt)}</span>
          </div>

          <div className="flex items-center gap-1.5">
            <BuildingIcon className="h-3.5 w-3.5" />
            <span>{concern.department}</span>
          </div>

          {showStudent &&
          <div className="flex items-center gap-1.5">
              <UserIcon className="h-3.5 w-3.5" />
              <span>{concern.studentName}</span>
            </div>
          }
        </div>

        {onClick &&
        <div className="flex items-center text-xs font-medium text-purple-400 sm:opacity-0 sm:-translate-x-2 sm:group-hover:opacity-100 sm:group-hover:translate-x-0 transition-all duration-300">
            <span className="sm:hidden">Open</span>
            <span className="hidden sm:inline">View Details</span>
            <ChevronRightIcon className="h-3.5 w-3.5 ml-0.5 shrink-0" />
          </div>
        }
      </div>
    </div>);

}