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
  AlertCircleIcon,
  SearchIcon,
  FilterIcon } from
'lucide-react';
import { toast } from 'sonner';
interface StaffDashboardProps {
  user: User;
  onLogout: () => void;
  onNavigate: (page: string) => void;
  concernsData: any;
  onUpdateUser?: (data: Partial<User>) => Promise<void>;
}
export function StaffDashboard({
  user,
  onLogout,
  onNavigate,
  concernsData,
  onUpdateUser
}: StaffDashboardProps) {
  const [activeTab, setActiveTab] = useState('dashboard');
  const [selectedConcernId, setSelectedConcernId] = useState<string | null>(
    null
  );
  const [filterStatus, setFilterStatus] = useState<ConcernStatus | 'all'>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const { concerns, updateStatus, addComment, forwardConcern } = concernsData;
  // Staff sees department concerns plus any concerns assigned to them (even cross-department).
  const deptConcerns = concerns.filter((c: any) => c.department === user.department);
  const assignedConcerns = concerns.filter((c: any) => c.assignedTo === user.id);
  const displayConcerns =
  activeTab === 'assigned' ? assignedConcerns : deptConcerns;
  const filteredConcerns = displayConcerns.filter((c: any) => {
    const matchesStatus = filterStatus === 'all' || c.status === filterStatus;
    const matchesSearch =
    c.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
    c.id.toLowerCase().includes(searchQuery.toLowerCase()) ||
    c.studentName.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesStatus && matchesSearch;
  });
  const recentAssigned = [...assignedConcerns].
  sort(
    (a, b) =>
    new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime()
  ).
  slice(0, 3);
  const stats = {
    totalDept: deptConcerns.length,
    assigned: assignedConcerns.length,
    pending: deptConcerns.filter((c: any) => c.status === 'pending').length,
    resolved: deptConcerns.filter((c: any) => c.status === 'resolved').length
  };
  const selectedConcern = concerns.find((c: any) => c.id === selectedConcernId);
  const containerVariants = {
    hidden: {
      opacity: 0
    },
    show: {
      opacity: 1,
      transition: {
        staggerChildren: 0.1
      }
    }
  };
  const itemVariants = {
    hidden: {
      opacity: 0,
      y: 20
    },
    show: {
      opacity: 1,
      y: 0,
      transition: {
        duration: 0.4
      }
    }
  };
  return (
    <DashboardLayout
      user={user}
      role="staff"
      activeTab={activeTab}
      onTabChange={setActiveTab}
      onLogout={onLogout}
      onNavigate={onNavigate}
      concernsData={concernsData}>
      
      {/* Dashboard Tab */}
      {activeTab === 'dashboard' &&
      <motion.div
        variants={containerVariants}
        initial="hidden"
        animate="show"
        className="space-y-5 sm:space-y-8">
        
          <motion.div variants={itemVariants}>
            <h1 className="text-xl sm:text-2xl font-bold text-white mb-1 sm:mb-2">
              Staff Dashboard
            </h1>
            <p className="text-sm sm:text-base text-gray-400">
              Overview for {user.department} department.
            </p>
          </motion.div>

          <motion.div
          variants={itemVariants}
          className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
          
            <StatCard
            title="Dept. Concerns"
            value={stats.totalDept}
            icon={InboxIcon}
            color="purple" />
          
            <StatCard
            title="Assigned to You"
            value={stats.assigned}
            icon={AlertCircleIcon}
            color="blue" />
          
            <StatCard
            title="Pending Review"
            value={stats.pending}
            icon={ClockIcon}
            color="orange" />
          
            <StatCard
            title="Resolved"
            value={stats.resolved}
            icon={CheckCircle2Icon}
            color="green" />
          
          </motion.div>

          <motion.div variants={itemVariants}>
            <div className="flex items-center justify-between mb-3 sm:mb-4">
              <h2 className="text-base sm:text-lg font-semibold text-white">
                Your Recent Assignments
              </h2>
              <button
              onClick={() => setActiveTab('assigned')}
              className="text-xs sm:text-sm font-medium text-purple-400 hover:text-purple-300 transition-colors">
              
                View All
              </button>
            </div>

            {recentAssigned.length > 0 ?
          <div className="space-y-3 sm:space-y-4">
                {recentAssigned.map((concern) =>
            <motion.div
              key={concern.id}
              whileHover={{
                scale: 1.01
              }}
              transition={{
                type: 'spring',
                stiffness: 300,
                damping: 20
              }}>
              
                    <ConcernCard
                concern={concern}
                onClick={() => setSelectedConcernId(concern.id)}
                showStudent={true} />
              
                  </motion.div>
            )}
              </div> :

          <div className="glass-panel p-6 sm:p-8 text-center flex flex-col items-center justify-center">
                <div className="h-12 w-12 sm:h-16 sm:w-16 rounded-full bg-white/5 flex items-center justify-center mb-3 sm:mb-4">
                  <CheckCircle2Icon className="h-6 w-6 sm:h-8 sm:w-8 text-gray-500" />
                </div>
                <h3 className="text-base sm:text-lg font-medium text-white mb-1.5 sm:mb-2">
                  All caught up!
                </h3>
                <p className="text-sm text-gray-400 max-w-md">
                  You don't have any concerns currently assigned to you.
                </p>
              </div>
          }
          </motion.div>
        </motion.div>
      }

      {/* Profile Tab */}
      {activeTab === 'profile' &&
      <ProfileSection
        user={user}
        onUpdateProfile={async (data) => {
          if (onUpdateUser) {
            await onUpdateUser(data);
          }
        }} />

      }

      {/* Assigned & All Concerns Tabs */}
      {(activeTab === 'assigned' || activeTab === 'all-concerns') &&
      <motion.div
        variants={containerVariants}
        initial="hidden"
        animate="show"
        className="space-y-4 sm:space-y-6">
        
          <motion.div
          variants={itemVariants}
          className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 sm:gap-4">
          
            <h1 className="text-xl sm:text-2xl font-bold text-white">
              {activeTab === 'assigned' ?
            'Assigned to Me' :
            'Department Concerns'}
            </h1>

            <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2 sm:gap-3">
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <SearchIcon className="h-4 w-4 text-gray-500" />
                </div>
                <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search concerns..."
                className="block w-full sm:w-56 pl-9 bg-dark-800 border border-white/10 rounded-xl py-2 text-sm text-white placeholder-gray-500 focus:outline-none focus:border-purple-500 focus:ring-1 focus:ring-purple-500 transition-all" />
              
              </div>

              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <FilterIcon className="h-4 w-4 text-gray-500" />
                </div>
                <select
                value={filterStatus}
                onChange={(e) => setFilterStatus(e.target.value as any)}
                className="block w-full sm:w-auto pl-9 pr-8 bg-dark-800 border border-white/10 rounded-xl py-2 text-sm text-white focus:outline-none focus:border-purple-500 focus:ring-1 focus:ring-purple-500 transition-all appearance-none">
                
                  <option value="all">All Statuses</option>
                  <option value="pending">Pending</option>
                  <option value="in-progress">In Progress</option>
                  <option value="resolved">Resolved</option>
                  <option value="rejected">Rejected</option>
                </select>
              </div>
            </div>
          </motion.div>

          <motion.div variants={itemVariants}>
            {filteredConcerns.length > 0 ?
          <div className="space-y-3 sm:space-y-4">
                {filteredConcerns.map((concern: any) =>
            <motion.div
              key={concern.id}
              whileHover={{
                scale: 1.01
              }}
              transition={{
                type: 'spring',
                stiffness: 300,
                damping: 20
              }}>
              
                    <ConcernCard
                concern={concern}
                onClick={() => setSelectedConcernId(concern.id)}
                showStudent={true} />
              
                  </motion.div>
            )}
              </div> :

          <div className="glass-panel p-8 sm:p-12 text-center text-gray-400 text-sm">
                No concerns found matching your filters.
              </div>
          }
          </motion.div>
        </motion.div>
      }

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
    </DashboardLayout>);

}