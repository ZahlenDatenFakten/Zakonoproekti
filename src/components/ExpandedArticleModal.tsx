import React, { useState } from 'react';
import type { ComparisonRow } from '../types/bill';
import { computeWordDiff } from '../services/diffService';
import { X, Maximize2, Edit3, Columns, Sparkles } from 'lucide-react';
import { R, ft, shadow, mono, btnAccent, chip } from '../lib/ui';

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
  onClose,
}) => {
  const [viewMode, setViewMode] = useState<'split_editor' | 'protocol'>('split_editor');
  const diff = computeWordDiff(row.wasContent, row.becameContent);

  return (
    <div
      onClick={onClose}
      style={{
        position: 'fixed',
        inset: 0,
        background: 'rgba(20, 18, 17, 0.75)',
        backdropFilter: 'blur(4px)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: 16,
        zIndex: 6000,
        animation: 'rtFade .12s ease',
      }}
    >
      <div
        onClick={(e) => e.stopPropagation()}
        style={{
          width: 1400,
          maxWidth: '100%',
          height: '92vh',
          display: 'flex',
          flexDirection: 'column',
          background: R.bgPanel,
          border: ft.strong,
          boxShadow: shadow.panel,
          animation: 'rtIn .18s ease',
        }}
      >
        {/* MODAL HEADER */}
        <header
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            padding: '14px 20px',
            borderBottom: ft.strong,
            background: R.bgPanel,
            flexWrap: 'wrap',
            gap: 12,
            flex: '0 0 auto',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
            <div
              style={{
                width: 32,
                height: 32,
                background: R.accentSubtle,
                border: `1px solid ${R.accentBorder}`,
                color: R.accent,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
              }}
            >
              <Maximize2 size={16} />
            </div>
            <div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <span
                  style={{
                    fontSize: 10,
                    fontFamily: mono,
                    fontWeight: 700,
                    color: R.textMuted,
                    textTransform: 'uppercase',
                    letterSpacing: '0.06em',
                    background: R.bgSubtle,
                    padding: '2px 6px',
                    border: ft.edge,
                  }}
                >
                  Постатейный Анализ
                </span>
                <span style={{ fontSize: 16, fontWeight: 800, color: R.text }}>
                  {row.articleTitle || 'Статья без названия'}
                </span>
              </div>
            </div>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
            {/* METRICS */}
            <div style={{ display: 'flex', alignItems: 'center', gap: 6, fontFamily: mono, fontSize: 11, fontWeight: 700 }}>
              {diff.stats.addedWords > 0 && (
                <span
                  style={{
                    padding: '3px 8px',
                    background: 'rgba(34, 197, 94, 0.12)',
                    color: '#22c55e',
                    border: '1px solid rgba(34, 197, 94, 0.25)',
                  }}
                >
                  +{diff.stats.addedWords} доб.
                </span>
              )}
              {diff.stats.removedWords > 0 && (
                <span
                  style={{
                    padding: '3px 8px',
                    background: 'rgba(239, 68, 68, 0.12)',
                    color: '#ef4444',
                    border: '1px solid rgba(239, 68, 68, 0.25)',
                  }}
                >
                  -{diff.stats.removedWords} уд.
                </span>
              )}
            </div>

            <div style={{ width: 1, height: 20, background: R.border }} />

            {/* VIEW MODE TABS */}
            <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
              <button
                type="button"
                onClick={() => setViewMode('split_editor')}
                style={chip(viewMode === 'split_editor')}
              >
                <Edit3 size={13} style={{ marginRight: 6 }} /> Параллельный редактор
              </button>
              <button
                type="button"
                onClick={() => setViewMode('protocol')}
                style={chip(viewMode === 'protocol')}
              >
                <Columns size={13} style={{ marginRight: 6 }} /> Сравнительный протокол
              </button>
            </div>

            <button
              type="button"
              onClick={onClose}
              style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                width: 30,
                height: 30,
                color: R.textMuted,
                background: 'transparent',
                border: 'none',
                cursor: 'pointer',
              }}
              onMouseEnter={(e) => (e.currentTarget.style.background = R.bgElevated)}
              onMouseLeave={(e) => (e.currentTarget.style.background = 'transparent')}
            >
              <X size={18} />
            </button>
          </div>
        </header>

        {/* MODAL BODY */}
        <div
          className="rt-scroll"
          style={{
            flex: 1,
            overflowY: 'auto',
            padding: 20,
            display: 'flex',
            flexDirection: 'column',
            minHeight: 0,
            gap: 16,
          }}
        >
          {/* ARTICLE TITLE BAR */}
          <div style={{ flexShrink: 0 }}>
            <label
              style={{
                display: 'block',
                fontSize: 11,
                fontFamily: mono,
                fontWeight: 700,
                color: R.textMuted,
                textTransform: 'uppercase',
                letterSpacing: '0.06em',
                marginBottom: 6,
              }}
            >
              Наименование статьи
            </label>
            <input
              type="text"
              value={row.articleTitle}
              onChange={(e) => onUpdateRow(row.id, 'articleTitle', e.target.value)}
              disabled={!canEdit}
              style={{
                width: '100%',
                background: R.bgInput,
                border: ft.edge,
                padding: '10px 14px',
                color: R.text,
                fontWeight: 700,
                fontSize: 14,
                outline: 'none',
              }}
              placeholder="Статья 1. Наименование статьи..."
              onFocus={(e) => (e.currentTarget.style.borderColor = R.accent)}
              onBlur={(e) => (e.currentTarget.style.borderColor = R.border)}
            />
          </div>

          {viewMode === 'split_editor' ? (
            <div
              style={{
                flex: 1,
                display: 'grid',
                gridTemplateColumns: 'repeat(auto-fit, minmax(360px, 1fr))',
                gap: 16,
                minHeight: 0,
              }}
            >
              {/* WAS COLUMN */}
              <div
                style={{
                  display: 'flex',
                  flexDirection: 'column',
                  background: R.bgInput,
                  border: ft.strong,
                  overflow: 'hidden',
                  minHeight: 380,
                }}
              >
                <div
                  style={{
                    padding: '10px 14px',
                    borderBottom: ft.edge,
                    background: R.bgSubtle,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                  }}
                >
                  <span
                    style={{
                      fontSize: 11,
                      fontFamily: mono,
                      fontWeight: 700,
                      color: '#f87171',
                      textTransform: 'uppercase',
                      letterSpacing: '0.06em',
                    }}
                  >
                    Действующая Редакция (Оригинал)
                  </span>
                  {canEdit && (
                    <button
                      type="button"
                      onClick={() =>
                        onUpdateRow(
                          row.id,
                          'wasContent',
                          '[Ранее статья в действующей редакции закона отсутствовала]'
                        )
                      }
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: 6,
                        padding: '3px 8px',
                        background: 'transparent',
                        border: ft.edge,
                        fontSize: 11,
                        fontFamily: mono,
                        color: R.textMuted,
                        cursor: 'pointer',
                      }}
                    >
                      <Sparkles size={12} /> Ранее не было
                    </button>
                  )}
                </div>

                <textarea
                  autoComplete="off"
                  spellCheck="false"
                  autoCorrect="off"
                  value={row.wasContent}
                  onChange={(e) => onUpdateRow(row.id, 'wasContent', e.target.value)}
                  disabled={!canEdit}
                  style={{
                    flex: 1,
                    width: '100%',
                    background: 'transparent',
                    border: 'none',
                    color: R.text,
                    padding: 16,
                    fontSize: 13,
                    lineHeight: 1.7,
                    outline: 'none',
                    resize: 'none',
                    fontFamily: 'inherit',
                  }}
                  placeholder="Вставьте исходный текст действующей статьи..."
                />
              </div>

              {/* BECAME COLUMN */}
              <div
                style={{
                  display: 'flex',
                  flexDirection: 'column',
                  background: R.bgInput,
                  border: ft.strong,
                  overflow: 'hidden',
                  minHeight: 380,
                }}
              >
                <div
                  style={{
                    padding: '10px 14px',
                    borderBottom: ft.edge,
                    background: R.bgSubtle,
                  }}
                >
                  <span
                    style={{
                      fontSize: 11,
                      fontFamily: mono,
                      fontWeight: 700,
                      color: '#4ade80',
                      textTransform: 'uppercase',
                      letterSpacing: '0.06em',
                    }}
                  >
                    Проектируемая Редакция (Поправки)
                  </span>
                </div>

                <textarea
                  autoComplete="off"
                  spellCheck="false"
                  autoCorrect="off"
                  value={row.becameContent}
                  onChange={(e) => onUpdateRow(row.id, 'becameContent', e.target.value)}
                  disabled={!canEdit}
                  style={{
                    flex: 1,
                    width: '100%',
                    background: 'transparent',
                    border: 'none',
                    color: R.text,
                    padding: 16,
                    fontSize: 13,
                    lineHeight: 1.7,
                    outline: 'none',
                    resize: 'none',
                    fontFamily: 'inherit',
                  }}
                  placeholder="Введите предлагаемую новую формулировку статьи..."
                />
              </div>
            </div>
          ) : (
            /* PROTOCOL PARALLEL DIFF VIEW */
            <div
              style={{
                flex: 1,
                display: 'grid',
                gridTemplateColumns: 'repeat(auto-fit, minmax(360px, 1fr))',
                background: R.bgInput,
                border: ft.strong,
                minHeight: 380,
                overflow: 'hidden',
              }}
            >
              {/* Original (Was) */}
              <div style={{ display: 'flex', flexDirection: 'column', borderRight: ft.edge }}>
                <div
                  style={{
                    padding: '10px 14px',
                    background: R.bgSubtle,
                    borderBottom: ft.edge,
                  }}
                >
                  <span
                    style={{
                      fontSize: 11,
                      fontFamily: mono,
                      fontWeight: 700,
                      color: '#f87171',
                      textTransform: 'uppercase',
                      letterSpacing: '0.06em',
                    }}
                  >
                    Действующий текст (с удалёнными фрагментами)
                  </span>
                </div>
                <div
                  className="rt-scroll"
                  style={{
                    flex: 1,
                    padding: 16,
                    fontSize: 13,
                    lineHeight: 1.7,
                    whiteSpace: 'pre-wrap',
                    overflowY: 'auto',
                    color: R.text,
                  }}
                >
                  {diff.wasFormatted.length > 0 ? (
                    <>{diff.wasFormatted}</>
                  ) : (
                    <span style={{ color: R.textMuted, fontStyle: 'italic' }}>
                      Текст статьи не заполнен.
                    </span>
                  )}
                </div>
              </div>

              {/* New (Became) */}
              <div style={{ display: 'flex', flexDirection: 'column' }}>
                <div
                  style={{
                    padding: '10px 14px',
                    background: R.bgSubtle,
                    borderBottom: ft.edge,
                  }}
                >
                  <span
                    style={{
                      fontSize: 11,
                      fontFamily: mono,
                      fontWeight: 700,
                      color: '#4ade80',
                      textTransform: 'uppercase',
                      letterSpacing: '0.06em',
                    }}
                  >
                    Новая редакция (с добавленными фрагментами)
                  </span>
                </div>
                <div
                  className="rt-scroll"
                  style={{
                    flex: 1,
                    padding: 16,
                    fontSize: 13,
                    lineHeight: 1.7,
                    whiteSpace: 'pre-wrap',
                    overflowY: 'auto',
                    color: R.text,
                  }}
                >
                  {diff.becameFormatted.length > 0 ? (
                    <>{diff.becameFormatted}</>
                  ) : (
                    <span style={{ color: R.textMuted, fontStyle: 'italic' }}>
                      Текст статьи не заполнен.
                    </span>
                  )}
                </div>
              </div>
            </div>
          )}
        </div>

        {/* MODAL FOOTER */}
        <footer
          style={{
            padding: '14px 20px',
            borderTop: ft.strong,
            background: R.bgPanel,
            display: 'flex',
            justifyContent: 'flex-end',
            flex: '0 0 auto',
          }}
        >
          <button type="button" onClick={onClose} style={btnAccent}>
            Готово
          </button>
        </footer>
      </div>
    </div>
  );
};
