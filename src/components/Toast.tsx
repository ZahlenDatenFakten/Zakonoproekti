import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { CheckCircle2, AlertCircle, Info, X } from 'lucide-react';
import { cn } from '../utils/cn';

export type ToastType = 'success' | 'error' | 'info';

export interface ToastMessage {
  id: string;
  type: ToastType;
  text: string;
}

interface ToastProps {
  toasts: ToastMessage[];
  onDismiss: (id: string) => void;
}

export const ToastContainer: React.FC<ToastProps> = ({ toasts, onDismiss }) => {
  return (
    <div className="fixed bottom-6 right-6 z-[8000] flex flex-col gap-3 max-w-sm w-full pointer-events-none">
      <AnimatePresence>
        {toasts.map((toast) => {
          const isSuccess = toast.type === 'success';
          const isError = toast.type === 'error';
          const isInfo = toast.type === 'info';

          return (
            <motion.div
              key={toast.id}
              initial={{ opacity: 0, x: 50, scale: 0.95 }}
              animate={{ opacity: 1, x: 0, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95, transition: { duration: 0.2 } }}
              className={cn(
                "flex items-center justify-between gap-3 p-4 rounded-xl border shadow-2xl pointer-events-auto backdrop-blur-md",
                isSuccess && "bg-emerald-500/10 border-emerald-500/20 text-emerald-400",
                isError && "bg-rose-500/10 border-rose-500/20 text-rose-400",
                isInfo && "bg-indigo-500/10 border-indigo-500/20 text-indigo-400"
              )}
            >
              <div className="flex items-center gap-3">
                {isSuccess && <CheckCircle2 size={18} className="shrink-0" />}
                {isError && <AlertCircle size={18} className="shrink-0" />}
                {isInfo && <Info size={18} className="shrink-0" />}
                <span className="text-sm font-medium text-white/90 leading-snug">{toast.text}</span>
              </div>

              <button
                onClick={() => onDismiss(toast.id)}
                className={cn(
                  "shrink-0 p-1 rounded-lg transition-colors",
                  isSuccess && "hover:bg-emerald-500/20 text-emerald-400/70 hover:text-emerald-400",
                  isError && "hover:bg-rose-500/20 text-rose-400/70 hover:text-rose-400",
                  isInfo && "hover:bg-indigo-500/20 text-indigo-400/70 hover:text-indigo-400"
                )}
              >
                <X size={16} />
              </button>
            </motion.div>
          );
        })}
      </AnimatePresence>
    </div>
  );
};
