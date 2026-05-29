import React, { useState } from 'react';
import { Role } from '../types';
import {
  MailIcon,
  LockIcon,
  ArrowRightIcon,
  Loader2Icon,
  HashIcon,
  EyeIcon,
  EyeOffIcon } from
'lucide-react';
interface LoginPageProps {
  onLogin: (identifier: string, password: string, role: Role) => Promise<any>;
  onNavigate: (page: string) => void;
}
export function LoginPage({ onLogin, onNavigate }: LoginPageProps) {
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
    <div className="min-h-screen bg-dark-900 flex flex-col justify-center px-4 py-8 sm:py-12 sm:px-6 lg:px-8 relative overflow-hidden">
      {/* Background Effects */}
      <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] bg-purple-600/20 blur-[120px] rounded-full pointer-events-none" />
      <div className="absolute bottom-[-10%] right-[-10%] w-[40%] h-[40%] bg-cyan-600/10 blur-[120px] rounded-full pointer-events-none" />

      <div className="mx-auto w-full max-w-md relative z-10">
        {/* Logo */}
        <div
          className="flex justify-center cursor-pointer group mb-4 sm:mb-6"
          onClick={() => onNavigate('landing')}>
          
          <div className="relative flex h-16 w-16 sm:h-20 sm:w-20 items-center justify-center overflow-hidden rounded-full bg-gradient-to-br from-purple-500/20 to-cyan-500/20 border border-white/10 group-hover:border-purple-500/50 transition-all duration-300 shadow-xl shadow-purple-500/20 group-hover:shadow-purple-500/40 group-hover:scale-105">
            <img
              src="/citezen.png"
              alt="CITEzen Logo"
              className="h-16 w-16 sm:h-20 sm:w-20 object-cover rounded-full" />
            
          </div>
        </div>

        {/* Heading */}
        <h2 className="text-center text-2xl sm:text-3xl font-extrabold text-white tracking-tight">
          Welcome back
        </h2>
        <p className="mt-1.5 sm:mt-2 text-center text-xs sm:text-sm text-gray-400">
          Sign in to your account to continue
        </p>
      </div>

      <div className="mt-6 sm:mt-8 mx-auto w-full max-w-md relative z-10">
        <div className="glass-panel py-6 sm:py-8 px-4 sm:px-10 animate-slide-up shadow-2xl shadow-purple-500/10 border-white/10 hover:border-purple-500/30 transition-colors duration-500">
          {/* Role Selector */}
          <div className="flex p-1 bg-dark-800/80 backdrop-blur-sm rounded-xl mb-6 sm:mb-8 border border-white/5 shadow-inner">
            {(['student', 'staff', 'admin'] as const).map((r) =>
            <button
              key={r}
              type="button"
              onClick={() => handleRoleChange(r)}
              className={`flex-1 py-2 text-xs sm:text-sm font-medium rounded-lg capitalize transition-all ${role === r ? 'bg-white/10 text-white shadow-sm' : 'text-gray-400 hover:text-gray-200'}`}>
              
                {r}
              </button>
            )}
          </div>

          <form className="space-y-4 sm:space-y-6" onSubmit={handleSubmit}>
            {error &&
            <div className="p-2.5 sm:p-3 rounded-lg bg-red-500/10 border border-red-500/20 text-xs sm:text-sm text-red-400 text-center">
                {error}
              </div>
            }

            <div>
              <label className="block text-xs sm:text-sm font-medium text-gray-300 mb-1 sm:mb-1.5">
                {role === 'student' ? 'Student ID' : 'Email address'}
              </label>
              <div className="relative group">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none transition-colors group-focus-within:text-purple-400">
                  {role === 'student' ?
                  <HashIcon className="h-4 w-4 sm:h-5 sm:w-5 text-gray-500 group-focus-within:text-purple-400 transition-colors" /> :

                  <MailIcon className="h-4 w-4 sm:h-5 sm:w-5 text-gray-500 group-focus-within:text-purple-400 transition-colors" />
                  }
                </div>
                <input
                  type={role === 'student' ? 'text' : 'email'}
                  value={identifier}
                  onChange={(e) => setIdentifier(e.target.value)}
                  className="block w-full pl-9 sm:pl-10 bg-dark-800/50 border border-white/10 rounded-xl py-2.5 sm:py-3 text-sm sm:text-base text-white placeholder-gray-500 focus:outline-none focus:border-purple-500 focus:ring-2 focus:ring-purple-500/20 transition-all shadow-sm hover:bg-dark-800/80"
                  placeholder={
                  role === 'student' ? '2023-00142' : 'you@nemsu.edu.ph'
                  }
                  required />
                
              </div>
            </div>

            <div>
              <label className="block text-xs sm:text-sm font-medium text-gray-300 mb-1 sm:mb-1.5">
                Password
              </label>
              <div className="relative group">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <LockIcon className="h-4 w-4 sm:h-5 sm:w-5 text-gray-500 group-focus-within:text-purple-400 transition-colors" />
                </div>
                <input
                  type={showPassword ? 'text' : 'password'}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="block w-full pl-9 sm:pl-10 pr-10 bg-dark-800/50 border border-white/10 rounded-xl py-2.5 sm:py-3 text-sm sm:text-base text-white placeholder-gray-500 focus:outline-none focus:border-purple-500 focus:ring-2 focus:ring-purple-500/20 transition-all shadow-sm hover:bg-dark-800/80"
                  placeholder="••••••••"
                  required />
                
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute inset-y-0 right-0 pr-3 flex items-center text-gray-500 hover:text-gray-300 transition-colors">
                  
                  {showPassword ?
                  <EyeOffIcon className="h-4 w-4 sm:h-5 sm:w-5" /> :

                  <EyeIcon className="h-4 w-4 sm:h-5 sm:w-5" />
                  }
                </button>
              </div>
            </div>

            <div className="flex items-center justify-between">
              <div className="flex items-center">
                <input
                  id="remember-me"
                  type="checkbox"
                  className="h-3.5 w-3.5 sm:h-4 sm:w-4 rounded border-gray-600 bg-dark-800 text-purple-500 focus:ring-purple-500 focus:ring-offset-dark-900" />
                
                <label
                  htmlFor="remember-me"
                  className="ml-2 block text-xs sm:text-sm text-gray-400">
                  
                  Remember me
                </label>
              </div>

              <div className="text-xs sm:text-sm">
                <a
                  href="#"
                  className="font-medium text-purple-400 hover:text-purple-300 transition-colors">
                  
                  Forgot password?
                </a>
              </div>
            </div>

            <button
              type="submit"
              disabled={isLoading}
              className="w-full flex justify-center items-center gap-2 py-2.5 sm:py-3 px-4 border border-transparent rounded-xl shadow-lg shadow-purple-500/25 text-sm font-medium text-white bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-500 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-dark-900 focus:ring-purple-500 transition-all hover:scale-[1.02] active:scale-[0.98] disabled:opacity-70 disabled:hover:scale-100">
              
              {isLoading ?
              <Loader2Icon className="h-4 w-4 sm:h-5 sm:w-5 animate-spin" /> :

              <>
                  Sign in{' '}
                  <ArrowRightIcon className="h-3.5 w-3.5 sm:h-4 sm:w-4" />
                </>
              }
            </button>
          </form>

          {role !== 'admin' &&
          <div className="mt-6 sm:mt-8 text-center">
              <p className="text-xs sm:text-sm text-gray-400">
                Don't have an account?{' '}
                <button
                onClick={() => onNavigate('register')}
                className="font-medium text-purple-400 hover:text-purple-300 transition-colors hover:underline underline-offset-4">
                
                  Register here
                </button>
              </p>
            </div>
          }
        </div>
      </div>
    </div>);

}