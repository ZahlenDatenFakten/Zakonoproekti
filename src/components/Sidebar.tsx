import React, { useState, useRef, useEffect } from 'react';
import { 
  LayoutDashboard, 
  Shield, 
  User, 
  Plus, 
  Moon, 
  Sun, 
  ChevronDown, 
  CheckCircle2, 
  Clock,
  BookOpen
} from 'lucide-react';
import type { UserProfile } from '../types/bill';
import { OFFICIAL_ROLE_LABELS } from '../types/bill';
import { isSystemAdmin } from '../services/securityService';
import { useTheme, toggle } from '../lib/theme';
import { R, ft, label, mono } from '../lib/ui';
import { Avatar, Popover, MenuItem, MenuSeparator } from './Primitives';

interface SidebarProps {
  user: UserProfile;
  currentView: 'dashboard' | 'editor' | 'admin_workspace';
  onNavigate: (view: 'dashboard' | 'admin_workspace' | 'editor') => void;
  onOpenSettings: () => void;
  onOpenNewBill: () => void;
  onOpenLawStudio: () => void;
}

export const Sidebar: React.FC<SidebarProps> = ({
  user,
  currentView,
  onNavigate,
  onOpenSettings,
  onOpenNewBill,
  onOpenLawStudio
}) => {
  const isAdmin = isSystemAdmin(user);
  const theme = useTheme();
  const [menuOpen, setMenuOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);
  const fullName = `${user.firstName} ${user.lastName}`.trim() || 'Гражданин SA';
  const roleLabel = OFFICIAL_ROLE_LABELS[user.officialRole] || 'Гражданин';

  useEffect(() => {
    if (!menuOpen) return;
    const handleClickOutside = (e: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        setMenuOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [menuOpen]);

  return (
    <aside
      style={{
        position: 'fixed',
        left: 0,
        top: 0,
        bottom: 0,
        width: 260,
        background: R.bgPanel,
        borderRight: ft.strong,
        display: 'flex',
        flexDirection: 'column',
        zIndex: 40,
        userSelect: 'none',
      }}
    >
      {/* Brand Header with authentic Logo */}
      <button
        onClick={() => onNavigate('dashboard')}
        title="Все документы"
        style={{
          padding: '16px 16px 14px',
          display: 'flex',
          alignItems: 'center',
          gap: 10,
          width: '100%',
          textAlign: 'left',
          background: 'transparent',
          borderBottom: ft.hair,
          cursor: 'pointer',
          borderLeft: 'none',
          borderRight: 'none',
          borderTop: 'none',
          transition: 'background 0.12s ease',
        }}
        onMouseEnter={(e) => (e.currentTarget.style.background = R.bgElevated)}
        onMouseLeave={(e) => (e.currentTarget.style.background = 'transparent')}
      >
        <img
          src="/favicon.png"
          alt="Логотип"
          style={{ width: 30, height: 30, display: 'block', flex: '0 0 30px', objectFit: 'contain' }}
        />
        <span style={{ display: 'flex', flexDirection: 'column', lineHeight: 1.15, minWidth: 0 }}>
          <span style={{ fontWeight: 800, fontSize: 14, letterSpacing: '-.01em', color: R.text }}>
            Законопроекты
          </span>
          <span style={label}>GTA5RP · ЗАКОНОДАТЕЛЬСТВО</span>
        </span>
      </button>

      {/* Main Navigation Section */}
      <div style={{ padding: '14px 12px', display: 'flex', flexDirection: 'column', gap: 6 }}>
        <button
          onClick={() => onNavigate('dashboard')}
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: 10,
            width: '100%',
            height: 34,
            padding: '0 10px',
            fontSize: 13,
            fontWeight: currentView === 'dashboard' ? 700 : 500,
            color: currentView === 'dashboard' ? R.accent : R.text,
            background: currentView === 'dashboard' ? R.accentSubtle : 'transparent',
            border: currentView === 'dashboard' ? `1px solid ${R.accentBorder}` : '1px solid transparent',
            cursor: 'pointer',
            textAlign: 'left',
            borderRadius: 2,
            transition: 'all 0.12s ease',
          }}
          onMouseEnter={(e) => {
            if (currentView !== 'dashboard') e.currentTarget.style.background = R.bgElevated;
          }}
          onMouseLeave={(e) => {
            if (currentView !== 'dashboard') e.currentTarget.style.background = 'transparent';
          }}
        >
          <LayoutDashboard size={16} color={currentView === 'dashboard' ? R.accent : R.textMuted} />
          <span style={{ flex: '1 1 auto' }}>Реестр законопроектов</span>
        </button>

        <button
          onClick={onOpenNewBill}
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: 8,
            width: '100%',
            height: 34,
            padding: '0 12px',
            fontSize: 13,
            fontWeight: 800,
            color: R.onAccent,
            background: R.accent,
            border: 'none',
            cursor: 'pointer',
            borderRadius: 2,
            marginTop: 4,
            transition: 'background 0.12s ease',
          }}
          onMouseEnter={(e) => (e.currentTarget.style.background = R.accentHover)}
          onMouseLeave={(e) => (e.currentTarget.style.background = R.accent)}
        >
          <Plus size={16} strokeWidth={2.5} />
          <span>Внести законопроект</span>
        </button>

        {isAdmin && (
          <button
            onClick={() => onNavigate('admin_workspace')}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: 10,
              width: '100%',
              height: 34,
              padding: '0 10px',
              fontSize: 13,
              fontWeight: currentView === 'admin_workspace' ? 700 : 500,
              color: currentView === 'admin_workspace' ? R.accent : R.text,
              background: currentView === 'admin_workspace' ? R.accentSubtle : 'transparent',
              border: currentView === 'admin_workspace' ? `1px solid ${R.accentBorder}` : '1px solid transparent',
              cursor: 'pointer',
              textAlign: 'left',
              borderRadius: 2,
              marginTop: 4,
              transition: 'all 0.12s ease',
            }}
            onMouseEnter={(e) => {
              if (currentView !== 'admin_workspace') e.currentTarget.style.background = R.bgElevated;
            }}
            onMouseLeave={(e) => {
              if (currentView !== 'admin_workspace') e.currentTarget.style.background = 'transparent';
            }}
          >
            <Shield size={16} color={currentView === 'admin_workspace' ? R.accent : R.textMuted} />
            <span style={{ flex: '1 1 auto' }}>Администрирование</span>
          </button>
        )}

        {/* LAW STUDIO / LEGISLATION DATABASE BUTTON */}
        <button
          onClick={onOpenLawStudio}
          title="Открыть кабинет законодательства (27 кодексов и законов, экспорт BB-кода)"
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: 10,
            width: '100%',
            height: 34,
            padding: '0 10px',
            fontSize: 13,
            fontWeight: 500,
            color: R.text,
            background: 'transparent',
            border: '1px solid transparent',
            cursor: 'pointer',
            textAlign: 'left',
            borderRadius: 2,
            marginTop: 4,
            transition: 'all 0.12s ease',
          }}
          onMouseEnter={(e) => (e.currentTarget.style.background = R.bgElevated)}
          onMouseLeave={(e) => (e.currentTarget.style.background = 'transparent')}
        >
          <BookOpen size={16} color={R.accent} />
          <span style={{ flex: '1 1 auto' }}>База законов</span>
          <span
            style={{
              fontFamily: mono,
              fontSize: 10,
              fontWeight: 700,
              padding: '1px 6px',
              background: 'rgba(236,199,129,0.12)',
              color: R.accent,
              borderRadius: 2,
              border: ft.edge,
            }}
          >
            27
          </span>
        </button>
      </div>

      {/* Information / Sections Area */}
      <div style={{ flex: '1 1 auto', overflowY: 'auto', padding: '12px 14px' }} className="rt-scroll">
        <div style={{ ...label, marginBottom: 10, paddingLeft: 4 }}>Быстрый обзор</div>
        
        <div style={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
          <div
            style={{
              padding: '8px 10px',
              background: R.bg,
              border: ft.hair,
              borderRadius: 2,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              fontSize: 12,
              color: R.textSecondary,
            }}
          >
            <span style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
              <Clock size={13} color={R.warning} />
              На рассмотрении
            </span>
            <span style={{ fontFamily: mono, fontWeight: 700, color: R.text }}>SA GOV</span>
          </div>

          <div
            style={{
              padding: '8px 10px',
              background: R.bg,
              border: ft.hair,
              borderRadius: 2,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              fontSize: 12,
              color: R.textSecondary,
              marginTop: 4,
            }}
          >
            <span style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
              <CheckCircle2 size={13} color={R.success} />
              Вступили в силу
            </span>
            <span style={{ fontFamily: mono, fontWeight: 700, color: R.text }}>РЕЕСТР</span>
          </div>
        </div>

        {/* Database Info Stamp */}
        <div style={{ marginTop: 24, padding: '10px 12px', background: R.bg, border: ft.hair, borderRadius: 2 }}>
          <div style={{ ...label, fontSize: 9, marginBottom: 4 }}>СИСТЕМНЫЙ СТАТУС</div>
          <div style={{ fontSize: 11, color: R.textMuted, lineHeight: 1.4 }}>
            Портал соединен с единым реестром нормативно-правовых актов.
          </div>
        </div>
      </div>

      {/* Footer User Account Area & Popover Menu */}
      <div style={{ position: 'relative', borderTop: ft.hair }} ref={menuRef}>
        <button
          onClick={() => setMenuOpen(!menuOpen)}
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: 10,
            width: '100%',
            padding: '12px 14px',
            background: menuOpen ? R.bgElevated : 'transparent',
            textAlign: 'left',
            cursor: 'pointer',
            border: 'none',
            transition: 'background 0.12s ease',
          }}
          onMouseEnter={(e) => {
            if (!menuOpen) e.currentTarget.style.background = R.bgElevated;
          }}
          onMouseLeave={(e) => {
            if (!menuOpen) e.currentTarget.style.background = 'transparent';
          }}
        >
          <Avatar name={fullName} size={30} />
          
          <div style={{ flex: '1 1 auto', minWidth: 0 }}>
            <div
              style={{
                fontSize: 13,
                fontWeight: 700,
                color: R.text,
                whiteSpace: 'nowrap',
                overflow: 'hidden',
                textOverflow: 'ellipsis',
              }}
            >
              {fullName}
            </div>
            <div
              style={{
                fontSize: 10.5,
                color: R.textMuted,
                whiteSpace: 'nowrap',
                overflow: 'hidden',
                textOverflow: 'ellipsis',
              }}
            >
              {roleLabel}
            </div>
          </div>

          <ChevronDown
            size={14}
            color={R.textMuted}
            style={{
              transition: 'transform 0.2s ease',
              transform: menuOpen ? 'rotate(180deg)' : 'none',
            }}
          />
        </button>

        {/* User Popover Menu */}
        {menuOpen && (
          <Popover
            style={{
              position: 'absolute',
              bottom: 'calc(100% + 4px)',
              left: 8,
              width: 244,
              zIndex: 50,
            }}
          >
            <div style={{ padding: '6px 14px 8px' }}>
              <div style={{ fontSize: 13, fontWeight: 700, color: R.text }}>{fullName}</div>
              <div style={{ fontSize: 11, color: R.textMuted, marginTop: 1 }}>{roleLabel}</div>
            </div>

            <MenuSeparator />

            <MenuItem
              icon={theme === 'dark' ? Moon : Sun}
              label={`Тема: ${theme === 'dark' ? 'тёмная' : 'светлая'}`}
              hint="Ctrl+Shift+L"
              onClick={() => {
                toggle();
              }}
            />

            <MenuItem
              icon={User}
              label="Данные гражданина"
              onClick={() => {
                setMenuOpen(false);
                onOpenSettings();
              }}
            />

            {isAdmin && (
              <>
                <MenuSeparator />
                <MenuItem
                  icon={Shield}
                  label="Матрица доступа"
                  accent={currentView === 'admin_workspace'}
                  onClick={() => {
                    setMenuOpen(false);
                    onNavigate('admin_workspace');
                  }}
                />
              </>
            )}
          </Popover>
        )}
      </div>
    </aside>
  );
};
