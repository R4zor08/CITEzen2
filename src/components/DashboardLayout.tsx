import { useEffect, useState } from 'react';
import type { ReactNode } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { User, Role } from '../types';
import { Sidebar } from './Sidebar';
import { Navbar } from './Navbar';
import { LogoutModal } from './LogoutModal';
import { NotificationPanel } from './NotificationPanel';
interface DashboardLayoutProps {
  user: User;
  role: Role;
  activeTab: string;
  onTabChange: (tab: string) => void;
  onLogout: () => void;
  onNavigate: (page: string) => void;
  concernsData: any;
  children: ReactNode;
}
export function DashboardLayout({
  user,
  role,
  activeTab,
  onTabChange,
  onLogout,
  onNavigate,
  concernsData,
  children
}: DashboardLayoutProps) {
  const [isCollapsed, setIsCollapsed] = useState(() => {
    const stored = localStorage.getItem('citezen_sidebar_collapsed');
    return stored === 'true';
  });
  const [isMobileOpen, setIsMobileOpen] = useState(false);
  const [showLogoutModal, setShowLogoutModal] = useState(false);
  useEffect(() => {
    localStorage.setItem('citezen_sidebar_collapsed', String(isCollapsed));
  }, [isCollapsed]);
  // Close mobile sidebar when tab changes
  useEffect(() => {
    setIsMobileOpen(false);
  }, [activeTab]);
  return (
    <div className="min-h-screen bg-dark-900 text-gray-200 flex overflow-hidden">
      {/* Sidebar */}
      <Sidebar
        user={user}
        role={role}
        activeTab={activeTab}
        onTabChange={onTabChange}
        isCollapsed={isCollapsed}
        onToggleCollapse={() => setIsCollapsed(!isCollapsed)}
        isMobileOpen={isMobileOpen}
        onCloseMobile={() => setIsMobileOpen(false)}
        onLogout={() => setShowLogoutModal(true)}
        unreadCount={concernsData.unreadCount}
      />
      

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col min-w-0 h-screen overflow-hidden relative">
        <Navbar
          user={user}
          onNavigate={onNavigate}
          onToggleMobileSidebar={() => setIsMobileOpen(true)} />
        

        <main className="flex-1 overflow-y-auto custom-scrollbar p-3 sm:p-6 lg:p-8 pb-[max(1rem,env(safe-area-inset-bottom,0px))]">
          <div className="max-w-7xl mx-auto w-full">
            <AnimatePresence mode="wait">
              <motion.div
                key={activeTab}
                initial={{
                  opacity: 0,
                  y: 10
                }}
                animate={{
                  opacity: 1,
                  y: 0
                }}
                exit={{
                  opacity: 0,
                  y: -10
                }}
                transition={{
                  duration: 0.3
                }}>
                
                {activeTab === 'notifications' ?
                <div className="w-full min-w-0 max-w-full">
                    <NotificationPanel
                    notifications={concernsData.notifications}
                    onMarkRead={concernsData.markNotificationRead}
                    onMarkAllRead={concernsData.markAllNotificationsRead}
                    onClearAll={concernsData.clearAllNotifications} />
                  
                  </div> :

                children
                }
              </motion.div>
            </AnimatePresence>
          </div>
        </main>
      </div>

      <LogoutModal
        isOpen={showLogoutModal}
        onClose={() => setShowLogoutModal(false)}
        onConfirm={onLogout} />
      
    </div>);

}