import React, { useState, useMemo } from 'react';
import type { Bill, BillStatus, UserProfile } from '../types/bill';
import { isSystemAdmin } from '../services/securityService';
import { 
  Search, 
  ChevronRight,
  FileText,
  Plus,
  Calendar,
  User as UserIcon,
  Layers,
  CheckCircle2,
  Clock,
  FileCode2,
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
    <div className="animate-fade-in" style={{ maxWidth: '1240px', margin: '24px auto 60px', padding: '0 24px' }}>
      
      {/* HERO SECTION */}
      <div style={{
        background: 'var(--bg-surface)',
        border: '1px solid var(--border-subtle)',
        borderRadius: 'var(--radius-lg)',
        padding: '28px 32px',
        marginBottom: '24px',
        boxShadow: 'var(--shadow-sm)',
        position: 'relative',
        overflow: 'hidden'
      }}>
        <div style={{ position: 'relative', zIndex: 1, display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '20px' }}>
          <div>
            <div style={{ display: 'inline-flex', alignItems: 'center', gap: '6px', padding: '3px 10px', borderRadius: 'var(--radius-pill)', background: 'rgba(56, 189, 248, 0.08)', border: '1px solid rgba(56, 189, 248, 0.2)', color: 'var(--text-accent)', fontSize: '0.72rem', fontFamily: 'var(--font-mono)', fontWeight: 600, marginBottom: '10px' }}>
              <img src="/logo.png" alt="Seal" style={{ width: '16px', height: '16px', objectFit: 'contain' }} /> LEGISLATURE • STATE OF SAN ANDREAS
            </div>
            <h2 style={{ fontSize: '1.6rem', fontWeight: 800, margin: '0 0 6px 0', letterSpacing: '-0.02em', color: 'var(--text-primary)' }}>
              Законотворческий Портал
            </h2>
            <p style={{ margin: 0, fontSize: '0.88rem', color: 'var(--text-secondary)', maxWidth: '640px' }}>
              Государственный реестр законопроектов, экспертизы Комиссии и регистрации нормативных актов Штата San Andreas.
            </p>
          </div>

          <button onClick={onNewBill} className="btn btn-primary btn-pill" style={{ padding: '10px 22px', fontSize: '0.86rem', fontWeight: 700 }}>
            <Plus size={16} /> Внести законопроект
          </button>
        </div>

        {/* QUICK STATS CARDS */}
        <div style={{ 
          display: 'grid', 
          gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', 
          gap: '12px', 
          marginTop: '24px', 
          paddingTop: '18px', 
          borderTop: '1px solid var(--border-subtle)' 
        }}>
          <div className="stat-card">
            <div className="stat-icon-wrapper">
              <FileCode2 size={18} />
            </div>
            <div style={{ flex: 1 }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '6px' }}>
                <div style={{ fontSize: '1.25rem', fontWeight: 800, color: 'var(--text-primary)', fontFamily: 'var(--font-mono)', lineHeight: 1.1 }}>{stats.total}</div>
                <span style={{ fontSize: '0.64rem', padding: '1px 6px', borderRadius: '4px', background: 'rgba(56, 189, 248, 0.1)', color: 'var(--text-accent)', fontFamily: 'var(--font-mono)', fontWeight: 600 }}>РЕЕСТР</span>
              </div>
              <div className="tech-label" style={{ marginTop: '2px' }}>Всего актов</div>
            </div>
          </div>

          <div className="stat-card">
            <div className="stat-icon-wrapper" style={{ background: 'var(--warning-bg)', color: 'var(--warning-text)', borderColor: 'var(--warning-border)' }}>
              <Clock size={18} />
            </div>
            <div style={{ flex: 1 }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '6px' }}>
                <div style={{ fontSize: '1.25rem', fontWeight: 800, color: 'var(--warning-text)', fontFamily: 'var(--font-mono)', lineHeight: 1.1 }}>{stats.active}</div>
                <span style={{ fontSize: '0.64rem', padding: '1px 6px', borderRadius: '4px', background: 'var(--warning-bg)', color: 'var(--warning-text)', fontFamily: 'var(--font-mono)', fontWeight: 600 }}>КВОРУМ 2/3</span>
              </div>
              <div className="tech-label" style={{ marginTop: '2px' }}>На рассмотрении</div>
            </div>
          </div>

          <div className="stat-card">
            <div className="stat-icon-wrapper" style={{ background: 'var(--success-bg)', color: 'var(--success-text)', borderColor: 'var(--success-border)' }}>
              <CheckCircle2 size={18} />
            </div>
            <div style={{ flex: 1 }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '6px' }}>
                <div style={{ fontSize: '1.25rem', fontWeight: 800, color: 'var(--success-text)', fontFamily: 'var(--font-mono)', lineHeight: 1.1 }}>{stats.approved}</div>
                <span style={{ fontSize: '0.64rem', padding: '1px 6px', borderRadius: '4px', background: 'var(--success-bg)', color: 'var(--success-text)', fontFamily: 'var(--font-mono)', fontWeight: 600 }}>АКТИВНЫ</span>
              </div>
              <div className="tech-label" style={{ marginTop: '2px' }}>Вступили в силу</div>
            </div>
          </div>

          <div className="stat-card">
            <div className="stat-icon-wrapper" style={{ background: 'rgba(255,255,255,0.04)', color: 'var(--text-secondary)', borderColor: 'var(--border-subtle)' }}>
              <UserIcon size={18} />
            </div>
            <div style={{ flex: 1 }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '6px' }}>
                <div style={{ fontSize: '1.25rem', fontWeight: 800, color: 'var(--text-primary)', fontFamily: 'var(--font-mono)', lineHeight: 1.1 }}>{stats.myCount}</div>
                <span style={{ fontSize: '0.64rem', padding: '1px 6px', borderRadius: '4px', background: 'rgba(255,255,255,0.05)', color: 'var(--text-secondary)', fontFamily: 'var(--font-mono)', fontWeight: 600 }}>ПРИВАТНО</span>
              </div>
              <div className="tech-label" style={{ marginTop: '2px' }}>Мои инициативы</div>
            </div>
          </div>
        </div>
      </div>

      {/* FILTER TABS & SEARCH BAR */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '20px', flexWrap: 'wrap', gap: '14px' }}>
        
        {/* SEGMENTED TABS */}
        <div style={{ 
          display: 'flex', 
          gap: '3px', 
          background: 'var(--bg-surface)', 
          padding: '4px', 
          borderRadius: 'var(--radius-pill)', 
          border: '1px solid var(--border-subtle)'
        }}>
          {[
            { id: 'all', label: 'Все проекты', icon: FileText },
            { id: 'active', label: 'На рассмотрении', icon: Clock },
            { id: 'my', label: 'Мои проекты', icon: UserIcon },
            { id: 'approved', label: 'Вступили в силу', icon: CheckCircle2 }
          ].map((tab) => {
            const Icon = tab.icon;
            const isActive = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id as any)}
                className="btn btn-pill"
                style={{
                  background: isActive ? 'var(--primary-gradient)' : 'transparent',
                  color: isActive ? '#ffffff' : 'var(--text-secondary)',
                  border: 'none',
                  padding: '6px 16px',
                  fontSize: '0.8rem',
                  fontWeight: 600,
                  boxShadow: isActive ? '0 2px 10px var(--primary-glow)' : 'none'
                }}
              >
                <Icon size={13} /> {tab.label}
              </button>
            );
          })}
        </div>

        {/* SEARCH INPUT */}
        <div style={{ position: 'relative', minWidth: '300px', flex: 1, maxWidth: '440px' }}>
          <Search 
            size={15} 
            color="var(--text-muted)" 
            style={{ position: 'absolute', left: '16px', top: '50%', transform: 'translateY(-50%)', pointerEvents: 'none' }} 
          />
          <input 
            type="text" 
            placeholder="Поиск по названию, автору или номеру..." 
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="input-field"
            style={{
              padding: '9px 18px 9px 40px',
              fontSize: '0.84rem',
              borderRadius: 'var(--radius-pill)'
            }}
          />
        </div>
      </div>

      {/* BILLS REGISTRY LIST */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
        {filteredBills.length === 0 ? (
          <div className="card" style={{ textAlign: 'center', padding: '56px 20px', color: 'var(--text-muted)' }}>
            <FileText size={40} style={{ opacity: 0.25, margin: '0 auto 14px', color: 'var(--text-accent)' }} />
            <h3 style={{ fontSize: '1.05rem', margin: '0 0 4px 0', fontWeight: 700, color: 'var(--text-primary)' }}>
              Законопроекты не найдены
            </h3>
            <p style={{ fontSize: '0.84rem', margin: 0, color: 'var(--text-muted)' }}>
              В выбранном разделе нет документов, удовлетворяющих условиям поиска.
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
                  padding: '18px 24px'
                }}
              >
                <div style={{ flex: 1, paddingRight: '20px', minWidth: 0 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '8px', flexWrap: 'wrap' }}>
                    <span className="decree-stamp">
                      {decreeStamp}
                    </span>
                    {getStatusBadge(bill.status)}
                    <span style={{ 
                      padding: '2px 8px', 
                      borderRadius: 'var(--radius-pill)', 
                      background: 'rgba(255, 255, 255, 0.04)', 
                      border: '1px solid var(--border-subtle)', 
                      color: 'var(--text-secondary)', 
                      fontSize: '0.7rem', 
                      fontFamily: 'var(--font-mono)' 
                    }}>
                      {bill.authorRole || 'Официальная инициатива'}
                    </span>
                  </div>

                  <h3 style={{ margin: '0 0 6px 0', fontSize: '1.02rem', fontWeight: 700, color: 'var(--text-primary)', letterSpacing: '-0.01em', lineHeight: 1.3 }}>
                    {bill.targetLaw || bill.title || 'Внесение изменений в закон'}
                  </h3>
                  
                  {bill.explanatoryNote && (
                    <p style={{ fontSize: '0.82rem', color: 'var(--text-secondary)', margin: '0 0 10px 0', lineHeight: 1.4, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                      {bill.explanatoryNote}
                    </p>
                  )}

                  {/* FOOTER METADATA */}
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '0.75rem', color: 'var(--text-muted)', flexWrap: 'wrap', fontFamily: 'var(--font-mono)' }}>
                    <span style={{ display: 'flex', alignItems: 'center', gap: '5px' }}>
                      <UserIcon size={12} color="var(--text-accent)" /> 
                      <span style={{ color: 'var(--text-primary)', fontWeight: 600 }}>{bill.author}</span>
                    </span>
                    <span style={{ opacity: 0.3 }}>•</span>
                    <span style={{ display: 'flex', alignItems: 'center', gap: '5px' }}>
                      <Calendar size={12} color="var(--text-muted)" /> 
                      <span>{formatDate(bill.updatedAt)}</span>
                    </span>
                    <span style={{ opacity: 0.3 }}>•</span>
                    <span style={{ display: 'flex', alignItems: 'center', gap: '5px' }}>
                      <Layers size={12} color="var(--text-muted)" /> 
                      <span>Статей: <strong style={{ color: 'var(--text-accent)' }}>{bill.comparisons.length}</strong></span>
                    </span>
                  </div>
                </div>
                
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexShrink: 0 }}>
                  {canDelete && (
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        onDeleteBill(bill.id);
                      }}
                      className="btn btn-ghost"
                      style={{
                        padding: '7px',
                        color: 'var(--danger-text)',
                        borderRadius: '50%',
                        background: 'rgba(244, 63, 94, 0.08)',
                        border: '1px solid rgba(244, 63, 94, 0.2)'
                      }}
                      title="Удалить законопроект"
                    >
                      <Trash2 size={14} />
                    </button>
                  )}

                  <div style={{ 
                    width: '34px', height: '34px', borderRadius: '50%', 
                    background: 'var(--bg-input)', border: '1px solid var(--border-subtle)',
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    flexShrink: 0
                  }}>
                    <ChevronRight size={16} color="var(--text-accent)" />
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
