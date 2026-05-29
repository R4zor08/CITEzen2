import React, { useState } from 'react';
import { Role, User } from '../types';
import { departmentsList } from '../data/mockData';
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
  EyeOffIcon } from
'lucide-react';
interface RegisterPageProps {
  onRegister: (
  userData: Partial<User> & {
    password: string;
  })
  => Promise<any>;
  onNavigate: (page: string) => void;
}
export function RegisterPage({ onRegister, onNavigate }: RegisterPageProps) {
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
  e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) =>
  {
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
    setIsLoading(true);
    setError('');
    try {
      await onRegister({
        name: formData.name,
        email: formData.email,
        password: formData.password,
        role,
        ...(role === 'student' ?
        {
          studentId: formData.studentId,
          course: formData.course
        } :
        {}),
        ...(role === 'staff' ?
        {
          department: formData.department
        } :
        {})
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
  return (
    <div className="min-h-screen bg-dark-900 flex flex-col justify-center px-4 py-8 sm:py-12 sm:px-6 lg:px-8 relative overflow-hidden">
      {/* Background Effects */}
      <div className="absolute top-[-10%] right-[-10%] w-[40%] h-[40%] bg-purple-600/20 blur-[120px] rounded-full pointer-events-none" />
      <div className="absolute bottom-[-10%] left-[-10%] w-[40%] h-[40%] bg-cyan-600/10 blur-[120px] rounded-full pointer-events-none" />

      <div className="mx-auto w-full max-w-md relative z-10">
        {/* Logo */}
        <div
          className="flex justify-center cursor-pointer group mb-4 sm:mb-6"
          onClick={() => onNavigate('landing')}>
          
          <div className="relative flex h-14 w-14 sm:h-16 sm:w-16 items-center justify-center overflow-hidden rounded-full bg-gradient-to-br from-purple-500/20 to-cyan-500/20 border border-white/10 group-hover:border-purple-500/50 transition-all duration-300 shadow-lg shadow-purple-500/10 group-hover:shadow-purple-500/30 group-hover:scale-105">
            <img
              src="/citezen.png"
              alt="CITEzen Logo"
              className="h-14 w-14 sm:h-16 sm:w-16 object-cover rounded-full" />
            
          </div>
        </div>

        {/* Heading */}
        <h2 className="text-center text-2xl sm:text-3xl font-extrabold text-white tracking-tight">
          Create an account
        </h2>
        <p className="mt-1.5 sm:mt-2 text-center text-xs sm:text-sm text-gray-400">
          Join CITEzen to start managing concerns efficiently
        </p>
      </div>

      <div className="mt-6 sm:mt-8 mx-auto w-full max-w-md relative z-10">
        <div className="glass-panel py-6 sm:py-8 px-4 sm:px-10 animate-slide-up shadow-2xl shadow-purple-500/10 border-white/10 hover:border-purple-500/30 transition-colors duration-500">
          {success ?
          <div className="text-center py-6 sm:py-8">
              <div className="mx-auto flex items-center justify-center h-10 w-10 sm:h-12 sm:w-12 rounded-full bg-green-100 mb-3 sm:mb-4">
                <svg
                className="h-5 w-5 sm:h-6 sm:w-6 text-green-600"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor">
                
                  <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth="2"
                  d="M5 13l4 4L19 7" />
                
                </svg>
              </div>
              <h3 className="text-base sm:text-lg font-medium text-white mb-2">
                Registration Successful!
              </h3>
              <p className="text-gray-400 text-xs sm:text-sm">
                Redirecting you to login...
              </p>
            </div> :

          <>
              {/* Role Selector */}
              <div className="flex p-1 bg-dark-800/80 backdrop-blur-sm rounded-xl mb-6 sm:mb-8 border border-white/5 shadow-inner">
                {(['student', 'staff'] as const).map((r) =>
              <button
                key={r}
                type="button"
                onClick={() => {
                  setRole(r);
                  setError('');
                }}
                className={`flex-1 py-2 text-xs sm:text-sm font-medium rounded-lg capitalize transition-all ${role === r ? 'bg-white/10 text-white shadow-sm' : 'text-gray-400 hover:text-gray-200'}`}>
                
                    {r}
                  </button>
              )}
              </div>

              <form className="space-y-4 sm:space-y-5" onSubmit={handleSubmit}>
                {error &&
              <div className="p-2.5 sm:p-3 rounded-lg bg-red-500/10 border border-red-500/20 text-xs sm:text-sm text-red-400 text-center">
                    {error}
                  </div>
              }

                <div>
                  <label className="block text-xs sm:text-sm font-medium text-gray-300 mb-1 sm:mb-1.5">
                    Full Name
                  </label>
                  <div className="relative group">
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                      <UserIcon className="h-4 w-4 sm:h-5 sm:w-5 text-gray-500 group-focus-within:text-purple-400 transition-colors" />
                    </div>
                    <input
                    type="text"
                    name="name"
                    value={formData.name}
                    onChange={handleChange}
                    className="block w-full pl-9 sm:pl-10 bg-dark-800/50 border border-white/10 rounded-xl py-2.5 sm:py-3 text-sm sm:text-base text-white placeholder-gray-500 focus:outline-none focus:border-purple-500 focus:ring-2 focus:ring-purple-500/20 transition-all shadow-sm hover:bg-dark-800/80"
                    placeholder="John Doe"
                    required />
                  
                  </div>
                </div>

                {role === 'staff' &&
              <div>
                    <label className="block text-xs sm:text-sm font-medium text-gray-300 mb-1 sm:mb-1.5">
                      Email address
                    </label>
                    <div className="relative group">
                      <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                        <MailIcon className="h-4 w-4 sm:h-5 sm:w-5 text-gray-500 group-focus-within:text-purple-400 transition-colors" />
                      </div>
                      <input
                    type="email"
                    name="email"
                    value={formData.email}
                    onChange={handleChange}
                    className="block w-full pl-9 sm:pl-10 bg-dark-800/50 border border-white/10 rounded-xl py-2.5 sm:py-3 text-sm sm:text-base text-white placeholder-gray-500 focus:outline-none focus:border-purple-500 focus:ring-2 focus:ring-purple-500/20 transition-all shadow-sm hover:bg-dark-800/80"
                    placeholder="staff@nemsu.edu.ph"
                    required={role === 'staff'} />
                  
                    </div>
                  </div>
              }

                {role === 'student' &&
              <div className="grid grid-cols-2 gap-3 sm:gap-4">
                    <div>
                      <label className="block text-xs sm:text-sm font-medium text-gray-300 mb-1 sm:mb-1.5">
                        Student ID
                      </label>
                      <div className="relative group">
                        <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                          <HashIcon className="h-4 w-4 sm:h-5 sm:w-5 text-gray-500 group-focus-within:text-purple-400 transition-colors" />
                        </div>
                        <input
                      type="text"
                      name="studentId"
                      value={formData.studentId}
                      onChange={handleChange}
                      className="block w-full pl-9 sm:pl-10 bg-dark-800/50 border border-white/10 rounded-xl py-2.5 sm:py-3 text-sm sm:text-base text-white placeholder-gray-500 focus:outline-none focus:border-purple-500 focus:ring-2 focus:ring-purple-500/20 transition-all shadow-sm hover:bg-dark-800/80"
                      placeholder="2023-0001"
                      required={role === 'student'} />
                    
                      </div>
                    </div>
                    <div>
                      <label className="block text-xs sm:text-sm font-medium text-gray-300 mb-1 sm:mb-1.5">
                        Course
                      </label>
                      <div className="relative group">
                        <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                          <BookOpenIcon className="h-4 w-4 sm:h-5 sm:w-5 text-gray-500 group-focus-within:text-purple-400 transition-colors" />
                        </div>
                        <input
                      type="text"
                      name="course"
                      value={formData.course}
                      onChange={handleChange}
                      className="block w-full pl-9 sm:pl-10 bg-dark-800/50 border border-white/10 rounded-xl py-2.5 sm:py-3 text-sm sm:text-base text-white placeholder-gray-500 focus:outline-none focus:border-purple-500 focus:ring-2 focus:ring-purple-500/20 transition-all shadow-sm hover:bg-dark-800/80"
                      placeholder="BSCS"
                      required={role === 'student'} />
                    
                      </div>
                    </div>
                  </div>
              }

                {role === 'staff' &&
              <div>
                    <label className="block text-xs sm:text-sm font-medium text-gray-300 mb-1 sm:mb-1.5">
                      Department
                    </label>
                    <div className="relative group">
                      <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                        <BuildingIcon className="h-4 w-4 sm:h-5 sm:w-5 text-gray-500 group-focus-within:text-purple-400 transition-colors" />
                      </div>
                      <select
                    name="department"
                    value={formData.department}
                    onChange={handleChange}
                    className="block w-full pl-9 sm:pl-10 bg-dark-800/50 border border-white/10 rounded-xl py-2.5 sm:py-3 text-sm sm:text-base text-white focus:outline-none focus:border-purple-500 focus:ring-2 focus:ring-purple-500/20 transition-all appearance-none shadow-sm hover:bg-dark-800/80"
                    required={role === 'staff'}>
                    
                        {departmentsList.map((dept) =>
                    <option key={dept} value={dept}>
                            {dept}
                          </option>
                    )}
                      </select>
                    </div>
                  </div>
              }

                <div className="grid grid-cols-2 gap-3 sm:gap-4">
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
                      name="password"
                      value={formData.password}
                      onChange={handleChange}
                      className="block w-full pl-9 sm:pl-10 pr-9 bg-dark-800/50 border border-white/10 rounded-xl py-2.5 sm:py-3 text-sm sm:text-base text-white placeholder-gray-500 focus:outline-none focus:border-purple-500 focus:ring-2 focus:ring-purple-500/20 transition-all shadow-sm hover:bg-dark-800/80"
                      placeholder="••••••••"
                      required
                      minLength={6} />
                    
                      <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute inset-y-0 right-0 pr-2.5 flex items-center text-gray-500 hover:text-gray-300 transition-colors">
                      
                        {showPassword ?
                      <EyeOffIcon className="h-3.5 w-3.5 sm:h-4 sm:w-4" /> :

                      <EyeIcon className="h-3.5 w-3.5 sm:h-4 sm:w-4" />
                      }
                      </button>
                    </div>
                  </div>
                  <div>
                    <label className="block text-xs sm:text-sm font-medium text-gray-300 mb-1 sm:mb-1.5">
                      Confirm
                    </label>
                    <div className="relative group">
                      <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                        <LockIcon className="h-4 w-4 sm:h-5 sm:w-5 text-gray-500 group-focus-within:text-purple-400 transition-colors" />
                      </div>
                      <input
                      type={showConfirmPassword ? 'text' : 'password'}
                      name="confirmPassword"
                      value={formData.confirmPassword}
                      onChange={handleChange}
                      className="block w-full pl-9 sm:pl-10 pr-9 bg-dark-800/50 border border-white/10 rounded-xl py-2.5 sm:py-3 text-sm sm:text-base text-white placeholder-gray-500 focus:outline-none focus:border-purple-500 focus:ring-2 focus:ring-purple-500/20 transition-all shadow-sm hover:bg-dark-800/80"
                      placeholder="••••••••"
                      required
                      minLength={6} />
                    
                      <button
                      type="button"
                      onClick={() =>
                      setShowConfirmPassword(!showConfirmPassword)
                      }
                      className="absolute inset-y-0 right-0 pr-2.5 flex items-center text-gray-500 hover:text-gray-300 transition-colors">
                      
                        {showConfirmPassword ?
                      <EyeOffIcon className="h-3.5 w-3.5 sm:h-4 sm:w-4" /> :

                      <EyeIcon className="h-3.5 w-3.5 sm:h-4 sm:w-4" />
                      }
                      </button>
                    </div>
                  </div>
                </div>

                <button
                type="submit"
                disabled={isLoading}
                className="w-full flex justify-center items-center gap-2 py-2.5 sm:py-3 px-4 border border-transparent rounded-xl shadow-lg shadow-purple-500/25 text-sm font-medium text-white bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-500 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-dark-900 focus:ring-purple-500 transition-all hover:scale-[1.02] active:scale-[0.98] disabled:opacity-70 disabled:hover:scale-100 mt-2 sm:mt-4">
                
                  {isLoading ?
                <Loader2Icon className="h-4 w-4 sm:h-5 sm:w-5 animate-spin" /> :

                <>
                      Create Account{' '}
                      <ArrowRightIcon className="h-3.5 w-3.5 sm:h-4 sm:w-4" />
                    </>
                }
                </button>
              </form>

              <div className="mt-6 sm:mt-8 text-center">
                <p className="text-xs sm:text-sm text-gray-400">
                  Already have an account?{' '}
                  <button
                  onClick={() => onNavigate('login')}
                  className="font-medium text-purple-400 hover:text-purple-300 transition-colors hover:underline underline-offset-4">
                  
                    Sign in
                  </button>
                </p>
              </div>
            </>
          }
        </div>
      </div>
    </div>);

}