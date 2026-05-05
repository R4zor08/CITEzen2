import { useState } from 'react';
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
  const handleNavigate = (page: string) => {
    onNavigate(page);
    setIsMobileMenuOpen(false);
  };
  // Public Navbar (no user logged in)
  if (!user) {
    return (
      <nav className="fixed top-0 left-0 right-0 z-50 w-full glass-panel rounded-none border-x-0 border-t-0 px-4 py-3 sm:px-6 lg:px-8">
        <div className="mx-auto flex max-w-7xl items-center justify-between">
          <div
            className="flex items-center gap-3 cursor-pointer group"
            onClick={() => handleNavigate('landing')}>
            
            <div className="relative flex h-10 w-10 items-center justify-center overflow-hidden rounded-full bg-gradient-to-br from-purple-500/20 to-cyan-500/20 border border-white/10 group-hover:border-purple-500/50 transition-all duration-300 group-hover:shadow-lg group-hover:shadow-purple-500/20">
              <img
                src="/Gemini_Generated_Image_u7mgetu7mgetu7mg.png"
                alt="CITEzen Logo"
                className="h-10 w-10 object-cover rounded-full" />
              
            </div>
            <span className="text-xl font-bold tracking-tight text-white">
              CITE<span className="text-gradient">zen</span>
            </span>
          </div>

          <div className="hidden md:flex items-center gap-6">
            <div className="flex items-center gap-6 mr-4 border-r border-white/10 pr-6">
              <a
                href="#home"
                className="text-sm font-medium text-gray-300 hover:text-white hover:text-purple-400 transition-colors">
                
                Home
              </a>
              <a
                href="#features"
                className="text-sm font-medium text-gray-300 hover:text-white hover:text-purple-400 transition-colors">
                
                Features
              </a>
              <a
                href="#about"
                className="text-sm font-medium text-gray-300 hover:text-white hover:text-purple-400 transition-colors">
                
                About
              </a>
              <a
                href="#contact"
                className="text-sm font-medium text-gray-300 hover:text-white hover:text-purple-400 transition-colors">
                
                Contact
              </a>
            </div>
            <button
              onClick={toggleTheme}
              className="rounded-lg p-2 text-gray-400 hover:bg-white/5 hover:text-white transition-colors"
              title="Toggle Theme">
              
              {isDark ?
              <SunIcon className="h-5 w-5" /> :

              <MoonIcon className="h-5 w-5" />
              }
            </button>
            <button
              onClick={() => handleNavigate('login')}
              className="rounded-xl bg-gradient-to-r from-purple-600 to-indigo-600 px-4 py-2 text-sm font-medium text-white shadow-lg shadow-purple-500/25 hover:from-purple-500 hover:to-indigo-500 transition-all hover:scale-105 active:scale-95">
              
              Login
            </button>
          </div>

          <div className="flex md:hidden items-center gap-4">
            <button
              onClick={toggleTheme}
              className="rounded-lg p-2 text-gray-400 hover:bg-white/5 hover:text-white transition-colors">
              
              {isDark ?
              <SunIcon className="h-5 w-5" /> :

              <MoonIcon className="h-5 w-5" />
              }
            </button>
            <button
              onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
              className="rounded-lg p-2 text-gray-400 hover:bg-white/5 hover:text-white transition-colors">
              
              {isMobileMenuOpen ?
              <XIcon className="h-6 w-6" /> :

              <MenuIcon className="h-6 w-6" />
              }
            </button>
          </div>
        </div>

        {isMobileMenuOpen &&
        <div className="absolute left-0 top-full w-full border-b border-white/10 bg-dark-900/95 backdrop-blur-xl md:hidden animate-slide-down">
            <div className="flex flex-col space-y-4 p-4">
              <div className="flex flex-col space-y-3 pb-4 border-b border-white/10">
                <a
                href="#home"
                onClick={() => setIsMobileMenuOpen(false)}
                className="text-sm font-medium text-gray-300 hover:text-white px-2 py-1">
                
                  Home
                </a>
                <a
                href="#features"
                onClick={() => setIsMobileMenuOpen(false)}
                className="text-sm font-medium text-gray-300 hover:text-white px-2 py-1">
                
                  Features
                </a>
                <a
                href="#about"
                onClick={() => setIsMobileMenuOpen(false)}
                className="text-sm font-medium text-gray-300 hover:text-white px-2 py-1">
                
                  About
                </a>
                <a
                href="#contact"
                onClick={() => setIsMobileMenuOpen(false)}
                className="text-sm font-medium text-gray-300 hover:text-white px-2 py-1">
                
                  Contact
                </a>
              </div>
              <button
              onClick={() => handleNavigate('login')}
              className="w-full rounded-xl bg-gradient-to-r from-purple-600 to-indigo-600 px-4 py-3 text-center text-sm font-medium text-white shadow-lg shadow-purple-500/25">
              
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
            
            <div className="relative flex h-8 w-8 items-center justify-center overflow-hidden rounded-full bg-gradient-to-br from-purple-500/20 to-cyan-500/20 border border-white/10">
              <img
                src="/Gemini_Generated_Image_u7mgetu7mgetu7mg.png"
                alt="Logo"
                className="h-8 w-8 object-cover rounded-full" />
              
            </div>
            <span className="text-lg font-bold tracking-tight text-white">
              CITE<span className="text-gradient">zen</span>
            </span>
          </div>
        </div>

        {/* Desktop Left */}
        <div className="hidden md:flex items-center gap-4">
          <h1 className="text-lg font-semibold text-white capitalize">
            {user.role} Dashboard
          </h1>
        </div>
      </div>
    </nav>);

}