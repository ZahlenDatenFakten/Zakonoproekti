import React, { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ChevronDown, Check } from 'lucide-react';
import { cn } from '../utils/cn';

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
  className
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
      className={cn("relative select-none", className)}
      style={{ width, ...style }}
    >
      {/* Select Trigger Box */}
      <div
        onClick={() => setIsOpen(!isOpen)}
        className={cn(
          "bg-black/60 border rounded-xl px-4 py-3 flex items-center justify-between cursor-pointer text-sm transition-all",
          isOpen 
            ? "border-indigo-500/50 shadow-[0_0_0_2px_rgba(99,102,241,0.2)]" 
            : "border-white/10 hover:border-white/20",
          selectedOption ? "text-white" : "text-zinc-600 font-medium"
        )}
      >
        <span className="flex items-center gap-2 overflow-hidden whitespace-nowrap font-medium">
          {selectedOption?.icon}
          {selectedOption ? selectedOption.label : placeholder}
        </span>
        <ChevronDown 
          size={16} 
          className={cn(
            "text-zinc-500 shrink-0 ml-2 transition-transform duration-200",
            isOpen ? "rotate-180 text-indigo-400" : "rotate-0"
          )} 
        />
      </div>

      {/* Floating Dropdown Menu */}
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            transition={{ duration: 0.15 }}
            className="absolute top-[calc(100%+8px)] left-0 right-0 z-[999999] bg-[#0C0D12] border border-white/10 rounded-xl shadow-2xl overflow-hidden max-h-60 overflow-y-auto custom-scrollbar"
          >
            <div className="p-1">
              {options.map((option) => {
                const isSelected = option.value === value;
                return (
                  <div
                    key={option.value}
                    onClick={() => {
                      onChange(option.value);
                      setIsOpen(false);
                    }}
                    className={cn(
                      "px-3 py-2.5 text-sm flex items-center justify-between cursor-pointer rounded-lg transition-all",
                      isSelected 
                        ? "bg-indigo-500/10 text-indigo-400 font-bold border-l-2 border-indigo-500" 
                        : "text-zinc-300 hover:bg-white/5 hover:text-white border-l-2 border-transparent font-medium"
                    )}
                  >
                    <span className="flex items-center gap-2">
                      {option.icon}
                      {option.label}
                    </span>
                    {isSelected && <Check size={16} className="text-indigo-400" />}
                  </div>
                );
              })}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};
