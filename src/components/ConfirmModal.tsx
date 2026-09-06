import React from 'react';
import { motion } from 'framer-motion';
import { AlertTriangle, X } from 'lucide-react';
import { R, ft, shadow, btnOutline, btnDangerSolid, btnAccent } from '../lib/ui';

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
    <div
      style={{
        position: 'fixed',
        inset: 0,
        zIndex: 99999,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: 16,
        background: 'rgba(10, 9, 8, 0.7)',
        backdropFilter: 'blur(6px)',
      }}
    >
      <motion.div 
        initial={{ opacity: 0, scale: 0.96, y: 15 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.96, y: 15 }}
        style={{
          width: '100%',
          maxWidth: 420,
          background: R.bgPanel,
          border: ft.strong,
          borderRadius: 2,
          boxShadow: shadow.panel,
          overflow: 'hidden',
          display: 'flex',
          flexDirection: 'column',
        }}
      >
        <div
          style={{
            padding: '14px 18px',
            borderBottom: ft.hair,
            background: R.bgElevated,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <div 
              style={{
                width: 32,
                height: 32,
                borderRadius: 2,
                display: 'grid',
                placeItems: 'center',
                background: isDanger ? R.dangerSubtle : R.accentSubtle,
                color: isDanger ? R.danger : R.accent,
                border: ft.hair,
              }}
            >
              <AlertTriangle size={16} />
            </div>
            <h3 style={{ fontSize: 14, fontWeight: 800, color: R.text, margin: 0 }}>
              {title}
            </h3>
          </div>

          <button 
            onClick={onCancel}
            style={{
              background: 'none',
              border: 'none',
              color: R.textMuted,
              cursor: 'pointer',
              display: 'grid',
              placeItems: 'center',
              padding: 4,
            }}
          >
            <X size={16} />
          </button>
        </div>

        <div style={{ padding: 20 }}>
          <p style={{ fontSize: 13, color: R.textSecondary, lineHeight: 1.5, margin: 0 }}>
            {message}
          </p>
        </div>

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
          <button 
            onClick={onCancel} 
            style={btnOutline}
          >
            {cancelLabel}
          </button>
          <button 
            onClick={onConfirm} 
            style={isDanger ? btnDangerSolid : btnAccent}
          >
            {confirmLabel}
          </button>
        </div>
      </motion.div>
    </div>
  );
};
