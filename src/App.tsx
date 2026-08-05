import React, { useState, useEffect } from 'react';
import type { Bill, UserProfile, DbConfig, AccessPermission, AppTheme, OfficialRole } from './types/bill';
import { OFFICIAL_ROLE_LABELS } from './types/bill';
import { 
  fetchAllBills, 
  saveBill, 
  deleteBill, 
  getUserProfile, 
  saveUserProfile
} from './services/storageService';
import { getStoredDbConfig } from './services/supabaseClient';
import { Header } from './components/Header';
import { Dashboard } from './components/Dashboard';
import { BillEditor } from './components/BillEditor';
import { AdminWorkspace } from './components/AdminWorkspace';
import { AccessModal } from './components/AccessModal';
import { DbConfigModal } from './components/DbConfigModal';
import { SettingsModal } from './components/SettingsModal';
import { ConfirmModal } from './components/ConfirmModal';
import { ToastContainer } from './components/Toast';
import type { ToastMessage } from './components/Toast';

export const App: React.FC = () => {
  const [user, setUser] = useState<UserProfile>(getUserProfile());
  const [dbConfig, setDbConfig] = useState<DbConfig>(getStoredDbConfig());
  const [bills, setBills] = useState<Bill[]>([]);
  
  // Theme Management (Dark / Light)
  const [theme, setTheme] = useState<AppTheme>(() => {
    return (localStorage.getItem('legaldraft_theme') as AppTheme) || 'dark';
  });

  // Navigation View State
  const [currentView, setCurrentView] = useState<'dashboard' | 'editor' | 'admin_workspace'>('dashboard');
  const [selectedBill, setSelectedBill] = useState<Bill | null>(null);
  const [currentPermission, setCurrentPermission] = useState<AccessPermission>('edit');
  
  // Modals State
  const [showShareModal, setShowShareModal] = useState(false);
  const [showDbModal, setShowDbModal] = useState(false);
  const [showSettingsModal, setShowSettingsModal] = useState(false);
  const [confirmDeleteId, setConfirmDeleteId] = useState<string | null>(null);

  // In-App Toast Notifications
  const [toasts, setToasts] = useState<ToastMessage[]>([]);

  // Apply Theme Attribute to HTML root element
  useEffect(() => {
    document.documentElement.setAttribute('data-theme', theme);
    localStorage.setItem('legaldraft_theme', theme);
  }, [theme]);

  const toggleTheme = () => {
    setTheme((prev) => (prev === 'dark' ? 'light' : 'dark'));
  };

  const addToast = (type: 'success' | 'error' | 'info', text: string) => {
    const id = 'toast_' + Date.now();
    setToasts((prev) => [...prev, { id, type, text }]);
    setTimeout(() => {
      setToasts((prev) => prev.filter((t) => t.id !== id));
    }, 3000);
  };

  const removeToast = (id: string) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  };

  // Initial Data Fetch
  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    const loadedBills = await fetchAllBills();
    setBills(loadedBills);

    // Check URL parameters for share link access
    const urlParams = new URLSearchParams(window.location.search);
    const billId = urlParams.get('billId');
    const perm = urlParams.get('perm') as AccessPermission;

    if (billId) {
      const targetBill = loadedBills.find((b) => b.id === billId);
      if (targetBill) {
        setSelectedBill(targetBill);
        setCurrentPermission(perm || 'read');
        setCurrentView('editor');
      }
    }
  };

  // Profile update handler
  const handleUpdateProfile = (firstName: string, lastName: string, officialRole: OfficialRole, isOfficialVerified: boolean) => {
    const updated: UserProfile = {
      ...user,
      firstName,
      lastName,
      officialRole,
      isOfficialVerified
    };
    setUser(updated);
    saveUserProfile(updated);
  };

  // Handlers
  const handleSaveBill = async (updatedBill: Bill) => {
    const saved = await saveBill(updatedBill);
    setBills((prev) => {
      const idx = prev.findIndex((b) => b.id === saved.id);
      if (idx >= 0) {
        const copy = [...prev];
        copy[idx] = saved;
        return copy;
      }
      return [saved, ...prev];
    });
    setSelectedBill(saved);
  };

  const handleConfirmDelete = async () => {
    if (confirmDeleteId) {
      await deleteBill(confirmDeleteId);
      setBills((prev) => prev.filter((b) => b.id !== confirmDeleteId));
      if (selectedBill?.id === confirmDeleteId) {
        setSelectedBill(null);
        setCurrentView('dashboard');
      }
      addToast('info', 'Законопроект удален');
      setConfirmDeleteId(null);
    }
  };

  const handleCreateNewBill = () => {
    const newBill: Bill = {
      id: 'bill-' + Date.now(),
      title: 'Новый законопроект о внесении изменений в нормативно-правовой акт',
      targetLaw: 'Закон «Об основах государственного регулирования»',
      lawCode: 'ЗП-' + new Date().getFullYear() + '/' + Math.floor(100 + Math.random() * 900),
      author: `${user.firstName} ${user.lastName}`,
      authorRole: OFFICIAL_ROLE_LABELS[user.officialRole],
      status: 'draft',
      statusReason: 'Подготовка первичного текста инициативы',
      explanatoryNote: 'Укажите здесь ключевые пояснительные комментарии к целям настоящего законопроекта...',
      comparisons: [
        {
          id: 'comp_1',
          articleTitle: 'Статья 1. Раздел 1',
          wasContent: 'Действующая редакция статьи...',
          becameContent: 'Предлагаемая новая редакция статьи с учетом изменений...',
          notes: 'Первичное изменение'
        }
      ],
      shareTokens: [],
      comments: [],
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      viewCount: 1
    };

    setSelectedBill(newBill);
    setCurrentPermission('edit');
    setCurrentView('editor');
    handleSaveBill(newBill);
    addToast('success', 'Создан новый черновик законопроекта');
  };

  return (
    <div style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column' }}>
      
      {/* Header */}
      <Header
        user={user}
        theme={theme}
        currentView={currentView}
        onNavigate={(view) => setCurrentView(view)}
        onToggleTheme={toggleTheme}
        onOpenNewBill={handleCreateNewBill}
        onOpenSettings={() => setShowSettingsModal(true)}
      />

      {/* Main Workspace View Switcher */}
      <main style={{ flex: 1 }}>
        {currentView === 'dashboard' && (
          <Dashboard
            user={user}
            bills={bills}
            onSelectBill={(bill) => {
              setSelectedBill(bill);
              setCurrentPermission('edit');
              setCurrentView('editor');
            }}
            onShareBill={(bill) => {
              setSelectedBill(bill);
              setShowShareModal(true);
            }}
            onDeleteBill={(id) => setConfirmDeleteId(id)}
            onNewBill={handleCreateNewBill}
          />
        )}

        {currentView === 'admin_workspace' && (
          <AdminWorkspace
            user={user}
            bills={bills}
            onSelectBill={(bill) => {
              setSelectedBill(bill);
              setCurrentPermission('read');
              setCurrentView('editor');
            }}
            onSaveBill={handleSaveBill}
            onToast={addToast}
          />
        )}

        {currentView === 'editor' && selectedBill && (
          <BillEditor
            bill={selectedBill}
            user={user}
            permission={currentPermission}
            onSave={handleSaveBill}
            onBack={() => {
              window.history.pushState({}, '', window.location.pathname);
              setCurrentView('dashboard');
            }}
            onShare={(b) => {
              setSelectedBill(b);
              setShowShareModal(true);
            }}
            onToast={addToast}
          />
        )}
      </main>

      {/* Settings Modal (Gear Icon ⚙️) */}
      {showSettingsModal && (
        <SettingsModal
          user={user}
          onUpdateProfile={handleUpdateProfile}
          onClose={() => setShowSettingsModal(false)}
          onToast={addToast}
        />
      )}

      {/* Modals */}
      {showShareModal && selectedBill && (
        <AccessModal
          bill={selectedBill}
          onUpdateBill={handleSaveBill}
          onClose={() => setShowShareModal(false)}
        />
      )}

      {showDbModal && (
        <DbConfigModal
          config={dbConfig}
          onUpdateConfig={(cfg) => {
            setDbConfig(cfg);
            addToast('info', cfg.isConnected ? 'Подключена облачная БД Supabase' : 'Переключено в локальный режим');
          }}
          onClose={() => setShowDbModal(false)}
        />
      )}

      {/* In-App Custom Confirmation Modal */}
      {confirmDeleteId && (
        <ConfirmModal
          title="Удаление законопроекта"
          message="Вы действительно хотите удалить этот законопроект?"
          confirmLabel="Удалить"
          cancelLabel="Отмена"
          isDanger={true}
          onConfirm={handleConfirmDelete}
          onCancel={() => setConfirmDeleteId(null)}
        />
      )}

      {/* In-App Toast Notifications */}
      <ToastContainer toasts={toasts} onDismiss={removeToast} />
    </div>
  );
};
