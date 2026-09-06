import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ArrowUp, ArrowDown } from 'lucide-react';
import { R, ft, mono } from '../lib/ui';

interface ScrollControlsProps {
  containerRef?: React.RefObject<HTMLElement | null>;
  containerSelector?: string;
}

export const ScrollControls: React.FC<ScrollControlsProps> = ({
  containerRef,
  containerSelector = '#main-scroll-container'
}) => {
  const [showScroll, setShowScroll] = useState(false);
  const [scrollPercent, setScrollPercent] = useState(0);

  useEffect(() => {
    const getTarget = (): HTMLElement | null => {
      if (containerRef && containerRef.current) return containerRef.current;
      return document.querySelector(containerSelector) as HTMLElement | null;
    };

    const target = getTarget();
    if (!target) return;

    const handleScroll = () => {
      const top = target.scrollTop;
      const height = target.scrollHeight - target.clientHeight;
      const percent = height > 0 ? Math.round((top / height) * 100) : 0;
      setScrollPercent(percent);
      setShowScroll(top > 160);
    };

    target.addEventListener('scroll', handleScroll, { passive: true });
    handleScroll();

    return () => target.removeEventListener('scroll', handleScroll);
  }, [containerRef, containerSelector]);

  const scrollToTop = () => {
    const target = containerRef?.current || (document.querySelector(containerSelector) as HTMLElement | null);
    if (target) {
      target.scrollTo({ top: 0, behavior: 'smooth' });
    }
  };

  const scrollToBottom = () => {
    const target = containerRef?.current || (document.querySelector(containerSelector) as HTMLElement | null);
    if (target) {
      target.scrollTo({ top: target.scrollHeight, behavior: 'smooth' });
    }
  };

  return (
    <AnimatePresence>
      {showScroll && (
        <motion.div
          initial={{ opacity: 0, scale: 0.9, y: 10 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.9, y: 10 }}
          transition={{ duration: 0.15 }}
          style={{
            position: 'fixed',
            bottom: 24,
            right: 28,
            zIndex: 80,
            display: 'flex',
            alignItems: 'center',
            background: R.bgElevated,
            border: ft.strong,
            borderRadius: 2,
            boxShadow: '0 8px 24px rgba(0, 0, 0, 0.45)',
            overflow: 'hidden',
          }}
        >
          {/* Scroll to Top */}
          <button
            type="button"
            onClick={scrollToTop}
            data-tooltip="Прокрутить в начало страницы"
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: 4,
              height: 32,
              padding: '0 10px',
              background: 'transparent',
              border: 'none',
              borderRight: ft.hair,
              color: R.text,
              fontSize: 11,
              fontWeight: 700,
              cursor: 'pointer',
              transition: 'background 0.12s, color 0.12s',
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.background = R.bgInput;
              e.currentTarget.style.color = R.accent;
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.background = 'transparent';
              e.currentTarget.style.color = R.text;
            }}
          >
            <ArrowUp size={13} />
            <span>Вверх</span>
          </button>

          {/* Percentage badge */}
          <div
            style={{
              padding: '0 8px',
              fontSize: 10.5,
              fontFamily: mono,
              fontWeight: 700,
              color: R.textMuted,
              minWidth: 40,
              textAlign: 'center',
              userSelect: 'none',
            }}
          >
            {scrollPercent}%
          </div>

          {/* Scroll to Bottom */}
          <button
            type="button"
            onClick={scrollToBottom}
            data-tooltip="Прокрутить в конец страницы"
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: 4,
              height: 32,
              padding: '0 10px',
              background: 'transparent',
              border: 'none',
              borderLeft: ft.hair,
              color: R.text,
              fontSize: 11,
              fontWeight: 700,
              cursor: 'pointer',
              transition: 'background 0.12s, color 0.12s',
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.background = R.bgInput;
              e.currentTarget.style.color = R.accent;
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.background = 'transparent';
              e.currentTarget.style.color = R.text;
            }}
          >
            <span>Вниз</span>
            <ArrowDown size={13} />
          </button>
        </motion.div>
      )}
    </AnimatePresence>
  );
};
