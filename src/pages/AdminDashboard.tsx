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
import { CustomSelect, CustomSelectOption } from '../components/CustomSelect';
import { DepartmentConcernsModal } from '../components/DepartmentConcernsModal';
import { AdminConcernCard } from '../components/AdminConcernCard';
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
  ClockIcon,
  AlertCircleIcon,
  XCircleIcon,
  LayoutGridIcon,
  ListIcon,
  GraduationCapIcon,
  ClipboardListIcon,
  WrenchIcon,
  LaptopIcon,
  CreditCardIcon,
  ArrowRightIcon
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
  const [activeDepartmentFolder, setActiveDepartmentFolder] = useState<string | null>(null);
  const [concernsViewMode, setConcernsViewMode] = useState<'folders' | 'feed'>('folders');

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

  // Real-time departments from localStorage (synced with official departments list)
  const [localDepartments, setLocalDepartments] = useState<string[]>(() => {
    try {
      const stored = localStorage.getItem('citezen_departments');
      if (stored) {
        const parsed = JSON.parse(stored);
        if (Array.isArray(parsed) && parsed.length > 0) {
          const cleaned = parsed.filter((d: string) => d && d !== 'CITE');
          const hasAllOfficial = departmentsList.every((d) => cleaned.includes(d));
          if (!hasAllOfficial || parsed.includes('CITE')) {
            localStorage.setItem('citezen_departments', JSON.stringify(departmentsList));
            return departmentsList;
          }
          return cleaned;
        }
      }
      localStorage.setItem('citezen_departments', JSON.stringify(departmentsList));
      return departmentsList;
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
          if (Array.isArray(parsed)) {
            const cleaned = parsed.filter((d: string) => d && d !== 'CITE');
            setLocalDepartments((prev: string[]) => {
              if (JSON.stringify(prev) !== JSON.stringify(cleaned)) return cleaned;
              return prev;
            });
          }
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

  // Normalize concerns so any legacy 'CITE' or non-department value belongs strictly to the Departments section
  const normalizedConcerns = useMemo(() => {
    return concerns.map((c: any) => {
      const d = c.department?.trim();
      if (!d || d === 'CITE' || !localDepartments.includes(d)) {
        return {
          ...c,
          department: 'Academic Affairs'
        };
      }
      return c;
    });
  }, [concerns, localDepartments]);

  const pendingReviewCount = normalizedConcerns.filter(
    (c: any) => c.adminReviewStatus === 'pending' || !c.isConfirmed
  ).length;

  const filteredConcerns = normalizedConcerns.filter((c: any) => {
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
    total: normalizedConcerns.length,
    pendingReview: pendingReviewCount,
    resolved: normalizedConcerns.filter((c: any) => c.status === 'resolved').length,
    urgent: normalizedConcerns.filter(
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

  const selectedConcern = normalizedConcerns.find((c: any) => c.id === selectedConcernId);

  // Departments list strictly from the official Departments section (no foreign or non-department categories)
  const folderDepartments = useMemo(() => {
    return localDepartments.filter((d) => d && d !== 'CITE');
  }, [localDepartments]);

  // Visual folder color themes per department with unit codes and glow accents
  const deptFolderThemes: Record<
    string,
    {
      code: string;
      border: string;
      badgeBg: string;
      badgeText: string;
      iconBg: string;
      iconText: string;
      gradient: string;
      progressGradient: string;
      glow: string;
    }
  > = {
    'Academic Affairs': {
      code: 'ACAD-01',
      border: 'hover:border-blue-500/70 hover:shadow-blue-500/15',
      badgeBg: 'bg-blue-50 dark:bg-blue-500/15',
      badgeText: 'text-blue-700 dark:text-blue-300 border-blue-200 dark:border-blue-500/30',
      iconBg: 'bg-gradient-to-br from-blue-500 to-indigo-600 text-white shadow-md shadow-blue-500/25',
      iconText: 'text-white',
      gradient: 'from-blue-600 to-indigo-600',
      progressGradient: 'from-blue-500 via-indigo-500 to-sky-400',
      glow: 'bg-blue-500/10 dark:bg-blue-500/20'
    },
    'Registrar': {
      code: 'REG-02',
      border: 'hover:border-emerald-500/70 hover:shadow-emerald-500/15',
      badgeBg: 'bg-emerald-50 dark:bg-emerald-500/15',
      badgeText: 'text-emerald-700 dark:text-emerald-300 border-emerald-200 dark:border-emerald-500/30',
      iconBg: 'bg-gradient-to-br from-emerald-500 to-teal-600 text-white shadow-md shadow-emerald-500/25',
      iconText: 'text-white',
      gradient: 'from-emerald-600 to-teal-600',
      progressGradient: 'from-emerald-500 via-teal-500 to-cyan-400',
      glow: 'bg-emerald-500/10 dark:bg-emerald-500/20'
    },
    'Maintenance': {
      code: 'MAINT-03',
      border: 'hover:border-amber-500/70 hover:shadow-amber-500/15',
      badgeBg: 'bg-amber-50 dark:bg-amber-500/15',
      badgeText: 'text-amber-700 dark:text-amber-300 border-amber-200 dark:border-amber-500/30',
      iconBg: 'bg-gradient-to-br from-amber-500 to-orange-600 text-white shadow-md shadow-amber-500/25',
      iconText: 'text-white',
      gradient: 'from-amber-600 to-orange-600',
      progressGradient: 'from-amber-500 via-orange-500 to-yellow-400',
      glow: 'bg-amber-500/10 dark:bg-amber-500/20'
    },
    'Student Affairs': {
      code: 'OSA-04',
      border: 'hover:border-purple-500/70 hover:shadow-purple-500/15',
      badgeBg: 'bg-purple-50 dark:bg-purple-500/15',
      badgeText: 'text-purple-700 dark:text-purple-300 border-purple-200 dark:border-purple-500/30',
      iconBg: 'bg-gradient-to-br from-purple-500 to-violet-600 text-white shadow-md shadow-purple-500/25',
      iconText: 'text-white',
      gradient: 'from-purple-600 to-violet-600',
      progressGradient: 'from-purple-500 via-violet-500 to-indigo-400',
      glow: 'bg-purple-500/10 dark:bg-purple-500/20'
    },
    'Administration': {
      code: 'ADMIN-05',
      border: 'hover:border-sky-500/70 hover:shadow-sky-500/15',
      badgeBg: 'bg-sky-50 dark:bg-sky-500/15',
      badgeText: 'text-sky-700 dark:text-sky-300 border-sky-200 dark:border-sky-500/30',
      iconBg: 'bg-gradient-to-br from-sky-500 to-blue-600 text-white shadow-md shadow-sky-500/25',
      iconText: 'text-white',
      gradient: 'from-sky-600 to-blue-600',
      progressGradient: 'from-sky-500 via-blue-500 to-cyan-400',
      glow: 'bg-sky-500/10 dark:bg-sky-500/20'
    },
    'IT Support': {
      code: 'IT-06',
      border: 'hover:border-cyan-500/70 hover:shadow-cyan-500/15',
      badgeBg: 'bg-cyan-50 dark:bg-cyan-500/15',
      badgeText: 'text-cyan-700 dark:text-cyan-300 border-cyan-200 dark:border-cyan-500/30',
      iconBg: 'bg-gradient-to-br from-cyan-500 to-teal-600 text-white shadow-md shadow-cyan-500/25',
      iconText: 'text-white',
      gradient: 'from-cyan-600 to-teal-600',
      progressGradient: 'from-cyan-500 via-teal-500 to-emerald-400',
      glow: 'bg-cyan-500/10 dark:bg-cyan-500/20'
    },
    'Finance': {
      code: 'FIN-07',
      border: 'hover:border-rose-500/70 hover:shadow-rose-500/15',
      badgeBg: 'bg-rose-50 dark:bg-rose-500/15',
      badgeText: 'text-rose-700 dark:text-rose-300 border-rose-200 dark:border-rose-500/30',
      iconBg: 'bg-gradient-to-br from-rose-500 to-pink-600 text-white shadow-md shadow-rose-500/25',
      iconText: 'text-white',
      gradient: 'from-rose-600 to-pink-600',
      progressGradient: 'from-rose-500 via-pink-500 to-red-400',
      glow: 'bg-rose-500/10 dark:bg-rose-500/20'
    }
  };

  const defaultDeptFolderTheme = {
    code: 'UNIT',
    border: 'hover:border-sky-500/70 hover:shadow-sky-500/15',
    badgeBg: 'bg-sky-50 dark:bg-sky-500/15',
    badgeText: 'text-sky-700 dark:text-sky-300 border-sky-200 dark:border-sky-500/30',
    iconBg: 'bg-gradient-to-br from-slate-600 to-slate-800 text-white shadow-md',
    iconText: 'text-white',
    gradient: 'from-slate-700 to-slate-900',
    progressGradient: 'from-sky-500 to-blue-500',
    glow: 'bg-slate-500/10'
  };

  const getDeptIcon = (dept: string) => {
    switch (dept) {
      case 'Academic Affairs':
        return <GraduationCapIcon className="h-5 w-5" />;
      case 'Registrar':
        return <ClipboardListIcon className="h-5 w-5" />;
      case 'Maintenance':
        return <WrenchIcon className="h-5 w-5" />;
      case 'Student Affairs':
        return <UsersIcon className="h-5 w-5" />;
      case 'Administration':
        return <BuildingIcon className="h-5 w-5" />;
      case 'IT Support':
        return <LaptopIcon className="h-5 w-5" />;
      case 'Finance':
        return <CreditCardIcon className="h-5 w-5" />;
      default:
        return <BuildingIcon className="h-5 w-5" />;
    }
  };

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
      onSelectConcern={setSelectedConcernId}
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
          className="space-y-6"
        >
          {/* Executive Clean Header Card */}
          <motion.div
            variants={itemVariants}
            className="relative overflow-hidden rounded-3xl border border-slate-200/80 dark:border-white/10 bg-white dark:bg-dark-800 p-6 sm:p-7 shadow-xs isolate"
          >
            {/* Subtle decorative ambient backdrop */}
            <div className="absolute -top-24 -right-24 w-96 h-96 bg-gradient-to-br from-sky-400/10 via-indigo-500/5 to-transparent rounded-full blur-3xl pointer-events-none -z-10" />

            <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6">
              {/* Left: Section Identity */}
              <div className="space-y-2 max-w-xl">
                <div className="flex items-center gap-2 flex-wrap">
                  <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-sky-50 dark:bg-sky-500/10 text-sky-700 dark:text-sky-300 border border-sky-200/80 dark:border-sky-500/20 shadow-2xs">
                    <BuildingIcon className="h-3.5 w-3.5" />
                    <span>Campus Operations Directory</span>
                  </span>
                  <span className="text-xs font-medium text-slate-400 dark:text-gray-500">
                    •
                  </span>
                  <span className="text-xs font-medium text-slate-500 dark:text-gray-400">
                    {folderDepartments.length} Active Departments
                  </span>
                </div>

                <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 dark:text-white tracking-tight flex items-center gap-3">
                  <span>All Concerns</span>
                </h1>
                <p className="text-xs sm:text-sm text-slate-600 dark:text-gray-300 leading-relaxed">
                  Campus student concerns organized into active department folders. Click any department folder to view tickets, review AI triaging, and confirm assignments.
                </p>
              </div>

              {/* Right: Sleek Metric Micro-Cards */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5 sm:gap-3 lg:shrink-0">
                <div className="p-3.5 rounded-2xl bg-slate-50/80 dark:bg-white/[0.03] border border-slate-200/70 dark:border-white/5 flex flex-col justify-between min-w-[105px] transition-all hover:border-slate-300 dark:hover:border-white/10">
                  <div className="flex items-center justify-between text-slate-400">
                    <span className="text-[11px] font-semibold text-slate-500 dark:text-gray-400">Total</span>
                    <FileTextIcon className="h-3.5 w-3.5 text-sky-500" />
                  </div>
                  <div className="text-xl sm:text-2xl font-black text-slate-900 dark:text-white mt-1.5">
                    {normalizedConcerns.length}
                  </div>
                </div>

                <div className="p-3.5 rounded-2xl bg-amber-50/50 dark:bg-amber-500/5 border border-amber-200/60 dark:border-amber-500/15 flex flex-col justify-between min-w-[105px] transition-all hover:border-amber-300 dark:hover:border-amber-500/30">
                  <div className="flex items-center justify-between text-slate-400">
                    <span className="text-[11px] font-semibold text-amber-700 dark:text-amber-300">Review</span>
                    <SparklesIcon className="h-3.5 w-3.5 text-amber-500 animate-pulse" />
                  </div>
                  <div className="text-xl sm:text-2xl font-black text-amber-600 dark:text-amber-400 mt-1.5">
                    {pendingReviewCount}
                  </div>
                </div>

                <div className="p-3.5 rounded-2xl bg-rose-50/50 dark:bg-rose-500/5 border border-rose-200/60 dark:border-rose-500/15 flex flex-col justify-between min-w-[105px] transition-all hover:border-rose-300 dark:hover:border-rose-500/30">
                  <div className="flex items-center justify-between text-slate-400">
                    <span className="text-[11px] font-semibold text-rose-700 dark:text-rose-300">Urgent</span>
                    <AlertTriangleIcon className="h-3.5 w-3.5 text-rose-500" />
                  </div>
                  <div className="text-xl sm:text-2xl font-black text-rose-600 dark:text-rose-400 mt-1.5">
                    {stats.urgent}
                  </div>
                </div>

                <div className="p-3.5 rounded-2xl bg-emerald-50/50 dark:bg-emerald-500/5 border border-emerald-200/60 dark:border-emerald-500/15 flex flex-col justify-between min-w-[105px] transition-all hover:border-emerald-300 dark:hover:border-emerald-500/30">
                  <div className="flex items-center justify-between text-slate-400">
                    <span className="text-[11px] font-semibold text-emerald-700 dark:text-emerald-300">Resolved</span>
                    <CheckCircle2Icon className="h-3.5 w-3.5 text-emerald-500" />
                  </div>
                  <div className="text-xl sm:text-2xl font-black text-emerald-600 dark:text-emerald-400 mt-1.5">
                    {Math.round((stats.resolved / (normalizedConcerns.length || 1)) * 100)}%
                  </div>
                </div>
              </div>
            </div>
          </motion.div>

          {/* Clean Integrated Controls Toolbar */}
          <motion.div
            variants={itemVariants}
            className="flex flex-col lg:flex-row items-stretch lg:items-center justify-between gap-3.5"
          >
            {/* Left: Modern Search Input */}
            <div className="relative flex-1 max-w-md">
              <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none">
                <SearchIcon className="h-4 w-4 text-slate-400 dark:text-gray-500" />
              </div>
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search title, ID, student, category..."
                className="block w-full pl-10 pr-9 bg-white dark:bg-dark-800 border border-slate-200/90 dark:border-white/10 rounded-2xl py-2.5 text-xs sm:text-sm text-slate-900 dark:text-white placeholder-slate-400 dark:placeholder-gray-500 focus:outline-none focus:border-sky-500 focus:ring-2 focus:ring-sky-500/20 shadow-xs transition-all"
              />
              {searchQuery && (
                <button
                  type="button"
                  onClick={() => setSearchQuery('')}
                  aria-label="Clear search"
                  className="absolute inset-y-0 right-0 pr-3 flex items-center text-slate-400 hover:text-slate-600 dark:hover:text-white"
                >
                  <XCircleIcon className="h-4 w-4" />
                </button>
              )}
            </div>

            {/* Right: Quick Status Filter Pills & View Switcher */}
            <div className="flex flex-wrap items-center gap-2.5">
              {/* Quick Status Chips */}
              <div className="flex items-center gap-1.5 flex-wrap">
                <button
                  type="button"
                  onClick={() => setFilterStatus('all')}
                  className={`px-3 py-1.5 rounded-xl text-xs font-semibold transition-all flex items-center gap-1.5 ${
                    filterStatus === 'all'
                      ? 'bg-sky-600 text-white dark:bg-sky-500 dark:text-white shadow-xs ring-2 ring-sky-500/25'
                      : 'bg-white dark:bg-dark-800 text-slate-700 dark:text-gray-300 border border-slate-200/90 dark:border-white/10 hover:border-slate-300 dark:hover:border-white/20 hover:bg-slate-50 dark:hover:bg-white/[0.03]'
                  }`}
                >
                  <span>All</span>
                  <span
                    className={`px-1.5 py-0.2 rounded-md text-[10px] font-bold ${
                      filterStatus === 'all'
                        ? 'bg-white/25 text-white'
                        : 'bg-slate-100 dark:bg-white/10 text-slate-600 dark:text-gray-400'
                    }`}
                  >
                    {normalizedConcerns.length}
                  </span>
                </button>

                {pendingReviewCount > 0 && (
                  <button
                    type="button"
                    onClick={() => setFilterStatus('pending-review')}
                    className={`px-3 py-1.5 rounded-xl text-xs font-semibold transition-all flex items-center gap-1.5 ${
                      filterStatus === 'pending-review'
                        ? 'bg-amber-500 text-white dark:bg-amber-500 dark:text-white shadow-xs ring-2 ring-amber-500/25'
                        : 'bg-white dark:bg-dark-800 text-slate-700 dark:text-gray-300 border border-slate-200/90 dark:border-white/10 hover:border-amber-300 dark:hover:border-amber-500/30'
                    }`}
                  >
                    <SparklesIcon className="h-3 w-3 shrink-0 text-amber-500" />
                    <span>Review</span>
                    <span
                      className={`px-1.5 py-0.2 rounded-md text-[10px] font-bold ${
                        filterStatus === 'pending-review'
                          ? 'bg-white/25 text-white'
                          : 'bg-amber-100/90 dark:bg-amber-500/20 text-amber-900 dark:text-amber-200'
                      }`}
                    >
                      {pendingReviewCount}
                    </span>
                  </button>
                )}

                {stats.urgent > 0 && (
                  <button
                    type="button"
                    onClick={() => setFilterStatus('urgent')}
                    className={`px-3 py-1.5 rounded-xl text-xs font-semibold transition-all flex items-center gap-1.5 ${
                      filterStatus === 'urgent'
                        ? 'bg-rose-500 text-white dark:bg-rose-500 dark:text-white shadow-xs ring-2 ring-rose-500/25'
                        : 'bg-white dark:bg-dark-800 text-slate-700 dark:text-gray-300 border border-slate-200/90 dark:border-white/10 hover:border-rose-300 dark:hover:border-rose-500/30'
                    }`}
                  >
                    <AlertTriangleIcon className="h-3 w-3 shrink-0 text-rose-500" />
                    <span>Urgent</span>
                    <span
                      className={`px-1.5 py-0.2 rounded-md text-[10px] font-bold ${
                        filterStatus === 'urgent'
                          ? 'bg-white/25 text-white'
                          : 'bg-rose-100/90 dark:bg-rose-500/20 text-rose-900 dark:text-rose-200'
                      }`}
                    >
                      {stats.urgent}
                    </span>
                  </button>
                )}

                <button
                  type="button"
                  onClick={() => setFilterStatus('resolved')}
                  className={`px-3 py-1.5 rounded-xl text-xs font-semibold transition-all flex items-center gap-1.5 ${
                    filterStatus === 'resolved'
                      ? 'bg-emerald-600 text-white dark:bg-emerald-500 dark:text-white shadow-xs ring-2 ring-emerald-500/25'
                      : 'bg-white dark:bg-dark-800 text-slate-700 dark:text-gray-300 border border-slate-200/90 dark:border-white/10 hover:border-emerald-300 dark:hover:border-emerald-500/30'
                  }`}
                >
                  <CheckCircle2Icon className="h-3 w-3 shrink-0 text-emerald-500" />
                  <span>Resolved</span>
                  <span
                    className={`px-1.5 py-0.2 rounded-md text-[10px] font-bold ${
                      filterStatus === 'resolved'
                        ? 'bg-white/25 text-white'
                        : 'bg-emerald-100/90 dark:bg-emerald-500/20 text-emerald-900 dark:text-emerald-200'
                    }`}
                  >
                    {stats.resolved}
                  </span>
                </button>
              </div>

              {/* Status Select dropdown for additional filters */}
              <CustomSelect
                value={filterStatus}
                onChange={(val) => setFilterStatus(val as any)}
                options={statusFilterOptions}
                className="w-full sm:w-auto sm:min-w-[170px]"
                align="right"
              />

              {/* View Switcher: Folders vs Feed */}
              <div className="flex items-center bg-slate-100 dark:bg-white/5 p-1 rounded-2xl border border-slate-200/80 dark:border-white/10 text-xs font-semibold shrink-0">
                <button
                  type="button"
                  onClick={() => setConcernsViewMode('folders')}
                  className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl transition-all ${
                    concernsViewMode === 'folders'
                      ? 'bg-white dark:bg-dark-700 text-sky-600 dark:text-sky-400 shadow-xs font-bold'
                      : 'text-slate-600 dark:text-gray-400 hover:text-slate-900 dark:hover:text-white'
                  }`}
                >
                  <LayoutGridIcon className="h-3.5 w-3.5" />
                  <span>Folders</span>
                </button>
                <button
                  type="button"
                  onClick={() => setConcernsViewMode('feed')}
                  className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl transition-all ${
                    concernsViewMode === 'feed'
                      ? 'bg-white dark:bg-dark-700 text-sky-600 dark:text-sky-400 shadow-xs font-bold'
                      : 'text-slate-600 dark:text-gray-400 hover:text-slate-900 dark:hover:text-white'
                  }`}
                >
                  <ListIcon className="h-3.5 w-3.5" />
                  <span>Feed</span>
                  {filteredConcerns.length > 0 && (
                    <span
                      className={`px-1.5 py-0.2 rounded-md text-[10px] font-bold ${
                        concernsViewMode === 'feed'
                          ? 'bg-sky-100 dark:bg-sky-500/20 text-sky-700 dark:text-sky-300'
                          : 'bg-slate-200/80 dark:bg-white/10 text-slate-700 dark:text-gray-300'
                      }`}
                    >
                      {filteredConcerns.length}
                    </span>
                  )}
                </button>
              </div>
            </div>
          </motion.div>

          {/* VIEW MODE 1: CLEAN DEPARTMENT FOLDERS GRID */}
          {concernsViewMode === 'folders' && (
            <motion.div variants={itemVariants} className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5 sm:gap-6">
                {folderDepartments.map((dept) => {
                  const theme = deptFolderThemes[dept] || defaultDeptFolderTheme;
                  const deptConcerns = normalizedConcerns.filter(
                    (c: any) => c.department === dept
                  );
                  const matchingConcerns = filteredConcerns.filter(
                    (c: any) => c.department === dept
                  );
                  const pendingCount = deptConcerns.filter(
                    (c: any) => c.adminReviewStatus === 'pending' || !c.isConfirmed
                  ).length;
                  const urgentCount = deptConcerns.filter(
                    (c: any) => c.priority === 'urgent' || c.priority === 'high'
                  ).length;
                  const resolvedCount = deptConcerns.filter(
                    (c: any) => c.status === 'resolved'
                  ).length;
                  const inProgressCount = deptConcerns.filter(
                    (c: any) => c.status === 'in-progress'
                  ).length;
                  const total = deptConcerns.length;
                  const resolutionPct =
                    total > 0
                      ? Math.round((resolvedCount / total) * 100)
                      : 0;
                  const urgentPct = total > 0 ? (urgentCount / total) * 100 : 0;
                  const pendingPct = total > 0 ? (pendingCount / total) * 100 : 0;
                  const inProgressPct = total > 0 ? (inProgressCount / total) * 100 : 0;
                  const resolvedPct = total > 0 ? (resolvedCount / total) * 100 : 0;

                  const isFiltered = searchQuery.trim() !== '' || filterStatus !== 'all';
                  const isDimmed = isFiltered && matchingConcerns.length === 0;

                  return (
                    <motion.div
                      key={dept}
                      whileHover={{ y: -4 }}
                      transition={{ duration: 0.2, ease: 'easeOut' }}
                      onClick={() => setActiveDepartmentFolder(dept)}
                      role="button"
                      tabIndex={0}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter' || e.key === ' ') {
                          e.preventDefault();
                          setActiveDepartmentFolder(dept);
                        }
                      }}
                      className={`group cursor-pointer select-none rounded-3xl border border-slate-200/90 dark:border-white/10 ${theme.border} bg-white dark:bg-dark-800 shadow-xs hover:shadow-xl dark:shadow-none dark:hover:shadow-2xl transition-all duration-300 relative overflow-hidden flex flex-col justify-between focus:outline-none focus:ring-2 focus:ring-sky-500/30 ${
                        isDimmed ? 'opacity-40 hover:opacity-100' : 'opacity-100'
                      }`}
                    >
                      {/* Department Signature Top Stripe - Sleek 3px accent line */}
                      <div className={`h-[3px] w-full bg-gradient-to-r ${theme.gradient} transition-all duration-300 group-hover:h-1`} />

                      {/* Ambient Department Glow on Hover */}
                      <div
                        className={`absolute top-0 right-0 w-44 h-44 ${theme.glow} rounded-full blur-3xl pointer-events-none transition-opacity duration-300 group-hover:opacity-100 opacity-20 dark:opacity-30`}
                      />

                      <div className="p-6 flex flex-col justify-between flex-1 space-y-4">
                        {/* Card Top: Department Icon, Unit Code & Matches */}
                        <div>
                          <div className="flex items-start justify-between gap-3 mb-3.5">
                            <div
                              className={`w-11 h-11 rounded-2xl ${theme.iconBg} flex items-center justify-center shrink-0 border border-white/20 shadow-xs transition-transform duration-200 group-hover:scale-105`}
                            >
                              {getDeptIcon(dept)}
                            </div>

                            <div className="flex items-center gap-2">
                              {urgentCount > 0 && (
                                <span className="inline-flex items-center gap-1 text-[10px] font-bold px-2 py-0.5 rounded-full bg-rose-50 dark:bg-rose-500/15 text-rose-700 dark:text-rose-300 border border-rose-200/80 dark:border-rose-500/30">
                                  <span className="w-1.5 h-1.5 rounded-full bg-rose-500 shrink-0" />
                                  <span>{urgentCount} urgent</span>
                                </span>
                              )}
                              {isFiltered && (
                                <span
                                  className={`text-[11px] font-bold px-2.5 py-0.5 rounded-full border shrink-0 ${
                                    matchingConcerns.length > 0
                                      ? 'bg-sky-50 dark:bg-sky-500/15 text-sky-700 dark:text-sky-300 border-sky-200 dark:border-sky-500/30'
                                      : 'bg-slate-100 dark:bg-white/5 text-slate-500 dark:text-gray-400 border-slate-200 dark:border-white/10'
                                  }`}
                                >
                                  {matchingConcerns.length} match
                                </span>
                              )}
                              <span className="text-[11px] font-mono font-bold tracking-wider px-2 py-0.5 rounded-lg bg-slate-100 dark:bg-white/5 text-slate-700 dark:text-gray-300 border border-slate-200/80 dark:border-white/10">
                                {theme.code}
                              </span>
                            </div>
                          </div>

                          {/* Department Title & Total Tickets */}
                          <h3 className="font-extrabold text-slate-900 dark:text-white text-base sm:text-lg truncate group-hover:text-sky-600 dark:group-hover:text-sky-400 transition-colors">
                            {dept}
                          </h3>
                          <p className="text-xs text-slate-500 dark:text-gray-400 truncate mt-0.5 font-medium">
                            {total} {total === 1 ? 'student ticket logged' : 'student tickets logged'}
                          </p>

                          {/* Sleek Ticket Distribution Bar & Clean Inline Indicators */}
                          <div className="space-y-3 my-3.5">
                            {/* Proportional breakdown bar */}
                            <div className="h-2 w-full rounded-full bg-slate-100 dark:bg-white/10 overflow-hidden flex gap-0.5">
                              {total === 0 ? (
                                <div className="w-full h-full bg-slate-200/50 dark:bg-white/5 rounded-full" />
                              ) : (
                                <>
                                  {urgentCount > 0 && (
                                    <div
                                      className="h-full bg-rose-500 transition-all duration-500 first:rounded-l-full last:rounded-r-full"
                                      style={{ width: `${urgentPct}%` }}
                                      title={`${urgentCount} Urgent`}
                                    />
                                  )}
                                  {pendingCount > 0 && (
                                    <div
                                      className="h-full bg-amber-400 transition-all duration-500 first:rounded-l-full last:rounded-r-full"
                                      style={{ width: `${pendingPct}%` }}
                                      title={`${pendingCount} Review`}
                                    />
                                  )}
                                  {inProgressCount > 0 && (
                                    <div
                                      className="h-full bg-sky-500 transition-all duration-500 first:rounded-l-full last:rounded-r-full"
                                      style={{ width: `${inProgressPct}%` }}
                                      title={`${inProgressCount} Active`}
                                    />
                                  )}
                                  {resolvedCount > 0 && (
                                    <div
                                      className="h-full bg-emerald-500 transition-all duration-500 first:rounded-l-full last:rounded-r-full"
                                      style={{ width: `${resolvedPct}%` }}
                                      title={`${resolvedCount} Resolved`}
                                    />
                                  )}
                                </>
                              )}
                            </div>

                            {/* Clean inline stats row - No Clunky Nested Boxes */}
                            <div className="grid grid-cols-2 gap-x-3 gap-y-2 text-xs">
                              <div className="flex items-center justify-between">
                                <span className="flex items-center gap-1.5 text-slate-600 dark:text-gray-400 font-medium">
                                  <span
                                    className={`w-2 h-2 rounded-full shrink-0 ${
                                      pendingCount > 0 ? 'bg-amber-500 animate-pulse' : 'bg-slate-300 dark:bg-white/20'
                                    }`}
                                  />
                                  <span>Review</span>
                                </span>
                                <span
                                  className={`font-semibold ${
                                    pendingCount > 0
                                      ? 'text-amber-700 dark:text-amber-300 font-bold'
                                      : 'text-slate-400 dark:text-gray-500'
                                  }`}
                                >
                                  {pendingCount}
                                </span>
                              </div>

                              <div className="flex items-center justify-between">
                                <span className="flex items-center gap-1.5 text-slate-600 dark:text-gray-400 font-medium">
                                  <span
                                    className={`w-2 h-2 rounded-full shrink-0 ${
                                      urgentCount > 0 ? 'bg-rose-500' : 'bg-slate-300 dark:bg-white/20'
                                    }`}
                                  />
                                  <span>Urgent</span>
                                </span>
                                <span
                                  className={`font-semibold ${
                                    urgentCount > 0
                                      ? 'text-rose-700 dark:text-rose-300 font-bold'
                                      : 'text-slate-400 dark:text-gray-500'
                                  }`}
                                >
                                  {urgentCount}
                                </span>
                              </div>

                              <div className="flex items-center justify-between">
                                <span className="flex items-center gap-1.5 text-slate-600 dark:text-gray-400 font-medium">
                                  <span
                                    className={`w-2 h-2 rounded-full shrink-0 ${
                                      inProgressCount > 0 ? 'bg-sky-500' : 'bg-slate-300 dark:bg-white/20'
                                    }`}
                                  />
                                  <span>Active</span>
                                </span>
                                <span
                                  className={`font-semibold ${
                                    inProgressCount > 0
                                      ? 'text-sky-700 dark:text-sky-300 font-bold'
                                      : 'text-slate-400 dark:text-gray-500'
                                  }`}
                                >
                                  {inProgressCount}
                                </span>
                              </div>

                              <div className="flex items-center justify-between">
                                <span className="flex items-center gap-1.5 text-slate-600 dark:text-gray-400 font-medium">
                                  <span
                                    className={`w-2 h-2 rounded-full shrink-0 ${
                                      resolvedCount > 0 ? 'bg-emerald-500' : 'bg-slate-300 dark:bg-white/20'
                                    }`}
                                  />
                                  <span>Resolved</span>
                                </span>
                                <span
                                  className={`font-semibold ${
                                    resolvedCount > 0
                                      ? 'text-emerald-700 dark:text-emerald-300 font-bold'
                                      : 'text-slate-400 dark:text-gray-500'
                                  }`}
                                >
                                  {resolvedCount}
                                </span>
                              </div>
                            </div>
                          </div>
                        </div>

                        {/* Bottom: Resolution Status & Interactive View Action */}
                        <div className="pt-3.5 mt-auto border-t border-slate-100 dark:border-white/5 flex items-center justify-between">
                          <div className="flex items-center gap-1.5 text-xs text-slate-500 dark:text-gray-400 font-medium">
                            <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 shrink-0" />
                            <span>Resolution</span>
                            <span className="font-bold text-slate-700 dark:text-gray-200">
                              {resolutionPct}%
                            </span>
                          </div>

                          <div className="flex items-center gap-1 text-xs font-semibold text-slate-600 dark:text-gray-300 group-hover:text-sky-600 dark:group-hover:text-sky-400 transition-colors">
                            <span>View tickets</span>
                            <ArrowRightIcon className="h-3.5 w-3.5 transform group-hover:translate-x-1 transition-transform" />
                          </div>
                        </div>
                      </div>
                    </motion.div>
                  );
                })}
              </div>
            </motion.div>
          )}

          {/* VIEW MODE 2: DIRECT ALL TICKETS FEED */}
          {concernsViewMode === 'feed' && (
            <motion.div variants={itemVariants} className="space-y-4">
              <div className="flex items-center justify-between px-1">
                <span className="text-xs font-bold text-slate-700 dark:text-gray-300">
                  Showing {filteredConcerns.length} of {normalizedConcerns.length} concerns across all departments
                </span>
                {(searchQuery || filterStatus !== 'all') && (
                  <button
                    type="button"
                    onClick={() => {
                      setSearchQuery('');
                      setFilterStatus('all');
                    }}
                    className="text-xs text-sky-600 dark:text-sky-400 hover:underline font-semibold"
                  >
                    Clear Filters
                  </button>
                )}
              </div>

              {filteredConcerns.length === 0 ? (
                <div className="text-center py-16 px-4 bg-white dark:bg-dark-800 rounded-3xl border border-slate-200/80 dark:border-white/10 space-y-3">
                  <div className="w-12 h-12 rounded-2xl bg-sky-50 dark:bg-sky-500/10 text-sky-600 dark:text-sky-400 mx-auto flex items-center justify-center">
                    <SearchIcon className="h-6 w-6" />
                  </div>
                  <h3 className="text-base font-bold text-slate-900 dark:text-white">
                    No concerns match your search or filter
                  </h3>
                  <p className="text-xs text-slate-500 dark:text-gray-400 max-w-sm mx-auto">
                    Try adjusting your search query or selecting a different status filter to view campus concerns.
                  </p>
                  <button
                    type="button"
                    onClick={() => {
                      setSearchQuery('');
                      setFilterStatus('all');
                    }}
                    className="px-4 py-2 text-xs font-semibold rounded-xl bg-sky-600 text-white hover:bg-sky-700 transition-colors shadow-xs"
                  >
                    Reset Filters
                  </button>
                </div>
              ) : (
                <div className="space-y-4">
                  {filteredConcerns.map((concern: any) => (
                    <AdminConcernCard
                      key={concern.id}
                      concern={concern}
                      formatDate={formatDate}
                      onSelectConcern={setSelectedConcernId}
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
              )}
            </motion.div>
          )}
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

      {/* Department Concerns Modal */}
      <DepartmentConcernsModal
        isOpen={Boolean(activeDepartmentFolder)}
        department={activeDepartmentFolder}
        onClose={() => setActiveDepartmentFolder(null)}
        concerns={normalizedConcerns}
        onSelectConcern={setSelectedConcernId}
        formatDate={formatDate}
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