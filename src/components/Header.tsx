import React from 'react';
import type { UserProfile, AppTheme } from '../types/bill';
import { cn } from '../utils/cn';
import { OFFICIAL_ROLE_LABELS } from '../types/bill';
import { isSystemAdmin } from '../services/securityService';
import { 
  Settings,
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
  onNavigate: (view: 'dashboard' | 'admin_workspace' | 'editor') => void;
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
  onOpenSettings
}) => {
  const isAdmin = isSystemAdmin(user);

  return (
    <header style={{ 
      background: 'var(--bg-glass)', 
      backdropFilter: 'blur(24px)',
      WebkitBackdropFilter: 'blur(24px)',
      borderBottom: '1px solid var(--border-subtle)',
      position: 'sticky',
      top: 0,
      zIndex: 50,
      boxShadow: '0 4px 30px rgba(0, 0, 0, 0.1)'
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
            src="/favicon.png" 
            alt="Законопроекты GTA5RP" 
            style={{ 
              width: '30px', 
              height: '30px', 
              aspectRatio: '1 / 1',
              objectFit: 'contain',
              flexShrink: 0
            }} 
          />

          <div style={{ display: 'flex', flexDirection: 'column', lineHeight: 1.15 }}>
            <span style={{ fontWeight: 800, fontSize: 14, letterSpacing: '-0.01em', color: 'var(--rt-fg)' }}>
              Законопроекты
            </span>
            <span style={{ fontSize: 10, letterSpacing: '.14em', textTransform: 'uppercase', color: 'var(--rt-mut)', fontWeight: 700 }}>
              GTA5RP · ЗАКОНОДАТЕЛЬСТВО
            </span>
          </div>
        </div>

        {/* NAVIGATION TABS */}
        <nav className="flex gap-1 bg-black/20 p-1 rounded-sm border border-[var(--border-subtle)] shrink-0">
          <button
            onClick={() => onNavigate('dashboard')}
            className={cn(
              "flex items-center gap-2 px-3 py-1.5 rounded-sm text-[0.78rem] font-medium transition-all duration-300 ease-out",
              currentView === 'dashboard' 
                ? "bg-white/[0.06] text-white border border-white/20 shadow-[0_0_15px_rgba(255,255,255,0.05)]" 
                : "text-zinc-400 hover:bg-white/[0.04] hover:text-white border border-transparent"
            )}
          >
            <LayoutDashboard size={13} /> Реестр актов
          </button>

          {isAdmin && (
            <button
              onClick={() => onNavigate('admin_workspace')}
              className={cn(
                "flex items-center gap-2 px-3 py-1.5 rounded-sm text-[0.78rem] font-medium transition-all duration-300 ease-out",
                currentView === 'admin_workspace' 
                  ? "bg-white/[0.06] text-white border border-white/20 shadow-[0_0_15px_rgba(255,255,255,0.05)]" 
                  : "text-zinc-400 hover:bg-white/[0.04] hover:text-white border border-transparent"
              )}
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
            className="flex items-center gap-2 p-1 pr-3 rounded-sm bg-black/20 border border-[var(--border-subtle)] cursor-pointer hover:bg-white/[0.04] transition-all duration-300 ease-out max-w-[200px]"
            title={`${user.firstName} ${user.lastName} (${OFFICIAL_ROLE_LABELS[user.officialRole] || 'Гражданин'})`}
          >
            <div className="w-6 h-6 rounded-sm bg-white/[0.02] border border-white/10 flex items-center justify-center shrink-0">
              <User size={12} className="text-zinc-300" />
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
