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
    } catch (error) {
      toast.error('Failed to add department');
    } finally {
      setIsLoading(false);
    }
  };
  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-dark-900/80 backdrop-blur-sm animate-fade-in">
      <div className="glass-panel w-full max-w-md flex flex-col overflow-hidden animate-slide-up shadow-2xl shadow-purple-500/10">
        <div className="flex items-center justify-between p-4 border-b border-white/10 bg-white/5">
          <div className="flex items-center gap-2">
            <div className="p-1.5 rounded-lg bg-purple-500/10 text-purple-400">
              <BuildingIcon className="h-5 w-5" />
            </div>
            <h3 className="text-lg font-semibold text-white">Add Department</h3>
          </div>
          <button
            onClick={onClose}
            className="p-2 rounded-lg text-gray-400 hover:text-white hover:bg-white/10 transition-colors">
            
            <XIcon className="h-5 w-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-6">
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-1.5">
              Department Name
            </label>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <BuildingIcon className="h-4 w-4 text-gray-500" />
              </div>
              <input
                type="text"
                value={departmentName}
                onChange={(e) => setDepartmentName(e.target.value)}
                placeholder="e.g. College of Engineering"
                className="block w-full pl-10 bg-dark-800/50 border border-white/10 rounded-xl py-2.5 text-sm text-white placeholder-gray-500 focus:outline-none focus:border-purple-500 focus:ring-1 focus:ring-purple-500 transition-all"
                required
                autoFocus />
              
            </div>
            <p className="mt-2 text-xs text-gray-500">
              This department will be available for staff assignment and student
              concern routing.
            </p>
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
              disabled={isLoading || !departmentName.trim()}
              className="flex items-center gap-2 px-4 py-2 rounded-xl bg-purple-600 text-white text-sm font-medium hover:bg-purple-500 transition-colors disabled:opacity-70">
              
              {isLoading ?
              <Loader2Icon className="h-4 w-4 animate-spin" /> :

              <PlusIcon className="h-4 w-4" />
              }
              Add Department
            </button>
          </div>
        </form>
      </div>
    </div>);

}