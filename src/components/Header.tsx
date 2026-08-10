import React from 'react';
import type { UserProfile, AppTheme } from '../types/bill';
import { isOfficialCommitteeMember, isSystemAdmin } from '../services/securityService';
import { OFFICIAL_ROLE_LABELS } from '../types/bill';
import { 
  Plus, 
  Moon, 
  Sun,
  Settings,
  ShieldCheck,
  LayoutDashboard,
  Shield,
  Brain
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
  onOpenNewBill,
  onOpenSettings,
  onOpenAbout
}) => {
  const isCommitteeOrAdmin = isOfficialCommitteeMember(user) || isSystemAdmin(user);

  return (
    <header 
      className="card-accent" 
      style={{ 
        borderRadius: 0, 
        borderTop: 'none', 
        borderLeft: 'none', 
        borderRight: 'none',
        padding: '0',
        marginBottom: '28px'
      }}
    >
      <div style={{ maxWidth: '1280px', margin: '0 auto', padding: '14px 28px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '14px' }}>
        
        {/* ═══ Left: Brand ═══ */}
        <div 
          onClick={() => onNavigate('dashboard')} 
          style={{ display: 'flex', alignItems: 'center', gap: '12px', cursor: 'pointer' }}
        >
          <div style={{ 
            width: '36px', height: '36px', borderRadius: '8px',
            background: 'var(--accent-subtle)', 
            border: '1px solid var(--accent-border)',
            display: 'flex', alignItems: 'center', justifyContent: 'center'
          }}>
            <Shield size={18} color="var(--accent)" />
          </div>

          <div>
            <h1 style={{ fontSize: '0.95rem', fontWeight: 700, color: 'var(--text-primary)', letterSpacing: '0.03em', lineHeight: 1.2 }}>
              ПОРТАЛ ЗАКОНОПРОЕКТОВ
            </h1>
            <p style={{ fontSize: '0.7rem', color: 'var(--text-tertiary)', lineHeight: 1.2 }}>
              Правительство Штата San Andreas
            </p>
          </div>
        </div>

        {/* ═══ Center: Navigation ═══ */}
        <nav style={{ display: 'flex', gap: '2px', background: 'var(--bg-input)', padding: '3px', borderRadius: 'var(--radius-sm)', border: '1px solid var(--border-subtle)' }}>
          <button
            onClick={() => onNavigate('dashboard')}
            style={{
              fontSize: '0.78rem',
              fontWeight: 550,
              padding: '6px 14px',
              borderRadius: 'var(--radius-xs)',
              border: 'none',
              cursor: 'pointer',
              display: 'flex', alignItems: 'center', gap: '6px',
              transition: 'all 0.15s ease',
              background: currentView === 'dashboard' ? 'var(--bg-4)' : 'transparent',
              color: currentView === 'dashboard' ? 'var(--text-primary)' : 'var(--text-tertiary)'
            }}
          >
            <LayoutDashboard size={13} /> Реестр
          </button>

          {isCommitteeOrAdmin && (
            <button
              onClick={() => onNavigate('admin_workspace')}
              style={{
                fontSize: '0.78rem',
                fontWeight: 550,
                padding: '6px 14px',
                borderRadius: 'var(--radius-xs)',
                border: 'none',
                cursor: 'pointer',
                display: 'flex', alignItems: 'center', gap: '6px',
                transition: 'all 0.15s ease',
                background: currentView === 'admin_workspace' ? 'var(--bg-4)' : 'transparent',
                color: currentView === 'admin_workspace' ? 'var(--text-primary)' : 'var(--text-tertiary)'
              }}
            >
              <ShieldCheck size={13} /> Администрация
            </button>
          )}
        </nav>

        {/* ═══ Right: Controls ═══ */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
          {/* User info */}
          <div style={{ marginRight: '8px', textAlign: 'right' }}>
            <div style={{ fontSize: '0.78rem', fontWeight: 600, color: 'var(--text-primary)', lineHeight: 1.2 }}>
              {user.firstName} {user.lastName}
            </div>
            <div style={{ fontSize: '0.67rem', color: 'var(--text-tertiary)', lineHeight: 1.2 }}>
              {OFFICIAL_ROLE_LABELS[user.officialRole]}
            </div>
          </div>

          <div style={{ width: '1px', height: '24px', background: 'var(--border-medium)', margin: '0 4px' }} />

          <button 
            onClick={onToggleTheme} 
            className="btn btn-secondary"
            style={{ padding: '7px 10px', fontSize: '0.78rem' }}
            title="Тема оформления"
          >
            {theme === 'dark' ? <Moon size={14} /> : <Sun size={14} />}
          </button>

          <button 
            onClick={onOpenSettings} 
            className="btn btn-secondary" 
            style={{ padding: '7px 10px' }} 
            title="Настройки"
          >
            <Settings size={14} />
          </button>

          <button 
            onClick={onOpenAbout} 
            className="btn btn-secondary" 
            style={{ padding: '7px 10px', color: 'var(--accent)' }} 
            title="Как работает ИИ"
          >
            <Brain size={14} />
          </button>

          <button 
            onClick={onOpenNewBill} 
            className="btn btn-primary" 
            style={{ padding: '7px 14px', fontSize: '0.78rem' }}
          >
            <Plus size={14} /> Новый проект
          </button>
        </div>
      </div>
    </header>
  );
};
