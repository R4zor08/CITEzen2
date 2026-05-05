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
      color: 'text-yellow-400',
      bg: 'bg-yellow-400/10 border-yellow-400/20',
      icon: ClockIcon,
      label: 'Pending'
    },
    'in-progress': {
      color: 'text-blue-400',
      bg: 'bg-blue-400/10 border-blue-400/20',
      icon: AlertCircleIcon,
      label: 'In Progress'
    },
    resolved: {
      color: 'text-green-400',
      bg: 'bg-green-400/10 border-green-400/20',
      icon: CheckCircle2Icon,
      label: 'Resolved'
    },
    rejected: {
      color: 'text-red-400',
      bg: 'bg-red-400/10 border-red-400/20',
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
      className={`inline-flex items-center rounded-full border font-medium ${bg} ${color} ${sizeClasses}`}>
      
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
      color: 'text-gray-400',
      bg: 'bg-gray-400/10 border-gray-400/20',
      showIcon: false
    },
    medium: {
      color: 'text-blue-400',
      bg: 'bg-blue-400/10 border-blue-400/20',
      showIcon: false
    },
    high: {
      color: 'text-orange-400',
      bg: 'bg-orange-400/10 border-orange-400/20',
      showIcon: false
    },
    urgent: {
      color: 'text-red-400',
      bg: 'bg-red-400/10 border-red-400/20',
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
      className={`inline-flex items-center rounded-full border font-medium capitalize ${bg} ${color} ${sizeClasses}`}>
      
      {showIcon &&
      <AlertTriangleIcon
        className={size === 'sm' ? 'h-3 w-3' : 'h-3.5 w-3.5'} />

      }
      {priority}
    </span>);

}