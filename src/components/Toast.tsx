import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { CheckCircle2, AlertCircle, Info, X } from 'lucide-react';
import { R } from '../lib/ui';

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
    <div
      style={{
        position: 'fixed',
        left: '50%',
        bottom: 24,
        transform: 'translateX(-50%)',
        zIndex: 9000,
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        gap: 8,
        pointerEvents: 'none',
      }}
    >
      <AnimatePresence>
        {toasts.map((toast) => {
          const isSuccess = toast.type === 'success';
          const isError = toast.type === 'error';

          const bg = isSuccess ? R.successSubtle : isError ? R.dangerSubtle : R.bgElevated;
          const borderColor = isSuccess ? R.success : isError ? R.dangerBorder : 'var(--rt-line-strong)';
          const textColor = isSuccess ? R.success : isError ? R.danger : R.text;

          return (
            <motion.div
              key={toast.id}
              initial={{ opacity: 0, y: 20, scale: 0.95 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: 15, scale: 0.95 }}
              transition={{ duration: 0.18 }}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: 10,
                padding: '10px 16px',
                fontSize: 13,
                fontWeight: 700,
                background: bg,
                border: `1px solid ${borderColor}`,
                color: textColor,
                borderRadius: 2,
                boxShadow: '0 12px 32px rgba(20, 18, 17, 0.28)',
                pointerEvents: 'auto',
                minWidth: 260,
                maxWidth: 480,
              }}
            >
              {isSuccess && <CheckCircle2 size={16} style={{ flexShrink: 0 }} />}
              {isError && <AlertCircle size={16} style={{ flexShrink: 0 }} />}
              {!isSuccess && !isError && <Info size={16} style={{ flexShrink: 0, color: R.accent }} />}

              <span style={{ flex: '1 1 auto', lineHeight: 1.3 }}>{toast.text}</span>

              <button
                onClick={() => onDismiss(toast.id)}
                style={{
                  background: 'none',
                  border: 'none',
                  padding: 2,
                  cursor: 'pointer',
                  color: textColor,
                  opacity: 0.75,
                  display: 'grid',
                  placeItems: 'center',
                }}
                onMouseEnter={(e) => (e.currentTarget.style.opacity = '1')}
                onMouseLeave={(e) => (e.currentTarget.style.opacity = '0.75')}
              >
                <X size={14} />
              </button>
            </motion.div>
          );
        })}
      </AnimatePresence>
    </div>
  );
};
