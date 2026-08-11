import React from 'react';
import { AlertTriangle, X } from 'lucide-react';

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
  const backdropMouseDownRef = React.useRef(false);

  return (
    <div 
      className="modal-overlay" 
      onMouseDown={(e) => { backdropMouseDownRef.current = (e.target === e.currentTarget); }}
      onClick={(e) => {
        if (e.target === e.currentTarget && backdropMouseDownRef.current) {
          onCancel();
        }
      }} 
      style={{ zIndex: 2000 }}
    >
      <div 
        className="modal-content" 
        onClick={(e) => e.stopPropagation()} 
        style={{ maxWidth: '440px' }}
      >
        <div className="modal-header">
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <div 
              style={{ 
                width: '34px', 
                height: '34px', 
                borderRadius: 'var(--radius-md)', 
                background: isDanger ? 'var(--danger-bg)' : 'rgba(56, 189, 248, 0.1)',
                border: `1px solid ${isDanger ? 'var(--danger-border)' : 'rgba(56, 189, 248, 0.2)'}`,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                flexShrink: 0
              }}
            >
              <AlertTriangle size={18} color={isDanger ? 'var(--danger-text)' : 'var(--text-accent)'} />
            </div>
            <h3 style={{ fontSize: '1.05rem', fontWeight: 800, color: 'var(--text-primary)' }}>
              {title}
            </h3>
          </div>

          <button onClick={onCancel} className="btn btn-ghost" style={{ padding: '6px' }}>
            <X size={15} />
          </button>
        </div>

        <div className="modal-body">
          <p style={{ fontSize: '0.86rem', color: 'var(--text-secondary)', margin: 0, lineHeight: 1.55 }}>
            {message}
          </p>
        </div>

        <div className="modal-footer">
          <button onClick={onCancel} className="btn btn-secondary btn-pill" style={{ fontSize: '0.82rem' }}>
            {cancelLabel}
          </button>
          <button 
            onClick={onConfirm} 
            className={isDanger ? 'btn btn-danger btn-pill' : 'btn btn-primary btn-pill'}
            style={{ fontSize: '0.82rem' }}
          >
            {confirmLabel}
          </button>
        </div>
      </div>
    </div>
  );
};
