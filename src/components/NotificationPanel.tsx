import { useState, useMemo } from 'react';
import { Notification } from '../types';
import {
  BellIcon,
  CheckIcon,
  CheckCircle2Icon,
  MessageSquareIcon,
  AlertCircleIcon,
  InfoIcon,
  Trash2Icon,
  CheckCheckIcon,
  SearchIcon,
  XCircleIcon,
  ExternalLinkIcon,
  RotateCcwIcon,
  FilterIcon,
  SparklesIcon
} from 'lucide-react';
import { toast } from 'sonner';
import { ClearNotificationsModal } from './ClearNotificationsModal';

interface NotificationPanelProps {
  notifications: Notification[];
  onMarkRead: (id: string, read?: boolean) => void | Promise<void>;
  onMarkAllRead: () => Promise<void> | void;
  onClearAll: () => Promise<void> | void;
  onDeleteNotification?: (id: string) => Promise<void> | void;
  onSelectConcern?: (concernId: string) => void;
}

export function NotificationPanel({
  notifications,
  onMarkRead,
  onMarkAllRead,
  onClearAll,
  onDeleteNotification,
  onSelectConcern
}: NotificationPanelProps) {
  const [confirmingClear, setConfirmingClear] = useState(false);
  const [isClearing, setIsClearing] = useState(false);
  const [filterMode, setFilterMode] = useState<'all' | 'unread' | 'read'>('all');
  const [typeFilter, setTypeFilter] = useState<'all' | 'status_change' | 'comment' | 'assignment' | 'system'>('all');
  const [searchQuery, setSearchQuery] = useState('');

  const handleConfirmClear = async () => {
    setIsClearing(true);
    try {
      await onClearAll();
      toast.success('All notifications cleared');
      setConfirmingClear(false);
    } catch {
      /* hook already shows error toast */
    } finally {
      setIsClearing(false);
    }
  };

  const handleDeleteSingle = async (e: React.MouseEvent, id: string) => {
    e.stopPropagation();
    if (!onDeleteNotification) return;
    try {
      await onDeleteNotification(id);
      toast.success('Notification removed');
    } catch {
      /* hook handles error */
    }
  };

  const handleToggleRead = async (e: React.MouseEvent, id: string, currentRead: boolean) => {
    e.stopPropagation();
    try {
      await onMarkRead(id, !currentRead);
      toast.success(currentRead ? 'Marked as unread' : 'Marked as read');
    } catch {
      /* hook handles error */
    }
  };

  const handleNotificationClick = (notification: Notification) => {
    if (!notification.read) {
      void onMarkRead(notification.id, true);
    }
    if (notification.concernId && onSelectConcern) {
      onSelectConcern(notification.concernId);
    }
  };

  const getIcon = (type: string) => {
    switch (type) {
      case 'status_change':
        return <CheckCircle2Icon className="h-5 w-5 text-emerald-600 dark:text-emerald-400 shrink-0" />;
      case 'comment':
        return <MessageSquareIcon className="h-5 w-5 text-sky-600 dark:text-sky-400 shrink-0" />;
      case 'assignment':
        return <AlertCircleIcon className="h-5 w-5 text-amber-600 dark:text-amber-400 shrink-0" />;
      default:
        return <InfoIcon className="h-5 w-5 text-indigo-600 dark:text-indigo-400 shrink-0" />;
    }
  };

  const getTypeBadge = (type: string) => {
    switch (type) {
      case 'status_change':
        return (
          <span className="text-[10px] font-bold text-emerald-700 dark:text-emerald-300 bg-emerald-50 dark:bg-emerald-500/15 px-2 py-0.5 rounded-full border border-emerald-200 dark:border-emerald-500/30">
            Status Update
          </span>
        );
      case 'comment':
        return (
          <span className="text-[10px] font-bold text-sky-700 dark:text-sky-300 bg-sky-50 dark:bg-sky-500/15 px-2 py-0.5 rounded-full border border-sky-200 dark:border-sky-500/30">
            Staff Comment
          </span>
        );
      case 'assignment':
        return (
          <span className="text-[10px] font-bold text-amber-700 dark:text-amber-300 bg-amber-50 dark:bg-amber-500/15 px-2 py-0.5 rounded-full border border-amber-200 dark:border-amber-500/30">
            Routing
          </span>
        );
      default:
        return (
          <span className="text-[10px] font-bold text-indigo-700 dark:text-indigo-300 bg-indigo-50 dark:bg-indigo-500/15 px-2 py-0.5 rounded-full border border-indigo-200 dark:border-indigo-500/30">
            Notice
          </span>
        );
    }
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMins / 60);
    const diffDays = Math.floor(diffHours / 24);

    if (diffMins < 1) return 'Just now';
    if (diffMins < 60) return `${diffMins}m ago`;
    if (diffHours < 24) return `${diffHours}h ago`;
    if (diffDays === 1) return 'Yesterday';
    return new Intl.DateTimeFormat('en-US', {
      month: 'short',
      day: 'numeric',
      hour: 'numeric',
      minute: '2-digit'
    }).format(date);
  };

  const unreadCount = useMemo(() => notifications.filter((n) => !n.read).length, [notifications]);
  const readCount = useMemo(() => notifications.filter((n) => n.read).length, [notifications]);

  const displayedNotifications = useMemo(() => {
    return notifications.filter((n) => {
      // Status filter
      if (filterMode === 'unread' && n.read) return false;
      if (filterMode === 'read' && !n.read) return false;

      // Type filter
      if (typeFilter !== 'all' && n.type !== typeFilter) return false;

      // Search query
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase().trim();
        const matchesTitle = (n.title || '').toLowerCase().includes(q);
        const matchesMsg = (n.message || '').toLowerCase().includes(q);
        const matchesId = (n.concernId || '').toLowerCase().includes(q);
        if (!matchesTitle && !matchesMsg && !matchesId) return false;
      }

      return true;
    });
  }, [notifications, filterMode, typeFilter, searchQuery]);

  return (
    <div className="w-full max-w-full min-w-0 overflow-hidden flex flex-col bg-white dark:bg-dark-900 border border-slate-200/90 dark:border-white/10 rounded-2xl sm:rounded-3xl shadow-xl dark:shadow-2xl transition-all">
      {/* Header */}
      <div className="p-4 sm:p-6 lg:p-7 border-b border-slate-200/90 dark:border-white/10 bg-white dark:bg-dark-800/80 shrink-0 space-y-4">
        {/* Top Header Row */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div className="flex items-center gap-3.5 min-w-0">
            <div className="h-11 w-11 rounded-2xl bg-gradient-to-br from-sky-500/15 via-indigo-500/10 to-transparent dark:from-sky-500/20 dark:via-indigo-500/15 border border-sky-200/80 dark:border-sky-500/30 flex items-center justify-center shrink-0 shadow-xs">
              <BellIcon className="h-5 w-5 text-sky-600 dark:text-sky-400" />
            </div>
            <div className="min-w-0 flex-1">
              <div className="flex items-center gap-2.5 flex-wrap">
                <h2 className="text-xl sm:text-2xl font-black text-slate-900 dark:text-white tracking-tight">
                  Notifications
                </h2>
                {unreadCount > 0 ? (
                  <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-bold bg-sky-50 dark:bg-sky-500/20 text-sky-700 dark:text-sky-300 border border-sky-200 dark:border-sky-500/30 shadow-2xs">
                    <span className="h-1.5 w-1.5 rounded-full bg-sky-500 animate-pulse" />
                    <span>{unreadCount} unread</span>
                  </span>
                ) : (
                  <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-medium bg-emerald-50 dark:bg-emerald-500/15 text-emerald-700 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-500/25">
                    <CheckCheckIcon className="h-3.5 w-3.5 text-emerald-500" />
                    <span>All caught up</span>
                  </span>
                )}
              </div>
              <p className="text-xs sm:text-sm text-slate-500 dark:text-gray-400 mt-1">
                Real-time updates regarding your campus concerns, AI triage evaluations, and department staff responses.
              </p>
            </div>
          </div>

          {/* Header Action Buttons */}
          <div className="flex items-center gap-2.5 shrink-0 self-start sm:self-center">
            {unreadCount > 0 && (
              <button
                type="button"
                onClick={() => void onMarkAllRead()}
                className="px-3.5 py-2 rounded-xl text-xs font-semibold bg-slate-100 hover:bg-slate-200 dark:bg-white/5 dark:hover:bg-white/10 text-slate-700 dark:text-gray-200 border border-slate-200/80 dark:border-white/10 flex items-center gap-1.5 transition-all active:scale-95 shadow-xs"
                title="Mark all notifications as read"
              >
                <CheckIcon className="h-3.5 w-3.5 text-sky-600 dark:text-sky-400" />
                <span>Mark all read</span>
              </button>
            )}

            {notifications.length > 0 && (
              <button
                type="button"
                onClick={() => setConfirmingClear(true)}
                className="px-3.5 py-2 rounded-xl text-xs font-semibold bg-rose-50 hover:bg-rose-100 dark:bg-rose-500/10 dark:hover:bg-rose-500/20 text-rose-700 dark:text-rose-300 border border-rose-200/80 dark:border-rose-500/25 flex items-center gap-1.5 transition-all active:scale-95 shadow-xs"
                title="Clear all notifications"
              >
                <Trash2Icon className="h-3.5 w-3.5 text-rose-500" />
                <span>Clear All</span>
              </button>
            )}
          </div>
        </div>

        {/* Search & Filter Controls Row */}
        <div className="flex flex-col md:flex-row items-stretch md:items-center justify-between gap-3 pt-2">
          {/* Search Input */}
          <div className="relative flex-1 max-w-md">
            <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none">
              <SearchIcon className="h-4 w-4 text-slate-400 dark:text-gray-500" />
            </div>
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search title, message, ticket ID..."
              className="block w-full pl-10 pr-9 bg-slate-50 dark:bg-white/[0.03] border border-slate-200/90 dark:border-white/10 rounded-xl py-2 text-xs sm:text-sm text-slate-900 dark:text-white placeholder-slate-400 dark:placeholder-gray-500 focus:outline-none focus:border-sky-500 focus:ring-2 focus:ring-sky-500/20 shadow-2xs transition-all"
            />
            {searchQuery && (
              <button
                type="button"
                onClick={() => setSearchQuery('')}
                className="absolute inset-y-0 right-0 pr-3 flex items-center text-slate-400 hover:text-slate-600 dark:hover:text-white"
                aria-label="Clear search query"
              >
                <XCircleIcon className="h-4 w-4" />
              </button>
            )}
          </div>

          {/* Filter Chips: Status & Type */}
          <div className="flex flex-wrap items-center gap-2">
            {/* Status Pills */}
            <div className="flex items-center gap-1 bg-slate-100/90 dark:bg-white/5 p-1 rounded-xl border border-slate-200/80 dark:border-white/10 text-xs font-semibold">
              <button
                type="button"
                onClick={() => setFilterMode('all')}
                className={`px-2.5 py-1 rounded-lg transition-all ${
                  filterMode === 'all'
                    ? 'bg-white dark:bg-dark-700 text-sky-600 dark:text-sky-400 shadow-xs font-bold'
                    : 'text-slate-600 dark:text-gray-400 hover:text-slate-900 dark:hover:text-white'
                }`}
              >
                All ({notifications.length})
              </button>
              <button
                type="button"
                onClick={() => setFilterMode('unread')}
                className={`px-2.5 py-1 rounded-lg transition-all flex items-center gap-1 ${
                  filterMode === 'unread'
                    ? 'bg-white dark:bg-dark-700 text-sky-600 dark:text-sky-400 shadow-xs font-bold'
                    : 'text-slate-600 dark:text-gray-400 hover:text-slate-900 dark:hover:text-white'
                }`}
              >
                <span>Unread</span>
                {unreadCount > 0 && (
                  <span className="px-1.5 py-0.2 rounded-md text-[10px] font-mono bg-sky-100 dark:bg-sky-500/20 text-sky-700 dark:text-sky-300">
                    {unreadCount}
                  </span>
                )}
              </button>
              <button
                type="button"
                onClick={() => setFilterMode('read')}
                className={`px-2.5 py-1 rounded-lg transition-all ${
                  filterMode === 'read'
                    ? 'bg-white dark:bg-dark-700 text-sky-600 dark:text-sky-400 shadow-xs font-bold'
                    : 'text-slate-600 dark:text-gray-400 hover:text-slate-900 dark:hover:text-white'
                }`}
              >
                Read ({readCount})
              </button>
            </div>

            {/* Type Filter Select */}
            <div className="flex items-center gap-1">
              <select
                value={typeFilter}
                onChange={(e) => setTypeFilter(e.target.value as any)}
                className="bg-white dark:bg-dark-800 border border-slate-200/90 dark:border-white/10 rounded-xl px-2.5 py-1.5 text-xs font-semibold text-slate-700 dark:text-gray-300 focus:outline-none focus:border-sky-500 shadow-2xs cursor-pointer"
              >
                <option value="all">All Categories</option>
                <option value="status_change">Status Updates</option>
                <option value="comment">Staff Comments</option>
                <option value="assignment">Routing / Assignments</option>
                <option value="system">System Notices</option>
              </select>
            </div>
          </div>
        </div>
      </div>

      {/* Notifications List Body */}
      <div className="p-4 sm:p-6 lg:p-7 space-y-3 min-h-[350px] max-h-[750px] overflow-y-auto custom-scrollbar">
        {displayedNotifications.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-16 px-4 text-center">
            <div className="h-16 w-16 rounded-2xl bg-slate-100 dark:bg-white/5 border border-slate-200 dark:border-white/10 flex items-center justify-center mb-3.5 text-slate-400 dark:text-gray-500 shadow-xs">
              {searchQuery || typeFilter !== 'all' || filterMode !== 'all' ? (
                <FilterIcon className="h-7 w-7 text-sky-500 dark:text-sky-400" />
              ) : (
                <SparklesIcon className="h-7 w-7 text-sky-500 dark:text-sky-400" />
              )}
            </div>

            <h3 className="text-base font-bold text-slate-900 dark:text-white mb-1">
              {searchQuery || typeFilter !== 'all' || filterMode !== 'all'
                ? 'No notifications match your filters'
                : 'No notifications yet'}
            </h3>

            <p className="text-xs sm:text-sm text-slate-500 dark:text-gray-400 max-w-sm leading-relaxed">
              {searchQuery || typeFilter !== 'all' || filterMode !== 'all'
                ? 'Try clearing your search query or selecting a different status/category filter.'
                : 'You are completely caught up! New updates, status changes, and staff replies will appear here in real time.'}
            </p>

            {(searchQuery || typeFilter !== 'all' || filterMode !== 'all') && (
              <button
                type="button"
                onClick={() => {
                  setSearchQuery('');
                  setFilterMode('all');
                  setTypeFilter('all');
                }}
                className="mt-4 px-3.5 py-2 rounded-xl text-xs font-semibold bg-sky-600 text-white hover:bg-sky-500 transition-colors shadow-xs flex items-center gap-1.5"
              >
                <RotateCcwIcon className="h-3.5 w-3.5" />
                <span>Reset all filters</span>
              </button>
            )}
          </div>
        ) : (
          displayedNotifications.map((notification) => {
            const hasConcern = Boolean(notification.concernId);
            return (
              <div
                key={notification.id}
                onClick={() => handleNotificationClick(notification)}
                role="button"
                tabIndex={0}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' || e.key === ' ') {
                    e.preventDefault();
                    handleNotificationClick(notification);
                  }
                }}
                className={`group relative w-full text-left p-4 sm:p-5 rounded-2xl transition-all duration-200 cursor-pointer border flex flex-col sm:flex-row items-start gap-4 select-none focus:outline-none focus:ring-2 focus:ring-sky-500/30 ${
                  notification.read
                    ? 'bg-white hover:bg-slate-50/90 dark:bg-white/[0.01] dark:hover:bg-white/[0.03] border-slate-200/80 dark:border-white/5 shadow-2xs'
                    : 'bg-sky-50/70 hover:bg-sky-100/70 dark:bg-sky-950/20 dark:hover:bg-sky-950/30 border-sky-300/80 dark:border-sky-500/25 shadow-xs'
                }`}
              >
                {/* Notification Type Icon */}
                <div className="h-11 w-11 rounded-2xl bg-white dark:bg-dark-800 border border-slate-200 dark:border-white/10 flex items-center justify-center shrink-0 shadow-xs transition-transform duration-200 group-hover:scale-105">
                  {getIcon(notification.type)}
                </div>

                {/* Main Notification Content */}
                <div className="flex-1 min-w-0 space-y-1.5">
                  <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-1.5">
                    <div className="flex items-center gap-2 flex-wrap">
                      <h4
                        className={`text-sm sm:text-base leading-tight tracking-tight ${
                          notification.read
                            ? 'font-semibold text-slate-800 dark:text-gray-200'
                            : 'font-extrabold text-slate-900 dark:text-white'
                        }`}
                      >
                        {notification.title}
                      </h4>
                      {getTypeBadge(notification.type)}
                    </div>
                    <span className="text-[11px] text-slate-400 dark:text-gray-500 font-medium tabular-nums shrink-0">
                      {formatDate(notification.createdAt)}
                    </span>
                  </div>

                  <p
                    className={`text-xs sm:text-sm leading-relaxed ${
                      notification.read
                        ? 'text-slate-500 dark:text-gray-400'
                        : 'text-slate-700 dark:text-gray-300 font-normal'
                    }`}
                  >
                    {notification.message}
                  </p>

                  {/* If connected to a ticket, show interactive view concern button */}
                  {hasConcern && (
                    <div className="pt-2 flex items-center gap-2">
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          if (!notification.read) {
                            void onMarkRead(notification.id, true);
                          }
                          if (notification.concernId && onSelectConcern) {
                            onSelectConcern(notification.concernId);
                          }
                        }}
                        className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold bg-sky-50 dark:bg-sky-500/15 text-sky-700 dark:text-sky-300 hover:bg-sky-100 dark:hover:bg-sky-500/25 border border-sky-200 dark:border-sky-500/30 shadow-2xs transition-all active:scale-95"
                      >
                        <span>View Ticket Details</span>
                        <ExternalLinkIcon className="h-3 w-3" />
                      </button>
                    </div>
                  )}
                </div>

                {/* Right Side Quick Actions & Unread Indicator */}
                <div className="flex items-center gap-1.5 shrink-0 self-end sm:self-center">
                  {/* Toggle Read/Unread */}
                  <button
                    type="button"
                    onClick={(e) => handleToggleRead(e, notification.id, notification.read)}
                    className="p-2 rounded-xl text-slate-400 hover:text-sky-600 dark:hover:text-sky-400 hover:bg-slate-100 dark:hover:bg-white/10 border border-transparent hover:border-slate-200 dark:hover:border-white/10 transition-all"
                    title={notification.read ? 'Mark as unread' : 'Mark as read'}
                    aria-label={notification.read ? 'Mark as unread' : 'Mark as read'}
                  >
                    <CheckIcon className="h-4 w-4" />
                  </button>

                  {/* Delete Notification Button */}
                  {onDeleteNotification && (
                    <button
                      type="button"
                      onClick={(e) => handleDeleteSingle(e, notification.id)}
                      className="p-2 rounded-xl text-slate-400 hover:text-rose-600 dark:hover:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-500/10 border border-transparent hover:border-rose-200 dark:hover:border-rose-500/20 transition-all"
                      title="Delete notification"
                      aria-label="Delete notification"
                    >
                      <Trash2Icon className="h-4 w-4" />
                    </button>
                  )}

                  {/* Glowing Unread Dot */}
                  {!notification.read && (
                    <span
                      className="h-2.5 w-2.5 rounded-full bg-sky-500 dark:bg-cyan-400 shrink-0 shadow-[0_0_10px_rgba(14,165,233,0.7)] dark:shadow-[0_0_10px_rgba(6,182,212,0.9)] ml-1"
                      aria-hidden
                    />
                  )}
                </div>
              </div>
            );
          })
        )}
      </div>

      {/* Clear Confirmation Modal */}
      <ClearNotificationsModal
        isOpen={confirmingClear}
        isLoading={isClearing}
        count={notifications.length}
        onClose={() => {
          if (!isClearing) setConfirmingClear(false);
        }}
        onConfirm={handleConfirmClear}
      />
    </div>
  );
}
