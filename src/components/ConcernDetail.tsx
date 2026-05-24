import React, { useState, Fragment, useEffect, useCallback } from 'react';
import { createPortal } from 'react-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { useMediaQuery } from '../hooks/useMediaQuery';
import { Concern, ConcernAttachment, User, ConcernStatus } from '../types';
import { formatFileSize, inferMimeFromDataUrl } from '../lib/files';
import { StatusBadge, PriorityBadge } from './StatusBadge';
import { departmentsList } from '../data/mockData';
import {
  XIcon,
  CalendarIcon,
  BuildingIcon,
  UserIcon,
  MessageSquareIcon,
  SendIcon,
  FileTextIcon,
  ImageIcon,
  ArrowRightIcon,
  CheckCircle2Icon,
  XCircleIcon,
  AlertCircleIcon,
  ArrowLeftIcon } from
'lucide-react';
function resolveConcernAttachments(concern: Concern): ConcernAttachment[] {
  if (concern.attachments && concern.attachments.length > 0) {
    return concern.attachments;
  }
  if (!concern.formData) return [];
  return Object.entries(concern.formData)
    .filter(([, value]) => typeof value === 'string' && value.startsWith('data:'))
    .map(([key, value]) => ({
      name: key.replace(/([A-Z])/g, ' $1').trim(),
      mimeType: inferMimeFromDataUrl(value as string),
      size: 0,
      dataUrl: value as string,
      field: key
    }));
}

interface ConcernDetailProps {
  isOpen: boolean;
  concern: Concern | undefined;
  currentUser: User;
  onUpdateStatus: (id: string, status: ConcernStatus) => void;
  onAddComment: (id: string, content: string, author: User) => void;
  onForward: (id: string, department: string) => void;
  onClose: () => void;
}
export function ConcernDetail({
  isOpen,
  concern,
  currentUser,
  onUpdateStatus,
  onAddComment,
  onForward,
  onClose
}: ConcernDetailProps) {
  const [newComment, setNewComment] = useState('');
  const [showForwardPanel, setShowForwardPanel] = useState(false);
  const [showStatusMenu, setShowStatusMenu] = useState(false);
  const isStaffOrAdmin =
  currentUser.role === 'staff' || currentUser.role === 'admin';

  useEffect(() => {
    if (!isOpen) return;
    const prev = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => {
      document.body.style.overflow = prev;
    };
  }, [isOpen]);

  useEffect(() => {
    if (!isOpen) {
      setNewComment('');
      setShowForwardPanel(false);
      setShowStatusMenu(false);
    }
  }, [isOpen]);

  const handleEscape = useCallback(
    (e: KeyboardEvent) => {
      if (e.key !== 'Escape') return;
      if (showForwardPanel) setShowForwardPanel(false);
      else onClose();
    },
    [showForwardPanel, onClose]
  );

  useEffect(() => {
    if (!isOpen) return;
    window.addEventListener('keydown', handleEscape);
    return () => window.removeEventListener('keydown', handleEscape);
  }, [isOpen, handleEscape]);

  const forwardTargets = concern
    ? departmentsList.filter((d) => d !== concern.department)
    : [];
  const isDesktopForward = useMediaQuery('(min-width: 640px)');
  const isMdLayout = useMediaQuery('(min-width: 768px)');
  const handleAddComment = (e: React.FormEvent) => {
    e.preventDefault();
    if (!concern || !newComment.trim()) return;
    onAddComment(concern.id, newComment, currentUser);
    setNewComment('');
  };
  const formatDate = (dateString: string) => {
    return new Intl.DateTimeFormat('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
      hour: 'numeric',
      minute: '2-digit'
    }).format(new Date(dateString));
  };
  return createPortal(
    <AnimatePresence mode="wait">
      {isOpen && concern ?
        <motion.div
          key={concern.id}
          className="fixed inset-0 z-[130] flex items-stretch justify-center md:items-center md:justify-center md:p-5 lg:p-8 pointer-events-none"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.22, ease: [0.4, 0, 0.2, 1] }}>
          <motion.button
            type="button"
            aria-label="Close concern details"
            className="absolute inset-0 z-0 bg-black/75 backdrop-blur-md pointer-events-auto"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            onClick={onClose}
          />

          <motion.div
            role="dialog"
            aria-modal="true"
            aria-labelledby="concern-detail-title"
            className="relative z-10 glass-panel pointer-events-auto flex flex-col w-full h-full min-h-0 max-h-[100dvh] md:h-auto md:max-h-[min(92vh,920px)] md:w-[min(80vw,1200px)] md:max-w-[80vw] rounded-none md:rounded-2xl overflow-hidden shadow-2xl shadow-purple-500/10 border border-white/10 pt-[max(0.5rem,env(safe-area-inset-top))] md:pt-0 pb-[env(safe-area-inset-bottom)] isolate"
            initial={{ opacity: 0, scale: isMdLayout ? 0.96 : 1 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: isMdLayout ? 0.96 : 1 }}
            transition={{ duration: 0.28, ease: [0.34, 1.02, 0.32, 1] }}
            onClick={(e) => e.stopPropagation()}>
        {/* Header — stacks on mobile for readability */}
        <div className="flex flex-col gap-2 sm:gap-3 sm:flex-row sm:flex-wrap sm:items-center sm:justify-between px-3 py-2.5 sm:p-5 border-b border-white/10 bg-white/5 shrink-0">
          <div className="flex flex-wrap items-center gap-1.5 sm:gap-3 min-w-0">
            <span
              className="text-[10px] sm:text-sm font-mono text-gray-400 bg-dark-800 px-1.5 py-1 sm:px-2 sm:py-1.5 rounded-md sm:rounded-lg border border-white/10 truncate max-w-[min(100%,11rem)] sm:max-w-full"
              title={concern.id}>
              {concern.id}
            </span>
            <div className="flex flex-wrap items-center gap-2">
              <StatusBadge status={concern.status} />
              <PriorityBadge priority={concern.priority} />
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-2 sm:justify-end">
            {isStaffOrAdmin &&
            <>
                <div className="relative">
                  <button
                  type="button"
                  onClick={() => setShowStatusMenu(!showStatusMenu)}
                  className="min-h-[44px] sm:min-h-0 flex items-center justify-center gap-2 px-3 py-2.5 sm:py-1.5 rounded-xl sm:rounded-lg text-sm font-medium text-gray-300 hover:text-white hover:bg-white/10 transition-colors border border-white/10 touch-manipulation">
                  
                    Update Status
                  </button>
                  {showStatusMenu &&
                <div className="absolute right-0 left-0 sm:left-auto top-full mt-2 w-full sm:w-48 rounded-xl border border-white/10 bg-dark-800 shadow-xl z-20 py-1 overflow-hidden animate-slide-down max-h-[min(50vh,320px)] overflow-y-auto custom-scrollbar">
                      <button
                    onClick={() => {
                      onUpdateStatus(concern.id, 'in-progress');
                      setShowStatusMenu(false);
                    }}
                    className="w-full flex items-center gap-2 px-4 py-2 text-sm text-blue-400 hover:bg-white/5 text-left">
                    
                        <AlertCircleIcon className="h-4 w-4" /> In Progress
                      </button>
                      <button
                    onClick={() => {
                      onUpdateStatus(concern.id, 'resolved');
                      setShowStatusMenu(false);
                    }}
                    className="w-full flex items-center gap-2 px-4 py-2 text-sm text-green-400 hover:bg-white/5 text-left">
                    
                        <CheckCircle2Icon className="h-4 w-4" /> Resolved
                      </button>
                      <button
                    onClick={() => {
                      onUpdateStatus(concern.id, 'rejected');
                      setShowStatusMenu(false);
                    }}
                    className="w-full flex items-center gap-2 px-4 py-2 text-sm text-red-400 hover:bg-white/5 text-left">
                    
                        <XCircleIcon className="h-4 w-4" /> Rejected
                      </button>
                    </div>
                }
                </div>

                <div className="relative">
                  <button
                  type="button"
                  onClick={() => {
                    setShowStatusMenu(false);
                    setShowForwardPanel(true);
                  }}
                  disabled={forwardTargets.length === 0}
                  className="min-h-[44px] sm:min-h-0 flex items-center justify-center gap-2 px-3 py-2.5 sm:py-1.5 rounded-xl sm:rounded-lg text-sm font-medium text-purple-400 hover:text-purple-300 hover:bg-purple-500/10 transition-colors border border-purple-500/20 touch-manipulation disabled:opacity-40 disabled:pointer-events-none">
                  
                    Forward <ArrowRightIcon className="h-4 w-4 shrink-0" />
                  </button>
                </div>
              </>
            }

            <div className="hidden sm:block h-6 w-px bg-white/10 mx-1" />

            <button
              type="button"
              onClick={onClose}
              aria-label="Close concern details"
              className="min-h-[44px] min-w-[44px] sm:min-h-0 sm:min-w-0 p-2.5 sm:p-2 rounded-xl sm:rounded-lg text-gray-400 hover:text-white hover:bg-white/10 transition-colors touch-manipulation ml-auto sm:ml-0">
              
              <XIcon className="h-5 w-5" />
            </button>
          </div>
        </div>

        {/* Content Area — mobile: stacked + scroll; md+: two equal columns */}
        <div className="flex-1 min-h-0 flex flex-col md:flex-row md:gap-0 overflow-hidden divide-y md:divide-y-0 md:divide-x divide-white/10">
          {/* Left Column: Details — mobile: capped height + scroll; md+: flexible */}
          <div className="min-h-0 shrink-0 max-md:max-h-[min(46svh,320px)] md:flex-1 md:min-h-0 md:shrink overflow-y-auto overscroll-contain px-3 py-3 sm:p-6 md:p-7 custom-scrollbar space-y-3 sm:space-y-6">
            <div>
              <p className="text-[11px] sm:text-xs text-gray-500 mb-1 sm:mb-2 line-clamp-2">
                {concern.category} • {concern.subcategory}
              </p>
              <h2
                id="concern-detail-title"
                className="text-lg sm:text-2xl font-bold text-white mb-2 sm:mb-4 leading-snug pr-1">
                {concern.title}
              </h2>

              {/* Status Timeline */}
              <div className="mb-4 sm:mb-6 bg-dark-800 p-3 sm:p-4 rounded-lg sm:rounded-xl border border-white/5">
                <h4 className="text-[10px] sm:text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2 sm:mb-3">
                  Progress
                </h4>
                <div className="flex items-center gap-0.5 sm:gap-2">
                  {(['pending', 'in-progress', 'resolved'] as const).map(
                    (step, i) => {
                      const statusOrder = {
                        pending: 0,
                        'in-progress': 1,
                        resolved: 2,
                        rejected: -1
                      };
                      const currentOrder = statusOrder[concern.status] ?? -1;
                      const stepOrder = statusOrder[step];
                      const isCompleted =
                      concern.status === 'rejected' ?
                      false :
                      currentOrder >= stepOrder;
                      const isCurrent = concern.status === step;
                      const isRejected =
                      concern.status === 'rejected' && step === 'pending';
                      const labels = {
                        pending: 'Submitted',
                        'in-progress': 'In Progress',
                        resolved: 'Resolved'
                      };
                      const colors = isRejected ?
                      'bg-red-500 border-red-500 shadow-red-500/40' :
                      isCompleted ?
                      'bg-purple-500 border-purple-500 shadow-purple-500/40' :
                      'bg-dark-700 border-white/10';
                      return (
                        <Fragment key={step}>
                          <div className="flex flex-col items-center gap-1.5">
                            <div
                              className={`h-7 w-7 sm:h-9 sm:w-9 rounded-full border-2 flex items-center justify-center transition-all duration-500 ${colors} ${isCurrent || isRejected ? 'shadow-lg sm:scale-110' : ''}`}>
                              
                              {concern.status === 'rejected' &&
                              step === 'pending' ?
                              <XCircleIcon className="h-3.5 w-3.5 sm:h-4 sm:w-4 text-white" /> :
                              isCompleted ?
                              <CheckCircle2Icon className="h-3.5 w-3.5 sm:h-4 sm:w-4 text-white" /> :

                              <div className="h-1.5 w-1.5 sm:h-2 sm:w-2 rounded-full bg-gray-600" />
                              }
                            </div>
                            <span
                              className={`text-[9px] sm:text-xs font-medium text-center max-w-[4.5rem] sm:max-w-none leading-tight ${isCurrent || isRejected ? 'text-white' : isCompleted ? 'text-purple-400' : 'text-gray-500'}`}>
                              
                              {concern.status === 'rejected' &&
                              step === 'pending' ?
                              'Rejected' :
                              labels[step]}
                            </span>
                          </div>
                          {i < 2 &&
                          <div
                            className={`flex-1 h-0.5 rounded-full transition-all duration-500 -mt-4 sm:-mt-5 ${concern.status === 'rejected' ? 'bg-white/5' : currentOrder > stepOrder ? 'bg-purple-500' : 'bg-white/5'}`} />

                          }
                        </Fragment>);

                    }
                  )}
                </div>
              </div>

              <div className="flex flex-wrap items-center gap-x-3 gap-y-1.5 text-xs sm:text-sm text-gray-400 mb-4 sm:mb-6 bg-dark-800 p-2.5 sm:p-3 rounded-lg sm:rounded-xl border border-white/5">
                <div className="flex items-center gap-1 min-w-0">
                  <UserIcon className="h-3.5 w-3.5 sm:h-4 sm:w-4 text-gray-500 shrink-0" />
                  <span className="text-gray-300 truncate max-w-[9rem] sm:max-w-none">{concern.studentName}</span>
                </div>
                <div className="flex items-center gap-1 min-w-0">
                  <BuildingIcon className="h-3.5 w-3.5 sm:h-4 sm:w-4 text-gray-500 shrink-0" />
                  <span className="text-gray-300 truncate max-w-[9rem] sm:max-w-none">{concern.department}</span>
                </div>
                <div className="flex items-center gap-1 min-w-0 w-full sm:w-auto">
                  <CalendarIcon className="h-3.5 w-3.5 sm:h-4 sm:w-4 text-gray-500 shrink-0" />
                  <span className="truncate">{formatDate(concern.createdAt)}</span>
                </div>
              </div>

              <div className="prose prose-invert max-w-none">
                <h3 className="text-xs sm:text-sm font-semibold text-white uppercase tracking-wider mb-1.5 sm:mb-2">
                  Description
                </h3>
                <p className="text-sm sm:text-base text-gray-300 whitespace-pre-wrap leading-relaxed bg-white/5 p-3 sm:p-4 rounded-lg sm:rounded-xl border border-white/10 max-md:max-h-[min(28svh,200px)] max-md:overflow-y-auto custom-scrollbar">
                  {concern.description}
                </p>
              </div>
            </div>

            {/* Form Data Details */}
            {concern.formData && Object.keys(concern.formData).length > 0 &&
            <div>
                <h3 className="text-xs sm:text-sm font-semibold text-white uppercase tracking-wider mb-2 sm:mb-3">
                  Additional Details
                </h3>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 sm:gap-4">
                  {Object.entries(concern.formData)
                    .filter(
                      ([, value]) =>
                        typeof value !== 'string' || !value.startsWith('data:')
                    )
                    .map(([key, value]) =>
                <div
                  key={key}
                  className="bg-white/5 p-2.5 sm:p-3 rounded-lg sm:rounded-xl border border-white/10">
                  
                      <div className="text-[10px] sm:text-xs text-gray-500 mb-0.5 sm:mb-1 capitalize">
                        {key.replace(/([A-Z])/g, ' $1').trim()}
                      </div>
                      <div className="text-xs sm:text-sm text-gray-300 font-medium break-words">
                        {value as string}
                      </div>
                    </div>
                )}
                </div>
              </div>
            }

            {/* Attachments */}
            {resolveConcernAttachments(concern).length > 0 &&
            <div>
                <h3 className="text-sm font-semibold text-white uppercase tracking-wider mb-3">
                  Attachments
                </h3>
                <div className="flex flex-wrap gap-3">
                  {resolveConcernAttachments(concern).map((att, i) =>
                <a
                  key={`${att.name}-${i}`}
                  href={att.dataUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  download={att.name}
                  className="flex items-center gap-2 bg-white/5 px-3 py-2 rounded-lg border border-white/10 text-sm text-gray-300 hover:bg-white/10 hover:border-purple-500/30 transition-colors">
                  
                      {att.mimeType.startsWith('image/') ? (
                        <ImageIcon className="h-4 w-4 text-cyan-400 shrink-0" />
                      ) : (
                        <FileTextIcon className="h-4 w-4 text-purple-400 shrink-0" />
                      )}
                      <span className="flex flex-col min-w-0">
                        <span className="truncate max-w-[12rem]">{att.name}</span>
                        {att.size > 0 && (
                          <span className="text-xs text-gray-500">
                            {formatFileSize(att.size)}
                          </span>
                        )}
                      </span>
                    </a>
                )}
                </div>
              </div>
            }
          </div>

          {/* Right Column: Comments/Timeline — mobile: fills remaining viewport */}
          <div className="w-full flex flex-1 flex-col min-h-0 max-md:min-h-[min(32svh,240px)] md:min-h-0 md:flex-1 md:min-w-0 md:max-w-[50%] bg-dark-800/80 overflow-hidden md:shadow-inner">
            <div className="px-3 py-2 sm:p-4 border-b border-white/10 bg-white/5 flex items-center gap-2 shrink-0">
              <MessageSquareIcon className="h-4 w-4 sm:h-5 sm:w-5 text-purple-400 shrink-0" />
              <h3 className="font-semibold text-white text-xs sm:text-base">
                Activity & Comments
              </h3>
            </div>

            <div className="flex-1 min-h-0 overflow-y-auto px-3 py-2 sm:p-4 space-y-3 sm:space-y-4 custom-scrollbar">
              {/* Initial Submission Timeline Item */}
              <div className="flex gap-3">
                <div className="flex flex-col items-center">
                  <div className="h-8 w-8 rounded-full bg-purple-500/20 flex items-center justify-center border border-purple-500/30 shrink-0">
                    <UserIcon className="h-4 w-4 text-purple-400" />
                  </div>
                  <div className="w-px h-full bg-white/10 my-1" />
                </div>
                <div className="pb-4">
                  <div className="flex items-baseline gap-2 mb-1">
                    <span className="text-sm font-medium text-white">
                      {concern.studentName}
                    </span>
                    <span className="text-xs text-gray-500">
                      {formatDate(concern.createdAt)}
                    </span>
                  </div>
                  <div className="text-xs sm:text-sm text-gray-400 bg-white/5 p-2.5 sm:p-3 rounded-lg sm:rounded-xl rounded-tl-none border border-white/10">
                    Concern submitted and routed to {concern.department}.
                  </div>
                </div>
              </div>

              {/* Comments */}
              {concern.comments.map((comment, index) => {
                const isLast = index === concern.comments.length - 1;
                const isStaff =
                comment.authorRole === 'staff' ||
                comment.authorRole === 'admin';
                return (
                  <div key={comment.id} className="flex gap-3">
                    <div className="flex flex-col items-center">
                      <div
                        className={`h-8 w-8 rounded-full flex items-center justify-center border shrink-0 ${isStaff ? 'bg-blue-500/20 border-blue-500/30 text-blue-400' : 'bg-purple-500/20 border-purple-500/30 text-purple-400'}`}>
                        
                        {isStaff ?
                        <BuildingIcon className="h-4 w-4" /> :

                        <UserIcon className="h-4 w-4" />
                        }
                      </div>
                      {!isLast &&
                      <div className="w-px h-full bg-white/10 my-1" />
                      }
                    </div>
                    <div className="pb-4 flex-1">
                      <div className="flex items-baseline gap-2 mb-1">
                        <span className="text-sm font-medium text-white">
                          {comment.author}
                        </span>
                        <span className="text-[10px] font-medium uppercase tracking-wider text-gray-500 bg-white/5 px-1.5 py-0.5 rounded">
                          {comment.authorRole}
                        </span>
                        <span className="text-xs text-gray-500 ml-auto">
                          {formatDate(comment.createdAt)}
                        </span>
                      </div>
                      <div
                        className={`text-xs sm:text-sm p-2.5 sm:p-3 rounded-lg sm:rounded-xl rounded-tl-none border ${isStaff ? 'bg-blue-500/5 border-blue-500/10 text-gray-300' : 'bg-white/5 border-white/10 text-gray-300'}`}>
                        
                        {comment.content}
                      </div>
                    </div>
                  </div>);

              })}
            </div>

            {/* Comment Input */}
            <div className="px-3 py-2 border-t border-white/10 bg-white/5 shrink-0 citezen-safe-bottom sm:p-3 sm:pb-3">
              <form onSubmit={handleAddComment} className="relative">
                <textarea
                  value={newComment}
                  onChange={(e) => setNewComment(e.target.value)}
                  placeholder="Type a message..."
                  className="w-full bg-dark-900 border border-white/10 rounded-lg sm:rounded-xl pl-2.5 sm:pl-4 pr-12 sm:pr-14 py-2.5 sm:py-3 text-sm text-white placeholder-gray-500 focus:outline-none focus:border-purple-500 focus:ring-2 focus:ring-purple-500/30 transition-all resize-none custom-scrollbar min-h-[72px] max-md:min-h-[64px] sm:min-h-[72px]"
                  rows={2}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' && !e.shiftKey) {
                      e.preventDefault();
                      handleAddComment(e);
                    }
                  }} />
                
                <button
                  type="submit"
                  disabled={!newComment.trim()}
                  aria-label="Send comment"
                  className="absolute right-1.5 bottom-1.5 sm:right-2 sm:bottom-2 min-h-[44px] min-w-[44px] sm:min-h-[40px] sm:min-w-[40px] p-2 rounded-lg sm:rounded-xl bg-purple-600 text-white hover:bg-purple-500 disabled:opacity-50 disabled:hover:bg-purple-600 transition-colors touch-manipulation flex items-center justify-center">
                  
                  <SendIcon className="h-4 w-4" />
                </button>
              </form>
            </div>
          </div>
        </div>

      <AnimatePresence>
        {showForwardPanel &&
        <>
            <motion.div
            key="forward-backdrop"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="absolute inset-0 z-[70] bg-black/65 backdrop-blur-md"
            onClick={() => setShowForwardPanel(false)}
            aria-hidden
          />

            <motion.div
            key="forward-overlay"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="absolute inset-0 z-[71] flex flex-col justify-end sm:justify-center sm:items-center sm:p-4 pointer-events-none">
              <motion.div
            key="forward-sheet"
            role="dialog"
            aria-modal="true"
            aria-labelledby="forward-sheet-title"
            initial={
              isDesktopForward
                ? { opacity: 0, scale: 0.96 }
                : { y: '100%', opacity: 1 }
            }
            animate={
              isDesktopForward
                ? { opacity: 1, scale: 1 }
                : { y: 0, opacity: 1 }
            }
            exit={
              isDesktopForward
                ? { opacity: 0, scale: 0.96 }
                : { y: '100%', opacity: 1 }
            }
            transition={
              isDesktopForward
                ? { duration: 0.22, ease: [0.4, 0, 0.2, 1] }
                : { type: 'spring', stiffness: 380, damping: 36 }
            }
            className="pointer-events-auto flex w-full max-h-[min(88dvh,560px)] flex-col overflow-hidden rounded-t-[1.35rem] border border-[var(--border-color)] bg-[var(--bg-secondary)] shadow-2xl mx-3 sm:mx-0 sm:w-full sm:max-w-md sm:rounded-2xl sm:max-h-[min(80vh,520px)]">
            
              <motion.div
                drag="y"
                dragConstraints={{ top: 0, bottom: 0 }}
                dragElastic={0.12}
                onDragEnd={(_, info) => {
                  if (!isDesktopForward && info.offset.y > 80) {
                    setShowForwardPanel(false);
                  }
                }}
                className="flex shrink-0 justify-center pt-2 sm:hidden">
                <span className="h-1 w-10 rounded-full bg-[var(--border-color)]" aria-hidden />
              </motion.div>

              <motion.div
                drag={false}
                className="flex items-center gap-3 p-4 sm:p-5 border-b border-[var(--border-color)] bg-[var(--glass-bg)] shrink-0 pt-[max(0.75rem,env(safe-area-inset-top,0px))] sm:pt-4">
                <button
                type="button"
                onClick={() => setShowForwardPanel(false)}
                className="min-h-[44px] min-w-[44px] flex items-center justify-center rounded-xl border border-[var(--border-color)] text-[var(--text-secondary)] hover:text-[var(--text-primary)] hover:bg-[var(--glass-bg-hover)] transition-colors touch-manipulation shrink-0"
                aria-label="Back">
                
                  <ArrowLeftIcon className="h-5 w-5" />
                </button>
                <div className="min-w-0 flex-1">
                  <h2
                  id="forward-sheet-title"
                  className="text-base sm:text-lg font-semibold text-[var(--text-primary)] leading-tight">
                  
                    Forward concern
                  </h2>
                  <p className="text-xs sm:text-sm text-[var(--text-muted)] mt-0.5 truncate">
                    From: {concern.department}
                  </p>
                </div>
                <button
                type="button"
                onClick={() => setShowForwardPanel(false)}
                className="min-h-[44px] min-w-[44px] flex items-center justify-center rounded-xl text-[var(--text-muted)] hover:text-[var(--text-primary)] hover:bg-[var(--glass-bg-hover)] touch-manipulation sm:hidden"
                aria-label="Close">
                
                  <XIcon className="h-5 w-5" />
                </button>
              </motion.div>

              <p className="px-4 sm:px-5 pt-3 text-xs font-medium uppercase tracking-wider text-[var(--text-muted)] shrink-0">
                Select department
              </p>

              <div className="flex-1 min-h-0 overflow-y-auto custom-scrollbar p-3 sm:p-4 space-y-2 pb-[max(1rem,env(safe-area-inset-bottom,0px))]">
                {forwardTargets.map((dept, i) =>
              <motion.button
                key={dept}
                type="button"
                initial={{ opacity: 0, x: -12 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: Math.min(i * 0.04, 0.24), duration: 0.25 }}
                onClick={() => {
                  onForward(concern.id, dept);
                  setShowForwardPanel(false);
                }}
                className="w-full flex items-center gap-3 text-left min-h-[52px] px-4 py-3 rounded-xl border border-[var(--border-color)] bg-[var(--glass-bg)] text-sm sm:text-base text-[var(--text-secondary)] hover:text-[var(--text-primary)] hover:bg-purple-500/15 hover:border-purple-500/30 active:scale-[0.99] transition-all touch-manipulation shadow-sm">
                
                    <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-purple-500/10 text-purple-400 border border-purple-500/20">
                      <BuildingIcon className="h-5 w-5" />
                    </span>
                    <span className="font-medium leading-snug flex-1">{dept}</span>
                    <ArrowRightIcon className="h-4 w-4 text-[var(--text-muted)] shrink-0" />
                  </motion.button>
              )}
                {forwardTargets.length === 0 &&
              <p className="text-center text-sm text-[var(--text-muted)] py-8 px-4">
                  No other departments available.
                </p>
              }
              </div>
            </motion.div>
            </motion.div>
          </>
        }
      </AnimatePresence>
          </motion.div>
        </motion.div>
      : null}
    </AnimatePresence>,
    document.body
  );
}
