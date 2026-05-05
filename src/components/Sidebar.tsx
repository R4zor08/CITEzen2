import { motion, AnimatePresence } from 'framer-motion';
import { Role, User } from '../types';
import {
  LayoutDashboardIcon,
  PlusCircleIcon,
  FileTextIcon,
  UsersIcon,
  BarChart3Icon,
  BuildingIcon,
  InboxIcon,
  ChevronRightIcon,
  UserIcon,
  ChevronLeftIcon,
  XIcon,
  LogOutIcon,
  BellIcon } from
'lucide-react';
interface SidebarProps {
  user: User;
  role: Role;
  activeTab: string;
  onTabChange: (tab: string) => void;
  isCollapsed: boolean;
  onToggleCollapse: () => void;
  isMobileOpen: boolean;
  onCloseMobile: () => void;
  onLogout: () => void;
  unreadCount?: number;
}
export function Sidebar({
  user,
  role,
  activeTab,
  onTabChange,
  isCollapsed,
  onToggleCollapse,
  isMobileOpen,
  onCloseMobile,
  onLogout,
  unreadCount = 0
}: SidebarProps) {
  const studentTabs = [
  {
    id: 'dashboard',
    label: 'Dashboard',
    icon: LayoutDashboardIcon
  },
  {
    id: 'submit',
    label: 'Submit Concern',
    icon: PlusCircleIcon
  },
  {
    id: 'my-concerns',
    label: 'My Concerns',
    icon: FileTextIcon
  },
  {
    id: 'notifications',
    label: 'Notifications',
    icon: BellIcon
  },
  {
    id: 'profile',
    label: 'Profile',
    icon: UserIcon
  }];

  const staffTabs = [
  {
    id: 'dashboard',
    label: 'Dashboard',
    icon: LayoutDashboardIcon
  },
  {
    id: 'assigned',
    label: 'Assigned to Me',
    icon: InboxIcon
  },
  {
    id: 'all-concerns',
    label: 'Dept. Concerns',
    icon: FileTextIcon
  },
  {
    id: 'notifications',
    label: 'Notifications',
    icon: BellIcon
  },
  {
    id: 'profile',
    label: 'Profile',
    icon: UserIcon
  }];

  const adminTabs = [
  {
    id: 'dashboard',
    label: 'Overview',
    icon: LayoutDashboardIcon
  },
  {
    id: 'all-concerns',
    label: 'All Concerns',
    icon: FileTextIcon
  },
  {
    id: 'users',
    label: 'Users',
    icon: UsersIcon
  },
  {
    id: 'departments',
    label: 'Departments',
    icon: BuildingIcon
  },
  {
    id: 'analytics',
    label: 'Analytics',
    icon: BarChart3Icon
  },
  {
    id: 'notifications',
    label: 'Notifications',
    icon: BellIcon
  },
  {
    id: 'profile',
    label: 'Profile',
    icon: UserIcon
  }];

  const tabs =
  role === 'student' ? studentTabs : role === 'staff' ? staffTabs : adminTabs;
  const sidebarVariants = {
    expanded: {
      width: 280
    },
    collapsed: {
      width: 80
    }
  };
  const mobileDrawerVariants = {
    open: {
      x: 0
    },
    closed: {
      x: '-100%'
    }
  };
  const renderNavItems = (isMobile: boolean) =>
  <nav className="flex-1 space-y-1 mt-4 px-3">
      {tabs.map((tab) => {
      const Icon = tab.icon;
      const isActive = activeTab === tab.id;
      const showLabel = isMobile || !isCollapsed;
      const isNotification = tab.id === 'notifications';
      return (
        <button
          key={tab.id}
          onClick={() => {
            onTabChange(tab.id);
            if (isMobile) onCloseMobile();
          }}
          title={!showLabel ? tab.label : undefined}
          className={`group relative flex w-full items-center ${showLabel ? 'justify-between' : 'justify-center'} rounded-xl px-3 py-2.5 text-sm font-medium transition-all duration-200 ${isActive ? 'bg-purple-500/10 text-purple-400 border border-purple-500/20' : 'text-gray-400 hover:bg-white/5 hover:text-white border border-transparent'}`}>
          
            <div className="flex items-center gap-3">
              <div className="relative">
                <Icon
                className={`h-5 w-5 shrink-0 ${isActive ? 'text-purple-400' : 'text-gray-500 group-hover:text-gray-300'}`} />
              
                {isNotification && unreadCount > 0 && !showLabel &&
              <span className="absolute -top-1 -right-1 flex h-2.5 w-2.5 items-center justify-center rounded-full bg-red-500 ring-2 ring-dark-900 z-20" />
              }
              </div>
              {showLabel &&
            <motion.span
              initial={{
                opacity: 0,
                width: 0
              }}
              animate={{
                opacity: 1,
                width: 'auto'
              }}
              exit={{
                opacity: 0,
                width: 0
              }}
              className="whitespace-nowrap flex items-center gap-2">
              
                  {tab.label}
                  {isNotification && unreadCount > 0 &&
              <span className="flex h-5 min-w-[20px] items-center justify-center rounded-full bg-red-500/20 px-1.5 text-[10px] font-bold text-red-500 border border-red-500/30">
                      {unreadCount}
                    </span>
              }
                </motion.span>
            }
            </div>

            {showLabel && isActive &&
          <ChevronRightIcon className="h-4 w-4 text-purple-400 shrink-0" />
          }
          </button>);

    })}
    </nav>;

  return (
    <>
      {/* Desktop Sidebar */}
      <motion.aside
        initial={false}
        animate={isCollapsed ? 'collapsed' : 'expanded'}
        variants={sidebarVariants}
        transition={{
          duration: 0.3,
          ease: 'easeInOut'
        }}
        className="hidden md:flex flex-col h-screen shrink-0 glass-panel rounded-none border-y-0 border-l-0 border-r border-white/10 z-20 relative overflow-hidden">
        
        <div
          className={`flex items-center ${isCollapsed ? 'justify-center px-2' : 'justify-between px-4'} h-16 shrink-0 border-b border-white/5 transition-all`}>
          
          <div
            className={`flex items-center ${isCollapsed ? 'justify-center' : 'gap-3'} overflow-hidden ${isCollapsed ? 'cursor-pointer' : ''}`}
            onClick={isCollapsed ? onToggleCollapse : undefined}
            title={isCollapsed ? 'Expand Sidebar' : undefined}>
            
            <div className="relative flex h-9 w-9 shrink-0 items-center justify-center overflow-hidden rounded-full bg-gradient-to-br from-purple-500/20 to-cyan-500/20 border border-white/10 hover:border-purple-500/30 transition-colors">
              <img
                src="/Gemini_Generated_Image_u7mgetu7mgetu7mg.png"
                alt="Logo"
                className="h-9 w-9 object-cover rounded-full" />
              
            </div>
            <AnimatePresence>
              {!isCollapsed &&
              <motion.span
                initial={{
                  opacity: 0,
                  width: 0
                }}
                animate={{
                  opacity: 1,
                  width: 'auto'
                }}
                exit={{
                  opacity: 0,
                  width: 0
                }}
                className="text-lg font-bold tracking-tight text-white whitespace-nowrap">
                
                  CITE<span className="text-gradient">zen</span>
                </motion.span>
              }
            </AnimatePresence>
          </div>
          {!isCollapsed &&
          <button
            onClick={onToggleCollapse}
            className="p-1.5 rounded-lg text-gray-400 hover:bg-white/5 hover:text-white transition-colors flex items-center justify-center shrink-0"
            title="Collapse Sidebar">
            
              <ChevronLeftIcon className="h-5 w-5" />
            </button>
          }
        </div>

        <div className="flex-1 overflow-y-auto custom-scrollbar py-4">
          {renderNavItems(false)}
        </div>

        <div className="mt-auto border-t border-white/5 shrink-0 flex flex-col p-3 gap-2 bg-dark-900/50">
          {/* User Profile Mini-card */}
          <button
            onClick={() => onTabChange('profile')}
            className={`flex items-center ${isCollapsed ? 'justify-center' : 'justify-start gap-3 px-3'} py-2.5 rounded-xl hover:bg-white/5 transition-colors border border-transparent hover:border-white/10 w-full text-left group`}
            title={isCollapsed ? 'View Profile' : undefined}>
            
            <div className="relative flex h-9 w-9 shrink-0 items-center justify-center overflow-hidden rounded-full bg-dark-800 border border-white/10 group-hover:border-purple-500/50 transition-colors">
              {user.profilePicture ?
              <img
                src={user.profilePicture}
                alt={user.name}
                className="h-full w-full object-cover" /> :


              <UserIcon className="h-4 w-4 text-gray-400" />
              }
            </div>
            {!isCollapsed &&
            <div className="flex flex-col overflow-hidden">
                <span className="text-sm font-medium text-white truncate">
                  {user.name}
                </span>
                <span className="text-xs text-purple-400 capitalize truncate">
                  {user.role}
                </span>
              </div>
            }
          </button>

          {/* Logout Button */}
          <button
            onClick={onLogout}
            className={`flex items-center ${isCollapsed ? 'justify-center' : 'justify-start gap-3 px-3'} py-2.5 rounded-xl text-red-400 hover:bg-red-500/10 hover:text-red-300 transition-colors border border-transparent hover:border-red-500/20 w-full group`}
            title={isCollapsed ? 'Log out' : undefined}>
            
            <LogOutIcon className="h-5 w-5 shrink-0 group-hover:scale-110 transition-transform" />
            {!isCollapsed &&
            <span className="text-sm font-medium whitespace-nowrap">
                Log out
              </span>
            }
          </button>
        </div>
      </motion.aside>

      {/* Mobile Sidebar Drawer */}
      <AnimatePresence>
        {isMobileOpen &&
        <>
            <motion.div
            initial={{
              opacity: 0
            }}
            animate={{
              opacity: 1
            }}
            exit={{
              opacity: 0
            }}
            transition={{
              duration: 0.2
            }}
            className="fixed inset-0 bg-black/60 backdrop-blur-sm z-40 md:hidden"
            onClick={onCloseMobile} />
          
            <motion.aside
            initial="closed"
            animate="open"
            exit="closed"
            variants={mobileDrawerVariants}
            transition={{
              duration: 0.3,
              ease: 'easeInOut'
            }}
            className="fixed inset-y-0 left-0 w-64 glass-panel rounded-none border-y-0 border-l-0 border-r border-white/10 z-50 flex flex-col md:hidden">
            
              <div className="flex items-center justify-between h-16 px-4 shrink-0 border-b border-white/5">
                <div className="flex items-center gap-3">
                  <div className="relative flex h-8 w-8 shrink-0 items-center justify-center overflow-hidden rounded-full bg-gradient-to-br from-purple-500/20 to-cyan-500/20 border border-white/10">
                    <img
                    src="/Gemini_Generated_Image_u7mgetu7mgetu7mg.png"
                    alt="Logo"
                    className="h-8 w-8 object-cover rounded-full" />
                  
                  </div>
                  <span className="text-lg font-bold tracking-tight text-white">
                    CITE<span className="text-gradient">zen</span>
                  </span>
                </div>
                <button
                onClick={onCloseMobile}
                className="p-2 rounded-lg text-gray-400 hover:bg-white/5 hover:text-white">
                
                  <XIcon className="h-5 w-5" />
                </button>
              </div>

              <div className="flex-1 overflow-y-auto custom-scrollbar py-4">
                {renderNavItems(true)}
              </div>

              <div className="mt-auto border-t border-white/5 shrink-0 flex flex-col p-4 gap-3 bg-dark-900/50">
                {/* Mobile User Profile */}
                <button
                onClick={() => {
                  onTabChange('profile');
                  onCloseMobile();
                }}
                className="flex items-center justify-start gap-3 px-3 py-3 rounded-xl hover:bg-white/5 transition-colors border border-transparent hover:border-white/10 w-full text-left">
                
                  <div className="relative flex h-10 w-10 shrink-0 items-center justify-center overflow-hidden rounded-full bg-dark-800 border border-white/10">
                    {user.profilePicture ?
                  <img
                    src={user.profilePicture}
                    alt={user.name}
                    className="h-full w-full object-cover" /> :


                  <UserIcon className="h-5 w-5 text-gray-400" />
                  }
                  </div>
                  <div className="flex flex-col overflow-hidden">
                    <span className="text-sm font-medium text-white truncate">
                      {user.name}
                    </span>
                    <span className="text-xs text-purple-400 capitalize truncate">
                      {user.role}
                    </span>
                  </div>
                </button>

                {/* Mobile Logout */}
                <button
                onClick={() => {
                  onCloseMobile();
                  onLogout();
                }}
                className="flex items-center justify-start gap-3 px-3 py-3 rounded-xl text-red-400 hover:bg-red-500/10 hover:text-red-300 transition-colors border border-transparent hover:border-red-500/20 w-full">
                
                  <LogOutIcon className="h-5 w-5 shrink-0" />
                  <span className="text-sm font-medium">Log out</span>
                </button>
              </div>
            </motion.aside>
          </>
        }
      </AnimatePresence>
    </>);

}