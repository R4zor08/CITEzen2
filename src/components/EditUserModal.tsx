import React, { useEffect, useState } from 'react';
import { User, Role } from '../types';
import {
  XIcon,
  SaveIcon,
  Loader2Icon,
  UserIcon,
  MailIcon,
  BuildingIcon,
  BookOpenIcon,
  ShieldIcon,
  GraduationCapIcon,
  BriefcaseIcon,
  ShieldCheckIcon
} from 'lucide-react';
import { toast } from 'sonner';
import { CustomSelect } from './CustomSelect';

interface EditUserModalProps {
  isOpen: boolean;
  user: User | null;
  onClose: () => void;
  onSave: (
    userId: string,
    updates: Partial<
      User & {
        password?: string;
      }
    >
  ) => void | Promise<void>;
}

export function EditUserModal({
  isOpen,
  user,
  onClose,
  onSave
}: EditUserModalProps) {
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    role: 'student' as Role,
    department: '',
    course: '',
    studentId: '',
    newPassword: ''
  });
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    if (user) {
      setFormData({
        name: user.name || '',
        email: user.email || '',
        role: user.role || 'student',
        department: user.department || '',
        course: user.course || '',
        studentId: user.studentId || '',
        newPassword: ''
      });
    }
  }, [user]);

  if (!isOpen || !user) return null;

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
    if (!formData.name.trim()) {
      toast.error('Name is required');
      return;
    }
    setIsLoading(true);
    try {
      await new Promise((resolve) => setTimeout(resolve, 500));
      const updates: Partial<
        User & {
          password?: string;
        }
      > = {
        name: formData.name.trim(),
        email: formData.email.trim(),
        role: formData.role,
        ...(formData.role === 'staff' || formData.role === 'admin'
          ? {
              department: formData.department.trim()
            }
          : {}),
        ...(formData.role === 'student'
          ? {
              course: formData.course.trim(),
              studentId: formData.studentId.trim()
            }
          : {}),
        ...(formData.newPassword
          ? {
              password: formData.newPassword
            }
          : {})
      };
      await onSave(user.id, updates);
      toast.success(`User "${formData.name}" updated successfully`);
      onClose();
    } catch {
      toast.error('Failed to update user');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-slate-900/50 dark:bg-dark-900/80 backdrop-blur-sm animate-fade-in">
      <div className="glass-panel w-full max-w-lg rounded-2xl flex flex-col overflow-hidden animate-slide-up shadow-2xl border border-slate-200/80 dark:border-white/10 bg-white dark:bg-dark-800">
        <div className="flex items-center justify-between p-4 border-b border-slate-200/80 dark:border-white/10 bg-slate-50/80 dark:bg-white/5">
          <div className="flex items-center gap-2">
            <div className="p-1.5 rounded-lg bg-sky-50 dark:bg-sky-500/10 text-sky-600 dark:text-sky-400 border border-sky-200/60 dark:border-sky-500/20">
              <UserIcon className="h-5 w-5" />
            </div>
            <h3 className="text-base sm:text-lg font-bold text-slate-900 dark:text-white">
              Edit User Profile
            </h3>
          </div>
          <button
            onClick={onClose}
            className="p-2 rounded-lg text-slate-400 hover:text-slate-700 dark:text-gray-400 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-white/10 transition-colors"
          >
            <XIcon className="h-5 w-5" />
          </button>
        </div>

        <form
          onSubmit={handleSubmit}
          className="p-6 space-y-4 sm:space-y-5 overflow-y-auto max-h-[75vh] custom-scrollbar"
        >
          <div>
            <label className="block text-xs sm:text-sm font-semibold text-slate-700 dark:text-gray-300 mb-1.5">
              Full Name
            </label>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <UserIcon className="h-4 w-4 text-slate-400 dark:text-gray-500" />
              </div>
              <input
                type="text"
                name="name"
                value={formData.name}
                onChange={handleChange}
                className="block w-full pl-10 bg-white dark:bg-dark-900/60 border border-slate-200 dark:border-white/10 rounded-xl py-2.5 text-sm text-slate-900 dark:text-white placeholder-slate-400 dark:placeholder-gray-500 focus:outline-none focus:border-sky-500 focus:ring-2 focus:ring-sky-500/20 shadow-sm transition-all"
                required
              />
            </div>
          </div>

          <div>
            <label className="block text-xs sm:text-sm font-semibold text-slate-700 dark:text-gray-300 mb-1.5">
              Email Address
            </label>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <MailIcon className="h-4 w-4 text-slate-400 dark:text-gray-500" />
              </div>
              <input
                type="email"
                name="email"
                value={formData.email}
                onChange={handleChange}
                className="block w-full pl-10 bg-white dark:bg-dark-900/60 border border-slate-200 dark:border-white/10 rounded-xl py-2.5 text-sm text-slate-900 dark:text-white placeholder-slate-400 dark:placeholder-gray-500 focus:outline-none focus:border-sky-500 focus:ring-2 focus:ring-sky-500/20 shadow-sm transition-all"
                required
              />
            </div>
          </div>

          <div>
            <label className="block text-xs sm:text-sm font-semibold text-slate-700 dark:text-gray-300 mb-1.5">
              Account Role
            </label>
            <CustomSelect
              value={formData.role}
              onChange={(val) => setFormData((prev) => ({ ...prev, role: val as Role }))}
              options={[
                {
                  value: 'student',
                  label: 'Student',
                  icon: <GraduationCapIcon className="h-4 w-4 text-sky-500" />,
                  badge: 'Learner',
                  badgeColor: 'sky'
                },
                {
                  value: 'staff',
                  label: 'Staff Member',
                  icon: <BriefcaseIcon className="h-4 w-4 text-emerald-500" />,
                  badge: 'Responder',
                  badgeColor: 'emerald'
                },
                {
                  value: 'admin',
                  label: 'Administrator',
                  icon: <ShieldCheckIcon className="h-4 w-4 text-purple-500" />,
                  badge: 'Full Access',
                  badgeColor: 'purple'
                }
              ]}
              icon={<ShieldIcon className="h-4 w-4" />}
              className="w-full"
            />
          </div>

          {(formData.role === 'staff' || formData.role === 'admin') && (
            <div>
              <label className="block text-xs sm:text-sm font-semibold text-slate-700 dark:text-gray-300 mb-1.5">
                Department
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <BuildingIcon className="h-4 w-4 text-slate-400 dark:text-gray-500" />
                </div>
                <input
                  type="text"
                  name="department"
                  value={formData.department}
                  onChange={handleChange}
                  placeholder="e.g. Academic Affairs"
                  className="block w-full pl-10 bg-white dark:bg-dark-900/60 border border-slate-200 dark:border-white/10 rounded-xl py-2.5 text-sm text-slate-900 dark:text-white placeholder-slate-400 dark:placeholder-gray-500 focus:outline-none focus:border-sky-500 focus:ring-2 focus:ring-sky-500/20 shadow-sm transition-all"
                />
              </div>
            </div>
          )}

          {formData.role === 'student' && (
            <>
              <div>
                <label className="block text-xs sm:text-sm font-semibold text-slate-700 dark:text-gray-300 mb-1.5">
                  Student ID
                </label>
                <input
                  type="text"
                  name="studentId"
                  value={formData.studentId}
                  onChange={handleChange}
                  placeholder="e.g. 2023-00142"
                  className="block w-full bg-white dark:bg-dark-900/60 border border-slate-200 dark:border-white/10 rounded-xl py-2.5 px-4 text-sm text-slate-900 dark:text-white placeholder-slate-400 dark:placeholder-gray-500 focus:outline-none focus:border-sky-500 focus:ring-2 focus:ring-sky-500/20 shadow-sm transition-all"
                />
              </div>
              <div>
                <label className="block text-xs sm:text-sm font-semibold text-slate-700 dark:text-gray-300 mb-1.5">
                  Course / Program
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <BookOpenIcon className="h-4 w-4 text-slate-400 dark:text-gray-500" />
                  </div>
                  <input
                    type="text"
                    name="course"
                    value={formData.course}
                    onChange={handleChange}
                    placeholder="e.g. BS Computer Science"
                    className="block w-full pl-10 bg-white dark:bg-dark-900/60 border border-slate-200 dark:border-white/10 rounded-xl py-2.5 text-sm text-slate-900 dark:text-white placeholder-slate-400 dark:placeholder-gray-500 focus:outline-none focus:border-sky-500 focus:ring-2 focus:ring-sky-500/20 shadow-sm transition-all"
                  />
                </div>
              </div>
            </>
          )}

          <div>
            <label className="block text-xs sm:text-sm font-semibold text-slate-700 dark:text-gray-300 mb-1.5">
              New Password{' '}
              <span className="text-slate-400 dark:text-gray-500 font-normal">
                (leave blank to keep current)
              </span>
            </label>
            <input
              type="password"
              name="newPassword"
              value={formData.newPassword}
              onChange={handleChange}
              placeholder="••••••••"
              className="block w-full bg-white dark:bg-dark-900/60 border border-slate-200 dark:border-white/10 rounded-xl py-2.5 px-4 text-sm text-slate-900 dark:text-white placeholder-slate-400 dark:placeholder-gray-500 focus:outline-none focus:border-sky-500 focus:ring-2 focus:ring-sky-500/20 shadow-sm transition-all"
            />
          </div>

          <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-200/80 dark:border-white/10">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 rounded-xl border border-slate-200 dark:border-white/10 text-slate-600 dark:text-gray-300 text-sm font-medium hover:bg-slate-100 dark:hover:bg-white/5 transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isLoading}
              className="flex items-center gap-2 px-4 py-2 rounded-xl bg-gradient-to-r from-blue-600 via-sky-600 to-cyan-500 text-white text-sm font-semibold hover:from-blue-500 hover:to-cyan-400 shadow-md shadow-sky-500/20 transition-all disabled:opacity-70 active:scale-95"
            >
              {isLoading ? (
                <Loader2Icon className="h-4 w-4 animate-spin" />
              ) : (
                <SaveIcon className="h-4 w-4" />
              )}
              Save Changes
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}