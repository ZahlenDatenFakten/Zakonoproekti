import React, { useState, useMemo } from 'react';
import type { Bill, BillStatus, UserProfile } from '../types/bill';
import { 
  Search, 
  ChevronRight,
  FileText,
  Plus,
  Calendar,
  User as UserIcon,
  Layers
} from 'lucide-react';

interface DashboardProps {
  user: UserProfile;
  bills: Bill[];
  onSelectBill: (bill: Bill) => void;
  onShareBill: (bill: Bill) => void;
  onDeleteBill: (billId: string) => void;
  onNewBill: () => void;
}

export const Dashboard: React.FC<DashboardProps> = ({
  user,
  bills,
  onSelectBill,
  onNewBill
}) => {
  const [activeTab, setActiveTab] = useState<'all' | 'my' | 'active' | 'archive'>('active');
  const [searchQuery, setSearchQuery] = useState('');

  const currentFullName = `${user.firstName} ${user.lastName}`.trim();

  const filteredBills = useMemo(() => {
    return bills
      .filter((b) => {
        if (b.status === 'draft' && b.author.trim() !== currentFullName) return false;
        
        if (activeTab === 'my') {
          if (b.author.trim() !== currentFullName) return false;
        } else if (activeTab === 'active') {
          if (b.status === 'approved' || b.status === 'rejected' || b.status === 'draft') return false;
        } else if (activeTab === 'archive') {
          if (b.status !== 'approved' && b.status !== 'rejected') return false;
        }

        if (searchQuery) {
          const query = searchQuery.toLowerCase();
          return (
            b.targetLaw.toLowerCase().includes(query) ||
            b.author.toLowerCase().includes(query) ||
            (b.title && b.title.toLowerCase().includes(query))
          );
        }

        return true;
      })
      .sort((a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime());
  }, [bills, activeTab, searchQuery, currentFullName]);

  const formatDate = (isoStr: string) => {
    const d = new Date(isoStr);
    return `${d.toLocaleDateString('ru-RU')} ${d.toLocaleTimeString('ru-RU', { hour: '2-digit', minute: '2-digit' })}`;
  };

  const getStatusBadge = (status: BillStatus) => {
    switch (status) {
      case 'approved':
        return <span className="badge badge-status-approved">Одобрен</span>;
      case 'rejected':
        return <span className="badge badge-status-rejected">Отклонен</span>;
      case 'needs_revision':
        return <span className="badge badge-status-revision">На доработке</span>;
      case 'under_review':
        return <span className="badge badge-status-review">На рассмотрении</span>;
      case 'draft':
      default:
        return <span className="badge badge-status-draft">Черновик</span>;
    }
  };

  return (
    <div className="animate-fade-in" style={{ maxWidth: '1080px', margin: '32px auto 60px', padding: '0 24px' }}>
      
      {/* HEADER BAR & CONTROLS */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '28px', flexWrap: 'wrap', gap: '16px' }}>
        
        {/* PILL NAVIGATION TABS */}
        <div style={{ 
          display: 'flex', 
          gap: '6px', 
          background: 'rgba(18, 24, 36, 0.8)', 
          padding: '5px', 
          borderRadius: 'var(--radius-pill)', 
          border: '1px solid var(--border-subtle)',
          boxShadow: 'var(--shadow-sm)'
        }}>
          {[
            { id: 'my', label: 'Мои проекты' },
            { id: 'all', label: 'Все проекты' },
            { id: 'active', label: 'Актуальные' },
            { id: 'archive', label: 'Архив' },
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id as any)}
              style={{
                background: activeTab === tab.id ? 'var(--primary-gradient)' : 'transparent',
                color: activeTab === tab.id ? '#ffffff' : 'var(--text-secondary)',
                border: 'none',
                padding: '7px 18px',
                borderRadius: 'var(--radius-pill)',
                fontSize: '0.84rem',
                fontWeight: 600,
                cursor: 'pointer',
                transition: 'all 0.25s cubic-bezier(0.16, 1, 0.3, 1)',
                boxShadow: activeTab === tab.id ? '0 4px 14px var(--primary-glow)' : 'none'
              }}
            >
              {tab.label}
            </button>
          ))}
        </div>

        {/* CREATE BILL BUTTON */}
        <button onClick={onNewBill} className="btn btn-primary" style={{ borderRadius: 'var(--radius-pill)', padding: '9px 22px' }}>
          <Plus size={16} /> Создать проект
        </button>
      </div>

      {/* SEARCH BAR */}
      <div style={{ position: 'relative', marginBottom: '28px' }}>
        <Search 
          size={18} 
          color="var(--text-muted)" 
          style={{ position: 'absolute', left: '18px', top: '50%', transform: 'translateY(-50%)', pointerEvents: 'none' }} 
        />
        <input 
          type="text" 
          placeholder="Поиск по закону, статьям или автору инициативы..." 
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="input-field"
          style={{
            width: '100%',
            padding: '14px 20px 14px 48px',
            fontSize: '0.92rem',
            borderRadius: 'var(--radius-md)'
          }}
        />
      </div>

      {/* BILLS LIST */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
        {filteredBills.length === 0 ? (
          <div className="card" style={{ textAlign: 'center', padding: '64px 20px', color: 'var(--text-muted)' }}>
            <FileText size={48} style={{ opacity: 0.25, margin: '0 auto 16px' }} />
            <p style={{ fontSize: '0.95rem', margin: 0, fontWeight: 500 }}>Законопроекты не найдены</p>
          </div>
        ) : (
          filteredBills.map((bill) => (
            <div 
              key={bill.id}
              onClick={() => onSelectBill(bill)}
              className="card card-hover"
              style={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                padding: '22px 28px'
              }}
            >
              <div style={{ flex: 1, paddingRight: '24px' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '14px', marginBottom: '10px' }}>
                  <h3 style={{ margin: 0, fontSize: '1.05rem', fontWeight: 600, color: 'var(--text-primary)' }}>
                    {bill.targetLaw || bill.title || 'Законопроект без названия'}
                  </h3>
                  {getStatusBadge(bill.status)}
                </div>
                
                <div style={{ display: 'flex', alignItems: 'center', gap: '20px', fontSize: '0.82rem', color: 'var(--text-muted)', flexWrap: 'wrap' }}>
                  <span style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                    <UserIcon size={14} color="var(--primary-hover)" /> 
                    <strong style={{ color: 'var(--text-secondary)', fontWeight: 500 }}>{bill.author}</strong>
                  </span>
                  <span style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                    <Calendar size={14} color="var(--text-muted)" /> 
                    <strong style={{ color: 'var(--text-secondary)', fontWeight: 500 }}>{formatDate(bill.updatedAt)}</strong>
                  </span>
                  <span style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                    <Layers size={14} color="var(--text-muted)" /> 
                    Статей: <strong style={{ color: 'var(--text-secondary)', fontWeight: 500 }}>{bill.comparisons.length}</strong>
                  </span>
                </div>
              </div>
              
              <div style={{ 
                width: '36px', height: '36px', borderRadius: '50%', 
                background: 'rgba(255, 255, 255, 0.03)', border: '1px solid var(--border-subtle)',
                display: 'flex', alignItems: 'center', justifyContent: 'center'
              }}>
                <ChevronRight size={18} color="var(--text-muted)" />
              </div>
            </div>
          ))
        )}
      </div>

    </div>
  );
};
