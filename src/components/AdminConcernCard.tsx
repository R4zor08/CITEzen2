import { motion } from 'framer-motion';
import { PriorityBadge, StatusBadge } from './StatusBadge';
import { CustomSelect, CustomSelectOption } from './CustomSelect';
import {
  SparklesIcon,
  CheckCircle2Icon,
  CalendarIcon,
  BuildingIcon,
  MessageSquareIcon,
  ChevronRightIcon
} from 'lucide-react';
import { toast } from 'sonner';

export interface AdminConcernCardProps {
  concern: any;
  formatDate: (dateString: string) => string;
  onSelectConcern: (id: string) => void;
  categoryDraft: Record<string, string>;
  setCategoryDraft: React.Dispatch<React.SetStateAction<Record<string, string>>>;
  categorySelectOptions: CustomSelectOption[];
  deptDraft: Record<string, string>;
  setDeptDraft: React.Dispatch<React.SetStateAction<Record<string, string>>>;
  departmentSelectOptions: CustomSelectOption[];
  assignDraft: Record<string, string>;
  setAssignDraft: React.Dispatch<React.SetStateAction<Record<string, string>>>;
  getStaffSelectOptions: (concernDept: string) => CustomSelectOption[];
  reassignStaffSelectOptions: CustomSelectOption[];
  isConfirming: Record<string, boolean>;
  handleConfirmConcern: (concern: any) => Promise<void>;
  assignConcern: (concernId: string, staffId: string | null) => Promise<any>;
  staffNameById: Map<string, string>;
}

export function AdminConcernCard({
  concern,
  formatDate,
  onSelectConcern,
  categoryDraft,
  setCategoryDraft,
  categorySelectOptions,
  deptDraft,
  setDeptDraft,
  departmentSelectOptions,
  assignDraft,
  setAssignDraft,
  getStaffSelectOptions,
  reassignStaffSelectOptions,
  isConfirming,
  handleConfirmConcern,
  assignConcern,
  staffNameById
}: AdminConcernCardProps) {
  const isAwaitingConfirmation =
    concern.adminReviewStatus === 'pending' || !concern.isConfirmed;

  return (
    <motion.div
      whileHover={{ y: -2 }}
      transition={{ duration: 0.2 }}
      className={`glass-panel rounded-2xl border overflow-hidden shadow-sm hover:shadow-md transition-all bg-white dark:bg-dark-800 ${
        concern.priority === 'urgent'
          ? 'border-red-300/80 dark:border-rose-500/30 hover:border-red-500/60'
          : 'border-slate-200/80 dark:border-white/10 hover:border-sky-500/40'
      }`}
    >
      <div className="flex flex-col lg:flex-row lg:items-stretch divide-y lg:divide-y-0 lg:divide-x divide-slate-200/80 dark:divide-white/10">
        {/* Left: Concern Details, Student Context & Visual SLA Stepper */}
        <div className="flex-1 min-w-0 p-5 sm:p-6 flex flex-col justify-between space-y-4">
          {/* Top Meta & Badges */}
          <div>
            <div className="flex items-center gap-2 mb-2.5 flex-wrap">
              <span className="text-xs font-mono font-medium text-slate-500 dark:text-gray-400 bg-slate-100 dark:bg-white/[0.04] px-2.5 py-0.5 rounded-md border border-slate-200 dark:border-white/5">
                {concern.id}
              </span>
              <span className="text-xs font-semibold text-sky-700 dark:text-sky-300 bg-sky-50 dark:bg-sky-500/10 px-2.5 py-0.5 rounded-full border border-sky-200 dark:border-sky-500/20">
                {concern.category}
              </span>
              {concern.subcategory && (
                <span className="text-xs text-slate-500 dark:text-gray-400 bg-slate-50 dark:bg-white/[0.02] px-2 py-0.5 rounded-md border border-slate-200/60 dark:border-white/5">
                  {concern.subcategory}
                </span>
              )}
              {isAwaitingConfirmation ? (
                <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-amber-700 dark:text-amber-300 bg-amber-50 dark:bg-amber-500/10 px-2.5 py-0.5 rounded-full border border-amber-200 dark:border-amber-500/20">
                  <SparklesIcon className="h-3 w-3 text-amber-500 animate-pulse" />
                  Awaiting Admin Confirmation
                </span>
              ) : (
                <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-emerald-700 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-500/10 px-2.5 py-0.5 rounded-full border border-emerald-200 dark:border-emerald-500/20">
                  <CheckCircle2Icon className="h-3 w-3 text-emerald-500" />
                  Confirmed & Routed
                </span>
              )}
              <div className="ml-auto flex items-center gap-2 shrink-0">
                <PriorityBadge priority={concern.priority} size="sm" />
                <StatusBadge status={concern.status} size="sm" />
              </div>
            </div>

            {/* Title */}
            <h3
              onClick={() => onSelectConcern(concern.id)}
              className="text-base sm:text-lg font-bold text-slate-900 dark:text-white cursor-pointer hover:text-sky-600 dark:hover:text-sky-400 transition-colors leading-snug"
            >
              {concern.title}
            </h3>

            {/* Description */}
            <p className="text-xs sm:text-sm text-slate-600 dark:text-gray-300 line-clamp-3 mt-2 leading-relaxed">
              {concern.description}
            </p>
          </div>

          {/* Middle Section: Student Meta Bar + Visual SLA Lifecycle Stepper */}
          <div className="space-y-3 my-1">
            {/* Student & Submission Details Card */}
            <div className="p-3 sm:p-3.5 rounded-xl bg-slate-50/90 dark:bg-white/[0.03] border border-slate-200/70 dark:border-white/5 flex flex-wrap items-center justify-between gap-3 text-xs">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-full bg-sky-100 dark:bg-sky-500/20 text-sky-700 dark:text-sky-300 font-bold flex items-center justify-center text-xs shrink-0 border border-sky-200/70 dark:border-sky-500/30">
                  {(concern.studentName || 'S').charAt(0)}
                </div>
                <div>
                  <div className="font-bold text-slate-900 dark:text-white">
                    {concern.studentName || 'Student'}
                  </div>
                  <div className="text-[11px] text-slate-500 dark:text-gray-400 flex items-center gap-2">
                    <span>Student Submitter</span>
                    <span>•</span>
                    <span className="text-slate-600 dark:text-gray-300 font-medium">
                      {concern.department || 'General'}
                    </span>
                  </div>
                </div>
              </div>

              <div className="flex items-center gap-4 text-[11px] text-slate-500 dark:text-gray-400">
                <div className="flex items-center gap-1.5">
                  <CalendarIcon className="h-3.5 w-3.5 text-slate-400" />
                  <span>{formatDate(concern.createdAt)}</span>
                </div>
                <div className="flex items-center gap-1.5">
                  <BuildingIcon className="h-3.5 w-3.5 text-slate-400" />
                  <span className="font-medium text-slate-700 dark:text-gray-300">
                    {concern.department}
                  </span>
                </div>
              </div>
            </div>

            {/* Intake & Routing Lifecycle Stepper */}
            <div className="p-3 sm:p-3.5 rounded-xl bg-slate-50/60 dark:bg-dark-900/40 border border-slate-200/60 dark:border-white/5">
              <div className="flex items-center justify-between mb-2">
                <span className="text-[10px] font-bold uppercase tracking-wider text-slate-500 dark:text-gray-400">
                  Routing & SLA Lifecycle
                </span>
                <span className="text-[11px] font-semibold text-sky-600 dark:text-sky-400">
                  {concern.status === 'resolved'
                    ? 'Resolution Completed'
                    : concern.status === 'rejected'
                    ? 'Ticket Closed / Rejected'
                    : concern.isConfirmed
                    ? 'Assigned to Staff'
                    : 'Intake Triaged (Needs Review)'}
                </span>
              </div>

              <div className="grid grid-cols-4 gap-2 text-[10px]">
                {/* Step 1: Intake Logged */}
                <div className="flex flex-col gap-1">
                  <div className="h-1.5 rounded-full bg-emerald-500" />
                  <span className="font-semibold text-emerald-700 dark:text-emerald-400 truncate">
                    1. Logged
                  </span>
                </div>

                {/* Step 2: AI Triage */}
                <div className="flex flex-col gap-1">
                  <div className="h-1.5 rounded-full bg-emerald-500" />
                  <span className="font-semibold text-emerald-700 dark:text-emerald-400 truncate">
                    2. AI Triaged
                  </span>
                </div>

                {/* Step 3: Admin Routing */}
                <div className="flex flex-col gap-1">
                  <div
                    className={`h-1.5 rounded-full ${
                      concern.isConfirmed
                        ? 'bg-emerald-500'
                        : 'bg-amber-500 animate-pulse'
                    }`}
                  />
                  <span
                    className={`font-semibold truncate ${
                      concern.isConfirmed
                        ? 'text-emerald-700 dark:text-emerald-400'
                        : 'text-amber-700 dark:text-amber-400'
                    }`}
                  >
                    3. Routing
                  </span>
                </div>

                {/* Step 4: Resolution */}
                <div className="flex flex-col gap-1">
                  <div
                    className={`h-1.5 rounded-full ${
                      concern.status === 'resolved'
                        ? 'bg-emerald-500'
                        : 'bg-slate-200 dark:bg-white/10'
                    }`}
                  />
                  <span
                    className={`font-semibold truncate ${
                      concern.status === 'resolved'
                        ? 'text-emerald-700 dark:text-emerald-400'
                        : 'text-slate-400 dark:text-gray-500'
                    }`}
                  >
                    4. Resolution
                  </span>
                </div>
              </div>
            </div>
          </div>

          {/* Bottom Action Footer */}
          <div className="pt-3 border-t border-slate-200/80 dark:border-white/5 flex items-center justify-between gap-3">
            <div className="flex items-center gap-2 text-xs text-slate-500 dark:text-gray-400">
              <span className="inline-flex items-center gap-1">
                <MessageSquareIcon className="h-3.5 w-3.5 text-slate-400" />
                <span>Thread Active</span>
              </span>
            </div>

            <button
              onClick={() => onSelectConcern(concern.id)}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-sky-50 hover:bg-sky-100 dark:bg-sky-500/10 dark:hover:bg-sky-500/20 text-sky-700 dark:text-sky-300 font-semibold text-xs border border-sky-200/70 dark:border-sky-500/20 transition-all active:scale-95 group"
            >
              <span>Open Full Details & Thread</span>
              <ChevronRightIcon className="h-3.5 w-3.5 group-hover:translate-x-0.5 transition-transform" />
            </button>
          </div>
        </div>

        {/* Right: AI Classification & Routing Panel */}
        <div className="lg:w-[380px] shrink-0 p-5 sm:p-6 bg-slate-50/60 dark:bg-dark-900/40 flex flex-col justify-between space-y-4">
          {isAwaitingConfirmation ? (
            <div className="space-y-3.5">
              {/* Badges */}
              <div className="flex items-center justify-between gap-2">
                <div className="flex items-center gap-1.5 text-xs font-semibold text-amber-800 dark:text-amber-300 bg-amber-50 dark:bg-amber-500/10 px-2.5 py-1 rounded-full border border-amber-200/80 dark:border-amber-500/25">
                  <SparklesIcon className="h-3.5 w-3.5 text-amber-600 dark:text-amber-400 animate-pulse" />
                  <span>AI Classification</span>
                </div>
                <span className="text-[10px] font-semibold text-sky-700 dark:text-sky-300 bg-sky-50 dark:bg-sky-500/15 px-2 py-0.5 rounded-full border border-sky-200 dark:border-sky-500/25">
                  AI Confidence: {Math.round(((concern.aiClassification?.confidence ?? 0.88) * 100))}%
                </span>
              </div>

              {/* Reasoning */}
              {concern.aiClassification?.reasoning && (
                <div className="text-[11px] text-sky-950 dark:text-sky-200 bg-sky-50/80 dark:bg-sky-500/10 p-2.5 rounded-xl border border-sky-200 dark:border-sky-500/20 leading-relaxed">
                  <span className="font-bold text-sky-800 dark:text-sky-300 block mb-0.5">
                    AI Reasoning
                  </span>
                  {concern.aiClassification.reasoning}
                </div>
              )}

              {/* Recommendations summary */}
              <div className="grid grid-cols-2 gap-2 text-[11px]">
                <div className="bg-slate-50 dark:bg-white/[0.04] p-2.5 rounded-xl border border-slate-200/70 dark:border-white/5">
                  <span className="text-[10px] text-slate-500 dark:text-gray-400 block font-medium">
                    Recommended Dept
                  </span>
                  <span className="text-sky-700 dark:text-cyan-300 font-bold truncate block mt-0.5">
                    {concern.aiClassification?.department || concern.department}
                  </span>
                </div>
                <div className="bg-slate-50 dark:bg-white/[0.04] p-2.5 rounded-xl border border-slate-200/70 dark:border-white/5">
                  <span className="text-[10px] text-slate-500 dark:text-gray-400 block font-medium">
                    Recommended Staff
                  </span>
                  <span className="text-slate-900 dark:text-white font-bold truncate block mt-0.5">
                    {concern.suggestedStaffName || 'None recommended'}
                  </span>
                </div>
              </div>

              {/* Category selector */}
              <div className="space-y-1">
                <label className="text-[11px] text-slate-600 dark:text-gray-400 font-semibold">
                  Category
                </label>
                <CustomSelect
                  value={categoryDraft[concern.id] ?? concern.category}
                  onChange={(val) =>
                    setCategoryDraft((prev) => ({ ...prev, [concern.id]: val }))
                  }
                  options={categorySelectOptions}
                  size="sm"
                  className="w-full"
                />
              </div>

              {/* Department selector */}
              <div className="space-y-1">
                <label className="text-[11px] text-slate-600 dark:text-gray-400 font-semibold">
                  Department
                </label>
                <CustomSelect
                  value={deptDraft[concern.id] ?? concern.department}
                  onChange={(val) =>
                    setDeptDraft((prev) => ({ ...prev, [concern.id]: val }))
                  }
                  options={departmentSelectOptions}
                  size="sm"
                  className="w-full"
                />
              </div>

              {/* Admin Final Assignment Section */}
              <div className="pt-2 border-t border-slate-200/80 dark:border-white/10 space-y-2">
                <div className="text-xs font-bold text-slate-900 dark:text-white flex items-center justify-between">
                  <span>Admin Final Assignment</span>
                  <span className="text-[10px] text-amber-600 dark:text-amber-400 font-semibold">
                    Review & Confirm
                  </span>
                </div>

                {/* Staff assignment selector */}
                <div className="space-y-1">
                  <div className="flex items-center justify-between text-[11px]">
                    <span className="text-slate-600 dark:text-gray-400 font-medium">
                      Assign to Staff
                    </span>
                    {concern.suggestedStaffName && (
                      <span className="text-sky-600 dark:text-cyan-400 font-semibold truncate max-w-[150px]">
                        Rec: {concern.suggestedStaffName}
                      </span>
                    )}
                  </div>
                  <CustomSelect
                    value={assignDraft[concern.id] ?? concern.suggestedStaffId ?? ''}
                    onChange={(val) =>
                      setAssignDraft((prev) => ({ ...prev, [concern.id]: val }))
                    }
                    options={getStaffSelectOptions(
                      deptDraft[concern.id] ?? concern.department
                    )}
                    size="sm"
                    className="w-full"
                    placeholder="Select staff member…"
                  />
                </div>

                <button
                  type="button"
                  disabled={isConfirming[concern.id]}
                  onClick={() => handleConfirmConcern(concern)}
                  className="w-full mt-2 py-2.5 px-3 rounded-xl bg-gradient-to-r from-blue-600 via-sky-600 to-cyan-500 hover:from-blue-500 hover:to-cyan-400 text-white text-xs font-bold flex items-center justify-center gap-1.5 shadow-md shadow-sky-500/20 transition-all disabled:opacity-50 touch-manipulation active:scale-[0.98]"
                >
                  {isConfirming[concern.id] ? (
                    <>
                      <div className="h-3.5 w-3.5 rounded-full border-2 border-white/30 border-t-white animate-spin" />
                      <span>Confirming Final Assignment...</span>
                    </>
                  ) : (
                    <>
                      <CheckCircle2Icon className="h-4 w-4 text-white" />
                      <span>Confirm Final Assignment</span>
                    </>
                  )}
                </button>
              </div>
            </div>
          ) : (
            /* Confirmed state */
            <div className="space-y-3.5">
              <div className="flex items-center justify-between gap-2">
                <span className="inline-flex items-center gap-1.5 text-xs font-semibold text-emerald-700 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-500/10 px-2.5 py-1 rounded-full border border-emerald-200 dark:border-emerald-500/20">
                  <CheckCircle2Icon className="h-3.5 w-3.5" />
                  Assignment Confirmed
                </span>
                <span className="text-[11px] text-slate-500 dark:text-gray-400 truncate">
                  {concern.department}
                </span>
              </div>

              <div className="p-3 rounded-xl bg-slate-50 dark:bg-white/[0.03] border border-slate-200/80 dark:border-white/10 space-y-1">
                <span className="text-[10px] text-slate-500 dark:text-gray-400 uppercase tracking-wide font-medium">
                  Assigned Staff
                </span>
                <div className="text-xs font-bold text-slate-900 dark:text-white truncate">
                  {staffNameById.get(concern.assignedTo) || 'Assigned to Staff'}
                </div>
              </div>

              <div className="space-y-1.5">
                <label className="text-[11px] text-slate-600 dark:text-gray-400 font-semibold">
                  Reassign to staff
                </label>
                <div className="flex items-center gap-2">
                  <CustomSelect
                    value={assignDraft[concern.id] ?? concern.assignedTo ?? ''}
                    onChange={(val) =>
                      setAssignDraft((prev) => ({
                        ...prev,
                        [concern.id]: val
                      }))
                    }
                    options={reassignStaffSelectOptions}
                    size="sm"
                    className="flex-1 min-w-0"
                    placeholder="Select staff…"
                  />
                  <button
                    type="button"
                    onClick={async () => {
                      const staffId = assignDraft[concern.id];
                      if (!staffId) {
                        toast.error('Select a staff member first.');
                        return;
                      }
                      try {
                        await assignConcern(concern.id, staffId);
                        toast.success('Reassigned successfully.');
                      } catch {
                        /* useConcerns already toasts */
                      }
                    }}
                    className="px-3 py-1.5 rounded-xl bg-sky-600 text-white text-xs font-semibold hover:bg-sky-500 transition-colors shadow-sm active:scale-95"
                  >
                    Save
                  </button>
                </div>
              </div>

              {concern.assignedTo && (
                <button
                  type="button"
                  onClick={async () => {
                    try {
                      await assignConcern(concern.id, null);
                      setAssignDraft((prev) => {
                        const next = { ...prev };
                        delete next[concern.id];
                        return next;
                      });
                      toast.success('Unassigned.');
                    } catch {
                      /* useConcerns already toasts */
                    }
                  }}
                  className="w-full px-3 py-1.5 rounded-xl bg-slate-100 hover:bg-slate-200 dark:bg-white/5 dark:hover:bg-white/10 text-slate-600 dark:text-gray-400 hover:text-slate-900 dark:hover:text-white text-xs font-medium transition-colors"
                >
                  Clear assignment
                </button>
              )}
            </div>
          )}
        </div>
      </div>
    </motion.div>
  );
}
