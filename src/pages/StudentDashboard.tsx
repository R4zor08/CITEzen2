import { useState } from 'react';
import { motion } from 'framer-motion';
import { User, ConcernStatus } from '../types';
import { DashboardLayout } from '../components/DashboardLayout';
import { StatCard } from '../components/StatCard';
import { ConcernCard } from '../components/ConcernCard';
import { ConcernForm } from '../components/ConcernForm';
import { ConcernDetail } from '../components/ConcernDetail';
import { ProfileSection } from '../components/ProfileSection';
import { ChatBubble } from '../components/ChatBubble';
import {
  FileTextIcon,
  ClockIcon,
  CheckCircle2Icon,
  AlertCircleIcon,
  SearchIcon,
  PlusCircleIcon,
  XIcon
} from 'lucide-react';
import { toast } from 'sonner';

interface StudentDashboardProps {
  user: User;
  onLogout: () => void;
  onNavigate: (page: string) => void;
  concernsData: any;
  onUpdateUser?: (data: Partial<User> & { password?: string }) => Promise<void>;
}

export function StudentDashboard({
  user,
  onLogout,
  onNavigate,
  concernsData,
  onUpdateUser
}: StudentDashboardProps) {
  const [activeTab, setActiveTab] = useState('dashboard');
  const [selectedConcernId, setSelectedConcernId] = useState<string | null>(null);
  const [filterStatus, setFilterStatus] = useState<ConcernStatus | 'all'>('all');
  const [searchQuery, setSearchQuery] = useState('');

  const { concerns, submitConcern, addComment } = concernsData;
  const myConcerns = concerns.filter((c: any) => c.studentId === user.id);

  const filteredConcerns = myConcerns.filter((c: any) => {
    const matchesStatus = filterStatus === 'all' || c.status === filterStatus;
    const matchesSearch =
      c.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      c.id.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (c.department && c.department.toLowerCase().includes(searchQuery.toLowerCase()));
    return matchesStatus && matchesSearch;
  });

  const recentConcerns = [...myConcerns]
    .sort(
      (a, b) =>
        new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
    )
    .slice(0, 3);

  const stats = {
    total: myConcerns.length,
    pending: myConcerns.filter((c: any) => c.status === 'pending').length,
    inProgress: myConcerns.filter((c: any) => c.status === 'in-progress').length,
    resolved: myConcerns.filter((c: any) => c.status === 'resolved').length
  };

  const getGreeting = () => {
    const hour = new Date().getHours();
    if (hour < 12) return 'Good morning';
    if (hour < 18) return 'Good afternoon';
    return 'Good evening';
  };

  const filterPills: { id: ConcernStatus | 'all'; label: string; count: number; dot: string }[] = [
    { id: 'all', label: 'All', count: stats.total, dot: 'bg-gray-400' },
    { id: 'pending', label: 'Pending', count: stats.pending, dot: 'bg-amber-400' },
    { id: 'in-progress', label: 'In Progress', count: stats.inProgress, dot: 'bg-sky-400' },
    { id: 'resolved', label: 'Resolved', count: stats.resolved, dot: 'bg-emerald-400' }
  ];

  const selectedConcern = concerns.find((c: any) => c.id === selectedConcernId);

  const containerVariants = {
    hidden: { opacity: 0 },
    show: {
      opacity: 1,
      transition: {
        staggerChildren: 0.08
      }
    }
  };

  const itemVariants = {
    hidden: { opacity: 0, y: 15 },
    show: {
      opacity: 1,
      y: 0,
      transition: { duration: 0.35, ease: 'easeOut' }
    }
  };

  return (
    <>
      <DashboardLayout
        user={user}
        role="student"
        activeTab={activeTab}
        onTabChange={setActiveTab}
        onLogout={onLogout}
        onNavigate={onNavigate}
        concernsData={concernsData}
        onSelectConcern={setSelectedConcernId}
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
                  Student Portal · Active
                </div>
                <h1 className="hero-title text-2xl sm:text-3xl font-extrabold tracking-tight leading-tight">
                  {getGreeting()}, {user.name.split(' ')[0]}
                </h1>
                <p className="hero-subtitle text-sm mt-2 leading-relaxed">
                  {stats.pending > 0 || stats.inProgress > 0
                    ? `You have ${stats.pending + stats.inProgress} active concern${
                        stats.pending + stats.inProgress === 1 ? '' : 's'
                      } being processed. Track updates in real-time below.`
                    : "Here's an overview of your concerns. All caught up or ready to submit a new inquiry."}
                </p>
              </div>

              <div className="relative z-10 flex flex-wrap items-center gap-3">
                <button
                  onClick={() => setActiveTab('submit')}
                  className="px-5 py-3 rounded-xl bg-gradient-to-r from-blue-600 via-sky-600 to-cyan-500 hover:from-blue-500 hover:to-cyan-400 text-white font-semibold text-sm shadow-xl shadow-sky-500/25 flex items-center gap-2 transition-all active:scale-95 touch-manipulation"
                >
                  <PlusCircleIcon className="h-4 w-4" />
                  Submit New Concern
                </button>
              </div>
            </motion.div>

            {/* Stat Cards */}
            <motion.div
              variants={itemVariants}
              className="grid grid-cols-2 lg:grid-cols-4 gap-3.5 sm:gap-4"
            >
              <StatCard
                title="Total Submitted"
                value={stats.total}
                icon={FileTextIcon}
                color="blue"
                trend={{
                  value: 12,
                  isPositive: true
                }}
                onClick={() => {
                  setFilterStatus('all');
                  setActiveTab('my-concerns');
                }}
                subtitle="View all concerns"
              />

              <StatCard
                title="Pending"
                value={stats.pending}
                icon={ClockIcon}
                color="orange"
                onClick={() => {
                  setFilterStatus('pending');
                  setActiveTab('my-concerns');
                }}
                subtitle="Click to view pending"
              />

              <StatCard
                title="In Progress"
                value={stats.inProgress}
                icon={AlertCircleIcon}
                color="blue"
                onClick={() => {
                  setFilterStatus('in-progress');
                  setActiveTab('my-concerns');
                }}
                subtitle="Click to track progress"
              />

              <StatCard
                title="Resolved"
                value={stats.resolved}
                icon={CheckCircle2Icon}
                color="green"
                onClick={() => {
                  setFilterStatus('resolved');
                  setActiveTab('my-concerns');
                }}
                subtitle="Click to view resolved"
              />
            </motion.div>

            {/* Recent Activity */}
            <motion.div variants={itemVariants}>
              <div className="flex items-center justify-between mb-3.5 sm:mb-4">
                <div>
                  <h2 className="text-lg sm:text-xl font-bold text-slate-900 dark:text-white tracking-tight">
                    Recent Activity
                  </h2>
                  <p className="text-xs sm:text-sm text-slate-500 dark:text-gray-400">
                    Latest updates on your submitted issues
                  </p>
                </div>
                {myConcerns.length > 0 && (
                  <button
                    onClick={() => setActiveTab('my-concerns')}
                    className="dashboard-view-all text-xs sm:text-sm font-semibold text-sky-600 dark:text-sky-400 hover:text-sky-500 dark:hover:text-sky-300 transition-colors flex items-center gap-1"
                  >
                    <span>View All ({myConcerns.length})</span>
                  </button>
                )}
              </div>

              {recentConcerns.length > 0 ? (
                <div className="space-y-3 sm:space-y-4">
                  {recentConcerns.map((concern) => (
                    <motion.div
                      key={concern.id}
                      whileHover={{ scale: 1.008 }}
                      transition={{ type: 'spring', stiffness: 300, damping: 20 }}
                    >
                      <ConcernCard
                        concern={concern}
                        onClick={() => setSelectedConcernId(concern.id)}
                      />
                    </motion.div>
                  ))}
                </div>
              ) : (
                <div className="glass-panel p-8 sm:p-12 text-center rounded-2xl border border-slate-200/90 dark:border-white/10 bg-white/95 dark:bg-dark-900/60 shadow-sm flex flex-col items-center justify-center">
                  <div className="h-14 w-14 rounded-2xl bg-slate-100 dark:bg-white/5 border border-slate-200 dark:border-white/10 flex items-center justify-center mb-3 text-slate-500 dark:text-gray-400">
                    <FileTextIcon className="h-7 w-7 text-slate-400 dark:text-gray-500" />
                  </div>
                  <h3 className="text-base sm:text-lg font-bold text-slate-900 dark:text-white mb-1.5">
                    No concerns submitted yet
                  </h3>
                  <p className="text-xs sm:text-sm text-slate-500 dark:text-gray-400 mb-5 max-w-md leading-relaxed">
                    Have an issue with academics, departments, or facilities? Submit a concern and track its resolution in real-time.
                  </p>
                  <button
                    onClick={() => setActiveTab('submit')}
                    className="px-6 py-2.5 rounded-xl bg-gradient-to-r from-blue-600 via-sky-600 to-cyan-500 hover:from-blue-500 hover:to-cyan-400 text-white text-sm font-semibold shadow-lg shadow-sky-500/20 transition-all active:scale-95"
                  >
                    Submit a Concern
                  </button>
                </div>
              )}
            </motion.div>
          </motion.div>
        )}

        {/* Submit Concern Tab */}
        {activeTab === 'submit' && (
          <ConcernForm
            user={user}
            onSubmit={async (data) => {
              try {
                await submitConcern(data);
                toast.success('Concern submitted successfully!', {
                  description:
                    'Your concern has been submitted and routed to the proper department for review.'
                });
                setActiveTab('my-concerns');
              } catch {
                /* useConcerns already toasts */
              }
            }}
            onCancel={() => setActiveTab('dashboard')}
          />
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

        {/* My Concerns Tab */}
        {activeTab === 'my-concerns' && (
          <motion.div
            variants={containerVariants}
            initial="hidden"
            animate="show"
            className="space-y-5 sm:space-y-6"
          >
            {/* Header */}
            <motion.div
              variants={itemVariants}
              className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-1"
            >
              <div>
                <div className="flex items-center gap-2.5">
                  <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 dark:text-white tracking-tight">
                    My Concerns
                  </h1>
                </div>
                <p className="text-xs sm:text-sm text-slate-500 dark:text-gray-400 mt-1">
                  Track, filter, and review the live status of all your submitted concerns.
                </p>
              </div>

              <button
                onClick={() => setActiveTab('submit')}
                className="px-4 py-2.5 rounded-xl bg-gradient-to-r from-blue-600 via-sky-600 to-cyan-500 hover:from-blue-500 hover:to-cyan-400 text-white text-xs sm:text-sm font-semibold shadow-lg shadow-sky-500/20 flex items-center justify-center gap-2 transition-all active:scale-95 touch-manipulation self-start sm:self-auto"
              >
                <PlusCircleIcon className="h-4 w-4" />
                <span>Submit Concern</span>
              </button>
            </motion.div>

            {/* Search & Filter Toolbar */}
            <motion.div variants={itemVariants} className="space-y-3">
              <div className="relative flex-1">
                <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none">
                  <SearchIcon className="h-4 w-4 text-slate-400 dark:text-gray-400" />
                </div>
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Search by title, ID, or department..."
                  className="dashboard-search-input w-full pl-10 pr-9 py-2.5 bg-white dark:bg-dark-800/90 border border-slate-200 dark:border-white/10 rounded-xl text-sm text-slate-900 dark:text-white placeholder-slate-400 dark:placeholder-gray-500 focus:outline-none focus:border-sky-500 focus:ring-2 focus:ring-sky-500/20 transition-all shadow-xs"
                />
                {searchQuery && (
                  <button
                    type="button"
                    onClick={() => setSearchQuery('')}
                    className="absolute inset-y-0 right-0 pr-3 flex items-center text-slate-400 hover:text-slate-600 dark:hover:text-white"
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
                          : 'filter-pill--inactive bg-white dark:bg-dark-800/80 hover:bg-slate-50 dark:hover:bg-dark-800 text-slate-600 dark:text-gray-400 hover:text-slate-900 dark:hover:text-gray-200 border border-slate-200 dark:border-white/10 shadow-xs'
                      }`}
                    >
                      <span
                        className={`h-2 w-2 rounded-full ${pill.dot} ${
                          isActive ? 'ring-2 ring-white/50' : ''
                        }`}
                      />
                      <span>{pill.label}</span>
                      <span
                        className={`text-[10px] px-1.5 py-0.2 rounded-md font-mono ${
                          isActive
                            ? 'bg-white/20 text-white'
                            : 'bg-slate-100 dark:bg-white/5 text-slate-600 dark:text-gray-400'
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
                      transition={{ type: 'spring', stiffness: 300, damping: 20 }}
                    >
                      <ConcernCard
                        concern={concern}
                        onClick={() => setSelectedConcernId(concern.id)}
                      />
                    </motion.div>
                  ))}
                </div>
              ) : myConcerns.length === 0 ? (
                <div className="glass-panel p-8 sm:p-12 text-center rounded-2xl border border-slate-200/90 dark:border-white/10 bg-white/95 dark:bg-dark-900/60 shadow-sm flex flex-col items-center justify-center">
                  <div className="h-16 w-16 rounded-2xl bg-sky-500/10 border border-sky-500/20 flex items-center justify-center mb-4 text-sky-500 dark:text-sky-400">
                    <FileTextIcon className="h-8 w-8" />
                  </div>
                  <h3 className="text-lg font-bold text-slate-900 dark:text-white mb-2">No concerns yet</h3>
                  <p className="text-sm text-slate-500 dark:text-gray-400 mb-6 max-w-md leading-relaxed">
                    You haven't submitted any concerns yet. If you have an academic, facility, or administrative concern, submit one anytime.
                  </p>
                  <button
                    onClick={() => setActiveTab('submit')}
                    className="px-6 py-2.5 rounded-xl bg-gradient-to-r from-blue-600 via-sky-600 to-cyan-500 text-white text-sm font-semibold hover:from-blue-500 hover:to-cyan-400 transition-all shadow-lg shadow-sky-500/20"
                  >
                    Submit a Concern
                  </button>
                </div>
              ) : (
                <div className="glass-panel p-8 sm:p-12 text-center rounded-2xl border border-slate-200/90 dark:border-white/10 bg-white/95 dark:bg-dark-900/60 shadow-sm flex flex-col items-center justify-center">
                  <div className="h-14 w-14 rounded-2xl bg-slate-100 dark:bg-white/5 border border-slate-200 dark:border-white/10 flex items-center justify-center mb-3 text-slate-400 dark:text-gray-400">
                    <SearchIcon className="h-6 w-6" />
                  </div>
                  <h3 className="text-base font-bold text-slate-900 dark:text-white mb-1.5">No matching concerns</h3>
                  <p className="text-sm text-slate-500 dark:text-gray-400 mb-4 max-w-sm">
                    We couldn't find any concerns matching your current filter or search query.
                  </p>
                  <button
                    onClick={() => {
                      setFilterStatus('all');
                      setSearchQuery('');
                    }}
                    className="px-4 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 dark:bg-white/10 dark:hover:bg-white/15 text-slate-700 dark:text-white text-xs font-semibold border border-slate-200 dark:border-white/10 transition-colors"
                  >
                    Reset Filters
                  </button>
                </div>
              )}
            </motion.div>
          </motion.div>
        )}

        <ConcernDetail
          isOpen={Boolean(selectedConcern)}
          concern={selectedConcern}
          currentUser={user}
          onUpdateStatus={() => undefined}
          onForward={() => undefined}
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
      <ChatBubble user={user} />
    </>
  );
}