import React, { useState } from 'react';
import type { ComparisonRow } from '../types/bill';
import { computeWordDiff } from '../services/diffService';
import { X, Maximize2, FileCode, Edit3, Columns, FileText } from 'lucide-react';

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
  const [viewMode, setViewMode] = useState<'split_editor' | 'protocol' | 'unified'>('split_editor');
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
          maxWidth: '1240px', 
          width: '95vw', 
          maxHeight: '94vh', 
          display: 'flex', 
          flexDirection: 'column'
        }}
      >
        {/* MODAL HEADER WITH MODE TABS AND METRICS */}
        <div className="modal-header" style={{ flexWrap: 'wrap', gap: '14px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            <div style={{ width: '36px', height: '36px', borderRadius: 'var(--radius-md)', background: 'var(--primary-gradient)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <Maximize2 size={18} color="#ffffff" />
            </div>
            <div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <span className="decree-stamp">
                  РЕДАКТИРОВАНИЕ НОРМАТИВНОГО АКТА
                </span>
              </div>
              <p style={{ fontSize: '0.76rem', color: 'rgba(255, 255, 255, 0.65)', fontFamily: 'var(--font-mono)', margin: '4px 0 0 0' }}>
                Параллельный аналитический сравнительный протокол правовой нормы
              </p>
            </div>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '10px', flexWrap: 'wrap' }}>
            
            {/* METRICS BADGES */}
            <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontFamily: 'var(--font-mono)' }}>
              <span className="badge badge-status-approved" style={{ fontSize: '0.7rem', padding: '3px 10px' }}>
                +{diff.stats.addedWords} добавлено
              </span>
              <span className="badge badge-status-rejected" style={{ fontSize: '0.7rem', padding: '3px 10px' }}>
                -{diff.stats.removedWords} удалено
              </span>
            </div>

            <div style={{ width: '1px', height: '22px', background: 'var(--border-subtle)' }} />

            {/* VIEW MODE TABS */}
            <div style={{ display: 'flex', gap: '4px', background: 'var(--bg-input)', padding: '3px', borderRadius: 'var(--radius-pill)', border: '1px solid var(--border-subtle)' }}>
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
                <Edit3 size={13} /> Сплит-редактор
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
                <Columns size={13} /> 100% Протокол Diff
              </button>

              <button
                onClick={() => setViewMode('unified')}
                className="btn btn-pill"
                style={{
                  fontSize: '0.76rem',
                  padding: '5px 12px',
                  background: viewMode === 'unified' ? 'var(--primary-gradient)' : 'transparent',
                  color: viewMode === 'unified' ? '#ffffff' : 'var(--text-secondary)',
                  border: 'none'
                }}
              >
                <FileText size={13} /> Сводный Акт
              </button>
            </div>

            <button onClick={onClose} className="btn btn-ghost" style={{ padding: '6px' }}>
              <X size={16} />
            </button>
          </div>
        </div>

        <div className="modal-body" style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: '16px', overflowY: 'auto' }}>
          
          {/* ARTICLE TITLE INPUT */}
          {canEdit && (
            <div>
              <label className="input-label">Наименование статьи / нормативного положения:</label>
              <input
                type="text"
                className="input-field"
                value={row.articleTitle}
                onChange={(e) => onUpdateRow(row.id, 'articleTitle', e.target.value)}
                placeholder="Статья 1. Наименование статьи..."
                style={{ fontWeight: 700, fontSize: '0.95rem' }}
              />
            </div>
          )}

          {/* MODE 1: SPLIT EDITOR WITH INTEGRATED REAL-TIME DIFF PREVIEWS */}
          {viewMode === 'split_editor' && (
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px', flex: 1, minHeight: '380px' }}>
              
              {/* WAS COLUMN */}
              <div style={{ display: 'flex', flexDirection: 'column', background: 'var(--bg-input)', border: '1px solid var(--border-subtle)', borderRadius: 'var(--radius-md)', padding: '16px' }}>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '10px', flexWrap: 'wrap', gap: '8px' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <h4 className="tech-label" style={{ color: 'var(--danger-text)', margin: 0 }}>
                      Действующая редакция (Оригинал)
                    </h4>
                    {canEdit && (
                      <button
                        type="button"
                        onClick={() => onUpdateRow(row.id, 'wasContent', '[Ранее статья в действующей редакции закона отсутствовала]')}
                        className="btn btn-pill"
                        style={{
                          fontSize: '0.66rem',
                          padding: '2px 8px',
                          background: 'rgba(56, 189, 248, 0.12)',
                          color: 'var(--text-accent)',
                          border: '1px solid rgba(56, 189, 248, 0.3)',
                          textTransform: 'none',
                          fontWeight: 600
                        }}
                        title="Отметить, что этой статьи не существовало в прежнем законе"
                      >
                        ✨ Статьи ранее не было
                      </button>
                    )}
                  </div>
                  <span style={{ fontSize: '0.68rem', color: 'var(--danger-text)', fontFamily: 'var(--font-mono)' }}>
                    УДАЛЕНИЯ (-)
                  </span>
                </div>

                <textarea
                  className="textarea-field"
                  value={row.wasContent}
                  onChange={(e) => onUpdateRow(row.id, 'wasContent', e.target.value)}
                  disabled={!canEdit}
                  placeholder="Полный текст действующей редакции статьи..."
                  style={{ flex: 1, fontSize: '0.9rem', lineHeight: 1.6, minHeight: '180px', marginBottom: '12px' }}
                />

                <div style={{ background: 'var(--bg-surface)', padding: '14px', borderRadius: 'var(--radius-sm)', border: '1px solid rgba(248, 81, 73, 0.3)', fontSize: '0.88rem', lineHeight: 1.65 }}>
                  <span className="tech-label" style={{ display: 'block', marginBottom: '6px', color: 'var(--danger-text)', fontSize: '0.68rem' }}>
                    🔍 Живая хроника вычеркиваемых правок:
                  </span>
                  {diff.wasFormatted.length > 0 ? diff.wasFormatted : <span style={{ opacity: 0.4 }}>—</span>}
                </div>
              </div>

              {/* BECAME COLUMN */}
              <div style={{ display: 'flex', flexDirection: 'column', background: 'var(--bg-input)', border: '1px solid var(--border-subtle)', borderRadius: 'var(--radius-md)', padding: '16px' }}>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '10px' }}>
                  <h4 className="tech-label" style={{ color: 'var(--success-text)', margin: 0 }}>
                    Проектируемая редакция (Поправки)
                  </h4>
                  <span style={{ fontSize: '0.68rem', color: 'var(--success-text)', fontFamily: 'var(--font-mono)' }}>
                    ДОБАВЛЕНИЯ (+)
                  </span>
                </div>

                <textarea
                  className="textarea-field"
                  value={row.becameContent}
                  onChange={(e) => onUpdateRow(row.id, 'becameContent', e.target.value)}
                  disabled={!canEdit}
                  placeholder="Полный текст новой редакции..."
                  style={{ flex: 1, fontSize: '0.9rem', lineHeight: 1.6, minHeight: '180px', marginBottom: '12px' }}
                />

                <div style={{ background: 'var(--bg-surface)', padding: '14px', borderRadius: 'var(--radius-sm)', border: '1px solid rgba(63, 185, 80, 0.3)', fontSize: '0.88rem', lineHeight: 1.65 }}>
                  <span className="tech-label" style={{ display: 'block', marginBottom: '6px', color: 'var(--success-text)', fontSize: '0.68rem' }}>
                    🔍 Живая хроника вносимых поправок:
                  </span>
                  {diff.becameFormatted.length > 0 ? diff.becameFormatted : <span style={{ opacity: 0.4 }}>—</span>}
                </div>
              </div>

            </div>
          )}

          {/* MODE 2: 100% ACCURATE FULL PROTOCOL COMPARISON */}
          {viewMode === 'protocol' && (
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px', flex: 1, minHeight: '380px' }}>
              
              {/* WAS PROTOCOL */}
              <div style={{ display: 'flex', flexDirection: 'column', background: 'var(--bg-input)', border: '1px solid rgba(248, 81, 73, 0.3)', borderRadius: 'var(--radius-md)', padding: '20px' }}>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '14px', borderBottom: '1px solid var(--border-subtle)', paddingBottom: '10px' }}>
                  <h4 className="tech-label" style={{ color: 'var(--danger-text)', margin: 0 }}>
                    Протокол оригинала (- {diff.stats.removedWords} слов)
                  </h4>
                  <span className="badge badge-status-rejected" style={{ fontSize: '0.68rem' }}>
                    Удаляемые нормы
                  </span>
                </div>
                <div style={{ flex: 1, overflowY: 'auto', whiteSpace: 'pre-wrap', lineHeight: 1.7, fontSize: '0.92rem', padding: '10px' }}>
                  {diff.wasFormatted.length > 0 ? diff.wasFormatted : <span style={{ opacity: 0.4 }}>Текст отсутствует</span>}
                </div>
              </div>

              {/* BECAME PROTOCOL */}
              <div style={{ display: 'flex', flexDirection: 'column', background: 'var(--bg-input)', border: '1px solid rgba(63, 185, 80, 0.3)', borderRadius: 'var(--radius-md)', padding: '20px' }}>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '14px', borderBottom: '1px solid var(--border-subtle)', paddingBottom: '10px' }}>
                  <h4 className="tech-label" style={{ color: 'var(--success-text)', margin: 0 }}>
                    Протокол реформы (+ {diff.stats.addedWords} слов)
                  </h4>
                  <span className="badge badge-status-approved" style={{ fontSize: '0.68rem' }}>
                    Вносимые нормы
                  </span>
                </div>
                <div style={{ flex: 1, overflowY: 'auto', whiteSpace: 'pre-wrap', lineHeight: 1.7, fontSize: '0.92rem', padding: '10px' }}>
                  {diff.becameFormatted.length > 0 ? diff.becameFormatted : <span style={{ opacity: 0.4 }}>Текст отсутствует</span>}
                </div>
              </div>

            </div>
          )}

          {/* MODE 3: UNIFIED LEGAL DECREE STREAM */}
          {viewMode === 'unified' && (
            <div style={{ background: 'var(--bg-input)', border: '1px solid var(--border-medium)', borderRadius: 'var(--radius-md)', padding: '24px', flex: 1, display: 'flex', flexDirection: 'column' }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '16px', borderBottom: '1px solid var(--border-subtle)', paddingBottom: '12px' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                  <FileCode size={18} color="var(--text-accent)" />
                  <h4 style={{ margin: 0, fontSize: '1rem', fontWeight: 800, color: 'var(--text-primary)' }}>
                    Сводный акт законопроекта (Unified Legal Stream)
                  </h4>
                </div>
                <div style={{ fontSize: '0.74rem', color: 'var(--text-muted)', fontFamily: 'var(--font-mono)' }}>
                  Общее число изменений: {diff.stats.totalChanges}
                </div>
              </div>

              <div style={{ flex: 1, overflowY: 'auto', whiteSpace: 'pre-wrap', lineHeight: 1.75, fontSize: '0.94rem', padding: '12px', background: 'var(--bg-surface)', borderRadius: 'var(--radius-sm)', border: '1px solid var(--border-subtle)' }}>
                {diff.unifiedFormatted.length > 0 ? diff.unifiedFormatted : <span style={{ opacity: 0.4 }}>Текст отсутствует</span>}
              </div>
            </div>
          )}

        </div>

        {/* FOOTER */}
        <div className="modal-footer">
          <button onClick={onClose} className="btn btn-primary btn-pill" style={{ fontSize: '0.84rem' }}>
            Сохранить и Закрыть
          </button>
        </div>
      </div>
    </div>
  );
};
