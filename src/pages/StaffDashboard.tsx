import { useState } from 'react';
import { motion } from 'framer-motion';
import { User, ConcernStatus } from '../types';
import { DashboardLayout } from '../components/DashboardLayout';
import { StatCard } from '../components/StatCard';
import { ConcernCard } from '../components/ConcernCard';
import { ConcernDetail } from '../components/ConcernDetail';
import { ProfileSection } from '../components/ProfileSection';
import {
  InboxIcon,
  ClockIcon,
  CheckCircle2Icon,
  SearchIcon,
  FilterIcon,
  XIcon,
  UserCheckIcon,
  ArrowRightIcon
} from 'lucide-react';
import { toast } from 'sonner';

interface StaffDashboardProps {
  user: User;
  onLogout: () => void;
  onNavigate: (page: string) => void;
  concernsData: any;
  onUpdateUser?: (data: Partial<User>) => Promise<void>;
}

function getGreeting() {
  const hour = new Date().getHours();
  if (hour < 12) return 'Good morning';
  if (hour < 18) return 'Good afternoon';
  return 'Good evening';
}

export function StaffDashboard({
  user,
  onLogout,
  onNavigate,
  concernsData,
  onUpdateUser
}: StaffDashboardProps) {
  const [activeTab, setActiveTab] = useState('dashboard');
  const [selectedConcernId, setSelectedConcernId] = useState<string | null>(null);
  const [filterStatus, setFilterStatus] = useState<ConcernStatus | 'all'>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const { concerns, updateStatus, addComment, forwardConcern } = concernsData;

  // Staff sees department concerns plus any concerns assigned to them (even cross-department).
  const deptConcerns = concerns.filter((c: any) => c.department === user.department);
  const assignedConcerns = concerns.filter((c: any) => c.assignedTo === user.id);
  const targetConcerns = activeTab === 'assigned' ? assignedConcerns : deptConcerns;

  const filteredConcerns = targetConcerns.filter((c: any) => {
    const matchesStatus = filterStatus === 'all' || c.status === filterStatus;
    const q = searchQuery.toLowerCase().trim();
    if (!q) return matchesStatus;
    const matchesSearch =
      c.title?.toLowerCase().includes(q) ||
      c.id?.toLowerCase().includes(q) ||
      c.studentName?.toLowerCase().includes(q) ||
      c.description?.toLowerCase().includes(q) ||
      c.category?.toLowerCase().includes(q) ||
      c.subcategory?.toLowerCase().includes(q);
    return matchesStatus && matchesSearch;
  });

  const recentAssigned = [...assignedConcerns]
    .sort((a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime())
    .slice(0, 3);

  const stats = {
    totalDept: deptConcerns.length,
    assigned: assignedConcerns.length,
    pending: deptConcerns.filter((c: any) => c.status === 'pending').length,
    resolved: deptConcerns.filter((c: any) => c.status === 'resolved').length
  };

  const selectedConcern = concerns.find((c: any) => c.id === selectedConcernId);

  const filterPills = [
    {
      id: 'all' as const,
      label: 'All',
      count: targetConcerns.length,
      dot: 'bg-sky-500 dark:bg-sky-400'
    },
    {
      id: 'pending' as const,
      label: 'Pending',
      count: targetConcerns.filter((c: any) => c.status === 'pending').length,
      dot: 'bg-amber-500 dark:bg-amber-400'
    },
    {
      id: 'in-progress' as const,
      label: 'In Progress',
      count: targetConcerns.filter((c: any) => c.status === 'in-progress').length,
      dot: 'bg-sky-500 dark:bg-sky-400'
    },
    {
      id: 'resolved' as const,
      label: 'Resolved',
      count: targetConcerns.filter((c: any) => c.status === 'resolved').length,
      dot: 'bg-emerald-500 dark:bg-emerald-400'
    },
    {
      id: 'rejected' as const,
      label: 'Rejected',
      count: targetConcerns.filter((c: any) => c.status === 'rejected').length,
      dot: 'bg-rose-500 dark:bg-rose-400'
    }
  ];

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
      role="staff"
      activeTab={activeTab}
      onTabChange={(tab) => {
        setActiveTab(tab);
        setFilterStatus('all');
        setSearchQuery('');
      }}
      onLogout={onLogout}
      onNavigate={onNavigate}
      concernsData={concernsData}
    >
      {/* Dashboard Tab */}
      {activeTab === 'dashboard' && (
        <motion.div
          variants={containerVariants}
          initial="hidden"
          animate="show"
          className="space-y-6 sm:space-y-8"
        >
          {/* Hero Welcome Banner */}
          <motion.div
            variants={itemVariants}
            className="dashboard-hero-banner p-5 sm:p-7 rounded-2xl sm:rounded-3xl relative overflow-hidden flex flex-col md:flex-row md:items-center justify-between gap-5"
          >
            <div className="hero-bg-orb absolute top-0 right-0 w-80 h-80 rounded-full blur-3xl pointer-events-none -mr-20 -mt-20" />

            <div className="relative z-10 max-w-xl">
              <div className="hero-portal-badge inline-flex items-center gap-2 px-3 py-1 rounded-full text-xs font-semibold mb-3">
                <span className="h-2 w-2 rounded-full animate-pulse" />
                <span>{user.department || 'Academic Affairs'} Department · Staff Portal</span>
              </div>
              <h1 className="hero-title text-2xl sm:text-3xl font-extrabold tracking-tight leading-tight">
                {getGreeting()}, {user.name.split(' ')[0]}
              </h1>
              <p className="hero-subtitle text-xs sm:text-sm mt-2 leading-relaxed">
                {stats.assigned > 0
                  ? `You have ${stats.assigned} concern${
                      stats.assigned === 1 ? '' : 's'
                    } assigned directly to you and ${stats.pending} pending review across your department.`
                  : `You're all caught up on your personal queue. There are ${stats.pending} pending concerns in your department.`}
              </p>
            </div>
          </motion.div>

          {/* Interactive Stat Cards */}
          <motion.div
            variants={itemVariants}
            className="grid grid-cols-2 lg:grid-cols-4 gap-3.5 sm:gap-4"
          >
            <StatCard
              title="Dept. Concerns"
              value={stats.totalDept}
              icon={InboxIcon}
              color="blue"
              trend={{
                value: 15,
                isPositive: true
              }}
              onClick={() => {
                setFilterStatus('all');
                setSearchQuery('');
                setActiveTab('all-concerns');
              }}
              subtitle="All department tickets"
            />

            <StatCard
              title="Assigned to You"
              value={stats.assigned}
              icon={UserCheckIcon}
              color="purple"
              onClick={() => {
                setFilterStatus('all');
                setSearchQuery('');
                setActiveTab('assigned');
              }}
              subtitle="Your active workload"
            />

            <StatCard
              title="Pending Review"
              value={stats.pending}
              icon={ClockIcon}
              color="orange"
              onClick={() => {
                setFilterStatus('pending');
                setSearchQuery('');
                setActiveTab('all-concerns');
              }}
              subtitle="Needs staff review"
            />

            <StatCard
              title="Resolved"
              value={stats.resolved}
              icon={CheckCircle2Icon}
              color="green"
              onClick={() => {
                setFilterStatus('resolved');
                setSearchQuery('');
                setActiveTab('all-concerns');
              }}
              subtitle="Closed & completed"
            />
          </motion.div>

          {/* Recent Assignments Section */}
          <motion.div variants={itemVariants}>
            <div className="flex items-center justify-between mb-3 sm:mb-4">
              <div className="flex items-center gap-2.5">
                <h2 className="text-base sm:text-lg font-bold text-[var(--text-primary)]">
                  Your Recent Assignments
                </h2>
                <span className="dashboard-count-badge text-xs font-mono font-semibold px-2 py-0.5 rounded-full bg-sky-50 dark:bg-sky-500/10 text-sky-700 dark:text-sky-400 border border-sky-200 dark:border-sky-500/20">
                  {stats.assigned}
                </span>
              </div>
              {stats.assigned > 0 && (
                <button
                  onClick={() => {
                    setFilterStatus('all');
                    setSearchQuery('');
                    setActiveTab('assigned');
                  }}
                  className="dashboard-view-all text-xs sm:text-sm font-semibold text-sky-600 dark:text-sky-400 hover:text-sky-700 dark:hover:text-sky-300 transition-colors flex items-center gap-1 group"
                >
                  <span>View All Queue</span>
                  <ArrowRightIcon className="h-3.5 w-3.5 group-hover:translate-x-0.5 transition-transform" />
                </button>
              )}
            </div>

            {recentAssigned.length > 0 ? (
              <div className="space-y-3 sm:space-y-4">
                {recentAssigned.map((concern) => (
                  <motion.div
                    key={concern.id}
                    whileHover={{ scale: 1.008 }}
                    transition={{
                      type: 'spring',
                      stiffness: 300,
                      damping: 20
                    }}
                  >
                    <ConcernCard
                      concern={concern}
                      onClick={() => setSelectedConcernId(concern.id)}
                      showStudent={true}
                    />
                  </motion.div>
                ))}
              </div>
            ) : (
              <div className="glass-panel p-8 sm:p-12 text-center rounded-2xl border border-[var(--border-color)] flex flex-col items-center justify-center">
                <div className="h-14 w-14 rounded-2xl bg-emerald-50 dark:bg-emerald-500/10 border border-emerald-200 dark:border-emerald-500/20 flex items-center justify-center mb-3 text-emerald-600 dark:text-emerald-400">
                  <CheckCircle2Icon className="h-7 w-7" />
                </div>
                <h3 className="text-base sm:text-lg font-bold text-[var(--text-primary)] mb-1.5">
                  All caught up!
                </h3>
                <p className="text-xs sm:text-sm text-[var(--text-secondary)] max-w-md leading-relaxed mb-4">
                  You don't have any pending concerns currently assigned to your queue.
                </p>
                <button
                  onClick={() => {
                    setFilterStatus('pending');
                    setSearchQuery('');
                    setActiveTab('all-concerns');
                  }}
                  className="px-5 py-2.5 rounded-xl border border-sky-200 dark:border-sky-500/30 bg-sky-50 dark:bg-sky-500/10 hover:bg-sky-100 dark:hover:bg-sky-500/20 text-sky-700 dark:text-sky-400 text-xs sm:text-sm font-semibold transition-all active:scale-95 shadow-xs"
                >
                  Browse Department Queue ({stats.pending} pending)
                </button>
              </div>
            )}
          </motion.div>
        </motion.div>
      )}

      {/* Profile Tab */}
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

      {/* Assigned to Me & Department Concerns Tabs */}
      {(activeTab === 'assigned' || activeTab === 'all-concerns') && (
        <motion.div
          variants={containerVariants}
          initial="hidden"
          animate="show"
          className="space-y-5 sm:space-y-6"
        >
          {/* Header */}
          <motion.div
            variants={itemVariants}
            className="pb-1"
          >
            <h1 className="text-xl sm:text-2xl font-bold text-[var(--text-primary)]">
              {activeTab === 'assigned' ? 'Assigned to Me' : 'Department Concerns'}
            </h1>
            <p className="text-xs sm:text-sm text-[var(--text-secondary)] mt-1">
              {activeTab === 'assigned'
                ? 'Concerns directly assigned to you for review, status updates, and resolution.'
                : `All concerns submitted under the ${user.department || 'academic'} department.`}
            </p>
          </motion.div>

          {/* Search & Filter Toolbar */}
          <motion.div variants={itemVariants} className="space-y-3">
            <div className="relative flex-1">
              <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none">
                <SearchIcon className="h-4 w-4 text-[var(--text-muted)]" />
              </div>
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder={`Search ${activeTab === 'assigned' ? 'assigned' : 'department'} concerns by title, ID, category, or student...`}
                className="dashboard-search-input w-full pl-10 pr-9 py-2.5 bg-[var(--bg-secondary)] border border-[var(--border-color)] rounded-xl text-sm text-[var(--text-primary)] placeholder-[var(--text-muted)] focus:outline-none focus:border-sky-500 focus:ring-2 focus:ring-sky-500/20 transition-all shadow-inner"
              />
              {searchQuery && (
                <button
                  type="button"
                  onClick={() => setSearchQuery('')}
                  className="absolute inset-y-0 right-0 pr-3 flex items-center text-[var(--text-muted)] hover:text-[var(--text-primary)] transition-colors"
                >
                  <XIcon className="h-4 w-4" />
                </button>
              )}
            </div>

            {/* Segmented Filter Pills */}
            <div className="flex items-center gap-1.5 sm:gap-2 overflow-x-auto pb-1 custom-scrollbar">
              {filterPills.map((pill) => {
                const isActive = filterStatus === pill.id;
                return (
                  <button
                    key={pill.id}
                    type="button"
                    onClick={() => setFilterStatus(pill.id)}
                    className={`dashboard-filter-pill px-3 py-1.5 rounded-xl text-xs font-semibold flex items-center gap-1.5 transition-all shrink-0 active:scale-95 touch-manipulation ${
                      isActive
                        ? 'filter-pill--active bg-sky-500 text-white shadow-md shadow-sky-500/25 border border-sky-400'
                        : 'filter-pill--inactive bg-[var(--bg-secondary)] hover:bg-[var(--bg-tertiary)] text-[var(--text-secondary)] hover:text-[var(--text-primary)] border border-[var(--border-color)]'
                    }`}
                  >
                    <span
                      className={`h-2 w-2 rounded-full ${pill.dot} ${
                        isActive ? 'ring-2 ring-white/50' : ''
                      }`}
                    />
                    <span>{pill.label}</span>
                    <span
                      className={`filter-pill-count text-[10px] px-1.5 py-0.2 rounded-md font-mono ${
                        isActive
                          ? 'bg-white/20 text-white'
                          : 'bg-slate-100 dark:bg-[var(--bg-tertiary)] text-slate-600 dark:text-[var(--text-muted)]'
                      }`}
                    >
                      {pill.count}
                    </span>
                  </button>
                );
              })}
            </div>
          </motion.div>

          {/* List or Empty State */}
          <motion.div variants={itemVariants}>
            {filteredConcerns.length > 0 ? (
              <div className="space-y-3 sm:space-y-4">
                {filteredConcerns.map((concern: any) => (
                  <motion.div
                    key={concern.id}
                    whileHover={{ scale: 1.008 }}
                    transition={{
                      type: 'spring',
                      stiffness: 300,
                      damping: 20
                    }}
                  >
                    <ConcernCard
                      concern={concern}
                      onClick={() => setSelectedConcernId(concern.id)}
                      showStudent={true}
                    />
                  </motion.div>
                ))}
              </div>
            ) : (
              <div className="glass-panel p-8 sm:p-12 text-center rounded-2xl border border-[var(--border-color)] flex flex-col items-center justify-center">
                <div className="h-14 w-14 rounded-2xl bg-slate-100 dark:bg-white/5 border border-slate-200 dark:border-[var(--border-color)] flex items-center justify-center mb-3 text-slate-500 dark:text-[var(--text-muted)]">
                  <FilterIcon className="h-7 w-7" />
                </div>
                <h3 className="text-base sm:text-lg font-bold text-[var(--text-primary)] mb-1.5">
                  No matching concerns found
                </h3>
                <p className="text-xs sm:text-sm text-[var(--text-secondary)] max-w-md leading-relaxed mb-4">
                  {searchQuery || filterStatus !== 'all'
                    ? `No concerns match your search "${searchQuery || ''}" with status "${filterStatus}".`
                    : activeTab === 'assigned'
                      ? 'You currently have no concerns assigned to you.'
                      : 'There are no concerns in this department yet.'}
                </p>
                {(searchQuery || filterStatus !== 'all') && (
                  <button
                    onClick={() => {
                      setFilterStatus('all');
                      setSearchQuery('');
                    }}
                    className="px-4 py-2 rounded-xl border border-sky-200 dark:border-sky-500/30 bg-sky-50 dark:bg-sky-500/10 hover:bg-sky-100 dark:hover:bg-sky-500/20 text-sky-700 dark:text-sky-400 text-xs sm:text-sm font-semibold transition-all active:scale-95 shadow-xs"
                  >
                    Reset Search & Filters
                  </button>
                )}
              </div>
            )}
          </motion.div>
        </motion.div>
      )}

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
        onClose={() => setSelectedConcernId(null)}
      />
    </DashboardLayout>
  );
}