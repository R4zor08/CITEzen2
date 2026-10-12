import { useCallback, useEffect, useMemo, useState } from 'react';
import { motion } from 'framer-motion';
import { User, ConcernStatus } from '../types';
import { departmentsList } from '../data/mockData';
import { DashboardLayout } from '../components/DashboardLayout';
import { StatCard } from '../components/StatCard';
import { ConcernDetail } from '../components/ConcernDetail';
import { AnalyticsChart } from '../components/AnalyticsChart';
import { ProfileSection } from '../components/ProfileSection';
import { AddDepartmentModal } from '../components/AddDepartmentModal';
import { EditUserModal } from '../components/EditUserModal';
import { StatusBadge, PriorityBadge } from '../components/StatusBadge';
import { CustomSelect, CustomSelectOption } from '../components/CustomSelect';
import {
  FileTextIcon,
  CheckCircle2Icon,
  AlertTriangleIcon,
  SearchIcon,
  FilterIcon,
  UsersIcon,
  BuildingIcon,
  SparklesIcon,
  ActivityIcon,
  PlusIcon,
  EditIcon,
  CalendarIcon,
  ChevronRightIcon,
  MessageSquareIcon,
  ClockIcon,
  AlertCircleIcon,
  XCircleIcon
} from 'lucide-react';
import { toast } from 'sonner';
import { apiJson } from '../lib/api';

function UserListAvatar({
  name,
  profilePicture,
  className
}: {
  name: string;
  profilePicture?: string | null;
  /** Tailwind size + typography classes, e.g. h-9 w-9 text-sm */
  className: string;
}) {
  const initial = name.trim().charAt(0) || '?';
  if (profilePicture) {
    return (
      <img
        src={profilePicture}
        alt=""
        className={`rounded-full object-cover border border-slate-200/80 dark:border-white/10 ${className}`}
      />
    );
  }
  return (
    <div
      className={`rounded-full bg-sky-100 dark:bg-sky-500/20 text-sky-700 dark:text-sky-300 border border-sky-200/80 dark:border-sky-500/30 flex items-center justify-center font-bold shadow-sm ${className}`}
      aria-hidden
    >
      {initial}
    </div>
  );
}

interface AdminDashboardProps {
  user: User;
  onLogout: () => void;
  onNavigate: (page: string) => void;
  concernsData: any;
  onUpdateUser?: (data: Partial<User>) => Promise<void>;
}

export function AdminDashboard({
  user,
  onLogout,
  onNavigate,
  concernsData,
  onUpdateUser
}: AdminDashboardProps) {
  const [activeTab, setActiveTab] = useState('dashboard');
  const [selectedConcernId, setSelectedConcernId] = useState<string | null>(null);
  const [showAddDeptModal, setShowAddDeptModal] = useState(false);
  const [editingUser, setEditingUser] = useState<any>(null);
  const [filterStatus, setFilterStatus] = useState<ConcernStatus | 'all' | 'pending-review' | 'urgent'>('all');
  const [registeredUsers, setRegisteredUsers] = useState<User[]>([]);

  // User management search & role filter
  const [userSearchQuery, setUserSearchQuery] = useState('');
  const [userRoleFilter, setUserRoleFilter] = useState<'all' | 'student' | 'staff'>('all');

  const fetchUsers = useCallback(async () => {
    try {
      const list = await apiJson<User[]>('/api/users');
      setRegisteredUsers(list);
    } catch {
      /* keep list; errors are rare for admin */
    }
  }, []);

  useEffect(() => {
    void fetchUsers();
    const id = setInterval(() => void fetchUsers(), 2500);
    return () => clearInterval(id);
  }, [fetchUsers]);

  // Real-time departments from localStorage
  const [localDepartments, setLocalDepartments] = useState<string[]>(() => {
    try {
      const stored = localStorage.getItem('citezen_departments');
      return stored ? JSON.parse(stored) : departmentsList;
    } catch {
      return departmentsList;
    }
  });

  useEffect(() => {
    const interval = setInterval(() => {
      try {
        const storedDepts = localStorage.getItem('citezen_departments');
        if (storedDepts) {
          const parsed = JSON.parse(storedDepts);
          setLocalDepartments((prev: string[]) => {
            if (prev.length !== parsed.length) return parsed;
            return prev;
          });
        }
      } catch {
        /* ignore corrupt localStorage */
      }
    }, 1000);
    return () => clearInterval(interval);
  }, []);

  // Persist departments to localStorage when they change
  useEffect(() => {
    localStorage.setItem(
      'citezen_departments',
      JSON.stringify(localDepartments)
    );
  }, [localDepartments]);

  const [searchQuery, setSearchQuery] = useState('');
  const {
    concerns,
    updateStatus,
    addComment,
    forwardConcern,
    assignConcern,
    confirmConcern
  } = concernsData;

  const [assignDraft, setAssignDraft] = useState<Record<string, string>>({});
  const [deptDraft, setDeptDraft] = useState<Record<string, string>>({});
  const [categoryDraft, setCategoryDraft] = useState<Record<string, string>>({});
  const [isConfirming, setIsConfirming] = useState<Record<string, boolean>>({});

  const pendingReviewCount = concerns.filter(
    (c: any) => c.adminReviewStatus === 'pending' || !c.isConfirmed
  ).length;

  const filteredConcerns = concerns.filter((c: any) => {
    const matchesStatus =
      filterStatus === 'all'
        ? true
        : filterStatus === 'pending-review'
        ? c.adminReviewStatus === 'pending' || !c.isConfirmed
        : filterStatus === 'urgent'
        ? c.priority === 'urgent' || c.priority === 'high'
        : c.status === filterStatus;

    const matchesSearch =
      (c.title || '').toLowerCase().includes(searchQuery.toLowerCase()) ||
      (c.id || '').toLowerCase().includes(searchQuery.toLowerCase()) ||
      (c.studentName || '').toLowerCase().includes(searchQuery.toLowerCase()) ||
      (c.department || '').toLowerCase().includes(searchQuery.toLowerCase()) ||
      ((c.category || '') && c.category.toLowerCase().includes(searchQuery.toLowerCase()));

    return matchesStatus && matchesSearch;
  });

  const staffUsers = registeredUsers.filter((u: any) => u.role === 'staff');
  const staffNameById = useMemo(
    () => new Map<string, string>(staffUsers.map((u: any) => [u.id, u.name])),
    [staffUsers]
  );

  const stats = {
    total: concerns.length,
    pendingReview: pendingReviewCount,
    resolved: concerns.filter((c: any) => c.status === 'resolved').length,
    urgent: concerns.filter(
      (c: any) => c.priority === 'urgent' || c.priority === 'high'
    ).length,
    users: registeredUsers.filter((u: any) => u.role !== 'admin').length
  };

  // Manage users filtering
  const filteredUsers = useMemo(() => {
    return registeredUsers
      .filter((u: any) => u.role !== 'admin')
      .filter((u: any) => {
        const matchesRole =
          userRoleFilter === 'all' || u.role === userRoleFilter;
        const q = userSearchQuery.toLowerCase().trim();
        if (!q) return matchesRole;
        const matchesText =
          (u.name || '').toLowerCase().includes(q) ||
          (u.email || '').toLowerCase().includes(q) ||
          (u.department || '').toLowerCase().includes(q) ||
          (u.course || '').toLowerCase().includes(q) ||
          (u.studentId || '').toLowerCase().includes(q);
        return matchesRole && matchesText;
      });
  }, [registeredUsers, userRoleFilter, userSearchQuery]);

  const formatDate = (dateString: string) => {
    try {
      const date = new Date(dateString);
      return new Intl.DateTimeFormat('en-US', {
        month: 'short',
        day: 'numeric',
        hour: 'numeric',
        minute: '2-digit'
      }).format(date);
    } catch {
      return dateString;
    }
  };

  const handleConfirmConcern = async (concern: any) => {
    const staffId =
      assignDraft[concern.id] ?? concern.suggestedStaffId ?? (staffUsers[0]?.id || '');
    if (!staffId) {
      toast.error('Please select a staff member to assign this concern.');
      return;
    }
    const chosenDept = deptDraft[concern.id] ?? concern.department;
    const chosenCategory = categoryDraft[concern.id] ?? concern.category;

    setIsConfirming((prev) => ({ ...prev, [concern.id]: true }));
    try {
      if (confirmConcern) {
        await confirmConcern(concern.id, {
          assignedToId: staffId,
          department: chosenDept,
          category: chosenCategory,
          subcategory: concern.subcategory
        });
      } else {
        await assignConcern(concern.id, staffId);
      }
      toast.success('Concern confirmed and forwarded to staff member!');
    } catch {
      /* useConcerns already toasts */
    } finally {
      setIsConfirming((prev) => ({ ...prev, [concern.id]: false }));
    }
  };

  // Status filter options for CustomSelect
  const statusFilterOptions: CustomSelectOption[] = useMemo(() => [
    { value: 'all', label: 'All Statuses', icon: <FilterIcon className="h-4 w-4 text-slate-400" /> },
    ...(pendingReviewCount > 0
      ? [
          {
            value: 'pending-review',
            label: 'Needs Confirmation',
            icon: <SparklesIcon className="h-4 w-4 text-amber-500 animate-pulse" />,
            badge: pendingReviewCount,
            badgeColor: 'amber' as const
          }
        ]
      : []),
    { value: 'pending', label: 'Pending', icon: <ClockIcon className="h-4 w-4 text-amber-500" /> },
    { value: 'in-progress', label: 'In Progress', icon: <AlertCircleIcon className="h-4 w-4 text-sky-500" /> },
    { value: 'resolved', label: 'Resolved', icon: <CheckCircle2Icon className="h-4 w-4 text-emerald-500" /> },
    { value: 'rejected', label: 'Rejected', icon: <XCircleIcon className="h-4 w-4 text-rose-500" /> },
    {
      value: 'urgent',
      label: 'Urgent Priority',
      icon: <AlertTriangleIcon className="h-4 w-4 text-rose-500" />,
      badge: stats.urgent,
      badgeColor: 'rose' as const
    }
  ], [pendingReviewCount, stats.urgent]);

  // Category options for CustomSelect
  const categorySelectOptions: CustomSelectOption[] = useMemo(() => [
    { value: 'Academic', label: 'Academic' },
    { value: 'Administrative', label: 'Administrative' },
    { value: 'Facility', label: 'Facility' },
    { value: 'Complaints', label: 'Complaints' }
  ], []);

  // Department options for CustomSelect
  const departmentSelectOptions: CustomSelectOption[] = useMemo(() =>
    localDepartments.map((dept) => ({
      value: dept,
      label: dept,
      icon: <BuildingIcon className="h-3.5 w-3.5 text-sky-500" />
    })),
    [localDepartments]
  );

  // Staff options generator for CustomSelect
  const getStaffSelectOptions = useCallback((concernDept: string): CustomSelectOption[] => {
    const inDept = staffUsers.filter((u: any) => u.department === concernDept);
    const otherDept = staffUsers.filter((u: any) => u.department !== concernDept);

    const opts: CustomSelectOption[] = [
      { value: '', label: 'Select staff member…' },
      ...inDept.map((u: any) => ({
        value: u.id,
        label: u.name,
        badge: 'in dept',
        badgeColor: 'sky' as const
      }))
    ];

    if (inDept.length > 0 && otherDept.length > 0) {
      opts.push({ value: '__divider__', label: '', isDivider: true });
    }

    otherDept.forEach((u: any) => {
      opts.push({
        value: u.id,
        label: u.name,
        badge: u.department || 'No dept',
        badgeColor: 'slate' as const
      });
    });

    return opts;
  }, [staffUsers]);

  // Reassign staff options for CustomSelect
  const reassignStaffSelectOptions: CustomSelectOption[] = useMemo(() => [
    { value: '', label: 'Select staff…' },
    ...staffUsers.map((u: any) => ({
      value: u.id,
      label: u.name,
      badge: u.department || 'No dept',
      badgeColor: 'slate' as const
    }))
  ], [staffUsers]);

  // Prepare chart data
  const categoryData = [
    {
      label: 'Academic',
      value: concerns.filter((c: any) => c.category === 'Academic').length
    },
    {
      label: 'Administrative',
      value: concerns.filter((c: any) => c.category === 'Administrative').length
    },
    {
      label: 'Facility',
      value: concerns.filter((c: any) => c.category === 'Facility').length
    },
    {
      label: 'Complaints',
      value: concerns.filter((c: any) => c.category === 'Complaints').length
    }
  ].filter((d) => d.value > 0);

  const statusData = [
    {
      label: 'Pending',
      value: concerns.filter((c: any) => c.status === 'pending').length
    },
    {
      label: 'In Progress',
      value: concerns.filter((c: any) => c.status === 'in-progress').length
    },
    {
      label: 'Resolved',
      value: concerns.filter((c: any) => c.status === 'resolved').length
    },
    {
      label: 'Rejected',
      value: concerns.filter((c: any) => c.status === 'rejected').length
    }
  ].filter((d) => d.value > 0);

  const departmentData = localDepartments
    .map((dept) => ({
      label: dept,
      value: concerns.filter((c: any) => c.department === dept).length
    }))
    .filter((d) => d.value > 0);

  const userRoleData = [
    {
      label: 'Students',
      value: registeredUsers.filter((u: any) => u.role === 'student').length
    },
    {
      label: 'Staff',
      value: registeredUsers.filter((u: any) => u.role === 'staff').length
    }
  ].filter((d) => d.value > 0);

  const selectedConcern = concerns.find((c: any) => c.id === selectedConcernId);

  const containerVariants = {
    hidden: { opacity: 0 },
    show: {
      opacity: 1,
      transition: { staggerChildren: 0.08 }
    }
  };

  const itemVariants = {
    hidden: { opacity: 0, y: 16 },
    show: {
      opacity: 1,
      y: 0,
      transition: { duration: 0.35, ease: 'easeOut' }
    }
  };

  return (
    <DashboardLayout
      user={user}
      role="admin"
      activeTab={activeTab}
      onTabChange={setActiveTab}
      onLogout={onLogout}
      onNavigate={onNavigate}
      concernsData={concernsData}
    >
      {/* ========================================================================= */}
      {/* SECTION 1: SYSTEM OVERVIEW (activeTab === 'dashboard')                     */}
      {/* ========================================================================= */}
      {activeTab === 'dashboard' && (
        <motion.div
          variants={containerVariants}
          initial="hidden"
          animate="show"
          className="space-y-6 sm:space-y-8"
        >
          {/* Header */}
          <motion.div
            variants={itemVariants}
            className="flex flex-col sm:flex-row sm:items-center justify-between gap-4"
          >
            <div>
              <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 dark:text-white tracking-tight">
                System Overview
              </h1>
              <p className="text-xs sm:text-sm text-slate-500 dark:text-gray-400 mt-1">
                Real-time campus concern metrics, AI intake triage, and institutional SLA monitoring.
              </p>
            </div>
          </motion.div>

          {/* Interactive Stat Cards Grid */}
          <motion.div
            variants={itemVariants}
            className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4"
          >
            <StatCard
              title="Total Concerns"
              value={stats.total}
              icon={FileTextIcon}
              color="blue"
              subtitle="All registered concerns"
              onClick={() => {
                setFilterStatus('all');
                setActiveTab('all-concerns');
              }}
              trend={{
                value: 12,
                isPositive: true
              }}
            />

            <StatCard
              title="Resolution Rate"
              value={`${Math.round(stats.resolved / (stats.total || 1) * 100)}%`}
              icon={CheckCircle2Icon}
              color="green"
              subtitle="Filter resolved tickets"
              onClick={() => {
                setFilterStatus('resolved');
                setActiveTab('all-concerns');
              }}
              trend={{
                value: 5,
                isPositive: true
              }}
            />

            <StatCard
              title="High Priority"
              value={stats.urgent}
              icon={AlertTriangleIcon}
              color="red"
              subtitle="Filter urgent concerns"
              onClick={() => {
                setFilterStatus('urgent');
                setActiveTab('all-concerns');
              }}
            />

            <StatCard
              title="Total Users"
              value={stats.users}
              icon={UsersIcon}
              color="blue"
              subtitle="Manage registered accounts"
              onClick={() => setActiveTab('users')}
            />
          </motion.div>

          {/* Overview Charts Grid */}
          <motion.div
            variants={itemVariants}
            className="grid grid-cols-1 lg:grid-cols-2 gap-4 sm:gap-6"
          >
            <AnalyticsChart
              data={categoryData}
              type="donut"
              title="Concerns by Category"
              subtitle="Distribution across academic, facility, and administrative tickets"
            />

            <AnalyticsChart
              data={statusData}
              type="bar"
              title="Current Status Distribution"
              subtitle="Real-time ticket volume across lifecycle statuses"
            />
          </motion.div>
        </motion.div>
      )}

      {/* ========================================================================= */}
      {/* SECTION 2: ALL CONCERNS (activeTab === 'all-concerns')                     */}
      {/* ========================================================================= */}
      {activeTab === 'all-concerns' && (
        <motion.div
          variants={containerVariants}
          initial="hidden"
          animate="show"
          className="space-y-4 sm:space-y-6"
        >
          {/* Header & Search Toolbar */}
          <motion.div
            variants={itemVariants}
            className="flex flex-col sm:flex-row sm:items-center justify-between gap-3"
          >
            <div>
              <div className="flex items-center gap-2 mb-1">
                <h1 className="text-xl sm:text-2xl font-bold text-slate-900 dark:text-white">
                  All Concerns
                </h1>
                <span className="text-xs font-semibold px-2.5 py-0.5 rounded-full bg-slate-100 dark:bg-white/5 text-slate-600 dark:text-gray-300 border border-slate-200 dark:border-white/10">
                  {filteredConcerns.length} of {concerns.length}
                </span>
              </div>
              <p className="text-xs sm:text-sm text-slate-500 dark:text-gray-400">
                Search, review AI routing suggestions, and confirm assignments.
              </p>
            </div>

            {/* Search & Status Controls */}
            <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2.5">
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <SearchIcon className="h-4 w-4 text-slate-400 dark:text-gray-500" />
                </div>
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Search title, ID, student..."
                  className="block w-full sm:w-64 pl-9 pr-3 bg-white dark:bg-dark-800 border border-slate-200 dark:border-white/10 rounded-xl py-2 text-sm text-slate-900 dark:text-white placeholder-slate-400 dark:placeholder-gray-500 focus:outline-none focus:border-sky-500 focus:ring-2 focus:ring-sky-500/20 shadow-sm transition-all"
                />
              </div>

              <CustomSelect
                value={filterStatus}
                onChange={(val) => setFilterStatus(val as any)}
                options={statusFilterOptions}
                icon={<FilterIcon className="h-4 w-4" />}
                className="w-full sm:w-auto min-w-[210px]"
                align="right"
              />
            </div>
          </motion.div>

          {/* Concerns Cards List */}
          <motion.div variants={itemVariants}>
            {filteredConcerns.length > 0 ? (
              <div className="space-y-4">
                {filteredConcerns.map((concern: any) => (
                  <motion.div
                    key={concern.id}
                    whileHover={{ y: -2 }}
                    transition={{ duration: 0.2 }}
                    className="glass-panel rounded-2xl border border-slate-200/80 dark:border-white/10 overflow-hidden shadow-sm hover:border-sky-500/40 hover:shadow-md transition-all bg-white dark:bg-dark-800"
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
                            {concern.adminReviewStatus === 'pending' || !concern.isConfirmed ? (
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
                            onClick={() => setSelectedConcernId(concern.id)}
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
                                <span className="font-medium text-slate-700 dark:text-gray-300">{concern.department}</span>
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
                                <span className="font-semibold text-emerald-700 dark:text-emerald-400 truncate">1. Logged</span>
                              </div>

                              {/* Step 2: AI Triage */}
                              <div className="flex flex-col gap-1">
                                <div className="h-1.5 rounded-full bg-emerald-500" />
                                <span className="font-semibold text-emerald-700 dark:text-emerald-400 truncate">2. AI Triaged</span>
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
                            onClick={() => setSelectedConcernId(concern.id)}
                            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-sky-50 hover:bg-sky-100 dark:bg-sky-500/10 dark:hover:bg-sky-500/20 text-sky-700 dark:text-sky-300 font-semibold text-xs border border-sky-200/70 dark:border-sky-500/20 transition-all active:scale-95 group"
                          >
                            <span>Open Full Details & Thread</span>
                            <ChevronRightIcon className="h-3.5 w-3.5 group-hover:translate-x-0.5 transition-transform" />
                          </button>
                        </div>
                      </div>

                      {/* Right: AI Classification & Routing Panel */}
                      <div className="lg:w-[380px] shrink-0 p-5 sm:p-6 bg-slate-50/60 dark:bg-dark-900/40 flex flex-col justify-between space-y-4">
                        {concern.adminReviewStatus === 'pending' || !concern.isConfirmed ? (
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
                                  <span className="text-slate-600 dark:text-gray-400 font-medium">Assign to Staff</span>
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
                                  options={getStaffSelectOptions(deptDraft[concern.id] ?? concern.department)}
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
                ))}
              </div>
            ) : (
              <div className="glass-panel p-10 sm:p-14 text-center rounded-2xl border border-slate-200/80 dark:border-white/10">
                <div className="p-3 w-12 h-12 mx-auto rounded-full bg-slate-100 dark:bg-white/5 text-slate-400 dark:text-gray-500 flex items-center justify-center mb-3">
                  <SearchIcon className="h-6 w-6" />
                </div>
                <h3 className="text-base font-bold text-slate-900 dark:text-white mb-1">
                  No concerns found
                </h3>
                <p className="text-xs sm:text-sm text-slate-500 dark:text-gray-400 max-w-sm mx-auto">
                  Try adjusting your search query or reset your status filter to view campus concerns.
                </p>
                <button
                  onClick={() => {
                    setSearchQuery('');
                    setFilterStatus('all');
                  }}
                  className="mt-4 px-4 py-2 rounded-xl text-xs font-semibold bg-sky-600 text-white hover:bg-sky-500 transition-colors"
                >
                  Reset Filters
                </button>
              </div>
            )}
          </motion.div>
        </motion.div>
      )}

      {/* ========================================================================= */}
      {/* SECTION 3: MANAGE USERS (activeTab === 'users')                           */}
      {/* ========================================================================= */}
      {activeTab === 'users' && (
        <motion.div
          variants={containerVariants}
          initial="hidden"
          animate="show"
          className="space-y-4 sm:space-y-6"
        >
          {/* Header & Controls Toolbar */}
          <motion.div
            variants={itemVariants}
            className="flex flex-col sm:flex-row sm:items-center justify-between gap-4"
          >
            <div>
              <div className="flex items-center gap-2 mb-1">
                <h1 className="text-xl sm:text-2xl font-bold text-slate-900 dark:text-white">
                  Manage Users
                </h1>
                <span className="text-xs font-semibold px-2.5 py-0.5 rounded-full bg-slate-100 dark:bg-white/5 text-slate-600 dark:text-gray-300 border border-slate-200 dark:border-white/10">
                  {filteredUsers.length} active
                </span>
              </div>
              <p className="text-xs sm:text-sm text-slate-500 dark:text-gray-400">
                Manage registered student and staff accounts, credentials, and departmental affiliations.
              </p>
            </div>

            {/* User Search & Role Filter Toolbar */}
            <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2.5">
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <SearchIcon className="h-4 w-4 text-slate-400 dark:text-gray-500" />
                </div>
                <input
                  type="text"
                  value={userSearchQuery}
                  onChange={(e) => setUserSearchQuery(e.target.value)}
                  placeholder="Search user, email, dept..."
                  className="block w-full sm:w-56 pl-9 pr-3 bg-white dark:bg-dark-800 border border-slate-200 dark:border-white/10 rounded-xl py-2 text-sm text-slate-900 dark:text-white placeholder-slate-400 dark:placeholder-gray-500 focus:outline-none focus:border-sky-500 focus:ring-2 focus:ring-sky-500/20 shadow-sm transition-all"
                />
              </div>

              {/* Role Filter Pills */}
              <div className="flex items-center gap-1 bg-slate-100 dark:bg-white/5 p-1 rounded-xl border border-slate-200/80 dark:border-white/10 text-xs font-semibold">
                <button
                  onClick={() => setUserRoleFilter('all')}
                  className={`px-3 py-1 rounded-lg transition-all ${
                    userRoleFilter === 'all'
                      ? 'bg-white dark:bg-dark-800 text-slate-900 dark:text-white shadow-sm'
                      : 'text-slate-500 dark:text-gray-400 hover:text-slate-900 dark:hover:text-white'
                  }`}
                >
                  All
                </button>
                <button
                  onClick={() => setUserRoleFilter('student')}
                  className={`px-3 py-1 rounded-lg transition-all ${
                    userRoleFilter === 'student'
                      ? 'bg-white dark:bg-dark-800 text-emerald-600 dark:text-emerald-400 shadow-sm'
                      : 'text-slate-500 dark:text-gray-400 hover:text-slate-900 dark:hover:text-white'
                  }`}
                >
                  Students
                </button>
                <button
                  onClick={() => setUserRoleFilter('staff')}
                  className={`px-3 py-1 rounded-lg transition-all ${
                    userRoleFilter === 'staff'
                      ? 'bg-white dark:bg-dark-800 text-sky-600 dark:text-sky-400 shadow-sm'
                      : 'text-slate-500 dark:text-gray-400 hover:text-slate-900 dark:hover:text-white'
                  }`}
                >
                  Staff
                </button>
              </div>
            </div>
          </motion.div>

          {/* Mobile: Card layout */}
          <motion.div variants={itemVariants} className="sm:hidden space-y-3">
            {filteredUsers.length === 0 ? (
              <div className="glass-panel p-8 text-center text-slate-500 dark:text-gray-400 text-sm rounded-2xl border border-slate-200/80 dark:border-white/10">
                No users found matching your search.
              </div>
            ) : (
              filteredUsers.map((u: any) => (
                <motion.div
                  key={u.id}
                  whileHover={{ scale: 1.01 }}
                  className="glass-card p-4 rounded-2xl border border-slate-200/80 dark:border-white/10 shadow-sm"
                >
                  <div className="flex items-center gap-3 mb-3">
                    <UserListAvatar
                      name={u.name}
                      profilePicture={u.profilePicture}
                      className="h-10 w-10 text-sm shrink-0"
                    />
                    <div className="flex-1 min-w-0">
                      <div className="font-bold text-slate-900 dark:text-white text-sm truncate">
                        {u.name}
                      </div>
                      <div className="text-xs text-slate-500 dark:text-gray-400 truncate">
                        {u.email}
                      </div>
                    </div>
                    <span
                      className={`inline-flex items-center px-2 py-0.5 rounded-md text-[10px] font-bold capitalize shrink-0 border ${
                        u.role === 'admin'
                          ? 'bg-rose-50 dark:bg-rose-500/10 text-rose-700 dark:text-rose-400 border-rose-200 dark:border-rose-500/20'
                          : u.role === 'staff'
                          ? 'bg-sky-50 dark:bg-sky-500/10 text-sky-700 dark:text-sky-400 border-sky-200 dark:border-sky-500/20'
                          : 'bg-emerald-50 dark:bg-emerald-500/10 text-emerald-700 dark:text-emerald-400 border-emerald-200 dark:border-emerald-500/20'
                      }`}
                    >
                      {u.role}
                    </span>
                  </div>

                  <div className="flex items-center justify-between pt-2 border-t border-slate-200/60 dark:border-white/5">
                    <span className="text-xs text-slate-600 dark:text-gray-300 font-medium truncate max-w-[200px]">
                      {u.department || u.course || 'No Department'}
                    </span>
                    <button
                      onClick={() => setEditingUser(u)}
                      className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-sky-50 hover:bg-sky-100 dark:bg-sky-500/10 dark:hover:bg-sky-500/20 text-sky-700 dark:text-sky-400 font-semibold text-xs border border-sky-200/60 dark:border-sky-500/20 transition-all"
                    >
                      <EditIcon className="h-3 w-3" />
                      <span>Edit</span>
                    </button>
                  </div>
                </motion.div>
              ))
            )}
          </motion.div>

          {/* Desktop: Table layout */}
          <motion.div
            variants={itemVariants}
            className="hidden sm:block glass-panel rounded-2xl border border-slate-200/80 dark:border-white/10 overflow-hidden shadow-sm"
          >
            <div className="overflow-x-auto">
              <table className="w-full text-left text-sm">
                <thead className="bg-slate-50/90 dark:bg-white/[0.03] text-slate-600 dark:text-gray-400 uppercase tracking-wider text-xs border-b border-slate-200/80 dark:border-white/10 font-bold">
                  <tr>
                    <th className="px-6 py-4">User</th>
                    <th className="px-6 py-4">Role</th>
                    <th className="px-6 py-4">Department / Program</th>
                    <th className="px-6 py-4 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-200/60 dark:divide-white/5">
                  {filteredUsers.length === 0 ? (
                    <tr>
                      <td
                        colSpan={4}
                        className="px-6 py-12 text-center text-slate-500 dark:text-gray-400 text-sm"
                      >
                        No users registered matching your search criteria.
                      </td>
                    </tr>
                  ) : (
                    filteredUsers.map((u: any) => (
                      <tr
                        key={u.id}
                        className="hover:bg-slate-50/70 dark:hover:bg-white/[0.02] transition-colors"
                      >
                        <td className="px-6 py-4">
                          <div className="flex items-center gap-3">
                            <UserListAvatar
                              name={u.name}
                              profilePicture={u.profilePicture}
                              className="h-9 w-9 shrink-0 text-xs"
                            />
                            <div>
                              <div className="font-bold text-slate-900 dark:text-white">
                                {u.name}
                              </div>
                              <div className="text-xs text-slate-500 dark:text-gray-400">
                                {u.email}
                              </div>
                            </div>
                          </div>
                        </td>
                        <td className="px-6 py-4">
                          <span
                            className={`inline-flex items-center px-2.5 py-0.5 rounded-md text-xs font-bold capitalize border ${
                              u.role === 'admin'
                                ? 'bg-rose-50 dark:bg-rose-500/10 text-rose-700 dark:text-rose-400 border-rose-200 dark:border-rose-500/20'
                                : u.role === 'staff'
                                ? 'bg-sky-50 dark:bg-sky-500/10 text-sky-700 dark:text-sky-400 border-sky-200 dark:border-sky-500/20'
                                : 'bg-emerald-50 dark:bg-emerald-500/10 text-emerald-700 dark:text-emerald-400 border-emerald-200 dark:border-emerald-500/20'
                            }`}
                          >
                            {u.role}
                          </span>
                        </td>
                        <td className="px-6 py-4 text-slate-600 dark:text-gray-300 font-medium">
                          {u.department || u.course || '—'}
                        </td>
                        <td className="px-6 py-4 text-right">
                          <button
                            onClick={() => setEditingUser(u)}
                            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-sky-50 hover:bg-sky-100 dark:bg-sky-500/10 dark:hover:bg-sky-500/20 text-sky-700 dark:text-sky-400 font-semibold text-xs border border-sky-200/60 dark:border-sky-500/20 transition-all active:scale-95"
                          >
                            <EditIcon className="h-3 w-3" />
                            <span>Edit Account</span>
                          </button>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </motion.div>
        </motion.div>
      )}

      {/* ========================================================================= */}
      {/* SECTION 4: DETAILED ANALYTICS (activeTab === 'analytics')                 */}
      {/* ========================================================================= */}
      {activeTab === 'analytics' && (
        <motion.div
          variants={containerVariants}
          initial="hidden"
          animate="show"
          className="space-y-6 sm:space-y-8"
        >
          {/* Header */}
          <motion.div variants={itemVariants}>
            <div className="flex items-center gap-2 mb-1.5">
              <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[11px] font-semibold bg-sky-50 dark:bg-sky-500/10 text-sky-700 dark:text-sky-300 border border-sky-200 dark:border-sky-500/20">
                <ActivityIcon className="h-3 w-3" />
                Institutional Intelligence
              </span>
              <span className="text-xs text-slate-300 dark:text-gray-600">•</span>
              <span className="text-xs font-medium text-slate-500 dark:text-gray-400">
                Audit & SLA Reports
              </span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 dark:text-white tracking-tight">
              Detailed Analytics
            </h1>
            <p className="text-xs sm:text-sm text-slate-500 dark:text-gray-400 mt-1">
              Comprehensive breakdowns of concern volumes, response times, and department resolution rates.
            </p>
          </motion.div>

          {/* Quick KPI Bar */}
          <motion.div
            variants={itemVariants}
            className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4"
          >
            <div className="glass-card p-4 rounded-2xl border border-slate-200/80 dark:border-white/10 shadow-sm flex items-center gap-3">
              <div className="p-2.5 rounded-xl bg-sky-50 dark:bg-sky-500/15 text-sky-600 dark:text-sky-400 border border-sky-200 dark:border-sky-500/25 shrink-0">
                <FileTextIcon className="h-5 w-5" />
              </div>
              <div className="min-w-0">
                <div className="text-xs font-semibold text-slate-500 dark:text-gray-400 truncate">
                  Total Concerns
                </div>
                <div className="text-xl sm:text-2xl font-black text-slate-900 dark:text-white">
                  {stats.total}
                </div>
              </div>
            </div>

            <div className="glass-card p-4 rounded-2xl border border-slate-200/80 dark:border-white/10 shadow-sm flex items-center gap-3">
              <div className="p-2.5 rounded-xl bg-emerald-50 dark:bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 border border-emerald-200 dark:border-emerald-500/25 shrink-0">
                <CheckCircle2Icon className="h-5 w-5" />
              </div>
              <div className="min-w-0">
                <div className="text-xs font-semibold text-slate-500 dark:text-gray-400 truncate">
                  Resolution Rate
                </div>
                <div className="text-xl sm:text-2xl font-black text-emerald-600 dark:text-emerald-400">
                  {Math.round(stats.resolved / (stats.total || 1) * 100)}%
                </div>
              </div>
            </div>

            <div className="glass-card p-4 rounded-2xl border border-slate-200/80 dark:border-white/10 shadow-sm flex items-center gap-3">
              <div className="p-2.5 rounded-xl bg-amber-50 dark:bg-amber-500/15 text-amber-600 dark:text-amber-400 border border-amber-200 dark:border-amber-500/25 shrink-0">
                <BuildingIcon className="h-5 w-5" />
              </div>
              <div className="min-w-0">
                <div className="text-xs font-semibold text-slate-500 dark:text-gray-400 truncate">
                  Active Depts
                </div>
                <div className="text-xl sm:text-2xl font-black text-slate-900 dark:text-white">
                  {localDepartments.length}
                </div>
              </div>
            </div>

            <div className="glass-card p-4 rounded-2xl border border-slate-200/80 dark:border-white/10 shadow-sm flex items-center gap-3">
              <div className="p-2.5 rounded-xl bg-rose-50 dark:bg-rose-500/15 text-rose-600 dark:text-rose-400 border border-rose-200 dark:border-rose-500/25 shrink-0">
                <AlertTriangleIcon className="h-5 w-5" />
              </div>
              <div className="min-w-0">
                <div className="text-xs font-semibold text-slate-500 dark:text-gray-400 truncate">
                  High Priority
                </div>
                <div className="text-xl sm:text-2xl font-black text-rose-600 dark:text-rose-400">
                  {stats.urgent}
                </div>
              </div>
            </div>
          </motion.div>

          {/* Analytics Charts Grid 1 */}
          <motion.div
            variants={itemVariants}
            className="grid grid-cols-1 lg:grid-cols-2 gap-4 sm:gap-6"
          >
            <AnalyticsChart
              data={categoryData}
              type="bar"
              title="Volume by Category"
              subtitle="Comparison of concern volume across categories"
            />

            <AnalyticsChart
              data={statusData}
              type="donut"
              title="Status Breakdown"
              subtitle="Proportional split of current ticket lifecycle states"
            />
          </motion.div>

          {/* Analytics Charts Grid 2 */}
          <motion.div
            variants={itemVariants}
            className="grid grid-cols-1 lg:grid-cols-2 gap-4 sm:gap-6"
          >
            <AnalyticsChart
              data={departmentData}
              type="bar"
              title="Concerns by Department"
              subtitle="Volume distribution across active campus units"
            />

            <AnalyticsChart
              data={userRoleData}
              type="donut"
              title="User Distribution"
              subtitle="Active students vs registered staff accounts"
            />
          </motion.div>

          {/* Department Performance Panel */}
          <motion.div
            variants={itemVariants}
            className="glass-panel p-5 sm:p-7 rounded-2xl border border-slate-200/80 dark:border-white/10 shadow-sm bg-white/80 dark:bg-dark-800/80"
          >
            <div className="flex items-center justify-between gap-3 mb-5">
              <div>
                <h3 className="text-base sm:text-lg font-bold text-slate-900 dark:text-white">
                  Department Resolution Performance
                </h3>
                <p className="text-xs text-slate-500 dark:text-gray-400 mt-0.5">
                  Percentage of assigned student concerns marked as resolved by each department.
                </p>
              </div>
              <span className="text-xs font-semibold px-2.5 py-1 rounded-full bg-slate-100 dark:bg-white/5 text-slate-600 dark:text-gray-300 border border-slate-200 dark:border-white/10 shrink-0">
                {localDepartments.length} Departments
              </span>
            </div>

            <div className="space-y-4">
              {localDepartments.map((dept) => {
                const total = concerns.filter((c: any) => c.department === dept).length || 1;
                const resolved = concerns.filter(
                  (c: any) => c.department === dept && c.status === 'resolved'
                ).length;
                const percentage = Math.round((resolved / total) * 100);

                return (
                  <div key={dept} className="space-y-1.5">
                    <div className="flex justify-between items-center text-xs sm:text-sm">
                      <span className="text-slate-800 dark:text-gray-200 font-semibold truncate pr-2">
                        {dept}
                      </span>
                      <div className="flex items-center gap-2 shrink-0">
                        <span className="text-slate-500 dark:text-gray-400 text-xs">
                          {resolved} of {total} resolved
                        </span>
                        <span className="text-xs font-bold px-2 py-0.5 rounded-md bg-sky-50 dark:bg-sky-500/10 text-sky-700 dark:text-sky-300 border border-sky-200 dark:border-sky-500/20 tabular-nums">
                          {percentage}%
                        </span>
                      </div>
                    </div>
                    <div className="w-full h-2 sm:h-2.5 bg-slate-100 dark:bg-dark-900 rounded-full overflow-hidden border border-slate-200/80 dark:border-white/5">
                      <motion.div
                        initial={{ width: 0 }}
                        animate={{ width: `${percentage}%` }}
                        transition={{ duration: 1, ease: 'easeOut' }}
                        className="h-full bg-gradient-to-r from-blue-500 via-sky-500 to-teal-400 rounded-full"
                      />
                    </div>
                  </div>
                );
              })}
            </div>
          </motion.div>
        </motion.div>
      )}

      {/* ========================================================================= */}
      {/* DEPARTMENTS TAB                                                           */}
      {/* ========================================================================= */}
      {activeTab === 'departments' && (
        <motion.div
          variants={containerVariants}
          initial="hidden"
          animate="show"
          className="space-y-4 sm:space-y-6"
        >
          <motion.div
            variants={itemVariants}
            className="flex items-center justify-between"
          >
            <div>
              <h1 className="text-xl sm:text-2xl font-bold text-slate-900 dark:text-white">
                Departments
              </h1>
              <p className="text-xs sm:text-sm text-slate-500 dark:text-gray-400 mt-0.5">
                Active campus operational and academic units handling student concerns.
              </p>
            </div>
            <button
              onClick={() => setShowAddDeptModal(true)}
              className="inline-flex items-center gap-1.5 px-3.5 sm:px-4 py-2 rounded-xl bg-sky-600 hover:bg-sky-500 text-white text-xs sm:text-sm font-semibold transition-all shadow-md active:scale-95"
            >
              <PlusIcon className="h-4 w-4" />
              <span>Add Department</span>
            </button>
          </motion.div>

          <motion.div
            variants={itemVariants}
            className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-4"
          >
            {localDepartments.map((dept) => {
              const deptCount = concerns.filter((c: any) => c.department === dept).length;
              const resolvedCount = concerns.filter(
                (c: any) => c.department === dept && c.status === 'resolved'
              ).length;

              return (
                <motion.div
                  key={dept}
                  whileHover={{ scale: 1.015, y: -2 }}
                  className="glass-card p-4 sm:p-5 rounded-2xl border border-slate-200/80 dark:border-white/10 shadow-sm"
                >
                  <div className="flex items-center gap-3 mb-3.5">
                    <div className="p-2 rounded-xl bg-sky-50 dark:bg-blue-500/10 border border-sky-200 dark:border-blue-500/20 text-sky-600 dark:text-blue-400">
                      <BuildingIcon className="h-4 w-4 sm:h-5 sm:w-5" />
                    </div>
                    <h3 className="font-bold text-slate-900 dark:text-white text-sm sm:text-base truncate">
                      {dept}
                    </h3>
                  </div>

                  <div className="space-y-2 pt-2 border-t border-slate-200/60 dark:border-white/5">
                    <div className="flex justify-between text-xs sm:text-sm">
                      <span className="text-slate-500 dark:text-gray-400">Total Concerns</span>
                      <span className="font-bold text-slate-900 dark:text-white">
                        {deptCount}
                      </span>
                    </div>
                    <div className="flex justify-between text-xs sm:text-sm">
                      <span className="text-slate-500 dark:text-gray-400">Resolved</span>
                      <span className="font-bold text-emerald-600 dark:text-green-400">
                        {resolvedCount}
                      </span>
                    </div>
                  </div>
                </motion.div>
              );
            })}
          </motion.div>
        </motion.div>
      )}

      {/* ========================================================================= */}
      {/* PROFILE TAB                                                               */}
      {/* ========================================================================= */}
      {activeTab === 'profile' && (
        <ProfileSection
          user={user}
          onUpdateProfile={async (data) => {
            if (onUpdateUser) {
              await onUpdateUser(data);
            }
          }}
        />
      )}

      {/* Detail Modal */}
      <ConcernDetail
        isOpen={Boolean(selectedConcern)}
        concern={selectedConcern}
        currentUser={user}
        onUpdateStatus={async (id, status) => {
          try {
            await updateStatus(id, status);
            const labels: Record<string, string> = {
              'in-progress': 'In Progress',
              resolved: 'Resolved',
              rejected: 'Rejected'
            };
            toast.success(`Status updated to ${labels[status] || status}`);
          } catch {
            /* useConcerns already toasts */
          }
        }}
        onForward={async (id, dept) => {
          try {
            await forwardConcern(id, dept);
            toast.success(`Concern forwarded to ${dept}`);
          } catch {
            /* useConcerns already toasts */
          }
        }}
        onAddComment={async (id, content, author) => {
          try {
            await addComment(id, content, author);
            toast.success('Comment added');
          } catch {
            /* useConcerns already toasts */
          }
        }}
        onConfirm={async (id, params) => {
          try {
            if (confirmConcern) {
              await confirmConcern(id, params);
            } else {
              await assignConcern(id, params.assignedToId);
            }
            toast.success('Concern confirmed and forwarded to staff member!');
          } catch {
            /* useConcerns already toasts */
          }
        }}
        staffUsers={staffUsers}
        onClose={() => setSelectedConcernId(null)}
      />

      {/* Add Department Modal */}
      <AddDepartmentModal
        isOpen={showAddDeptModal}
        onClose={() => setShowAddDeptModal(false)}
        onAdd={async (dept) => {
          await new Promise((resolve) => setTimeout(resolve, 500));
          setLocalDepartments((prev) => [...prev, dept]);
        }}
      />

      {/* Edit User Modal */}
      <EditUserModal
        isOpen={!!editingUser}
        user={editingUser}
        onClose={() => setEditingUser(null)}
        onSave={async (userId, updates) => {
          const { password, ...rest } = updates;
          const body: Record<string, unknown> = { ...rest };
          if (password) body.password = password;
          await apiJson(`/api/users/${userId}`, {
            method: 'PATCH',
            body: JSON.stringify(body)
          });
          await fetchUsers();
        }}
      />
    </DashboardLayout>
  );
}