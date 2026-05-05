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
  ShieldIcon } from
'lucide-react';
import { toast } from 'sonner';
interface EditUserModalProps {
  isOpen: boolean;
  user: User | null;
  onClose: () => void;
  onSave: (
  userId: string,
  updates: Partial<
    User & {
      password?: string;
    }>
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
  e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) =>
  {
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
        }> =
      {
        name: formData.name.trim(),
        email: formData.email.trim(),
        role: formData.role,
        ...(formData.role === 'staff' || formData.role === 'admin' ?
        {
          department: formData.department.trim()
        } :
        {}),
        ...(formData.role === 'student' ?
        {
          course: formData.course.trim(),
          studentId: formData.studentId.trim()
        } :
        {}),
        ...(formData.newPassword ?
        {
          password: formData.newPassword
        } :
        {})
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
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-dark-900/80 backdrop-blur-sm animate-fade-in">
      <div className="glass-panel w-full max-w-lg flex flex-col overflow-hidden animate-slide-up shadow-2xl shadow-purple-500/10">
        <div className="flex items-center justify-between p-4 border-b border-white/10 bg-white/5">
          <div className="flex items-center gap-2">
            <div className="p-1.5 rounded-lg bg-purple-500/10 text-purple-400">
              <UserIcon className="h-5 w-5" />
            </div>
            <h3 className="text-lg font-semibold text-white">Edit User</h3>
          </div>
          <button
            onClick={onClose}
            className="p-2 rounded-lg text-gray-400 hover:text-white hover:bg-white/10 transition-colors">
            
            <XIcon className="h-5 w-5" />
          </button>
        </div>

        <form
          onSubmit={handleSubmit}
          className="p-6 space-y-5 overflow-y-auto max-h-[70vh] custom-scrollbar">
          
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-1.5">
              Full Name
            </label>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <UserIcon className="h-4 w-4 text-gray-500" />
              </div>
              <input
                type="text"
                name="name"
                value={formData.name}
                onChange={handleChange}
                className="block w-full pl-10 bg-dark-800/50 border border-white/10 rounded-xl py-2.5 text-sm text-white placeholder-gray-500 focus:outline-none focus:border-purple-500 focus:ring-1 focus:ring-purple-500 transition-all"
                required />
              
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-300 mb-1.5">
              Email
            </label>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <MailIcon className="h-4 w-4 text-gray-500" />
              </div>
              <input
                type="email"
                name="email"
                value={formData.email}
                onChange={handleChange}
                className="block w-full pl-10 bg-dark-800/50 border border-white/10 rounded-xl py-2.5 text-sm text-white placeholder-gray-500 focus:outline-none focus:border-purple-500 focus:ring-1 focus:ring-purple-500 transition-all"
                required />
              
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-300 mb-1.5">
              Role
            </label>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <ShieldIcon className="h-4 w-4 text-gray-500" />
              </div>
              <select
                name="role"
                value={formData.role}
                onChange={handleChange}
                className="block w-full pl-10 bg-dark-800/50 border border-white/10 rounded-xl py-2.5 text-sm text-white focus:outline-none focus:border-purple-500 focus:ring-1 focus:ring-purple-500 transition-all appearance-none">
                
                <option value="student">Student</option>
                <option value="staff">Staff</option>
                <option value="admin">Admin</option>
              </select>
            </div>
          </div>

          {(formData.role === 'staff' || formData.role === 'admin') &&
          <div>
              <label className="block text-sm font-medium text-gray-300 mb-1.5">
                Department
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <BuildingIcon className="h-4 w-4 text-gray-500" />
                </div>
                <input
                type="text"
                name="department"
                value={formData.department}
                onChange={handleChange}
                placeholder="e.g. Academic Affairs"
                className="block w-full pl-10 bg-dark-800/50 border border-white/10 rounded-xl py-2.5 text-sm text-white placeholder-gray-500 focus:outline-none focus:border-purple-500 focus:ring-1 focus:ring-purple-500 transition-all" />
              
              </div>
            </div>
          }

          {formData.role === 'student' &&
          <>
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-1.5">
                  Student ID
                </label>
                <input
                type="text"
                name="studentId"
                value={formData.studentId}
                onChange={handleChange}
                placeholder="e.g. 2023-00142"
                className="block w-full bg-dark-800/50 border border-white/10 rounded-xl py-2.5 px-4 text-sm text-white placeholder-gray-500 focus:outline-none focus:border-purple-500 focus:ring-1 focus:ring-purple-500 transition-all" />
              
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-1.5">
                  Course
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <BookOpenIcon className="h-4 w-4 text-gray-500" />
                  </div>
                  <input
                  type="text"
                  name="course"
                  value={formData.course}
                  onChange={handleChange}
                  placeholder="e.g. BS Computer Science"
                  className="block w-full pl-10 bg-dark-800/50 border border-white/10 rounded-xl py-2.5 text-sm text-white placeholder-gray-500 focus:outline-none focus:border-purple-500 focus:ring-1 focus:ring-purple-500 transition-all" />
                
                </div>
              </div>
            </>
          }

          <div>
            <label className="block text-sm font-medium text-gray-300 mb-1.5">
              New Password{' '}
              <span className="text-gray-500 font-normal">
                (leave blank to keep current)
              </span>
            </label>
            <input
              type="password"
              name="newPassword"
              value={formData.newPassword}
              onChange={handleChange}
              placeholder="••••••••"
              className="block w-full bg-dark-800/50 border border-white/10 rounded-xl py-2.5 px-4 text-sm text-white placeholder-gray-500 focus:outline-none focus:border-purple-500 focus:ring-1 focus:ring-purple-500 transition-all" />
            
          </div>

          <div className="flex items-center justify-end gap-3 pt-2">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 rounded-xl border border-white/10 text-gray-300 text-sm font-medium hover:bg-white/5 transition-colors">
              
              Cancel
            </button>
            <button
              type="submit"
              disabled={isLoading}
              className="flex items-center gap-2 px-4 py-2 rounded-xl bg-purple-600 text-white text-sm font-medium hover:bg-purple-500 transition-colors disabled:opacity-70">
              
              {isLoading ?
              <Loader2Icon className="h-4 w-4 animate-spin" /> :

              <SaveIcon className="h-4 w-4" />
              }
              Save Changes
            </button>
          </div>
        </form>
      </div>
    </div>);

}