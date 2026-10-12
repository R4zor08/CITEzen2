import { ConcernStatus, Priority } from '../types';
import {
  CheckCircle2Icon,
  ClockIcon,
  AlertCircleIcon,
  XCircleIcon,
  AlertTriangleIcon } from
'lucide-react';
interface StatusBadgeProps {
  status: ConcernStatus;
  size?: 'sm' | 'md';
}
export function StatusBadge({ status, size = 'md' }: StatusBadgeProps) {
  const config = {
    pending: {
      color: 'text-amber-700 dark:text-amber-400',
      bg: 'bg-amber-50 dark:bg-amber-500/15 border-amber-200 dark:border-amber-500/25',
      icon: ClockIcon,
      label: 'Pending'
    },
    'in-progress': {
      color: 'text-sky-700 dark:text-sky-400',
      bg: 'bg-sky-50 dark:bg-sky-500/15 border-sky-200 dark:border-sky-500/25',
      icon: AlertCircleIcon,
      label: 'In Progress'
    },
    resolved: {
      color: 'text-emerald-700 dark:text-emerald-400',
      bg: 'bg-emerald-50 dark:bg-emerald-500/15 border-emerald-200 dark:border-emerald-500/25',
      icon: CheckCircle2Icon,
      label: 'Resolved'
    },
    rejected: {
      color: 'text-rose-700 dark:text-rose-400',
      bg: 'bg-rose-50 dark:bg-rose-500/15 border-rose-200 dark:border-rose-500/25',
      icon: XCircleIcon,
      label: 'Rejected'
    }
  };
  const { color, bg, icon: Icon, label } = config[status];
  const sizeClasses =
  size === 'sm' ?
  'px-2 py-0.5 text-[10px] gap-1' :
  'px-2.5 py-1 text-xs gap-1.5';
  const iconSize = size === 'sm' ? 'h-3 w-3' : 'h-3.5 w-3.5';
  return (
    <span
      className={`status-badge status-badge--${status} inline-flex items-center rounded-full border font-medium ${bg} ${color} ${sizeClasses}`}>
      
      <Icon className={iconSize} />
      {label}
    </span>);

}
interface PriorityBadgeProps {
  priority: Priority;
  size?: 'sm' | 'md';
}
export function PriorityBadge({ priority, size = 'md' }: PriorityBadgeProps) {
  const config = {
    low: {
      color: 'text-slate-600 dark:text-gray-400',
      bg: 'bg-slate-100 dark:bg-gray-400/10 border-slate-200 dark:border-gray-400/20',
      showIcon: false
    },
    medium: {
      color: 'text-sky-700 dark:text-sky-400',
      bg: 'bg-sky-50 dark:bg-sky-500/15 border-sky-200 dark:border-sky-500/25',
      showIcon: false
    },
    high: {
      color: 'text-amber-700 dark:text-amber-400',
      bg: 'bg-amber-50 dark:bg-amber-500/15 border-amber-200 dark:border-amber-500/25',
      showIcon: false
    },
    urgent: {
      color: 'text-rose-700 dark:text-rose-400',
      bg: 'bg-rose-50 dark:bg-rose-500/15 border-rose-200 dark:border-rose-500/25',
      showIcon: true
    }
  };
  const { color, bg, showIcon } = config[priority];
  const sizeClasses =
  size === 'sm' ?
  'px-2 py-0.5 text-[10px] gap-1' :
  'px-2.5 py-1 text-xs gap-1.5';
  return (
    <span
      className={`priority-badge priority-badge--${priority} inline-flex items-center rounded-full border font-medium capitalize ${bg} ${color} ${sizeClasses}`}>
      
      {showIcon &&
      <AlertTriangleIcon
        className={size === 'sm' ? 'h-3 w-3' : 'h-3.5 w-3.5'} />

      }
      {priority}
    </span>);

}