import { useEffect, useState } from 'react';
import type { User } from './types';
import { useAuth } from './hooks/useAuth';
import { useThemeProvider, ThemeContext } from './hooks/useTheme';
import { useConcerns } from './hooks/useConcerns';
import { LandingPage } from './pages/LandingPage';
import { LoginPage } from './pages/LoginPage';
import { RegisterPage } from './pages/RegisterPage';
import { StudentDashboard } from './pages/StudentDashboard';
import { StaffDashboard } from './pages/StaffDashboard';
import { AdminDashboard } from './pages/AdminDashboard';
import { ChatBubble } from './components/ChatBubble';
import { Loader2Icon } from 'lucide-react';
import { Toaster } from 'sonner';

function isGabAiHash(): boolean {
  const raw = window.location.hash.replace(/^#/, '').replace(/^\//, '');
  return raw === 'gabai';
}
type Page =
'landing' |
'login' |
'register' |
'student-dashboard' |
'staff-dashboard' |
'admin-dashboard';
export function App() {
  const {
    user,
    isAuthenticated,
    isLoading,
    login,
    register,
    logout,
    updateUser
  } = useAuth();
  const themeValue = useThemeProvider();
  const concernsData = useConcerns(user);
  const [currentPage, setCurrentPage] = useState<Page>('landing');
  const [gabAiFromHash, setGabAiFromHash] = useState(isGabAiHash);
  useEffect(() => {
    const onHashChange = () => setGabAiFromHash(isGabAiHash());
    window.addEventListener('hashchange', onHashChange);
    return () => window.removeEventListener('hashchange', onHashChange);
  }, []);
  // Handle routing based on auth state
  useEffect(() => {
    if (!isLoading) {
      if (isAuthenticated && user) {
        // If logged in but on a public page, redirect to dashboard
        if (['landing', 'login', 'register'].includes(currentPage)) {
          setCurrentPage(`${user.role}-dashboard` as Page);
        } else if (currentPage !== `${user.role}-dashboard`) {
          // Role-based access control: Prevent accessing other roles' dashboards
          setCurrentPage(`${user.role}-dashboard` as Page);
        }
      } else {
        // If not logged in but on a protected page, redirect to landing
        if (currentPage.includes('dashboard')) {
          setCurrentPage('landing');
        }
      }
    }
  }, [isAuthenticated, user, isLoading, currentPage]);
  const handleNavigate = (page: string) => {
    setCurrentPage(page as Page);
    window.scrollTo({
      top: 0,
      behavior: 'smooth'
    });
  };
  const handleLogout = () => {
    logout();
    handleNavigate('landing');
  };
  const handleUpdateUser = async (data: Partial<User>) => {
    await updateUser(data);
  };
  if (isLoading) {
    return (
      <div className="min-h-screen bg-dark-900 flex flex-col items-center justify-center text-white">
        <div className="relative flex h-20 w-20 items-center justify-center overflow-hidden rounded-full bg-gradient-to-br from-purple-500/20 to-cyan-500/20 border border-white/10 mb-6 animate-pulse">
          <img
            src="/Gemini_Generated_Image_u7mgetu7mgetu7mg.png"
            alt="CITEzen Logo"
            className="h-20 w-20 object-cover rounded-full" />
          
        </div>
        <Loader2Icon className="h-8 w-8 text-purple-500 animate-spin" />
        <p className="mt-4 text-gray-400 font-medium tracking-widest uppercase text-sm">
          Loading CITEzen...
        </p>
      </div>);

  }

  const toaster = (
    <Toaster
      theme={themeValue.isDark ? 'dark' : 'light'}
      position="top-center"
      toastOptions={{
        style: themeValue.isDark
          ? {
              background: '#1a1a2e',
              border: '1px solid rgba(255,255,255,0.1)',
              color: '#e5e7eb'
            }
          : {
              background: '#ffffff',
              border: '1px solid rgba(0,0,0,0.1)',
              color: '#0f172a',
              boxShadow:
                '0 4px 6px -1px rgba(0,0,0,0.08), 0 10px 24px rgba(0,0,0,0.08)'
            }
      }}
    />
  );

  if (gabAiFromHash && user?.role === 'student') {
    return (
      <ThemeContext.Provider value={themeValue}>
        <div className="min-h-screen bg-dark-900 text-gray-200 font-sans selection:bg-purple-500/30 h-screen overflow-hidden flex flex-col">
          {toaster}
          <ChatBubble user={user} isStandaloneWindow />
        </div>
      </ThemeContext.Provider>
    );
  }

  if (gabAiFromHash && (!user || user.role !== 'student')) {
    return (
      <ThemeContext.Provider value={themeValue}>
        <div className="min-h-screen bg-dark-900 text-gray-200 font-sans flex flex-col items-center justify-center p-6 text-center">
          {toaster}
          <p className="text-white font-medium mb-2">
            GabAI is for signed-in students
          </p>
          <p className="text-sm text-gray-400 max-w-sm mb-6">
            Sign in as a student from the main CITEzen window, then tap the floating
            GabAI bubble on your dashboard, or use this window after signing in.
          </p>
          <button
            type="button"
            onClick={() => window.close()}
            className="px-4 py-2 rounded-xl bg-white/10 text-white hover:bg-white/15 text-sm">
            Close window
          </button>
        </div>
      </ThemeContext.Provider>
    );
  }

  // Render current page
  return (
    <ThemeContext.Provider value={themeValue}>
      <div className="min-h-screen bg-dark-900 text-gray-200 font-sans selection:bg-purple-500/30">
        {toaster}
        
        {currentPage === 'landing' &&
        <LandingPage onNavigate={handleNavigate} />
        }

        {currentPage === 'login' &&
        <LoginPage onLogin={login} onNavigate={handleNavigate} />
        }

        {currentPage === 'register' &&
        <RegisterPage onRegister={register} onNavigate={handleNavigate} />
        }

        {currentPage === 'student-dashboard' && user?.role === 'student' &&
        <StudentDashboard
          user={user}
          onLogout={handleLogout}
          onNavigate={handleNavigate}
          concernsData={concernsData}
          onUpdateUser={handleUpdateUser} />

        }

        {currentPage === 'staff-dashboard' && user?.role === 'staff' &&
        <StaffDashboard
          user={user}
          onLogout={handleLogout}
          onNavigate={handleNavigate}
          concernsData={concernsData}
          onUpdateUser={handleUpdateUser} />

        }

        {currentPage === 'admin-dashboard' && user?.role === 'admin' &&
        <AdminDashboard
          user={user}
          onLogout={handleLogout}
          onNavigate={handleNavigate}
          concernsData={concernsData}
          onUpdateUser={handleUpdateUser} />

        }
      </div>
    </ThemeContext.Provider>);

}