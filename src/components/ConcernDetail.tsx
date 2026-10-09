import React, { useState, useEffect, useCallback } from 'react';
import { createPortal } from 'react-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { toast } from 'sonner';
import { useMediaQuery } from '../hooks/useMediaQuery';
import { Concern, ConcernAttachment, User, ConcernStatus } from '../types';
import { formatFileSize, inferMimeFromDataUrl } from '../lib/files';
import { StatusBadge, PriorityBadge } from './StatusBadge';
import { departmentsList } from '../data/mockData';
import {
  XIcon,
  CalendarIcon,
  BuildingIcon,
  MessageSquareIcon,
  SendIcon,
  FileTextIcon,
  ImageIcon,
  ArrowRightIcon,
  CheckCircle2Icon,
  XCircleIcon,
  AlertCircleIcon,
  ArrowLeftIcon,
  SparklesIcon,
  CopyIcon,
  CheckIcon
} from 'lucide-react';

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
  onConfirm?: (
    id: string,
    params: {
      assignedToId: string;
      department?: string;
      category?: string;
      subcategory?: string;
    }
  ) => Promise<void> | void;
  staffUsers?: User[];
}

export function ConcernDetail({
  isOpen,
  concern,
  currentUser,
  onUpdateStatus,
  onAddComment,
  onForward,
  onClose,
  onConfirm,
  staffUsers
}: ConcernDetailProps) {
  const [newComment, setNewComment] = useState('');
  const [showForwardPanel, setShowForwardPanel] = useState(false);
  const [showStatusMenu, setShowStatusMenu] = useState(false);
  const [selectedStaffId, setSelectedStaffId] = useState('');
  const [selectedDept, setSelectedDept] = useState('');
  const [selectedCat, setSelectedCat] = useState('');
  const [isConfirming, setIsConfirming] = useState(false);
  const [copiedId, setCopiedId] = useState(false);
  const [copiedDesc, setCopiedDesc] = useState(false);

  const isStaffOrAdmin =
    currentUser.role === 'staff' || currentUser.role === 'admin';

  useEffect(() => {
    if (concern) {
      setSelectedStaffId(concern.assignedTo || concern.suggestedStaffId || '');
      setSelectedDept(concern.department || '');
      setSelectedCat(concern.category || 'Academic');
    }
  }, [concern]);

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

  const handleCopyId = () => {
    if (!concern) return;
    navigator.clipboard.writeText(concern.id);
    setCopiedId(true);
    toast.success('Ticket ID copied to clipboard');
    setTimeout(() => setCopiedId(false), 2000);
  };

  const handleCopyDesc = () => {
    if (!concern) return;
    navigator.clipboard.writeText(concern.description);
    setCopiedDesc(true);
    toast.success('Description copied to clipboard');
    setTimeout(() => setCopiedDesc(false), 2000);
  };

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
      {isOpen && concern ? (
        <motion.div
          key={concern.id}
          className="fixed inset-0 z-[130] flex items-stretch justify-center md:items-center md:justify-center md:p-5 lg:p-8 pointer-events-none"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.22, ease: [0.4, 0, 0.2, 1] }}
        >
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
            className="relative z-10 glass-panel pointer-events-auto flex flex-col w-full h-full min-h-0 max-h-[100dvh] md:h-auto md:max-h-[min(92vh,920px)] md:w-[min(84vw,1260px)] md:max-w-[84vw] rounded-none md:rounded-2xl overflow-hidden shadow-2xl shadow-sky-500/10 border border-white/10 pt-[max(0.5rem,env(safe-area-inset-top))] md:pt-0 pb-[env(safe-area-inset-bottom)] isolate"
            initial={{ opacity: 0, scale: isMdLayout ? 0.96 : 1 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: isMdLayout ? 0.96 : 1 }}
            transition={{ duration: 0.28, ease: [0.34, 1.02, 0.32, 1] }}
            onClick={(e) => e.stopPropagation()}
          >
            {/* Header */}
            <div className="concern-detail-header flex flex-col gap-2 sm:gap-3 sm:flex-row sm:flex-wrap sm:items-center sm:justify-between px-4 py-3 sm:p-5 shrink-0 bg-white/[0.02]">
              <div className="flex flex-wrap items-center gap-2 sm:gap-3 min-w-0">
                {/* Clean ticket badge with 1-click copy */}
                <button
                  type="button"
                  onClick={handleCopyId}
                  className="concern-ticket-badge inline-flex items-center gap-1.5 px-3 py-1 rounded-xl text-xs font-mono font-bold tracking-wider cursor-pointer hover:border-sky-500/40 active:scale-95 transition-all group"
                  title="Click to copy full concern ID"
                >
                  <span className="text-sky-500 font-bold">#</span>
                  <span>{concern.id.slice(-6).toUpperCase()}</span>
                  {copiedId ? (
                    <CheckIcon className="h-3 w-3 text-emerald-400 shrink-0" />
                  ) : (
                    <CopyIcon className="h-3 w-3 text-gray-400 group-hover:text-sky-400 shrink-0 opacity-60 group-hover:opacity-100 transition-opacity" />
                  )}
                </button>

                <div className="flex flex-wrap items-center gap-2">
                  <StatusBadge status={concern.status} />
                  <PriorityBadge priority={concern.priority} />
                </div>
              </div>

              <div className="flex flex-wrap items-center gap-2 sm:justify-end">
                {isStaffOrAdmin && (
                  <>
                    <div className="relative">
                      <button
                        type="button"
                        onClick={() => setShowStatusMenu(!showStatusMenu)}
                        className="min-h-[38px] sm:min-h-0 flex items-center justify-center gap-2 px-3.5 py-1.5 rounded-xl text-xs font-semibold text-gray-300 hover:text-white hover:bg-white/10 transition-colors border border-white/10 touch-manipulation"
                      >
                        Update Status
                      </button>
                      {showStatusMenu && (
                        <div className="absolute right-0 left-0 sm:left-auto top-full mt-2 w-full sm:w-48 rounded-xl border border-white/10 bg-dark-800 shadow-xl z-20 py-1 overflow-hidden animate-slide-down max-h-[min(50vh,320px)] overflow-y-auto custom-scrollbar">
                          <button
                            onClick={() => {
                              onUpdateStatus(concern.id, 'in-progress');
                              setShowStatusMenu(false);
                            }}
                            className="w-full flex items-center gap-2 px-4 py-2 text-xs text-blue-400 hover:bg-white/5 text-left font-medium"
                          >
                            <AlertCircleIcon className="h-4 w-4" /> In Progress
                          </button>
                          <button
                            onClick={() => {
                              onUpdateStatus(concern.id, 'resolved');
                              setShowStatusMenu(false);
                            }}
                            className="w-full flex items-center gap-2 px-4 py-2 text-xs text-green-400 hover:bg-white/5 text-left font-medium"
                          >
                            <CheckCircle2Icon className="h-4 w-4" /> Resolved
                          </button>
                          <button
                            onClick={() => {
                              onUpdateStatus(concern.id, 'rejected');
                              setShowStatusMenu(false);
                            }}
                            className="w-full flex items-center gap-2 px-4 py-2 text-xs text-red-400 hover:bg-white/5 text-left font-medium"
                          >
                            <XCircleIcon className="h-4 w-4" /> Rejected
                          </button>
                        </div>
                      )}
                    </div>

                    <div className="relative">
                      <button
                        type="button"
                        onClick={() => {
                          setShowStatusMenu(false);
                          setShowForwardPanel(true);
                        }}
                        disabled={forwardTargets.length === 0}
                        className="min-h-[38px] sm:min-h-0 flex items-center justify-center gap-1.5 px-3.5 py-1.5 rounded-xl text-xs font-semibold text-purple-400 hover:text-purple-300 hover:bg-purple-500/10 transition-colors border border-purple-500/20 touch-manipulation disabled:opacity-40 disabled:pointer-events-none"
                      >
                        Forward <ArrowRightIcon className="h-3.5 w-3.5 shrink-0" />
                      </button>
                    </div>
                  </>
                )}

                <div className="hidden sm:block h-6 w-px bg-white/10 mx-1" />

                <button
                  type="button"
                  onClick={onClose}
                  aria-label="Close concern details"
                  className="p-2 rounded-xl text-gray-400 hover:text-white hover:bg-white/10 transition-all active:scale-95 touch-manipulation ml-auto sm:ml-0"
                >
                  <XIcon className="h-5 w-5" />
                </button>
              </div>
            </div>

            {/* Content Area */}
            <div className="flex-1 min-h-0 flex flex-col md:flex-row md:gap-0 overflow-hidden divide-y md:divide-y-0 md:divide-x divide-white/10">
              {/* Left Column: Details */}
              <div className="min-h-0 shrink-0 max-md:max-h-[min(50svh,340px)] md:flex-1 md:min-h-0 md:shrink overflow-y-auto overscroll-contain px-4 py-4 sm:p-6 md:p-7 custom-scrollbar space-y-4 sm:space-y-6">
                <div>
                  <div className="flex items-center gap-2 mb-2 flex-wrap">
                    <span className="text-xs font-semibold px-2.5 py-0.5 rounded-full bg-sky-500/10 text-sky-400 border border-sky-500/20">
                      {concern.category}
                    </span>
                    {concern.subcategory && (
                      <>
                        <span className="text-gray-400 text-xs">•</span>
                        <span className="text-xs text-gray-400 font-medium">{concern.subcategory}</span>
                      </>
                    )}
                  </div>

                  <h2
                    id="concern-detail-title"
                    className="text-xl sm:text-2xl font-extrabold text-white mb-4 leading-snug tracking-tight"
                  >
                    {concern.title}
                  </h2>

                  {/* Linear-Style Progress Milestone Stepper */}
                  <div className="concern-milestone-card p-4 sm:p-5 rounded-2xl mb-4 sm:mb-6">
                    <div className="flex items-center justify-between mb-3.5">
                      <span className="text-xs font-bold text-gray-400 uppercase tracking-wider">
                        Case Progress
                      </span>
                      <span className="text-xs font-semibold capitalize text-sky-400">
                        {concern.status === 'rejected' ? 'Rejected' : concern.status.replace('-', ' ')}
                      </span>
                    </div>

                    <div className="grid grid-cols-3 gap-2 relative">
                      {(
                        [
                          {
                            id: 'pending',
                            label: 'Submitted',
                            detail: formatDate(concern.createdAt).split(',')[0]
                          },
                          {
                            id: 'in-progress',
                            label: 'In Review',
                            detail:
                              concern.status === 'in-progress' || concern.status === 'resolved'
                                ? 'Under Review'
                                : 'Pending'
                          },
                          {
                            id: 'resolved',
                            label: 'Resolved',
                            detail: concern.status === 'resolved' ? 'Confirmed' : 'Pending'
                          }
                        ] as const
                      ).map((step, idx) => {
                        const statusOrder: Record<ConcernStatus, number> = {
                          pending: 0,
                          'in-progress': 1,
                          resolved: 2,
                          rejected: -1
                        };
                        const currentOrder = statusOrder[concern.status] ?? 0;
                        const isDone = concern.status !== 'rejected' && currentOrder >= idx;
                        const isCurrent =
                          concern.status !== 'rejected' &&
                          (concern.status === step.id || (concern.status === 'pending' && idx === 0));
                        const isRejected = concern.status === 'rejected' && idx === 0;

                        return (
                          <div key={step.id} className="relative flex flex-col items-center text-center">
                            {/* Connector Line */}
                            {idx > 0 && (
                              <div
                                className={`absolute top-4 -left-1/2 w-full h-1 -translate-y-1/2 rounded-full transition-colors ${
                                  isDone
                                    ? 'bg-gradient-to-r from-sky-500 to-emerald-400'
                                    : 'bg-white/10 dark:bg-white/10'
                                }`}
                              />
                            )}

                            {/* Node Icon */}
                            <div
                              className={`relative z-10 h-8 w-8 sm:h-9 sm:w-9 rounded-full flex items-center justify-center border-2 transition-all ${
                                isRejected
                                  ? 'bg-rose-500 border-rose-500 text-white shadow-lg shadow-rose-500/30'
                                  : isDone
                                  ? 'bg-emerald-500 border-emerald-500 text-white shadow-lg shadow-emerald-500/25'
                                  : isCurrent
                                  ? 'bg-sky-500 border-sky-400 text-white shadow-lg shadow-sky-500/30'
                                  : 'bg-dark-700/80 dark:bg-dark-800 border-white/15 text-gray-500'
                              }`}
                            >
                              {isRejected ? (
                                <XCircleIcon className="h-4 w-4" />
                              ) : isDone ? (
                                <CheckCircle2Icon className="h-4 w-4" />
                              ) : (
                                <span className="h-2 w-2 rounded-full bg-gray-500" />
                              )}
                            </div>

                            <span
                              className={`text-xs font-bold mt-2 leading-tight ${
                                isDone || isCurrent ? 'text-white' : 'text-gray-500'
                              }`}
                            >
                              {isRejected ? 'Rejected' : step.label}
                            </span>
                            <span className="text-[10px] text-gray-400 mt-0.5 font-medium truncate max-w-full">
                              {step.detail}
                            </span>
                          </div>
                        );
                      })}
                    </div>
                  </div>

                  {/* Metadata Strip */}
                  <div className="concern-meta-strip p-3 sm:p-3.5 rounded-2xl flex flex-wrap items-center justify-between gap-3 text-xs text-gray-400 mb-4 sm:mb-6">
                    <div className="flex items-center gap-2.5 min-w-0">
                      <div className="h-8 w-8 rounded-full bg-gradient-to-br from-blue-600 via-sky-600 to-cyan-500 text-white font-bold text-xs uppercase flex items-center justify-center shrink-0 shadow-sm">
                        {concern.studentName
                          .split(' ')
                          .map((n) => n[0])
                          .slice(0, 2)
                          .join('')}
                      </div>
                      <div className="min-w-0">
                        <span className="text-white font-bold text-xs block truncate">
                          {concern.studentName}
                        </span>
                        <span className="text-[10px] text-gray-400">Student Submitter</span>
                      </div>
                    </div>

                    <div className="flex items-center gap-1.5 px-3 py-1 rounded-xl bg-white/5 border border-white/5">
                      <BuildingIcon className="h-3.5 w-3.5 text-sky-400" />
                      <span className="text-gray-300 font-semibold">{concern.department}</span>
                    </div>

                    <div className="flex items-center gap-1.5 text-gray-400 text-xs">
                      <CalendarIcon className="h-3.5 w-3.5 text-gray-500" />
                      <span>{formatDate(concern.createdAt)}</span>
                    </div>
                  </div>

                  {/* Description Statement */}
                  <div className="space-y-2 mb-5">
                    <div className="flex items-center justify-between">
                      <h3 className="text-xs font-bold text-gray-400 uppercase tracking-wider">
                        Student Statement
                      </h3>
                      <button
                        type="button"
                        onClick={handleCopyDesc}
                        className="text-xs text-sky-400 hover:text-sky-300 flex items-center gap-1 transition-colors"
                        title="Copy statement text"
                      >
                        {copiedDesc ? (
                          <>
                            <CheckIcon className="h-3.5 w-3.5 text-emerald-400" />
                            <span className="text-emerald-400">Copied</span>
                          </>
                        ) : (
                          <>
                            <CopyIcon className="h-3.5 w-3.5" />
                            <span>Copy</span>
                          </>
                        )}
                      </button>
                    </div>
                    <div className="concern-statement-card p-4 sm:p-5 rounded-2xl text-sm leading-relaxed whitespace-pre-wrap">
                      {concern.description}
                    </div>
                  </div>

                  {/* AI Classification & Routing Card */}
                  <div className="ai-classification-card rounded-2xl p-4 sm:p-5 space-y-4 shadow-lg mb-5">
                    <div className="flex flex-wrap items-center justify-between gap-2 border-b border-white/10 pb-3">
                      <div className="flex items-center gap-2.5">
                        <div className="p-2 rounded-xl bg-sky-500/20 text-sky-300 border border-sky-500/30">
                          <SparklesIcon className="h-4 w-4 text-sky-400 animate-pulse" />
                        </div>
                        <div>
                          <h4 className="text-sm font-bold text-white">
                            AI Classification & Routing
                          </h4>
                          <span className="text-[11px] text-gray-400">
                            Automated triage & department routing
                          </span>
                        </div>
                      </div>

                      <div className="flex items-center gap-2">
                        <span className="text-xs font-semibold text-sky-300 bg-sky-500/15 px-2.5 py-1 rounded-full border border-sky-500/25">
                          {Math.round((concern.aiClassification?.confidence ?? 0.88) * 100)}% Confidence
                        </span>
                        {concern.adminReviewStatus === 'pending' || !concern.isConfirmed ? (
                          <span className="inline-flex items-center gap-1 text-[11px] font-medium text-amber-300 bg-amber-500/10 px-2.5 py-1 rounded-full border border-amber-500/20">
                            Awaiting Confirmation
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1 text-[11px] font-medium text-emerald-300 bg-emerald-500/10 px-2.5 py-1 rounded-full border border-emerald-500/20">
                            <CheckCircle2Icon className="h-3 w-3" />
                            Confirmed
                          </span>
                        )}
                      </div>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5 text-xs">
                      <div className="ai-meta-box p-3 rounded-xl border border-white/5 bg-white/5">
                        <span className="ai-meta-label text-[10px] text-gray-400 block uppercase font-semibold">Triage Category</span>
                        <span className="ai-meta-val font-bold text-sky-400 text-sm mt-0.5 block">{concern.category}</span>
                      </div>
                      <div className="ai-meta-box p-3 rounded-xl border border-white/5 bg-white/5">
                        <span className="ai-meta-label text-[10px] text-gray-400 block uppercase font-semibold">Assigned Department</span>
                        <span className="ai-meta-val font-bold text-cyan-400 text-sm mt-0.5 block">{concern.department}</span>
                      </div>
                      <div className="ai-meta-box p-3 rounded-xl border border-white/5 bg-white/5">
                        <span className="ai-meta-label text-[10px] text-gray-400 block uppercase font-semibold">Staff Assignment</span>
                        <span className="ai-meta-val font-bold text-white text-sm mt-0.5 block truncate">
                          {concern.assignedTo
                            ? staffUsers?.find((u) => u.id === concern.assignedTo)?.name || 'Assigned Staff'
                            : concern.suggestedStaffName || 'Pending assignment'}
                        </span>
                      </div>
                    </div>

                    {concern.aiClassification?.reasoning && (
                      <div className="ai-reasoning-box text-xs bg-sky-500/10 p-3 rounded-xl border border-sky-500/20 leading-relaxed text-gray-300">
                        <span className="font-semibold text-sky-400 block mb-0.5">Triage Rationale</span>
                        {concern.aiClassification.reasoning}
                      </div>
                    )}

                    {/* Admin Confirmation / Reassignment Actions */}
                    {currentUser.role === 'admin' && onConfirm && (
                      <div className="pt-2 border-t border-white/10 space-y-3">
                        <div className="text-xs font-bold text-gray-200">
                          Admin Final Assignment
                        </div>
                        <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                          <div>
                            <label className="text-[10px] text-gray-400 block mb-1 font-medium">Category</label>
                            <select
                              value={selectedCat}
                              onChange={(e) => setSelectedCat(e.target.value)}
                              className="w-full bg-dark-800 border border-white/10 rounded-xl py-1.5 px-2 text-xs text-white focus:outline-none focus:border-sky-500"
                            >
                              {['Academic', 'Administrative', 'Facility', 'Complaints'].map((cat) => (
                                <option key={cat} value={cat}>
                                  {cat}
                                </option>
                              ))}
                            </select>
                          </div>
                          <div>
                            <label className="text-[10px] text-gray-400 block mb-1 font-medium">Department</label>
                            <select
                              value={selectedDept}
                              onChange={(e) => setSelectedDept(e.target.value)}
                              className="w-full bg-dark-800 border border-white/10 rounded-xl py-1.5 px-2 text-xs text-white focus:outline-none focus:border-sky-500"
                            >
                              {departmentsList.map((d) => (
                                <option key={d} value={d}>
                                  {d}
                                </option>
                              ))}
                            </select>
                          </div>
                          <div>
                            <label className="text-[10px] text-gray-400 block mb-1 font-medium">Assign to Staff</label>
                            <select
                              value={selectedStaffId}
                              onChange={(e) => setSelectedStaffId(e.target.value)}
                              className="w-full bg-dark-800 border border-white/10 rounded-xl py-1.5 px-2 text-xs text-white focus:outline-none focus:border-sky-500"
                            >
                              <option value="">Select staff member…</option>
                              {staffUsers?.map((u) => (
                                <option key={u.id} value={u.id}>
                                  {u.name} ({u.department || 'No dept'})
                                </option>
                              ))}
                            </select>
                          </div>
                        </div>
                        <div className="flex justify-end">
                          <button
                            type="button"
                            disabled={!selectedStaffId || isConfirming}
                            onClick={async () => {
                              if (!selectedStaffId) return;
                              setIsConfirming(true);
                              try {
                                await onConfirm(concern.id, {
                                  assignedToId: selectedStaffId,
                                  department: selectedDept || concern.department,
                                  category: selectedCat || concern.category,
                                  subcategory: concern.subcategory
                                });
                              } finally {
                                setIsConfirming(false);
                              }
                            }}
                            className="px-4 py-2 rounded-xl bg-gradient-to-r from-blue-600 via-sky-600 to-cyan-500 hover:from-blue-500 hover:to-cyan-400 text-white text-xs font-semibold flex items-center gap-1.5 shadow-md shadow-sky-500/20 transition-all disabled:opacity-50"
                          >
                            {isConfirming ? (
                              <div className="h-3.5 w-3.5 rounded-full border-2 border-white/30 border-t-white animate-spin" />
                            ) : (
                              <CheckCircle2Icon className="h-3.5 w-3.5" />
                            )}
                            <span>
                              {concern.adminReviewStatus === 'pending' || !concern.isConfirmed
                                ? 'Confirm Admin Final Assignment'
                                : 'Save Reassignment'}
                            </span>
                          </button>
                        </div>
                      </div>
                    )}
                  </div>
                </div>

                {/* Additional Form Data Details */}
                {concern.formData && Object.keys(concern.formData).length > 0 && (
                  <div>
                    <h3 className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-2.5">
                      Additional Information
                    </h3>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                      {Object.entries(concern.formData)
                        .filter(([, value]) => typeof value !== 'string' || !value.startsWith('data:'))
                        .map(([key, value]) => (
                          <div
                            key={key}
                            className="bg-white/5 p-3 rounded-xl border border-white/10"
                          >
                            <div className="text-[10px] text-gray-400 font-semibold mb-0.5 uppercase">
                              {key.replace(/([A-Z])/g, ' $1').trim()}
                            </div>
                            <div className="text-xs sm:text-sm text-gray-200 font-medium break-words">
                              {value as string}
                            </div>
                          </div>
                        ))}
                    </div>
                  </div>
                )}

                {/* Attachments */}
                {resolveConcernAttachments(concern).length > 0 && (
                  <div>
                    <h3 className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-2.5">
                      Supporting Attachments
                    </h3>
                    <div className="flex flex-wrap gap-2.5">
                      {resolveConcernAttachments(concern).map((att, i) => (
                        <a
                          key={`${att.name}-${i}`}
                          href={att.dataUrl}
                          target="_blank"
                          rel="noopener noreferrer"
                          download={att.name}
                          className="flex items-center gap-2.5 bg-white/5 px-3.5 py-2.5 rounded-xl border border-white/10 text-xs sm:text-sm text-gray-300 hover:bg-white/10 hover:border-sky-500/30 transition-all group"
                        >
                          {att.mimeType.startsWith('image/') ? (
                            <ImageIcon className="h-4 w-4 text-cyan-400 shrink-0" />
                          ) : (
                            <FileTextIcon className="h-4 w-4 text-sky-400 shrink-0" />
                          )}
                          <span className="flex flex-col min-w-0">
                            <span className="truncate max-w-[12rem] font-medium group-hover:text-white transition-colors">{att.name}</span>
                            {att.size > 0 && (
                              <span className="text-[10px] text-gray-500">
                                {formatFileSize(att.size)}
                              </span>
                            )}
                          </span>
                        </a>
                      ))}
                    </div>
                  </div>
                )}
              </div>

              {/* Right Column: Comments & Discussion Feed */}
              <div className="concern-discussion-panel w-full flex flex-1 flex-col min-h-0 max-md:min-h-[min(36svh,260px)] md:min-h-0 md:flex-1 md:min-w-0 md:max-w-[48%] overflow-hidden">
                <div className="px-4 py-3 border-b border-white/10 bg-white/[0.02] flex items-center justify-between shrink-0">
                  <div className="flex items-center gap-2">
                    <MessageSquareIcon className="h-4 w-4 text-sky-400" />
                    <h3 className="font-bold text-white text-xs sm:text-sm">
                      Activity & Discussion
                    </h3>
                  </div>
                  <span className="text-[11px] font-mono px-2 py-0.5 rounded-full bg-white/5 text-gray-400 border border-white/10">
                    {concern.comments.length + 1} events
                  </span>
                </div>

                <div className="flex-1 min-h-0 overflow-y-auto px-4 py-3.5 space-y-3.5 custom-scrollbar">
                  {/* Initial Audit Event */}
                  <div className="flex gap-3">
                    <div className="flex flex-col items-center">
                      <div className="h-7 w-7 rounded-full bg-sky-500/15 border border-sky-500/25 flex items-center justify-center text-sky-400 shrink-0">
                        <CheckCircle2Icon className="h-3.5 w-3.5" />
                      </div>
                      <div className="w-px flex-1 bg-white/10 my-1" />
                    </div>
                    <div className="pb-2 flex-1">
                      <div className="flex items-center justify-between gap-2 mb-1">
                        <span className="text-xs font-bold text-white">System Route</span>
                        <span className="text-[11px] text-gray-400">{formatDate(concern.createdAt)}</span>
                      </div>
                      <div className="text-xs text-gray-400 p-2.5 rounded-xl bg-white/[0.03] border border-white/5 leading-relaxed">
                        Concern logged by <strong className="text-white font-medium">{concern.studentName}</strong> and routed to <strong className="text-sky-400 font-semibold">{concern.department}</strong>.
                      </div>
                    </div>
                  </div>

                  {/* Comments Timeline */}
                  {concern.comments.map((comment, index) => {
                    const isLast = index === concern.comments.length - 1;
                    const isStaff =
                      comment.authorRole === 'staff' || comment.authorRole === 'admin';

                    return (
                      <div key={comment.id} className="flex gap-3">
                        <div className="flex flex-col items-center">
                          <div
                            className={`h-7 w-7 rounded-full flex items-center justify-center border shrink-0 text-xs font-bold ${
                              isStaff
                                ? 'bg-sky-500/20 border-sky-500/30 text-sky-300'
                                : 'bg-gradient-to-br from-blue-500 to-cyan-500 text-white'
                            }`}
                          >
                            {isStaff ? (
                              <BuildingIcon className="h-3.5 w-3.5" />
                            ) : (
                              comment.author
                                .split(' ')
                                .map((n) => n[0])
                                .slice(0, 2)
                                .join('')
                            )}
                          </div>
                          {!isLast && <div className="w-px flex-1 bg-white/10 my-1" />}
                        </div>

                        <div className="pb-2 flex-1">
                          <div className="flex items-center justify-between gap-2 mb-1">
                            <div className="flex items-center gap-1.5 flex-wrap">
                              <span className="text-xs font-bold text-white">
                                {comment.author}
                              </span>
                              <span
                                className={`text-[10px] font-semibold px-2 py-0.2 rounded-full border ${
                                  isStaff
                                    ? 'bg-sky-500/15 text-sky-400 border-sky-500/25'
                                    : 'bg-white/5 text-gray-400 border-white/10'
                                }`}
                              >
                                {isStaff ? 'Staff · Official' : 'Student'}
                              </span>
                            </div>
                            <span className="text-[11px] text-gray-400">
                              {formatDate(comment.createdAt)}
                            </span>
                          </div>

                          <div
                            className={`text-xs p-3 rounded-2xl leading-relaxed ${
                              isStaff
                                ? 'comment-bubble-staff bg-sky-500/[0.06] border border-sky-500/20 text-gray-200'
                                : 'comment-bubble-user bg-white/[0.03] border border-white/10 text-gray-300'
                            }`}
                          >
                            {comment.content}
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>

                {/* Comment Input Composer */}
                <div className="p-3 border-t border-white/10 bg-white/[0.02] shrink-0 citezen-safe-bottom">
                  <form onSubmit={handleAddComment} className="relative">
                    <textarea
                      value={newComment}
                      onChange={(e) => setNewComment(e.target.value)}
                      placeholder="Write a message or reply..."
                      className="comment-input-box w-full bg-dark-900 border border-white/10 rounded-xl pl-3.5 pr-12 py-2.5 text-xs sm:text-sm text-white placeholder-gray-500 focus:outline-none focus:border-sky-500 focus:ring-2 focus:ring-sky-500/20 transition-all resize-none custom-scrollbar min-h-[64px] max-md:min-h-[56px]"
                      rows={2}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter' && !e.shiftKey) {
                          e.preventDefault();
                          handleAddComment(e);
                        }
                      }}
                    />

                    <button
                      type="submit"
                      disabled={!newComment.trim()}
                      aria-label="Send comment"
                      className="absolute right-2 bottom-2.5 p-2 rounded-xl bg-gradient-to-r from-blue-600 via-sky-600 to-cyan-500 hover:from-blue-500 hover:to-cyan-400 text-white shadow-md shadow-sky-500/25 disabled:opacity-40 transition-all active:scale-95 flex items-center justify-center touch-manipulation"
                    >
                      <SendIcon className="h-4 w-4" />
                    </button>
                  </form>
                  <div className="flex items-center justify-between text-[10px] text-gray-400 px-1 pt-1">
                    <span>Press <kbd className="px-1 py-0.2 rounded bg-white/5 border border-white/10 font-mono">Enter</kbd> to send</span>
                    <span><kbd className="px-1 py-0.2 rounded bg-white/5 border border-white/10 font-mono">Shift+Enter</kbd> for new line</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Forward Sheet Modal */}
            <AnimatePresence>
              {showForwardPanel && (
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
                    className="absolute inset-0 z-[71] flex flex-col justify-end sm:justify-center sm:items-center sm:p-4 pointer-events-none"
                  >
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
                      className="pointer-events-auto flex w-full max-h-[min(88dvh,560px)] flex-col overflow-hidden rounded-t-[1.35rem] border border-[var(--border-color)] bg-[var(--bg-secondary)] shadow-2xl mx-3 sm:mx-0 sm:w-full sm:max-w-md sm:rounded-2xl sm:max-h-[min(80vh,520px)]"
                    >
                      <motion.div
                        drag="y"
                        dragConstraints={{ top: 0, bottom: 0 }}
                        dragElastic={0.12}
                        onDragEnd={(_, info) => {
                          if (!isDesktopForward && info.offset.y > 80) {
                            setShowForwardPanel(false);
                          }
                        }}
                        className="flex shrink-0 justify-center pt-2 sm:hidden"
                      >
                        <span className="h-1 w-10 rounded-full bg-[var(--border-color)]" aria-hidden />
                      </motion.div>

                      <motion.div
                        drag={false}
                        className="flex items-center gap-3 p-4 sm:p-5 border-b border-[var(--border-color)] bg-[var(--glass-bg)] shrink-0 pt-[max(0.75rem,env(safe-area-inset-top,0px))] sm:pt-4"
                      >
                        <button
                          type="button"
                          onClick={() => setShowForwardPanel(false)}
                          className="min-h-[40px] min-w-[40px] flex items-center justify-center rounded-xl border border-[var(--border-color)] text-[var(--text-secondary)] hover:text-[var(--text-primary)] hover:bg-[var(--glass-bg-hover)] transition-colors touch-manipulation shrink-0"
                          aria-label="Back"
                        >
                          <ArrowLeftIcon className="h-5 w-5" />
                        </button>
                        <div className="min-w-0 flex-1">
                          <h2
                            id="forward-sheet-title"
                            className="text-base sm:text-lg font-semibold text-[var(--text-primary)] leading-tight"
                          >
                            Forward concern
                          </h2>
                          <p className="text-xs sm:text-sm text-[var(--text-muted)] mt-0.5 truncate">
                            From: {concern.department}
                          </p>
                        </div>
                        <button
                          type="button"
                          onClick={() => setShowForwardPanel(false)}
                          className="min-h-[40px] min-w-[40px] flex items-center justify-center rounded-xl text-[var(--text-muted)] hover:text-[var(--text-primary)] hover:bg-[var(--glass-bg-hover)] touch-manipulation sm:hidden"
                          aria-label="Close"
                        >
                          <XIcon className="h-5 w-5" />
                        </button>
                      </motion.div>

                      <p className="px-4 sm:px-5 pt-3 text-xs font-medium uppercase tracking-wider text-[var(--text-muted)] shrink-0">
                        Select department
                      </p>

                      <div className="flex-1 min-h-0 overflow-y-auto custom-scrollbar p-3 sm:p-4 space-y-2 pb-[max(1rem,env(safe-area-inset-bottom,0px))]">
                        {forwardTargets.map((dept, i) => (
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
                            className="w-full flex items-center gap-3 text-left min-h-[50px] px-4 py-3 rounded-xl border border-[var(--border-color)] bg-[var(--glass-bg)] text-sm text-[var(--text-secondary)] hover:text-[var(--text-primary)] hover:bg-sky-500/10 hover:border-sky-500/30 active:scale-[0.99] transition-all touch-manipulation shadow-sm"
                          >
                            <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-sky-500/10 text-sky-400 border border-sky-500/20">
                              <BuildingIcon className="h-4 w-4" />
                            </span>
                            <span className="font-semibold leading-snug flex-1">{dept}</span>
                            <ArrowRightIcon className="h-4 w-4 text-[var(--text-muted)] shrink-0" />
                          </motion.button>
                        ))}
                        {forwardTargets.length === 0 && (
                          <p className="text-center text-sm text-[var(--text-muted)] py-8 px-4">
                            No other departments available.
                          </p>
                        )}
                      </div>
                    </motion.div>
                  </motion.div>
                </>
              )}
            </AnimatePresence>
          </motion.div>
        </motion.div>
      ) : null}
    </AnimatePresence>,
    document.body
  );
}
