import React, { useState } from 'react';
import { Role } from '../types';
import { useTheme } from '../hooks/useTheme';
import {
  MailIcon,
  LockIcon,
  ArrowRightIcon,
  Loader2Icon,
  HashIcon,
  EyeIcon,
  EyeOffIcon,
  SunIcon,
  MoonIcon
} from 'lucide-react';

interface LoginPageProps {
  onLogin: (identifier: string, password: string, role: Role) => Promise<any>;
  onNavigate: (page: string) => void;
}

export function LoginPage({ onLogin, onNavigate }: LoginPageProps) {
  const { isDark, toggleTheme } = useTheme();
  const [identifier, setIdentifier] = useState('');
  const [password, setPassword] = useState('');
  const [role, setRole] = useState<Role>('student');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const [showPassword, setShowPassword] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!identifier || !password) {
      setError('Please fill in all fields');
      return;
    }
    setIsLoading(true);
    setError('');
    try {
      await onLogin(identifier, password, role);
    } catch (err: any) {
      setError(err.message || 'Invalid credentials. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleRoleChange = (newRole: Role) => {
    setRole(newRole);
    setIdentifier('');
    setError('');
  };

  return (
    <div className="auth-page flex flex-col justify-center px-4 py-8 sm:py-12 sm:px-6 lg:px-8 relative overflow-hidden">
      <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] bg-sky-500/15 dark:bg-purple-600/20 blur-[120px] rounded-full pointer-events-none" />
      <div className="absolute bottom-[-10%] right-[-10%] w-[40%] h-[40%] bg-cyan-500/10 blur-[120px] rounded-full pointer-events-none" />

      <button
        type="button"
        onClick={toggleTheme}
        className="auth-theme-btn absolute top-4 right-4 sm:top-6 sm:right-6 z-20 rounded-xl p-2.5 transition-colors"
        title="Toggle theme"
      >
        {isDark ? <SunIcon className="h-5 w-5" /> : <MoonIcon className="h-5 w-5" />}
      </button>

      <div className="mx-auto w-full max-w-md relative z-10">
        <div
          className="flex justify-center cursor-pointer group mb-4 sm:mb-6"
          onClick={() => onNavigate('landing')}
        >
          <div className="relative flex h-16 w-16 sm:h-20 sm:w-20 items-center justify-center overflow-hidden rounded-full bg-gradient-to-br from-sky-500/20 to-cyan-500/20 border border-[var(--border-color)] group-hover:border-sky-500/50 transition-all duration-300 shadow-xl shadow-sky-500/20 group-hover:shadow-sky-500/40 group-hover:scale-105">
            <img
              src="/citezen.png?v=2"
              alt="CITEzen Logo"
              className="h-16 w-16 sm:h-20 sm:w-20 object-cover rounded-full"
            />
          </div>
        </div>

        <h2 className="auth-title text-center text-2xl sm:text-3xl font-extrabold tracking-tight">
          Welcome back
        </h2>
        <p className="auth-subtitle mt-1.5 sm:mt-2 text-center text-xs sm:text-sm">
          Sign in to your account to continue
        </p>
      </div>

      <div className="mt-6 sm:mt-8 mx-auto w-full max-w-md relative z-10">
        <div className="glass-panel py-6 sm:py-8 px-4 sm:px-10 animate-slide-up shadow-2xl shadow-sky-500/10 hover:border-sky-500/30 transition-colors duration-500">
          <div className="auth-role-track flex p-1 rounded-xl mb-6 sm:mb-8 shadow-inner">
            {(['student', 'staff', 'admin'] as const).map((r) => (
              <button
                key={r}
                type="button"
                onClick={() => handleRoleChange(r)}
                className={`flex-1 py-2 text-xs sm:text-sm font-medium rounded-lg capitalize transition-all ${
                  role === r
                    ? 'bg-gradient-to-r from-blue-600 to-sky-600 text-white shadow-sm'
                    : 'auth-role-idle'
                }`}
              >
                {r}
              </button>
            ))}
          </div>

          <form className="space-y-4 sm:space-y-6" onSubmit={handleSubmit}>
            {error && (
              <div className="p-2.5 sm:p-3 rounded-lg bg-red-500/10 border border-red-500/20 text-xs sm:text-sm text-red-400 text-center">
                {error}
              </div>
            )}

            <div>
              <label className="auth-label block text-xs sm:text-sm font-medium mb-1 sm:mb-1.5">
                {role === 'student' ? 'Student ID' : 'Email address'}
              </label>
              <div className="relative group">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  {role === 'student' ? (
                    <HashIcon className="h-4 w-4 sm:h-5 sm:w-5 text-[var(--text-muted)] group-focus-within:text-sky-400 transition-colors" />
                  ) : (
                    <MailIcon className="h-4 w-4 sm:h-5 sm:w-5 text-[var(--text-muted)] group-focus-within:text-sky-400 transition-colors" />
                  )}
                </div>
                <input
                  type={role === 'student' ? 'text' : 'email'}
                  value={identifier}
                  onChange={(e) => setIdentifier(e.target.value)}
                  className="auth-input block pl-9 sm:pl-10 py-2.5 sm:py-3 text-sm sm:text-base"
                  placeholder={role === 'student' ? '2023-00142' : 'you@nemsu.edu.ph'}
                  required
                />
              </div>
            </div>

            <div>
              <label className="auth-label block text-xs sm:text-sm font-medium mb-1 sm:mb-1.5">
                Password
              </label>
              <div className="relative group">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <LockIcon className="h-4 w-4 sm:h-5 sm:w-5 text-[var(--text-muted)] group-focus-within:text-sky-400 transition-colors" />
                </div>
                <input
                  type={showPassword ? 'text' : 'password'}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="auth-input block pl-9 sm:pl-10 pr-10 py-2.5 sm:py-3 text-sm sm:text-base"
                  placeholder="••••••••"
                  required
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute inset-y-0 right-0 pr-3 flex items-center text-[var(--text-muted)] hover:text-[var(--text-primary)] transition-colors"
                >
                  {showPassword ? (
                    <EyeOffIcon className="h-4 w-4 sm:h-5 sm:w-5" />
                  ) : (
                    <EyeIcon className="h-4 w-4 sm:h-5 sm:w-5" />
                  )}
                </button>
              </div>
            </div>

            <div className="flex items-center justify-between">
              <div className="flex items-center">
                <input
                  id="remember-me"
                  type="checkbox"
                  className="h-3.5 w-3.5 sm:h-4 sm:w-4 rounded border-[var(--border-color)] bg-[var(--bg-tertiary)] text-sky-500 focus:ring-sky-500"
                />
                <label htmlFor="remember-me" className="auth-muted ml-2 block text-xs sm:text-sm">
                  Remember me
                </label>
              </div>
              <div className="text-xs sm:text-sm">
                <a href="#" className="auth-link font-medium hover:underline underline-offset-4">
                  Forgot password?
                </a>
              </div>
            </div>

            <button
              type="submit"
              disabled={isLoading}
              className="w-full flex justify-center items-center gap-2 py-2.5 sm:py-3 px-4 border border-transparent rounded-xl shadow-lg shadow-sky-500/25 text-sm font-medium text-white bg-gradient-to-r from-sky-600 via-cyan-500 to-emerald-400 hover:from-sky-500 hover:to-emerald-300 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-sky-500 transition-all hover:scale-[1.02] active:scale-[0.98] disabled:opacity-70 disabled:hover:scale-100"
            >
              {isLoading ? (
                <Loader2Icon className="h-4 w-4 sm:h-5 sm:w-5 animate-spin" />
              ) : (
                <>
                  Sign in <ArrowRightIcon className="h-3.5 w-3.5 sm:h-4 sm:w-4" />
                </>
              )}
            </button>
          </form>

          {role !== 'admin' && (
            <div className="mt-6 sm:mt-8 text-center">
              <p className="auth-muted text-xs sm:text-sm">
                Don't have an account?{' '}
                <button
                  onClick={() => onNavigate('register')}
                  className="auth-link font-medium hover:underline underline-offset-4"
                >
                  Register here
                </button>
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
