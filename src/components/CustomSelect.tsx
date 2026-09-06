import React, { useState, useRef, useEffect } from 'react';
import { ChevronDown, Check } from 'lucide-react';
import { R, ft, shadow } from '../lib/ui';

export interface SelectOption {
  value: string;
  label: string;
  icon?: React.ReactNode;
}

interface CustomSelectProps {
  options: SelectOption[];
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  style?: React.CSSProperties;
  width?: string;
  className?: string;
}

export const CustomSelect: React.FC<CustomSelectProps> = ({
  options,
  value,
  onChange,
  placeholder = 'Выберите...',
  style,
  width = '100%',
  className = '',
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  const selectedOption = options.find((opt) => opt.value === value);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  return (
    <div
      ref={containerRef}
      className={`relative select-none ${className}`}
      style={{ width, ...style }}
    >
      {/* Select Trigger Box */}
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        style={{
          width: '100%',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          padding: '9px 12px',
          background: R.bgInput,
          border: isOpen ? `1px solid ${R.accentBorder}` : ft.edge,
          color: selectedOption ? R.text : R.textMuted,
          fontSize: 13,
          cursor: 'pointer',
          outline: 'none',
          boxShadow: isOpen ? `0 0 0 2px ${R.accentSoft}` : 'none',
          transition: 'border-color .15s, box-shadow .15s',
        }}
      >
        <span style={{ display: 'flex', alignItems: 'center', gap: 8, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
          {selectedOption?.icon}
          <span style={{ fontWeight: selectedOption ? 500 : 400 }}>
            {selectedOption ? selectedOption.label : placeholder}
          </span>
        </span>
        <ChevronDown
          size={14}
          style={{
            flexShrink: 0,
            marginLeft: 8,
            color: R.textMuted,
            transform: isOpen ? 'rotate(180deg)' : 'rotate(0deg)',
            transition: 'transform .15s',
          }}
        />
      </button>

      {/* Floating Dropdown Menu */}
      {isOpen && (
        <div
          role="listbox"
          className="rt-scroll"
          style={{
            position: 'absolute',
            top: 'calc(100% + 4px)',
            left: 0,
            right: 0,
            zIndex: 999999,
            background: R.bgPanel,
            border: ft.strong,
            boxShadow: shadow.dropdown,
            maxHeight: 260,
            overflowY: 'auto',
            padding: '4px 0',
            animation: 'rtIn .12s ease',
          }}
        >
          {options.map((option) => {
            const isSelected = option.value === value;
            return (
              <button
                key={option.value}
                type="button"
                onClick={() => {
                  onChange(option.value);
                  setIsOpen(false);
                }}
                style={{
                  width: '100%',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  padding: '8px 12px',
                  fontSize: 13,
                  textAlign: 'left',
                  border: 'none',
                  background: isSelected ? R.accentSoft : 'transparent',
                  color: isSelected ? R.accent : R.text,
                  fontWeight: isSelected ? 600 : 400,
                  cursor: 'pointer',
                  outline: 'none',
                  transition: 'background .1s',
                }}
                onMouseEnter={(e) => {
                  if (!isSelected) e.currentTarget.style.background = R.bgElevated;
                }}
                onMouseLeave={(e) => {
                  if (!isSelected) e.currentTarget.style.background = 'transparent';
                }}
              >
                <span style={{ display: 'flex', alignItems: 'center', gap: 8, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                  {option.icon}
                  <span>{option.label}</span>
                </span>
                {isSelected && <Check size={14} style={{ color: R.accent, flexShrink: 0, marginLeft: 8 }} />}
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
};
