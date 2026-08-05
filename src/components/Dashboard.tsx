import React, { useState, useMemo } from 'react';
import type { Bill, BillStatus, UserProfile } from '../types/bill';
import { CustomSelect } from './CustomSelect';
import { 
  Search, 
  CheckCircle2, 
  XCircle, 
  Clock, 
  FileText, 
  Share2, 
  Trash2, 
  User as UserIcon, 
  Eye, 
  Calendar,
  Layers,
  Plus,
  RotateCcw,
  Users
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
  onShareBill,
  onDeleteBill,
  onNewBill
}) => {
  const [activeTab, setActiveTab] = useState<BillStatus | 'all'>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [sortBy, setSortBy] = useState<'date' | 'title'>('date');

  const currentFullName = `${user.firstName} ${user.lastName}`.trim();

  // Filter out private drafts created by other users!
  const visibleBills = useMemo(() => {
    return bills.filter((b) => {
      if (b.status === 'draft') {
        return b.author.trim() === currentFullName;
      }
      return true;
    });
  }, [bills, currentFullName]);

  // Statistics calculation
  const stats = useMemo(() => {
    return {
      total: visibleBills.length,
      under_review: visibleBills.filter((b) => b.status === 'under_review').length,
      needs_revision: visibleBills.filter((b) => b.status === 'needs_revision').length,
      approved: visibleBills.filter((b) => b.status === 'approved').length,
      rejected: visibleBills.filter((b) => b.status === 'rejected').length,
      draft: visibleBills.filter((b) => b.status === 'draft').length
    };
  }, [visibleBills]);

  // Filtered & Sorted bills
  const filteredBills = useMemo(() => {
    return visibleBills
      .filter((bill) => {
        const matchesStatus = activeTab === 'all' || bill.status === activeTab;
        const query = searchQuery.toLowerCase();
        const matchesSearch =
          bill.title.toLowerCase().includes(query) ||
          bill.targetLaw.toLowerCase().includes(query) ||
          (bill.lawCode && bill.lawCode.toLowerCase().includes(query)) ||
          bill.author.toLowerCase().includes(query);
        return matchesStatus && matchesSearch;
      })
      .sort((a, b) => {
        if (sortBy === 'title') {
          return a.title.localeCompare(b.title);
        }
        return new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime();
      });
  }, [visibleBills, activeTab, searchQuery, sortBy]);

  const getStatusBadge = (status: BillStatus) => {
    switch (status) {
      case 'approved':
        return <span className="badge-status badge-approved"><CheckCircle2 size={13} /> Одобрен</span>;
      case 'rejected':
        return <span className="badge-status badge-rejected"><XCircle size={13} /> Отклонен</span>;
      case 'needs_revision':
        return <span className="badge-status" style={{ background: 'rgba(59, 130, 246, 0.12)', color: '#93c5fd', borderColor: 'rgba(59, 130, 246, 0.3)' }}><RotateCcw size={13} /> На доработке</span>;
      case 'under_review':
        return <span className="badge-status badge-under_review"><Clock size={13} /> На рассмотрении</span>;
      case 'draft':
      default:
        return <span className="badge-status badge-draft"><FileText size={13} /> Личный черновик</span>;
    }
  };

  return (
    <div style={{ maxWidth: '1240px', margin: '0 auto', padding: '0 24px 60px 24px' }}>
      
      {/* Counters & Filter Tabs */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '14px', marginBottom: '20px' }}>
        
        {/* Status Filter Buttons */}
        <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap' }}>
          {[
            { key: 'all', label: `Все (${stats.total})` },
            { key: 'under_review', label: `⏳ На рассмотрении (${stats.under_review})` },
            { key: 'needs_revision', label: `🔄 На доработке (${stats.needs_revision})` },
            { key: 'approved', label: `✅ Одобренные (${stats.approved})` },
            { key: 'rejected', label: `❌ Отклоненные (${stats.rejected})` },
            { key: 'draft', label: `🔒 Мои черновики (${stats.draft})` }
          ].map((tab) => (
            <button
              key={tab.key}
              onClick={() => setActiveTab(tab.key as any)}
              className="btn btn-secondary"
              style={{
                fontSize: '0.82rem',
                padding: '6px 14px',
                borderRadius: '6px',
                background: activeTab === tab.key ? 'var(--bg-input)' : 'transparent',
                borderColor: activeTab === tab.key ? 'var(--border-medium)' : 'transparent',
                color: activeTab === tab.key ? 'var(--text-primary)' : 'var(--text-secondary)'
              }}
            >
              {tab.label}
            </button>
          ))}
        </div>

        {/* Search */}
        <div style={{ display: 'flex', gap: '10px', width: '100%', maxWidth: '380px' }}>
          <div style={{ position: 'relative', width: '100%' }}>
            <Search size={15} style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-tertiary)' }} />
            <input
              type="text"
              className="input-field"
              placeholder="Поиск законопроекта..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              style={{ paddingLeft: '36px', fontSize: '0.85rem' }}
            />
          </div>

          <CustomSelect
            options={[
              { value: 'date', label: 'По дате' },
              { value: 'title', label: 'По названию' }
            ]}
            value={sortBy}
            onChange={(val) => setSortBy(val as any)}
            width="135px"
          />
        </div>
      </div>

      {/* Bill List Cards */}
      {filteredBills.length === 0 ? (
        <div className="card-dark" style={{ padding: '48px 20px', textAlign: 'center', color: 'var(--text-tertiary)' }}>
          <Layers size={36} color="var(--text-tertiary)" style={{ opacity: 0.5, marginBottom: '12px' }} />
          <h3 style={{ fontSize: '1.05rem', color: 'var(--text-primary)', marginBottom: '6px' }}>
            Список пуст
          </h3>
          <p style={{ fontSize: '0.85rem', marginBottom: '16px' }}>
            Законопроектов в выбранной категории не найдено.
          </p>
          <button onClick={onNewBill} className="btn btn-primary" style={{ fontSize: '0.85rem' }}>
            <Plus size={15} /> Создать новый проект
          </button>
        </div>
      ) : (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(360px, 1fr))', gap: '16px' }}>
          {filteredBills.map((bill) => {
            const voteCount = bill.votes ? Object.keys(bill.votes).length : 0;
            return (
              <div key={bill.id} className="card-dark" style={{ padding: '20px', display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}>
                <div>
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '10px' }}>
                    {getStatusBadge(bill.status)}
                    
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                      {bill.status === 'under_review' && (
                        <span style={{ fontSize: '0.75rem', background: 'var(--bg-input)', color: 'var(--text-secondary)', padding: '2px 8px', borderRadius: '4px', border: '1px solid var(--border-subtle)', display: 'flex', alignItems: 'center', gap: '4px' }}>
                          <Users size={11} /> Голосы: {voteCount}/3
                        </span>
                      )}
                      <span style={{ fontSize: '0.75rem', color: 'var(--text-tertiary)', fontFamily: 'var(--font-mono)' }}>
                        {bill.lawCode || 'БЕЗ НОМЕРА'}
                      </span>
                    </div>
                  </div>

                  <div style={{ fontSize: '0.78rem', color: 'var(--text-secondary)', marginBottom: '8px' }}>
                    Целевой закон: <strong style={{ color: 'var(--text-primary)' }}>{bill.targetLaw}</strong>
                  </div>

                  <h3 
                    onClick={() => onSelectBill(bill)}
                    style={{ 
                      fontSize: '1.02rem', 
                      fontWeight: 600, 
                      color: 'var(--text-primary)', 
                      lineHeight: 1.4, 
                      marginBottom: '10px',
                      cursor: 'pointer'
                    }}
                  >
                    {bill.title}
                  </h3>

                  {bill.statusReason && (
                    <div style={{ fontSize: '0.78rem', color: 'var(--text-tertiary)', background: 'var(--bg-input)', padding: '6px 10px', borderRadius: '6px', marginBottom: '14px' }}>
                      {bill.statusReason}
                    </div>
                  )}
                </div>

                <div>
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', fontSize: '0.78rem', color: 'var(--text-tertiary)', paddingTop: '10px', borderTop: '1px solid var(--border-subtle)', marginBottom: '12px' }}>
                    <span style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                      <UserIcon size={12} /> {bill.author}
                    </span>
                    <span style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                      <Calendar size={12} /> {new Date(bill.updatedAt).toLocaleDateString('ru-RU')}
                    </span>
                  </div>

                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <button 
                      onClick={() => onSelectBill(bill)} 
                      className="btn btn-primary" 
                      style={{ flex: 1, fontSize: '0.82rem', padding: '6px 10px' }}
                    >
                      <Eye size={14} /> Открыть
                    </button>

                    <button 
                      onClick={() => onShareBill(bill)} 
                      className="btn btn-secondary" 
                      style={{ padding: '6px 9px' }} 
                      title="Ссылки доступа"
                    >
                      <Share2 size={14} />
                    </button>

                    {bill.author.trim() === currentFullName && (
                      <button 
                        onClick={() => onDeleteBill(bill.id)} 
                        className="btn btn-danger" 
                        style={{ padding: '6px 9px' }} 
                        title="Удалить"
                      >
                        <Trash2 size={14} />
                      </button>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};
