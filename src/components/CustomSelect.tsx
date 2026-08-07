import React, { useState, useRef, useEffect } from 'react';
import { ChevronDown, Check } from 'lucide-react';

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
}

export const CustomSelect: React.FC<CustomSelectProps> = ({
  options,
  value,
  onChange,
  placeholder = 'Выберите...',
  style,
  width = '100%'
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
      style={{ 
        position: 'relative', 
        width: width, 
        userSelect: 'none',
        ...style 
      }}
    >
      {/* Select Trigger Box */}
      <div
        onClick={() => setIsOpen(!isOpen)}
        style={{
          background: '#0f172a',
          border: '1px solid ' + (isOpen ? 'rgba(99, 102, 241, 0.8)' : 'rgba(255, 255, 255, 0.15)'),
          borderRadius: '8px',
          padding: '9px 14px',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          cursor: 'pointer',
          fontSize: '0.86rem',
          color: selectedOption ? '#f8fafc' : '#94a3b8',
          transition: 'all 0.15s ease',
          boxShadow: isOpen ? '0 0 0 3px rgba(99, 102, 241, 0.2)' : 'none'
        }}
      >
        <span style={{ display: 'flex', alignItems: 'center', gap: '8px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', fontWeight: 500 }}>
          {selectedOption?.icon}
          {selectedOption ? selectedOption.label : placeholder}
        </span>
        <ChevronDown 
          size={16} 
          style={{ 
            color: '#94a3b8', 
            transform: isOpen ? 'rotate(180deg)' : 'rotate(0deg)',
            transition: 'transform 0.2s ease',
            flexShrink: 0,
            marginLeft: '8px'
          }} 
        />
      </div>

      {/* Floating Dropdown Menu (100% Solid Opaque Background) */}
      {isOpen && (
        <div
          style={{
            position: 'absolute',
            top: 'calc(100% + 4px)',
            left: 0,
            right: 0,
            background: '#0f172a', // 100% Solid, Non-Transparent Dark Slate Background
            opacity: 1,
            border: '1px solid rgba(255, 255, 255, 0.18)',
            borderRadius: '10px',
            boxShadow: '0 20px 45px rgba(0, 0, 0, 0.95), 0 0 0 1px rgba(255, 255, 255, 0.05)',
            zIndex: 999999,
            overflow: 'hidden',
            maxHeight: '240px',
            overflowY: 'auto'
          }}
        >
          {options.map((option) => {
            const isSelected = option.value === value;
            return (
              <div
                key={option.value}
                onClick={() => {
                  onChange(option.value);
                  setIsOpen(false);
                }}
                style={{
                  padding: '11px 14px',
                  fontSize: '0.86rem',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  cursor: 'pointer',
                  background: isSelected ? 'rgba(99, 102, 241, 0.25)' : '#0f172a',
                  color: isSelected ? '#ffffff' : '#e2e8f0',
                  borderLeft: isSelected ? '3px solid #6366f1' : '3px solid transparent',
                  fontWeight: isSelected ? 600 : 400,
                  transition: 'all 0.12s ease'
                }}
                onMouseEnter={(e) => {
                  if (!isSelected) {
                    e.currentTarget.style.background = '#1e293b';
                    e.currentTarget.style.color = '#ffffff';
                  }
                }}
                onMouseLeave={(e) => {
                  if (!isSelected) {
                    e.currentTarget.style.background = '#0f172a';
                    e.currentTarget.style.color = '#e2e8f0';
                  }
                }}
              >
                <span style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  {option.icon}
                  {option.label}
                </span>
                {isSelected && <Check size={15} color="#34d399" />}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};
