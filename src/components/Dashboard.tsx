import React, { useState, useMemo } from 'react';
import type { Bill, BillStatus, UserProfile } from '../types/bill';
import { 
  Search, 
  ChevronRight,
  FileText
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

  // Filter bills based on active tab and search
  const filteredBills = useMemo(() => {
    return bills
      .filter((b) => {
        // Exclude drafts of other users
        if (b.status === 'draft' && b.author.trim() !== currentFullName) return false;
        
        // Tab filtering
        if (activeTab === 'my') {
          if (b.author.trim() !== currentFullName) return false;
        } else if (activeTab === 'active') {
          if (b.status === 'approved' || b.status === 'rejected' || b.status === 'draft') return false;
        } else if (activeTab === 'archive') {
          if (b.status !== 'approved' && b.status !== 'rejected') return false;
        }

        // Search filtering
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
        return <span className="badge badge-status-revision">Отправлен на доработку</span>;
      case 'under_review':
        return <span className="badge badge-status-review">На рассмотрении</span>;
      case 'draft':
      default:
        return <span className="badge badge-status-draft">Черновик</span>;
    }
  };

  return (
    <div style={{ maxWidth: '1024px', margin: '0 auto', padding: '0 24px 60px' }}>
      
      {/* Top Controls Row */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '24px' }}>
        
        {/* Pills Navigation */}
        <div style={{ display: 'flex', gap: '8px' }}>
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
                background: activeTab === tab.id ? 'var(--primary)' : 'transparent',
                color: activeTab === tab.id ? '#fff' : 'var(--text-secondary)',
                border: 'none',
                padding: '6px 16px',
                borderRadius: '20px',
                fontSize: '0.85rem',
                fontWeight: 500,
                cursor: 'pointer',
                transition: 'all 0.2s ease',
              }}
            >
              {tab.label}
            </button>
          ))}
        </div>

        {/* Action Button */}
        <button onClick={onNewBill} className="btn btn-primary" style={{ borderRadius: '20px', padding: '6px 20px' }}>
          + Создать проект
        </button>
      </div>

      {/* Search Bar */}
      <div style={{ position: 'relative', marginBottom: '24px' }}>
        <Search 
          size={16} 
          color="var(--text-muted)" 
          style={{ position: 'absolute', left: '16px', top: '50%', transform: 'translateY(-50%)' }} 
        />
        <input 
          type="text" 
          placeholder="Поиск по закону или автору..." 
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          style={{
            width: '100%',
            background: 'var(--bg-input)',
            border: 'none',
            borderRadius: 'var(--radius-md)',
            padding: '12px 16px 12px 42px',
            color: 'var(--text-primary)',
            fontSize: '0.9rem',
            outline: 'none',
          }}
        />
      </div>

      {/* Bills List */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
        {filteredBills.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '60px 0', color: 'var(--text-muted)' }}>
            <FileText size={48} style={{ opacity: 0.2, margin: '0 auto 16px' }} />
            <p style={{ fontSize: '0.9rem' }}>Законопроекты не найдены</p>
          </div>
        ) : (
          filteredBills.map((bill) => (
            <div 
              key={bill.id}
              onClick={() => onSelectBill(bill)}
              className="card card-hover"
              style={{
                cursor: 'pointer',
                padding: '20px 24px',
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                background: 'var(--bg-surface)'
              }}
            >
              <div style={{ flex: 1, paddingRight: '24px' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '8px' }}>
                  <h3 style={{ margin: 0, fontSize: '1rem', fontWeight: 600, color: 'var(--text-primary)' }}>
                    {bill.targetLaw || bill.title || 'Новый законопроект'}
                  </h3>
                  {getStatusBadge(bill.status)}
                </div>
                
                <div style={{ display: 'flex', alignItems: 'center', gap: '16px', fontSize: '0.8rem', color: 'var(--text-muted)' }}>
                  <span>Автор: <strong style={{ color: 'var(--text-secondary)', fontWeight: 500 }}>{bill.author}</strong></span>
                  <span>Изменено: <strong style={{ color: 'var(--text-secondary)', fontWeight: 500 }}>{formatDate(bill.updatedAt)}</strong></span>
                  <span>Статей: <strong style={{ color: 'var(--text-secondary)', fontWeight: 500 }}>{bill.comparisons.length}</strong></span>
                </div>
              </div>
              
              <ChevronRight size={20} color="var(--text-muted)" />
            </div>
          ))
        )}
      </div>

    </div>
  );
};
