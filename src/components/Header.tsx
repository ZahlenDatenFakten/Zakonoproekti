import React from 'react';
import type { UserProfile, AppTheme } from '../types/bill';
import { OFFICIAL_ROLE_LABELS } from '../types/bill';
import { isOfficialCommitteeMember, isSystemAdmin } from '../services/securityService';
import { 
  Settings,
  Shield,
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
  const isCommitteeOrAdmin = isOfficialCommitteeMember(user) || isSystemAdmin(user);

  return (
    <header style={{ 
      background: 'rgba(18, 21, 30, 0.85)', 
      backdropFilter: 'blur(20px)',
      WebkitBackdropFilter: 'blur(20px)',
      borderBottom: '1px solid var(--border-subtle)',
      position: 'sticky',
      top: 0,
      zIndex: 50,
      boxShadow: '0 4px 20px rgba(0, 0, 0, 0.5)'
    }}>
      <div style={{ 
        maxWidth: '1380px', 
        margin: '0 auto', 
        padding: '12px 24px', 
        display: 'flex', 
        alignItems: 'center', 
        justifyContent: 'space-between',
        flexWrap: 'wrap',
        gap: '14px'
      }}>
        
        {/* BRAND / GOVERNMENT TECH SEAL */}
        <div 
          onClick={() => onNavigate('dashboard')} 
          style={{ display: 'flex', alignItems: 'center', gap: '14px', cursor: 'pointer' }}
        >
          <div style={{ 
            width: '42px', height: '42px', borderRadius: 'var(--radius-md)',
            background: 'linear-gradient(135deg, #0284c7 0%, #0369a1 100%)', 
            boxShadow: '0 0 20px rgba(56, 189, 248, 0.35)',
            border: '1px solid rgba(56, 189, 248, 0.4)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            transition: 'transform 0.25s ease'
          }}>
            <Shield size={20} color="#ffffff" />
          </div>

          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <h1 style={{ fontSize: '1.05rem', fontWeight: 800, color: 'var(--text-primary)', letterSpacing: '0.04em', lineHeight: 1.2 }}>
                ГОСУДАРСТВЕННЫЙ РЕЕСТР
              </h1>
              <span className="decree-stamp" style={{ padding: '2px 6px', fontSize: '0.65rem' }}>
                SA GOV TECH
              </span>
            </div>
            <p style={{ fontSize: '0.72rem', color: 'var(--text-secondary)', lineHeight: 1.2, marginTop: '2px', fontFamily: 'var(--font-mono)' }}>
              Цифровая платформа реформ и законопроектов
            </p>
          </div>
        </div>

        {/* CENTER NAVIGATION PIPES */}
        <nav style={{ 
          display: 'flex', 
          gap: '4px', 
          background: 'var(--bg-input)', 
          padding: '4px', 
          borderRadius: 'var(--radius-pill)', 
          border: '1px solid var(--border-subtle)',
          boxShadow: 'inset 0 1px 3px rgba(0, 0, 0, 0.4)'
        }}>
          <button
            onClick={() => onNavigate('dashboard')}
            className="btn btn-pill"
            style={{
              fontSize: '0.82rem',
              fontWeight: 600,
              padding: '7px 18px',
              border: 'none',
              background: currentView === 'dashboard' ? 'var(--primary-gradient)' : 'transparent',
              color: currentView === 'dashboard' ? '#ffffff' : 'var(--text-secondary)',
              boxShadow: currentView === 'dashboard' ? '0 4px 16px var(--primary-glow)' : 'none'
            }}
          >
            <LayoutDashboard size={14} /> Реестр актов
          </button>

          {isCommitteeOrAdmin && (
            <button
              onClick={() => onNavigate('admin_workspace')}
              className="btn btn-pill"
              style={{
                fontSize: '0.82rem',
                fontWeight: 600,
                padding: '7px 18px',
                border: 'none',
                background: currentView === 'admin_workspace' ? 'var(--primary-gradient)' : 'transparent',
                color: currentView === 'admin_workspace' ? '#ffffff' : 'var(--text-secondary)',
                boxShadow: currentView === 'admin_workspace' ? '0 4px 16px var(--primary-glow)' : 'none'
              }}
            >
              <ShieldCheck size={14} /> Администрация
            </button>
          )}
        </nav>

        {/* RIGHT: CONTROLS, NEW BILL & USER PROFILE */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          
          <button 
            onClick={onOpenNewBill}
            className="btn btn-primary btn-pill"
            style={{ padding: '8px 16px', fontSize: '0.82rem' }}
          >
            <Plus size={15} /> Внести проект
          </button>

          {/* PROFILE BADGE */}
          <div 
            onClick={onOpenSettings}
            style={{ 
              display: 'flex', 
              alignItems: 'center', 
              gap: '10px', 
              padding: '5px 12px 5px 6px', 
              borderRadius: 'var(--radius-pill)', 
              background: 'var(--bg-surface-elevated)', 
              border: '1px solid var(--border-subtle)',
              cursor: 'pointer',
              transition: 'all 0.2s ease'
            }}
          >
            <div style={{
              width: '30px', height: '30px', borderRadius: '50%',
              background: 'var(--primary-gradient)', 
              boxShadow: '0 0 12px var(--primary-glow)',
              display: 'flex', alignItems: 'center', justifyContent: 'center'
            }}>
              <User size={15} color="#ffffff" />
            </div>
            <div>
              <div style={{ fontSize: '0.82rem', fontWeight: 600, color: 'var(--text-primary)', lineHeight: 1.2 }}>
                {user.firstName} {user.lastName}
              </div>
              <div style={{ fontSize: '0.66rem', color: 'var(--text-accent)', lineHeight: 1.2, fontFamily: 'var(--font-mono)', fontWeight: 500 }}>
                {OFFICIAL_ROLE_LABELS[user.officialRole] || 'Гражданин'}
              </div>
            </div>
          </div>

          <div style={{ width: '1px', height: '22px', background: 'var(--border-subtle)' }} />

          {/* SYSTEM TOOL BUTTONS */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
            {isSystemAdmin(user) && onOpenDbConfig && (
              <button 
                className="btn btn-ghost" 
                onClick={onOpenDbConfig} 
                style={{ padding: '8px', borderRadius: 'var(--radius-pill)' }} 
                title="Облачная база данных (Доступно только Админу)"
              >
                <Database size={16} color="var(--text-accent)" />
              </button>
            )}

            <button 
              onClick={onToggleTheme} 
              className="btn btn-ghost" 
              style={{ padding: '8px', borderRadius: 'var(--radius-pill)' }} 
              title="Переключить тему"
            >
              {theme === 'dark' ? <Moon size={16} color="var(--text-accent)" /> : <Sun size={16} color="var(--primary)" />}
            </button>

            <button 
              className="btn btn-ghost" 
              onClick={onOpenSettings} 
              style={{ padding: '8px', borderRadius: 'var(--radius-pill)' }} 
              title="Настройки профиля"
            >
              <Settings size={16} color="var(--text-secondary)" />
            </button>
          </div>

        </div>
      </div>
    </header>
  );
};
