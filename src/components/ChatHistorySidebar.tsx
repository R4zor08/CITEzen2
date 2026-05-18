import type { Ref } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  MessageCircleIcon,
  XIcon,
  PlusIcon,
  PencilIcon,
  MoreHorizontalIcon,
  SearchIcon,
  ChevronDownIcon,
  Trash2Icon
} from 'lucide-react';

export interface ChatSessionSummary {
  id: string;
  title: string;
  messages: { role: string; content: string }[];
  createdAt: string;
  updatedAt: string;
}

export interface ChatHistorySidebarProps {
  sessions: ChatSessionSummary[];
  groupedSessions: Record<string, ChatSessionSummary[]>;
  groupOrder: string[];
  activeChatId: string;
  searchQuery: string;
  collapsedGroups: Record<string, boolean>;
  editingChatId: string | null;
  editTitle: string;
  openMenuSessionId: string | null;
  searchInputRef: Ref<HTMLInputElement>;
  showCloseButton?: boolean;
  onClose?: () => void;
  onSearchChange: (value: string) => void;
  onNewChat: () => void;
  onSelectSession: (id: string) => void;
  onToggleGroup: (group: string) => void;
  onEditTitleChange: (value: string) => void;
  onSaveRename: (id: string) => void;
  onCancelRename: () => void;
  onStartRename: (id: string, title: string) => void;
  onDeleteRequest: (id: string) => void;
  onOpenMenu: (id: string | null) => void;
  className?: string;
}

export function ChatHistorySidebar({
  sessions,
  groupedSessions,
  groupOrder,
  activeChatId,
  searchQuery,
  collapsedGroups,
  editingChatId,
  editTitle,
  openMenuSessionId,
  searchInputRef,
  showCloseButton = false,
  onClose,
  onSearchChange,
  onNewChat,
  onSelectSession,
  onToggleGroup,
  onEditTitleChange,
  onSaveRename,
  onCancelRename,
  onStartRename,
  onDeleteRequest,
  onOpenMenu,
  className = ''
}: ChatHistorySidebarProps) {
  return (
    <div className={`flex flex-col flex-1 min-h-0 bg-dark-900 ${className}`}>
      <div className="flex items-center justify-between px-3 py-3 border-b border-white/10 bg-dark-900 shrink-0">
        <h3 className="text-sm font-semibold text-white">Chats</h3>
        {showCloseButton && onClose && (
          <button
            type="button"
            onClick={onClose}
            className="p-2 rounded-lg text-gray-400 hover:bg-white/10 hover:text-white transition-colors min-h-[44px] min-w-[44px] flex items-center justify-center"
            aria-label="Close chats">
            <XIcon className="h-5 w-5" />
          </button>
        )}
      </div>

      <div className="px-3 py-3 border-b border-white/10 bg-dark-900 shrink-0 space-y-2">
        <button
          type="button"
          onClick={onNewChat}
          className="w-full min-h-[44px] py-2.5 rounded-lg border border-white/10 bg-transparent text-gray-200 hover:bg-white/5 transition-colors flex items-center justify-center gap-2 text-sm font-medium">
          <PlusIcon className="h-4 w-4 shrink-0" /> New chat
        </button>
        <div className="relative">
          <SearchIcon className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-500 pointer-events-none" />
          <input
            ref={searchInputRef}
            type="text"
            value={searchQuery}
            onChange={(e) => onSearchChange(e.target.value)}
            placeholder="Search chats…"
            className="w-full bg-dark-800 border border-white/10 rounded-lg py-2.5 pl-9 pr-4 text-sm text-white placeholder-gray-500 focus:outline-none focus:border-white/20 focus:ring-0"
          />
        </div>
      </div>

      <div className="flex-1 overflow-y-auto px-2 py-2 space-y-4 custom-scrollbar min-h-0">
        {Object.keys(groupedSessions).length === 0 ? (
          <div className="h-full flex flex-col items-center justify-center text-center p-6">
            <MessageCircleIcon className="h-10 w-10 text-gray-600 mb-3" />
            <p className="text-sm text-gray-500">
              {sessions.length === 0 ? 'No chats yet' : 'No conversations found'}
            </p>
          </div>
        ) : (
          groupOrder.map((group) => {
            const groupSessions = groupedSessions[group];
            if (!groupSessions || groupSessions.length === 0) return null;
            return (
              <div key={group} className="space-y-0.5">
                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    onToggleGroup(group);
                  }}
                  className="flex items-center justify-between w-full px-2 py-1.5 rounded-md hover:bg-white/5 transition-colors group/header">
                  <h4 className="text-xs font-medium text-gray-500">{group}</h4>
                  <motion.div
                    animate={{ rotate: collapsedGroups[group] ? -90 : 0 }}
                    transition={{ duration: 0.15 }}>
                    <ChevronDownIcon className="h-3.5 w-3.5 text-gray-500 group-hover/header:text-gray-400 transition-colors" />
                  </motion.div>
                </button>
                <AnimatePresence initial={false}>
                  {!collapsedGroups[group] &&
                    groupSessions.map((session) => {
                      const isActive = session.id === activeChatId;
                      const isMenuOpen = openMenuSessionId === session.id;
                      return (
                        <div
                          key={session.id}
                          onClick={() => {
                            if (editingChatId === session.id) return;
                            onSelectSession(session.id);
                          }}
                          className={`group relative flex items-center min-h-[44px] px-3 py-2 rounded-lg cursor-pointer transition-colors ${isActive ? 'bg-white/10' : 'hover:bg-white/5'}`}>
                          {editingChatId === session.id ? (
                            <input
                              autoFocus
                              value={editTitle}
                              onChange={(e) => onEditTitleChange(e.target.value)}
                              onBlur={() => onSaveRename(session.id)}
                              onKeyDown={(e) => {
                                if (e.key === 'Enter') onSaveRename(session.id);
                                if (e.key === 'Escape') onCancelRename();
                              }}
                              className="flex-1 min-w-0 bg-dark-800 border border-white/20 rounded px-2 py-1 text-sm text-white focus:outline-none focus:border-white/30"
                              onClick={(e) => e.stopPropagation()}
                            />
                          ) : (
                            <span
                              className={`flex-1 min-w-0 text-sm font-medium truncate pr-8 ${isActive ? 'text-white' : 'text-gray-200'}`}>
                              {session.title}
                            </span>
                          )}

                          <button
                            type="button"
                            onClick={(e) => {
                              e.stopPropagation();
                              onOpenMenu(isMenuOpen ? null : session.id);
                            }}
                            className={`absolute right-1 top-1/2 -translate-y-1/2 p-2 rounded-md text-gray-400 hover:bg-white/10 hover:text-white transition-colors shrink-0 ${isMenuOpen ? 'opacity-100 bg-white/10' : 'opacity-0 group-hover:opacity-100 max-md:opacity-100'}`}
                            aria-label="Chat options">
                            <MoreHorizontalIcon className="h-4 w-4" />
                          </button>

                          <AnimatePresence>
                            {isMenuOpen && (
                              <>
                                <motion.div
                                  className="fixed inset-0 z-[60]"
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    onOpenMenu(null);
                                  }}
                                />
                                <motion.div
                                  initial={{ opacity: 0, scale: 0.95 }}
                                  animate={{ opacity: 1, scale: 1 }}
                                  exit={{ opacity: 0, scale: 0.95 }}
                                  transition={{ duration: 0.12 }}
                                  className="absolute right-0 top-full mt-1 z-[70] w-36 bg-dark-800 border border-white/10 rounded-lg shadow-xl overflow-hidden py-1"
                                  onClick={(e) => e.stopPropagation()}>
                                  <button
                                    type="button"
                                    onClick={() => {
                                      onStartRename(session.id, session.title);
                                      onOpenMenu(null);
                                    }}
                                    className="w-full px-3 py-2 text-left text-sm text-gray-200 hover:bg-white/10 flex items-center gap-2">
                                    <PencilIcon className="h-3.5 w-3.5 text-gray-400" />
                                    Rename
                                  </button>
                                  <button
                                    type="button"
                                    onClick={() => {
                                      onDeleteRequest(session.id);
                                      onOpenMenu(null);
                                    }}
                                    className="w-full px-3 py-2 text-left text-sm text-red-400 hover:bg-red-500/10 flex items-center gap-2">
                                    <Trash2Icon className="h-3.5 w-3.5" />
                                    Delete
                                  </button>
                                </motion.div>
                              </>
                            )}
                          </AnimatePresence>
                        </div>
                      );
                    })}
                </AnimatePresence>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
}
