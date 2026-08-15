import React, { useState } from 'react';
import type { ComparisonRow } from '../types/bill';
import { computeWordDiff } from '../services/diffService';
import { X, Maximize2, Edit3, Columns } from 'lucide-react';

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
  const [viewMode, setViewMode] = useState<'split_editor' | 'protocol'>('split_editor');
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
        className="modal-content animate-fade-in" 
        onClick={(e) => e.stopPropagation()} 
        style={{ 
          maxWidth: '1200px', 
          width: '95vw', 
          maxHeight: '92vh', 
          display: 'flex', 
          flexDirection: 'column'
        }}
      >
        {/* MODAL HEADER */}
        <div className="modal-header" style={{ flexWrap: 'wrap', gap: '12px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <div style={{ width: '34px', height: '34px', borderRadius: 'var(--radius-md)', background: 'var(--primary-gradient)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <Maximize2 size={16} color="#ffffff" />
            </div>
            <div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <span className="decree-stamp">
                  ПОСТАТЕЙНЫЙ АНАЛИЗ
                </span>
                <span style={{ fontSize: '0.9rem', fontWeight: 700, color: 'var(--text-primary)' }}>
                  {row.articleTitle || 'Статья без названия'}
                </span>
              </div>
            </div>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '10px', flexWrap: 'wrap' }}>
            {/* METRICS */}
            <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontFamily: 'var(--font-mono)' }}>
              {diff.stats.addedWords > 0 && (
                <span className="diff-token-added" style={{ fontSize: '0.7rem' }}>
                  +{diff.stats.addedWords} добавлено
                </span>
              )}
              {diff.stats.removedWords > 0 && (
                <span className="diff-token-removed" style={{ fontSize: '0.7rem' }}>
                  -{diff.stats.removedWords} удалено
                </span>
              )}
            </div>

            <div style={{ width: '1px', height: '18px', background: 'var(--border-subtle)' }} />

            {/* VIEW MODE TABS */}
            <div style={{ display: 'flex', gap: '2px', background: 'var(--bg-input)', padding: '3px', borderRadius: 'var(--radius-pill)', border: '1px solid var(--border-subtle)' }}>
              <button
                onClick={() => setViewMode('split_editor')}
                className="btn btn-pill"
                style={{
                  fontSize: '0.76rem',
                  padding: '5px 12px',
                  background: viewMode === 'split_editor' ? 'var(--primary-gradient)' : 'transparent',
                  color: viewMode === 'split_editor' ? '#ffffff' : 'var(--text-secondary)',
                  border: 'none'
                }}
              >
                <Edit3 size={12} /> Параллельный редактор
              </button>

              <button
                onClick={() => setViewMode('protocol')}
                className="btn btn-pill"
                style={{
                  fontSize: '0.76rem',
                  padding: '5px 12px',
                  background: viewMode === 'protocol' ? 'var(--primary-gradient)' : 'transparent',
                  color: viewMode === 'protocol' ? '#ffffff' : 'var(--text-secondary)',
                  border: 'none'
                }}
              >
                <Columns size={12} /> Чистый Diff Протокол
              </button>
            </div>

            <button 
              onClick={onClose} 
              className="btn btn-ghost" 
              style={{ padding: '6px', borderRadius: 'var(--radius-pill)' }} 
              title="Закрыть (Esc)"
            >
              <X size={18} />
            </button>
          </div>
        </div>

        {/* MODAL BODY */}
        <div style={{ flex: 1, overflowY: 'auto', padding: '20px' }}>
          
          {/* ARTICLE TITLE BAR */}
          <div style={{ marginBottom: '16px' }}>
            <label className="input-label">Наименование статьи</label>
            <input 
              type="text"
              value={row.articleTitle}
              onChange={(e) => onUpdateRow(row.id, 'articleTitle', e.target.value)}
              disabled={!canEdit}
              className="input-field"
              style={{ width: '100%', fontSize: '0.95rem', fontWeight: 600 }}
              placeholder="Статья 1. Наименование статьи..."
            />
          </div>

          {viewMode === 'split_editor' ? (
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px', minHeight: '340px' }}>
              
              {/* WAS COLUMN */}
              <div className="card" style={{ padding: '0', display: 'flex', flexDirection: 'column' }}>
                <div style={{ 
                  padding: '8px 16px', 
                  background: 'rgba(244, 63, 94, 0.05)', 
                  borderBottom: '1px solid var(--border-subtle)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between'
                }}>
                  <span style={{ fontSize: '0.72rem', fontWeight: 600, color: 'var(--danger-text)', fontFamily: 'var(--font-mono)' }}>
                    ДЕЙСТВУЮЩАЯ РЕДАКЦИЯ (ОРИГИНАЛ)
                  </span>
                  {canEdit && (
                    <button
                      type="button"
                      onClick={() => onUpdateRow(row.id, 'wasContent', '[Ранее статья в действующей редакции закона отсутствовала]')}
                      className="btn btn-ghost"
                      style={{ fontSize: '0.66rem', padding: '2px 6px', color: 'var(--text-accent)' }}
                    >
                      ✨ Ранее не было
                    </button>
                  )}
                </div>

                <textarea
                  value={row.wasContent}
                  onChange={(e) => onUpdateRow(row.id, 'wasContent', e.target.value)}
                  disabled={!canEdit}
                  style={{
                    flex: 1,
                    width: '100%',
                    padding: '16px',
                    border: 'none',
                    background: 'transparent',
                    color: 'var(--text-primary)',
                    fontFamily: 'var(--font-sans)',
                    fontSize: '0.9rem',
                    lineHeight: 1.6,
                    resize: 'none',
                    outline: 'none',
                    minHeight: '260px'
                  }}
                  placeholder="Вставьте исходный текст действующей статьи..."
                />
              </div>

              {/* BECAME COLUMN */}
              <div className="card" style={{ padding: '0', display: 'flex', flexDirection: 'column' }}>
                <div style={{ 
                  padding: '8px 16px', 
                  background: 'rgba(16, 185, 129, 0.05)', 
                  borderBottom: '1px solid var(--border-subtle)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between'
                }}>
                  <span style={{ fontSize: '0.72rem', fontWeight: 600, color: 'var(--success-text)', fontFamily: 'var(--font-mono)' }}>
                    ПРОЕКТИРУЕМАЯ РЕДАКЦИЯ (ПОПРАВКИ)
                  </span>
                </div>

                <textarea
                  value={row.becameContent}
                  onChange={(e) => onUpdateRow(row.id, 'becameContent', e.target.value)}
                  disabled={!canEdit}
                  style={{
                    flex: 1,
                    width: '100%',
                    padding: '16px',
                    border: 'none',
                    background: 'transparent',
                    color: 'var(--text-primary)',
                    fontFamily: 'var(--font-sans)',
                    fontSize: '0.9rem',
                    lineHeight: 1.6,
                    resize: 'none',
                    outline: 'none',
                    minHeight: '260px'
                  }}
                  placeholder="Введите предлагаемую новую формулировку статьи..."
                />
              </div>

            </div>
          ) : (
            /* PROTOCOL UNIFIED DIFF VIEW */
            <div className="card" style={{ padding: '20px' }}>
              <div style={{ marginBottom: '10px', fontSize: '0.74rem', color: 'var(--text-muted)', fontFamily: 'var(--font-mono)', fontWeight: 600 }}>
                ПОЛНЫЙ СРАВНИТЕЛЬНЫЙ ПРОТОКОЛ ИЗМЕНЕНИЙ
              </div>
              <div style={{ fontSize: '0.92rem', lineHeight: 1.8 }}>
                {diff.unifiedFormatted.length > 0 ? (
                  <div>{diff.unifiedFormatted}</div>
                ) : (
                  <div style={{ color: 'var(--text-muted)' }}>Текст отсутствует</div>
                )}
              </div>
            </div>
          )}

        </div>

        {/* MODAL FOOTER */}
        <div className="modal-footer">
          <button onClick={onClose} className="btn btn-primary btn-pill" style={{ padding: '7px 20px', fontSize: '0.82rem' }}>
            Готово
          </button>
        </div>
      </div>
    </div>
  );
};
