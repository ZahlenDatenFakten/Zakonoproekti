import React from 'react';
import type { UserProfile, AppTheme } from '../types/bill';
import { 
  Settings,
  Shield,
  Bell,
  HelpCircle,
  LogOut,
  User,
  ChevronDown
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
  onNavigate,
  onOpenSettings,
  onOpenAbout
}) => {
  return (
    <header style={{ 
      background: 'var(--bg-base)', 
      borderBottom: '1px solid var(--border-subtle)',
      padding: '0'
    }}>
      <div style={{ 
        maxWidth: '1440px', 
        margin: '0 auto', 
        padding: '16px 24px', 
        display: 'flex', 
        alignItems: 'center', 
        justifyContent: 'space-between'
      }}>
        
        {/* LEFT: Brand */}
        <div 
          onClick={() => onNavigate('dashboard')} 
          style={{ display: 'flex', alignItems: 'center', gap: '12px', cursor: 'pointer' }}
        >
          <div style={{ 
            width: '40px', height: '40px', borderRadius: '8px',
            background: 'var(--primary-subtle)', 
            border: '1px solid rgba(33, 123, 248, 0.2)',
            display: 'flex', alignItems: 'center', justifyContent: 'center'
          }}>
            <Shield size={20} color="var(--primary)" />
          </div>

          <div>
            <h1 style={{ fontSize: '1rem', fontWeight: 600, color: 'var(--text-primary)', letterSpacing: '0.02em', lineHeight: 1.2 }}>
              LEGAL DRAFT
            </h1>
            <p style={{ fontSize: '0.75rem', color: 'var(--text-muted)', lineHeight: 1.2, marginTop: '2px' }}>
              Кабинет законодателя
            </p>
          </div>
        </div>

        {/* RIGHT: User & Controls */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '20px' }}>
          
          {/* User Profile */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px', cursor: 'pointer' }}>
            <div style={{
              width: '32px', height: '32px', borderRadius: '50%',
              background: 'var(--bg-hover)', border: '1px solid var(--border-medium)',
              display: 'flex', alignItems: 'center', justifyContent: 'center'
            }}>
              <User size={16} color="var(--text-secondary)" />
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
              <span style={{ fontSize: '0.85rem', fontWeight: 500, color: 'var(--text-primary)' }}>
                {user.firstName} {user.lastName}
              </span>
              <ChevronDown size={14} color="var(--text-muted)" />
            </div>
          </div>

          <div style={{ width: '1px', height: '24px', background: 'var(--border-subtle)' }} />

          {/* Action Icons */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
            <button className="btn btn-ghost" style={{ padding: '8px' }} title="Уведомления">
              <Bell size={18} />
            </button>
            <button className="btn btn-ghost" onClick={onOpenAbout} style={{ padding: '8px' }} title="Справка">
              <HelpCircle size={18} />
            </button>
            <button className="btn btn-ghost" onClick={onOpenSettings} style={{ padding: '8px' }} title="Настройки">
              <Settings size={18} />
            </button>
            <button className="btn btn-ghost" style={{ padding: '8px' }} title="Выход">
              <LogOut size={18} />
            </button>
          </div>

        </div>
      </div>
    </header>
  );
};
