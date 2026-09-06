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
  borderRadius: 2,
};

const buttonBase: CSSProperties = {
  display: 'inline-flex',
  alignItems: 'center',
  justifyContent: 'center',
  gap: 6,
  minHeight: 34,
  padding: '8px 14px',
  fontSize: 13,
  fontWeight: 800,
  lineHeight: 1,
  cursor: 'pointer',
  border: '1px solid transparent',
  borderRadius: 2,
  transition: 'background 0.12s, border-color 0.12s, color 0.12s',
};

export const btnPrimary: CSSProperties = {
  ...buttonBase,
  background: R.accent,
  color: R.onAccent,
};

export const btnAccent: CSSProperties = btnPrimary;

export const btnGhost: CSSProperties = {
  ...buttonBase,
  background: 'transparent',
  color: R.text,
  borderColor: R.border,
};

export const btnOutline: CSSProperties = btnGhost;

export const btnDanger: CSSProperties = {
  ...buttonBase,
  background: 'transparent',
  color: R.danger,
  borderColor: R.dangerBorder,
};

export const btnDangerSolid: CSSProperties = {
  ...buttonBase,
  background: R.danger,
  color: '#ffffff',
};

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
  borderRadius: 2,
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
    borderRadius: 2,
    transition: 'all 0.12s ease',
  };
}

export function plural(n: number, one: string, few: string, many: string): string {
  const mod10 = n % 10;
  const mod100 = n % 100;
  if (mod10 === 1 && mod100 !== 11) return one;
  if (mod10 >= 2 && mod10 <= 4 && (mod100 < 10 || mod100 >= 20)) return few;
  return many;
}
