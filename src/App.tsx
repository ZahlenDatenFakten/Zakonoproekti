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
import { isSystemAdmin } from './services/securityService';
import { Header } from './components/Header';
import { Dashboard } from './components/Dashboard';
import { BillEditor } from './components/BillEditor';
import { AdminWorkspace } from './components/AdminWorkspace';
import { AccessModal } from './components/AccessModal';
import { DbConfigModal } from './components/DbConfigModal';
import { SettingsModal } from './components/SettingsModal';
import { ConfirmModal } from './components/ConfirmModal';
import { ToastContainer } from './components/Toast';
import { IdentityModal } from './components/IdentityModal';
import type { ToastMessage } from './components/Toast';

export const App: React.FC = () => {
  const [user, setUser] = useState<UserProfile>(getUserProfile());
  const [dbConfig, setDbConfig] = useState<DbConfig>(getStoredDbConfig());
  const [bills, setBills] = useState<Bill[]>([]);
  
  // Theme Management (Dark / Light)
  const [theme, setTheme] = useState<AppTheme>(() => {
    return (localStorage.getItem('legaldraft_theme') as AppTheme) || 'dark';
  });

  // Mandatory Citizen Identity State
  const [isIdentityConfirmed, setIsIdentityConfirmed] = useState<boolean>(() => {
    return localStorage.getItem('legaldraft_identity_confirmed') === 'true';
  });

  // Navigation View State
  const [currentView, setCurrentView] = useState<'dashboard' | 'editor' | 'admin_workspace'>('dashboard');
  const [returnView, setReturnView] = useState<'dashboard' | 'admin_workspace'>(() => {
    return (localStorage.getItem('legaldraft_return_view') as any) || 'dashboard';
  });
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

  // Handle native browser Back / Forward buttons (popstate)
  useEffect(() => {
    const handlePopState = (event: PopStateEvent) => {
      if (event.state && event.state.view) {
        setCurrentView(event.state.view);
        if (event.state.returnView) {
          setReturnView(event.state.returnView);
        }
      } else {
        const savedReturn = (localStorage.getItem('legaldraft_return_view') as any) || 'dashboard';
        setCurrentView(savedReturn);
      }
    };

    window.addEventListener('popstate', handlePopState);
    return () => window.removeEventListener('popstate', handlePopState);
  }, []);

  const toggleTheme = () => {
    setTheme((prev) => (prev === 'dark' ? 'light' : 'dark'));
  };

  const handleConfirmIdentity = (firstName: string, lastName: string) => {
    const updatedUser: UserProfile = {
      ...user,
      firstName,
      lastName
    };
    setUser(updatedUser);
    saveUserProfile(updatedUser);
    localStorage.setItem('legaldraft_identity_confirmed', 'true');
    setIsIdentityConfirmed(true);
    addToast('success', `Идентификация пройдена: ${firstName} ${lastName}`);
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
        const currentFullName = `${user.firstName} ${user.lastName}`.trim();
        const isAuthor = targetBill.author.trim() === currentFullName;
        const canUserEdit = perm ? perm === 'edit' : (isAuthor || isSystemAdmin(user) || user.isOfficialVerified);
        setCurrentPermission(canUserEdit ? 'edit' : 'read');
        setCurrentView('editor');
        return;
      }
    }

    // Restore active bill session from localStorage if user refreshed page while editing
    const savedView = localStorage.getItem('legaldraft_current_view');
    const savedBillId = localStorage.getItem('legaldraft_active_bill_id');
    if (savedView === 'editor' && savedBillId) {
      const activeBill = loadedBills.find((b) => b.id === savedBillId);
      if (activeBill) {
        setSelectedBill(activeBill);
        setCurrentPermission('edit');
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
  const handleCreateNewBill = async () => {
    const authorFullName = `${user.firstName} ${user.lastName}`.trim();
    const newBill: Bill = {
      id: 'bill_' + Date.now(),
      title: 'О внесении изменений в Законы Штата',
      targetLaw: 'Уголовный кодекс Штата (УК)',
      author: authorFullName,
      authorRole: OFFICIAL_ROLE_LABELS[user.officialRole] || 'Гражданин',
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

    // Instant zero-latency UI transition to editor
    setReturnView('dashboard');
    localStorage.setItem('legaldraft_return_view', 'dashboard');
    setSelectedBill(newBill);
    setCurrentPermission('edit');
    setCurrentView('editor');
    localStorage.setItem('legaldraft_active_bill_id', newBill.id);
    localStorage.setItem('legaldraft_current_view', 'editor');

    try {
      window.history.pushState({ view: 'editor', billId: newBill.id, returnView: 'dashboard' }, '', `?billId=${newBill.id}`);
    } catch (e) {}

    // Asynchronously save to storage and sync state without blocking UI
    try {
      const saved = await saveBill(newBill);
      setBills(prev => [saved, ...prev.filter(b => b.id !== saved.id)]);
      setSelectedBill(saved);
    } catch (e) {
      console.error('Error saving new bill:', e);
    }
  };

  const handleOpenBill = (bill: Bill, sourceView?: 'dashboard' | 'admin_workspace') => {
    const origin = sourceView || (currentView === 'admin_workspace' ? 'admin_workspace' : 'dashboard');
    setReturnView(origin);
    localStorage.setItem('legaldraft_return_view', origin);
    setSelectedBill(bill);
    setCurrentPermission('edit');
    setCurrentView('editor');
    localStorage.setItem('legaldraft_active_bill_id', bill.id);
    localStorage.setItem('legaldraft_current_view', 'editor');

    try {
      window.history.pushState({ view: 'editor', billId: bill.id, returnView: origin }, '', `?billId=${bill.id}`);
    } catch (e) {
      // Ignore if iframe/sandbox blocks pushState
    }
  };

  const handleBackFromEditor = () => {
    const target = returnView || (localStorage.getItem('legaldraft_return_view') as any) || 'dashboard';
    handleNavigateView(target);
  };

  const handleNavigateView = (view: 'dashboard' | 'admin_workspace' | 'editor') => {
    setCurrentView(view);
    localStorage.setItem('legaldraft_current_view', view);
    if (view !== 'editor') {
      localStorage.removeItem('legaldraft_active_bill_id');
      try {
        window.history.pushState({ view }, '', window.location.pathname);
      } catch (e) {}
    }
  };

  const handleSaveBill = async (updatedBill: Bill) => {
    const saved = await saveBill(updatedBill);
    setSelectedBill(saved);
    setBills((prev) => [saved, ...prev.filter((b) => b.id !== saved.id)]);
    await loadData();
  };

  const handleDeleteBill = async (billId: string) => {
    await deleteBill(billId);
    setConfirmDeleteId(null);
    if (selectedBill?.id === billId) {
      setSelectedBill(null);
      handleNavigateView('dashboard');
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
        onNavigate={handleNavigateView}
        onToggleTheme={toggleTheme}
        onOpenNewBill={handleCreateNewBill}
        onOpenSettings={() => setShowSettingsModal(true)}
        onOpenDbConfig={() => setShowDbModal(true)}
      />

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
            returnView={returnView}
            onSave={handleSaveBill}
            onDelete={(id) => setConfirmDeleteId(id)}
            onBack={handleBackFromEditor}
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

      {/* Mandatory Citizen Identity Confirmation Modal */}
      {!isIdentityConfirmed && (
        <IdentityModal
          initialFirstName={user.firstName}
          initialLastName={user.lastName}
          onSubmit={handleConfirmIdentity}
        />
      )}

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

      {/* Delete Confirmation Modal */}
      {confirmDeleteId && (
        <ConfirmModal
          title="Отозвать и удалить законопроект"
          message="Вы действительно хотите полностью отозвать и удалить данный законопроект из государственного реестра? Проект будет безвозвратно удален из базы данных и всех списков."
          confirmLabel="Отозвать и удалить"
          onConfirm={() => handleDeleteBill(confirmDeleteId)}
          onCancel={() => setConfirmDeleteId(null)}
        />
      )}
    </div>
  );
};
