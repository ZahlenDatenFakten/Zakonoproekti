import React, { useState } from 'react';
import type { ComparisonRow } from '../types/bill';
import { computeWordDiff } from '../services/diffService';
import { X, Maximize2, FileCode } from 'lucide-react';

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
  const [showDiff, setShowDiff] = useState(true);
  const diff = computeWordDiff(row.wasContent, row.becameContent);

  const backdropMouseDownRef = React.useRef(false);

  return (
    <div 
      className="modal-overlay" 
      onMouseDown={(e) => { backdropMouseDownRef.current = (e.target === e.currentTarget); }}
      onClick={(e) => {
        if (e.target === e.currentTarget && backdropMouseDownRef.current) {
          onClose();
        }
      }} 
      style={{ zIndex: 6000 }}
    >
      <div 
        className="modal-content" 
        onClick={(e) => e.stopPropagation()} 
        style={{ 
          maxWidth: '1180px', 
          width: '95vw', 
          maxHeight: '92vh', 
          display: 'flex', 
          flexDirection: 'column'
        }}
      >
        {/* Header */}
        <div className="modal-header">
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <Maximize2 size={18} color="var(--text-accent)" />
            <h3 style={{ fontSize: '1.05rem', fontWeight: 800, color: 'var(--text-primary)' }}>
              {row.articleTitle || 'Полноэкранный режим чтения и правовой экспертизы статьи'}
            </h3>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <button
              onClick={() => setShowDiff(!showDiff)}
              className="btn btn-secondary btn-pill"
              style={{
                fontSize: '0.78rem',
                padding: '5px 12px',
                fontFamily: 'var(--font-mono)',
                borderColor: showDiff ? 'var(--success-border)' : 'var(--border-subtle)',
                color: showDiff ? 'var(--success-text)' : 'var(--text-secondary)'
              }}
            >
              <FileCode size={13} /> {showDiff ? '✨ Подсветка правок (Diff Highlight)' : 'Обычный монолитный текст'}
            </button>

            <button onClick={onClose} className="btn btn-ghost" style={{ padding: '6px' }}>
              <X size={16} />
            </button>
          </div>
        </div>

        <div className="modal-body" style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: '16px', overflowY: 'auto' }}>
          {/* Article Title Input if editing */}
          {canEdit && (
            <div>
              <label className="input-label">
                Наименование статьи / правовой нормы:
              </label>
              <input
                type="text"
                className="input-field"
                value={row.articleTitle}
                onChange={(e) => onUpdateRow(row.id, 'articleTitle', e.target.value)}
                placeholder="Статья 1. Наименование статьи..."
                style={{ fontWeight: 700 }}
              />
            </div>
          )}

          {/* Side-by-Side Large Comparison Workspace */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px', flex: 1, minHeight: '380px' }}>
            
            {/* WAS Column */}
            <div style={{ display: 'flex', flexDirection: 'column', background: 'var(--bg-input)', border: '1px solid var(--border-subtle)', borderRadius: 'var(--radius-md)', padding: '16px' }}>
              <h4 className="tech-label" style={{ color: 'var(--danger-text)', marginBottom: '10px' }}>
                БЫЛО (Оригинальная действующая статья)
              </h4>
              {canEdit ? (
                <div style={{ display: 'flex', flexDirection: 'column', flex: 1 }}>
                  <textarea
                    className="textarea-field"
                    value={row.wasContent}
                    onChange={(e) => onUpdateRow(row.id, 'wasContent', e.target.value)}
                    placeholder="Полный текст действующей статьи..."
                    style={{ flex: 1, fontSize: '0.9rem', lineHeight: 1.6, minHeight: '200px', marginBottom: '10px' }}
                  />

                  {showDiff && (
                    <div style={{ background: 'var(--bg-surface)', padding: '12px', borderRadius: 'var(--radius-sm)', border: '1px solid var(--border-subtle)', fontSize: '0.86rem', lineHeight: 1.6 }}>
                      <span className="tech-label" style={{ display: 'block', marginBottom: '4px', fontSize: '0.68rem' }}>Вычеркивание правок:</span>
                      {diff.wasFormatted}
                    </div>
                  )}
                </div>
              ) : (
                <div style={{ flex: 1, overflowY: 'auto', whiteSpace: 'pre-wrap', lineHeight: 1.6, fontSize: '0.9rem' }}>
                  {showDiff ? diff.wasFormatted : row.wasContent || '—'}
                </div>
              )}
            </div>

            {/* BECAME Column */}
            <div style={{ display: 'flex', flexDirection: 'column', background: 'var(--bg-input)', border: '1px solid var(--border-subtle)', borderRadius: 'var(--radius-md)', padding: '16px' }}>
              <h4 className="tech-label" style={{ color: 'var(--success-text)', marginBottom: '10px' }}>
                СТАЛО (Предлагаемая новая редакция)
              </h4>
              {canEdit ? (
                <div style={{ display: 'flex', flexDirection: 'column', flex: 1 }}>
                  <textarea
                    className="textarea-field"
                    value={row.becameContent}
                    onChange={(e) => onUpdateRow(row.id, 'becameContent', e.target.value)}
                    placeholder="Полный текст проектируемой статьи..."
                    style={{ flex: 1, fontSize: '0.9rem', lineHeight: 1.6, minHeight: '200px', marginBottom: '10px' }}
                  />

                  {showDiff && (
                    <div style={{ background: 'var(--bg-surface)', padding: '12px', borderRadius: 'var(--radius-sm)', border: '1px solid var(--border-subtle)', fontSize: '0.86rem', lineHeight: 1.6 }}>
                      <span className="tech-label" style={{ display: 'block', marginBottom: '4px', fontSize: '0.68rem' }}>Добавление правок (Зеленый шрифт):</span>
                      {diff.becameFormatted}
                    </div>
                  )}
                </div>
              ) : (
                <div style={{ flex: 1, overflowY: 'auto', whiteSpace: 'pre-wrap', lineHeight: 1.6, fontSize: '0.9rem' }}>
                  {showDiff ? diff.becameFormatted : row.becameContent || '—'}
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="modal-footer">
          <button onClick={onClose} className="btn btn-primary btn-pill" style={{ fontSize: '0.84rem' }}>
            Готово
          </button>
        </div>
      </div>
    </div>
  );
};
