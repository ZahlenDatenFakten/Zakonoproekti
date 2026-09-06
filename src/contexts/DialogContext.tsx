import React, { createContext, useContext, useState } from 'react';
import type { ReactNode } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { AlertTriangle, Info, CheckCircle2, AlertCircle } from 'lucide-react';
import { R, ft, shadow, btnAccent, btnOutline, btnDangerSolid } from '../lib/ui';

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
          const variant = dialog.variant || (dialog.type === 'confirm' ? 'warning' : 'info');

          return (
            <div
              key={dialog.id}
              style={{
                position: 'fixed',
                inset: 0,
                zIndex: 99999 + index,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                padding: 16,
                background: 'rgba(10, 9, 8, 0.72)',
                backdropFilter: 'blur(6px)',
              }}
            >
              <motion.div
                initial={{ opacity: 0, scale: 0.95, y: 12 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.95, y: 12 }}
                transition={{ duration: 0.16 }}
                style={{
                  width: '100%',
                  maxWidth: 440,
                  background: R.bgPanel,
                  border: ft.strong,
                  borderRadius: 2,
                  boxShadow: shadow.panel,
                  overflow: 'hidden',
                  display: 'flex',
                  flexDirection: 'column',
                }}
              >
                {/* Header */}
                <div
                  style={{
                    padding: '14px 18px',
                    borderBottom: ft.hair,
                    background: R.bgElevated,
                    display: 'flex',
                    alignItems: 'center',
                    gap: 12,
                  }}
                >
                  <div
                    style={{
                      width: 32,
                      height: 32,
                      borderRadius: 2,
                      display: 'grid',
                      placeItems: 'center',
                      background:
                        variant === 'error'
                          ? R.dangerSubtle
                          : variant === 'warning'
                          ? 'rgba(234, 179, 8, 0.12)'
                          : variant === 'success'
                          ? R.successSubtle
                          : R.accentSubtle,
                      color:
                        variant === 'error'
                          ? R.danger
                          : variant === 'warning'
                          ? '#eab308'
                          : variant === 'success'
                          ? R.success
                          : R.accent,
                      border: ft.hair,
                      flexShrink: 0,
                    }}
                  >
                    {variant === 'error' && <AlertCircle size={16} />}
                    {variant === 'warning' && <AlertTriangle size={16} />}
                    {variant === 'success' && <CheckCircle2 size={16} />}
                    {variant === 'info' && <Info size={16} />}
                  </div>
                  <h3 style={{ fontSize: 14, fontWeight: 800, color: R.text, margin: 0 }}>
                    {dialog.title || (dialog.type === 'confirm' ? 'Подтверждение действия' : dialog.type === 'prompt' ? 'Ввод данных' : 'Уведомление системы')}
                  </h3>
                </div>

                {/* Body */}
                <div style={{ padding: '18px 20px', display: 'flex', flexDirection: 'column', gap: 14 }}>
                  <p style={{ fontSize: 13, color: R.textSecondary, lineHeight: 1.5, margin: 0, whiteSpace: 'pre-wrap' }}>
                    {dialog.message}
                  </p>

                  {dialog.type === 'prompt' && (
                    <input
                      type="text"
                      autoFocus
                      placeholder={dialog.placeholder || 'Введите значение...'}
                      value={inputValue}
                      onChange={(e) => setInputValue(e.target.value)}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter') closeDialog(dialog.id, inputValue);
                        if (e.key === 'Escape') closeDialog(dialog.id, null);
                      }}
                      style={{
                        width: '100%',
                        height: 36,
                        padding: '0 12px',
                        fontSize: 13,
                        background: R.bgInput,
                        border: ft.edge,
                        color: R.text,
                        borderRadius: 2,
                        outline: 'none',
                      }}
                    />
                  )}
                </div>

                {/* Footer */}
                <div
                  style={{
                    padding: '12px 18px',
                    borderTop: ft.hair,
                    background: R.bgElevated,
                    display: 'flex',
                    justifyContent: 'flex-end',
                    gap: 8,
                  }}
                >
                  {(dialog.type === 'confirm' || dialog.type === 'prompt') && (
                    <button
                      type="button"
                      onClick={() => closeDialog(dialog.id, dialog.type === 'prompt' ? null : false)}
                      style={btnOutline}
                    >
                      {dialog.cancelText || 'Отмена'}
                    </button>
                  )}
                  <button
                    type="button"
                    onClick={() => closeDialog(dialog.id, dialog.type === 'prompt' ? inputValue : true)}
                    style={variant === 'error' ? btnDangerSolid : btnAccent}
                  >
                    {dialog.confirmText || 'Подтвердить'}
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

