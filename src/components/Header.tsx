import React from 'react';
import type { UserProfile, AppTheme } from '../types/bill';
import { OFFICIAL_ROLE_LABELS } from '../types/bill';
import { isOfficialCommitteeMember, isSystemAdmin } from '../services/securityService';
import { 
  Settings,
  Shield,
  HelpCircle,
  User,
  LayoutDashboard,
  ShieldCheck,
  Moon,
  Sun
} from 'lucide-react';

interface HeaderProps {
  user: UserProfile;
  theme: AppTheme;
  currentView: 'dashboard' | 'editor' | 'admin_workspace';
  onNavigate: (view: 'dashboard' | 'admin_workspace') => void;
  onToggleTheme: () => void;
  onOpenNewBill: () => void;
  onOpenSettings: () => void;
  onOpenAbout: () => void;
}

export const Header: React.FC<HeaderProps> = ({
  user,
  theme,
  currentView,
  onNavigate,
  onToggleTheme,
  onOpenSettings,
  onOpenAbout
}) => {
  const isCommitteeOrAdmin = isOfficialCommitteeMember(user) || isSystemAdmin(user);

  return (
    <header style={{ 
      background: 'rgba(12, 16, 23, 0.85)', 
      backdropFilter: 'blur(16px)',
      borderBottom: '1px solid var(--border-subtle)',
      position: 'sticky',
      top: 0,
      zIndex: 50
    }}>
      <div style={{ 
        maxWidth: '1440px', 
        margin: '0 auto', 
        padding: '14px 28px', 
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
            width: '42px', height: '42px', borderRadius: '12px',
            background: 'linear-gradient(135deg, rgba(37, 99, 235, 0.2) 0%, rgba(29, 78, 216, 0.4) 100%)', 
            border: '1px solid var(--border-medium)',
            boxShadow: '0 0 16px var(--primary-glow)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            transition: 'transform 0.25s ease'
          }}>
            <Shield size={22} color="#60a5fa" />
          </div>

          <div>
            <h1 style={{ fontSize: '1.05rem', fontWeight: 700, color: 'var(--text-primary)', letterSpacing: '0.04em', lineHeight: 1.2 }}>
              ГОСУДАРСТВЕННЫЙ РЕЕСТР
            </h1>
            <p style={{ fontSize: '0.72rem', color: 'var(--text-muted)', lineHeight: 1.2, marginTop: '2px', fontWeight: 500 }}>
              Портал законопроектов Штата San Andreas
            </p>
          </div>
        </div>

        {/* CENTER NAVIGATION PIPES */}
        <nav style={{ 
          display: 'flex', 
          gap: '4px', 
          background: 'rgba(22, 30, 46, 0.6)', 
          padding: '4px', 
          borderRadius: 'var(--radius-pill)', 
          border: '1px solid var(--border-subtle)' 
        }}>
          <button
            onClick={() => onNavigate('dashboard')}
            style={{
              fontSize: '0.8rem',
              fontWeight: 600,
              padding: '7px 18px',
              borderRadius: 'var(--radius-pill)',
              border: 'none',
              cursor: 'pointer',
              display: 'flex', alignItems: 'center', gap: '7px',
              transition: 'all 0.2s ease',
              background: currentView === 'dashboard' ? 'var(--primary)' : 'transparent',
              color: currentView === 'dashboard' ? '#ffffff' : 'var(--text-secondary)',
              boxShadow: currentView === 'dashboard' ? '0 2px 10px var(--primary-glow)' : 'none'
            }}
          >
            <LayoutDashboard size={14} /> Реестр
          </button>

          {isCommitteeOrAdmin && (
            <button
              onClick={() => onNavigate('admin_workspace')}
              style={{
                fontSize: '0.8rem',
                fontWeight: 600,
                padding: '7px 18px',
                borderRadius: 'var(--radius-pill)',
                border: 'none',
                cursor: 'pointer',
                display: 'flex', alignItems: 'center', gap: '7px',
                transition: 'all 0.2s ease',
                background: currentView === 'admin_workspace' ? 'var(--primary)' : 'transparent',
                color: currentView === 'admin_workspace' ? '#ffffff' : 'var(--text-secondary)',
                boxShadow: currentView === 'admin_workspace' ? '0 2px 10px var(--primary-glow)' : 'none'
              }}
            >
              <ShieldCheck size={14} /> Администрация
            </button>
          )}
        </nav>

        {/* RIGHT: CONTROLS & PROFILE */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
          
          {/* PROFILE BADGE */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px', padding: '4px 10px', borderRadius: 'var(--radius-sm)', background: 'rgba(255,255,255,0.02)', border: '1px solid var(--border-subtle)' }}>
            <div style={{
              width: '32px', height: '32px', borderRadius: '50%',
              background: 'linear-gradient(135deg, #1e293b 0%, #0f172a 100%)', 
              border: '1px solid var(--border-medium)',
              display: 'flex', alignItems: 'center', justifyContent: 'center'
            }}>
              <User size={16} color="#60a5fa" />
            </div>
            <div>
              <div style={{ fontSize: '0.82rem', fontWeight: 600, color: 'var(--text-primary)', lineHeight: 1.2 }}>
                {user.firstName} {user.lastName}
              </div>
              <div style={{ fontSize: '0.68rem', color: 'var(--text-muted)', lineHeight: 1.2 }}>
                {OFFICIAL_ROLE_LABELS[user.officialRole] || 'Гражданин'}
              </div>
            </div>
          </div>

          <div style={{ width: '1px', height: '24px', background: 'var(--border-subtle)' }} />

          {/* ACTION BUTTONS */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
            <button onClick={onToggleTheme} className="btn btn-ghost" style={{ padding: '9px' }} title="Тема оформления">
              {theme === 'dark' ? <Moon size={18} color="var(--text-secondary)" /> : <Sun size={18} color="var(--text-secondary)" />}
            </button>
            <button className="btn btn-ghost" onClick={onOpenAbout} style={{ padding: '9px' }} title="Справка">
              <HelpCircle size={18} color="var(--text-secondary)" />
            </button>
            <button className="btn btn-ghost" onClick={onOpenSettings} style={{ padding: '9px' }} title="Настройки">
              <Settings size={18} color="var(--text-secondary)" />
            </button>
          </div>

        </div>
      </div>
    </header>
  );
};
