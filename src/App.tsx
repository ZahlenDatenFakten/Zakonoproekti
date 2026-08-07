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
import { ForumBatchSyncModal } from './components/ForumBatchSyncModal';
import { ConfirmModal } from './components/ConfirmModal';
import { ToastContainer } from './components/Toast';
import type { ToastMessage } from './components/Toast';
import { Layers } from 'lucide-react';

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
  const [showBatchSyncModal, setShowBatchSyncModal] = useState(false);
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

  // Create new bill
  const handleCreateNewBill = () => {
    const authorFullName = `${user.firstName} ${user.lastName}`.trim();
    const newBill: Bill = {
      id: 'bill_' + Date.now(),
      title: 'О внесении изменений в Законы Штата',
      targetLaw: 'Уголовный кодекс Штата (УК)',
      lawCode: 'ЗП-2026/' + Math.floor(100 + Math.random() * 900),
      author: authorFullName,
      authorRole: OFFICIAL_ROLE_LABELS[user.officialRole],
      status: 'draft',
      explanatoryNote: 'Пояснительный комментарий к законопроекту...',
      comparisons: [
        {
          id: 'comp_1',
          articleTitle: 'Статья 1. Общие положения',
          wasContent: 'Действующая редакция статьи...',
          becameContent: 'Проектируемая редакция статьи со всеми изменениями...',
          notes: ''
        }
      ],
      shareTokens: [],
      comments: [],
      votes: {},
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      viewCount: 1
    };

    setSelectedBill(newBill);
    setCurrentPermission('edit');
    setCurrentView('editor');
  };

  const handleOpenBill = (bill: Bill) => {
    setSelectedBill(bill);
    setCurrentPermission('edit');
    setCurrentView('editor');
  };

  const handleSaveBill = async (updatedBill: Bill) => {
    const saved = await saveBill(updatedBill);
    setSelectedBill(saved);
    await loadData();
  };

  const handleDeleteBill = async (billId: string) => {
    await deleteBill(billId);
    setConfirmDeleteId(null);
    if (selectedBill?.id === billId) {
      setSelectedBill(null);
      setCurrentView('dashboard');
    }
    await loadData();
    addToast('info', 'Законопроект удален');
  };

  return (
    <div style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column' }}>
      
      {/* Global Header */}
      <Header
        user={user}
        theme={theme}
        currentView={currentView}
        onNavigate={(view) => setCurrentView(view)}
        onToggleTheme={toggleTheme}
        onOpenNewBill={handleCreateNewBill}
        onOpenSettings={() => setShowSettingsModal(true)}
      />

      {/* Floating Toolbar for Batch 36+ Forum Sync & DB Config */}
      <div style={{ maxWidth: '1240px', width: '100%', margin: '0 auto', padding: '0 24px', display: 'flex', justifyContent: 'flex-end', gap: '10px', marginBottom: '14px' }}>
        <button
          onClick={() => setShowBatchSyncModal(true)}
          className="btn btn-secondary"
          style={{ fontSize: '0.8rem', padding: '5px 12px', background: 'rgba(99, 102, 241, 0.12)', color: '#a5b4fc', border: '1px solid rgba(99, 102, 241, 0.3)' }}
        >
          <Layers size={14} /> 🌐 Пакетный импорт 36+ ссылок с Форума
        </button>

        <button
          onClick={() => setShowDbModal(true)}
          className="btn btn-secondary"
          style={{ fontSize: '0.8rem', padding: '5px 12px' }}
        >
          ⚙️ Облачная БД (Firebase / Supabase)
        </button>
      </div>

      {/* Main View Router */}
      <main style={{ flex: 1 }}>
        {currentView === 'dashboard' && (
          <Dashboard
            bills={bills}
            user={user}
            onSelectBill={handleOpenBill}
            onNewBill={handleCreateNewBill}
            onDeleteBill={(id) => setConfirmDeleteId(id)}
            onShareBill={(b) => {
              setSelectedBill(b);
              setShowShareModal(true);
            }}
          />
        )}

        {currentView === 'editor' && selectedBill && (
          <BillEditor
            bill={selectedBill}
            user={user}
            permission={currentPermission}
            onSave={handleSaveBill}
            onBack={() => setCurrentView('dashboard')}
            onShare={(b) => {
              setSelectedBill(b);
              setShowShareModal(true);
            }}
            onToast={addToast}
          />
        )}

        {currentView === 'admin_workspace' && (
          <AdminWorkspace
            bills={bills}
            user={user}
            onSelectBill={handleOpenBill}
            onSaveBill={handleSaveBill}
            onToast={addToast}
          />
        )}
      </main>

      {/* Toast Notification Container */}
      <ToastContainer toasts={toasts} onDismiss={removeToast} />

      {/* Access Share Link Modal */}
      {showShareModal && selectedBill && (
        <AccessModal
          bill={selectedBill}
          onUpdateBill={(updated) => {
            setSelectedBill(updated);
            handleSaveBill(updated);
          }}
          onClose={() => setShowShareModal(false)}
        />
      )}

      {/* DB Configuration Modal (Firebase / Supabase) */}
      {showDbModal && (
        <DbConfigModal
          config={dbConfig}
          onUpdateConfig={(newConfig) => setDbConfig(newConfig)}
          onClose={() => setShowDbModal(false)}
        />
      )}

      {/* User Profile & Settings Modal */}
      {showSettingsModal && (
        <SettingsModal
          user={user}
          onUpdateProfile={handleUpdateProfile}
          onClose={() => setShowSettingsModal(false)}
          onToast={addToast}
        />
      )}

      {/* Batch 36+ Forum Links Sync Modal */}
      {showBatchSyncModal && (
        <ForumBatchSyncModal
          onClose={() => setShowBatchSyncModal(false)}
          onToast={addToast}
          onLawsUpdated={loadData}
        />
      )}

      {/* Delete Confirmation Modal */}
      {confirmDeleteId && (
        <ConfirmModal
          title="Удаление законопроекта"
          message="Вы уверены, что хотите безвозвратно удалить данный законопроект?"
          confirmLabel="Удалить безвозвратно"
          onConfirm={() => handleDeleteBill(confirmDeleteId)}
          onCancel={() => setConfirmDeleteId(null)}
        />
      )}
    </div>
  );
};
