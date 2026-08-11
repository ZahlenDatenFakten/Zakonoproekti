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
        style={{ maxWidth: '420px', padding: '20px' }}
      >
        <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: '14px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <div 
              style={{ 
                width: '36px', 
                height: '36px', 
                borderRadius: '8px', 
                background: isDanger ? 'rgba(239, 68, 68, 0.12)' : 'var(--bg-dark-3)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                flexShrink: 0
              }}
            >
              <AlertTriangle size={18} color={isDanger ? '#fca5a5' : 'var(--text-secondary)'} />
            </div>
            <h3 style={{ fontSize: '1.05rem', fontWeight: 600, color: 'var(--text-primary)' }}>
              {title}
            </h3>
          </div>

          <button onClick={onCancel} className="btn btn-secondary" style={{ padding: '4px 6px' }}>
            <X size={15} />
          </button>
        </div>

        <p style={{ fontSize: '0.88rem', color: 'var(--text-secondary)', marginBottom: '20px', lineHeight: 1.5 }}>
          {message}
        </p>

        <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px' }}>
          <button onClick={onCancel} className="btn btn-secondary" style={{ fontSize: '0.82rem', padding: '7px 14px' }}>
            {cancelLabel}
          </button>
          <button 
            onClick={onConfirm} 
            className={isDanger ? 'btn btn-danger' : 'btn btn-primary'}
            style={{ fontSize: '0.82rem', padding: '7px 14px' }}
          >
            {confirmLabel}
          </button>
        </div>
      </div>
    </div>
  );
};
