import { motion, AnimatePresence } from 'framer-motion';
import { Trash2Icon } from 'lucide-react';
interface ClearNotificationsModalProps {
  isOpen: boolean;
  isLoading?: boolean;
  count: number;
  onClose: () => void;
  onConfirm: () => void | Promise<void>;
}
export function ClearNotificationsModal({
  isOpen,
  isLoading = false,
  count,
  onClose,
  onConfirm
}: ClearNotificationsModalProps) {
  const itemWord = count === 1 ? 'notification' : 'notifications';
  return (
    <AnimatePresence>
      {isOpen &&
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
        className="fixed inset-0 z-[100] flex items-end sm:items-center justify-center p-0 sm:p-4 bg-dark-900/80 backdrop-blur-sm"
        onClick={() => {
          if (!isLoading) onClose();
        }}>
        
          <motion.div
          initial={{
            opacity: 0,
            y: 40,
            scale: 0.97
          }}
          animate={{
            opacity: 1,
            y: 0,
            scale: 1
          }}
          exit={{
            opacity: 0,
            y: 40,
            scale: 0.97
          }}
          transition={{
            type: 'spring',
            damping: 28,
            stiffness: 350
          }}
          className="glass-panel w-full sm:max-w-sm p-6 sm:p-8 flex flex-col items-center text-center shadow-2xl shadow-red-500/10 border-red-500/20 rounded-t-2xl sm:rounded-2xl"
          onClick={(e) => e.stopPropagation()}>
          
            <div className="hidden sm:flex w-12 h-12 rounded-full bg-red-500/10 items-center justify-center mb-4 border border-red-500/20 text-red-400">
              <Trash2Icon className="h-6 w-6" />
            </div>

            {/* Mobile drag handle */}
            <div className="sm:hidden w-10 h-1 rounded-full bg-white/20 mb-5 shrink-0" />

            {/* Mobile icon */}
            <div className="sm:hidden h-12 w-12 rounded-full bg-red-500/10 flex items-center justify-center mb-4 border border-red-500/20 text-red-400">
              <Trash2Icon className="h-6 w-6" />
            </div>

            <h3 className="text-lg sm:text-xl font-bold text-white mb-2">
              Clear all notifications
            </h3>
            <p className="text-sm text-gray-400 mb-6 leading-relaxed max-w-[280px] sm:max-w-none">
              This will permanently remove{' '}
              <span className="text-white font-semibold">{count}</span>{' '}
              {itemWord}. Your concerns and comments are not affected.
            </p>

            <div className="flex flex-col-reverse sm:flex-row w-full gap-2.5 sm:gap-3">
              <button
              type="button"
              onClick={onClose}
              disabled={isLoading}
              className="flex-1 px-4 py-3 sm:py-2.5 rounded-xl border border-white/10 text-white font-medium hover:bg-white/5 active:scale-[0.98] transition-all text-sm sm:text-base disabled:opacity-60 disabled:cursor-not-allowed">
              
                Cancel
              </button>
              <button
              type="button"
              onClick={() => void onConfirm()}
              disabled={isLoading}
              className="flex-1 px-4 py-3 sm:py-2.5 rounded-xl bg-red-500/10 border border-red-500/20 text-red-400 font-medium hover:bg-red-500/20 hover:text-red-300 active:scale-[0.98] transition-all text-sm sm:text-base disabled:opacity-60 disabled:cursor-not-allowed">
              
                {isLoading ? 'Clearing...' : 'Clear'}
              </button>
            </div>
          </motion.div>
        </motion.div>
      }
    </AnimatePresence>);

}
