import React, { useState } from 'react';
import { Role, User } from '../types';
import { departmentsList } from '../data/mockData';
import { useTheme } from '../hooks/useTheme';
import {
  MailIcon,
  LockIcon,
  UserIcon,
  HashIcon,
  BookOpenIcon,
  BuildingIcon,
  ArrowRightIcon,
  Loader2Icon,
  EyeIcon,
  EyeOffIcon,
  SunIcon,
  MoonIcon
} from 'lucide-react';

const NEMSU_EMAIL_RE = /^[^\s@]+@nemsu\.edu\.ph$/i;

interface RegisterPageProps {
  onRegister: (
    userData: Partial<User> & {
      password: string;
    }
  ) => Promise<any>;
  onNavigate: (page: string) => void;
}

export function RegisterPage({ onRegister, onNavigate }: RegisterPageProps) {
  const { isDark, toggleTheme } = useTheme();
  const [role, setRole] = useState<Role>('student');
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    password: '',
    confirmPassword: '',
    studentId: '',
    course: '',
    department: departmentsList[0]
  });
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>
  ) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (formData.password !== formData.confirmPassword) {
      setError('Passwords do not match');
      return;
    }
    if (formData.password.length < 6) {
      setError('Password must be at least 6 characters long');
      return;
    }
    if (role === 'student' && !NEMSU_EMAIL_RE.test(formData.email.trim())) {
      setError('Use your official NEMSU email (e.g. rcllanto@nemsu.edu.ph)');
      return;
    }
    setIsLoading(true);
    setError('');
    try {
      await onRegister({
        name: formData.name,
        email: formData.email.trim().toLowerCase(),
        password: formData.password,
        role,
        ...(role === 'student'
          ? {
              studentId: formData.studentId,
              course: formData.course
            }
          : {}),
        ...(role === 'staff'
          ? {
              department: formData.department
            }
          : {})
      });
      setSuccess(true);
      setTimeout(() => {
        onNavigate('login');
      }, 2000);
    } catch (err: any) {
      setError(err.message || 'Registration failed. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const inputIcon = 'h-4 w-4 sm:h-5 sm:w-5 text-[var(--text-muted)] group-focus-within:text-sky-400 transition-colors';

  return (
    <div className="auth-page flex flex-col justify-center px-4 py-8 sm:py-12 sm:px-6 lg:px-8 relative overflow-hidden">
      <div className="absolute top-[-10%] right-[-10%] w-[40%] h-[40%] bg-sky-500/15 dark:bg-purple-600/20 blur-[120px] rounded-full pointer-events-none" />
      <div className="absolute bottom-[-10%] left-[-10%] w-[40%] h-[40%] bg-cyan-500/10 blur-[120px] rounded-full pointer-events-none" />

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
          <div className="relative flex h-14 w-14 sm:h-16 sm:w-16 items-center justify-center overflow-hidden rounded-full bg-gradient-to-br from-sky-500/20 to-cyan-500/20 border border-[var(--border-color)] group-hover:border-sky-500/50 transition-all duration-300 shadow-lg shadow-sky-500/10 group-hover:shadow-sky-500/30 group-hover:scale-105">
            <img
              src="/citezen.png?v=2"
              alt="CITEzen Logo"
              className="h-14 w-14 sm:h-16 sm:w-16 object-cover rounded-full"
            />
          </div>
        </div>

        <h2 className="auth-title text-center text-2xl sm:text-3xl font-extrabold tracking-tight">
          Create an account
        </h2>
        <p className="auth-subtitle mt-1.5 sm:mt-2 text-center text-xs sm:text-sm">
          Join CITEzen to start managing concerns efficiently
        </p>
      </div>

      <div className="mt-6 sm:mt-8 mx-auto w-full max-w-md relative z-10">
        <div className="glass-panel py-6 sm:py-8 px-4 sm:px-10 animate-slide-up shadow-2xl shadow-sky-500/10 hover:border-sky-500/30 transition-colors duration-500">
          {success ? (
            <div className="text-center py-6 sm:py-8">
              <div className="mx-auto flex items-center justify-center h-10 w-10 sm:h-12 sm:w-12 rounded-full bg-emerald-500/15 mb-3 sm:mb-4">
                <svg
                  className="h-5 w-5 sm:h-6 sm:w-6 text-emerald-500"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth="2"
                    d="M5 13l4 4L19 7"
                  />
                </svg>
              </div>
              <h3 className="auth-title text-base sm:text-lg font-medium mb-2">
                Registration Successful!
              </h3>
              <p className="auth-muted text-xs sm:text-sm">
                Redirecting you to login. Sign in with your Student ID and password.
              </p>
            </div>
          ) : (
            <>
              <div className="auth-role-track flex p-1 rounded-xl mb-6 sm:mb-8 shadow-inner">
                {(['student', 'staff'] as const).map((r) => (
                  <button
                    key={r}
                    type="button"
                    onClick={() => {
                      setRole(r);
                      setError('');
                    }}
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

              <form className="space-y-4 sm:space-y-5" onSubmit={handleSubmit}>
                {error && (
                  <div className="p-2.5 sm:p-3 rounded-lg bg-red-500/10 border border-red-500/20 text-xs sm:text-sm text-red-400 text-center">
                    {error}
                  </div>
                )}

                <div>
                  <label className="auth-label block text-xs sm:text-sm font-medium mb-1 sm:mb-1.5">
                    Full Name
                  </label>
                  <div className="relative group">
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                      <UserIcon className={inputIcon} />
                    </div>
                    <input
                      type="text"
                      name="name"
                      value={formData.name}
                      onChange={handleChange}
                      className="auth-input block pl-9 sm:pl-10 py-2.5 sm:py-3 text-sm sm:text-base"
                      placeholder="John Doe"
                      required
                    />
                  </div>
                </div>

                {role === 'student' && (
                  <div>
                    <label className="auth-label block text-xs sm:text-sm font-medium mb-1 sm:mb-1.5">
                      NEMSU email
                    </label>
                    <div className="relative group">
                      <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                        <MailIcon className={inputIcon} />
                      </div>
                      <input
                        type="email"
                        name="email"
                        value={formData.email}
                        onChange={handleChange}
                        className="auth-input block pl-9 sm:pl-10 py-2.5 sm:py-3 text-sm sm:text-base"
                        placeholder="example@nemsu.edu.ph"
                        required
                      />
                    </div>
                  </div>
                )}

                {role === 'staff' && (
                  <div>
                    <label className="auth-label block text-xs sm:text-sm font-medium mb-1 sm:mb-1.5">
                      Email address
                    </label>
                    <div className="relative group">
                      <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                        <MailIcon className={inputIcon} />
                      </div>
                      <input
                        type="email"
                        name="email"
                        value={formData.email}
                        onChange={handleChange}
                        className="auth-input block pl-9 sm:pl-10 py-2.5 sm:py-3 text-sm sm:text-base"
                        placeholder="staff@nemsu.edu.ph"
                        required={role === 'staff'}
                      />
                    </div>
                  </div>
                )}

                {role === 'student' && (
                  <div className="grid grid-cols-2 gap-3 sm:gap-4">
                    <div>
                      <label className="auth-label block text-xs sm:text-sm font-medium mb-1 sm:mb-1.5">
                        Student ID
                      </label>
                      <div className="relative group">
                        <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                          <HashIcon className={inputIcon} />
                        </div>
                        <input
                          type="text"
                          name="studentId"
                          value={formData.studentId}
                          onChange={handleChange}
                          className="auth-input block pl-9 sm:pl-10 py-2.5 sm:py-3 text-sm sm:text-base"
                          placeholder="2023-0001"
                          required={role === 'student'}
                        />
                      </div>
                    </div>
                    <div>
                      <label className="auth-label block text-xs sm:text-sm font-medium mb-1 sm:mb-1.5">
                        Course
                      </label>
                      <div className="relative group">
                        <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                          <BookOpenIcon className={inputIcon} />
                        </div>
                        <input
                          type="text"
                          name="course"
                          value={formData.course}
                          onChange={handleChange}
                          className="auth-input block pl-9 sm:pl-10 py-2.5 sm:py-3 text-sm sm:text-base"
                          placeholder="BSCS"
                          required={role === 'student'}
                        />
                      </div>
                    </div>
                  </div>
                )}

                {role === 'staff' && (
                  <div>
                    <label className="auth-label block text-xs sm:text-sm font-medium mb-1 sm:mb-1.5">
                      Department
                    </label>
                    <div className="relative group">
                      <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                        <BuildingIcon className={inputIcon} />
                      </div>
                      <select
                        name="department"
                        value={formData.department}
                        onChange={handleChange}
                        className="auth-input block pl-9 sm:pl-10 py-2.5 sm:py-3 text-sm sm:text-base appearance-none"
                        required={role === 'staff'}
                      >
                        {departmentsList.map((dept) => (
                          <option key={dept} value={dept}>
                            {dept}
                          </option>
                        ))}
                      </select>
                    </div>
                  </div>
                )}

                <div className="grid grid-cols-2 gap-3 sm:gap-4">
                  <div>
                    <label className="auth-label block text-xs sm:text-sm font-medium mb-1 sm:mb-1.5">
                      Password
                    </label>
                    <div className="relative group">
                      <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                        <LockIcon className={inputIcon} />
                      </div>
                      <input
                        type={showPassword ? 'text' : 'password'}
                        name="password"
                        value={formData.password}
                        onChange={handleChange}
                        className="auth-input block pl-9 sm:pl-10 pr-9 py-2.5 sm:py-3 text-sm sm:text-base"
                        placeholder="••••••••"
                        required
                        minLength={6}
                      />
                      <button
                        type="button"
                        onClick={() => setShowPassword(!showPassword)}
                        className="absolute inset-y-0 right-0 pr-2.5 flex items-center text-[var(--text-muted)] hover:text-[var(--text-primary)] transition-colors"
                      >
                        {showPassword ? (
                          <EyeOffIcon className="h-3.5 w-3.5 sm:h-4 sm:w-4" />
                        ) : (
                          <EyeIcon className="h-3.5 w-3.5 sm:h-4 sm:w-4" />
                        )}
                      </button>
                    </div>
                  </div>
                  <div>
                    <label className="auth-label block text-xs sm:text-sm font-medium mb-1 sm:mb-1.5">
                      Confirm
                    </label>
                    <div className="relative group">
                      <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                        <LockIcon className={inputIcon} />
                      </div>
                      <input
                        type={showConfirmPassword ? 'text' : 'password'}
                        name="confirmPassword"
                        value={formData.confirmPassword}
                        onChange={handleChange}
                        className="auth-input block pl-9 sm:pl-10 pr-9 py-2.5 sm:py-3 text-sm sm:text-base"
                        placeholder="••••••••"
                        required
                        minLength={6}
                      />
                      <button
                        type="button"
                        onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                        className="absolute inset-y-0 right-0 pr-2.5 flex items-center text-[var(--text-muted)] hover:text-[var(--text-primary)] transition-colors"
                      >
                        {showConfirmPassword ? (
                          <EyeOffIcon className="h-3.5 w-3.5 sm:h-4 sm:w-4" />
                        ) : (
                          <EyeIcon className="h-3.5 w-3.5 sm:h-4 sm:w-4" />
                        )}
                      </button>
                    </div>
                  </div>
                </div>

                <button
                  type="submit"
                  disabled={isLoading}
                  className="w-full flex justify-center items-center gap-2 py-2.5 sm:py-3 px-4 border border-transparent rounded-xl shadow-lg shadow-sky-500/25 text-sm font-medium text-white bg-gradient-to-r from-sky-600 via-cyan-500 to-emerald-400 hover:from-sky-500 hover:to-emerald-300 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-sky-500 transition-all hover:scale-[1.02] active:scale-[0.98] disabled:opacity-70 disabled:hover:scale-100 mt-2 sm:mt-4"
                >
                  {isLoading ? (
                    <Loader2Icon className="h-4 w-4 sm:h-5 sm:w-5 animate-spin" />
                  ) : (
                    <>
                      Create Account <ArrowRightIcon className="h-3.5 w-3.5 sm:h-4 sm:w-4" />
                    </>
                  )}
                </button>
              </form>

              <div className="mt-6 sm:mt-8 text-center">
                <p className="auth-muted text-xs sm:text-sm">
                  Already have an account?{' '}
                  <button
                    onClick={() => onNavigate('login')}
                    className="auth-link font-medium hover:underline underline-offset-4"
                  >
                    Sign in
                  </button>
                </p>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
