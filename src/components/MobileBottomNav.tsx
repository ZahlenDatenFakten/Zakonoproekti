import React from 'react';
import { Layers, Plus, BookOpen, ShieldCheck, User, Edit3 } from 'lucide-react';
import type { UserProfile } from '../types/bill';
import { isSystemAdmin } from '../services/securityService';

interface MobileBottomNavProps {
  currentView: 'dashboard' | 'editor' | 'admin_workspace';
  onNavigate: (view: 'dashboard' | 'admin_workspace') => void;
  onOpenNewBill: () => void;
  onOpenSettings: () => void;
  onOpenLawStudio?: () => void;
  user: UserProfile;
}

export const MobileBottomNav: React.FC<MobileBottomNavProps> = ({
  currentView,
  onNavigate,
  onOpenNewBill,
  onOpenSettings,
  onOpenLawStudio,
  user
}) => {
  const isAdmin = isSystemAdmin(user);

  return (
    <nav className="mobile-bottom-nav" aria-label="Мобильная навигация">
      {/* 1. Dashboard / Registry Tab */}
      <button
        type="button"
        className={`mobile-tab-item ${currentView === 'dashboard' ? 'active' : ''}`}
        onClick={() => onNavigate('dashboard')}
        aria-label="Реестр законопроектов"
      >
        <Layers size={20} />
        <span>Реестр</span>
      </button>

      {/* 2. When in Editor: Show Editor Indicator or Back; Otherwise Show New Bill */}
      {currentView === 'editor' ? (
        <button
          type="button"
          className="mobile-tab-item active"
          aria-label="Текущий законопроект"
          style={{ color: 'var(--rt-acc, #3b82f6)' }}
        >
          <Edit3 size={20} />
          <span>Редактор</span>
        </button>
      ) : (
        <button
          type="button"
          className="mobile-tab-create-btn"
          onClick={onOpenNewBill}
          aria-label="Создать новый законопроект"
          title="Внести законопроект"
        >
          <div className="mobile-tab-create-icon">
            <Plus size={22} strokeWidth={2.5} />
          </div>
          <span>Создать</span>
        </button>
      )}

      {/* 3. Law Studio (if admin or provided) */}
      {isAdmin && onOpenLawStudio && (
        <button
          type="button"
          className="mobile-tab-item"
          onClick={onOpenLawStudio}
          aria-label="Реестр законов штата"
        >
          <BookOpen size={20} />
          <span>Законы</span>
        </button>
      )}

      {/* 4. Admin Workspace Tab (if admin) */}
      {isAdmin && (
        <button
          type="button"
          className={`mobile-tab-item ${currentView === 'admin_workspace' ? 'active' : ''}`}
          onClick={() => onNavigate('admin_workspace')}
          aria-label="Кабинет администрации"
        >
          <ShieldCheck size={20} />
          <span>Кабинет</span>
        </button>
      )}

      {/* 5. User Profile / Settings Tab */}
      <button
        type="button"
        className="mobile-tab-item"
        onClick={onOpenSettings}
        aria-label="Профиль и настройки"
      >
        <User size={20} />
        <span>Профиль</span>
      </button>
    </nav>
  );
};
