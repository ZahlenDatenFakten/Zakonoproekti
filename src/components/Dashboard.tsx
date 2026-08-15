import React, { useState, useMemo } from 'react';
import type { Bill, BillStatus, UserProfile } from '../types/bill';
import { isSystemAdmin } from '../services/securityService';
import { 
  Search, 
  ChevronRight,
  Plus, 
  Calendar,
  User as UserIcon,
  Layers,
  Trash2
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
  onDeleteBill,
  onNewBill
}) => {
  const [activeTab, setActiveTab] = useState<'all' | 'my' | 'active' | 'approved'>('all');
  const [searchQuery, setSearchQuery] = useState('');

  const currentFullName = `${user.firstName} ${user.lastName}`.trim();

  // Statistics calculation
  const stats = useMemo(() => {
    const total = bills.length;
    const active = bills.filter(b => b.status === 'under_review' || b.status === 'needs_revision' || b.status === 'draft').length;
    const approved = bills.filter(b => b.status === 'approved').length;
    const myCount = bills.filter(b => b.author.trim() === currentFullName).length;
    return { total, active, approved, myCount };
  }, [bills, currentFullName]);

  // Tab filtering logic
  const filteredBills = useMemo(() => {
    return bills
      .filter((b) => {
        // Drafts remain private to their author (and Admin) until submitted
        if (b.status === 'draft' && b.author.trim() !== currentFullName && !isSystemAdmin(user)) {
          return false;
        }

        if (activeTab === 'my') {
          if (b.author.trim() !== currentFullName) return false;
        } else if (activeTab === 'active') {
          if (b.status === 'approved' || b.status === 'rejected') return false;
        } else if (activeTab === 'approved') {
          if (b.status !== 'approved') return false;
        }

        if (searchQuery) {
          const query = searchQuery.toLowerCase();
          return (
            b.targetLaw.toLowerCase().includes(query) ||
            b.author.toLowerCase().includes(query) ||
            (b.title && b.title.toLowerCase().includes(query)) ||
            (b.id && b.id.toLowerCase().includes(query))
          );
        }

        return true;
      })
      .sort((a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime());
  }, [bills, activeTab, searchQuery, currentFullName, user]);

  const formatDate = (isoStr: string) => {
    const d = new Date(isoStr);
    return `${d.toLocaleDateString('ru-RU')} ${d.toLocaleTimeString('ru-RU', { hour: '2-digit', minute: '2-digit' })}`;
  };

  const getStatusBadge = (status: BillStatus) => {
    switch (status) {
      case 'approved':
        return (
          <span className="badge badge-status-approved">
            <span className="status-dot status-dot-active" /> Вступил в силу
          </span>
        );
      case 'rejected':
        return (
          <span className="badge badge-status-rejected">
            <span className="status-dot status-dot-danger" /> Отклонен
          </span>
        );
      case 'needs_revision':
        return (
          <span className="badge badge-status-revision">
            <span className="status-dot status-dot-info" /> Доработка
          </span>
        );
      case 'under_review':
        return (
          <span className="badge badge-status-review">
            <span className="status-dot status-dot-review" /> На рассмотрении
          </span>
        );
      case 'draft':
      default:
        return (
          <span className="badge badge-status-draft">
            <span className="status-dot status-dot-draft" /> Черновик
          </span>
        );
    }
  };

  const formatDecreeNumber = (billId: string) => {
    const numericId = billId.replace(/\D/g, '').slice(-4) || '0042';
    return `АКТ № SA-${numericId}`;
  };

  return (
    <div className="animate-fade-in" style={{ maxWidth: '1200px', margin: '20px auto 60px', padding: '0 20px' }}>
      
      {/* COMPACT TOP HEADER */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px', flexWrap: 'wrap', gap: '14px' }}>
        <div>
          <h2 style={{ fontSize: '1.35rem', fontWeight: 700, margin: '0 0 2px 0', color: 'var(--text-primary)' }}>
            Государственный реестр законопроектов
          </h2>
          <p style={{ margin: 0, fontSize: '0.82rem', color: 'var(--text-muted)' }}>
            Электронный архив законодательных актов и экспертиз Штата San Andreas
          </p>
        </div>

        <button 
          onClick={onNewBill} 
          className="btn btn-primary btn-pill" 
          style={{ padding: '8px 18px', fontSize: '0.84rem' }}
        >
          <Plus size={14} /> Внести законопроект
        </button>
      </div>

      {/* COMPACT METRICS STRIP */}
      <div style={{ 
        display: 'grid', 
        gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', 
        gap: '10px', 
        marginBottom: '20px' 
      }}>
        <div className="stat-card">
          <div className="stat-icon-wrapper">
            <Layers size={16} />
          </div>
          <div>
            <div style={{ fontSize: '1.15rem', fontWeight: 700, color: 'var(--text-primary)', fontFamily: 'var(--font-mono)', lineHeight: 1.1 }}>{stats.total}</div>
            <div className="tech-label" style={{ marginTop: '2px' }}>Всего актов</div>
          </div>
        </div>

        <div className="stat-card">
          <div className="stat-icon-wrapper" style={{ background: 'var(--warning-bg)', color: 'var(--warning-text)', borderColor: 'var(--warning-border)' }}>
            <span style={{ fontSize: '0.75rem', fontWeight: 700, fontFamily: 'var(--font-mono)' }}>2/3</span>
          </div>
          <div>
            <div style={{ fontSize: '1.15rem', fontWeight: 700, color: 'var(--warning-text)', fontFamily: 'var(--font-mono)', lineHeight: 1.1 }}>{stats.active}</div>
            <div className="tech-label" style={{ marginTop: '2px' }}>На рассмотрении</div>
          </div>
        </div>

        <div className="stat-card">
          <div className="stat-icon-wrapper" style={{ background: 'var(--success-bg)', color: 'var(--success-text)', borderColor: 'var(--success-border)' }}>
            <span style={{ fontSize: '0.75rem', fontWeight: 700, fontFamily: 'var(--font-mono)' }}>✓</span>
          </div>
          <div>
            <div style={{ fontSize: '1.15rem', fontWeight: 700, color: 'var(--success-text)', fontFamily: 'var(--font-mono)', lineHeight: 1.1 }}>{stats.approved}</div>
            <div className="tech-label" style={{ marginTop: '2px' }}>Вступили в силу</div>
          </div>
        </div>

        <div className="stat-card">
          <div className="stat-icon-wrapper" style={{ background: 'rgba(255,255,255,0.03)', color: 'var(--text-secondary)', borderColor: 'var(--border-subtle)' }}>
            <UserIcon size={16} />
          </div>
          <div>
            <div style={{ fontSize: '1.15rem', fontWeight: 700, color: 'var(--text-primary)', fontFamily: 'var(--font-mono)', lineHeight: 1.1 }}>{stats.myCount}</div>
            <div className="tech-label" style={{ marginTop: '2px' }}>Мои проекты</div>
          </div>
        </div>
      </div>

      {/* FILTER TABS & SEARCH */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '16px', flexWrap: 'wrap', gap: '12px' }}>
        
        {/* TABS */}
        <div style={{ 
          display: 'flex', 
          gap: '2px', 
          background: 'var(--bg-surface)', 
          padding: '3px', 
          borderRadius: 'var(--radius-pill)', 
          border: '1px solid var(--border-subtle)'
        }}>
          {[
            { id: 'all', label: 'Все' },
            { id: 'active', label: 'На рассмотрении' },
            { id: 'approved', label: 'Вступили в силу' },
            { id: 'my', label: 'Мои проекты' }
          ].map((tab) => {
            const isActive = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id as any)}
                className="btn btn-pill"
                style={{
                  background: isActive ? 'var(--bg-surface-active)' : 'transparent',
                  color: isActive ? 'var(--text-primary)' : 'var(--text-muted)',
                  border: 'none',
                  padding: '5px 14px',
                  fontSize: '0.78rem',
                  fontWeight: 500
                }}
              >
                {tab.label}
              </button>
            );
          })}
        </div>

        {/* SEARCH INPUT */}
        <div style={{ position: 'relative', minWidth: '260px', flex: 1, maxWidth: '380px' }}>
          <Search 
            size={14} 
            color="var(--text-muted)" 
            style={{ position: 'absolute', left: '14px', top: '50%', transform: 'translateY(-50%)', pointerEvents: 'none' }} 
          />
          <input 
            type="text" 
            placeholder="Поиск по законам, автору или номеру..." 
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="input-field"
            style={{
              padding: '7px 14px 7px 34px',
              fontSize: '0.8rem',
              borderRadius: 'var(--radius-pill)'
            }}
          />
        </div>
      </div>

      {/* BILLS LIST */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
        {filteredBills.length === 0 ? (
          <div className="card" style={{ textAlign: 'center', padding: '48px 20px', color: 'var(--text-muted)' }}>
            <p style={{ margin: 0, fontSize: '0.84rem' }}>
              Законопроекты не найдены.
            </p>
          </div>
        ) : (
          filteredBills.map((bill) => {
            const decreeStamp = formatDecreeNumber(bill.id);
            const isAuthor = !bill.author || bill.author.trim().toLowerCase() === currentFullName.toLowerCase() || bill.author.trim() === currentFullName || isSystemAdmin(user);
            const canDelete = isAuthor || isSystemAdmin(user);

            return (
              <div 
                key={bill.id}
                onClick={() => onSelectBill(bill)}
                className="card card-hover"
                style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  padding: '14px 18px'
                }}
              >
                <div style={{ flex: 1, paddingRight: '16px', minWidth: 0 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '4px', flexWrap: 'wrap' }}>
                    <span className="decree-stamp">
                      {decreeStamp}
                    </span>
                    {getStatusBadge(bill.status)}
                    <span style={{ 
                      fontSize: '0.7rem', 
                      color: 'var(--text-muted)', 
                      fontFamily: 'var(--font-mono)' 
                    }}>
                      {bill.authorRole || 'Инициатива'}
                    </span>
                  </div>

                  <h3 style={{ margin: '0 0 4px 0', fontSize: '0.94rem', fontWeight: 600, color: 'var(--text-primary)', lineHeight: 1.3 }}>
                    {bill.targetLaw || bill.title || 'Внесение изменений в закон'}
                  </h3>
                  
                  {bill.explanatoryNote && (
                    <p style={{ fontSize: '0.78rem', color: 'var(--text-secondary)', margin: '0 0 6px 0', lineHeight: 1.4, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                      {bill.explanatoryNote}
                    </p>
                  )}

                  {/* METADATA LINE */}
                  <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '0.72rem', color: 'var(--text-muted)', flexWrap: 'wrap', fontFamily: 'var(--font-mono)' }}>
                    <span>{bill.author}</span>
                    <span style={{ opacity: 0.3 }}>•</span>
                    <span style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                      <Calendar size={11} /> 
                      <span>{formatDate(bill.updatedAt)}</span>
                    </span>
                    <span style={{ opacity: 0.3 }}>•</span>
                    <span>Статей: <strong style={{ color: 'var(--text-accent)' }}>{bill.comparisons.length}</strong></span>
                  </div>
                </div>
                
                <div style={{ display: 'flex', alignItems: 'center', gap: '6px', flexShrink: 0 }}>
                  {canDelete && (
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        onDeleteBill(bill.id);
                      }}
                      className="btn btn-ghost btn-icon"
                      style={{ color: 'var(--danger-text)', width: '28px', height: '28px' }}
                      title="Удалить законопроект"
                    >
                      <Trash2 size={13} />
                    </button>
                  )}

                  <div style={{ color: 'var(--text-muted)', display: 'flex', alignItems: 'center' }}>
                    <ChevronRight size={15} />
                  </div>
                </div>
              </div>
            );
          })
        )}
      </div>

    </div>
  );
};
