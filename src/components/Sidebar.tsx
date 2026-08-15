import React from 'react';
import { 
  LayoutDashboard, 
  ShieldCheck, 
  Settings, 
  Database,
  User,
  Plus
} from 'lucide-react';
import type { UserProfile } from '../types/bill';
import { OFFICIAL_ROLE_LABELS } from '../types/bill';
import { isSystemAdmin } from '../services/securityService';
import { cn } from '../utils/cn';

interface SidebarProps {
  user: UserProfile;
  currentView: 'dashboard' | 'editor' | 'admin_workspace';
  onNavigate: (view: 'dashboard' | 'admin_workspace' | 'editor') => void;
  onOpenSettings: () => void;
  onOpenDbConfig?: () => void;
  onOpenNewBill: () => void;
}

export const Sidebar: React.FC<SidebarProps> = ({
  user,
  currentView,
  onNavigate,
  onOpenSettings,
  onOpenDbConfig,
  onOpenNewBill
}) => {
  const isAdmin = isSystemAdmin(user);

  return (
    <aside className="fixed left-0 top-0 bottom-0 w-64 bg-[#090B10]/80 backdrop-blur-xl border-r border-white/10 flex flex-col z-50">
      
      {/* Brand & Logo */}
      <div className="p-6 flex items-center gap-3 border-b border-white/5">
        <img 
          src="/logo.png" 
          alt="State Seal" 
          className="w-10 h-10 object-contain drop-shadow-[0_0_10px_rgba(99,102,241,0.3)]"
        />
        <div>
          <h1 className="text-sm font-bold text-white tracking-wide">STATE OS</h1>
          <p className="text-[10px] font-mono text-zinc-400">SAN ANDREAS GOV</p>
        </div>
      </div>

      {/* Navigation */}
      <nav className="flex-1 px-4 py-6 flex flex-col gap-6 overflow-y-auto custom-scrollbar">
        
        {/* Main Menu */}
        <div>
          <h2 className="text-[11px] font-bold tracking-wider uppercase text-blue-400 mb-3 px-3">
            Основное меню
          </h2>
          <div className="flex flex-col gap-1">
            <button
              onClick={() => onNavigate('dashboard')}
              className={cn(
                "w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all duration-200",
                currentView === 'dashboard' 
                  ? "bg-indigo-500/20 text-white border border-indigo-500/30 shadow-[0_0_20px_rgba(99,102,241,0.15)]" 
                  : "text-zinc-400 hover:bg-white/5 hover:text-white"
              )}
            >
              <LayoutDashboard size={18} className={currentView === 'dashboard' ? "text-indigo-400" : ""} />
              Реестр актов
            </button>

            <button
              onClick={onOpenNewBill}
              className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium text-emerald-400 hover:bg-emerald-500/10 border border-transparent hover:border-emerald-500/20 transition-all duration-200 mt-2"
            >
              <Plus size={18} />
              Новый проект
            </button>
          </div>
        </div>

        {/* Admin Menu */}
        {isAdmin && (
          <div>
            <h2 className="text-[11px] font-bold tracking-wider uppercase text-amber-400 mb-3 px-3">
              Губернатура
            </h2>
            <div className="flex flex-col gap-1">
              <button
                onClick={() => onNavigate('admin_workspace')}
                className={cn(
                  "w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all duration-200",
                  currentView === 'admin_workspace' 
                    ? "bg-amber-500/20 text-amber-200 border border-amber-500/30 shadow-[0_0_20px_rgba(245,158,11,0.15)]" 
                    : "text-zinc-400 hover:bg-white/5 hover:text-white"
                )}
              >
                <ShieldCheck size={18} className={currentView === 'admin_workspace' ? "text-amber-400" : ""} />
                Администрация
              </button>
              
              {onOpenDbConfig && (
                <button
                  onClick={onOpenDbConfig}
                  className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium text-zinc-400 hover:bg-white/5 hover:text-white transition-all duration-200"
                >
                  <Database size={18} />
                  База данных
                </button>
              )}
            </div>
          </div>
        )}
      </nav>

      {/* User Profile */}
      <div className="p-4 border-t border-white/5 bg-black/20">
        <div 
          onClick={onOpenSettings}
          className="flex items-center gap-3 p-2 rounded-xl hover:bg-white/5 cursor-pointer border border-transparent hover:border-white/10 transition-all duration-200"
        >
          <div className="w-10 h-10 rounded-full bg-indigo-500/10 border border-indigo-500/20 text-indigo-300 flex items-center justify-center shrink-0 shadow-[0_0_15px_rgba(99,102,241,0.2)]">
            <User size={18} />
          </div>
          <div className="overflow-hidden flex-1">
            <p className="text-sm font-bold text-white truncate">
              {user.firstName} {user.lastName}
            </p>
            <p className="text-[10px] font-mono text-zinc-400 uppercase tracking-wider truncate">
              {OFFICIAL_ROLE_LABELS[user.officialRole] || 'Гражданин'}
            </p>
          </div>
          <Settings size={16} className="text-zinc-500 shrink-0" />
        </div>
      </div>
    </aside>
  );
};
