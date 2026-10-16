import React, { useState } from 'react';
import { toast } from 'sonner';
import { User, Concern, ConcernAttachment } from '../types';
import { FileUploadZone } from './FileUploadZone';
import {
  CheckCircle2Icon,
  ShieldCheckIcon,
  SendIcon,
  ClockIcon,
  BookmarkIcon,
  CheckIcon
} from 'lucide-react';

interface ConcernFormProps {
  user: User;
  onSubmit: (concern: Partial<Concern>) => void | Promise<void>;
  onCancel: () => void;
}

export function ConcernForm({ user, onSubmit, onCancel }: ConcernFormProps) {
  const DRAFT_KEY = `citezen_draft_${user.id}`;

  const [title, setTitle] = useState(() => {
    try {
      const saved = localStorage.getItem(DRAFT_KEY);
      if (saved) {
        const parsed = JSON.parse(saved);
        return parsed.title || '';
      }
    } catch {}
    return '';
  });

  const [description, setDescription] = useState(() => {
    try {
      const saved = localStorage.getItem(DRAFT_KEY);
      if (saved) {
        const parsed = JSON.parse(saved);
        return parsed.description || '';
      }
    } catch {}
    return '';
  });

  const [priority, setPriority] = useState<'low' | 'medium' | 'high' | 'urgent'>(() => {
    try {
      const saved = localStorage.getItem(DRAFT_KEY);
      if (saved) {
        const parsed = JSON.parse(saved);
        if (parsed.priority) return parsed.priority;
      }
    } catch {}
    return 'medium';
  });

  const [attachments, setAttachments] = useState<ConcernAttachment[]>([]);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [draftSavedMessage, setDraftSavedMessage] = useState(false);

  const handleSaveDraft = () => {
    try {
      localStorage.setItem(
        DRAFT_KEY,
        JSON.stringify({ title, description, priority, updatedAt: new Date().toISOString() })
      );
      setDraftSavedMessage(true);
      toast.success('Draft saved successfully', {
        description: 'Your progress is stored locally on this device.'
      });
      setTimeout(() => setDraftSavedMessage(false), 3000);
    } catch {
      toast.error('Could not save draft');
    }
  };

  const handleClearDraft = () => {
    try {
      localStorage.removeItem(DRAFT_KEY);
    } catch {}
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!title.trim()) {
      toast.error('Please enter a concern title.');
      return;
    }

    if (!description.trim()) {
      toast.error('Please provide a detailed description of your concern.');
      return;
    }

    // Check if any attached image files failed verification
    const unverifiedFiles = attachments.filter((file) => file.verified === false);
    if (unverifiedFiles.length > 0) {
      toast.error(
        'Please remove or replace attachments that failed authenticity verification before submitting.'
      );
      return;
    }

    setIsSubmitting(true);
    try {
      await onSubmit({
        title: title.trim(),
        description: description.trim(),
        priority,
        attachments: attachments.length > 0 ? attachments : undefined
      });
      handleClearDraft();
    } finally {
      setIsSubmitting(false);
    }
  };

  const priorityOptions = [
    {
      id: 'low' as const,
      label: 'Routine',
      badge: 'Low',
      sla: '3–5 Business Days',
      desc: 'General inquiry, feedback, or non-urgent request',
      dot: 'bg-emerald-400',
      activeBorder: 'border-emerald-500',
      activeBg: 'bg-emerald-500/10 dark:bg-emerald-500/15',
      activeText: 'text-emerald-700 dark:text-emerald-300',
      activeShadow: 'shadow-emerald-500/10',
      selectedClass: 'priority-card--selected-low'
    },
    {
      id: 'medium' as const,
      label: 'Standard',
      badge: 'Medium',
      sla: '2–3 Business Days',
      desc: 'Course issues, grade inquiries, and administrative requests',
      dot: 'bg-sky-400',
      activeBorder: 'border-sky-500',
      activeBg: 'bg-sky-500/10 dark:bg-sky-500/15',
      activeText: 'text-sky-700 dark:text-sky-300',
      activeShadow: 'shadow-sky-500/10',
      selectedClass: 'priority-card--selected-medium'
    },
    {
      id: 'high' as const,
      label: 'Priority',
      badge: 'High',
      sla: '24–48 Hours',
      desc: 'Time-sensitive exam, enrollment, or clearance blockers',
      dot: 'bg-amber-400',
      activeBorder: 'border-amber-500',
      activeBg: 'bg-amber-500/10 dark:bg-amber-500/15',
      activeText: 'text-amber-700 dark:text-amber-300',
      activeShadow: 'shadow-amber-500/10',
      selectedClass: 'priority-card--selected-high'
    },
    {
      id: 'urgent' as const,
      label: 'Critical',
      badge: 'Urgent',
      sla: 'Immediate Escalation',
      desc: 'Facility hazards, severe safety or immediate academic crisis',
      dot: 'bg-rose-400',
      activeBorder: 'border-rose-500',
      activeBg: 'bg-rose-500/10 dark:bg-rose-500/15',
      activeText: 'text-rose-700 dark:text-rose-300',
      activeShadow: 'shadow-rose-500/10',
      selectedClass: 'priority-card--selected-urgent'
    }
  ];

  return (
    <div className="glass-panel p-5 sm:p-7 md:p-9 rounded-2xl sm:rounded-3xl border border-slate-200/90 dark:border-white/10 bg-white/95 dark:bg-dark-900/95 shadow-xl shadow-slate-900/5 dark:shadow-2xl animate-fade-in w-full transition-all">
      {/* Header */}
      <div className="mb-6 sm:mb-7 pb-5 border-b border-slate-200/90 dark:border-white/10 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 dark:text-white tracking-tight">
            Submit a Concern
          </h1>
          <p className="form-helper text-xs sm:text-sm text-slate-500 dark:text-gray-400 mt-1 leading-relaxed">
            Provide the details of your issue or request below. Your concern will be reviewed and routed to the proper department.
          </p>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Compact Student Identity Strip */}
        <div className="submit-identity-strip p-3.5 sm:p-4 rounded-2xl flex flex-col sm:flex-row sm:items-center justify-between gap-3 border border-slate-200/80 dark:border-white/10 bg-slate-50/70 dark:bg-white/[0.03]">
          <div className="flex items-center gap-3 min-w-0">
            {/* Student Avatar */}
            {user.profilePicture ? (
              <img
                src={user.profilePicture}
                alt={user.name}
                className="h-10 w-10 rounded-full object-cover shrink-0 shadow-md shadow-sky-500/15 ring-2 ring-slate-200 dark:ring-white/10"
              />
            ) : (
              <div className="h-10 w-10 rounded-full bg-gradient-to-br from-blue-600 via-sky-600 to-cyan-500 text-white font-bold text-xs uppercase flex items-center justify-center shrink-0 shadow-md shadow-sky-500/15">
                {user.name
                  .split(' ')
                  .map((n) => n[0])
                  .slice(0, 2)
                  .join('')}
              </div>
            )}

            <div className="min-w-0">
              <div className="flex flex-wrap items-center gap-x-2.5 gap-y-0.5">
                <span className="student-name text-sm font-bold text-slate-900 dark:text-white tracking-tight truncate">
                  {user.name}
                </span>
                <span className="student-dept-badge text-[11px] font-semibold px-2 py-0.5 rounded-full bg-sky-50 dark:bg-sky-500/10 text-sky-700 dark:text-sky-400 border border-sky-200 dark:border-sky-500/20">
                  {user.course || user.department || 'BSIT / CITE'}
                </span>
              </div>
              <div className="flex flex-wrap items-center gap-x-2 text-xs text-slate-500 dark:text-gray-400 mt-0.5">
                <span className="student-id font-mono">ID: {user.studentId || '2023-01172'}</span>
                <span className="text-slate-400 dark:text-gray-500 hidden sm:inline">•</span>
                <span className="student-email truncate max-w-[200px] sm:max-w-xs">{user.email}</span>
              </div>
            </div>
          </div>

          <div className="inline-flex items-center gap-1.5 text-xs font-semibold text-emerald-700 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-500/10 px-3 py-1 rounded-full border border-emerald-200 dark:border-emerald-500/20 shrink-0 self-start sm:self-center">
            <span className="h-1.5 w-1.5 rounded-full bg-emerald-500 dark:bg-emerald-400 animate-pulse" />
            Verified Student
          </div>
        </div>

        {/* Concern Title */}
        <div className="space-y-1.5">
          <div className="flex items-center justify-between">
            <label className="form-label text-sm font-bold text-slate-900 dark:text-white flex items-center gap-1" htmlFor="concern-title">
              <span>What can we help you with?</span>
              <span className="text-rose-500">*</span>
            </label>
            <span className="text-xs text-slate-400 dark:text-gray-400 font-mono tabular-nums">
              {title.length}/100
            </span>
          </div>
          <p className="form-helper text-xs text-slate-500 dark:text-gray-400">
            Provide a clear, descriptive headline so the assigned office understands your issue instantly.
          </p>
          <div className="relative">
            <input
              id="concern-title"
              type="text"
              name="title"
              value={title}
              maxLength={100}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="e.g., Missing grade in CS 201 Midterm, or Broken Air Conditioner in Room 304..."
              required
              className="form-input-field w-full px-4 py-3 rounded-xl bg-white dark:bg-dark-800/80 border border-slate-200 dark:border-white/10 text-slate-900 dark:text-white placeholder-slate-400 dark:placeholder-gray-500 text-sm focus:outline-none focus:border-sky-500 focus:ring-2 focus:ring-sky-500/20 transition-all shadow-xs"
            />
          </div>
        </div>

        {/* Detailed Description */}
        <div className="space-y-1.5">
          <div className="flex items-center justify-between">
            <label className="form-label text-sm font-bold text-slate-900 dark:text-white flex items-center gap-1" htmlFor="concern-desc">
              <span>Detailed Description & Context</span>
              <span className="text-rose-500">*</span>
            </label>
            <span className="text-xs text-slate-400 dark:text-gray-400 font-mono tabular-nums">
              {description.length} characters
            </span>
          </div>
          <p className="form-helper text-xs text-slate-500 dark:text-gray-400">
            Share all specific details (course codes, professor or staff names, room locations, and requested outcome) so we can route and resolve this without delays.
          </p>
          <textarea
            id="concern-desc"
            name="description"
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            required
            rows={5}
            className="form-input-field w-full px-4 py-3 rounded-xl bg-white dark:bg-dark-800/80 border border-slate-200 dark:border-white/10 text-slate-900 dark:text-white placeholder-slate-400 dark:placeholder-gray-500 text-sm leading-relaxed focus:outline-none focus:border-sky-500 focus:ring-2 focus:ring-sky-500/20 transition-all shadow-xs custom-scrollbar"
            placeholder="Describe what occurred, who you spoke with, when it took place, and how the department can assist you..."
          />
        </div>

        {/* Urgency & Turnaround Time */}
        <div className="space-y-2 pt-1">
          <div className="flex items-center justify-between">
            <div>
              <label className="form-label text-sm font-bold text-slate-900 dark:text-white block">
                Urgency & Turnaround Expectations
              </label>
              <p className="form-helper text-xs text-slate-500 dark:text-gray-400 mt-0.5">
                Choose the priority that best reflects how time-sensitive your inquiry is.
              </p>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-2.5">
            {priorityOptions.map((p) => {
              const isSelected = priority === p.id;

              return (
                <button
                  key={p.id}
                  type="button"
                  onClick={() => setPriority(p.id)}
                  className={`priority-card p-3.5 rounded-xl border text-left flex flex-col justify-between min-h-[84px] cursor-pointer touch-manipulation transition-all active:scale-[0.98] ${
                    isSelected
                      ? `${p.selectedClass} ${p.activeBorder} ${p.activeBg} ${p.activeText} ${p.activeShadow} shadow-md`
                      : 'priority-card--unselected bg-white dark:bg-white/[0.02] border-slate-200 dark:border-white/10 text-slate-600 dark:text-gray-400 hover:text-slate-900 dark:hover:text-gray-200 hover:border-slate-300 dark:hover:border-white/20 hover:bg-slate-50 dark:hover:bg-white/[0.04] shadow-xs'
                  }`}
                >
                  <div className="flex items-center justify-between w-full mb-1">
                    <span className="font-bold text-sm flex items-center gap-1.5">
                      <span
                        className={`h-2 w-2 rounded-full ${p.dot} ${
                          isSelected ? 'animate-pulse ring-2 ring-current/30' : 'opacity-60'
                        }`}
                      />
                      <span>{p.label}</span>
                      <span className="text-[11px] font-normal opacity-75 font-mono">({p.badge})</span>
                    </span>
                    {isSelected ? (
                      <CheckCircle2Icon className="h-4 w-4 shrink-0 text-current" />
                    ) : (
                      <span className="h-4 w-4 rounded-full border border-slate-300 dark:border-gray-500 opacity-60 shrink-0" />
                    )}
                  </div>
                  <div className="mt-1 space-y-0.5">
                    <div className="text-[11px] font-semibold text-current opacity-90 flex items-center gap-1">
                      <ClockIcon className="h-3 w-3 shrink-0 opacity-75" />
                      <span>{p.sla}</span>
                    </div>
                    <p className="text-[11px] opacity-75 leading-tight line-clamp-1">{p.desc}</p>
                  </div>
                </button>
              );
            })}
          </div>
        </div>

        {/* Supporting Documents & Verification */}
        <div className="space-y-2 pt-1">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
            <div>
              <label className="form-label text-sm font-bold text-slate-900 dark:text-white block">
                Supporting Documents & Evidence <span className="text-slate-400 dark:text-gray-400 text-xs font-normal">(Optional)</span>
              </label>
              <p className="form-helper text-xs text-slate-500 dark:text-gray-400 mt-0.5">
                Attach official forms, grade slips, medical certificates, or photos (PNG, JPG, PDF up to 10MB each).
              </p>
            </div>
            <span className="inline-flex items-center gap-1 text-[11px] font-medium text-cyan-700 dark:text-cyan-400 bg-cyan-50 dark:bg-cyan-500/10 px-2.5 py-1 rounded-full border border-cyan-200 dark:border-cyan-500/20 shrink-0 self-start sm:self-auto">
              <ShieldCheckIcon className="h-3.5 w-3.5" /> AI Authenticity Check Active
            </span>
          </div>
          <FileUploadZone
            fieldName="Supporting Documents"
            fieldLabel="Supporting Documents"
            files={attachments}
            onChange={setAttachments}
            disabled={isSubmitting}
            requireAuthenticityVerification={true}
          />
        </div>

        {/* Actions Toolbar */}
        <div className="flex flex-col-reverse sm:flex-row items-stretch sm:items-center justify-between gap-3 pt-6 border-t border-slate-200/90 dark:border-white/10 mt-8">
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={handleSaveDraft}
              disabled={isSubmitting}
              className="px-4 py-2.5 rounded-xl text-xs sm:text-sm font-medium text-slate-600 dark:text-gray-400 hover:text-slate-900 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-white/5 border border-slate-200 dark:border-white/10 transition-colors flex items-center justify-center gap-1.5 touch-manipulation disabled:opacity-50"
            >
              <BookmarkIcon className="h-4 w-4" />
              <span>Save Draft</span>
            </button>
            {draftSavedMessage && (
              <span className="text-xs text-emerald-600 dark:text-emerald-400 flex items-center gap-1 animate-fade-in font-medium">
                <CheckIcon className="h-3.5 w-3.5" /> Draft saved
              </span>
            )}
          </div>

          <div className="flex items-center justify-end gap-3">
            <button
              type="button"
              onClick={onCancel}
              disabled={isSubmitting}
              className="min-h-[44px] px-5 py-2.5 rounded-xl text-sm font-medium text-slate-600 dark:text-gray-400 hover:text-slate-900 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-white/5 transition-colors text-center border border-slate-200 dark:border-white/10 sm:border-transparent touch-manipulation disabled:opacity-50"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className="min-h-[44px] flex items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-blue-600 via-sky-600 to-cyan-500 hover:from-blue-500 hover:to-cyan-400 px-7 py-2.5 text-sm font-semibold text-white shadow-xl shadow-sky-500/25 transition-all active:scale-[0.98] disabled:opacity-70 touch-manipulation"
            >
              {isSubmitting ? (
                <>
                  <div className="h-4 w-4 rounded-full border-2 border-white/30 border-t-white animate-spin" />
                  <span>Submitting Concern...</span>
                </>
              ) : (
                <>
                  <SendIcon className="h-4 w-4" />
                  <span>Submit Concern</span>
                </>
              )}
            </button>
          </div>
        </div>
      </form>
    </div>
  );
}