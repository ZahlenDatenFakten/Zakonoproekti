import React from 'react';
import { motion } from 'framer-motion';
import { AlertTriangle, X } from 'lucide-react';
import { cn } from '../utils/cn';

interface ConfirmModalProps {
  title: string;
  message: string;
  confirmLabel?: string;
  cancelLabel?: string;
  isDanger?: boolean;
  onConfirm: () => void;
  onCancel: () => void;
}

export const ConfirmModal: React.FC<ConfirmModalProps> = ({
  title,
  message,
  confirmLabel = 'Подтвердить',
  cancelLabel = 'Отмена',
  isDanger = true,
  onConfirm,
  onCancel
}) => {
  return (
    <div className="fixed inset-0 z-[99999] flex items-center justify-center p-4">
      <motion.div 
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="absolute inset-0 bg-black/80 backdrop-blur-sm"
        onClick={onCancel}
      />
      <motion.div 
        initial={{ opacity: 0, scale: 0.95, y: 20 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.95, y: 20 }}
        className="relative w-full max-w-md bg-[#0C0D12] border border-white/10 rounded-2xl shadow-2xl overflow-hidden flex flex-col"
      >
        <div className="p-5 border-b border-white/10 bg-white/[0.02] flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div 
              className={cn(
                "w-10 h-10 rounded-xl flex items-center justify-center shrink-0 border",
                isDanger 
                  ? "bg-rose-500/10 border-rose-500/20 text-rose-400" 
                  : "bg-indigo-500/10 border-indigo-500/20 text-indigo-400"
              )}
            >
              <AlertTriangle size={18} />
            </div>
            <h3 className="text-lg font-bold text-white">
              {title}
            </h3>
          </div>

          <button 
            onClick={onCancel} 
            className="w-8 h-8 flex items-center justify-center rounded-xl bg-transparent hover:bg-white/5 text-zinc-400 hover:text-white transition-colors"
          >
            <X size={16} />
          </button>
        </div>

        <div className="p-6">
          <p className="text-sm text-zinc-400 leading-relaxed font-medium m-0">
            {message}
          </p>
        </div>

        <div className="p-5 border-t border-white/10 bg-black/40 flex justify-end gap-3">
          <button 
            onClick={onCancel} 
            className="px-6 py-2.5 bg-white/[0.04] hover:bg-white/[0.08] text-white text-sm font-bold rounded-xl border border-white/10 transition-colors"
          >
            {cancelLabel}
          </button>
          <button 
            onClick={onConfirm} 
            className={cn(
              "px-6 py-2.5 text-white text-sm font-extrabold rounded-xl shadow-lg active:scale-95 transition-all border",
              isDanger 
                ? "bg-rose-600 hover:bg-rose-500 shadow-rose-500/20 border-rose-400/30" 
                : "bg-indigo-600 hover:bg-indigo-500 shadow-indigo-500/20 border-indigo-400/30"
            )}
          >
            {confirmLabel}
          </button>
        </div>
      </motion.div>
    </div>
  );
};
