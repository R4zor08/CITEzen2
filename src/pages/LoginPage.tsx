import React, { useState, useEffect } from 'react';
import { Role } from '../types';
import { apiJson } from '../lib/api';
import { toast } from 'sonner';
import {
  MailIcon,
  LockIcon,
  ArrowRightIcon,
  ArrowLeftIcon,
  Loader2Icon,
  HashIcon,
  EyeIcon,
  EyeOffIcon,
  AlertCircleIcon,
  KeyRoundIcon,
  CheckCircle2Icon,
  XIcon
} from 'lucide-react';

interface LoginPageProps {
  onLogin: (identifier: string, password: string, role: Role, rememberMe?: boolean) => Promise<any>;
  onNavigate: (page: string) => void;
}

export function LoginPage({ onLogin, onNavigate }: LoginPageProps) {
  const [identifier, setIdentifier] = useState('');
  const [password, setPassword] = useState('');
  const [role, setRole] = useState<Role>('student');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [rememberMe, setRememberMe] = useState(() => {
    try {
      return localStorage.getItem('citezen_remember_me') === 'true';
    } catch {
      return false;
    }
  });

  // Forgot Password modal state
  const [isForgotOpen, setIsForgotOpen] = useState(false);
  const [forgotStep, setForgotStep] = useState<'request' | 'verify'>('request');
  const [forgotIdentifier, setForgotIdentifier] = useState('');
  const [forgotOtp, setForgotOtp] = useState('');
  const [forgotNewPassword, setForgotNewPassword] = useState('');
  const [forgotConfirmPassword, setForgotConfirmPassword] = useState('');
  const [showForgotNewPassword, setShowForgotNewPassword] = useState(false);
  const [forgotLoading, setForgotLoading] = useState(false);
  const [forgotError, setForgotError] = useState('');
  const [maskedEmail, setMaskedEmail] = useState('');

  // Restore remembered credentials on initial mount
  useEffect(() => {
    try {
      const isRemembered = localStorage.getItem('citezen_remember_me') === 'true';
      if (isRemembered) {
        const savedId = localStorage.getItem('citezen_remembered_id');
        const savedRole = localStorage.getItem('citezen_remembered_role') as Role | null;
        if (savedId) setIdentifier(savedId);
        if (savedRole && (savedRole === 'student' || savedRole === 'staff' || savedRole === 'admin')) {
          setRole(savedRole);
        }
      }
    } catch {
      // ignore storage errors
    }
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!identifier || !password) {
      setError('Please fill in all fields');
      return;
    }
    setIsLoading(true);
    setError('');
    try {
      if (rememberMe) {
        localStorage.setItem('citezen_remember_me', 'true');
        localStorage.setItem('citezen_remembered_id', identifier);
        localStorage.setItem('citezen_remembered_role', role);
      } else {
        localStorage.removeItem('citezen_remember_me');
        localStorage.removeItem('citezen_remembered_id');
        localStorage.removeItem('citezen_remembered_role');
      }
      await onLogin(identifier, password, role, rememberMe);
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

  // Forgot password flow: Step 1 (Request OTP)
  const handleRequestOtp = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!forgotIdentifier.trim()) {
      setForgotError('Please enter your Student ID or Email.');
      return;
    }
    setForgotLoading(true);
    setForgotError('');
    try {
      const res = await apiJson<{ ok: boolean; maskedEmail: string; message: string }>(
        '/api/auth/forgot-password',
        {
          method: 'POST',
          body: JSON.stringify({ identifier: forgotIdentifier.trim() })
        }
      );
      setMaskedEmail(res.maskedEmail);
      setForgotStep('verify');
      toast.success(res.message || `Verification code sent to ${res.maskedEmail}`);
    } catch (err: any) {
      setForgotError(err.message || 'No registered account found with this ID or Email.');
    } finally {
      setForgotLoading(false);
    }
  };

  // Forgot password flow: Step 2 (Verify OTP & Reset Password)
  const handleResetPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!forgotOtp.trim() || forgotOtp.trim().length !== 6) {
      setForgotError('Please enter the 6-digit verification code.');
      return;
    }
    if (forgotNewPassword.length < 6) {
      setForgotError('Password must be at least 6 characters long.');
      return;
    }
    if (forgotNewPassword !== forgotConfirmPassword) {
      setForgotError('Passwords do not match.');
      return;
    }
    setForgotLoading(true);
    setForgotError('');
    try {
      const res = await apiJson<{ ok: boolean; message: string }>('/api/auth/reset-password', {
        method: 'POST',
        body: JSON.stringify({
          identifier: forgotIdentifier.trim(),
          otp: forgotOtp.trim(),
          newPassword: forgotNewPassword
        })
      });
      toast.success(res.message || 'Password reset successfully!');
      setIsForgotOpen(false);
      // Pre-fill the login form
      setIdentifier(forgotIdentifier.trim());
      setPassword('');
      setError('');
    } catch (err: any) {
      setForgotError(err.message || 'Failed to reset password. Please check your code.');
    } finally {
      setForgotLoading(false);
    }
  };

  return (
    <div className="auth-page flex flex-col justify-center px-4 py-8 sm:py-12 sm:px-6 lg:px-8 relative overflow-hidden">
      <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] bg-sky-500/15 dark:bg-purple-600/20 blur-[120px] rounded-full pointer-events-none" />
      <div className="absolute bottom-[-10%] right-[-10%] w-[40%] h-[40%] bg-cyan-500/10 blur-[120px] rounded-full pointer-events-none" />

      <button
        type="button"
        onClick={() => onNavigate('landing')}
        className="auth-theme-btn absolute top-4 left-4 sm:top-6 sm:left-6 z-20 rounded-xl p-2.5 transition-all flex items-center gap-1.5 text-xs sm:text-sm font-medium hover:scale-105 active:scale-95 cursor-pointer group"
        title="Back"
      >
        <ArrowLeftIcon className="h-4 w-4 sm:h-5 sm:w-5 group-hover:-translate-x-0.5 transition-transform" />
        <span className="hidden sm:inline">Back</span>
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
              <div
                role="alert"
                aria-live="assertive"
                className="auth-error flex items-center justify-center gap-2 p-2.5 sm:p-3 rounded-xl bg-red-50 border border-red-200 text-red-700 dark:bg-red-500/15 dark:border-red-500/30 dark:text-red-200 text-xs sm:text-sm text-center font-medium shadow-xs transition-colors"
              >
                <AlertCircleIcon className="h-4 w-4 shrink-0 text-red-600 dark:text-red-400" />
                <span>{error}</span>
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
                  checked={rememberMe}
                  onChange={(e) => setRememberMe(e.target.checked)}
                  className="h-3.5 w-3.5 sm:h-4 sm:w-4 rounded border-[var(--border-color)] bg-[var(--bg-tertiary)] text-sky-500 focus:ring-sky-500 cursor-pointer"
                />
                <label
                  htmlFor="remember-me"
                  className="auth-muted ml-2 block text-xs sm:text-sm cursor-pointer select-none"
                >
                  Remember me
                </label>
              </div>
              {role !== 'admin' && (
                <div className="text-xs sm:text-sm">
                  <button
                    type="button"
                    onClick={() => {
                      setForgotIdentifier(identifier || '');
                      setForgotStep('request');
                      setForgotError('');
                      setIsForgotOpen(true);
                    }}
                    className="auth-link font-medium hover:underline underline-offset-4 cursor-pointer"
                  >
                    Forgot password?
                  </button>
                </div>
              )}
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

      {/* Forgot Password Modal */}
      {isForgotOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-fade-in">
          <div className="glass-panel w-full max-w-md p-6 sm:p-8 rounded-2xl shadow-2xl relative border border-[var(--border-color)] bg-[var(--surface-color)]/95">
            <button
              type="button"
              onClick={() => setIsForgotOpen(false)}
              className="absolute top-4 right-4 p-1.5 rounded-lg text-[var(--text-muted)] hover:text-[var(--text-primary)] hover:bg-[var(--border-color)]/30 transition-all"
              title="Close modal"
            >
              <XIcon className="h-5 w-5" />
            </button>

            <div className="flex items-center gap-3 mb-4">
              <div className="w-10 h-10 rounded-xl bg-sky-500/15 border border-sky-500/30 flex items-center justify-center text-sky-500">
                <KeyRoundIcon className="h-5 w-5" />
              </div>
              <div>
                <h3 className="auth-title text-lg sm:text-xl font-bold">
                  {forgotStep === 'request' ? 'Reset Password' : 'Enter Verification Code'}
                </h3>
                <p className="auth-muted text-xs">
                  {forgotStep === 'request'
                    ? 'Receive a 6-digit code in your NEMSU email'
                    : `Code sent to ${maskedEmail || 'your email'}`}
                </p>
              </div>
            </div>

            {forgotError && (
              <div className="auth-error flex items-center gap-2 p-2.5 rounded-xl bg-red-50 border border-red-200 text-red-700 dark:bg-red-500/15 dark:border-red-500/30 dark:text-red-200 text-xs font-medium mb-4">
                <AlertCircleIcon className="h-4 w-4 shrink-0" />
                <span>{forgotError}</span>
              </div>
            )}

            {forgotStep === 'request' ? (
              <form onSubmit={handleRequestOtp} className="space-y-4">
                <div>
                  <label className="auth-label block text-xs font-medium mb-1.5">
                    Student ID or NEMSU Email
                  </label>
                  <div className="relative group">
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                      <MailIcon className="h-4 w-4 text-[var(--text-muted)] group-focus-within:text-sky-400" />
                    </div>
                    <input
                      type="text"
                      value={forgotIdentifier}
                      onChange={(e) => setForgotIdentifier(e.target.value)}
                      className="auth-input block pl-9 py-2.5 text-sm"
                      placeholder="e.g. 2023-00142 or rcllanto@nemsu.edu.ph"
                      required
                      autoFocus
                    />
                  </div>
                </div>

                <div className="flex gap-2.5 pt-2">
                  <button
                    type="button"
                    onClick={() => setIsForgotOpen(false)}
                    className="flex-1 py-2.5 px-4 rounded-xl border border-[var(--border-color)] text-xs font-semibold text-[var(--text-secondary)] hover:bg-[var(--border-color)]/20 transition-all"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={forgotLoading}
                    className="flex-1 py-2.5 px-4 rounded-xl shadow-md text-xs font-semibold text-white bg-gradient-to-r from-sky-600 to-cyan-500 hover:from-sky-500 hover:to-cyan-400 flex items-center justify-center gap-2 transition-all disabled:opacity-60"
                  >
                    {forgotLoading ? (
                      <Loader2Icon className="h-4 w-4 animate-spin" />
                    ) : (
                      <>
                        Send Code <ArrowRightIcon className="h-3.5 w-3.5" />
                      </>
                    )}
                  </button>
                </div>
              </form>
            ) : (
              <form onSubmit={handleResetPassword} className="space-y-4">
                <div>
                  <label className="auth-label block text-xs font-medium mb-1.5">
                    6-Digit Verification Code
                  </label>
                  <div className="relative group">
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                      <HashIcon className="h-4 w-4 text-[var(--text-muted)] group-focus-within:text-sky-400" />
                    </div>
                    <input
                      type="text"
                      maxLength={6}
                      value={forgotOtp}
                      onChange={(e) => setForgotOtp(e.target.value.replace(/\D/g, ''))}
                      className="auth-input block pl-9 py-2.5 text-sm tracking-widest font-mono text-center"
                      placeholder="123456"
                      required
                      autoFocus
                    />
                  </div>
                  <div className="flex justify-between items-center mt-1">
                    <span className="text-[11px] text-[var(--text-muted)]">Valid for 15 minutes</span>
                    <button
                      type="button"
                      disabled={forgotLoading}
                      onClick={handleRequestOtp}
                      className="text-[11px] text-sky-500 hover:underline font-medium"
                    >
                      Resend code
                    </button>
                  </div>
                </div>

                <div>
                  <label className="auth-label block text-xs font-medium mb-1.5">
                    New Password
                  </label>
                  <div className="relative group">
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                      <LockIcon className="h-4 w-4 text-[var(--text-muted)] group-focus-within:text-sky-400" />
                    </div>
                    <input
                      type={showForgotNewPassword ? 'text' : 'password'}
                      value={forgotNewPassword}
                      onChange={(e) => setForgotNewPassword(e.target.value)}
                      className="auth-input block pl-9 pr-9 py-2.5 text-sm"
                      placeholder="At least 6 characters"
                      required
                    />
                    <button
                      type="button"
                      onClick={() => setShowForgotNewPassword(!showForgotNewPassword)}
                      className="absolute inset-y-0 right-0 pr-2.5 flex items-center text-[var(--text-muted)] hover:text-[var(--text-primary)]"
                    >
                      {showForgotNewPassword ? (
                        <EyeOffIcon className="h-4 w-4" />
                      ) : (
                        <EyeIcon className="h-4 w-4" />
                      )}
                    </button>
                  </div>
                </div>

                <div>
                  <label className="auth-label block text-xs font-medium mb-1.5">
                    Confirm New Password
                  </label>
                  <div className="relative group">
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                      <LockIcon className="h-4 w-4 text-[var(--text-muted)] group-focus-within:text-sky-400" />
                    </div>
                    <input
                      type={showForgotNewPassword ? 'text' : 'password'}
                      value={forgotConfirmPassword}
                      onChange={(e) => setForgotConfirmPassword(e.target.value)}
                      className="auth-input block pl-9 py-2.5 text-sm"
                      placeholder="Repeat new password"
                      required
                    />
                  </div>
                </div>

                <div className="flex gap-2.5 pt-2">
                  <button
                    type="button"
                    onClick={() => setForgotStep('request')}
                    className="flex-1 py-2.5 px-4 rounded-xl border border-[var(--border-color)] text-xs font-semibold text-[var(--text-secondary)] hover:bg-[var(--border-color)]/20 transition-all"
                  >
                    Back
                  </button>
                  <button
                    type="submit"
                    disabled={forgotLoading}
                    className="flex-1 py-2.5 px-4 rounded-xl shadow-md text-xs font-semibold text-white bg-gradient-to-r from-emerald-600 to-sky-600 hover:from-emerald-500 hover:to-sky-500 flex items-center justify-center gap-2 transition-all disabled:opacity-60"
                  >
                    {forgotLoading ? (
                      <Loader2Icon className="h-4 w-4 animate-spin" />
                    ) : (
                      <>
                        Reset Password <CheckCircle2Icon className="h-3.5 w-3.5" />
                      </>
                    )}
                  </button>
                </div>
              </form>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
