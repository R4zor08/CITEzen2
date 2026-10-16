import { useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  BellIcon,
  CheckIcon,
  CheckCircle2Icon,
  MessageSquareIcon,
  AlertCircleIcon,
  InfoIcon,
  ArrowRightIcon,
  XIcon,
  SparklesIcon,
  Trash2Icon,
  ExternalLinkIcon
} from 'lucide-react';
import { Notification } from '../types';

export interface RecentNotificationsModalProps {
  isOpen: boolean;
  onClose: () => void;
  notifications: Notification[];
  onMarkRead: (id: string, read?: boolean) => void | Promise<void>;
  onMarkAllRead?: () => void | Promise<void>;
  onDeleteNotification?: (id: string) => void | Promise<void>;
  onSelectConcern?: (concernId: string) => void;
  onViewAll: () => void;
  maxRecent?: number;
}

export function RecentNotificationsModal({
  isOpen,
  onClose,
  notifications,
  onMarkRead,
  onMarkAllRead,
  onDeleteNotification,
  onSelectConcern,
  onViewAll,
  maxRecent = 5
}: RecentNotificationsModalProps) {
  useEffect(() => {
    if (!isOpen) return;
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  const unreadCount = notifications.filter((n) => !n.read).length;
  const recentNotifications = notifications.slice(0, maxRecent);

  const getIconInfo = (type: string) => {
    switch (type) {
      case 'status_change':
        return {
          icon: <CheckCircle2Icon className="h-4 w-4" />,
          containerCls:
            'bg-emerald-50 dark:bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 border-emerald-200/80 dark:border-emerald-500/25',
          badgeText: 'Status',
          badgeCls:
            'bg-emerald-50 dark:bg-emerald-500/10 text-emerald-700 dark:text-emerald-300 border-emerald-200 dark:border-emerald-500/20'
        };
      case 'comment':
        return {
          icon: <MessageSquareIcon className="h-4 w-4" />,
          containerCls:
            'bg-sky-50 dark:bg-sky-500/15 text-sky-600 dark:text-sky-400 border-sky-200/80 dark:border-sky-500/25',
          badgeText: 'Comment',
          badgeCls:
            'bg-sky-50 dark:bg-sky-500/10 text-sky-700 dark:text-sky-300 border-sky-200 dark:border-sky-500/20'
        };
      case 'assignment':
        return {
          icon: <AlertCircleIcon className="h-4 w-4" />,
          containerCls:
            'bg-amber-50 dark:bg-amber-500/15 text-amber-600 dark:text-amber-400 border-amber-200/80 dark:border-amber-500/25',
          badgeText: 'Routing',
          badgeCls:
            'bg-amber-50 dark:bg-amber-500/10 text-amber-700 dark:text-amber-300 border-amber-200 dark:border-amber-500/20'
        };
      default:
        return {
          icon: <InfoIcon className="h-4 w-4" />,
          containerCls:
            'bg-cyan-50 dark:bg-cyan-500/15 text-cyan-600 dark:text-cyan-400 border-cyan-200/80 dark:border-cyan-500/25',
          badgeText: 'Notice',
          badgeCls:
            'bg-cyan-50 dark:bg-cyan-500/10 text-cyan-700 dark:text-cyan-300 border-cyan-200 dark:border-cyan-500/20'
        };
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

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          {/* Transparent click-away backdrop so clicking outside closes modal without darkening the navbar */}
          <div
            className="fixed inset-0 z-40 cursor-default"
            onClick={onClose}
            aria-hidden
          />

          {/* Floating dropdown modal */}
          <motion.div
            initial={{ opacity: 0, y: -6, scale: 0.97 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -6, scale: 0.97 }}
            transition={{ type: 'spring', damping: 28, stiffness: 400 }}
            onClick={(e) => e.stopPropagation()}
            className="fixed inset-x-3 top-16 sm:inset-x-auto sm:absolute sm:right-0 sm:top-full sm:mt-2.5 z-50 w-auto sm:w-[410px] max-w-[calc(100vw-1.5rem)] bg-white/95 dark:bg-[#0B131F]/95 backdrop-blur-xl border border-slate-200/90 dark:border-white/10 rounded-2xl shadow-[0_20px_50px_-12px_rgba(15,23,42,0.18)] dark:shadow-[0_24px_60px_-15px_rgba(0,0,0,0.85)] flex flex-col overflow-hidden animate-slide-down"
          >
            {/* Header */}
            <div className="flex items-center justify-between px-4 py-3.5 border-b border-slate-100 dark:border-white/5 bg-white/60 dark:bg-white/[0.02] shrink-0">
              <div className="flex items-center gap-2.5 min-w-0">
                <div className="h-7 w-7 rounded-lg bg-gradient-to-br from-sky-500/15 to-cyan-500/15 dark:from-sky-400/20 dark:to-cyan-400/20 border border-sky-200/80 dark:border-sky-500/30 flex items-center justify-center shrink-0">
                  <BellIcon className="h-3.5 w-3.5 text-sky-600 dark:text-sky-400" />
                </div>
                <div className="flex items-center gap-2 min-w-0">
                  <h3 className="text-sm font-bold text-slate-900 dark:text-white tracking-tight">
                    Notifications
                  </h3>
                  {unreadCount > 0 ? (
                    <span className="inline-flex items-center justify-center rounded-full bg-sky-500/10 dark:bg-sky-400/15 px-2 py-0.5 text-[10px] font-bold text-sky-700 dark:text-sky-300 border border-sky-500/20">
                      {unreadCount} new
                    </span>
                  ) : (
                    <span className="inline-flex items-center justify-center rounded-full bg-slate-100 dark:bg-white/5 px-2 py-0.5 text-[10px] font-semibold text-slate-500 dark:text-gray-400">
                      All caught up
                    </span>
                  )}
                </div>
              </div>

              <div className="flex items-center gap-1 shrink-0">
                {unreadCount > 0 && onMarkAllRead && (
                  <button
                    type="button"
                    onClick={() => void onMarkAllRead()}
                    className="text-[11px] font-medium px-2 py-1 rounded-lg text-slate-500 hover:text-sky-600 dark:text-gray-400 dark:hover:text-sky-400 hover:bg-slate-100 dark:hover:bg-white/5 transition-all flex items-center gap-1 active:scale-95"
                    title="Mark all as read"
                  >
                    <CheckIcon className="h-3 w-3" />
                    <span>Mark all read</span>
                  </button>
                )}
                <button
                  type="button"
                  onClick={onClose}
                  className="p-1.5 rounded-lg text-slate-400 hover:text-slate-700 dark:text-gray-500 dark:hover:text-gray-200 hover:bg-slate-100 dark:hover:bg-white/5 transition-all"
                  aria-label="Close notification modal"
                >
                  <XIcon className="h-4 w-4" />
                </button>
              </div>
            </div>

            {/* Notification items list */}
            <div className="p-2 space-y-1.5 max-h-[360px] overflow-y-auto custom-scrollbar">
              {recentNotifications.length === 0 ? (
                <div className="py-10 px-4 text-center flex flex-col items-center justify-center">
                  <div className="h-11 w-11 rounded-2xl bg-sky-50 dark:bg-sky-500/10 border border-sky-100 dark:border-sky-500/20 flex items-center justify-center mb-3 text-sky-500 dark:text-sky-400 shadow-xs">
                    <SparklesIcon className="h-5 w-5" />
                  </div>
                  <h4 className="text-sm font-semibold text-slate-800 dark:text-white mb-0.5">
                    No new notifications
                  </h4>
                  <p className="text-xs text-slate-400 dark:text-gray-500 max-w-[220px]">
                    You're completely caught up with all updates and replies.
                  </p>
                </div>
              ) : (
                recentNotifications.map((notification) => {
                  const info = getIconInfo(notification.type);
                  return (
                    <div
                      key={notification.id}
                      onClick={() => {
                        if (!notification.read) {
                          void onMarkRead(notification.id, true);
                        }
                        if (notification.concernId && onSelectConcern) {
                          onClose();
                          onSelectConcern(notification.concernId);
                        }
                      }}
                      className={`group relative w-full text-left p-3 rounded-xl transition-all duration-150 cursor-pointer flex items-start gap-3 border ${
                        notification.read
                          ? 'bg-transparent hover:bg-slate-50 dark:hover:bg-white/[0.04] border-transparent hover:border-slate-200/60 dark:hover:border-white/5'
                          : 'bg-sky-50/70 hover:bg-sky-100/70 dark:bg-sky-500/[0.08] dark:hover:bg-sky-500/[0.13] border-sky-200/70 dark:border-sky-500/25 shadow-2xs'
                      }`}
                    >
                      {/* Icon */}
                      <div
                        className={`mt-0.5 h-8 w-8 rounded-lg flex items-center justify-center shrink-0 border transition-transform duration-150 group-hover:scale-105 ${info.containerCls}`}
                      >
                        {info.icon}
                      </div>

                      {/* Content */}
                      <div className="flex-1 min-w-0 pr-1">
                        <div className="flex items-center justify-between gap-1 mb-1">
                          <div className="flex items-center gap-1.5 min-w-0">
                            <span
                              className={`text-[9px] font-bold uppercase tracking-wider px-1.5 py-0.2 rounded-md border ${info.badgeCls}`}
                            >
                              {info.badgeText}
                            </span>
                            <h4
                              className={`text-xs font-semibold truncate ${
                                notification.read
                                  ? 'text-slate-700 dark:text-gray-300'
                                  : 'text-slate-900 dark:text-white'
                              }`}
                            >
                              {notification.title}
                            </h4>
                          </div>
                          <span className="text-[10px] text-slate-400 dark:text-gray-500 shrink-0 font-medium tabular-nums">
                            {formatDate(notification.createdAt)}
                          </span>
                        </div>

                        <p
                          className={`text-xs line-clamp-2 leading-relaxed ${
                            notification.read
                              ? 'text-slate-500 dark:text-gray-400'
                              : 'text-slate-600 dark:text-gray-200 font-normal'
                          }`}
                        >
                          {notification.message}
                        </p>

                        {/* Interactive prompt if attached to a concern */}
                        {notification.concernId && (
                          <div className="mt-1.5 flex items-center gap-1 text-[11px] font-semibold text-sky-600 dark:text-sky-400 group-hover:underline">
                            <span>Open ticket</span>
                            <ExternalLinkIcon className="h-3 w-3" />
                          </div>
                        )}
                      </div>

                      {/* Quick Actions & Unread Indicator */}
                      <div className="flex items-center gap-1 shrink-0 self-center">
                        {/* Hover Quick Actions */}
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            void onMarkRead(notification.id, !notification.read);
                          }}
                          className="opacity-0 group-hover:opacity-100 p-1 rounded-md text-slate-400 hover:text-sky-600 dark:hover:text-sky-400 hover:bg-slate-200/60 dark:hover:bg-white/10 transition-all"
                          title={notification.read ? 'Mark as unread' : 'Mark as read'}
                        >
                          <CheckIcon className="h-3.5 w-3.5" />
                        </button>

                        {onDeleteNotification && (
                          <button
                            type="button"
                            onClick={(e) => {
                              e.stopPropagation();
                              void onDeleteNotification(notification.id);
                            }}
                            className="opacity-0 group-hover:opacity-100 p-1 rounded-md text-slate-400 hover:text-rose-600 dark:hover:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-500/10 transition-all"
                            title="Delete notification"
                          >
                            <Trash2Icon className="h-3.5 w-3.5" />
                          </button>
                        )}

                        {/* Unread Indicator Glow Dot */}
                        {!notification.read && (
                          <span
                            className="h-2 w-2 rounded-full bg-sky-500 dark:bg-cyan-400 shrink-0 shadow-[0_0_8px_rgba(14,165,233,0.6)] dark:shadow-[0_0_8px_rgba(6,182,212,0.9)]"
                            aria-hidden
                          />
                        )}
                      </div>
                    </div>
                  );
                })
              )}
            </div>

            {/* Footer */}
            <div className="p-2.5 border-t border-slate-100 dark:border-white/5 bg-slate-50/60 dark:bg-white/[0.02] shrink-0">
              <button
                type="button"
                onClick={() => {
                  onClose();
                  onViewAll();
                }}
                className="group w-full flex items-center justify-between py-2.5 px-3.5 rounded-xl text-xs font-semibold bg-gradient-to-r from-sky-600 to-sky-500 hover:from-sky-500 hover:to-sky-400 dark:from-sky-500 dark:to-cyan-500 dark:hover:from-sky-400 dark:hover:to-cyan-400 text-white shadow-sm shadow-sky-600/20 active:scale-[0.98] transition-all touch-manipulation"
              >
                <span className="flex items-center gap-1.5">
                  <span>See all notifications</span>
                  {notifications.length > 0 && (
                    <span className="px-1.5 py-0.2 rounded-full text-[10px] font-bold bg-white/20 text-white tabular-nums">
                      {notifications.length}
                    </span>
                  )}
                </span>
                <span className="flex items-center gap-1 text-[11px] font-normal text-white/90 group-hover:text-white transition-colors">
                  <span>View all</span>
                  <ArrowRightIcon className="h-3.5 w-3.5 transition-transform duration-150 group-hover:translate-x-1" />
                </span>
              </button>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}
