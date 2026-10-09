import { useState } from 'react';
import { Notification } from '../types';
import {
  BellIcon,
  CheckIcon,
  CheckCircle2Icon,
  MessageSquareIcon,
  AlertCircleIcon,
  InfoIcon,
  Trash2Icon,
  CheckCheckIcon
} from 'lucide-react';
import { toast } from 'sonner';
import { ClearNotificationsModal } from './ClearNotificationsModal';

interface NotificationPanelProps {
  notifications: Notification[];
  onMarkRead: (id: string) => void;
  onMarkAllRead: () => void;
  onClearAll: () => Promise<void> | void;
}

export function NotificationPanel({
  notifications,
  onMarkRead,
  onMarkAllRead,
  onClearAll
}: NotificationPanelProps) {
  const [confirmingClear, setConfirmingClear] = useState(false);
  const [isClearing, setIsClearing] = useState(false);
  const [filterMode, setFilterMode] = useState<'all' | 'unread'>('all');

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

  const getIcon = (type: string) => {
    switch (type) {
      case 'status_change':
        return <CheckCircle2Icon className="h-5 w-5 text-emerald-400 shrink-0" />;
      case 'comment':
        return <MessageSquareIcon className="h-5 w-5 text-sky-400 shrink-0" />;
      case 'assignment':
        return <AlertCircleIcon className="h-5 w-5 text-amber-400 shrink-0" />;
      default:
        return <InfoIcon className="h-5 w-5 text-cyan-400 shrink-0" />;
    }
  };

  const getTypeBadge = (type: string) => {
    switch (type) {
      case 'status_change':
        return (
          <span className="text-[10px] font-semibold text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded-full border border-emerald-500/20">
            Status Update
          </span>
        );
      case 'comment':
        return (
          <span className="text-[10px] font-semibold text-sky-400 bg-sky-500/10 px-2 py-0.5 rounded-full border border-sky-500/20">
            Staff Comment
          </span>
        );
      case 'assignment':
        return (
          <span className="text-[10px] font-semibold text-amber-400 bg-amber-500/10 px-2 py-0.5 rounded-full border border-amber-500/20">
            Routing
          </span>
        );
      default:
        return (
          <span className="text-[10px] font-semibold text-cyan-400 bg-cyan-500/10 px-2 py-0.5 rounded-full border border-cyan-500/20">
            Notification
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
      day: 'numeric'
    }).format(date);
  };

  const unreadCount = notifications.filter((n) => !n.read).length;

  const displayedNotifications =
    filterMode === 'unread'
      ? notifications.filter((n) => !n.read)
      : notifications;

  return (
    <div className="notification-panel-shell notification-panel w-full max-w-full min-w-0 overflow-hidden animate-fade-in flex flex-col glass-panel border border-white/10 rounded-2xl sm:rounded-3xl shadow-2xl min-h-[min(58dvh,480px)] sm:min-h-[min(60vh,560px)] max-h-[min(calc(100dvh-6.5rem),760px)] sm:max-h-[min(calc(100vh-9rem),820px)]">
      {/* Header */}
      <div className="notification-panel-header flex flex-col gap-3.5 p-4 sm:p-5 lg:p-6 border-b border-white/10 bg-dark-800/80 shrink-0">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
          <div className="flex items-center gap-3 min-w-0">
            <div className="h-10 w-10 rounded-xl bg-sky-500/15 border border-sky-500/25 flex items-center justify-center shrink-0">
              <BellIcon className="h-5 w-5 text-sky-400" />
            </div>
            <div className="min-w-0 flex-1">
              <div className="flex items-center gap-2 flex-wrap">
                <h2 className="text-lg sm:text-xl font-bold text-white tracking-tight">
                  Notifications
                </h2>
                {unreadCount > 0 && (
                  <span className="inline-flex h-5 min-w-[1.25rem] items-center justify-center rounded-full bg-sky-500/20 px-2 text-[11px] font-bold text-sky-300 border border-sky-500/30">
                    {unreadCount} unread
                  </span>
                )}
              </div>
              <p className="text-xs text-gray-400 mt-0.5">
                Real-time updates regarding your concerns and department replies
              </p>
            </div>
          </div>

          {/* Action buttons */}
          <div className="flex items-center gap-2 self-start sm:self-auto flex-wrap">
            {unreadCount > 0 && (
              <button
                type="button"
                onClick={() => void onMarkAllRead()}
                className="w-full sm:w-auto min-h-[40px] text-xs font-semibold px-3.5 py-2 rounded-xl bg-white/5 hover:bg-white/10 border border-white/10 text-gray-300 hover:text-white flex items-center justify-center gap-1.5 transition-all active:scale-95 touch-manipulation"
              >
                <CheckIcon className="h-3.5 w-3.5" />
                <span>Mark all read</span>
              </button>
            )}

            {notifications.length > 0 && (
              <button
                type="button"
                onClick={() => setConfirmingClear(true)}
                className="btn-clear-all w-full sm:w-auto min-h-[40px] text-xs font-semibold px-3.5 py-2 rounded-xl flex items-center justify-center gap-1.5 transition-all active:scale-95 touch-manipulation shrink-0 text-white shadow-md shadow-red-600/25"
              >
                <Trash2Icon className="h-3.5 w-3.5 shrink-0 text-white" />
                <span className="text-white">Clear All</span>
              </button>
            )}
          </div>
        </div>

        {/* Filter Pills */}
        <div className="flex items-center gap-2 pt-1 border-t border-white/5">
          <button
            type="button"
            onClick={() => setFilterMode('all')}
            className={`px-3 py-1 rounded-lg text-xs font-semibold transition-all ${
              filterMode === 'all'
                ? 'bg-sky-500 text-white shadow-sm'
                : 'text-gray-400 hover:text-white hover:bg-white/5'
            }`}
          >
            All ({notifications.length})
          </button>
          <button
            type="button"
            onClick={() => setFilterMode('unread')}
            className={`px-3 py-1 rounded-lg text-xs font-semibold transition-all flex items-center gap-1.5 ${
              filterMode === 'unread'
                ? 'bg-sky-500 text-white shadow-sm'
                : 'text-gray-400 hover:text-white hover:bg-white/5'
            }`}
          >
            <span>Unread</span>
            <span
              className={`text-[10px] px-1.5 py-0.2 rounded-md ${
                filterMode === 'unread' ? 'bg-white/20' : 'bg-white/10 text-gray-300'
              }`}
            >
              {unreadCount}
            </span>
          </button>
        </div>
      </div>

      {/* Body List */}
      <div className="notification-panel-body flex-1 min-h-0 overflow-y-auto overscroll-contain p-3 sm:p-5 lg:p-6 space-y-2.5 custom-scrollbar">
        {displayedNotifications.length === 0 ? (
          <div className="flex flex-col items-center justify-center min-h-[min(45dvh,260px)] sm:min-h-[300px] text-center p-6">
            <div className="h-16 w-16 rounded-2xl bg-white/5 border border-white/10 flex items-center justify-center mb-3.5 text-gray-400">
              <CheckCheckIcon className="h-8 w-8 text-sky-400/70" />
            </div>
            <h3 className="text-base font-bold text-white mb-1">
              {filterMode === 'unread' ? 'No unread notifications' : "You're all caught up!"}
            </h3>
            <p className="text-xs sm:text-sm text-gray-400 max-w-sm leading-relaxed">
              {filterMode === 'unread'
                ? 'All of your notifications have been marked as read.'
                : 'No new notifications to display right now. Check back later.'}
            </p>
            {filterMode === 'unread' && notifications.length > 0 && (
              <button
                type="button"
                onClick={() => setFilterMode('all')}
                className="mt-3 text-xs font-semibold text-sky-400 hover:text-sky-300"
              >
                View all notifications ({notifications.length})
              </button>
            )}
          </div>
        ) : (
          displayedNotifications.map((notification) => (
            <button
              key={notification.id}
              type="button"
              onClick={() => {
                if (!notification.read) void onMarkRead(notification.id);
              }}
              className={`notification-row w-full text-left flex gap-3.5 p-3.5 sm:p-4 rounded-xl sm:rounded-2xl transition-all touch-manipulation border ${
                notification.read
                  ? 'notification-row--read bg-white/[0.01] hover:bg-white/[0.03] border-white/5'
                  : 'notification-row--unread bg-sky-950/20 hover:bg-sky-950/30 border-sky-500/25 shadow-sm'
              }`}
            >
              <div className="mt-0.5 flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-white/5 border border-white/10">
                {getIcon(notification.type)}
              </div>

              <div className="flex-1 min-w-0 py-0.5">
                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-1 mb-1">
                  <div className="flex items-center gap-2 flex-wrap">
                    <h4
                      className={`text-sm leading-snug ${
                        notification.read ? 'font-medium text-gray-300' : 'font-bold text-white'
                      }`}
                    >
                      {notification.title}
                    </h4>
                    {getTypeBadge(notification.type)}
                  </div>
                  <span className="text-[11px] text-gray-500 font-medium tabular-nums shrink-0">
                    {formatDate(notification.createdAt)}
                  </span>
                </div>
                <p
                  className={`text-xs sm:text-sm leading-relaxed ${
                    notification.read ? 'text-gray-500' : 'text-gray-300'
                  }`}
                >
                  {notification.message}
                </p>
              </div>

              {!notification.read && (
                <div
                  className="h-2 w-2 rounded-full bg-cyan-400 mt-2 shrink-0 shadow-[0_0_8px_rgba(6,182,212,0.9)] self-start sm:mt-2.5"
                  aria-hidden
                />
              )}
            </button>
          ))
        )}
      </div>

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
