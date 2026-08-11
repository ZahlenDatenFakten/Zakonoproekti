import React from 'react';
import type { UserProfile, AppTheme } from '../types/bill';
import { OFFICIAL_ROLE_LABELS } from '../types/bill';
import { isOfficialCommitteeMember, isSystemAdmin, isGovernorOrAdmin } from '../services/securityService';
import { 
  Settings,
  Shield,
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
  const isCommitteeOrAdmin = isOfficialCommitteeMember(user) || isSystemAdmin(user);
  const isAdmin = isGovernorOrAdmin(user);

  return (
    <header style={{ 
      background: 'var(--bg-surface)', 
      backdropFilter: 'blur(20px)',
      WebkitBackdropFilter: 'blur(20px)',
      borderBottom: '1px solid var(--border-subtle)',
      position: 'sticky',
      top: 0,
      zIndex: 50,
      boxShadow: 'var(--shadow-sm)'
    }}>
      <div style={{ 
        maxWidth: '1360px', 
        margin: '0 auto', 
        padding: '12px 24px', 
        display: 'flex', 
        alignItems: 'center', 
        justifyContent: 'space-between'
      }}>
        
        {/* BRAND LOGO */}
        <div 
          onClick={() => onNavigate('dashboard')} 
          style={{ display: 'flex', alignItems: 'center', gap: '14px', cursor: 'pointer' }}
        >
          <div style={{ 
            width: '44px', height: '44px', borderRadius: 'var(--radius-md)',
            background: 'var(--primary-gradient)', 
            boxShadow: '0 4px 20px var(--primary-glow)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            transition: 'transform 0.25s ease'
          }}>
            <Shield size={22} color="#ffffff" />
          </div>

          <div>
            <h1 style={{ fontSize: '1.1rem', fontWeight: 800, color: 'var(--text-primary)', letterSpacing: '-0.01em', lineHeight: 1.2 }}>
              ГОСУДАРСТВЕННЫЙ РЕЕСТР
            </h1>
            <p style={{ fontSize: '0.74rem', color: 'var(--text-accent)', lineHeight: 1.2, marginTop: '2px', fontWeight: 600 }}>
              Портал законопроектов Штата San Andreas
            </p>
          </div>
        </div>

        {/* CENTER NAVIGATION PIPES */}
        <nav style={{ 
          display: 'flex', 
          gap: '6px', 
          background: 'var(--bg-input)', 
          padding: '5px', 
          borderRadius: 'var(--radius-pill)', 
          border: '1px solid var(--border-subtle)',
          boxShadow: 'inset 0 1px 3px rgba(0,0,0,0.2)'
        }}>
          <button
            onClick={() => onNavigate('dashboard')}
            className="btn btn-pill"
            style={{
              fontSize: '0.84rem',
              fontWeight: 600,
              padding: '7px 20px',
              border: 'none',
              background: currentView === 'dashboard' ? 'var(--primary-gradient)' : 'transparent',
              color: currentView === 'dashboard' ? '#ffffff' : 'var(--text-secondary)',
              boxShadow: currentView === 'dashboard' ? '0 4px 14px var(--primary-glow)' : 'none'
            }}
          >
            <LayoutDashboard size={15} /> Реестр
          </button>

          {isCommitteeOrAdmin && (
            <button
              onClick={() => onNavigate('admin_workspace')}
              className="btn btn-pill"
              style={{
                fontSize: '0.84rem',
                fontWeight: 600,
                padding: '7px 20px',
                border: 'none',
                background: currentView === 'admin_workspace' ? 'var(--primary-gradient)' : 'transparent',
                color: currentView === 'admin_workspace' ? '#ffffff' : 'var(--text-secondary)',
                boxShadow: currentView === 'admin_workspace' ? '0 4px 14px var(--primary-glow)' : 'none'
              }}
            >
              <ShieldCheck size={15} /> Администрация
            </button>
          )}
        </nav>

        {/* RIGHT: CONTROLS & PROFILE */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
          
          {/* PROFILE BADGE */}
          <div 
            onClick={onOpenSettings}
            style={{ 
              display: 'flex', 
              alignItems: 'center', 
              gap: '10px', 
              padding: '6px 14px', 
              borderRadius: 'var(--radius-pill)', 
              background: 'var(--bg-surface-elevated)', 
              border: '1px solid var(--border-subtle)',
              cursor: 'pointer',
              transition: 'all 0.2s ease'
            }}
          >
            <div style={{
              width: '32px', height: '32px', borderRadius: '50%',
              background: 'var(--primary-gradient)', 
              boxShadow: '0 2px 8px var(--primary-glow)',
              display: 'flex', alignItems: 'center', justifyContent: 'center'
            }}>
              <User size={16} color="#ffffff" />
            </div>
            <div>
              <div style={{ fontSize: '0.84rem', fontWeight: 600, color: 'var(--text-primary)', lineHeight: 1.2 }}>
                {user.firstName} {user.lastName}
              </div>
              <div style={{ fontSize: '0.68rem', color: 'var(--text-muted)', lineHeight: 1.2, fontWeight: 500 }}>
                {OFFICIAL_ROLE_LABELS[user.officialRole] || 'Гражданин'}
              </div>
            </div>
          </div>

          <div style={{ width: '1px', height: '24px', background: 'var(--border-subtle)' }} />

          {/* ACTION BUTTONS */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
            {isAdmin && onOpenDbConfig && (
              <button 
                className="btn btn-ghost" 
                onClick={onOpenDbConfig} 
                style={{ padding: '9px', borderRadius: 'var(--radius-pill)' }} 
                title="Облачная база данных"
              >
                <Database size={18} color="var(--text-accent)" />
              </button>
            )}

            <button 
              onClick={onToggleTheme} 
              className="btn btn-ghost" 
              style={{ padding: '9px', borderRadius: 'var(--radius-pill)' }} 
              title="Тема оформления"
            >
              {theme === 'dark' ? <Moon size={18} color="var(--text-accent)" /> : <Sun size={18} color="var(--primary)" />}
            </button>

            <button 
              className="btn btn-ghost" 
              onClick={onOpenSettings} 
              style={{ padding: '9px', borderRadius: 'var(--radius-pill)' }} 
              title="Настройки профиля"
            >
              <Settings size={18} color="var(--text-secondary)" />
            </button>
          </div>

        </div>
      </div>
    </header>
  );
};
