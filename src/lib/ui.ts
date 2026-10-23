import type { CSSProperties } from 'react';

/**
 * Design tokens and styles.
 */

/** Colors mapped to CSS variables for dynamic theme support */
export const R = {
  bg: 'var(--rt-bg)',
  bgSubtle: 'var(--rt-panel)',
  bgPanel: 'var(--rt-panel)',
  bgElevated: 'var(--rt-elev)',
  bgInput: 'var(--rt-input)',
  border: 'var(--rt-line)',
  borderStrong: 'var(--rt-line-strong)',
  grid: 'var(--rt-grid)',
  text: 'var(--rt-fg)',
  textSecondary: 'var(--rt-fg-2)',
  textMuted: 'var(--rt-mut)',
  accent: 'var(--rt-acc)',
  accentHover: 'var(--rt-acc-hover)',
  accentSubtle: 'var(--rt-acc-soft)',
  accentSoft: 'var(--rt-acc-soft)',
  accentBorder: 'var(--rt-acc-line)',
  onAccent: 'var(--rt-on-acc)',
  accentText: 'var(--rt-acc-text)',
  danger: 'var(--rt-danger)',
  dangerSubtle: 'var(--rt-danger-soft)',
  dangerBorder: 'var(--rt-danger-line)',
  success: 'var(--rt-success)',
  successSubtle: 'var(--rt-success-soft)',
  warning: 'var(--rt-warning)',
  warningSubtle: 'var(--rt-warning-soft)',
  selectionSubtle: 'var(--rt-select-soft)',
} as const;

/** Architectural borders */
export const ft = {
  strong: '2px solid var(--rt-line)',
  hair: '1px solid var(--rt-grid)',
  edge: '1px solid var(--rt-line)',
} as const;

export const shadow = {
  panel: '0 12px 32px rgba(20, 18, 17, .28)',
  dropdown: '0 12px 32px rgba(20, 18, 17, .24)',
} as const;

export const mono = "'JetBrains Mono', ui-monospace, Menlo, monospace";
export const monoFont: CSSProperties = { fontFamily: mono };

/** Small uppercase label with tracking */
export const label: CSSProperties = {
  fontSize: 10,
  letterSpacing: '.14em',
  textTransform: 'uppercase',
  color: 'var(--rt-mut)',
  fontWeight: 700,
};

export const fieldLabel: CSSProperties = {
  ...label,
  display: 'block',
  marginBottom: 6,
  marginTop: 12,
};

export const input: CSSProperties = {
  width: '100%',
  minHeight: 36,
  padding: '8px 10px',
  fontSize: 13,
  border: ft.edge,
  background: R.bgInput,
  color: R.text,
  boxSizing: 'border-box',
  borderRadius: 'var(--rt-radius, 8px)',
};

const buttonBase: CSSProperties = {
  display: 'inline-flex',
  alignItems: 'center',
  justifyContent: 'center',
  gap: 7,
  minHeight: 34,
  padding: '8px 14px',
  fontSize: 13,
  fontWeight: 600,
  lineHeight: 1,
  cursor: 'pointer',
  border: '1px solid transparent',
  borderRadius: 'var(--rt-radius-btn, 8px)',
  transition: 'all 0.16s cubic-bezier(0.16, 1, 0.3, 1)',
  userSelect: 'none',
  whiteSpace: 'nowrap',
  boxSizing: 'border-box',
};

export const btnPrimary: CSSProperties = {
  ...buttonBase,
  background: 'var(--rt-acc, #3b82f6)',
  borderColor: 'var(--rt-acc, #3b82f6)',
  color: '#ffffff',
  fontWeight: 700,
};

export const btnAccent: CSSProperties = btnPrimary;

export const btnSecondary: CSSProperties = {
  ...buttonBase,
  background: 'var(--rt-elev, #1a1a1c)',
  borderColor: 'var(--rt-line, #2d2d30)',
  color: 'var(--rt-fg, #ffffff)',
};

export const btnGhost: CSSProperties = {
  ...buttonBase,
  background: 'transparent',
  borderColor: 'var(--rt-line, #2d2d30)',
  color: 'var(--rt-fg-2, #c9c9d1)',
};

export const btnOutline: CSSProperties = btnGhost;

export const btnSuccess: CSSProperties = {
  ...buttonBase,
  background: 'rgba(16, 185, 129, 0.12)',
  borderColor: 'rgba(16, 185, 129, 0.35)',
  color: '#34d399',
  fontWeight: 700,
};

export const btnApprove: CSSProperties = btnSuccess;

export const btnWarning: CSSProperties = {
  ...buttonBase,
  background: 'rgba(245, 158, 11, 0.12)',
  borderColor: 'rgba(245, 158, 11, 0.35)',
  color: '#fbbf24',
  fontWeight: 700,
};

export const btnRevision: CSSProperties = btnWarning;

export const btnDanger: CSSProperties = {
  ...buttonBase,
  background: 'rgba(239, 68, 68, 0.12)',
  borderColor: 'rgba(239, 68, 68, 0.35)',
  color: '#f87171',
  fontWeight: 700,
};

export const btnReject: CSSProperties = btnDanger;

export const btnDangerSolid: CSSProperties = {
  ...buttonBase,
  background: '#ef4444',
  borderColor: '#ef4444',
  color: '#ffffff',
  fontWeight: 700,
};

export const btnPurple: CSSProperties = {
  ...buttonBase,
  background: 'rgba(168, 85, 247, 0.12)',
  borderColor: 'rgba(168, 85, 247, 0.35)',
  color: '#c084fc',
  fontWeight: 700,
};

export const btnAdmin: CSSProperties = btnPurple;

export const btnSubtle: CSSProperties = {
  ...buttonBase,
  background: 'var(--rt-acc-soft, rgba(59, 130, 246, 0.12))',
  borderColor: 'var(--rt-acc-line, rgba(59, 130, 246, 0.35))',
  color: 'var(--rt-acc-text, #60a5fa)',
  fontWeight: 700,
};

export const btnInfo: CSSProperties = btnSubtle;

/** Deterministic avatar colors generated from string hash */
const AVATAR_COLORS = [
  '#2f6fd0', '#4a7c59', '#7a4a86', '#8a5a2b',
  '#3d6f70', '#9a3b3b', '#615d5d', '#2c5f8a',
];

export function avatarColor(seed: string): string {
  let hash = 0;
  for (let i = 0; i < seed.length; i++) hash = (hash * 31 + seed.charCodeAt(i)) | 0;
  return AVATAR_COLORS[Math.abs(hash) % AVATAR_COLORS.length];
}

export const kbd: CSSProperties = {
  display: 'inline-flex',
  alignItems: 'center',
  justifyContent: 'center',
  minWidth: 19,
  height: 19,
  padding: '0 5px',
  fontSize: 10.5,
  lineHeight: 1,
  border: ft.edge,
  color: R.textMuted,
  background: R.bgSubtle,
  borderRadius: 'var(--rt-radius-sm, 4px)',
  fontFamily: mono,
};

export function chip(active: boolean): CSSProperties {
  return {
    display: 'inline-flex',
    alignItems: 'center',
    gap: 6,
    padding: '6px 12px',
    fontSize: 12,
    fontWeight: active ? 700 : 500,
    cursor: 'pointer',
    border: `1px solid ${active ? R.accent : R.border}`,
    background: active ? R.accentSubtle : 'transparent',
    color: active ? (R.accent) : R.textSecondary,
    whiteSpace: 'nowrap',
    borderRadius: 'var(--rt-radius-sm, 6px)',
    transition: 'all 0.14s ease',
  };
}

export function plural(n: number, one: string, few: string, many: string): string {
  const mod10 = n % 10;
  const mod100 = n % 100;
  if (mod10 === 1 && mod100 !== 11) return one;
  if (mod10 >= 2 && mod10 <= 4 && (mod100 < 10 || mod100 >= 20)) return few;
  return many;
}
