import React, { useState } from 'react';
import { BuildingIcon, XIcon, PlusIcon, Loader2Icon } from 'lucide-react';
import { toast } from 'sonner';

interface AddDepartmentModalProps {
  isOpen: boolean;
  onClose: () => void;
  onAdd: (department: string) => Promise<void>;
}

export function AddDepartmentModal({
  isOpen,
  onClose,
  onAdd
}: AddDepartmentModalProps) {
  const [departmentName, setDepartmentName] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!departmentName.trim()) return;
    setIsLoading(true);
    try {
      await onAdd(departmentName.trim());
      toast.success('Department added successfully');
      setDepartmentName('');
      onClose();
    } catch {
      toast.error('Failed to add department');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-slate-900/50 dark:bg-dark-900/80 backdrop-blur-sm animate-fade-in">
      <div className="glass-panel w-full max-w-md rounded-2xl flex flex-col overflow-hidden animate-slide-up shadow-2xl border border-slate-200/80 dark:border-white/10 bg-white dark:bg-dark-800">
        <div className="flex items-center justify-between p-4 border-b border-slate-200/80 dark:border-white/10 bg-slate-50/80 dark:bg-white/5">
          <div className="flex items-center gap-2">
            <div className="p-1.5 rounded-lg bg-sky-50 dark:bg-sky-500/10 text-sky-600 dark:text-sky-400 border border-sky-200/60 dark:border-sky-500/20">
              <BuildingIcon className="h-5 w-5" />
            </div>
            <h3 className="text-base sm:text-lg font-bold text-slate-900 dark:text-white">
              Add Department
            </h3>
          </div>
          <button
            onClick={onClose}
            className="p-2 rounded-lg text-slate-400 hover:text-slate-700 dark:text-gray-400 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-white/10 transition-colors"
          >
            <XIcon className="h-5 w-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-5">
          <div>
            <label className="block text-xs sm:text-sm font-semibold text-slate-700 dark:text-gray-300 mb-1.5">
              Department Name
            </label>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <BuildingIcon className="h-4 w-4 text-slate-400 dark:text-gray-500" />
              </div>
              <input
                type="text"
                value={departmentName}
                onChange={(e) => setDepartmentName(e.target.value)}
                placeholder="e.g. College of Engineering"
                className="block w-full pl-10 bg-white dark:bg-dark-900/60 border border-slate-200 dark:border-white/10 rounded-xl py-2.5 text-sm text-slate-900 dark:text-white placeholder-slate-400 dark:placeholder-gray-500 focus:outline-none focus:border-sky-500 focus:ring-2 focus:ring-sky-500/20 shadow-sm transition-all"
                required
                autoFocus
              />
            </div>
            <p className="mt-2 text-xs text-slate-500 dark:text-gray-400">
              This department will be available for staff assignment and student concern routing.
            </p>
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
              disabled={isLoading || !departmentName.trim()}
              className="flex items-center gap-2 px-4 py-2 rounded-xl bg-gradient-to-r from-blue-600 via-sky-600 to-cyan-500 text-white text-sm font-semibold hover:from-blue-500 hover:to-cyan-400 shadow-md shadow-sky-500/20 transition-all disabled:opacity-70 active:scale-95"
            >
              {isLoading ? (
                <Loader2Icon className="h-4 w-4 animate-spin" />
              ) : (
                <PlusIcon className="h-4 w-4" />
              )}
              Add Department
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}