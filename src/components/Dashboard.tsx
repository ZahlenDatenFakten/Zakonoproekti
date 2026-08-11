import React, { useState, useMemo } from 'react';
import type { Bill, BillStatus, UserProfile } from '../types/bill';
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
  FileCode2
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
  const [activeTab, setActiveTab] = useState<'all' | 'my' | 'active'>('active');
  const [searchQuery, setSearchQuery] = useState('');

  const currentFullName = `${user.firstName} ${user.lastName}`.trim();

  // Statistics calculation
  const stats = useMemo(() => {
    const total = bills.length;
    const active = bills.filter(b => b.status === 'under_review' || b.status === 'needs_revision').length;
    const approved = bills.filter(b => b.status === 'approved').length;
    const myCount = bills.filter(b => b.author.trim() === currentFullName).length;
    return { total, active, approved, myCount };
  }, [bills, currentFullName]);

  // Tab filtering logic
  const filteredBills = useMemo(() => {
    return bills
      .filter((b) => {
        if (b.status === 'draft' && b.author.trim() !== currentFullName) return false;
        
        if (activeTab === 'my') {
          if (b.author.trim() !== currentFullName) return false;
        } else if (activeTab === 'active') {
          if (b.status === 'approved' || b.status === 'rejected' || b.status === 'draft') return false;
        } else if (activeTab === 'all') {
          if (b.status !== 'approved' && b.status !== 'rejected') return false;
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
  }, [bills, activeTab, searchQuery, currentFullName]);

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

  const formatDecreeNumber = (billIndex: number) => {
    return `№ SA-${String(billIndex).padStart(3, '0')}`;
  };

  return (
    <div className="animate-fade-in" style={{ maxWidth: '1240px', margin: '28px auto 60px', padding: '0 24px' }}>
      
      {/* COMMAND CENTER HERO HEADER */}
      <div style={{
        background: 'linear-gradient(135deg, rgba(18, 21, 30, 0.95) 0%, rgba(22, 26, 36, 0.95) 100%)',
        border: '1px solid var(--border-medium)',
        borderRadius: 'var(--radius-lg)',
        padding: '32px 36px',
        marginBottom: '28px',
        boxShadow: '0 8px 32px rgba(0, 0, 0, 0.5)',
        position: 'relative',
        overflow: 'hidden'
      }}>
        <div style={{ position: 'relative', zIndex: 1, display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '20px' }}>
          <div>
            <div style={{ display: 'inline-flex', alignItems: 'center', gap: '8px', padding: '4px 12px', borderRadius: 'var(--radius-pill)', background: 'rgba(56, 189, 248, 0.08)', border: '1px solid rgba(56, 189, 248, 0.2)', color: 'var(--text-accent)', fontSize: '0.74rem', fontFamily: 'var(--font-mono)', fontWeight: 600, marginBottom: '12px' }}>
              <img src="/logo.png" alt="Seal" style={{ width: '16px', height: '16px', objectFit: 'contain' }} /> LEGISLATURE • STATE OF SAN ANDREAS
            </div>
            <h2 style={{ fontSize: '1.75rem', fontWeight: 800, margin: '0 0 6px 0', letterSpacing: '-0.02em', color: 'var(--text-primary)' }}>
              Законотворческий Портал Реформ
            </h2>
            <p style={{ margin: 0, fontSize: '0.92rem', color: 'var(--text-secondary)', maxWidth: '680px' }}>
              Строгий цифровой реестр законопроектов, правовой экспертизы, голосования Комиссии и регистрации нормативных актов Штата.
            </p>
          </div>

          <button onClick={onNewBill} className="btn btn-primary btn-pill" style={{ padding: '12px 26px', fontSize: '0.9rem' }}>
            <Plus size={18} /> Внести законопроект
          </button>
        </div>

        {/* BENTO QUICK STATS WIDGETS WITH ACTIVITY CHIPS */}
        <div style={{ 
          display: 'grid', 
          gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', 
          gap: '14px', 
          marginTop: '28px', 
          paddingTop: '20px', 
          borderTop: '1px solid var(--border-subtle)' 
        }}>
          <div className="stat-card">
            <div className="stat-icon-wrapper">
              <FileCode2 size={20} />
            </div>
            <div style={{ flex: 1 }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '6px' }}>
                <div style={{ fontSize: '1.3rem', fontWeight: 800, color: 'var(--text-primary)', fontFamily: 'var(--font-mono)', lineHeight: 1.1 }}>{stats.total}</div>
                <span style={{ fontSize: '0.65rem', padding: '2px 6px', borderRadius: '4px', background: 'rgba(56, 189, 248, 0.1)', color: 'var(--text-accent)', border: '1px solid rgba(56, 189, 248, 0.2)', fontFamily: 'var(--font-mono)', fontWeight: 600 }}>РЕЕСТР</span>
              </div>
              <div className="tech-label" style={{ marginTop: '4px' }}>Всего актов</div>
            </div>
          </div>

          <div className="stat-card">
            <div className="stat-icon-wrapper" style={{ background: 'var(--warning-bg)', color: 'var(--warning-text)', borderColor: 'var(--warning-border)' }}>
              <Clock size={20} />
            </div>
            <div style={{ flex: 1 }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '6px' }}>
                <div style={{ fontSize: '1.3rem', fontWeight: 800, color: 'var(--warning-text)', fontFamily: 'var(--font-mono)', lineHeight: 1.1 }}>{stats.active}</div>
                <span style={{ fontSize: '0.65rem', padding: '2px 6px', borderRadius: '4px', background: 'var(--warning-bg)', color: 'var(--warning-text)', border: '1px solid var(--warning-border)', fontFamily: 'var(--font-mono)', fontWeight: 600 }}>КВОРУМ 2/3</span>
              </div>
              <div className="tech-label" style={{ marginTop: '4px' }}>На рассмотрении</div>
            </div>
          </div>

          <div className="stat-card">
            <div className="stat-icon-wrapper" style={{ background: 'var(--success-bg)', color: 'var(--success-text)', borderColor: 'var(--success-border)' }}>
              <CheckCircle2 size={20} />
            </div>
            <div style={{ flex: 1 }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '6px' }}>
                <div style={{ fontSize: '1.3rem', fontWeight: 800, color: 'var(--success-text)', fontFamily: 'var(--font-mono)', lineHeight: 1.1 }}>{stats.approved}</div>
                <span style={{ fontSize: '0.65rem', padding: '2px 6px', borderRadius: '4px', background: 'var(--success-bg)', color: 'var(--success-text)', border: '1px solid var(--success-border)', fontFamily: 'var(--font-mono)', fontWeight: 600 }}>АКТИВНЫ</span>
              </div>
              <div className="tech-label" style={{ marginTop: '4px' }}>Вступили в силу</div>
            </div>
          </div>

          <div className="stat-card">
            <div className="stat-icon-wrapper" style={{ background: 'rgba(255,255,255,0.04)', color: 'var(--text-secondary)', borderColor: 'var(--border-subtle)' }}>
              <UserIcon size={20} />
            </div>
            <div style={{ flex: 1 }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '6px' }}>
                <div style={{ fontSize: '1.3rem', fontWeight: 800, color: 'var(--text-primary)', fontFamily: 'var(--font-mono)', lineHeight: 1.1 }}>{stats.myCount}</div>
                <span style={{ fontSize: '0.65rem', padding: '2px 6px', borderRadius: '4px', background: 'rgba(255,255,255,0.05)', color: 'var(--text-secondary)', border: '1px solid var(--border-subtle)', fontFamily: 'var(--font-mono)', fontWeight: 600 }}>ПРИВАТНО</span>
              </div>
              <div className="tech-label" style={{ marginTop: '4px' }}>Мои инициативы</div>
            </div>
          </div>
        </div>
      </div>

      {/* FILTER CONTROLS & SEARCH */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '24px', flexWrap: 'wrap', gap: '16px' }}>
        
        {/* SEGMENTED CONTROL TABS */}
        <div style={{ 
          display: 'flex', 
          gap: '4px', 
          background: 'var(--bg-surface)', 
          padding: '5px', 
          borderRadius: 'var(--radius-pill)', 
          border: '1px solid var(--border-subtle)',
          boxShadow: 'var(--shadow-sm)',
          backdropFilter: 'blur(12px)'
        }}>
          {[
            { id: 'my', label: 'Мои проекты', icon: UserIcon },
            { id: 'active', label: 'Актуальная реформа', icon: Clock },
            { id: 'all', label: 'Весь реестр', icon: FileText }
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
                  padding: '7px 20px',
                  fontSize: '0.82rem',
                  fontWeight: 600,
                  boxShadow: isActive ? '0 4px 14px var(--primary-glow)' : 'none'
                }}
              >
                <Icon size={14} /> {tab.label}
              </button>
            );
          })}
        </div>

        {/* SEARCH INPUT */}
        <div style={{ position: 'relative', minWidth: '320px', flex: 1, maxWidth: '480px' }}>
          <Search 
            size={16} 
            color="var(--text-muted)" 
            style={{ position: 'absolute', left: '18px', top: '50%', transform: 'translateY(-50%)', pointerEvents: 'none' }} 
          />
          <input 
            type="text" 
            placeholder="Поиск по законам, автору или номеру акта..." 
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="input-field"
            style={{
              padding: '10px 20px 10px 44px',
              fontSize: '0.85rem',
              borderRadius: 'var(--radius-pill)'
            }}
          />
        </div>
      </div>

      {/* BENTO CARDS REFORM REGISTRY LIST */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
        {filteredBills.length === 0 ? (
          <div className="card" style={{ textAlign: 'center', padding: '64px 20px', color: 'var(--text-muted)' }}>
            <FileText size={44} style={{ opacity: 0.3, margin: '0 auto 16px', color: 'var(--text-accent)' }} />
            <h3 style={{ fontSize: '1.1rem', margin: '0 0 6px 0', fontWeight: 700, color: 'var(--text-primary)' }}>
              Законопроекты не найдены
            </h3>
            <p style={{ fontSize: '0.86rem', margin: 0, color: 'var(--text-muted)' }}>
              В выбранном разделе нет документов, соответствующих запросу.
            </p>
          </div>
        ) : (
          filteredBills.map((bill, index) => {
            const decreeStamp = formatDecreeNumber(index);

            return (
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
                  <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '10px', flexWrap: 'wrap' }}>
                    <span className="decree-stamp">
                      {decreeStamp}
                    </span>
                    {getStatusBadge(bill.status)}
                    <span style={{ 
                      padding: '2px 8px', 
                      borderRadius: '6px', 
                      background: 'rgba(255, 255, 255, 0.05)', 
                      border: '1px solid rgba(255, 255, 255, 0.1)', 
                      color: '#cbd5e1', 
                      fontSize: '0.72rem', 
                      fontWeight: 500, 
                      fontFamily: 'var(--font-mono)' 
                    }}>
                      {bill.authorRole || 'Официальная инициатива'}
                    </span>
                  </div>

                  <h3 style={{ margin: '0 0 8px 0', fontSize: '1.1rem', fontWeight: 700, color: 'var(--text-primary)', letterSpacing: '-0.01em', lineHeight: 1.3 }}>
                    {bill.targetLaw || bill.title || 'Внесение изменений в закон'}
                  </h3>
                  
                  {bill.title && bill.targetLaw && (
                    <p style={{ fontSize: '0.86rem', color: 'var(--text-secondary)', margin: '0 0 14px 0', lineHeight: 1.45 }}>
                      {bill.title}
                    </p>
                  )}

                  {/* SINGLE-LINE MONOSPACED FOOTER METADATA */}
                  <div style={{ display: 'flex', alignItems: 'center', gap: '10px', fontSize: '0.78rem', color: 'var(--text-muted)', flexWrap: 'wrap', fontFamily: 'var(--font-mono)' }}>
                    <span style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                      <UserIcon size={13} color="var(--text-accent)" /> 
                      <span style={{ color: '#f8fafc', fontWeight: 600 }}>{bill.author}</span>
                    </span>
                    <span style={{ opacity: 0.35 }}>•</span>
                    <span style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                      <Calendar size={13} color="var(--text-muted)" /> 
                      <span>{formatDate(bill.updatedAt)}</span>
                    </span>
                    <span style={{ opacity: 0.35 }}>•</span>
                    <span style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                      <Layers size={13} color="var(--text-muted)" /> 
                      <span>Статей: <strong style={{ color: 'var(--text-accent)' }}>{bill.comparisons.length}</strong></span>
                    </span>
                  </div>
                </div>
                
                <div style={{ 
                  width: '38px', height: '38px', borderRadius: '50%', 
                  background: 'var(--bg-input)', border: '1px solid var(--border-subtle)',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  flexShrink: 0,
                  transition: 'all 0.2s ease'
                }}>
                  <ChevronRight size={18} color="var(--text-accent)" />
                </div>
              </div>
            );
          })
        )}
      </div>

    </div>
  );
};
