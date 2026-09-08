import React, { useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import type { Bill, BillStatus, UserProfile } from '../types/bill';
import { isSystemAdmin } from '../services/securityService';
import { 
  Search, 
  ChevronDown,
  Plus, 
  Calendar,
  User as UserIcon,
  Layers,
  Trash2,
  CheckCircle2,
  SlidersHorizontal,
  Share2,
  Clock,
  ExternalLink,
  Crown
} from 'lucide-react';
import { groupBillsByWeek } from '../utils/dateUtils';
import { useSessionState } from '../hooks/useSessionState';
import { R, ft, label, mono, chip, btnAccent, plural } from '../lib/ui';

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
  const [activeTab, setActiveTab] = useSessionState<'all' | 'my' | 'active' | 'approved'>('dashboard_tab', 'all');
  const [searchQuery, setSearchQuery] = useSessionState('dashboard_search', '');
  
  // Advanced Filters
  const [showFilters, setShowFilters] = useSessionState('dashboard_show_filters', false);
  const [filterStatuses, setFilterStatuses] = useSessionState<BillStatus[]>('dashboard_filter_statuses', []);
  const [filterVote, setFilterVote] = useSessionState<'all' | 'voted' | 'not_voted'>('dashboard_filter_vote', 'all');
  const [sortOrder, setSortOrder] = useSessionState<'newest' | 'oldest'>('dashboard_sort', 'newest');

  // Pack Accordeons
  const [expandedPacks, setExpandedPacks] = useSessionState<Record<string, boolean>>('dashboard_expanded_packs', {});

  const togglePack = (packLabel: string) => {
    setExpandedPacks(prev => ({ ...prev, [packLabel]: !prev[packLabel] }));
  };

  const currentFullName = `${user.firstName} ${user.lastName}`.trim();

  // Filter out private drafts of other users first
  const visibleBills = useMemo(() => {
    return bills.filter((b) => {
      if (b.status === 'draft' && b.author.trim() !== currentFullName && !isSystemAdmin(user)) {
        return false;
      }
      return true;
    });
  }, [bills, currentFullName, user]);

  // Statistics calculation based ONLY on visible bills
  const stats = useMemo(() => {
    const total = visibleBills.length;
    const active = visibleBills.filter(b => b.status === 'under_review' || b.status === 'needs_revision' || b.status === 'draft').length;
    const approved = visibleBills.filter(b => b.status === 'approved').length;
    const myCount = visibleBills.filter(b => b.author.trim() === currentFullName).length;
    return { total, active, approved, myCount };
  }, [visibleBills, currentFullName]);

  // Tab and Search filtering logic
  const filteredBills = useMemo(() => {
    return visibleBills
      .filter((b) => {
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
            (b.targetLaw && b.targetLaw.toLowerCase().includes(query)) ||
            (b.author && b.author.toLowerCase().includes(query)) ||
            (b.title && b.title.toLowerCase().includes(query)) ||
            (b.id && b.id.toLowerCase().includes(query))
          );
        }

        return true;
      })
      .filter((b) => {
        if (filterStatuses.length > 0 && !filterStatuses.includes(b.status)) {
          return false;
        }

        if (filterVote !== 'all') {
          const isCommission = ['prosecutor', 'judge', 'governor'].includes(user.officialRole);
          const hasVoted = isCommission && b.votes?.[user.officialRole as 'prosecutor'|'judge'|'governor'];
          const hasAdminVerdict = user.officialRole === 'admin' && b.federalVerdict;
          const alreadyVoted = hasVoted || hasAdminVerdict;

          if (filterVote === 'voted' && !alreadyVoted) return false;
          if (filterVote === 'not_voted' && alreadyVoted) return false;
        }

        return true;
      })
      .sort((a, b) => {
        const timeA = new Date(a.updatedAt).getTime();
        const timeB = new Date(b.updatedAt).getTime();
        return sortOrder === 'newest' ? timeB - timeA : timeA - timeB;
      });
  }, [visibleBills, activeTab, searchQuery, currentFullName, filterStatuses, filterVote, sortOrder, user]);

  const getStatusBadge = (bill: Bill) => {
    const isStage2ApprovedPendingEnactment = bill.federalVerdict?.status === 'approved' && bill.status !== 'approved';

    if (bill.status === 'approved') {
      return (
        <span
          style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: 5,
            padding: '3px 8px',
            fontSize: 11,
            fontWeight: 700,
            background: R.successSubtle,
            color: R.success,
            border: `1px solid ${R.success}`,
            borderRadius: 2,
            letterSpacing: '0.02em',
          }}
        >
          <span style={{ width: 6, height: 6, borderRadius: '50%', background: R.success }} />
          Вступил в силу
        </span>
      );
    }

    if (isStage2ApprovedPendingEnactment) {
      return (
        <span
          style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: 5,
            padding: '3px 8px',
            fontSize: 11,
            fontWeight: 700,
            background: R.accentSubtle,
            color: R.accent,
            border: `1px solid ${R.accentBorder}`,
            borderRadius: 2,
            letterSpacing: '0.02em',
          }}
        >
          <span style={{ width: 6, height: 6, borderRadius: '50%', background: R.accent }} />
          Одобрен 2-м этапом
        </span>
      );
    }

    switch (bill.status) {
      case 'rejected':
        return (
          <span
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: 5,
              padding: '3px 8px',
              fontSize: 11,
              fontWeight: 700,
              background: R.dangerSubtle,
              color: R.danger,
              border: `1px solid ${R.dangerBorder}`,
              borderRadius: 2,
            }}
          >
            <span style={{ width: 6, height: 6, borderRadius: '50%', background: R.danger }} />
            Отклонен
          </span>
        );
      case 'needs_revision':
        return (
          <span
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: 5,
              padding: '3px 8px',
              fontSize: 11,
              fontWeight: 700,
              background: R.accentSubtle,
              color: R.accentText,
              border: `1px solid ${R.accentBorder}`,
              borderRadius: 2,
            }}
          >
            <span style={{ width: 6, height: 6, borderRadius: '50%', background: R.accent }} />
            Доработка
          </span>
        );
      case 'under_review':
        return (
          <span
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: 5,
              padding: '3px 8px',
              fontSize: 11,
              fontWeight: 700,
              background: R.warningSubtle,
              color: R.warning,
              border: `1px solid ${R.warning}`,
              borderRadius: 2,
            }}
          >
            <span style={{ width: 6, height: 6, borderRadius: '50%', background: R.warning }} />
            На рассмотрении
          </span>
        );
      case 'draft':
      default:
        return (
          <span
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: 5,
              padding: '3px 8px',
              fontSize: 11,
              fontWeight: 600,
              background: R.bgElevated,
              color: R.textMuted,
              border: ft.edge,
              borderRadius: 2,
            }}
          >
            <span style={{ width: 6, height: 6, borderRadius: '50%', background: R.textMuted }} />
            Черновик
          </span>
        );
    }
  };

  const formatDecreeNumber = (billId: string) => {
    const numericId = billId.replace(/\D/g, '').slice(-4) || '0042';
    return `SA-${numericId}`;
  };

  const tabs = [
    { id: 'all', label: 'Все акты', count: stats.total },
    { id: 'active', label: 'На рассмотрении', count: stats.active },
    { id: 'approved', label: 'Вступили в силу', count: stats.approved },
    { id: 'my', label: 'Мои проекты', count: stats.myCount },
  ] as const;

  return (
    <div style={{ maxWidth: 1180, margin: '0 auto', display: 'flex', flexDirection: 'column', gap: 24 }}>
      
      {/* Header Area in DocList style */}
      <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 16, flexWrap: 'wrap' }}>
        <div>
          <h1 style={{ fontSize: 26, fontWeight: 800, letterSpacing: '-0.02em', color: R.text, margin: 0 }}>
            Реестр законопроектов
          </h1>
          <div style={{ fontSize: 12, fontFamily: mono, color: R.textMuted, marginTop: 4 }}>
            {visibleBills.length} {plural(visibleBills.length, 'законопроект', 'законопроекта', 'законопроектов')} · ШТАТ SAN ANDREAS
          </div>
        </div>

        <button
          style={btnAccent}
          onClick={onNewBill}
          data-tooltip="Создать и внести новый законопроект"
        >
          <Plus size={16} strokeWidth={2.5} />
          <span>Внести законопроект</span>
        </button>
      </div>

      {/* Metrics Cards Grid */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: 12 }}>
        {[
          { icon: <Layers size={18} color={R.accent} />, value: stats.total, label: 'Всего в реестре' },
          { icon: <Clock size={18} color={R.warning} />, value: stats.active, label: 'На рассмотрении' },
          { icon: <CheckCircle2 size={18} color={R.success} />, value: stats.approved, label: 'Вступили в силу' },
          { icon: <UserIcon size={18} color={R.textSecondary} />, value: stats.myCount, label: 'Мои проекты' },
        ].map((item, i) => (
          <div
            key={i}
            style={{
              padding: '16px 18px',
              background: R.bgPanel,
              border: ft.edge,
              borderRadius: 2,
              display: 'flex',
              alignItems: 'center',
              gap: 14,
              boxShadow: '0 2px 8px rgba(0,0,0,0.06)',
            }}
          >
            <div
              style={{
                width: 38,
                height: 38,
                display: 'grid',
                placeItems: 'center',
                background: R.bgInput,
                border: ft.hair,
                borderRadius: 2,
                flexShrink: 0,
              }}
            >
              {item.icon}
            </div>
            <div>
              <div style={{ fontSize: 22, fontWeight: 800, fontFamily: mono, color: R.text, lineHeight: 1.1 }}>
                {item.value}
              </div>
              <div style={{ ...label, fontSize: 9.5, marginTop: 4 }}>
                {item.label}
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Filters Toolbar Bar */}
      <div
        style={{
          background: R.bgPanel,
          border: ft.edge,
          padding: '10px 14px',
          borderRadius: 2,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          gap: 12,
          flexWrap: 'wrap',
        }}
      >
        {/* Tab Chips */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 6, flexWrap: 'wrap' }}>
          {tabs.map((tab) => {
            const isActive = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                style={chip(isActive)}
                onClick={() => setActiveTab(tab.id as any)}
              >
                <span>{tab.label}</span>
                <span style={{ fontFamily: mono, fontSize: 11, opacity: 0.75 }}>
                  {tab.count}
                </span>
              </button>
            );
          })}
        </div>

        {/* Search Input & Advanced Filter Button */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, minWidth: 260, flex: '1 1 auto', maxWidth: 420 }}>
          <div style={{ position: 'relative', flex: '1 1 auto' }}>
            <Search
              size={15}
              color={R.textMuted}
              style={{ position: 'absolute', left: 10, top: '50%', transform: 'translateY(-50%)' }}
            />
            <input
              type="text"
              placeholder="Поиск по названию, автору или закону..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              style={{
                width: '100%',
                height: 32,
                paddingLeft: 32,
                paddingRight: 10,
                background: R.bgInput,
                border: ft.edge,
                borderRadius: 2,
                fontSize: 13,
                color: R.text,
                outline: 'none',
              }}
              onFocus={(e) => (e.currentTarget.style.borderColor = R.accent)}
              onBlur={(e) => (e.currentTarget.style.borderColor = 'var(--rt-line)')}
            />
          </div>

          <button
            onClick={() => setShowFilters(!showFilters)}
            data-tooltip="Расширенные фильтры"
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              justifyContent: 'center',
              width: 32,
              height: 32,
              background: showFilters || filterStatuses.length > 0 || filterVote !== 'all' ? R.accent : R.bgInput,
              color: showFilters || filterStatuses.length > 0 || filterVote !== 'all' ? R.onAccent : R.textSecondary,
              border: ft.edge,
              borderRadius: 2,
              cursor: 'pointer',
              flexShrink: 0,
            }}
          >
            <SlidersHorizontal size={15} />
          </button>
        </div>
      </div>

      {/* Advanced Filters Drawer Panel */}
      <AnimatePresence>
        {showFilters && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            style={{
              background: R.bgPanel,
              border: ft.edge,
              borderRadius: 2,
              padding: 16,
              overflow: 'hidden',
            }}
          >
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: 20 }}>
              
              {/* Status Filter */}
              <div>
                <div style={{ ...label, marginBottom: 10 }}>По статусу акта</div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                  {(['draft', 'under_review', 'needs_revision', 'approved', 'rejected'] as BillStatus[]).map((st) => {
                    const isChecked = filterStatuses.includes(st);
                    const stLabels: Record<string, string> = {
                      draft: 'Черновик',
                      under_review: 'На рассмотрении',
                      needs_revision: 'Доработка',
                      approved: 'Вступил в силу',
                      rejected: 'Отклонен',
                    };

                    return (
                      <label key={st} style={{ display: 'flex', alignItems: 'center', gap: 8, cursor: 'pointer', fontSize: 13, color: R.text }}>
                        <input
                          type="checkbox"
                          checked={isChecked}
                          onChange={() => {
                            if (isChecked) {
                              setFilterStatuses(filterStatuses.filter(s => s !== st));
                            } else {
                              setFilterStatuses([...filterStatuses, st]);
                            }
                          }}
                          style={{ accentColor: R.accent, cursor: 'pointer' }}
                        />
                        <span>{stLabels[st]}</span>
                      </label>
                    );
                  })}
                </div>
              </div>

              {/* Vote Status Filter */}
              <div>
                <div style={{ ...label, marginBottom: 10 }}>Участие в голосовании</div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
                  {[
                    { id: 'all', title: 'Все акты' },
                    { id: 'voted', title: 'Голос учтен' },
                    { id: 'not_voted', title: 'Ожидают моего голоса' },
                  ].map((opt) => (
                    <button
                      key={opt.id}
                      onClick={() => setFilterVote(opt.id as any)}
                      style={{
                        padding: '6px 10px',
                        textAlign: 'left',
                        fontSize: 12,
                        fontWeight: filterVote === opt.id ? 700 : 500,
                        background: filterVote === opt.id ? R.accentSubtle : 'transparent',
                        color: filterVote === opt.id ? R.accent : R.textSecondary,
                        border: filterVote === opt.id ? `1px solid ${R.accentBorder}` : '1px solid transparent',
                        borderRadius: 2,
                        cursor: 'pointer',
                      }}
                    >
                      {opt.title}
                    </button>
                  ))}
                </div>
              </div>

              {/* Sort Order */}
              <div>
                <div style={{ ...label, marginBottom: 10 }}>Сортировка</div>
                <div style={{ display: 'flex', gap: 6 }}>
                  <button
                    onClick={() => setSortOrder('newest')}
                    style={chip(sortOrder === 'newest')}
                  >
                    Сначала новые
                  </button>
                  <button
                    onClick={() => setSortOrder('oldest')}
                    style={chip(sortOrder === 'oldest')}
                  >
                    Сначала старые
                  </button>
                </div>

                {(filterStatuses.length > 0 || filterVote !== 'all' || sortOrder !== 'newest') && (
                  <button
                    onClick={() => {
                      setFilterStatuses([]);
                      setFilterVote('all');
                      setSortOrder('newest');
                    }}
                    style={{
                      marginTop: 14,
                      padding: '6px 10px',
                      fontSize: 11,
                      fontFamily: mono,
                      fontWeight: 700,
                      color: R.danger,
                      background: R.dangerSubtle,
                      border: `1px solid ${R.dangerBorder}`,
                      cursor: 'pointer',
                      borderRadius: 2,
                      width: '100%',
                    }}
                  >
                    СБРОСИТЬ ВСЕ ФИЛЬТРЫ
                  </button>
                )}
              </div>

            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Bills Groups / Week Packs */}
      {filteredBills.length === 0 ? (
        <div
          style={{
            padding: '48px 20px',
            textAlign: 'center',
            background: R.bgPanel,
            border: ft.edge,
            borderRadius: 2,
            color: R.textMuted,
          }}
        >
          <Search size={36} color={R.textMuted} style={{ margin: '0 auto 12px' }} />
          <div style={{ fontSize: 14, fontWeight: 700, color: R.text }}>Законопроекты не найдены</div>
          <div style={{ fontSize: 12, marginTop: 4 }}>Измените поисковый запрос или сбросьте фильтры</div>
        </div>
      ) : (
        (() => {
          let sortedGroups = groupBillsByWeek(filteredBills);
          if (sortOrder === 'oldest') {
            sortedGroups = sortedGroups.reverse();
          }

          return (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
              {sortedGroups.map((group) => {
                const isExpanded = expandedPacks[group.label] !== false; // expanded by default for smooth browsing

                return (
                  <div key={group.label} style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                    {/* Week Pack Section Header */}
                    <div
                      onClick={() => togglePack(group.label)}
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'space-between',
                        padding: '10px 14px',
                        background: R.bgPanel,
                        border: ft.hair,
                        borderRadius: 2,
                        cursor: 'pointer',
                        userSelect: 'none',
                        transition: 'background 0.12s',
                      }}
                      onMouseEnter={(e) => (e.currentTarget.style.background = R.bgElevated)}
                      onMouseLeave={(e) => (e.currentTarget.style.background = R.bgPanel)}
                    >
                      <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                        <Layers size={15} color={R.accent} />
                        <span style={{ fontSize: 12, fontWeight: 800, letterSpacing: '0.04em', textTransform: 'uppercase', color: R.text }}>
                          {group.label}
                        </span>
                      </div>

                      <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                        <span style={{ fontSize: 11, fontFamily: mono, color: R.textMuted }}>
                          {group.bills.length} {plural(group.bills.length, 'акт', 'акта', 'актов')}
                        </span>
                        <ChevronDown
                          size={14}
                          color={R.textMuted}
                          style={{
                            transition: 'transform 0.2s ease',
                            transform: isExpanded ? 'rotate(180deg)' : 'none',
                          }}
                        />
                      </div>
                    </div>

                    {/* Bills Rows */}
                    <AnimatePresence>
                      {isExpanded && (
                        <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                          {group.bills.map((bill) => {
                            const decreeStamp = formatDecreeNumber(bill.id);
                            const isAuthor = !bill.author || bill.author.trim().toLowerCase() === currentFullName.toLowerCase() || bill.author.trim() === currentFullName || isSystemAdmin(user);
                            const canDelete = isAuthor || isSystemAdmin(user);
                            const isCommission = ['prosecutor', 'judge', 'governor'].includes(user.officialRole);
                            const hasVoted = isCommission && bill.votes?.[user.officialRole as 'prosecutor'|'judge'|'governor'];
                            const hasAdminVerdict = user.officialRole === 'admin' && bill.federalVerdict;
                            const alreadyVoted = hasVoted || hasAdminVerdict;

                            return (
                              <div
                                key={bill.id}
                                onClick={() => onSelectBill(bill)}
                                style={{
                                  padding: '14px 16px',
                                  background: R.bgPanel,
                                  border: ft.edge,
                                  borderRadius: 2,
                                  cursor: 'pointer',
                                  display: 'flex',
                                  alignItems: 'flex-start',
                                  justifyContent: 'space-between',
                                  gap: 16,
                                  transition: 'border-color 0.12s ease, background 0.12s ease',
                                }}
                                onMouseEnter={(e) => {
                                  e.currentTarget.style.borderColor = R.accent;
                                  e.currentTarget.style.background = R.bgElevated;
                                }}
                                onMouseLeave={(e) => {
                                  e.currentTarget.style.borderColor = 'var(--rt-line)';
                                  e.currentTarget.style.background = R.bgPanel;
                                }}
                              >
                                <div style={{ flex: '1 1 auto', minWidth: 0 }}>
                                  
                                  {/* Top Meta Line: Code, Status, Vote Badge */}
                                  <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap', marginBottom: 8 }}>
                                    <span
                                      style={{
                                        fontFamily: mono,
                                        fontSize: 11,
                                        fontWeight: 700,
                                        padding: '2px 6px',
                                        background: R.bgInput,
                                        border: ft.hair,
                                        color: R.textMuted,
                                        borderRadius: 2,
                                      }}
                                    >
                                      {decreeStamp}
                                    </span>

                                    {getStatusBadge(bill)}

                                    {bill.isTotalReform && (
                                      <span
                                        style={{
                                          display: 'inline-flex',
                                          alignItems: 'center',
                                          gap: 4.5,
                                          padding: '2px 8px',
                                          fontSize: 10.5,
                                          fontWeight: 800,
                                          background: 'rgba(217, 119, 6, 0.14)',
                                          color: '#f59e0b',
                                          border: '1px solid rgba(245, 158, 11, 0.4)',
                                          borderRadius: 2,
                                          letterSpacing: '0.04em',
                                          textTransform: 'uppercase',
                                        }}
                                      >
                                        <Layers size={11} color="#f59e0b" />
                                        ОБЩАЯ РЕФОРМА
                                      </span>
                                    )}

                                    {alreadyVoted && (
                                      <span
                                        style={{
                                          display: 'inline-flex',
                                          alignItems: 'center',
                                          gap: 4,
                                          padding: '2px 6px',
                                          fontSize: 10,
                                          fontWeight: 700,
                                          background: R.bgElevated,
                                          color: R.textSecondary,
                                          border: ft.hair,
                                          borderRadius: 2,
                                        }}
                                      >
                                        <CheckCircle2 size={11} color={R.success} />
                                        Голос учтен
                                      </span>
                                    )}

                                    {bill.targetLaw && (
                                      <span
                                        style={{
                                          fontSize: 11,
                                          fontWeight: 700,
                                          color: R.accentText,
                                          padding: '1px 6px',
                                          background: R.accentSubtle,
                                          borderRadius: 2,
                                        }}
                                      >
                                        {bill.targetLaw}
                                      </span>
                                    )}
                                  </div>

                                  {/* Bill Title */}
                                  <h3
                                    style={{
                                      fontSize: 15,
                                      fontWeight: 800,
                                      letterSpacing: '-0.01em',
                                      color: R.text,
                                      margin: '0 0 6px 0',
                                      lineHeight: 1.3,
                                    }}
                                  >
                                    {bill.title || bill.targetLaw || 'Законопроект без названия'}
                                  </h3>

                                  {/* Explanatory note excerpt */}
                                  {bill.explanatoryNote && (
                                    <p
                                      style={{
                                        fontSize: 12.5,
                                        color: R.textMuted,
                                        margin: '0 0 8px 0',
                                        overflow: 'hidden',
                                        textOverflow: 'ellipsis',
                                        whiteSpace: 'nowrap',
                                        maxWidth: 780,
                                      }}
                                    >
                                      {bill.explanatoryNote}
                                    </p>
                                  )}

                                  {/* Federal Government Verdict Quote on Card */}
                                  {bill.federalVerdict && (
                                    <div
                                      style={{
                                        display: 'flex',
                                        alignItems: 'center',
                                        gap: 8,
                                        margin: '0 0 10px 0',
                                        padding: '6px 10px',
                                        background: bill.federalVerdict.status === 'approved'
                                          ? 'rgba(34, 197, 94, 0.08)'
                                          : bill.federalVerdict.status === 'needs_revision'
                                          ? 'rgba(234, 179, 8, 0.08)'
                                          : 'rgba(239, 68, 68, 0.08)',
                                        borderLeft: `3px solid ${
                                          bill.federalVerdict.status === 'approved'
                                            ? '#22c55e'
                                            : bill.federalVerdict.status === 'needs_revision'
                                            ? '#eab308'
                                            : '#ef4444'
                                        }`,
                                        borderRadius: 2,
                                        fontSize: 11.5,
                                        color: R.textSecondary,
                                      }}
                                    >
                                      <Crown
                                        size={13}
                                        color={
                                          bill.federalVerdict.status === 'approved'
                                            ? '#22c55e'
                                            : bill.federalVerdict.status === 'needs_revision'
                                            ? '#eab308'
                                            : '#ef4444'
                                        }
                                        style={{ flexShrink: 0 }}
                                      />
                                      <span style={{ fontWeight: 700, color: R.text, flexShrink: 0 }}>
                                        Вердикт ФП ({bill.federalVerdict.status === 'approved' ? 'Одобрен' : bill.federalVerdict.status === 'needs_revision' ? 'Правки' : 'Отклонен'}):
                                      </span>
                                      <span style={{ fontStyle: 'italic', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                                        "{bill.federalVerdict.reason}"
                                      </span>
                                      {bill.federalVerdict.adminName && (
                                        <span style={{ fontSize: 10, fontFamily: mono, color: R.textMuted, marginLeft: 'auto', flexShrink: 0 }}>
                                          ({bill.federalVerdict.adminName})
                                        </span>
                                      )}
                                    </div>
                                  )}

                                  {/* Bottom Details line */}
                                  <div style={{ display: 'flex', alignItems: 'center', gap: 14, fontSize: 11, color: R.textMuted, flexWrap: 'wrap' }}>
                                    <span style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
                                      <UserIcon size={12} />
                                      {bill.author || 'Не указан'}
                                    </span>
                                    
                                    <span style={{ display: 'flex', alignItems: 'center', gap: 4, fontFamily: mono }}>
                                      <Calendar size={12} />
                                      {new Date(bill.createdAt || bill.updatedAt).toLocaleDateString('ru-RU')}
                                    </span>

                                    {bill.isTotalReform ? (
                                      <span style={{ fontFamily: mono, color: '#f59e0b', fontWeight: 600, display: 'inline-flex', alignItems: 'center', gap: 4 }}>
                                        <Layers size={11} />
                                        Реформа закона (единый текст)
                                      </span>
                                    ) : (
                                      bill.comparisons && bill.comparisons.length > 0 && (
                                        <span style={{ fontFamily: mono }}>
                                          {bill.comparisons.length} {plural(bill.comparisons.length, 'статья', 'статьи', 'статей')}
                                        </span>
                                      )
                                    )}
                                  </div>
                                </div>

                                {/* Row Actions */}
                                <div
                                  style={{ display: 'flex', alignItems: 'center', gap: 6 }}
                                  onClick={(e) => e.stopPropagation()}
                                >
                                  <button
                                    onClick={() => onShareBill(bill)}
                                    data-tooltip="Поделиться законопроектом"
                                    style={{
                                      width: 30,
                                      height: 30,
                                      display: 'grid',
                                      placeItems: 'center',
                                      background: R.bgInput,
                                      border: ft.hair,
                                      borderRadius: 2,
                                      color: R.textMuted,
                                      cursor: 'pointer',
                                    }}
                                    onMouseEnter={(e) => (e.currentTarget.style.color = R.accent)}
                                    onMouseLeave={(e) => (e.currentTarget.style.color = 'var(--rt-mut)')}
                                  >
                                    <Share2 size={13} />
                                  </button>

                                  {canDelete && (
                                    <button
                                      onClick={() => onDeleteBill(bill.id)}
                                      data-tooltip="Отозвать законопроект"
                                      style={{
                                        width: 30,
                                        height: 30,
                                        display: 'grid',
                                        placeItems: 'center',
                                        background: R.bgInput,
                                        border: ft.hair,
                                        borderRadius: 2,
                                        color: R.textMuted,
                                        cursor: 'pointer',
                                      }}
                                      onMouseEnter={(e) => {
                                        e.currentTarget.style.color = R.danger;
                                        e.currentTarget.style.borderColor = R.dangerBorder;
                                      }}
                                      onMouseLeave={(e) => {
                                        e.currentTarget.style.color = 'var(--rt-mut)';
                                        e.currentTarget.style.borderColor = 'var(--rt-grid)';
                                      }}
                                    >
                                      <Trash2 size={13} />
                                    </button>
                                  )}

                                  <button
                                    onClick={() => onSelectBill(bill)}
                                    data-tooltip="Открыть законопроект"
                                    style={{
                                      display: 'inline-flex',
                                      alignItems: 'center',
                                      gap: 4,
                                      height: 30,
                                      padding: '0 10px',
                                      background: R.bgInput,
                                      border: ft.hair,
                                      borderRadius: 2,
                                      fontSize: 12,
                                      fontWeight: 700,
                                      color: R.text,
                                      cursor: 'pointer',
                                    }}
                                    onMouseEnter={(e) => {
                                      e.currentTarget.style.background = R.accent;
                                      e.currentTarget.style.color = R.onAccent;
                                    }}
                                    onMouseLeave={(e) => {
                                      e.currentTarget.style.background = 'var(--rt-input)';
                                      e.currentTarget.style.color = 'var(--rt-fg)';
                                    }}
                                  >
                                    <span>Открыть</span>
                                    <ExternalLink size={12} />
                                  </button>
                                </div>
                              </div>
                            );
                          })}
                        </div>
                      )}
                    </AnimatePresence>
                  </div>
                );
              })}
            </div>
          );
        })()
      )}

    </div>
  );
};
