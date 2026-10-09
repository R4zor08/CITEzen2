import { useEffect, useState } from 'react';
import { User } from '../types';
import { MenuIcon, SunIcon, MoonIcon, XIcon } from 'lucide-react';
import { useTheme } from '../hooks/useTheme';
interface NavbarProps {
  user: User | null;
  onNavigate: (page: string) => void;
  onToggleMobileSidebar?: () => void;
}
export function Navbar({
  user,
  onNavigate,
  onToggleMobileSidebar
}: NavbarProps) {
  const { isDark, toggleTheme } = useTheme();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
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
    <nav className="sticky top-0 z-30 w-full glass-panel rounded-none border-x-0 border-t-0 px-4 py-3 sm:px-6 lg:px-8 bg-dark-900/80 backdrop-blur-xl">
      <div className="flex items-center justify-between">
        {/* Mobile Left: Hamburger + Logo */}
        <div className="flex items-center gap-3 md:hidden">
          <button
            onClick={onToggleMobileSidebar}
            className="rounded-lg p-2 text-gray-400 hover:bg-white/5 hover:text-white transition-colors"
            title="Menu">
            
            <MenuIcon className="h-6 w-6" />
          </button>
          <div
            className="flex items-center gap-2 cursor-pointer"
            onClick={() => onNavigate(`${user.role}-dashboard`)}>
            
            <div className="relative flex h-8 w-8 items-center justify-center overflow-hidden rounded-full bg-gradient-to-br from-sky-500/20 to-cyan-500/20 border border-white/10">
              <img
                src="/citezen.png?v=2"
                alt="Logo"
                className="h-8 w-8 object-cover rounded-full" />
            </div>
            <span className="text-lg font-bold tracking-tight text-white">
              CITE<span className="text-gradient">zen</span>
            </span>
          </div>
        </div>

        {/* Desktop Left */}
        <div className="hidden md:flex items-center gap-3">
          <h1 className="text-lg font-bold text-white capitalize tracking-tight">
            {user.role} Dashboard
          </h1>
        </div>

        {/* Right: Theme Toggle */}
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={toggleTheme}
            className="rounded-xl p-2 text-gray-400 hover:text-white hover:bg-white/5 transition-colors border border-transparent hover:border-white/10"
            title={isDark ? "Switch to light mode" : "Switch to dark mode"}
            aria-label="Toggle theme">
            {isDark ? (
              <SunIcon className="h-5 w-5" />
            ) : (
              <MoonIcon className="h-5 w-5" />
            )}
          </button>
        </div>
      </div>
    </nav>);

}