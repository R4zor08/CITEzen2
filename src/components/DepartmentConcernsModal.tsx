import { useEffect, useMemo, useState } from 'react';
import { createPortal } from 'react-dom';
import { motion, AnimatePresence } from 'framer-motion';
import {
  XIcon,
  BuildingIcon,
  SearchIcon,
  FilterIcon,
  ClockIcon,
  AlertCircleIcon,
  CheckCircle2Icon,
  XCircleIcon,
  AlertTriangleIcon,
  SparklesIcon,
  FolderOpenIcon
} from 'lucide-react';
import { AdminConcernCard } from './AdminConcernCard';
import { CustomSelect, CustomSelectOption } from './CustomSelect';
import { ConcernStatus } from '../types';

export interface DepartmentConcernsModalProps {
  isOpen: boolean;
  department: string | null;
  onClose: () => void;
  concerns: any[];
  onSelectConcern: (id: string) => void;
  formatDate: (dateString: string) => string;
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

const deptModalThemes: Record<
  string,
  { gradient: string; glow: string; text: string; badgeBorder: string }
> = {
  'Academic Affairs': {
    gradient: 'from-blue-600 to-indigo-600',
    glow: 'bg-blue-500/15',
    text: 'text-blue-600 dark:text-blue-400',
    badgeBorder: 'border-blue-200 dark:border-blue-500/30'
  },
  'Registrar': {
    gradient: 'from-emerald-600 to-teal-600',
    glow: 'bg-emerald-500/15',
    text: 'text-emerald-600 dark:text-emerald-400',
    badgeBorder: 'border-emerald-200 dark:border-emerald-500/30'
  },
  'Maintenance': {
    gradient: 'from-amber-600 to-orange-600',
    glow: 'bg-amber-500/15',
    text: 'text-amber-600 dark:text-amber-400',
    badgeBorder: 'border-amber-200 dark:border-amber-500/30'
  },
  'Student Affairs': {
    gradient: 'from-purple-600 to-violet-600',
    glow: 'bg-purple-500/15',
    text: 'text-purple-600 dark:text-purple-400',
    badgeBorder: 'border-purple-200 dark:border-purple-500/30'
  },
  'Administration': {
    gradient: 'from-sky-600 to-blue-600',
    glow: 'bg-sky-500/15',
    text: 'text-sky-600 dark:text-sky-400',
    badgeBorder: 'border-sky-200 dark:border-sky-500/30'
  },
  'IT Support': {
    gradient: 'from-cyan-600 to-teal-600',
    glow: 'bg-cyan-500/15',
    text: 'text-cyan-600 dark:text-cyan-400',
    badgeBorder: 'border-cyan-200 dark:border-cyan-500/30'
  },
  'Finance': {
    gradient: 'from-rose-600 to-pink-600',
    glow: 'bg-rose-500/15',
    text: 'text-rose-600 dark:text-rose-400',
    badgeBorder: 'border-rose-200 dark:border-rose-500/30'
  }
};

const defaultModalTheme = {
  gradient: 'from-sky-500 to-blue-600',
  glow: 'bg-sky-500/15',
  text: 'text-sky-600 dark:text-sky-400',
  badgeBorder: 'border-sky-200 dark:border-sky-500/30'
};

export function DepartmentConcernsModal({
  isOpen,
  department,
  onClose,
  concerns,
  onSelectConcern,
  formatDate,
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
}: DepartmentConcernsModalProps) {
  const [searchQuery, setSearchQuery] = useState('');
  const [filterStatus, setFilterStatus] = useState<
    ConcernStatus | 'all' | 'pending-review' | 'urgent'
  >('all');

  // Reset internal filters when department changes
  useEffect(() => {
    setSearchQuery('');
    setFilterStatus('all');
  }, [department]);

  // Handle ESC key to close
  useEffect(() => {
    if (!isOpen) return;
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        onClose();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  // All concerns strictly belonging to this department
  const departmentConcerns = useMemo(() => {
    if (!department) return [];
    return concerns.filter((c: any) => c.department === department);
  }, [concerns, department]);

  const activeTheme = (department && deptModalThemes[department]) || defaultModalTheme;

  // Department specific stats
  const deptStats = useMemo(() => {
    const total = departmentConcerns.length;
    const pendingReview = departmentConcerns.filter(
      (c: any) => c.adminReviewStatus === 'pending' || !c.isConfirmed
    ).length;
    const resolved = departmentConcerns.filter((c: any) => c.status === 'resolved').length;
    const inProgress = departmentConcerns.filter((c: any) => c.status === 'in-progress').length;
    const urgent = departmentConcerns.filter(
      (c: any) => c.priority === 'urgent' || c.priority === 'high'
    ).length;

    return { total, pendingReview, resolved, inProgress, urgent };
  }, [departmentConcerns]);

  // Filtered concerns based on modal search and status
  const filteredConcerns = useMemo(() => {
    return departmentConcerns.filter((c: any) => {
      const matchesStatus =
        filterStatus === 'all'
          ? true
          : filterStatus === 'pending-review'
          ? c.adminReviewStatus === 'pending' || !c.isConfirmed
          : filterStatus === 'urgent'
          ? c.priority === 'urgent' || c.priority === 'high'
          : c.status === filterStatus;

      const q = searchQuery.toLowerCase().trim();
      const matchesSearch =
        !q ||
        (c.title || '').toLowerCase().includes(q) ||
        (c.id || '').toLowerCase().includes(q) ||
        (c.studentName || '').toLowerCase().includes(q) ||
        (c.description || '').toLowerCase().includes(q) ||
        ((c.category || '') && c.category.toLowerCase().includes(q)) ||
        ((c.subcategory || '') && c.subcategory.toLowerCase().includes(q));

      return matchesStatus && matchesSearch;
    });
  }, [departmentConcerns, filterStatus, searchQuery]);

  // Status filter dropdown options
  const statusFilterOptions: CustomSelectOption[] = useMemo(() => [
    {
      value: 'all',
      label: 'All Department Concerns',
      icon: <FilterIcon className="h-4 w-4 text-slate-400" />
    },
    ...(deptStats.pendingReview > 0
      ? [
          {
            value: 'pending-review',
            label: 'Needs Confirmation',
            icon: <SparklesIcon className="h-4 w-4 text-amber-500 animate-pulse" />,
            badge: deptStats.pendingReview,
            badgeColor: 'amber' as const
          }
        ]
      : []),
    {
      value: 'pending',
      label: 'Pending',
      icon: <ClockIcon className="h-4 w-4 text-amber-500" />
    },
    {
      value: 'in-progress',
      label: 'In Progress',
      icon: <AlertCircleIcon className="h-4 w-4 text-sky-500" />
    },
    {
      value: 'resolved',
      label: 'Resolved',
      icon: <CheckCircle2Icon className="h-4 w-4 text-emerald-500" />
    },
    {
      value: 'urgent',
      label: 'Urgent Priority',
      icon: <AlertTriangleIcon className="h-4 w-4 text-rose-500" />,
      badge: deptStats.urgent,
      badgeColor: 'rose' as const
    }
  ], [deptStats.pendingReview, deptStats.urgent]);

  if (typeof document === 'undefined') return null;

  return createPortal(
    <AnimatePresence>
      {isOpen && department && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-3 sm:p-5 md:p-6 overflow-hidden">
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            onClick={onClose}
            className="fixed inset-0 bg-slate-950/70 backdrop-blur-md cursor-pointer"
          />

          {/* Modal Container */}
          <motion.div
            role="dialog"
            aria-modal="true"
            aria-labelledby="dept-modal-title"
            initial={{ opacity: 0, scale: 0.95, y: 16 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 16 }}
            transition={{ duration: 0.25, ease: [0.16, 1, 0.3, 1] }}
            className="relative z-10 w-full max-w-6xl max-h-[92vh] bg-white dark:bg-[#0f172a] rounded-2xl sm:rounded-3xl border border-slate-200/90 dark:border-white/10 shadow-2xl flex flex-col overflow-hidden isolate"
          >
            {/* Ambient Background Accent Glow */}
            <div className={`absolute top-0 right-1/4 w-96 h-96 ${activeTheme.glow} rounded-full blur-3xl pointer-events-none -z-10`} />

            {/* Modal Header */}
            <div className="px-5 py-4 sm:px-7 sm:py-5 border-b border-slate-200/80 dark:border-white/10 bg-slate-50/70 dark:bg-white/[0.02] flex flex-col md:flex-row md:items-center justify-between gap-4 shrink-0">
              <div className="flex items-start sm:items-center gap-3.5">
                <div className={`w-11 h-11 sm:w-12 sm:h-12 rounded-2xl bg-gradient-to-br ${activeTheme.gradient} text-white flex items-center justify-center shrink-0 shadow-lg border border-white/20`}>
                  <FolderOpenIcon className="h-6 w-6" />
                </div>
                <div>
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className={`text-[11px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-md bg-white/80 dark:bg-white/10 ${activeTheme.text} border ${activeTheme.badgeBorder}`}>
                      Department Folder
                    </span>
                    <span className="text-xs text-slate-400 dark:text-gray-500">•</span>
                    <span className="text-xs font-semibold text-slate-500 dark:text-gray-400">
                      {departmentConcerns.length} Total Concerns
                    </span>
                  </div>
                  <h2
                    id="dept-modal-title"
                    className="text-xl sm:text-2xl font-black text-slate-900 dark:text-white tracking-tight flex items-center gap-2 mt-0.5"
                  >
                    <span>{department}</span>
                  </h2>
                </div>
              </div>

              {/* Department Metrics & Close Button */}
              <div className="flex items-center gap-2 sm:gap-3 flex-wrap">
                {deptStats.pendingReview > 0 && (
                  <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-amber-50 dark:bg-amber-500/10 text-amber-700 dark:text-amber-300 border border-amber-200 dark:border-amber-500/20">
                    <SparklesIcon className="h-3.5 w-3.5 text-amber-500 animate-pulse" />
                    <span>{deptStats.pendingReview} Needs Review</span>
                  </span>
                )}
                {deptStats.urgent > 0 && (
                  <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-rose-50 dark:bg-rose-500/10 text-rose-700 dark:text-rose-400 border border-rose-200 dark:border-rose-500/20">
                    <AlertTriangleIcon className="h-3.5 w-3.5" />
                    <span>{deptStats.urgent} Urgent</span>
                  </span>
                )}
                <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-emerald-50 dark:bg-emerald-500/10 text-emerald-700 dark:text-emerald-400 border border-emerald-200 dark:border-emerald-500/20">
                  <CheckCircle2Icon className="h-3.5 w-3.5 text-emerald-500" />
                  <span>{deptStats.resolved} Resolved</span>
                </span>

                <button
                  type="button"
                  onClick={onClose}
                  aria-label="Close modal"
                  className="w-9 h-9 rounded-xl flex items-center justify-center text-slate-500 hover:text-slate-800 dark:text-gray-400 dark:hover:text-white bg-slate-100 hover:bg-slate-200 dark:bg-white/5 dark:hover:bg-white/10 border border-slate-200/80 dark:border-white/10 transition-colors ml-1 active:scale-95"
                >
                  <XIcon className="h-5 w-5" />
                </button>
              </div>
            </div>

            {/* Sub-toolbar: Search & Filter within Department */}
            <div className="px-5 py-3.5 sm:px-7 border-b border-slate-200/70 dark:border-white/5 bg-slate-50/40 dark:bg-white/[0.01] flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 shrink-0">
              <div className="flex items-center gap-2">
                <span className="text-xs font-bold text-slate-700 dark:text-gray-300">
                  Concerns in this department:
                </span>
                <span className="text-xs font-semibold px-2 py-0.5 rounded-full bg-slate-200 dark:bg-white/10 text-slate-700 dark:text-gray-300">
                  {filteredConcerns.length} of {departmentConcerns.length}
                </span>
              </div>

              <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2.5">
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <SearchIcon className="h-4 w-4 text-slate-400 dark:text-gray-500" />
                  </div>
                  <input
                    type="text"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    placeholder={`Search within ${department}...`}
                    className="block w-full sm:w-64 pl-9 pr-3 bg-white dark:bg-dark-800 border border-slate-200 dark:border-white/10 rounded-xl py-1.5 text-xs sm:text-sm text-slate-900 dark:text-white placeholder-slate-400 dark:placeholder-gray-500 focus:outline-none focus:border-sky-500 focus:ring-2 focus:ring-sky-500/20 shadow-xs"
                  />
                </div>

                <CustomSelect
                  value={filterStatus}
                  onChange={(val) => setFilterStatus(val as any)}
                  options={statusFilterOptions}
                  size="sm"
                  className="w-full sm:w-auto min-w-[190px]"
                  align="right"
                />
              </div>
            </div>

            {/* Modal Body: Scrollable Concerns List */}
            <div className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-4 custom-scrollbar">
              {filteredConcerns.length > 0 ? (
                <div className="space-y-4">
                  {filteredConcerns.map((concern: any) => (
                    <AdminConcernCard
                      key={concern.id}
                      concern={concern}
                      formatDate={formatDate}
                      onSelectConcern={onSelectConcern}
                      categoryDraft={categoryDraft}
                      setCategoryDraft={setCategoryDraft}
                      categorySelectOptions={categorySelectOptions}
                      deptDraft={deptDraft}
                      setDeptDraft={setDeptDraft}
                      departmentSelectOptions={departmentSelectOptions}
                      assignDraft={assignDraft}
                      setAssignDraft={setAssignDraft}
                      getStaffSelectOptions={getStaffSelectOptions}
                      reassignStaffSelectOptions={reassignStaffSelectOptions}
                      isConfirming={isConfirming}
                      handleConfirmConcern={handleConfirmConcern}
                      assignConcern={assignConcern}
                      staffNameById={staffNameById}
                    />
                  ))}
                </div>
              ) : (
                <div className="glass-panel p-10 sm:p-14 text-center rounded-2xl border border-slate-200/80 dark:border-white/10 my-4">
                  <div className="p-3 w-12 h-12 mx-auto rounded-full bg-sky-50 dark:bg-sky-500/10 text-sky-600 dark:text-sky-400 flex items-center justify-center mb-3 border border-sky-200/60 dark:border-sky-500/20">
                    <BuildingIcon className="h-6 w-6" />
                  </div>
                  <h3 className="text-base font-bold text-slate-900 dark:text-white mb-1">
                    {departmentConcerns.length === 0
                      ? `No concerns filed for ${department}`
                      : 'No matching concerns found'}
                  </h3>
                  <p className="text-xs sm:text-sm text-slate-500 dark:text-gray-400 max-w-md mx-auto">
                    {departmentConcerns.length === 0
                      ? `There are currently no active student tickets assigned to the ${department} department.`
                      : 'Try resetting your search query or status filter to see other concerns in this department.'}
                  </p>
                  {(searchQuery || filterStatus !== 'all') && (
                    <button
                      type="button"
                      onClick={() => {
                        setSearchQuery('');
                        setFilterStatus('all');
                      }}
                      className="mt-4 px-4 py-2 rounded-xl text-xs font-semibold bg-sky-600 text-white hover:bg-sky-500 transition-colors shadow-sm"
                    >
                      Reset Department Filters
                    </button>
                  )}
                </div>
              )}
            </div>

            {/* Modal Footer */}
            <div className="px-5 py-3 sm:px-7 border-t border-slate-200/80 dark:border-white/10 bg-slate-50/70 dark:bg-white/[0.02] flex items-center justify-between text-xs text-slate-500 dark:text-gray-400 shrink-0">
              <div className="flex items-center gap-1.5">
                <span className="w-2 h-2 rounded-full bg-emerald-500" />
                <span>Showing live real-time concern records</span>
              </div>
              <button
                type="button"
                onClick={onClose}
                className="px-4 py-1.5 rounded-xl text-xs font-semibold bg-slate-200 hover:bg-slate-300 dark:bg-white/10 dark:hover:bg-white/15 text-slate-800 dark:text-white transition-colors"
              >
                Close Folder
              </button>
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>,
    document.body
  );
}
