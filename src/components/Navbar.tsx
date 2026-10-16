import { useEffect, useState } from 'react';
import { User, Notification } from '../types';
import { MenuIcon, SunIcon, MoonIcon, XIcon, BellIcon } from 'lucide-react';
import { useTheme } from '../hooks/useTheme';
import { RecentNotificationsModal } from './RecentNotificationsModal';

interface NavbarProps {
  user: User | null;
  onNavigate: (page: string) => void;
  onToggleMobileSidebar?: () => void;
  unreadCount?: number;
  notifications?: Notification[];
  onMarkNotificationRead?: (id: string, read?: boolean) => void | Promise<void>;
  onMarkAllNotificationsRead?: () => void | Promise<void>;
  onDeleteNotification?: (id: string) => void | Promise<void>;
  onSelectConcern?: (concernId: string) => void;
  onViewAllNotifications?: () => void;
  onNotificationClick?: () => void;
  activeTab?: string;
}

export function Navbar({
  user,
  onNavigate,
  onToggleMobileSidebar,
  unreadCount = 0,
  notifications = [],
  onMarkNotificationRead,
  onMarkAllNotificationsRead,
  onDeleteNotification,
  onSelectConcern,
  onViewAllNotifications,
  onNotificationClick,
  activeTab
}: NavbarProps) {
  const { isDark, toggleTheme } = useTheme();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [isNotificationModalOpen, setIsNotificationModalOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const handleNavigate = (page: string) => {
    onNavigate(page);
    setIsMobileMenuOpen(false);
  };
  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 48);
    onScroll();
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, []);
  // Public Navbar (no user logged in)
  if (!user) {
    return (
      <nav
        className={`landing-nav fixed top-0 left-0 right-0 z-50 w-full rounded-none px-4 py-3 sm:px-6 lg:px-8 ${
          scrolled ? 'landing-nav--scrolled' : ''
        }`}
      >
        <div className="relative z-10 mx-auto flex max-w-7xl items-center justify-between">
          <div
            className="flex items-center gap-3 cursor-pointer group"
            onClick={() => handleNavigate('landing')}>
            
            <div className="landing-logo-ring relative flex h-10 w-10 items-center justify-center overflow-hidden rounded-full border transition-all duration-300">
              <img
                src="/citezen.png?v=2"
                alt="CITEzen Logo"
                className="h-10 w-10 object-cover rounded-full" />
              
            </div>
            <span className="landing-brand text-xl font-bold tracking-tight">
              CITE<span className="text-gradient">zen</span>
            </span>
          </div>

          <div className="hidden md:flex items-center gap-3">
            <div className="flex items-center mr-1">
              <a
                href="#home"
                className="landing-link text-[13px] font-semibold tracking-wide uppercase transition-colors">
                Home
              </a>
              <a
                href="#features"
                className="landing-link text-[13px] font-semibold tracking-wide uppercase transition-colors">
                Features
              </a>
              <a
                href="#about"
                className="landing-link text-[13px] font-semibold tracking-wide uppercase transition-colors">
                About
              </a>
              <a
                href="#contact"
                className="landing-link text-[13px] font-semibold tracking-wide uppercase transition-colors">
                Contact
              </a>
            </div>
            <button
              onClick={toggleTheme}
              className="landing-icon-btn rounded-full p-2 transition-colors"
              title="Toggle Theme">
              
              {isDark ?
              <SunIcon className="h-5 w-5" /> :

              <MoonIcon className="h-5 w-5" />
              }
            </button>
            <button
              onClick={() => handleNavigate('login')}
              className="landing-cta-lime px-5 py-2 text-sm transition-all hover:scale-105 active:scale-95">
              Login
            </button>
          </div>

          <div className="flex md:hidden items-center gap-4">
            <button
              onClick={toggleTheme}
              className="landing-icon-btn rounded-full p-2 transition-colors">
              
              {isDark ?
              <SunIcon className="h-5 w-5" /> :

              <MoonIcon className="h-5 w-5" />
              }
            </button>
            <button
              onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
              className="landing-icon-btn rounded-full p-2 transition-colors">
              
              {isMobileMenuOpen ?
              <XIcon className="h-6 w-6" /> :

              <MenuIcon className="h-6 w-6" />
              }
            </button>
          </div>
        </div>

        {isMobileMenuOpen &&
        <div className="landing-nav-menu absolute left-0 top-full w-full md:hidden animate-slide-down">
            <div className="flex flex-col space-y-4 p-4">
              <div className="flex flex-col space-y-3 pb-4 border-b border-white/15">
                <a
                href="#home"
                onClick={() => setIsMobileMenuOpen(false)}
                className="text-sm font-medium px-2 py-1">
                  Home
                </a>
                <a
                href="#features"
                onClick={() => setIsMobileMenuOpen(false)}
                className="text-sm font-medium px-2 py-1">
                  Features
                </a>
                <a
                href="#about"
                onClick={() => setIsMobileMenuOpen(false)}
                className="text-sm font-medium px-2 py-1">
                  About
                </a>
                <a
                href="#contact"
                onClick={() => setIsMobileMenuOpen(false)}
                className="text-sm font-medium px-2 py-1">
                  Contact
                </a>
              </div>
              <button
              onClick={() => handleNavigate('login')}
              className="landing-cta-lime w-full px-4 py-3 text-center text-sm">
                Login
              </button>
            </div>
          </div>
        }
      </nav>);

  }
  // Dashboard Navbar (authenticated user) — minimal
  return (
    <nav className="dashboard-navbar sticky top-0 z-30 w-full border-x-0 border-t-0 border-b border-slate-200/90 dark:border-white/10 px-4 py-3 sm:px-6 lg:px-8 bg-white dark:bg-dark-900 transition-colors shadow-xs">
      <div className="flex items-center justify-between">
        {/* Mobile Left: Hamburger + Logo */}
        <div className="flex items-center gap-3 md:hidden">
          <button
            onClick={onToggleMobileSidebar}
            className="rounded-lg p-2 text-slate-500 dark:text-gray-400 hover:bg-slate-100 dark:hover:bg-white/5 hover:text-slate-900 dark:hover:text-white transition-colors"
            title="Menu">
            
            <MenuIcon className="h-6 w-6" />
          </button>
          <div
            className="flex items-center gap-2 cursor-pointer"
            onClick={() => onNavigate(`${user.role}-dashboard`)}>
            
            <div className="relative flex h-8 w-8 items-center justify-center overflow-hidden rounded-full bg-gradient-to-br from-sky-500/20 to-cyan-500/20 border border-slate-200 dark:border-white/10">
              <img
                src="/citezen.png?v=2"
                alt="Logo"
                className="h-8 w-8 object-cover rounded-full" />
            </div>
            <span className="text-lg font-bold tracking-tight text-slate-900 dark:text-white">
              CITE<span className="text-gradient">zen</span>
            </span>
          </div>
        </div>

        {/* Desktop Left */}
        <div className="hidden md:flex items-center gap-3">
          <h1 className="text-lg font-bold text-slate-900 dark:text-white capitalize tracking-tight">
            {user.role} Dashboard
          </h1>
        </div>

        {/* Right: Notifications Icon */}
        <div className="relative flex items-center gap-2">
          <button
            type="button"
            onClick={() => setIsNotificationModalOpen((prev) => !prev)}
            className={`relative rounded-xl p-2.5 transition-all border touch-manipulation ${
              isNotificationModalOpen || activeTab === 'notifications'
                ? 'bg-sky-50 dark:bg-sky-500/15 text-sky-600 dark:text-sky-400 border-sky-200 dark:border-sky-500/30 shadow-xs'
                : 'text-slate-600 dark:text-gray-400 hover:text-slate-900 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-white/5 border-transparent hover:border-slate-200 dark:hover:border-white/10'
            }`}
            title="Notifications"
            aria-label="Notifications"
          >
            <BellIcon className="h-5 w-5" />
            {unreadCount > 0 && (
              <span className="absolute -top-1 -right-1 flex h-4 min-w-[1rem] items-center justify-center rounded-full bg-red-500 px-1 text-[10px] font-bold text-white shadow-xs ring-2 ring-white dark:ring-dark-900">
                {unreadCount > 99 ? '99+' : unreadCount}
              </span>
            )}
          </button>

          <RecentNotificationsModal
            isOpen={isNotificationModalOpen}
            onClose={() => setIsNotificationModalOpen(false)}
            notifications={notifications}
            onMarkRead={(id, read) => onMarkNotificationRead?.(id, read)}
            onMarkAllRead={onMarkAllNotificationsRead}
            onDeleteNotification={onDeleteNotification}
            onSelectConcern={onSelectConcern}
            onViewAll={() => {
              setIsNotificationModalOpen(false);
              if (onViewAllNotifications) {
                onViewAllNotifications();
              } else if (onNotificationClick) {
                onNotificationClick();
              } else {
                onNavigate('notifications');
              }
            }}
            maxRecent={6}
          />
        </div>
      </div>
    </nav>);
}