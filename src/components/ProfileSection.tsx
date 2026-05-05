import React, { useState, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { User } from '../types';
import {
  UserIcon,
  CameraIcon,
  MailIcon,
  HashIcon,
  BuildingIcon,
  BookOpenIcon,
  LockIcon,
  SaveIcon,
  Loader2Icon,
  Edit2Icon,
  XIcon,
  AlertTriangleIcon,
  SunIcon,
  MoonIcon } from
'lucide-react';
import { toast } from 'sonner';
import { useTheme } from '../hooks/useTheme';
interface ProfileSectionProps {
  user: User;
  onUpdateProfile: (data: Partial<User>) => Promise<void>;
}
export function ProfileSection({ user, onUpdateProfile }: ProfileSectionProps) {
  const { isDark, toggleTheme } = useTheme();
  const [isEditing, setIsEditing] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [showConfirmModal, setShowConfirmModal] = useState(false);
  const [formData, setFormData] = useState({
    name: user.name,
    email: user.email,
    studentId: user.studentId || '',
    department: user.department || '',
    course: user.course || '',
    currentPassword: '',
    newPassword: '',
    confirmPassword: ''
  });
  const [avatarPreview, setAvatarPreview] = useState<string | null>(
    user.profilePicture || null
  );
  const fileInputRef = useRef<HTMLInputElement>(null);
  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    });
  };
  const handleAvatarChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (file.size > 5 * 1024 * 1024) {
        toast.error('Image size should be less than 5MB');
        return;
      }
      const reader = new FileReader();
      reader.onloadend = () => {
        const base64String = reader.result as string;
        setAvatarPreview(base64String);
      };
      reader.readAsDataURL(file);
    }
  };
  const handleInitialSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    // Basic validation
    if (!formData.name.trim()) {
      toast.error('Name is required');
      return;
    }
    if (user.role !== 'student') {
      if (!formData.email.trim() || !/^\S+@\S+\.\S+$/.test(formData.email)) {
        toast.error('Valid email is required');
        return;
      }
    }
    if (formData.newPassword) {
      if (formData.newPassword.length < 6) {
        toast.error('New password must be at least 6 characters');
        return;
      }
      if (formData.newPassword !== formData.confirmPassword) {
        toast.error('New passwords do not match');
        return;
      }
    }
    // Show confirmation modal instead of saving immediately
    setShowConfirmModal(true);
  };
  const handleConfirmSave = async () => {
    setIsLoading(true);
    try {
      const updateData: Partial<User> = {
        name: formData.name,
        email: formData.email,
        ...(user.role === 'staff' && {
          department: formData.department
        }),
        ...(user.role === 'student' && {
          course: formData.course
        }),
        ...(avatarPreview && {
          profilePicture: avatarPreview
        })
      };
      await onUpdateProfile(updateData);
      toast.success('Profile updated successfully');
      setIsEditing(false);
      setShowConfirmModal(false);
      // Clear password fields
      setFormData((prev) => ({
        ...prev,
        currentPassword: '',
        newPassword: '',
        confirmPassword: ''
      }));
    } catch (error) {
      toast.error('Failed to update profile');
    } finally {
      setIsLoading(false);
    }
  };
  const handleDiscard = () => {
    setShowConfirmModal(false);
    setIsEditing(false);
    setFormData({
      name: user.name,
      email: user.email,
      studentId: user.studentId || '',
      department: user.department || '',
      course: user.course || '',
      currentPassword: '',
      newPassword: '',
      confirmPassword: ''
    });
    setAvatarPreview(user.profilePicture || null);
  };
  const handleCancel = () => {
    setIsEditing(false);
    setFormData({
      name: user.name,
      email: user.email,
      studentId: user.studentId || '',
      department: user.department || '',
      course: user.course || '',
      currentPassword: '',
      newPassword: '',
      confirmPassword: ''
    });
    setAvatarPreview(user.profilePicture || null);
  };
  return (
    <div className="space-y-6 animate-fade-in max-w-4xl mx-auto px-1 sm:px-0">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl sm:text-2xl font-bold text-white">
            Profile Settings
          </h1>
          <p className="text-sm sm:text-base text-gray-400">
            Manage your account details and preferences.
          </p>
        </div>
        <AnimatePresence mode="wait">
          {!isEditing ?
          <motion.button
            key="edit-btn"
            initial={{
              opacity: 0,
              scale: 0.95
            }}
            animate={{
              opacity: 1,
              scale: 1
            }}
            exit={{
              opacity: 0,
              scale: 0.95
            }}
            onClick={() => setIsEditing(true)}
            className="flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl bg-purple-600 text-white text-sm font-medium hover:bg-purple-500 transition-colors shadow-lg shadow-purple-500/20 w-full sm:w-auto">
            
              <Edit2Icon className="h-4 w-4" />
              Edit Profile
            </motion.button> :

          <motion.button
            key="cancel-btn"
            initial={{
              opacity: 0,
              scale: 0.95
            }}
            animate={{
              opacity: 1,
              scale: 1
            }}
            exit={{
              opacity: 0,
              scale: 0.95
            }}
            onClick={handleCancel}
            className="flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl bg-white/5 border border-white/10 text-gray-300 text-sm font-medium hover:bg-white/10 transition-colors w-full sm:w-auto">
            
              <XIcon className="h-4 w-4" />
              Cancel Editing
            </motion.button>
          }
        </AnimatePresence>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 sm:gap-6">
        {/* Left Column: Avatar & Role Info */}
        <div className="md:col-span-1 space-y-4 sm:space-y-6">
          <motion.div
            layout
            className="glass-panel p-4 sm:p-6 flex flex-col items-center text-center relative overflow-hidden">
            
            {/* Background decoration */}
            <div className="absolute top-0 left-0 right-0 h-24 bg-gradient-to-b from-purple-500/10 to-transparent pointer-events-none" />

            <div className="relative group mb-4 z-10">
              <motion.div
                layoutId="avatar"
                className="h-24 w-24 sm:h-28 sm:w-28 rounded-full bg-dark-800 border-4 border-dark-900 shadow-xl flex items-center justify-center overflow-hidden ring-2 ring-purple-500/30">
                
                {avatarPreview ?
                <img
                  src={avatarPreview}
                  alt="Avatar preview"
                  className="h-full w-full object-cover" /> :


                <UserIcon className="h-10 w-10 sm:h-12 sm:w-12 text-purple-400" />
                }
              </motion.div>

              <AnimatePresence>
                {isEditing &&
                <motion.label
                  initial={{
                    opacity: 0
                  }}
                  animate={{
                    opacity: 1
                  }}
                  exit={{
                    opacity: 0
                  }}
                  className="absolute inset-0 flex items-center justify-center bg-black/60 rounded-full cursor-pointer backdrop-blur-sm transition-colors hover:bg-black/70">
                  
                    <div className="flex flex-col items-center text-white">
                      <CameraIcon className="h-6 w-6 mb-1" />
                      <span className="text-[10px] font-medium uppercase tracking-wider">
                        Change
                      </span>
                    </div>
                    <input
                    type="file"
                    accept="image/jpeg, image/png, image/webp"
                    className="hidden"
                    ref={fileInputRef}
                    onChange={handleAvatarChange} />
                  
                  </motion.label>
                }
              </AnimatePresence>
            </div>

            <motion.h2
              layout="position"
              className="text-xl font-bold text-white mb-1">
              
              {isEditing ? formData.name || 'Your Name' : user.name}
            </motion.h2>

            <motion.div
              layout="position"
              className="inline-flex items-center px-3 py-1 rounded-full text-xs font-medium bg-purple-500/10 text-purple-400 border border-purple-500/20 capitalize shadow-sm">
              
              {user.role} Account
            </motion.div>

            {/* Theme Toggle */}
            <motion.div
              layout="position"
              className="mt-6 w-full pt-6 border-t border-white/5">
              
              <div className="flex items-center justify-between px-4 py-3 rounded-xl bg-dark-800/50 border border-white/5">
                <span className="text-sm font-medium text-gray-300">
                  Appearance
                </span>
                <button
                  onClick={toggleTheme}
                  className="relative flex items-center w-12 h-6 rounded-full bg-dark-900 border border-white/10 transition-colors hover:border-purple-500/50"
                  title="Toggle Theme">
                  
                  <div className="absolute inset-0 flex items-center justify-between px-1.5 pointer-events-none">
                    <MoonIcon className="h-3 w-3 text-gray-500" />
                    <SunIcon className="h-3 w-3 text-gray-500" />
                  </div>
                  <motion.div
                    layout
                    transition={{
                      type: 'spring',
                      stiffness: 500,
                      damping: 30
                    }}
                    className={`absolute w-5 h-5 rounded-full bg-purple-500 shadow-sm flex items-center justify-center ${isDark ? 'left-0.5' : 'right-0.5'}`}>
                    
                    {isDark ?
                    <MoonIcon className="h-3 w-3 text-white" /> :

                    <SunIcon className="h-3 w-3 text-white" />
                    }
                  </motion.div>
                </button>
              </div>
            </motion.div>

            {user.studentId &&
            <motion.div
              layout="position"
              className="mt-5 pt-5 border-t border-white/5 w-full text-sm text-gray-400 flex justify-between items-center">
              
                <span>Student ID</span>
                <span className="text-gray-300 font-mono bg-dark-800 px-2 py-1 rounded-md border border-white/5">
                  {user.studentId}
                </span>
              </motion.div>
            }
          </motion.div>
        </div>

        {/* Right Column: Form */}
        <div className="md:col-span-2">
          <motion.form
            layout
            onSubmit={handleInitialSubmit}
            className="glass-panel p-4 sm:p-6 md:p-8 space-y-5 sm:space-y-6 relative overflow-hidden">
            
            {/* Edit mode indicator border */}
            <AnimatePresence>
              {isEditing &&
              <motion.div
                initial={{
                  opacity: 0
                }}
                animate={{
                  opacity: 1
                }}
                exit={{
                  opacity: 0
                }}
                className="absolute inset-0 border-2 border-purple-500/30 rounded-xl pointer-events-none" />

              }
            </AnimatePresence>

            <h3 className="text-lg font-semibold text-white border-b border-white/10 pb-4 flex items-center gap-2">
              <UserIcon className="h-5 w-5 text-purple-400" />
              Personal Information
            </h3>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
              <motion.div layout="position">
                <label className="block text-sm font-medium text-gray-300 mb-1.5">
                  Full Name
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <UserIcon
                      className={`h-4 w-4 ${isEditing ? 'text-purple-400' : 'text-gray-500'} transition-colors`} />
                    
                  </div>
                  <input
                    type="text"
                    name="name"
                    value={formData.name}
                    onChange={handleChange}
                    disabled={!isEditing}
                    className={`block w-full pl-10 rounded-xl py-2.5 text-sm transition-all ${isEditing ? 'bg-dark-800 border-purple-500/50 text-white focus:outline-none focus:ring-2 focus:ring-purple-500/50 shadow-[0_0_15px_rgba(139,92,246,0.1)]' : 'bg-dark-800/50 border-white/10 text-gray-300 opacity-80 cursor-not-allowed'}`}
                    required />
                  
                </div>
              </motion.div>

              <motion.div layout="position">
                <label className="block text-sm font-medium text-gray-300 mb-1.5">
                  {user.role === 'student' ? 'Student ID' : 'Email Address'}
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    {user.role === 'student' ?
                    <HashIcon
                      className={`h-4 w-4 ${isEditing && user.role !== 'student' ? 'text-purple-400' : 'text-gray-500'} transition-colors`} /> :


                    <MailIcon
                      className={`h-4 w-4 ${isEditing ? 'text-purple-400' : 'text-gray-500'} transition-colors`} />

                    }
                  </div>
                  <input
                    type={user.role === 'student' ? 'text' : 'email'}
                    name={user.role === 'student' ? 'studentId' : 'email'}
                    value={
                    user.role === 'student' ?
                    formData.studentId || '' :
                    formData.email
                    }
                    onChange={handleChange}
                    disabled={!isEditing || user.role === 'student'} // Student ID usually shouldn't be editable
                    className={`block w-full pl-10 rounded-xl py-2.5 text-sm transition-all ${isEditing && user.role !== 'student' ? 'bg-dark-800 border-purple-500/50 text-white focus:outline-none focus:ring-2 focus:ring-purple-500/50 shadow-[0_0_15px_rgba(139,92,246,0.1)]' : 'bg-dark-800/50 border-white/10 text-gray-300 opacity-80 cursor-not-allowed'}`}
                    required />
                  
                </div>
              </motion.div>

              {user.role === 'staff' &&
              <motion.div layout="position">
                  <label className="block text-sm font-medium text-gray-300 mb-1.5">
                    Department
                  </label>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                      <BuildingIcon
                      className={`h-4 w-4 ${isEditing ? 'text-purple-400' : 'text-gray-500'} transition-colors`} />
                    
                    </div>
                    <input
                    type="text"
                    name="department"
                    value={formData.department}
                    onChange={handleChange}
                    disabled={!isEditing}
                    className={`block w-full pl-10 rounded-xl py-2.5 text-sm transition-all ${isEditing ? 'bg-dark-800 border-purple-500/50 text-white focus:outline-none focus:ring-2 focus:ring-purple-500/50 shadow-[0_0_15px_rgba(139,92,246,0.1)]' : 'bg-dark-800/50 border-white/10 text-gray-300 opacity-80 cursor-not-allowed'}`} />
                  
                  </div>
                </motion.div>
              }

              {user.role === 'student' &&
              <motion.div layout="position">
                  <label className="block text-sm font-medium text-gray-300 mb-1.5">
                    Course
                  </label>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                      <BookOpenIcon
                      className={`h-4 w-4 ${isEditing ? 'text-purple-400' : 'text-gray-500'} transition-colors`} />
                    
                    </div>
                    <input
                    type="text"
                    name="course"
                    value={formData.course}
                    onChange={handleChange}
                    disabled={!isEditing}
                    className={`block w-full pl-10 rounded-xl py-2.5 text-sm transition-all ${isEditing ? 'bg-dark-800 border-purple-500/50 text-white focus:outline-none focus:ring-2 focus:ring-purple-500/50 shadow-[0_0_15px_rgba(139,92,246,0.1)]' : 'bg-dark-800/50 border-white/10 text-gray-300 opacity-80 cursor-not-allowed'}`} />
                  
                  </div>
                </motion.div>
              }
            </div>

            <AnimatePresence>
              {isEditing &&
              <motion.div
                initial={{
                  opacity: 0,
                  height: 0
                }}
                animate={{
                  opacity: 1,
                  height: 'auto'
                }}
                exit={{
                  opacity: 0,
                  height: 0
                }}
                className="overflow-hidden">
                
                  <h3 className="text-lg font-semibold text-white border-b border-white/10 pb-4 pt-6 flex items-center gap-2">
                    <LockIcon className="h-5 w-5 text-purple-400" />
                    Security Settings
                  </h3>

                  <div className="space-y-4 mt-6">
                    <div>
                      <label className="block text-sm font-medium text-gray-300 mb-1.5">
                        Current Password
                      </label>
                      <div className="relative">
                        <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                          <LockIcon className="h-4 w-4 text-purple-400" />
                        </div>
                        <input
                        type="password"
                        name="currentPassword"
                        value={formData.currentPassword}
                        onChange={handleChange}
                        className="block w-full pl-10 bg-dark-800 border-purple-500/30 rounded-xl py-2.5 text-sm text-white placeholder-gray-500 focus:outline-none focus:border-purple-500 focus:ring-2 focus:ring-purple-500/50 transition-all"
                        placeholder="Leave blank to keep current" />
                      
                      </div>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <div>
                        <label className="block text-sm font-medium text-gray-300 mb-1.5">
                          New Password
                        </label>
                        <div className="relative">
                          <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                            <LockIcon className="h-4 w-4 text-purple-400" />
                          </div>
                          <input
                          type="password"
                          name="newPassword"
                          value={formData.newPassword}
                          onChange={handleChange}
                          className="block w-full pl-10 bg-dark-800 border-purple-500/30 rounded-xl py-2.5 text-sm text-white placeholder-gray-500 focus:outline-none focus:border-purple-500 focus:ring-2 focus:ring-purple-500/50 transition-all"
                          placeholder="••••••••" />
                        
                        </div>
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-300 mb-1.5">
                          Confirm New Password
                        </label>
                        <div className="relative">
                          <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                            <LockIcon className="h-4 w-4 text-purple-400" />
                          </div>
                          <input
                          type="password"
                          name="confirmPassword"
                          value={formData.confirmPassword}
                          onChange={handleChange}
                          className="block w-full pl-10 bg-dark-800 border-purple-500/30 rounded-xl py-2.5 text-sm text-white placeholder-gray-500 focus:outline-none focus:border-purple-500 focus:ring-2 focus:ring-purple-500/50 transition-all"
                          placeholder="••••••••" />
                        
                        </div>
                      </div>
                    </div>
                  </div>

                  <div className="flex flex-col-reverse sm:flex-row items-stretch sm:items-center justify-end gap-3 pt-6 mt-6 border-t border-white/10">
                    <button
                    type="submit"
                    disabled={isLoading}
                    className="flex items-center gap-2 px-6 py-2.5 rounded-xl bg-purple-600 text-white text-sm font-medium hover:bg-purple-500 transition-colors disabled:opacity-70 shadow-lg shadow-purple-500/25 w-full sm:w-auto justify-center">
                    
                      {isLoading ?
                    <Loader2Icon className="h-4 w-4 animate-spin" /> :

                    <SaveIcon className="h-4 w-4" />
                    }
                      Save Changes
                    </button>
                  </div>
                </motion.div>
              }
            </AnimatePresence>
          </motion.form>
        </div>
      </div>

      {/* Confirmation Modal */}
      <AnimatePresence>
        {showConfirmModal &&
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-dark-900/80 backdrop-blur-sm animate-fade-in">
            <motion.div
            initial={{
              opacity: 0,
              scale: 0.95,
              y: 10
            }}
            animate={{
              opacity: 1,
              scale: 1,
              y: 0
            }}
            exit={{
              opacity: 0,
              scale: 0.95,
              y: 10
            }}
            className="glass-panel w-full max-w-sm p-6 flex flex-col items-center text-center shadow-2xl shadow-purple-500/10 border-purple-500/20">
            
              <div className="h-12 w-12 rounded-full bg-purple-500/10 flex items-center justify-center mb-4 border border-purple-500/20 text-purple-400">
                <AlertTriangleIcon className="h-6 w-6" />
              </div>

              <h3 className="text-xl font-bold text-white mb-2">
                Save Changes?
              </h3>
              <p className="text-sm text-gray-400 mb-6">
                Are you sure you want to apply these changes to your profile?
              </p>

              <div className="flex w-full gap-3">
                <button
                type="button"
                onClick={handleDiscard}
                disabled={isLoading}
                className="flex-1 px-4 py-2.5 rounded-xl border border-white/10 text-white font-medium hover:bg-white/5 transition-colors disabled:opacity-50">
                
                  No, Discard
                </button>
                <button
                type="button"
                onClick={handleConfirmSave}
                disabled={isLoading}
                className="flex-1 flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl bg-purple-600 border border-purple-500/50 text-white font-medium hover:bg-purple-500 transition-colors disabled:opacity-70">
                
                  {isLoading ?
                <Loader2Icon className="h-4 w-4 animate-spin" /> :

                <SaveIcon className="h-4 w-4" />
                }
                  Yes, Save
                </button>
              </div>
            </motion.div>
          </div>
        }
      </AnimatePresence>
    </div>);

}