import React, { useEffect, useState, type CSSProperties, type ComponentType } from 'react';
import { R, avatarColor, ft, kbd, label } from '../lib/ui';

export interface IconProps {
  size?: string | number;
  color?: string;
  style?: CSSProperties;
}

/** Keyboard shortcut badge: Ctrl / K */
export function Kbd({ children }: { children: React.ReactNode }) {
  return <span style={kbd}>{children}</span>;
}

function initials(name: string): string {
  const parts = String(name).trim().split(/\s+/).filter(Boolean);
  if (!parts.length) return '?';
  return ((parts[0][0] ?? '') + (parts.length > 1 ? parts[1][0] ?? '' : '')).toUpperCase();
}

/** Avatar component with deterministic color fallback */
export function Avatar({
  name, src, size = 28, color, title,
}: {
  name: string;
  src?: string | null;
  size?: number;
  color?: string;
  title?: string;
}) {
  const [failed, setFailed] = useState(false);

  useEffect(() => setFailed(false), [src]);

  const showImage = !!src && !failed;

  return (
    <span
      title={title ?? name}
      style={{
        width: size,
        height: size,
        flex: `0 0 ${size}px`,
        display: 'grid',
        placeItems: 'center',
        overflow: 'hidden',
        background: showImage ? 'transparent' : color ?? avatarColor(name),
        color: '#fff',
        fontSize: Math.round(size * 0.38),
        fontWeight: 700,
        lineHeight: 1,
        borderRadius: 2,
      }}
    >
      {showImage ? (
        <img
          src={src!}
          alt=""
          width={size}
          height={size}
          onError={() => setFailed(true)}
          style={{ width: size, height: size, objectFit: 'cover', display: 'block' }}
        />
      ) : (
        initials(name)
      )}
    </span>
  );
}

/** Dropdown menu item */
export function MenuItem({
  icon: Icon, label: text, hint, accent, danger, onClick,
}: {
  icon: ComponentType<IconProps>;
  label: string;
  hint?: string;
  accent?: boolean;
  danger?: boolean;
  onClick: () => void;
}) {
  const color = danger ? R.danger : accent ? R.accent : R.text;

  return (
    <button
      onClick={onClick}
      style={{
        display: 'flex',
        alignItems: 'center',
        gap: 10,
        width: '100%',
        padding: '8px 14px',
        textAlign: 'left',
        fontSize: 13,
        color,
        fontWeight: accent ? 700 : 500,
        background: accent ? R.accentSubtle : 'transparent',
        border: 'none',
        cursor: 'pointer',
        transition: 'background 0.1s',
      }}
      onMouseEnter={(e) => {
        if (!accent) e.currentTarget.style.background = R.bgElevated;
      }}
      onMouseLeave={(e) => {
        if (!accent) e.currentTarget.style.background = 'transparent';
      }}
    >
      <Icon size={14} />
      <span style={{ flex: '1 1 auto' }}>{text}</span>
      {hint && (
        <span style={{ marginLeft: 'auto', fontSize: 11, fontFamily: 'monospace', color: R.textMuted }}>
          {hint}
        </span>
      )}
    </button>
  );
}

export function MenuSeparator() {
  return <div style={{ height: 1, background: R.border, margin: '4px 0' }} />;
}

export function Label({ children, style }: { children: React.ReactNode; style?: CSSProperties }) {
  return <div style={{ ...label, ...style }}>{children}</div>;
}

/** Floating popover panel */
export function Popover({
  children, style,
}: {
  children: React.ReactNode;
  style?: CSSProperties;
}) {
  return (
    <div
      style={{
        background: R.bgPanel,
        border: ft.strong,
        padding: '6px 0',
        fontSize: 13,
        boxShadow: '0 12px 32px rgba(20, 18, 17, 0.28)',
        borderRadius: 2,
        ...style,
      }}
    >
      {children}
    </div>
  );
}
