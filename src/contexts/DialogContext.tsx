import React, { createContext, useContext, useState } from 'react';
import type { ReactNode } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { AlertCircle, Info, CheckCircle2 } from 'lucide-react';
import { cn } from '../utils/cn';

type DialogType = 'alert' | 'prompt' | 'confirm';
type DialogVariant = 'info' | 'success' | 'warning' | 'error';

interface DialogOptions {
  title?: string;
  message: string;
  variant?: DialogVariant;
  placeholder?: string;
  confirmText?: string;
  cancelText?: string;
}

interface DialogContextType {
  alert: (options: DialogOptions | string) => Promise<void>;
  confirm: (options: DialogOptions | string) => Promise<boolean>;
  prompt: (options: DialogOptions | string) => Promise<string | null>;
}

const DialogContext = createContext<DialogContextType | undefined>(undefined);

export const useDialog = () => {
  const context = useContext(DialogContext);
  if (!context) throw new Error('useDialog must be used within DialogProvider');
  return context;
};

interface DialogState extends DialogOptions {
  id: string;
  type: DialogType;
  resolve: (value: any) => void;
}

export const DialogProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [dialogs, setDialogs] = useState<DialogState[]>([]);
  const [inputValue, setInputValue] = useState('');

  const addDialog = (type: DialogType, options: DialogOptions | string): Promise<any> => {
    return new Promise((resolve) => {
      const opts = typeof options === 'string' ? { message: options } : options;
      const newDialog: DialogState = {
        ...opts,
        id: Math.random().toString(36).substring(7),
        type,
        resolve,
      };
      setDialogs((prev) => [...prev, newDialog]);
      if (type === 'prompt') setInputValue('');
    });
  };

  const closeDialog = (id: string, value: any) => {
    setDialogs((prev) => prev.filter((d) => d.id !== id));
    const dialog = dialogs.find((d) => d.id === id);
    if (dialog) dialog.resolve(value);
  };

  const alert = (options: DialogOptions | string) => addDialog('alert', options);
  const confirm = (options: DialogOptions | string) => addDialog('confirm', options);
  const prompt = (options: DialogOptions | string) => addDialog('prompt', options);

  return (
    <DialogContext.Provider value={{ alert, confirm, prompt }}>
      {children}
      <AnimatePresence>
        {dialogs.map((dialog, index) => {
          const variant = dialog.variant || 'info';

          return (
            <div key={dialog.id} className="fixed inset-0 z-[100] flex items-center justify-center p-4">
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="absolute inset-0 bg-black/60 backdrop-blur-sm"
              />
              <motion.div
                initial={{ opacity: 0, scale: 0.95, y: 10 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.95, y: 10 }}
                className={cn(
                  "relative w-full max-w-md bg-[#0C0D12] border rounded-2xl shadow-2xl overflow-hidden flex flex-col",
                  variant === 'error' ? "border-rose-500/20 shadow-rose-500/10" :
                  variant === 'warning' ? "border-amber-500/20 shadow-amber-500/10" :
                  variant === 'success' ? "border-emerald-500/20 shadow-emerald-500/10" :
                  "border-indigo-500/20 shadow-indigo-500/10"
                )}
                style={{ zIndex: 101 + index }}
              >
                <div className="p-5 flex flex-col gap-4">
                  <div className="flex items-start gap-4">
                    <div className={cn(
                      "w-10 h-10 rounded-xl flex items-center justify-center shrink-0",
                      variant === 'error' ? "bg-rose-500/10 text-rose-400" :
                      variant === 'warning' ? "bg-amber-500/10 text-amber-400" :
                      variant === 'success' ? "bg-emerald-500/10 text-emerald-400" :
                      "bg-indigo-500/10 text-indigo-400"
                    )}>
                      {variant === 'error' && <AlertCircle size={20} />}
                      {variant === 'warning' && <AlertCircle size={20} />}
                      {variant === 'success' && <CheckCircle2 size={20} />}
                      {variant === 'info' && <Info size={20} />}
                    </div>
                    <div className="flex-1 pt-1 min-w-0">
                      {dialog.title && (
                        <h3 className="text-sm font-bold text-white mb-1">{dialog.title}</h3>
                      )}
                      <p className="text-sm text-zinc-300 leading-relaxed whitespace-pre-wrap">{dialog.message}</p>
                    </div>
                  </div>

                  {dialog.type === 'prompt' && (
                    <input
                      type="text"
                      autoFocus
                      placeholder={dialog.placeholder || "Введите значение..."}
                      value={inputValue}
                      onChange={(e) => setInputValue(e.target.value)}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter') closeDialog(dialog.id, inputValue);
                        if (e.key === 'Escape') closeDialog(dialog.id, null);
                      }}
                      className="w-full bg-black/60 border border-white/10 rounded-xl px-4 py-3 text-sm text-white focus:outline-none focus:border-indigo-500/50 transition-colors"
                    />
                  )}
                </div>

                <div className="p-4 bg-white/[0.02] border-t border-white/10 flex justify-end gap-3">
                  {(dialog.type === 'confirm' || dialog.type === 'prompt') && (
                    <button
                      onClick={() => closeDialog(dialog.id, dialog.type === 'prompt' ? null : false)}
                      className="px-5 py-2 rounded-xl text-sm font-bold text-zinc-400 hover:text-white hover:bg-white/5 transition-colors"
                    >
                      {dialog.cancelText || 'Отмена'}
                    </button>
                  )}
                  <button
                    onClick={() => closeDialog(dialog.id, dialog.type === 'prompt' ? inputValue : true)}
                    className={cn(
                      "px-5 py-2 rounded-xl text-sm font-bold transition-all active:scale-95",
                      variant === 'error' ? "bg-rose-600 hover:bg-rose-500 text-white" :
                      "bg-indigo-600 hover:bg-indigo-500 text-white"
                    )}
                  >
                    {dialog.confirmText || 'ОК'}
                  </button>
                </div>
              </motion.div>
            </div>
          );
        })}
      </AnimatePresence>
    </DialogContext.Provider>
  );
};
