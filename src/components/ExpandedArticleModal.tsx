import React from 'react';
import type { ComparisonRow } from '../types/bill';
import { X, Maximize2 } from 'lucide-react';

interface ExpandedArticleModalProps {
  row: ComparisonRow;
  canEdit: boolean;
  onUpdateRow: (id: string, field: keyof ComparisonRow, value: string) => void;
  onClose: () => void;
}

export const ExpandedArticleModal: React.FC<ExpandedArticleModalProps> = ({
  row,
  canEdit,
  onUpdateRow,
  onClose
}) => {
  return (
    <div className="modal-overlay" onClick={onClose} style={{ zIndex: 6000 }}>
      <div 
        className="modal-content" 
        onClick={(e) => e.stopPropagation()} 
        style={{ 
          maxWidth: '1100px', 
          width: '95vw', 
          maxHeight: '92vh', 
          display: 'flex', 
          flexDirection: 'column',
          padding: '24px' 
        }}
      >
        {/* Header */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '16px', borderBottom: '1px solid var(--border-subtle)', paddingBottom: '14px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <Maximize2 size={20} color="var(--text-primary)" />
            <h3 style={{ fontSize: '1.15rem', fontWeight: 600, color: 'var(--text-primary)' }}>
              {row.articleTitle || 'Полноэкранный режим чтения и правки статьи'}
            </h3>
          </div>

          <button onClick={onClose} className="btn btn-secondary" style={{ padding: '6px' }}>
            <X size={18} />
          </button>
        </div>

        {/* Article Title Input if editing */}
        {canEdit && (
          <div style={{ marginBottom: '16px' }}>
            <label style={{ fontSize: '0.82rem', color: 'var(--text-tertiary)', display: 'block', marginBottom: '4px' }}>
              Наименование статьи / раздела:
            </label>
            <input
              type="text"
              className="input-field"
              value={row.articleTitle}
              onChange={(e) => onUpdateRow(row.id, 'articleTitle', e.target.value)}
              placeholder="Статья..."
              style={{ fontWeight: 600 }}
            />
          </div>
        )}

        {/* Side-by-Side Large Comparison Workspace */}
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px', flex: 1, minHeight: '380px' }}>
          
          {/* WAS Column */}
          <div style={{ display: 'flex', flexDirection: 'column', background: 'var(--was-bg)', border: '1px solid var(--border-subtle)', borderRadius: '12px', padding: '16px' }}>
            <h4 style={{ fontSize: '0.85rem', fontWeight: 600, color: '#fca5a5', textTransform: 'uppercase', marginBottom: '10px', letterSpacing: '0.05em' }}>
              БЫЛО (Старая редакция / Исходная норма)
            </h4>
            {canEdit ? (
              <textarea
                className="textarea-field"
                value={row.wasContent}
                onChange={(e) => onUpdateRow(row.id, 'wasContent', e.target.value)}
                placeholder="Полный текст действующей редакции статьи..."
                style={{ flex: 1, fontSize: '0.92rem', lineHeight: 1.6, minHeight: '300px' }}
              />
            ) : (
              <div style={{ flex: 1, overflowY: 'auto', whiteSpace: 'pre-wrap', lineHeight: 1.6, fontSize: '0.94rem' }}>
                {row.wasContent || '—'}
              </div>
            )}
          </div>

          {/* BECAME Column */}
          <div style={{ display: 'flex', flexDirection: 'column', background: 'var(--became-bg)', border: '1px solid var(--border-subtle)', borderRadius: '12px', padding: '16px' }}>
            <h4 style={{ fontSize: '0.85rem', fontWeight: 600, color: '#6ee7b7', textTransform: 'uppercase', marginBottom: '10px', letterSpacing: '0.05em' }}>
              СТАЛО (Новая редакция / Итоговая формулировка)
            </h4>
            {canEdit ? (
              <textarea
                className="textarea-field"
                value={row.becameContent}
                onChange={(e) => onUpdateRow(row.id, 'becameContent', e.target.value)}
                placeholder="Полный текст новой редакции со всеми изменениями..."
                style={{ flex: 1, fontSize: '0.92rem', lineHeight: 1.6, minHeight: '300px' }}
              />
            ) : (
              <div style={{ flex: 1, overflowY: 'auto', whiteSpace: 'pre-wrap', lineHeight: 1.6, fontSize: '0.94rem' }}>
                {row.becameContent || '—'}
              </div>
            )}
          </div>
        </div>

        {/* Footer */}
        <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: '16px', paddingTop: '12px', borderTop: '1px solid var(--border-subtle)' }}>
          <button onClick={onClose} className="btn btn-primary">
            Готово
          </button>
        </div>
      </div>
    </div>
  );
};
