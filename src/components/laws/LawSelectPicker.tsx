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
import { R, ft, mono } from '../../lib/ui';
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
    label: 'Все законы (27)',
    shortLabel: 'Все',
    icon: '⚡',
    badgeBg: 'rgba(255, 255, 255, 0.08)',
    badgeBorder: 'rgba(255, 255, 255, 0.2)',
    badgeColor: 'var(--rt-fg, #fff)',
  },
  {
    key: 'constitution',
    label: 'Конституция штата',
    shortLabel: '📜 Конституция',
    icon: '📜',
    badgeBg: 'rgba(245, 158, 11, 0.16)',
    badgeBorder: 'rgba(245, 158, 11, 0.45)',
    badgeColor: '#fbbf24',
  },
  {
    key: 'code',
    label: 'Кодексы штата (6)',
    shortLabel: '⚖️ Кодексы',
    icon: '⚖️',
    badgeBg: 'rgba(236, 199, 129, 0.16)',
    badgeBorder: 'rgba(236, 199, 129, 0.45)',
    badgeColor: '#ecc781',
  },
  {
    key: 'security',
    label: 'Силовые ведомства (5)',
    shortLabel: '🛡️ Силовые',
    icon: '🛡️',
    badgeBg: 'rgba(56, 189, 248, 0.16)',
    badgeBorder: 'rgba(56, 189, 248, 0.45)',
    badgeColor: '#38bdf8',
  },
  {
    key: 'government',
    label: 'Органы власти и юстиция (6)',
    shortLabel: '🏛️ Власть и суд',
    icon: '🏛️',
    badgeBg: 'rgba(167, 139, 250, 0.16)',
    badgeBorder: 'rgba(167, 139, 250, 0.45)',
    badgeColor: '#c084fc',
  },
  {
    key: 'civil',
    label: 'Гражданские и спец. законы (11)',
    shortLabel: '📋 Гражданские',
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
  placeholder = 'Выберите закон...',
  allowManualEdit = true,
  className = '',
  style,
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const [isManualInput, setIsManualInput] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [popoverCoords, setPopoverCoords] = useState<{ top: number; left: number; width: number; openUpward: boolean }>({
    top: 0,
    left: 0,
    width: 480,
    openUpward: false,
  });

  const triggerRef = useRef<HTMLDivElement>(null);
  const popoverRef = useRef<HTMLDivElement>(null);
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
        m.title.toLowerCase().replace(/["'«»“”]/g, '').trim() === unquoted ||
        (m.shortTitle && m.shortTitle.toLowerCase().replace(/["'«»“”]/g, '').trim() === unquoted) ||
        clean.includes(m.title.toLowerCase()) ||
        (m.shortTitle && clean.includes(m.shortTitle.toLowerCase())) ||
        unquoted.includes(m.title.toLowerCase().replace(/["'«»“”]/g, '').trim())
    ) || null;
  }, [value]);

  // Recalculate popover position
  const updatePosition = () => {
    if (!triggerRef.current) return;
    const rect = triggerRef.current.getBoundingClientRect();
    const popoverWidth = variant === 'compact' ? 380 : Math.max(rect.width, 540);
    const left = Math.min(Math.max(12, rect.left), window.innerWidth - popoverWidth - 16);
    
    // Check if dropdown fits below or should flip upward
    const popoverHeight = 440;
    const spaceBelow = window.innerHeight - rect.bottom;
    const openUpward = spaceBelow < popoverHeight && rect.top > popoverHeight;
    const top = openUpward ? Math.max(12, rect.top - popoverHeight - 6) : rect.bottom + 6;

    setPopoverCoords({
      top,
      left,
      width: popoverWidth,
      openUpward,
    });
  };

  // Toggle open
  const handleToggle = () => {
    if (disabled) return;
    if (!isOpen) {
      updatePosition();
      setSearchQuery('');
      setIsOpen(true);
      setTimeout(() => {
        searchInputRef.current?.focus();
      }, 50);
    } else {
      setIsOpen(false);
    }
  };

  // Close when clicking outside or pressing Escape
  useEffect(() => {
    if (!isOpen) return;

    const handleMouseDown = (e: MouseEvent) => {
      const target = e.target as Node;
      if (
        popoverRef.current &&
        !popoverRef.current.contains(target) &&
        triggerRef.current &&
        !triggerRef.current.contains(target)
      ) {
        setIsOpen(false);
      }
    };

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        setIsOpen(false);
      }
    };

    const handleScrollOrResize = () => {
      updatePosition();
    };

    document.addEventListener('mousedown', handleMouseDown);
    document.addEventListener('keydown', handleKeyDown);
    window.addEventListener('resize', handleScrollOrResize);
    window.addEventListener('scroll', handleScrollOrResize, true);

    return () => {
      document.removeEventListener('mousedown', handleMouseDown);
      document.removeEventListener('keydown', handleKeyDown);
      window.removeEventListener('resize', handleScrollOrResize);
      window.removeEventListener('scroll', handleScrollOrResize, true);
    };
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

  // Grouped laws by category for crisp layout
  const groupedLaws = useMemo(() => {
    const groups: { category: CategoryInfo; laws: LawMetadata[] }[] = [];
    const relevantCategories = selectedCategory === 'all'
      ? CATEGORIES.filter((c) => c.key !== 'all')
      : CATEGORIES.filter((c) => c.key === selectedCategory);

    for (const cat of relevantCategories) {
      const items = filteredLaws.filter((l) => getCategoryForLaw(l) === cat.key);
      if (items.length > 0) {
        groups.push({ category: cat, laws: items });
      }
    }
    return groups;
  }, [filteredLaws, selectedCategory]);

  const handleSelectLaw = (law: LawMetadata) => {
    onChange(law.title, law.code, law.id);
    setIsOpen(false);
    setIsManualInput(false);
  };

  const handleSelectCustomText = (text: string) => {
    if (!text.trim()) return;
    onChange(text.trim(), '', '');
    setIsOpen(false);
    setIsManualInput(false);
  };

  const catStyle = currentLaw ? getCategoryStyle(getCategoryForLaw(currentLaw)) : null;

  // -------------------------------------------------------------
  // COMPACT VARIANT (Used in comparison cards §1, §2...)
  // -------------------------------------------------------------
  if (variant === 'compact') {
    return (
      <div ref={triggerRef} className={`relative select-none ${className}`} style={style}>
        <button
          type="button"
          onClick={handleToggle}
          disabled={disabled}
          title={value ? `Целевой закон: ${value}` : 'Выбрать закон'}
          style={{
            height: 28,
            padding: '0 8px',
            fontSize: 11,
            fontWeight: 700,
            display: 'inline-flex',
            alignItems: 'center',
            gap: 6,
            background: R.bgInput,
            border: isOpen ? `1px solid ${R.accent}` : `1px solid ${R.accentBorder}`,
            color: R.text,
            borderRadius: 3,
            cursor: disabled ? 'not-allowed' : 'pointer',
            maxWidth: 220,
            whiteSpace: 'nowrap',
            overflow: 'hidden',
            boxShadow: isOpen ? `0 0 0 2px ${R.accentSoft}` : 'none',
            transition: 'all 0.15s ease',
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
                  borderRadius: 2,
                  background: catStyle?.bg,
                  border: `1px solid ${catStyle?.border}`,
                  color: catStyle?.color,
                }}
              >
                {currentLaw.code}
              </span>
              <span style={{ overflow: 'hidden', textOverflow: 'ellipsis', color: R.text }}>
                {currentLaw.shortTitle || currentLaw.title}
              </span>
            </>
          ) : (
            <span style={{ overflow: 'hidden', textOverflow: 'ellipsis', color: value ? R.text : R.textMuted }}>
              {value || placeholder}
            </span>
          )}
          <ChevronDown
            size={12}
            style={{
              color: R.accent,
              flexShrink: 0,
              transform: isOpen ? 'rotate(180deg)' : 'none',
              transition: 'transform 0.15s',
            }}
          />
        </button>

        {/* Floating Dropdown Portal */}
        {isOpen && typeof document !== 'undefined' && createPortal(
          <div
            ref={popoverRef}
            style={{
              position: 'fixed',
              top: popoverCoords.top,
              left: popoverCoords.left,
              width: popoverCoords.width,
              zIndex: 999999,
              background: '#151518',
              border: `1px solid ${R.accentBorder}`,
              borderRadius: 6,
              boxShadow: '0 20px 48px rgba(0, 0, 0, 0.85), 0 0 1px rgba(236, 199, 129, 0.4)',
              backdropFilter: 'blur(16px)',
              overflow: 'hidden',
              animation: 'rtIn 0.12s ease-out',
              display: 'flex',
              flexDirection: 'column',
              maxHeight: 460,
            }}
          >
            {/* Search Header */}
            <div
              style={{
                padding: '8px 10px',
                borderBottom: ft.edge,
                background: 'rgba(255, 255, 255, 0.02)',
                display: 'flex',
                alignItems: 'center',
                gap: 8,
              }}
            >
              <Search size={14} style={{ color: R.accent, flexShrink: 0 }} />
              <input
                ref={searchInputRef}
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Поиск закона по коду или названию..."
                style={{
                  flex: 1,
                  background: 'transparent',
                  border: 'none',
                  color: '#f3f4f6',
                  fontSize: 12,
                  outline: 'none',
                }}
              />
              {searchQuery && (
                <button
                  type="button"
                  onClick={() => setSearchQuery('')}
                  style={{ background: 'transparent', border: 'none', color: R.textMuted, cursor: 'pointer', padding: 2 }}
                >
                  <X size={13} />
                </button>
              )}
            </div>

            {/* Category Quick Filter Pills */}
            <div
              style={{
                display: 'flex',
                gap: 4,
                padding: '6px 8px',
                background: 'rgba(0, 0, 0, 0.25)',
                borderBottom: ft.hair,
                overflowX: 'auto',
              }}
            >
              {CATEGORIES.map((cat) => {
                const isActive = selectedCategory === cat.key;
                return (
                  <button
                    key={cat.key}
                    type="button"
                    onClick={() => setSelectedCategory(cat.key)}
                    style={{
                      padding: '2px 7px',
                      fontSize: 10,
                      fontWeight: 700,
                      borderRadius: 3,
                      border: isActive ? `1px solid ${cat.badgeColor}` : '1px solid rgba(255, 255, 255, 0.08)',
                      background: isActive ? cat.badgeBg : 'transparent',
                      color: isActive ? cat.badgeColor : R.textMuted,
                      cursor: 'pointer',
                      whiteSpace: 'nowrap',
                      transition: 'all 0.1s',
                    }}
                  >
                    {cat.shortLabel}
                  </button>
                );
              })}
            </div>

            {/* Laws List */}
            <div style={{ flex: 1, overflowY: 'auto', padding: '4px 0' }} className="rt-scroll">
              {groupedLaws.length === 0 ? (
                <div style={{ padding: '16px', textAlign: 'center' }}>
                  <p style={{ fontSize: 12, color: R.textMuted, margin: '0 0 8px 0' }}>
                    Закон не найден в каталоге
                  </p>
                  {searchQuery.trim() && (
                    <button
                      type="button"
                      onClick={() => handleSelectCustomText(searchQuery)}
                      style={{
                        padding: '6px 12px',
                        fontSize: 11,
                        fontWeight: 700,
                        background: R.accentSubtle,
                        border: `1px solid ${R.accentBorder}`,
                        color: R.accent,
                        borderRadius: 3,
                        cursor: 'pointer',
                      }}
                    >
                      Использовать: «{searchQuery}»
                    </button>
                  )}
                </div>
              ) : (
                groupedLaws.map(({ category, laws }) => (
                  <div key={category.key} style={{ marginBottom: 14 }}>
                    {/* Category Header with bottom margin */}
                    <div
                      style={{
                        padding: '6px 10px',
                        margin: '0 6px 8px 6px',
                        borderRadius: 4,
                        fontSize: 10.5,
                        fontWeight: 800,
                        textTransform: 'uppercase',
                        letterSpacing: '0.06em',
                        color: category.badgeColor,
                        background: 'rgba(255, 255, 255, 0.035)',
                        border: '1px solid rgba(255, 255, 255, 0.05)',
                        borderLeft: `3px solid ${category.badgeColor}`,
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'space-between',
                      }}
                    >
                      <span style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                        <span>{category.icon}</span>
                        <span>{category.label}</span>
                      </span>
                      <span
                        style={{
                          fontSize: 9.5,
                          fontFamily: mono,
                          fontWeight: 700,
                          padding: '1px 6px',
                          borderRadius: 8,
                          background: 'rgba(255, 255, 255, 0.06)',
                          color: category.badgeColor,
                        }}
                      >
                        {laws.length}
                      </span>
                    </div>

                    {/* Laws inside category with gap and padding */}
                    <div style={{ display: 'flex', flexDirection: 'column', gap: 4, padding: '0 6px' }}>
                      {laws.map((law) => {
                        const isSelected = currentLaw?.id === law.id;
                        const style = getCategoryStyle(category.key);
                        return (
                          <div
                            key={law.id}
                            onClick={() => handleSelectLaw(law)}
                            style={{
                              padding: '7px 10px',
                              borderRadius: 4,
                              display: 'flex',
                              alignItems: 'center',
                              justifyContent: 'space-between',
                              gap: 8,
                              cursor: 'pointer',
                              background: isSelected ? 'rgba(236, 199, 129, 0.12)' : 'rgba(255, 255, 255, 0.015)',
                              border: isSelected ? '1px solid rgba(236, 199, 129, 0.35)' : '1px solid rgba(255, 255, 255, 0.03)',
                              transition: 'all 0.12s ease',
                            }}
                            onMouseEnter={(e) => {
                              if (!isSelected) {
                                e.currentTarget.style.background = 'rgba(255, 255, 255, 0.05)';
                                e.currentTarget.style.borderColor = 'rgba(236, 199, 129, 0.25)';
                                e.currentTarget.style.transform = 'translateX(2px)';
                              }
                            }}
                            onMouseLeave={(e) => {
                              if (!isSelected) {
                                e.currentTarget.style.background = 'rgba(255, 255, 255, 0.015)';
                                e.currentTarget.style.borderColor = 'rgba(255, 255, 255, 0.03)';
                                e.currentTarget.style.transform = 'none';
                              }
                            }}
                          >
                            <div style={{ display: 'flex', alignItems: 'center', gap: 7, overflow: 'hidden' }}>
                              <span
                                style={{
                                  fontSize: 10,
                                  fontFamily: mono,
                                  fontWeight: 800,
                                  textTransform: 'uppercase',
                                  letterSpacing: '0.04em',
                                  padding: '1px 5px',
                                  borderRadius: 2,
                                  background: style.bg,
                                  border: `1px solid ${style.border}`,
                                  color: style.color,
                                  flexShrink: 0,
                                }}
                              >
                                {law.code}
                              </span>
                              <span
                                style={{
                                  fontSize: 12,
                                  fontWeight: isSelected ? 700 : 500,
                                  color: isSelected ? '#ffffff' : '#e5e7eb',
                                  overflow: 'hidden',
                                  textOverflow: 'ellipsis',
                                  whiteSpace: 'nowrap',
                                }}
                              >
                                {law.shortTitle || law.title}
                              </span>
                            </div>
                            {isSelected && <Check size={14} style={{ color: R.accent, flexShrink: 0 }} />}
                          </div>
                        );
                      })}
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>,
          document.body
        )}
      </div>
    );
  }

  // -------------------------------------------------------------
  // FULL / HEADER VARIANT (Used in main Bill Metadata section)
  // -------------------------------------------------------------
  return (
    <div ref={triggerRef} className={`select-none ${className}`} style={{ width: '100%', ...style }}>
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
              padding: '0 12px',
              fontSize: 13.5,
              fontWeight: 600,
              background: R.bgInput,
              border: ft.edge,
              color: R.text,
              borderRadius: 3,
              outline: 'none',
            }}
          />
          <button
            type="button"
            onClick={() => {
              setIsManualInput(false);
              handleToggle();
            }}
            style={{
              height: 40,
              padding: '0 14px',
              fontSize: 12,
              fontWeight: 700,
              background: R.accentSubtle,
              border: `1px solid ${R.accentBorder}`,
              color: R.accent,
              borderRadius: 3,
              cursor: 'pointer',
              display: 'inline-flex',
              alignItems: 'center',
              gap: 6,
              whiteSpace: 'nowrap',
            }}
          >
            <BookOpen size={14} />
            <span>Каталог 27 законов</span>
          </button>
        </div>
      ) : (
        /* Unified Elegant Law Card Trigger */
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            gap: 12,
            minHeight: 46,
            padding: '6px 12px',
            background: R.bgInput,
            border: isOpen ? `1px solid ${R.accent}` : ft.edge,
            borderRadius: 4,
            boxShadow: isOpen ? `0 0 0 2px ${R.accentSoft}` : 'none',
            transition: 'border-color 0.15s, box-shadow 0.15s',
          }}
        >
          {/* Law info preview */}
          <div
            onClick={handleToggle}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: 10,
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
                    borderRadius: 3,
                    background: catStyle?.bg,
                    border: `1px solid ${catStyle?.border}`,
                    color: catStyle?.color,
                    flexShrink: 0,
                    boxShadow: '0 2px 6px rgba(0,0,0,0.2)',
                  }}
                >
                  [{currentLaw.code}]
                </span>

                <div style={{ display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
                  <span
                    style={{
                      fontSize: 13.5,
                      fontWeight: 700,
                      color: '#ffffff',
                      overflow: 'hidden',
                      textOverflow: 'ellipsis',
                      whiteSpace: 'nowrap',
                    }}
                  >
                    {currentLaw.title}
                  </span>
                  <span style={{ fontSize: 11, color: R.textMuted, display: 'flex', alignItems: 'center', gap: 6 }}>
                    <span>{catStyle?.icon} {CATEGORIES.find(c => c.key === getCategoryForLaw(currentLaw))?.label}</span>
                    <span>•</span>
                    <span style={{ fontFamily: mono }}>{currentLaw.parts.length} {currentLaw.parts.length === 1 ? 'часть' : currentLaw.parts.length < 5 ? 'части' : 'частей'}</span>
                  </span>
                </div>
              </>
            ) : (
              <div style={{ display: 'flex', alignItems: 'center', gap: 8, color: value ? R.text : R.textMuted }}>
                <Scale size={16} style={{ color: R.accent }} />
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
                style={{
                  height: 30,
                  padding: '0 8px',
                  fontSize: 11,
                  fontWeight: 600,
                  background: 'transparent',
                  border: `1px solid rgba(255, 255, 255, 0.12)`,
                  color: R.textMuted,
                  borderRadius: 3,
                  cursor: 'pointer',
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: 4,
                  transition: 'all 0.15s',
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.color = R.text;
                  e.currentTarget.style.borderColor = R.textMuted;
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.color = R.textMuted;
                  e.currentTarget.style.borderColor = 'rgba(255, 255, 255, 0.12)';
                }}
              >
                <Edit3 size={12} />
                <span>Вручную</span>
              </button>
            )}

            <button
              type="button"
              onClick={handleToggle}
              disabled={disabled}
              style={{
                height: 32,
                padding: '0 12px',
                fontSize: 12,
                fontWeight: 700,
                background: isOpen ? R.accent : R.accentSubtle,
                border: `1px solid ${R.accentBorder}`,
                color: isOpen ? '#ffffff' : R.accent,
                borderRadius: 3,
                cursor: disabled ? 'not-allowed' : 'pointer',
                display: 'inline-flex',
                alignItems: 'center',
                gap: 6,
                transition: 'all 0.15s',
              }}
            >
              <span>{currentLaw ? 'Сменить закон' : '⚡ Выбрать из 27 законов'}</span>
              <ChevronDown
                size={14}
                style={{
                  transform: isOpen ? 'rotate(180deg)' : 'none',
                  transition: 'transform 0.15s',
                }}
              />
            </button>
          </div>
        </div>
      )}

      {/* Floating Popover Portal */}
      {isOpen && typeof document !== 'undefined' && createPortal(
        <div
          ref={popoverRef}
          style={{
            position: 'fixed',
            top: popoverCoords.top,
            left: popoverCoords.left,
            width: popoverCoords.width,
            zIndex: 999999,
            background: '#151518',
            border: `1px solid ${R.accentBorder}`,
            borderRadius: 8,
            boxShadow: '0 24px 60px rgba(0, 0, 0, 0.9), 0 0 1px rgba(236, 199, 129, 0.5)',
            backdropFilter: 'blur(20px)',
            overflow: 'hidden',
            animation: 'rtIn 0.12s ease-out',
            display: 'flex',
            flexDirection: 'column',
            maxHeight: 500,
          }}
        >
          {/* Top Search Input with Badge */}
          <div
            style={{
              padding: '12px 16px',
              borderBottom: ft.edge,
              background: 'rgba(255, 255, 255, 0.02)',
              display: 'flex',
              alignItems: 'center',
              gap: 10,
            }}
          >
            <Search size={18} style={{ color: R.accent, flexShrink: 0 }} />
            <input
              ref={searchInputRef}
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Быстрый поиск: введите код (УАК, ДК, FIB...) или название закона..."
              style={{
                flex: 1,
                background: 'transparent',
                border: 'none',
                color: '#ffffff',
                fontSize: 13.5,
                fontWeight: 600,
                outline: 'none',
              }}
            />
            {searchQuery && (
              <button
                type="button"
                onClick={() => setSearchQuery('')}
                style={{ background: 'transparent', border: 'none', color: R.textMuted, cursor: 'pointer', padding: 2 }}
              >
                <X size={15} />
              </button>
            )}
            <span
              style={{
                fontSize: 10.5,
                fontFamily: mono,
                padding: '3px 10px',
                borderRadius: 12,
                background: 'rgba(255, 255, 255, 0.06)',
                color: R.textMuted,
              }}
            >
              {filteredLaws.length} из {LAWS_METADATA.length}
            </span>
          </div>

          {/* Category Filter Pills */}
          <div
            style={{
              display: 'flex',
              gap: 6,
              padding: '10px 14px',
              background: 'rgba(0, 0, 0, 0.4)',
              borderBottom: ft.hair,
              overflowX: 'auto',
            }}
            className="rt-scroll"
          >
            {CATEGORIES.map((cat) => {
              const isActive = selectedCategory === cat.key;
              const count = cat.key === 'all'
                ? LAWS_METADATA.length
                : LAWS_METADATA.filter(l => getCategoryForLaw(l) === cat.key).length;

              return (
                <button
                  key={cat.key}
                  type="button"
                  onClick={() => setSelectedCategory(cat.key)}
                  style={{
                    padding: '5px 12px',
                    fontSize: 11,
                    fontWeight: 700,
                    borderRadius: 20,
                    border: isActive ? `1px solid ${cat.badgeColor}` : '1px solid rgba(255, 255, 255, 0.08)',
                    background: isActive ? cat.badgeBg : 'rgba(255, 255, 255, 0.02)',
                    color: isActive ? cat.badgeColor : R.textMuted,
                    cursor: 'pointer',
                    whiteSpace: 'nowrap',
                    display: 'flex',
                    alignItems: 'center',
                    gap: 6,
                    boxShadow: isActive ? `0 0 12px ${cat.badgeBg}` : 'none',
                    transition: 'all 0.15s ease',
                  }}
                >
                  <span>{cat.icon}</span>
                  <span>{cat.shortLabel}</span>
                  <span style={{ opacity: 0.75, fontSize: 10, fontFamily: mono }}>({count})</span>
                </button>
              );
            })}
          </div>

          {/* Laws List */}
          <div style={{ flex: 1, overflowY: 'auto', padding: '10px 0' }} className="rt-scroll">
            {groupedLaws.length === 0 ? (
              <div style={{ padding: '24px 16px', textAlign: 'center' }}>
                <p style={{ fontSize: 13, color: R.textMuted, margin: '0 0 12px 0' }}>
                  Ничего не найдено по запросу «{searchQuery}»
                </p>
                {searchQuery.trim() && (
                  <button
                    type="button"
                    onClick={() => handleSelectCustomText(searchQuery)}
                    style={{
                      padding: '8px 16px',
                      fontSize: 12,
                      fontWeight: 700,
                      background: R.accentSubtle,
                      border: `1px solid ${R.accentBorder}`,
                      color: R.accent,
                      borderRadius: 4,
                      cursor: 'pointer',
                      display: 'inline-flex',
                      alignItems: 'center',
                      gap: 6,
                    }}
                  >
                    <Edit3 size={14} />
                    <span>Использовать «{searchQuery}» как название закона</span>
                  </button>
                )}
              </div>
            ) : (
              groupedLaws.map(({ category, laws }) => (
                <div key={category.key} style={{ marginBottom: 18 }}>
                  {/* Category Header with generous bottom margin */}
                  <div
                    style={{
                      padding: '8px 14px',
                      margin: '0 10px 10px 10px',
                      borderRadius: 6,
                      fontSize: 11,
                      fontWeight: 800,
                      textTransform: 'uppercase',
                      letterSpacing: '0.07em',
                      color: category.badgeColor,
                      background: 'rgba(255, 255, 255, 0.035)',
                      border: '1px solid rgba(255, 255, 255, 0.06)',
                      borderLeft: `3px solid ${category.badgeColor}`,
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                      boxShadow: '0 2px 8px rgba(0, 0, 0, 0.15)',
                    }}
                  >
                    <span style={{ display: 'flex', alignItems: 'center', gap: 7 }}>
                      <span>{category.icon}</span>
                      <span>{category.label}</span>
                    </span>
                    <span
                      style={{
                        fontSize: 10.5,
                        fontFamily: mono,
                        fontWeight: 700,
                        padding: '2px 8px',
                        borderRadius: 10,
                        background: 'rgba(255, 255, 255, 0.06)',
                        color: category.badgeColor,
                      }}
                    >
                      {laws.length}
                    </span>
                  </div>

                  {/* Laws Cards Container with clear gap and breathing room */}
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 5, padding: '0 10px' }}>
                    {laws.map((law) => {
                      const isSelected = currentLaw?.id === law.id;
                      const style = getCategoryStyle(category.key);
                      return (
                        <div
                          key={law.id}
                          onClick={() => handleSelectLaw(law)}
                          style={{
                            padding: '10px 14px',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'space-between',
                            gap: 12,
                            cursor: 'pointer',
                            borderRadius: 6,
                            background: isSelected ? 'rgba(236, 199, 129, 0.12)' : 'rgba(255, 255, 255, 0.015)',
                            border: isSelected ? '1px solid rgba(236, 199, 129, 0.38)' : '1px solid rgba(255, 255, 255, 0.035)',
                            transition: 'all 0.15s cubic-bezier(0.16, 1, 0.3, 1)',
                          }}
                          onMouseEnter={(e) => {
                            if (!isSelected) {
                              e.currentTarget.style.background = 'rgba(255, 255, 255, 0.05)';
                              e.currentTarget.style.borderColor = 'rgba(236, 199, 129, 0.28)';
                              e.currentTarget.style.transform = 'translateX(3px)';
                            }
                          }}
                          onMouseLeave={(e) => {
                            if (!isSelected) {
                              e.currentTarget.style.background = 'rgba(255, 255, 255, 0.015)';
                              e.currentTarget.style.borderColor = 'rgba(255, 255, 255, 0.035)';
                              e.currentTarget.style.transform = 'none';
                            }
                          }}
                        >
                          <div style={{ display: 'flex', alignItems: 'center', gap: 10, flex: 1, overflow: 'hidden' }}>
                            <span
                              style={{
                                fontSize: 11,
                                fontFamily: mono,
                                fontWeight: 800,
                                textTransform: 'uppercase',
                                letterSpacing: '0.04em',
                                padding: '2px 7px',
                                borderRadius: 3,
                                background: style.bg,
                                border: `1px solid ${style.border}`,
                                color: style.color,
                                flexShrink: 0,
                              }}
                            >
                              [{law.code}]
                            </span>

                            <div style={{ display: 'flex', flexDirection: 'column', overflow: 'hidden', gap: 2 }}>
                              <span
                                style={{
                                  fontSize: 13.5,
                                  fontWeight: 700,
                                  color: isSelected ? '#ffffff' : '#f3f4f6',
                                  overflow: 'hidden',
                                  textOverflow: 'ellipsis',
                                  whiteSpace: 'nowrap',
                                }}
                              >
                                {law.shortTitle || law.title}
                              </span>
                              <span
                                style={{
                                  fontSize: 11,
                                  color: R.textMuted,
                                  overflow: 'hidden',
                                  textOverflow: 'ellipsis',
                                  whiteSpace: 'nowrap',
                                }}
                              >
                                {law.title} • {law.parts.length} {law.parts.length === 1 ? 'часть' : 'части'}
                              </span>
                            </div>
                          </div>

                          {isSelected && (
                            <div
                              style={{
                                display: 'flex',
                                alignItems: 'center',
                                gap: 6,
                                color: R.accent,
                                fontSize: 11,
                                fontWeight: 700,
                                flexShrink: 0,
                                background: 'rgba(236, 199, 129, 0.1)',
                                padding: '3px 8px',
                                borderRadius: 4,
                              }}
                            >
                              <span>Выбран</span>
                              <Check size={14} />
                            </div>
                          )}
                        </div>
                      );
                    })}
                  </div>
                </div>
              ))
            )}
          </div>
        </div>,
        document.body
      )}
    </div>
  );
};
