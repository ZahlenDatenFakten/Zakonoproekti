import React, { useState, useRef, useEffect, useMemo } from 'react';
import { createPortal } from 'react-dom';
import { 
  Search, 
  ChevronDown, 
  Check, 
  X, 
  Scale, 
  Edit3, 
  BookOpen
} from 'lucide-react';
import { mono } from '../../lib/ui';
import { LAWS_METADATA, type LawMetadata } from '../../data/lawsMetadata';

export interface LawSelectPickerProps {
  value: string;
  onChange: (lawTitle: string, lawCode?: string, lawId?: string) => void;
  variant?: 'full' | 'compact';
  disabled?: boolean;
  placeholder?: string;
  allowManualEdit?: boolean;
  className?: string;
  style?: React.CSSProperties;
}

interface CategoryInfo {
  key: string;
  label: string;
  shortLabel: string;
  icon: string;
  badgeBg: string;
  badgeBorder: string;
  badgeColor: string;
}

const CATEGORIES: CategoryInfo[] = [
  {
    key: 'all',
    label: 'Все законы штата (27)',
    shortLabel: '⚡ Все (27)',
    icon: '⚡',
    badgeBg: 'rgba(255, 255, 255, 0.08)',
    badgeBorder: 'rgba(255, 255, 255, 0.2)',
    badgeColor: '#ffffff',
  },
  {
    key: 'constitution',
    label: 'Конституция штата (1)',
    shortLabel: '📜 Конституция (1)',
    icon: '📜',
    badgeBg: 'rgba(245, 158, 11, 0.16)',
    badgeBorder: 'rgba(245, 158, 11, 0.45)',
    badgeColor: '#fbbf24',
  },
  {
    key: 'code',
    label: 'Кодексы штата (6)',
    shortLabel: '⚖️ Кодексы (6)',
    icon: '⚖️',
    badgeBg: 'rgba(236, 199, 129, 0.16)',
    badgeBorder: 'rgba(236, 199, 129, 0.45)',
    badgeColor: '#ecc781',
  },
  {
    key: 'security',
    label: 'Силовые ведомства (5)',
    shortLabel: '🛡️ Силовые (5)',
    icon: '🛡️',
    badgeBg: 'rgba(56, 189, 248, 0.16)',
    badgeBorder: 'rgba(56, 189, 248, 0.45)',
    badgeColor: '#38bdf8',
  },
  {
    key: 'government',
    label: 'Органы власти и юстиция (6)',
    shortLabel: '🏛️ Власть и суд (6)',
    icon: '🏛️',
    badgeBg: 'rgba(167, 139, 250, 0.16)',
    badgeBorder: 'rgba(167, 139, 250, 0.45)',
    badgeColor: '#c084fc',
  },
  {
    key: 'civil',
    label: 'Гражданские и спец. законы (9)',
    shortLabel: '📋 Гражданские (9)',
    icon: '📋',
    badgeBg: 'rgba(52, 211, 153, 0.16)',
    badgeBorder: 'rgba(52, 211, 153, 0.45)',
    badgeColor: '#34d399',
  },
];

function getCategoryForLaw(law: LawMetadata): string {
  if (law.category === 'constitution') return 'constitution';
  if (law.category === 'code') return 'code';
  if (law.subCategory === 'security') return 'security';
  if (law.subCategory === 'government') return 'government';
  if (law.subCategory === 'civil') return 'civil';
  return 'civil';
}

function getCategoryStyle(catKey: string): { bg: string; border: string; color: string; icon: string } {
  const c = CATEGORIES.find(cat => cat.key === catKey);
  if (c) {
    return { bg: c.badgeBg, border: c.badgeBorder, color: c.badgeColor, icon: c.icon };
  }
  return {
    bg: 'rgba(236, 199, 129, 0.15)',
    border: 'rgba(236, 199, 129, 0.4)',
    color: '#ecc781',
    icon: '📄',
  };
}

export const LawSelectPicker: React.FC<LawSelectPickerProps> = ({
  value,
  onChange,
  variant = 'full',
  disabled = false,
  placeholder = 'Выберите целевой закон...',
  allowManualEdit = true,
  className = '',
  style,
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const [isManualInput, setIsManualInput] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const searchInputRef = useRef<HTMLInputElement>(null);

  // Find currently matched law from metadata
  const currentLaw = useMemo(() => {
    if (!value || !value.trim()) return null;
    const clean = value.trim().toLowerCase();
    const unquoted = clean.replace(/["'«»“”]/g, '').trim();
    return LAWS_METADATA.find(
      (m) =>
        m.id.toLowerCase() === clean ||
        m.title.toLowerCase() === clean ||
        (m.shortTitle && m.shortTitle.toLowerCase() === clean) ||
        m.code.toLowerCase() === clean ||
        m.title.toLowerCase().includes(unquoted) ||
        unquoted.includes(m.title.toLowerCase())
    ) || null;
  }, [value]);

  const handleOpen = () => {
    if (disabled) return;
    setSearchQuery('');
    setIsOpen(true);
    setTimeout(() => {
      searchInputRef.current?.focus();
    }, 60);
  };

  const handleClose = () => {
    setIsOpen(false);
  };

  // Keyboard shortcut: close on ESC
  useEffect(() => {
    if (!isOpen) return;
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        handleClose();
      }
    };
    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [isOpen]);

  // Filtered laws list
  const filteredLaws = useMemo(() => {
    const query = searchQuery.trim().toLowerCase();
    return LAWS_METADATA.filter((m) => {
      const cat = getCategoryForLaw(m);
      if (selectedCategory !== 'all' && cat !== selectedCategory) {
        return false;
      }
      if (!query) return true;
      return (
        m.title.toLowerCase().includes(query) ||
        (m.shortTitle && m.shortTitle.toLowerCase().includes(query)) ||
        m.code.toLowerCase().includes(query) ||
        m.id.toLowerCase().includes(query)
      );
    });
  }, [searchQuery, selectedCategory]);

  const handleSelectLaw = (law: LawMetadata) => {
    onChange(law.title, law.code, law.id);
    handleClose();
    setIsManualInput(false);
  };

  const handleSelectCustomText = (text: string) => {
    if (!text.trim()) return;
    onChange(text.trim(), '', '');
    handleClose();
    setIsManualInput(false);
  };

  const catStyle = currentLaw ? getCategoryStyle(getCategoryForLaw(currentLaw)) : null;

  // -------------------------------------------------------------
  // DIALOG MODAL CONTENT (Rendered into document.body portal)
  // -------------------------------------------------------------
  const modalContent = isOpen && typeof document !== 'undefined' ? createPortal(
    <div
      role="dialog"
      aria-modal="true"
      style={{
        position: 'fixed',
        inset: 0,
        zIndex: 100000,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '20px',
        backgroundColor: 'rgba(5, 5, 8, 0.78)',
        backdropFilter: 'blur(10px)',
        WebkitBackdropFilter: 'blur(10px)',
        animation: 'rtFadeIn 0.16s ease-out',
      }}
      onClick={(e) => {
        if (e.target === e.currentTarget) handleClose();
      }}
    >
      <div
        style={{
          width: '100%',
          maxWidth: 820,
          maxHeight: '88vh',
          backgroundColor: 'var(--rt-panel, #161618)',
          border: '1px solid var(--rt-line, #2d2d30)',
          borderRadius: 'var(--rt-radius-card, 12px)',
          boxShadow: '0 24px 64px rgba(0, 0, 0, 0.7), 0 0 0 1px rgba(255, 255, 255, 0.05)',
          display: 'flex',
          flexDirection: 'column',
          overflow: 'hidden',
          animation: 'rtZoomIn 0.18s cubic-bezier(0.16, 1, 0.3, 1)',
        }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Modal Header */}
        <div
          style={{
            padding: '18px 22px 14px',
            borderBottom: '1px solid var(--rt-line, #2d2d30)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            background: 'rgba(255, 255, 255, 0.02)',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
            <div
              style={{
                width: 36,
                height: 36,
                borderRadius: 'var(--rt-radius-btn, 8px)',
                background: 'var(--rt-acc-soft, rgba(59, 130, 246, 0.15))',
                border: '1px solid var(--rt-acc-line, rgba(59, 130, 246, 0.35))',
                display: 'grid',
                placeItems: 'center',
                color: 'var(--rt-acc, #3b82f6)',
                flexShrink: 0,
              }}
            >
              <Scale size={18} />
            </div>
            <div>
              <h3
                style={{
                  margin: 0,
                  fontSize: 16,
                  fontWeight: 700,
                  color: 'var(--rt-fg, #ffffff)',
                  letterSpacing: '-0.01em',
                  display: 'flex',
                  alignItems: 'center',
                  gap: 8,
                }}
              >
                <span>Официальный реестр нормативно-правовых актов</span>
                <span
                  style={{
                    fontSize: 11,
                    fontFamily: mono,
                    padding: '2px 7px',
                    borderRadius: 9999,
                    background: 'rgba(255, 255, 255, 0.06)',
                    color: 'var(--rt-fg-2, #9a9aa3)',
                    fontWeight: 600,
                  }}
                >
                  27 законов
                </span>
              </h3>
              <p style={{ margin: '2px 0 0', fontSize: 12, color: 'var(--rt-fg-2, #9a9aa3)' }}>
                Выберите закон штата Сан-Андреас для внесения законодательных изменений
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={handleClose}
            className="btn btn-ghost btn-icon-sm"
            title="Закрыть (Esc)"
            aria-label="Закрыть"
            style={{
              width: 30,
              height: 30,
              borderRadius: 'var(--rt-radius-btn, 8px)',
              color: 'var(--rt-fg-2, #9a9aa3)',
            }}
          >
            <X size={16} />
          </button>
        </div>

        {/* Modal Search Bar */}
        <div
          style={{
            padding: '14px 22px 10px',
            borderBottom: '1px solid var(--rt-line, #2d2d30)',
            background: 'var(--rt-bg, #0f0f10)',
          }}
        >
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: 10,
              height: 42,
              padding: '0 14px',
              backgroundColor: 'var(--rt-elev, #1a1a1c)',
              border: '1px solid var(--rt-line-strong, #3f3f46)',
              borderRadius: 'var(--rt-radius-btn, 8px)',
              transition: 'border-color 0.15s, box-shadow 0.15s',
            }}
          >
            <Search size={16} style={{ color: 'var(--rt-acc, #3b82f6)', flexShrink: 0 }} />
            <input
              ref={searchInputRef}
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Быстрый поиск: введите код (УАК, ДК, FIB, LSPD...) или название закона..."
              style={{
                flex: 1,
                background: 'transparent',
                border: 'none',
                color: 'var(--rt-fg, #ffffff)',
                fontSize: 13.5,
                fontWeight: 500,
                outline: 'none',
              }}
            />
            {searchQuery && (
              <button
                type="button"
                onClick={() => setSearchQuery('')}
                className="btn btn-ghost btn-icon-sm"
                style={{ width: 22, height: 22, color: 'var(--rt-fg-2, #9a9aa3)', padding: 0 }}
                title="Очистить"
              >
                <X size={13} />
              </button>
            )}
            <span
              style={{
                fontSize: 11,
                fontFamily: mono,
                padding: '3px 8px',
                borderRadius: 4,
                background: 'rgba(255, 255, 255, 0.05)',
                color: 'var(--rt-fg-2, #9a9aa3)',
                fontWeight: 600,
              }}
            >
              {filteredLaws.length} из {LAWS_METADATA.length}
            </span>
          </div>

          {/* Wrapping Category Filter Pills (No Cutoff!) */}
          <div
            style={{
              display: 'flex',
              flexWrap: 'wrap',
              gap: 6,
              marginTop: 10,
            }}
          >
            {CATEGORIES.map((cat) => {
              const isActive = selectedCategory === cat.key;
              return (
                <button
                  key={cat.key}
                  type="button"
                  onClick={() => setSelectedCategory(cat.key)}
                  className="btn btn-sm"
                  style={{
                    height: 28,
                    padding: '0 10px',
                    fontSize: 11.5,
                    fontWeight: isActive ? 700 : 500,
                    borderRadius: 'var(--rt-radius-btn, 8px)',
                    border: isActive
                      ? `1px solid ${cat.badgeColor}`
                      : '1px solid var(--rt-line, #2d2d30)',
                    background: isActive ? cat.badgeBg : 'transparent',
                    color: isActive ? cat.badgeColor : 'var(--rt-fg-2, #9a9aa3)',
                    cursor: 'pointer',
                    transition: 'all 0.15s ease',
                  }}
                >
                  <span>{cat.shortLabel}</span>
                </button>
              );
            })}
          </div>
        </div>

        {/* Laws Catalogue: 2-Column Grid of Rich Cards */}
        <div
          style={{
            flex: 1,
            overflowY: 'auto',
            padding: '16px 22px',
            maxHeight: '52vh',
          }}
          className="rt-scroll"
        >
          {filteredLaws.length === 0 ? (
            <div
              style={{
                padding: '40px 20px',
                textAlign: 'center',
                backgroundColor: 'rgba(255, 255, 255, 0.01)',
                borderRadius: 'var(--rt-radius-card, 12px)',
                border: '1px dashed var(--rt-line, #2d2d30)',
              }}
            >
              <Scale size={32} style={{ color: 'var(--rt-fg-2, #9a9aa3)', margin: '0 auto 10px', opacity: 0.5 }} />
              <p style={{ fontSize: 14, fontWeight: 600, color: 'var(--rt-fg, #ffffff)', margin: '0 0 6px 0' }}>
                Закон не найден в каталоге
              </p>
              <p style={{ fontSize: 12, color: 'var(--rt-fg-2, #9a9aa3)', margin: '0 0 16px 0' }}>
                Попробуйте изменить поисковый запрос или введите официальное название закона вручную
              </p>
              {searchQuery.trim() && (
                <button
                  type="button"
                  onClick={() => handleSelectCustomText(searchQuery)}
                  className="btn btn-primary btn-md"
                >
                  <Edit3 size={14} />
                  <span>Использовать введенное: «{searchQuery}»</span>
                </button>
              )}
            </div>
          ) : (
            <div
              style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(auto-fill, minmax(360px, 1fr))',
                gap: 10,
              }}
            >
              {filteredLaws.map((law) => {
                const lawCat = getCategoryForLaw(law);
                const styleObj = getCategoryStyle(lawCat);
                const isSelected = currentLaw?.id === law.id;

                return (
                  <div
                    key={law.id}
                    onClick={() => handleSelectLaw(law)}
                    style={{
                      padding: '12px 14px',
                      borderRadius: 'var(--rt-radius-card, 10px)',
                      background: isSelected 
                        ? 'var(--rt-acc-soft, rgba(59, 130, 246, 0.15))' 
                        : 'var(--rt-elev, #1a1a1c)',
                      border: isSelected
                        ? '1px solid var(--rt-acc, #3b82f6)'
                        : '1px solid var(--rt-line, #2d2d30)',
                      cursor: 'pointer',
                      display: 'flex',
                      flexDirection: 'column',
                      gap: 6,
                      transition: 'all 0.15s ease',
                      position: 'relative',
                    }}
                    onMouseEnter={(e) => {
                      if (!isSelected) {
                        e.currentTarget.style.borderColor = 'var(--rt-line-strong, #3f3f46)';
                        e.currentTarget.style.background = '#222226';
                      }
                    }}
                    onMouseLeave={(e) => {
                      if (!isSelected) {
                        e.currentTarget.style.borderColor = 'var(--rt-line, #2d2d30)';
                        e.currentTarget.style.background = 'var(--rt-elev, #1a1a1c)';
                      }
                    }}
                  >
                    {/* Top Row: Code Badge + Parts Count + Active Check */}
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 8 }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                        <span
                          style={{
                            fontSize: 10.5,
                            fontFamily: mono,
                            fontWeight: 800,
                            letterSpacing: '0.04em',
                            padding: '2px 7px',
                            borderRadius: 'var(--rt-radius-sm, 6px)',
                            background: styleObj.bg,
                            border: `1px solid ${styleObj.border}`,
                            color: styleObj.color,
                            flexShrink: 0,
                          }}
                        >
                          [{law.code}]
                        </span>

                        <span
                          style={{
                            fontSize: 11,
                            color: 'var(--rt-fg-2, #9a9aa3)',
                            display: 'flex',
                            alignItems: 'center',
                            gap: 4,
                          }}
                        >
                          <span>{styleObj.icon}</span>
                          <span>{CATEGORIES.find(c => c.key === lawCat)?.label.replace(/\s\(\d+\)/, '')}</span>
                        </span>
                      </div>

                      <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                        <span
                          style={{
                            fontSize: 10.5,
                            fontFamily: mono,
                            color: 'var(--rt-fg-2, #9a9aa3)',
                            padding: '1px 6px',
                            borderRadius: 4,
                            background: 'rgba(255, 255, 255, 0.04)',
                          }}
                        >
                          {law.parts.length} {law.parts.length === 1 ? 'часть' : law.parts.length < 5 ? 'части' : 'частей'}
                        </span>

                        {isSelected && (
                          <span
                            style={{
                              fontSize: 10.5,
                              fontWeight: 700,
                              color: 'var(--rt-acc, #3b82f6)',
                              display: 'inline-flex',
                              alignItems: 'center',
                              gap: 3,
                            }}
                          >
                            <Check size={12} strokeWidth={3} />
                            <span>Выбран</span>
                          </span>
                        )}
                      </div>
                    </div>

                    {/* Law Title */}
                    <div
                      style={{
                        fontSize: 13.5,
                        fontWeight: isSelected ? 700 : 600,
                        color: isSelected ? '#ffffff' : 'var(--rt-fg, #ffffff)',
                        lineHeight: 1.35,
                      }}
                    >
                      {law.title}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Modal Footer */}
        <div
          style={{
            padding: '12px 22px',
            borderTop: '1px solid var(--rt-line, #2d2d30)',
            background: 'var(--rt-bg, #0f0f10)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            gap: 12,
          }}
        >
          <div style={{ fontSize: 11.5, color: 'var(--rt-fg-2, #9a9aa3)', display: 'flex', alignItems: 'center', gap: 6 }}>
            <span>Нажмите на карточку закона для выбора</span>
            <span>•</span>
            <span style={{ fontFamily: mono }}>Клавиша Esc закрывает каталог</span>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            {allowManualEdit && (
              <button
                type="button"
                onClick={() => {
                  handleClose();
                  setIsManualInput(true);
                }}
                className="btn btn-outline btn-sm"
              >
                <Edit3 size={13} />
                <span>Ввести закон вручную</span>
              </button>
            )}

            <button
              type="button"
              onClick={handleClose}
              className="btn btn-secondary btn-sm"
            >
              <span>Закрыть</span>
            </button>
          </div>
        </div>
      </div>
    </div>,
    document.body
  ) : null;

  // -------------------------------------------------------------
  // COMPACT VARIANT (Used inside article comparison rows §1, §2...)
  // -------------------------------------------------------------
  if (variant === 'compact') {
    return (
      <div className={`select-none ${className}`} style={style}>
        <button
          type="button"
          onClick={handleOpen}
          disabled={disabled}
          title={value ? `Целевой закон: ${value}` : 'Выбрать закон'}
          className="btn btn-secondary btn-sm"
          style={{
            height: 28,
            padding: '0 10px',
            fontSize: 11,
            fontWeight: 600,
            maxWidth: 260,
            overflow: 'hidden',
            textOverflow: 'ellipsis',
            whiteSpace: 'nowrap',
          }}
        >
          {currentLaw ? (
            <>
              <span
                style={{
                  fontSize: 10,
                  fontFamily: mono,
                  fontWeight: 800,
                  padding: '1px 5px',
                  borderRadius: 4,
                  background: catStyle?.bg,
                  color: catStyle?.color,
                }}
              >
                {currentLaw.code}
              </span>
              <span style={{ overflow: 'hidden', textOverflow: 'ellipsis' }}>
                {currentLaw.shortTitle || currentLaw.title}
              </span>
            </>
          ) : (
            <span>{value || placeholder}</span>
          )}
          <ChevronDown size={12} style={{ opacity: 0.6, flexShrink: 0 }} />
        </button>

        {modalContent}
      </div>
    );
  }

  // -------------------------------------------------------------
  // FULL / HEADER VARIANT (Used in main Bill Metadata section)
  // -------------------------------------------------------------
  return (
    <div className={`select-none ${className}`} style={{ width: '100%', ...style }}>
      {/* If manual text input mode is enabled by user */}
      {isManualInput ? (
        <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
          <input
            type="text"
            value={value}
            onChange={(e) => onChange(e.target.value)}
            disabled={disabled}
            placeholder="Введите официальное название законодательного акта..."
            style={{
              flex: 1,
              height: 40,
              padding: '0 14px',
              fontSize: 13.5,
              fontWeight: 600,
              background: 'var(--rt-bg-input, #121214)',
              border: '1px solid var(--rt-line, #2d2d30)',
              color: 'var(--rt-fg, #ffffff)',
              borderRadius: 'var(--rt-radius-btn, 8px)',
              outline: 'none',
            }}
          />
          <button
            type="button"
            onClick={() => {
              setIsManualInput(false);
              handleOpen();
            }}
            className="btn btn-primary btn-md"
            style={{ height: 40 }}
          >
            <BookOpen size={15} />
            <span>Каталог 27 законов</span>
          </button>
        </div>
      ) : (
        /* Unified Elegant Law Card Trigger (Clean, doesn't overlap anything) */
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            gap: 12,
            minHeight: 52,
            padding: '8px 14px',
            backgroundColor: 'var(--rt-bg-input, #121214)',
            border: '1px solid var(--rt-line, #2d2d30)',
            borderRadius: 'var(--rt-radius-card, 10px)',
            transition: 'border-color 0.15s, box-shadow 0.15s',
          }}
        >
          {/* Law info preview clickable area */}
          <div
            onClick={handleOpen}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: 12,
              flex: 1,
              cursor: disabled ? 'default' : 'pointer',
              overflow: 'hidden',
            }}
          >
            {currentLaw ? (
              <>
                <span
                  style={{
                    fontSize: 11,
                    fontFamily: mono,
                    fontWeight: 800,
                    textTransform: 'uppercase',
                    letterSpacing: '0.04em',
                    padding: '3px 8px',
                    borderRadius: 'var(--rt-radius-sm, 6px)',
                    background: catStyle?.bg,
                    border: `1px solid ${catStyle?.border}`,
                    color: catStyle?.color,
                    flexShrink: 0,
                  }}
                >
                  [{currentLaw.code}]
                </span>

                <div style={{ display: 'flex', flexDirection: 'column', overflow: 'hidden', minWidth: 0 }}>
                  <span
                    style={{
                      fontSize: 13.5,
                      fontWeight: 700,
                      color: 'var(--rt-fg, #ffffff)',
                      overflow: 'hidden',
                      textOverflow: 'ellipsis',
                      whiteSpace: 'nowrap',
                    }}
                  >
                    {currentLaw.title}
                  </span>
                  <span style={{ fontSize: 11, color: 'var(--rt-fg-2, #9a9aa3)', display: 'flex', alignItems: 'center', gap: 6 }}>
                    <span>{catStyle?.icon} {CATEGORIES.find(c => c.key === getCategoryForLaw(currentLaw))?.label.replace(/\s\(\d+\)/, '')}</span>
                    <span>•</span>
                    <span style={{ fontFamily: mono }}>{currentLaw.parts.length} {currentLaw.parts.length === 1 ? 'часть' : currentLaw.parts.length < 5 ? 'части' : 'частей'}</span>
                  </span>
                </div>
              </>
            ) : (
              <div style={{ display: 'flex', alignItems: 'center', gap: 10, color: value ? 'var(--rt-fg, #ffffff)' : 'var(--rt-fg-2, #9a9aa3)' }}>
                <Scale size={18} style={{ color: 'var(--rt-acc, #3b82f6)', flexShrink: 0 }} />
                <span style={{ fontSize: 13.5, fontWeight: value ? 600 : 400 }}>
                  {value || placeholder}
                </span>
              </div>
            )}
          </div>

          {/* Action buttons on the right */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexShrink: 0 }}>
            {allowManualEdit && !disabled && (
              <button
                type="button"
                onClick={() => setIsManualInput(true)}
                title="Ввести своё название закона вручную"
                className="btn btn-ghost btn-sm"
                style={{ height: 32 }}
              >
                <Edit3 size={13} />
                <span>Вручную</span>
              </button>
            )}

            <button
              type="button"
              onClick={handleOpen}
              disabled={disabled}
              className="btn btn-subtle btn-sm"
              style={{ height: 32 }}
            >
              <span>{currentLaw ? 'Сменить закон' : '⚡ Выбрать из 27 законов'}</span>
              <ChevronDown size={14} />
            </button>
          </div>
        </div>
      )}

      {modalContent}
    </div>
  );
};
