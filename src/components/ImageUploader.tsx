import React, { useState } from 'react';
import { createPortal } from 'react-dom';
import { 
  X, 
  Plus, 
  ArrowRight, 
  ExternalLink, 
  Maximize2, 
  Pencil, 
  AlertCircle, 
  Check, 
  Link as LinkIcon, 
  Image as ImageIcon 
} from 'lucide-react';
import type { BillAttachment } from '../types/bill';
import { ConfirmModal } from './ConfirmModal';
import { R, ft, shadow, mono, btnAccent, btnOutline, btnDanger, fieldLabel } from '../lib/ui';

interface ImageUploaderProps {
  attachments: BillAttachment[];
  onChange: (attachments: BillAttachment[]) => void;
  disabled?: boolean;
}

// Regex to validate image URLs ending with .jpg, .png, .jpeg, .webp, .gif (with optional query parameters)
const IMAGE_URL_REGEX = /\.(jpg|jpeg|png|webp|gif)(\?.*)?$/i;

export const ImageUploader: React.FC<ImageUploaderProps> = ({ attachments, onChange, disabled }) => {
  const [expandedImage, setExpandedImage] = useState<string | null>(null);
  const [confirmDeletePairId, setConfirmDeletePairId] = useState<string | null>(null);
  
  // Track which slot is currently editing its URL inline: `${pairId}_${side}`
  const [editingSlot, setEditingSlot] = useState<string | null>(null);
  const [inputUrl, setInputUrl] = useState<string>('');
  const [validationError, setValidationError] = useState<string | null>(null);

  // Track failed image loads
  const [failedImages, setFailedImages] = useState<Record<string, boolean>>({});

  const isImageUrlValid = (url: string): boolean => {
    const trimmed = url.trim();
    if (!trimmed) return false;
    try {
      new URL(trimmed);
      return IMAGE_URL_REGEX.test(trimmed);
    } catch {
      // Also allow relative paths or simple links if valid syntax
      return IMAGE_URL_REGEX.test(trimmed);
    }
  };

  const handleStartEditing = (pairId: string, side: 'before' | 'after', currentUrl: string = '') => {
    setEditingSlot(`${pairId}_${side}`);
    setInputUrl(currentUrl);
    setValidationError(null);
  };

  const handleApplyUrl = (pairId: string, side: 'before' | 'after') => {
    const trimmed = inputUrl.trim();
    if (!trimmed) {
      // Clear URL
      clearImage(pairId, side);
      setEditingSlot(null);
      return;
    }

    if (!isImageUrlValid(trimmed)) {
      setValidationError('Ссылка должна заканчиваться на .jpg, .png, .jpeg или .webp');
      return;
    }

    const key = `${pairId}_${side}`;
    setFailedImages((prev) => ({ ...prev, [key]: false }));

    const updated = attachments.map((att) => {
      if (att.id === pairId) {
        return {
          ...att,
          [side === 'before' ? 'beforeUrl' : 'afterUrl']: trimmed,
        };
      }
      return att;
    });

    onChange(updated);
    setEditingSlot(null);
    setInputUrl('');
    setValidationError(null);
  };

  const clearImage = (pairId: string, side: 'before' | 'after') => {
    const key = `${pairId}_${side}`;
    setFailedImages((prev) => {
      const next = { ...prev };
      delete next[key];
      return next;
    });

    onChange(
      attachments.map((att) => {
        if (att.id === pairId) {
          const newAtt = { ...att };
          delete newAtt[side === 'before' ? 'beforeUrl' : 'afterUrl'];
          return newAtt;
        }
        return att;
      })
    );
  };

  const removeAttachmentPair = (pairId: string) => {
    onChange(attachments.filter((att) => att.id !== pairId));
  };

  const addEmptyPair = () => {
    const newId = 'att_' + Date.now() + '_' + Math.random().toString(36).substring(2, 7);
    onChange([...attachments, { id: newId }]);
  };

  const handlePasteIntoSlot = (e: React.ClipboardEvent, pairId: string, side: 'before' | 'after') => {
    const pastedText = e.clipboardData.getData('text');
    if (pastedText && isImageUrlValid(pastedText)) {
      e.preventDefault();
      const trimmed = pastedText.trim();
      const updated = attachments.map((att) => {
        if (att.id === pairId) {
          return {
            ...att,
            [side === 'before' ? 'beforeUrl' : 'afterUrl']: trimmed,
          };
        }
        return att;
      });
      onChange(updated);
      setEditingSlot(null);
    }
  };

  const renderSlot = (pairId: string, side: 'before' | 'after', url?: string) => {
    const slotKey = `${pairId}_${side}`;
    const isEditing = editingSlot === slotKey;
    const isFailed = failedImages[slotKey] || false;
    const sideTitle = side === 'before' ? 'Действующее (Было)' : 'Проектируемое (Стало)';
    const sideBadgeColor = side === 'before' ? '#e2494f' : '#7fb894';

    return (
      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: 6, minWidth: 260 }}>
        {/* Slot Label */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <span
            style={{
              fontSize: 11,
              fontFamily: mono,
              fontWeight: 700,
              textTransform: 'uppercase',
              letterSpacing: '0.06em',
              color: sideBadgeColor,
            }}
          >
            {sideTitle}
          </span>
          {url && !disabled && (
            <button
              type="button"
              onClick={() => handleStartEditing(pairId, side, url)}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: 4,
                fontSize: 11,
                fontFamily: mono,
                color: R.textMuted,
                background: 'none',
                border: 'none',
                cursor: 'pointer',
              }}
              title="Изменить ссылку"
            >
              <Pencil size={11} /> Изменить
            </button>
          )}
        </div>

        {/* Slot Card */}
        {isEditing ? (
          <div
            style={{
              padding: 14,
              background: R.bgInput,
              border: `1px solid ${R.accent}`,
              display: 'flex',
              flexDirection: 'column',
              gap: 10,
            }}
          >
            <label style={fieldLabel}>Вставьте прямую ссылку на фото (.jpg, .png)</label>
            <div style={{ display: 'flex', gap: 6 }}>
              <input
                type="url"
                autoFocus
                value={inputUrl}
                onChange={(e) => {
                  setInputUrl(e.target.value);
                  setValidationError(null);
                }}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') {
                    e.preventDefault();
                    handleApplyUrl(pairId, side);
                  } else if (e.key === 'Escape') {
                    setEditingSlot(null);
                  }
                }}
                placeholder="https://i.imgur.com/example.png"
                style={{
                  flex: 1,
                  background: R.bgSubtle,
                  border: ft.edge,
                  padding: '8px 10px',
                  fontSize: 12,
                  fontFamily: mono,
                  color: R.text,
                  outline: 'none',
                }}
              />
              <button
                type="button"
                onClick={() => handleApplyUrl(pairId, side)}
                style={{ ...btnAccent, height: 34, padding: '0 12px', fontSize: 12 }}
              >
                <Check size={14} /> Применить
              </button>
              <button
                type="button"
                onClick={() => setEditingSlot(null)}
                style={{ ...btnOutline, height: 34, padding: '0 10px', fontSize: 12 }}
              >
                <X size={14} />
              </button>
            </div>
            {validationError && (
              <div
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: 6,
                  fontSize: 11,
                  color: R.danger,
                  fontFamily: mono,
                }}
              >
                <AlertCircle size={13} /> {validationError}
              </div>
            )}
            <div style={{ fontSize: 10.5, color: R.textMuted, fontFamily: mono }}>
              Поддерживаются ссылки с окончанием: .png, .jpg, .jpeg, .webp
            </div>
          </div>
        ) : url ? (
          <div
            onPaste={(e) => handlePasteIntoSlot(e, pairId, side)}
            style={{
              position: 'relative',
              width: '100%',
              height: 220,
              background: R.bgInput,
              border: ft.strong,
              overflow: 'hidden',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            {isFailed ? (
              <div
                style={{
                  padding: 16,
                  textAlign: 'center',
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: 'center',
                  gap: 8,
                  color: R.danger,
                }}
              >
                <AlertCircle size={24} />
                <div style={{ fontSize: 12, fontWeight: 700 }}>Не удалось загрузить изображение</div>
                <div
                  style={{
                    fontSize: 10,
                    fontFamily: mono,
                    color: R.textMuted,
                    maxWidth: 240,
                    overflow: 'hidden',
                    textOverflow: 'ellipsis',
                    whiteSpace: 'nowrap',
                  }}
                >
                  {url}
                </div>
                {!disabled && (
                  <div style={{ display: 'flex', gap: 6, marginTop: 4 }}>
                    <button
                      type="button"
                      onClick={() => handleStartEditing(pairId, side, url)}
                      style={{ ...btnOutline, padding: '4px 8px', fontSize: 11 }}
                    >
                      Исправить ссылку
                    </button>
                    <button
                      type="button"
                      onClick={() => clearImage(pairId, side)}
                      style={{ ...btnDanger, padding: '4px 8px', fontSize: 11 }}
                    >
                      Удалить
                    </button>
                  </div>
                )}
              </div>
            ) : (
              <>
                <img
                  src={url}
                  alt={sideTitle}
                  onError={() => setFailedImages((prev) => ({ ...prev, [slotKey]: true }))}
                  onClick={() => setExpandedImage(url)}
                  style={{
                    width: '100%',
                    height: '100%',
                    objectFit: 'contain',
                    background: '#11100f',
                    cursor: 'pointer',
                    transition: 'transform 0.15s ease',
                  }}
                />

                {/* Floating Action Controls */}
                <div
                  style={{
                    position: 'absolute',
                    top: 6,
                    right: 6,
                    display: 'flex',
                    alignItems: 'center',
                    gap: 4,
                    background: 'rgba(20, 18, 17, 0.85)',
                    padding: '3px 6px',
                    border: ft.edge,
                    backdropFilter: 'blur(4px)',
                  }}
                >
                  <button
                    type="button"
                    onClick={() => setExpandedImage(url)}
                    title="Развернуть во весь экран"
                    style={{
                      background: 'none',
                      border: 'none',
                      color: R.text,
                      display: 'grid',
                      placeItems: 'center',
                      padding: 4,
                      cursor: 'pointer',
                    }}
                  >
                    <Maximize2 size={13} />
                  </button>

                  <a
                    href={url}
                    target="_blank"
                    rel="noreferrer"
                    title="Открыть оригинал по ссылке"
                    style={{
                      display: 'grid',
                      placeItems: 'center',
                      padding: 4,
                      color: R.text,
                    }}
                  >
                    <ExternalLink size={13} />
                  </a>

                  {!disabled && (
                    <button
                      type="button"
                      onClick={() => clearImage(pairId, side)}
                      title="Удалить фото"
                      style={{
                        background: 'none',
                        border: 'none',
                        color: R.danger,
                        display: 'grid',
                        placeItems: 'center',
                        padding: 4,
                        cursor: 'pointer',
                      }}
                    >
                      <X size={13} />
                    </button>
                  )}
                </div>
              </>
            )}
          </div>
        ) : (
          /* Empty state: Input Link Box */
          <div
            onPaste={(e) => handlePasteIntoSlot(e, pairId, side)}
            onClick={() => !disabled && handleStartEditing(pairId, side)}
            style={{
              width: '100%',
              height: 160,
              background: R.bgSubtle,
              border: `1px dashed ${R.border}`,
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              justifyContent: 'center',
              gap: 8,
              cursor: disabled ? 'default' : 'pointer',
              padding: 16,
              textAlign: 'center',
              transition: 'border-color 0.15s, background 0.15s',
            }}
            onMouseEnter={(e) => {
              if (!disabled) {
                e.currentTarget.style.borderColor = R.accent;
                e.currentTarget.style.background = R.bgElevated;
              }
            }}
            onMouseLeave={(e) => {
              if (!disabled) {
                e.currentTarget.style.borderColor = R.border;
                e.currentTarget.style.background = R.bgSubtle;
              }
            }}
          >
            <div
              style={{
                width: 36,
                height: 36,
                display: 'grid',
                placeItems: 'center',
                background: R.bgInput,
                border: ft.hair,
                color: R.accent,
              }}
            >
              <LinkIcon size={16} />
            </div>

            <div style={{ fontSize: 12, fontWeight: 700, color: R.text }}>
              {disabled ? 'Изображение не прикреплено' : 'Вставить ссылку на фото'}
            </div>

            {!disabled && (
              <div style={{ fontSize: 10.5, color: R.textMuted, fontFamily: mono }}>
                Кликните для ввода или нажмите <span style={{ color: R.accent }}>Ctrl+V</span> (.jpg, .png)
              </div>
            )}
          </div>
        )}
      </div>
    );
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
      {attachments.length === 0 && disabled ? (
        <div
          style={{
            fontSize: 12,
            fontFamily: mono,
            color: R.textMuted,
            padding: '24px 16px',
            textAlign: 'center',
            background: R.bgSubtle,
            border: ft.edge,
          }}
        >
          Фотоматериалы не прикреплены
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
          {attachments.map((pair, index) => (
            <div
              key={pair.id}
              style={{
                position: 'relative',
                display: 'flex',
                flexDirection: 'column',
                gap: 12,
                padding: 16,
                background: R.bgPanel,
                border: ft.strong,
              }}
            >
              {/* Pair Header */}
              <div
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  borderBottom: ft.hair,
                  paddingBottom: 8,
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                  <ImageIcon size={14} color={R.accent} />
                  <span
                    style={{
                      fontSize: 11,
                      fontFamily: mono,
                      fontWeight: 700,
                      textTransform: 'uppercase',
                      color: R.text,
                    }}
                  >
                    Фотофиксация #{index + 1}
                  </span>
                </div>

                {!disabled && (
                  <button
                    type="button"
                    onClick={() => setConfirmDeletePairId(pair.id)}
                    data-tooltip="Удалить блок фотофиксации"
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: 4,
                      fontSize: 11,
                      fontFamily: mono,
                      color: R.danger,
                      background: 'none',
                      border: 'none',
                      cursor: 'pointer',
                    }}
                  >
                    <X size={13} /> Удалить блок
                  </button>
                )}
              </div>

              {/* Pair Slots (Было / Стало) */}
              <div
                style={{
                  display: 'flex',
                  alignItems: 'stretch',
                  gap: 16,
                  flexWrap: 'wrap',
                }}
              >
                {renderSlot(pair.id, 'before', pair.beforeUrl)}

                <div
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    paddingTop: 24,
                    color: R.textMuted,
                  }}
                >
                  <ArrowRight size={18} />
                </div>

                {renderSlot(pair.id, 'after', pair.afterUrl)}
              </div>
            </div>
          ))}

          {!disabled && (
            <button
              type="button"
              onClick={addEmptyPair}
              style={{
                width: '100%',
                padding: '14px',
                background: R.bgSubtle,
                border: `1px dashed ${R.border}`,
                color: R.textMuted,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: 8,
                cursor: 'pointer',
                transition: 'border-color .15s, color .15s, background .15s',
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.borderColor = R.accent;
                e.currentTarget.style.color = R.accent;
                e.currentTarget.style.background = R.bgElevated;
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.borderColor = R.border;
                e.currentTarget.style.color = R.textMuted;
                e.currentTarget.style.background = R.bgSubtle;
              }}
            >
              <Plus size={16} />
              <span
                style={{
                  fontSize: 12,
                  fontFamily: mono,
                  fontWeight: 700,
                  textTransform: 'uppercase',
                  letterSpacing: '0.06em',
                }}
              >
                Добавить ссылки на фото (Было / Стало)
              </span>
            </button>
          )}
        </div>
      )}

      {/* Fullscreen Lightbox Modal */}
      {expandedImage &&
        createPortal(
          <div
            onClick={() => setExpandedImage(null)}
            style={{
              position: 'fixed',
              inset: 0,
              zIndex: 9999,
              background: 'rgba(20, 18, 17, 0.88)',
              backdropFilter: 'blur(4px)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              padding: 24,
              animation: 'rtFade .12s ease',
            }}
          >
            <div
              onClick={(e) => e.stopPropagation()}
              style={{
                position: 'relative',
                maxWidth: '92vw',
                maxHeight: '92vh',
                background: R.bgPanel,
                border: ft.strong,
                boxShadow: shadow.panel,
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                justifyContent: 'center',
                padding: 6,
              }}
            >
              <img
                src={expandedImage}
                alt="Просмотр"
                style={{ maxWidth: '100%', maxHeight: '86vh', objectFit: 'contain' }}
              />
              <button
                type="button"
                onClick={() => setExpandedImage(null)}
                style={{
                  position: 'absolute',
                  top: -12,
                  right: -12,
                  width: 32,
                  height: 32,
                  background: R.accent,
                  color: '#fff',
                  border: 'none',
                  display: 'grid',
                  placeItems: 'center',
                  cursor: 'pointer',
                  boxShadow: shadow.dropdown,
                }}
                title="Закрыть"
              >
                <X size={18} />
              </button>
            </div>
          </div>,
          document.body
        )}

      {confirmDeletePairId && (
        <ConfirmModal
          title="Удалить блок фотофиксации?"
          message="Ссылки на прикрепленные изображения (было / стало) будут удалены из проекта."
          confirmLabel="Удалить блок"
          onConfirm={() => {
            removeAttachmentPair(confirmDeletePairId);
            setConfirmDeletePairId(null);
          }}
          onCancel={() => setConfirmDeletePairId(null)}
        />
      )}
    </div>
  );
};
