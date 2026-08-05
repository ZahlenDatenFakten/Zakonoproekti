import React from 'react';
import type { UserProfile, AppTheme } from '../types/bill';
import { isOfficialCommitteeMember, isSystemAdmin } from '../services/securityService';
import { 
  Plus, 
  Shield, 
  Building2, 
  Moon, 
  Sun,
  Settings,
  ShieldCheck,
  LayoutDashboard
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
    <header className="card-dark" style={{ borderRadius: '0', borderTop: 'none', borderLeft: 'none', borderRight: 'none', padding: '14px 28px', marginBottom: '24px' }}>
      <div style={{ maxWidth: '1240px', margin: '0 auto', display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '14px' }}>
        
        {/* Brand Title */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
          <div 
            onClick={() => onNavigate('dashboard')}
            style={{ 
              width: '40px', 
              height: '40px', 
              borderRadius: '10px', 
              background: 'var(--bg-input)',
              border: '1px solid var(--border-medium)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              cursor: 'pointer'
            }}
          >
            <Shield size={20} color="var(--text-primary)" />
          </div>

          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <h1 
                onClick={() => onNavigate('dashboard')}
                style={{ fontSize: '1.15rem', fontWeight: 700, color: 'var(--text-primary)', letterSpacing: '0.02em', cursor: 'pointer' }}
              >
                ЗАКОНОПРОЕКТЫ
              </h1>
              <span style={{ fontSize: '0.72rem', background: 'var(--bg-input)', color: 'var(--text-secondary)', padding: '2px 8px', borderRadius: '4px', border: '1px solid var(--border-subtle)' }}>
                ПОРТАЛ ИНИЦИАТИВ
              </span>
            </div>
            <p style={{ fontSize: '0.8rem', color: 'var(--text-tertiary)', display: 'flex', alignItems: 'center', gap: '4px', marginTop: '1px' }}>
              <Building2 size={12} /> {user.department}
            </p>
          </div>
        </div>

        {/* Center Navigation Tabs (Dashboard vs Admin Workspace) */}
        <div style={{ display: 'flex', gap: '6px' }}>
          <button
            onClick={() => onNavigate('dashboard')}
            className="btn btn-secondary"
            style={{
              fontSize: '0.82rem',
              padding: '6px 14px',
              background: currentView === 'dashboard' ? 'var(--bg-input)' : 'transparent',
              borderColor: currentView === 'dashboard' ? 'var(--border-medium)' : 'transparent',
              color: currentView === 'dashboard' ? 'var(--text-primary)' : 'var(--text-secondary)'
            }}
          >
            <LayoutDashboard size={14} /> Дашборд проектов
          </button>

          {isCommitteeOrAdmin && (
            <button
              onClick={() => onNavigate('admin_workspace')}
              className="btn btn-secondary"
              style={{
                fontSize: '0.82rem',
                padding: '6px 14px',
                background: currentView === 'admin_workspace' ? 'rgba(99, 102, 241, 0.15)' : 'transparent',
                borderColor: currentView === 'admin_workspace' ? 'rgba(99, 102, 241, 0.4)' : 'transparent',
                color: currentView === 'admin_workspace' ? '#a5b4fc' : 'var(--text-secondary)'
              }}
            >
              <ShieldCheck size={14} /> Кабинет Администрации (2 этап)
            </button>
          )}
        </div>

        {/* User Controls */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          
          {/* Theme Switcher Toggle */}
          <button 
            onClick={onToggleTheme} 
            className="btn btn-secondary"
            style={{ fontSize: '0.82rem', padding: '7px 12px' }}
            title="Переключить тему оформления"
          >
            {theme === 'dark' ? <Moon size={15} /> : <Sun size={15} />}
            <span>{theme === 'dark' ? 'Тёмная тема' : 'Светлая тема'}</span>
          </button>

          {/* New Bill Button */}
          <button onClick={onOpenNewBill} className="btn btn-primary" style={{ padding: '7px 14px', fontSize: '0.85rem' }}>
            <Plus size={16} />
            <span>Создать проект</span>
          </button>

          {/* Settings Gear Icon */}
          <button 
            onClick={onOpenSettings} 
            className="btn btn-secondary" 
            style={{ padding: '8px', borderRadius: '8px' }} 
            title="Личный кабинет и Настройки (⚙️)"
          >
            <Settings size={18} />
          </button>
        </div>
      </div>
    </header>
  );
};
