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
  Database,
  Plus
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
  onOpenNewBill,
  onOpenSettings,
  onOpenDbConfig
}) => {
  const isAdmin = isSystemAdmin(user);

  return (
    <header style={{ 
      background: 'var(--bg-glass)', 
      backdropFilter: 'blur(20px)',
      WebkitBackdropFilter: 'blur(20px)',
      borderBottom: '1px solid var(--border-subtle)',
      position: 'sticky',
      top: 0,
      zIndex: 50
    }}>
      <div style={{ 
        maxWidth: '1360px', 
        margin: '0 auto', 
        padding: '10px 24px', 
        display: 'flex', 
        alignItems: 'center', 
        justifyContent: 'space-between',
        flexWrap: 'nowrap',
        gap: '16px'
      }}>
        
        {/* BRAND / STATE SEAL */}
        <div 
          onClick={() => onNavigate('dashboard')} 
          style={{ display: 'flex', alignItems: 'center', gap: '12px', cursor: 'pointer', flexShrink: 0 }}
        >
          <img 
            src="/logo.png" 
            alt="State of San Andreas Seal" 
            style={{ 
              width: '38px', 
              height: '38px', 
              aspectRatio: '1 / 1',
              objectFit: 'contain',
              flexShrink: 0
            }} 
          />

          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <h1 style={{ fontSize: '0.95rem', fontWeight: 800, color: 'var(--text-primary)', letterSpacing: '0.02em', lineHeight: 1.2, margin: 0, whiteSpace: 'nowrap' }}>
                ГОСУДАРСТВЕННЫЙ РЕЕСТР
              </h1>
              <span className="decree-stamp" style={{ padding: '1px 6px', fontSize: '0.62rem' }}>
                SA GOV
              </span>
            </div>
            <p style={{ fontSize: '0.68rem', color: 'var(--text-muted)', lineHeight: 1.2, margin: '2px 0 0 0', fontFamily: 'var(--font-mono)', whiteSpace: 'nowrap' }}>
              LEGISLATURE • STATE OF SAN ANDREAS
            </p>
          </div>
        </div>

        {/* NAVIGATION TABS */}
        <nav style={{ 
          display: 'flex', 
          gap: '2px', 
          background: 'var(--bg-input)', 
          padding: '3px', 
          borderRadius: 'var(--radius-pill)', 
          border: '1px solid var(--border-subtle)',
          flexShrink: 0
        }}>
          <button
            onClick={() => onNavigate('dashboard')}
            className="btn btn-pill"
            style={{
              fontSize: '0.8rem',
              fontWeight: 600,
              padding: '6px 16px',
              border: 'none',
              background: currentView === 'dashboard' ? 'var(--primary-gradient)' : 'transparent',
              color: currentView === 'dashboard' ? '#ffffff' : 'var(--text-secondary)',
              boxShadow: currentView === 'dashboard' ? '0 2px 10px var(--primary-glow)' : 'none'
            }}
          >
            <LayoutDashboard size={14} /> Реестр актов
          </button>

          {isAdmin && (
            <button
              onClick={() => onNavigate('admin_workspace')}
              className="btn btn-pill"
              style={{
                fontSize: '0.8rem',
                fontWeight: 600,
                padding: '6px 16px',
                border: 'none',
                background: currentView === 'admin_workspace' ? 'var(--primary-gradient)' : 'transparent',
                color: currentView === 'admin_workspace' ? '#ffffff' : 'var(--text-secondary)',
                boxShadow: currentView === 'admin_workspace' ? '0 2px 10px var(--primary-glow)' : 'none'
              }}
            >
              <ShieldCheck size={14} /> Администрация
            </button>
          )}
        </nav>

        {/* RIGHT CONTROLS: NEW BILL & USER BADGE */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexShrink: 0 }}>
          
          <button 
            onClick={onOpenNewBill}
            className="btn btn-primary btn-pill"
            style={{ padding: '7px 16px', fontSize: '0.8rem', fontWeight: 600 }}
          >
            <Plus size={14} /> Внести проект
          </button>

          {/* PROFILE BADGE */}
          <div 
            onClick={onOpenSettings}
            style={{ 
              display: 'flex', 
              alignItems: 'center', 
              gap: '8px', 
              padding: '4px 10px 4px 5px', 
              borderRadius: 'var(--radius-pill)', 
              background: 'var(--bg-surface-elevated)', 
              border: '1px solid var(--border-subtle)',
              cursor: 'pointer',
              transition: 'all 0.18s ease',
              maxWidth: '220px'
            }}
            title={`${user.firstName} ${user.lastName} (${OFFICIAL_ROLE_LABELS[user.officialRole] || 'Гражданин'})`}
          >
            <div style={{
              width: '26px', height: '26px', borderRadius: '50%',
              background: 'var(--primary-gradient)', 
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              flexShrink: 0
            }}>
              <User size={13} color="#ffffff" />
            </div>
            <div style={{ overflow: 'hidden' }}>
              <div style={{ fontSize: '0.78rem', fontWeight: 600, color: 'var(--text-primary)', lineHeight: 1.2, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                {user.firstName} {user.lastName}
              </div>
              <div style={{ fontSize: '0.64rem', color: 'var(--text-accent)', lineHeight: 1.2, fontFamily: 'var(--font-mono)', fontWeight: 500, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                {OFFICIAL_ROLE_LABELS[user.officialRole] || 'Гражданин'}
              </div>
            </div>
          </div>

          <div style={{ width: '1px', height: '18px', background: 'var(--border-subtle)', margin: '0 2px' }} />

          {/* SYSTEM ICONS */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '2px' }}>
            {isAdmin && onOpenDbConfig && (
              <button 
                className="btn btn-ghost" 
                onClick={onOpenDbConfig} 
                style={{ padding: '7px', borderRadius: 'var(--radius-pill)' }} 
                title="Облачная база данных (Доступно Администратору)"
              >
                <Database size={15} color="var(--text-accent)" />
              </button>
            )}

            <button 
              onClick={onToggleTheme} 
              className="btn btn-ghost" 
              style={{ padding: '7px', borderRadius: 'var(--radius-pill)' }} 
              title="Переключить тему"
            >
              {theme === 'dark' ? <Moon size={15} color="var(--text-accent)" /> : <Sun size={15} color="var(--primary)" />}
            </button>

            <button 
              className="btn btn-ghost" 
              onClick={onOpenSettings} 
              style={{ padding: '7px', borderRadius: 'var(--radius-pill)' }} 
              title="Настройки профиля"
            >
              <Settings size={15} color="var(--text-secondary)" />
            </button>
          </div>

        </div>
      </div>
    </header>
  );
};
