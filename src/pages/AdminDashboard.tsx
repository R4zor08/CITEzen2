import { useCallback, useEffect, useMemo, useState } from 'react';
import { motion } from 'framer-motion';
import { User, ConcernStatus } from '../types';
import { departmentsList } from '../data/mockData';
import { DashboardLayout } from '../components/DashboardLayout';
import { StatCard } from '../components/StatCard';
import { ConcernCard } from '../components/ConcernCard';
import { ConcernDetail } from '../components/ConcernDetail';
import { AnalyticsChart } from '../components/AnalyticsChart';
import { ProfileSection } from '../components/ProfileSection';
import { AddDepartmentModal } from '../components/AddDepartmentModal';
import { EditUserModal } from '../components/EditUserModal';
import {
  FileTextIcon,
  CheckCircle2Icon,
  AlertTriangleIcon,
  SearchIcon,
  FilterIcon,
  UsersIcon,
  BuildingIcon } from
'lucide-react';
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
        className={`rounded-full object-cover ${className}`}
      />
    );
  }
  return (
    <div
      className={`rounded-full bg-purple-500/20 flex items-center justify-center text-purple-400 font-bold ${className}`}
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
  const [selectedConcernId, setSelectedConcernId] = useState<string | null>(
    null
  );
  const [showAddDeptModal, setShowAddDeptModal] = useState(false);
  const [editingUser, setEditingUser] = useState<any>(null);
  const [filterStatus, setFilterStatus] = useState<ConcernStatus | 'all'>('all');
  const [registeredUsers, setRegisteredUsers] = useState<User[]>([]);

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
  const { concerns, updateStatus, addComment, forwardConcern, assignConcern } =
    concernsData;
  const [assignDraft, setAssignDraft] = useState<Record<string, string>>({});
  const filteredConcerns = concerns.filter((c: any) => {
    const matchesStatus = filterStatus === 'all' || c.status === filterStatus;
    const matchesSearch =
    c.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
    c.id.toLowerCase().includes(searchQuery.toLowerCase()) ||
    c.studentName.toLowerCase().includes(searchQuery.toLowerCase()) ||
    c.department.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesStatus && matchesSearch;
  });

  const staffUsers = registeredUsers.filter((u: any) => u.role === 'staff');
  const staffNameById = useMemo(
    () => new Map<string, string>(staffUsers.map((u: any) => [u.id, u.name])),
    [staffUsers]
  );
  const stats = {
    total: concerns.length,
    resolved: concerns.filter((c: any) => c.status === 'resolved').length,
    urgent: concerns.filter(
      (c: any) => c.priority === 'urgent' || c.priority === 'high'
    ).length,
    users: registeredUsers.filter((u: any) => u.role !== 'admin').length
  };
  // Prepare chart data
  const categoryData = [
  {
    label: 'Academic',
    value: concerns.filter((c: any) => c.category === 'Academic').length,
    color: 'bg-purple-500'
  },
  {
    label: 'Administrative',
    value: concerns.filter((c: any) => c.category === 'Administrative').
    length,
    color: 'bg-blue-500'
  },
  {
    label: 'Facility',
    value: concerns.filter((c: any) => c.category === 'Facility').length,
    color: 'bg-cyan-500'
  },
  {
    label: 'Complaints',
    value: concerns.filter((c: any) => c.category === 'Complaints').length,
    color: 'bg-orange-500'
  }].
  filter((d) => d.value > 0);
  const statusData = [
  {
    label: 'Pending',
    value: concerns.filter((c: any) => c.status === 'pending').length,
    color: 'bg-yellow-500'
  },
  {
    label: 'In Progress',
    value: concerns.filter((c: any) => c.status === 'in-progress').length,
    color: 'bg-blue-500'
  },
  {
    label: 'Resolved',
    value: concerns.filter((c: any) => c.status === 'resolved').length,
    color: 'bg-green-500'
  },
  {
    label: 'Rejected',
    value: concerns.filter((c: any) => c.status === 'rejected').length,
    color: 'bg-red-500'
  }].
  filter((d) => d.value > 0);
  // Department concerns chart data (real-time)
  const deptColors = [
  'bg-purple-500',
  'bg-blue-500',
  'bg-cyan-500',
  'bg-orange-500',
  'bg-green-500',
  'bg-red-500',
  'bg-yellow-500'];

  const departmentData = localDepartments.
  map((dept, i) => ({
    label: dept,
    value: concerns.filter((c: any) => c.department === dept).length,
    color: deptColors[i % deptColors.length]
  })).
  filter((d) => d.value > 0);
  // User role distribution (real-time)
  const userRoleData = [
  {
    label: 'Students',
    value: registeredUsers.filter((u: any) => u.role === 'student').length,
    color: 'bg-green-500'
  },
  {
    label: 'Staff',
    value: registeredUsers.filter((u: any) => u.role === 'staff').length,
    color: 'bg-blue-500'
  },
  {
    label: 'Admins',
    value: registeredUsers.filter((u: any) => u.role === 'admin').length,
    color: 'bg-red-500'
  }].
  filter((d) => d.value > 0);
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
      role="admin"
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
              System Overview
            </h1>
            <p className="text-sm sm:text-base text-gray-400">
              High-level metrics and analytics for CITEzen.
            </p>
          </motion.div>

          <motion.div
          variants={itemVariants}
          className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
          
            <StatCard
            title="Total Concerns"
            value={stats.total}
            icon={FileTextIcon}
            color="purple"
            trend={{
              value: 12,
              isPositive: true
            }} />
          
            <StatCard
            title="Resolution Rate"
            value={`${Math.round(stats.resolved / (stats.total || 1) * 100)}%`}
            icon={CheckCircle2Icon}
            color="green"
            trend={{
              value: 5,
              isPositive: true
            }} />
          
            <StatCard
            title="High Priority"
            value={stats.urgent}
            icon={AlertTriangleIcon}
            color="red" />
          
            <StatCard
            title="Total Users"
            value={stats.users}
            icon={UsersIcon}
            color="blue" />
          
          </motion.div>

          <motion.div
          variants={itemVariants}
          className="grid grid-cols-1 lg:grid-cols-2 gap-4 sm:gap-6">
          
            <AnalyticsChart
            data={categoryData}
            type="donut"
            title="Concerns by Category" />
          
            <AnalyticsChart
            data={statusData}
            type="bar"
            title="Current Status Distribution" />
          
          </motion.div>
        </motion.div>
      }

      {/* All Concerns Tab */}
      {activeTab === 'all-concerns' &&
      <motion.div
        variants={containerVariants}
        initial="hidden"
        animate="show"
        className="space-y-4 sm:space-y-6">
        
          <motion.div
          variants={itemVariants}
          className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 sm:gap-4">
          
            <h1 className="text-xl sm:text-2xl font-bold text-white">
              All Concerns
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
                placeholder="Search ID, title, student..."
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
              
                    <div className="flex flex-col lg:flex-row lg:items-stretch gap-3">
                      <div className="flex-1 min-w-0">
                        <ConcernCard
                          concern={concern}
                          onClick={() => setSelectedConcernId(concern.id)}
                          showStudent={true}
                        />
                      </div>

                      <div className="glass-panel p-3 rounded-2xl border border-white/10 shrink-0 lg:w-[320px]">
                        <div className="flex items-center justify-between gap-2 mb-2">
                          <div className="text-xs font-medium text-gray-300">
                            Assign to staff
                          </div>
                          <div className="text-[11px] text-gray-500 truncate">
                            {concern.assignedTo
                              ? `Assigned: ${staffNameById.get(concern.assignedTo) || 'Unknown'}`
                              : 'Unassigned'}
                          </div>
                        </div>

                        <div className="flex items-center gap-2">
                          <select
                            value={assignDraft[concern.id] ?? concern.assignedTo ?? ''}
                            onChange={(e) =>
                              setAssignDraft((prev) => ({
                                ...prev,
                                [concern.id]: e.target.value
                              }))
                            }
                            className="flex-1 min-w-0 bg-dark-800 border border-white/10 rounded-xl py-2 px-3 text-xs text-white focus:outline-none focus:border-purple-500 focus:ring-1 focus:ring-purple-500 transition-all appearance-none"
                            title="Select staff to assign">
                            <option value="">Select staff…</option>
                            {staffUsers
                              .filter((u: any) => u.department === concern.department)
                              .map((u: any) => (
                                <option key={u.id} value={u.id}>
                                  {u.name}
                                </option>
                              ))}
                            {staffUsers.some((u: any) => u.department === concern.department) ? (
                              <option disabled value="__divider__">
                                ──────────
                              </option>
                            ) : null}
                            {staffUsers
                              .filter((u: any) => u.department !== concern.department)
                              .map((u: any) => (
                                <option key={u.id} value={u.id}>
                                  {u.name} ({u.department || 'No dept'})
                                </option>
                              ))}
                          </select>

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
                                toast.success('Assigned successfully.');
                              } catch {
                                /* useConcerns already toasts */
                              }
                            }}
                            className="px-3 py-2 rounded-xl bg-purple-600 text-white text-xs font-medium hover:bg-purple-500 transition-colors">
                            Assign
                          </button>
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
                            className="mt-2 w-full px-3 py-2 rounded-xl bg-white/5 text-gray-300 hover:bg-white/10 text-xs transition-colors">
                            Clear assignment
                          </button>
                        )}
                      </div>
                    </div>
              
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

      {/* Users Tab */}
      {activeTab === 'users' &&
      <motion.div
        variants={containerVariants}
        initial="hidden"
        animate="show"
        className="space-y-4 sm:space-y-6">
        
          <motion.div
          variants={itemVariants}
          className="flex items-center justify-between">
          
            <h1 className="text-xl sm:text-2xl font-bold text-white">
              Manage Users
            </h1>
            <span className="text-sm text-gray-400">
              {registeredUsers.filter((u: any) => u.role !== 'admin').length}{' '}
              registered
            </span>
          </motion.div>

          {/* Mobile: Card layout */}
          <motion.div variants={itemVariants} className="sm:hidden space-y-3">
            {registeredUsers.filter((u: any) => u.role !== 'admin').length ===
          0 ?
          <div className="glass-panel p-8 text-center text-gray-400 text-sm">
                No users registered yet. Users will appear here when they sign
                up.
              </div> :

          registeredUsers.
          filter((u: any) => u.role !== 'admin').
          map((u: any) =>
          <motion.div
            key={u.id}
            whileHover={{
              scale: 1.02
            }}
            className="glass-card p-4">
            
                    <div className="flex items-center gap-3 mb-3">
                      <UserListAvatar
                        name={u.name}
                        profilePicture={u.profilePicture}
                        className="h-9 w-9 text-sm shrink-0"
                      />
                      <div className="flex-1 min-w-0">
                        <div className="font-medium text-white text-sm truncate">
                          {u.name}
                        </div>
                        <div className="text-xs text-gray-500 truncate">
                          {u.email}
                        </div>
                      </div>
                      <span
                className={`inline-flex items-center px-2 py-0.5 rounded text-[10px] font-medium capitalize shrink-0 ${u.role === 'admin' ? 'bg-red-500/10 text-red-400 border border-red-500/20' : u.role === 'staff' ? 'bg-blue-500/10 text-blue-400 border border-blue-500/20' : 'bg-green-500/10 text-green-400 border border-green-500/20'}`}>
                
                        {u.role}
                      </span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-xs text-gray-400">
                        {u.department || u.course || '-'}
                      </span>
                      <button
                onClick={() => setEditingUser(u)}
                className="text-purple-400 hover:text-purple-300 font-medium text-xs">
                
                        Edit
                      </button>
                    </div>
                  </motion.div>
          )
          }
          </motion.div>

          {/* Desktop: Table layout */}
          <motion.div
          variants={itemVariants}
          className="hidden sm:block glass-panel overflow-hidden">
          
            <div className="overflow-x-auto">
              <table className="w-full text-left text-sm">
                <thead className="bg-white/5 text-gray-400 uppercase tracking-wider text-xs border-b border-white/10">
                  <tr>
                    <th className="px-4 sm:px-6 py-3 sm:py-4 font-medium">
                      Name
                    </th>
                    <th className="px-4 sm:px-6 py-3 sm:py-4 font-medium">
                      Role
                    </th>
                    <th className="px-4 sm:px-6 py-3 sm:py-4 font-medium">
                      Department/Course
                    </th>
                    <th className="px-4 sm:px-6 py-3 sm:py-4 font-medium text-right">
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-white/5">
                  {registeredUsers.filter((u: any) => u.role !== 'admin').
                length === 0 ?
                <tr>
                      <td
                    colSpan={4}
                    className="px-6 py-12 text-center text-gray-400 text-sm">
                    
                        No users registered yet. Users will appear here when
                        they sign up.
                      </td>
                    </tr> :

                registeredUsers.
                filter((u: any) => u.role !== 'admin').
                map((u: any) =>
                <tr
                  key={u.id}
                  className="hover:bg-white/5 transition-colors">
                  
                          <td className="px-4 sm:px-6 py-3 sm:py-4">
                            <div className="flex items-center gap-3">
                              <UserListAvatar
                                name={u.name}
                                profilePicture={u.profilePicture}
                                className="h-8 w-8 shrink-0"
                              />
                              <div>
                                <div className="font-medium text-white">
                                  {u.name}
                                </div>
                                <div className="text-xs text-gray-500">
                                  {u.email}
                                </div>
                              </div>
                            </div>
                          </td>
                          <td className="px-4 sm:px-6 py-3 sm:py-4">
                            <span
                      className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-medium capitalize ${u.role === 'admin' ? 'bg-red-500/10 text-red-400 border border-red-500/20' : u.role === 'staff' ? 'bg-blue-500/10 text-blue-400 border border-blue-500/20' : 'bg-green-500/10 text-green-400 border border-green-500/20'}`}>
                      
                              {u.role}
                            </span>
                          </td>
                          <td className="px-4 sm:px-6 py-3 sm:py-4 text-gray-400">
                            {u.department || u.course || '-'}
                          </td>
                          <td className="px-4 sm:px-6 py-3 sm:py-4 text-right">
                            <button
                      onClick={() => setEditingUser(u)}
                      className="text-purple-400 hover:text-purple-300 font-medium text-xs">
                      
                              Edit
                            </button>
                          </td>
                        </tr>
                )
                }
                </tbody>
              </table>
            </div>
          </motion.div>
        </motion.div>
      }

      {/* Departments Tab */}
      {activeTab === 'departments' &&
      <motion.div
        variants={containerVariants}
        initial="hidden"
        animate="show"
        className="space-y-4 sm:space-y-6">
        
          <motion.div
          variants={itemVariants}
          className="flex items-center justify-between">
          
            <h1 className="text-xl sm:text-2xl font-bold text-white">
              Departments
            </h1>
            <button
            onClick={() => setShowAddDeptModal(true)}
            className="px-3 sm:px-4 py-1.5 sm:py-2 rounded-xl bg-purple-600 text-white text-xs sm:text-sm font-medium hover:bg-purple-500 transition-colors">
            
              Add Department
            </button>
          </motion.div>

          <motion.div
          variants={itemVariants}
          className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-4">
          
            {localDepartments.map((dept) => {
            const deptCount = concerns.filter(
              (c: any) => c.department === dept
            ).length;
            const resolvedCount = concerns.filter(
              (c: any) => c.department === dept && c.status === 'resolved'
            ).length;
            return (
              <motion.div
                key={dept}
                whileHover={{
                  scale: 1.02
                }}
                className="glass-card p-4 sm:p-5">
                
                  <div className="flex items-center gap-2.5 sm:gap-3 mb-3 sm:mb-4">
                    <div className="p-1.5 sm:p-2 rounded-lg sm:rounded-xl bg-blue-500/10 border border-blue-500/20 text-blue-400">
                      <BuildingIcon className="h-4 w-4 sm:h-5 sm:w-5" />
                    </div>
                    <h3 className="font-semibold text-white text-sm sm:text-base truncate">
                      {dept}
                    </h3>
                  </div>

                  <div className="space-y-1.5 sm:space-y-2">
                    <div className="flex justify-between text-xs sm:text-sm">
                      <span className="text-gray-400">Total Concerns</span>
                      <span className="font-medium text-white">
                        {deptCount}
                      </span>
                    </div>
                    <div className="flex justify-between text-xs sm:text-sm">
                      <span className="text-gray-400">Resolved</span>
                      <span className="font-medium text-green-400">
                        {resolvedCount}
                      </span>
                    </div>
                  </div>
                </motion.div>);

          })}
          </motion.div>
        </motion.div>
      }

      {/* Analytics Tab */}
      {activeTab === 'analytics' &&
      <motion.div
        variants={containerVariants}
        initial="hidden"
        animate="show"
        className="space-y-4 sm:space-y-6">
        
          <motion.h1
          variants={itemVariants}
          className="text-xl sm:text-2xl font-bold text-white mb-4 sm:mb-6">
          
            Detailed Analytics
          </motion.h1>

          <motion.div
          variants={itemVariants}
          className="grid grid-cols-1 lg:grid-cols-2 gap-4 sm:gap-6 mb-4 sm:mb-6">
          
            <AnalyticsChart
            data={categoryData}
            type="bar"
            title="Volume by Category" />
          
            <AnalyticsChart
            data={statusData}
            type="donut"
            title="Status Breakdown" />
          
          </motion.div>

          <motion.div
          variants={itemVariants}
          className="grid grid-cols-1 lg:grid-cols-2 gap-4 sm:gap-6 mb-4 sm:mb-6">
          
            <AnalyticsChart
            data={departmentData}
            type="bar"
            title="Concerns by Department" />
          
            <AnalyticsChart
            data={userRoleData}
            type="donut"
            title="User Distribution" />
          
          </motion.div>

          <motion.div
          variants={itemVariants}
          className="glass-panel p-4 sm:p-6">
          
            <h3 className="text-sm sm:text-base font-semibold text-white mb-3 sm:mb-4">
              Department Performance
            </h3>
            <div className="space-y-3 sm:space-y-4">
              {localDepartments.map((dept) => {
              const total =
              concerns.filter((c: any) => c.department === dept).length || 1;
              const resolved = concerns.filter(
                (c: any) => c.department === dept && c.status === 'resolved'
              ).length;
              const percentage = Math.round(resolved / total * 100);
              return (
                <div key={dept}>
                    <div className="flex justify-between text-xs sm:text-sm mb-1">
                      <span className="text-gray-300 truncate pr-2">
                        {dept}
                      </span>
                      <span className="text-gray-400 shrink-0">
                        {percentage}% Resolved
                      </span>
                    </div>
                    <div className="w-full h-1.5 sm:h-2 bg-dark-800 rounded-full overflow-hidden border border-white/5">
                      <motion.div
                      initial={{
                        width: 0
                      }}
                      animate={{
                        width: `${percentage}%`
                      }}
                      transition={{
                        duration: 1,
                        ease: 'easeOut'
                      }}
                      className="h-full bg-gradient-to-r from-purple-500 to-cyan-500 rounded-full" />
                    
                    </div>
                  </div>);

            })}
            </div>
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

      <AddDepartmentModal
        isOpen={showAddDeptModal}
        onClose={() => setShowAddDeptModal(false)}
        onAdd={async (dept) => {
          await new Promise((resolve) => setTimeout(resolve, 500));
          setLocalDepartments((prev) => [...prev, dept]);
        }} />
      

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
        }} />
      
    </DashboardLayout>);

}