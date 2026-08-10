import React from 'react';
import type { UserProfile, AppTheme } from '../types/bill';
import { isOfficialCommitteeMember, isSystemAdmin } from '../services/securityService';
import { 
  Plus, 
  Building2, 
  Moon, 
  Sun,
  Settings,
  ShieldCheck,
  LayoutDashboard,
  Shield
} from 'lucide-react';

interface HeaderProps {
  user: UserProfile;
  theme: AppTheme;
  currentView: 'dashboard' | 'editor' | 'admin_workspace';
  onNavigate: (view: 'dashboard' | 'admin_workspace') => void;
  onToggleTheme: () => void;
  onOpenNewBill: () => void;
  onOpenSettings: () => void;
}

export const Header: React.FC<HeaderProps> = ({
  user,
  theme,
  currentView,
  onNavigate,
  onToggleTheme,
  onOpenNewBill,
  onOpenSettings
}) => {
  const isCommitteeOrAdmin = isOfficialCommitteeMember(user) || isSystemAdmin(user);

  return (
    <header className="card-accent" style={{ borderRadius: '0', borderTop: 'none', borderLeft: 'none', borderRight: 'none', padding: '16px 32px', marginBottom: '24px' }}>
      <div style={{ maxWidth: '1280px', margin: '0 auto', display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '16px' }}>
        
        {/* Brand Title & Official Emblem */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
          <div 
            onClick={() => onNavigate('dashboard')}
            style={{ 
              width: '46px', 
              height: '46px', 
              borderRadius: '12px', 
              background: 'linear-gradient(135deg, rgba(59, 130, 246, 0.25), rgba(15, 23, 42, 0.95))',
              border: '1px solid var(--accent-border)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              cursor: 'pointer',
              boxShadow: '0 4px 15px rgba(59, 130, 246, 0.25)'
            }}
          >
            <Shield size={24} color="var(--accent-light)" />
          </div>

          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
              <h1 
                onClick={() => onNavigate('dashboard')}
                style={{ fontSize: '1.2rem', fontWeight: 700, color: 'var(--text-primary)', cursor: 'pointer', margin: 0, letterSpacing: '0.02em' }}
              >
                ПОРТАЛ ЗАКОНОПРОЕКТОВ
              </h1>
              <span style={{ fontSize: '0.7rem', background: 'var(--accent-subtle)', color: 'var(--accent-light)', padding: '2px 10px', borderRadius: '12px', border: '1px solid var(--accent-border)', fontWeight: 600, letterSpacing: '0.04em' }}>
                ОФИЦИАЛЬНАЯ СИСТЕМА
              </span>
            </div>
            <p style={{ fontSize: '0.8rem', color: 'var(--text-tertiary)', display: 'flex', alignItems: 'center', gap: '5px', marginTop: '2px' }}>
              <Building2 size={13} color="var(--text-tertiary)" /> Правительство Штата San Andreas • {user.department}
            </p>
          </div>
        </div>

        {/* Center Navigation Tabs (Dashboard vs Admin Workspace) */}
        <div style={{ display: 'flex', gap: '8px' }}>
          <button
            onClick={() => onNavigate('dashboard')}
            className="btn btn-secondary"
            style={{
              fontSize: '0.84rem',
              padding: '8px 16px',
              background: currentView === 'dashboard' ? 'var(--accent-subtle)' : 'transparent',
              borderColor: currentView === 'dashboard' ? 'var(--accent-border)' : 'transparent',
              color: currentView === 'dashboard' ? 'var(--accent-light)' : 'var(--text-secondary)'
            }}
          >
            <LayoutDashboard size={15} /> Реестр проектов
          </button>

          {isCommitteeOrAdmin && (
            <button
              onClick={() => onNavigate('admin_workspace')}
              className="btn btn-secondary"
              style={{
                fontSize: '0.84rem',
                padding: '8px 16px',
                background: currentView === 'admin_workspace' ? 'rgba(99, 102, 241, 0.18)' : 'transparent',
                borderColor: currentView === 'admin_workspace' ? 'rgba(99, 102, 241, 0.4)' : 'transparent',
                color: currentView === 'admin_workspace' ? '#a5b4fc' : 'var(--text-secondary)'
              }}
            >
              <ShieldCheck size={15} /> Кабинет Администрации
            </button>
          )}
        </div>

        {/* User Controls */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          
          {/* Theme Switcher Toggle */}
          <button 
            onClick={onToggleTheme} 
            className="btn btn-secondary"
            style={{ fontSize: '0.82rem', padding: '8px 14px' }}
            title="Переключить тему оформления"
          >
            {theme === 'dark' ? <Moon size={15} /> : <Sun size={15} />}
            <span>{theme === 'dark' ? 'Тёмная тема' : 'Светлая тема'}</span>
          </button>

          {/* New Bill Button */}
          <button onClick={onOpenNewBill} className="btn btn-primary" style={{ padding: '8px 16px', fontSize: '0.85rem' }}>
            <Plus size={16} />
            <span>Внести законопроект</span>
          </button>

          {/* Settings Gear Icon */}
          <button 
            onClick={onOpenSettings} 
            className="btn btn-secondary" 
            style={{ padding: '9px', borderRadius: '10px' }} 
            title="Личный кабинет и Настройки (⚙️)"
          >
            <Settings size={18} />
          </button>
        </div>
      </div>
    </header>
  );
};
