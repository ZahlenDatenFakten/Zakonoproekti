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
  ShieldCheck,
  CheckCircle2,
  Clock,
  Archive,
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
  const [activeTab, setActiveTab] = useState<'all' | 'my' | 'active' | 'archive'>('active');
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
        return <span className="badge badge-status-approved"><CheckCircle2 size={12} /> Одобрен</span>;
      case 'rejected':
        return <span className="badge badge-status-rejected">Отклонен</span>;
      case 'needs_revision':
        return <span className="badge badge-status-revision"><Clock size={12} /> На доработке</span>;
      case 'under_review':
        return <span className="badge badge-status-review"><Clock size={12} /> На рассмотрении</span>;
      case 'draft':
      default:
        return <span className="badge badge-status-draft">Черновик</span>;
    }
  };

  return (
    <div className="animate-fade-in" style={{ maxWidth: '1180px', margin: '28px auto 60px', padding: '0 24px' }}>
      
      {/* HERO BANNER SECTION */}
      <div style={{
        background: 'linear-gradient(135deg, var(--bg-surface) 0%, var(--bg-surface-elevated) 100%)',
        border: '1px solid var(--border-medium)',
        borderRadius: 'var(--radius-lg)',
        padding: '32px 36px',
        marginBottom: '28px',
        boxShadow: 'var(--shadow-sm)',
        position: 'relative',
        overflow: 'hidden'
      }}>
        {/* Glow decoration */}
        <div style={{
          position: 'absolute',
          top: '-40px', right: '-40px',
          width: '180px', height: '180px',
          background: 'var(--primary-glow)',
          borderRadius: '50%',
          filter: 'blur(50px)',
          pointerEvents: 'none'
        }} />

        <div style={{ position: 'relative', zIndex: 1, display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '20px' }}>
          <div>
            <div style={{ display: 'inline-flex', alignItems: 'center', gap: '8px', padding: '4px 12px', borderRadius: 'var(--radius-pill)', background: 'var(--primary-glow)', color: 'var(--text-accent)', fontSize: '0.78rem', fontWeight: 600, marginBottom: '10px' }}>
              <ShieldCheck size={14} /> Официальный реестр Штата San Andreas
            </div>
            <h2 style={{ fontSize: '1.65rem', fontWeight: 800, margin: '0 0 6px 0', letterSpacing: '-0.02em', color: 'var(--text-primary)' }}>
              Законотворческая платформа
            </h2>
            <p style={{ margin: 0, fontSize: '0.92rem', color: 'var(--text-muted)', maxWidth: '640px' }}>
              Создание, экспертиза, обсуждение и публикация поправок в законодательную базу штата в едином цифровом интерфейсе.
            </p>
          </div>

          <button onClick={onNewBill} className="btn btn-primary btn-pill" style={{ padding: '12px 26px', fontSize: '0.92rem' }}>
            <Plus size={18} /> Создать проект
          </button>
        </div>

        {/* QUICK STATS CHIPS */}
        <div style={{ 
          display: 'grid', 
          gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', 
          gap: '14px', 
          marginTop: '24px', 
          paddingTop: '20px', 
          borderTop: '1px solid var(--border-subtle)' 
        }}>
          <div className="stat-card">
            <div className="stat-icon-wrapper">
              <FileCode2 size={20} />
            </div>
            <div>
              <div style={{ fontSize: '1.25rem', fontWeight: 800, color: 'var(--text-primary)', lineHeight: 1.1 }}>{stats.total}</div>
              <div style={{ fontSize: '0.76rem', color: 'var(--text-muted)', fontWeight: 500 }}>Всего проектов</div>
            </div>
          </div>

          <div className="stat-card">
            <div className="stat-icon-wrapper" style={{ background: 'var(--info-bg)', color: 'var(--info-text)', borderColor: 'var(--info-border)' }}>
              <Clock size={20} />
            </div>
            <div>
              <div style={{ fontSize: '1.25rem', fontWeight: 800, color: 'var(--text-primary)', lineHeight: 1.1 }}>{stats.active}</div>
              <div style={{ fontSize: '0.76rem', color: 'var(--text-muted)', fontWeight: 500 }}>На рассмотрении</div>
            </div>
          </div>

          <div className="stat-card">
            <div className="stat-icon-wrapper" style={{ background: 'var(--success-bg)', color: 'var(--success-text)', borderColor: 'var(--success-border)' }}>
              <CheckCircle2 size={20} />
            </div>
            <div>
              <div style={{ fontSize: '1.25rem', fontWeight: 800, color: 'var(--text-primary)', lineHeight: 1.1 }}>{stats.approved}</div>
              <div style={{ fontSize: '0.76rem', color: 'var(--text-muted)', fontWeight: 500 }}>Одобренных законов</div>
            </div>
          </div>

          <div className="stat-card">
            <div className="stat-icon-wrapper" style={{ background: 'rgba(255,255,255,0.06)', color: 'var(--text-secondary)', borderColor: 'var(--border-subtle)' }}>
              <UserIcon size={20} />
            </div>
            <div>
              <div style={{ fontSize: '1.25rem', fontWeight: 800, color: 'var(--text-primary)', lineHeight: 1.1 }}>{stats.myCount}</div>
              <div style={{ fontSize: '0.76rem', color: 'var(--text-muted)', fontWeight: 500 }}>Мои инициативы</div>
            </div>
          </div>
        </div>
      </div>

      {/* FILTER TABS & SEARCH CONTAINER */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '24px', flexWrap: 'wrap', gap: '16px' }}>
        
        {/* PILL NAVIGATION TABS */}
        <div style={{ 
          display: 'flex', 
          gap: '6px', 
          background: 'var(--bg-surface)', 
          padding: '6px', 
          borderRadius: 'var(--radius-pill)', 
          border: '1px solid var(--border-subtle)',
          boxShadow: 'var(--shadow-sm)',
          backdropFilter: 'blur(12px)'
        }}>
          {[
            { id: 'my', label: 'Мои проекты', icon: UserIcon },
            { id: 'active', label: 'Актуальные', icon: Clock },
            { id: 'all', label: 'Все проекты', icon: FileText },
            { id: 'archive', label: 'Архив', icon: Archive },
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
                  padding: '8px 20px',
                  fontSize: '0.86rem',
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
            size={18} 
            color="var(--text-muted)" 
            style={{ position: 'absolute', left: '18px', top: '50%', transform: 'translateY(-50%)', pointerEvents: 'none' }} 
          />
          <input 
            type="text" 
            placeholder="Поиск по закону, статьям или автору..." 
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="input-field"
            style={{
              padding: '12px 20px 12px 48px',
              fontSize: '0.88rem',
              borderRadius: 'var(--radius-pill)'
            }}
          />
        </div>
      </div>

      {/* BILLS LIST */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
        {filteredBills.length === 0 ? (
          <div className="card" style={{ textAlign: 'center', padding: '64px 20px', color: 'var(--text-muted)' }}>
            <FileText size={48} style={{ opacity: 0.3, margin: '0 auto 16px', color: 'var(--text-accent)' }} />
            <h3 style={{ fontSize: '1.1rem', margin: '0 0 6px 0', fontWeight: 700, color: 'var(--text-primary)' }}>
              Законопроекты не найдены
            </h3>
            <p style={{ fontSize: '0.88rem', margin: 0, color: 'var(--text-muted)' }}>
              Попробуйте изменить параметры поиска или создайте свой первый законопроект.
            </p>
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
                padding: '24px 30px'
              }}
            >
              <div style={{ flex: 1, paddingRight: '24px' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '14px', marginBottom: '12px', flexWrap: 'wrap' }}>
                  <h3 style={{ margin: 0, fontSize: '1.1rem', fontWeight: 700, color: 'var(--text-primary)', letterSpacing: '-0.01em' }}>
                    {bill.targetLaw || bill.title || 'Законопроект без названия'}
                  </h3>
                  {getStatusBadge(bill.status)}
                </div>
                
                {bill.title && bill.targetLaw && (
                  <p style={{ fontSize: '0.86rem', color: 'var(--text-secondary)', margin: '0 0 12px 0', lineHeight: 1.4 }}>
                    {bill.title}
                  </p>
                )}

                <div style={{ display: 'flex', alignItems: 'center', gap: '22px', fontSize: '0.82rem', color: 'var(--text-muted)', flexWrap: 'wrap' }}>
                  <span style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                    <UserIcon size={14} color="var(--text-accent)" /> 
                    <strong style={{ color: 'var(--text-secondary)', fontWeight: 600 }}>{bill.author}</strong>
                  </span>
                  <span style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                    <Calendar size={14} color="var(--text-muted)" /> 
                    <strong style={{ color: 'var(--text-muted)', fontWeight: 500 }}>{formatDate(bill.updatedAt)}</strong>
                  </span>
                  <span style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                    <Layers size={14} color="var(--text-muted)" /> 
                    Статей: <strong style={{ color: 'var(--text-accent)', fontWeight: 600 }}>{bill.comparisons.length}</strong>
                  </span>
                </div>
              </div>
              
              <div style={{ 
                width: '40px', height: '40px', borderRadius: '50%', 
                background: 'var(--bg-input)', border: '1px solid var(--border-subtle)',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                flexShrink: 0,
                transition: 'all 0.2s ease'
              }}>
                <ChevronRight size={20} color="var(--text-muted)" />
              </div>
            </div>
          ))
        )}
      </div>

    </div>
  );
};
