import React from 'react';
import type { UserProfile, AppTheme } from '../types/bill';
import { OFFICIAL_ROLE_LABELS } from '../types/bill';
import { isSystemAdmin } from '../services/securityService';
import { 
  Settings,
  User,
  LayoutDashboard,
  ShieldCheck,
  Moon,
  Sun,
  Database
} from 'lucide-react';

interface HeaderProps {
  user: UserProfile;
  theme: AppTheme;
  currentView: 'dashboard' | 'editor' | 'admin_workspace';
  onNavigate: (view: 'dashboard' | 'admin_workspace' | 'editor') => void;
  onToggleTheme: () => void;
  onOpenNewBill: () => void;
  onOpenSettings: () => void;
  onOpenDbConfig?: () => void;
}

export const Header: React.FC<HeaderProps> = ({
  user,
  theme,
  currentView,
  onNavigate,
  onToggleTheme,
  onOpenSettings,
  onOpenDbConfig
}) => {
  const isAdmin = isSystemAdmin(user);

  return (
    <header style={{ 
      background: 'var(--bg-glass)', 
      backdropFilter: 'blur(16px)',
      WebkitBackdropFilter: 'blur(16px)',
      borderBottom: '1px solid var(--border-subtle)',
      position: 'sticky',
      top: 0,
      zIndex: 50
    }}>
      <div style={{ 
        maxWidth: '1240px', 
        margin: '0 auto', 
        padding: '8px 20px', 
        display: 'flex', 
        alignItems: 'center', 
        justifyContent: 'space-between',
        flexWrap: 'nowrap',
        gap: '12px'
      }}>
        
        {/* BRAND */}
        <div 
          onClick={() => onNavigate('dashboard')} 
          style={{ display: 'flex', alignItems: 'center', gap: '10px', cursor: 'pointer', flexShrink: 0 }}
        >
          <img 
            src="/logo.png" 
            alt="State Seal" 
            style={{ 
              width: '32px', 
              height: '32px', 
              aspectRatio: '1 / 1',
              objectFit: 'contain',
              flexShrink: 0
            }} 
          />

          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
              <h1 style={{ fontSize: '0.88rem', fontWeight: 700, color: 'var(--text-primary)', letterSpacing: '0.02em', lineHeight: 1.2, margin: 0, whiteSpace: 'nowrap' }}>
                ГОСУДАРСТВЕННЫЙ РЕЕСТР
              </h1>
              <span className="decree-stamp" style={{ padding: '1px 5px', fontSize: '0.6rem' }}>
                SA GOV
              </span>
            </div>
            <p style={{ fontSize: '0.64rem', color: 'var(--text-muted)', lineHeight: 1.2, margin: '1px 0 0 0', fontFamily: 'var(--font-mono)', whiteSpace: 'nowrap' }}>
              LEGISLATURE • STATE OF SAN ANDREAS
            </p>
          </div>
        </div>

        {/* NAVIGATION TABS */}
        <nav style={{ 
          display: 'flex', 
          gap: '2px', 
          background: 'var(--bg-input)', 
          padding: '2px', 
          borderRadius: 'var(--radius-pill)', 
          border: '1px solid var(--border-subtle)',
          flexShrink: 0
        }}>
          <button
            onClick={() => onNavigate('dashboard')}
            className="btn btn-pill"
            style={{
              fontSize: '0.78rem',
              fontWeight: 500,
              padding: '5px 14px',
              border: 'none',
              background: currentView === 'dashboard' ? 'var(--bg-surface-active)' : 'transparent',
              color: currentView === 'dashboard' ? 'var(--text-primary)' : 'var(--text-muted)'
            }}
          >
            <LayoutDashboard size={13} /> Реестр актов
          </button>

          {isAdmin && (
            <button
              onClick={() => onNavigate('admin_workspace')}
              className="btn btn-pill"
              style={{
                fontSize: '0.78rem',
                fontWeight: 500,
                padding: '5px 14px',
                border: 'none',
                background: currentView === 'admin_workspace' ? 'var(--bg-surface-active)' : 'transparent',
                color: currentView === 'admin_workspace' ? 'var(--text-primary)' : 'var(--text-muted)'
              }}
            >
              <ShieldCheck size={13} /> Администрация
            </button>
          )}
        </nav>

        {/* RIGHT CONTROLS: USER & TOOLS */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '6px', flexShrink: 0 }}>
          
          {/* PROFILE BADGE */}
          <div 
            onClick={onOpenSettings}
            style={{ 
              display: 'flex', 
              alignItems: 'center', 
              gap: '6px', 
              padding: '3px 8px 3px 4px', 
              borderRadius: 'var(--radius-pill)', 
              background: 'var(--bg-surface-elevated)', 
              border: '1px solid var(--border-subtle)',
              cursor: 'pointer',
              maxWidth: '200px'
            }}
            title={`${user.firstName} ${user.lastName} (${OFFICIAL_ROLE_LABELS[user.officialRole] || 'Гражданин'})`}
          >
            <div style={{
              width: '24px', height: '24px', borderRadius: '50%',
              background: 'var(--bg-surface-active)', 
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              flexShrink: 0
            }}>
              <User size={12} color="var(--text-accent)" />
            </div>
            <div style={{ overflow: 'hidden' }}>
              <div style={{ fontSize: '0.75rem', fontWeight: 600, color: 'var(--text-primary)', lineHeight: 1.2, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                {user.firstName} {user.lastName}
              </div>
              <div style={{ fontSize: '0.62rem', color: 'var(--text-muted)', lineHeight: 1.1, fontFamily: 'var(--font-mono)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                {OFFICIAL_ROLE_LABELS[user.officialRole] || 'Гражданин'}
              </div>
            </div>
          </div>

          {/* SYSTEM ICONS */}
          {isAdmin && onOpenDbConfig && (
            <button 
              className="btn btn-ghost btn-icon" 
              onClick={onOpenDbConfig} 
              style={{ width: '30px', height: '30px' }} 
              title="База данных"
            >
              <Database size={14} color="var(--text-muted)" />
            </button>
          )}

          <button 
            onClick={onToggleTheme} 
            className="btn btn-ghost btn-icon" 
            style={{ width: '30px', height: '30px' }} 
            title="Тема"
          >
            {theme === 'dark' ? <Moon size={14} color="var(--text-muted)" /> : <Sun size={14} color="var(--text-muted)" />}
          </button>

          <button 
            className="btn btn-ghost btn-icon" 
            onClick={onOpenSettings} 
            style={{ width: '30px', height: '30px' }} 
            title="Настройки профиля"
          >
            <Settings size={14} color="var(--text-muted)" />
          </button>

        </div>
      </div>
    </header>
  );
};
