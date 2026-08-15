import React, { useState, useEffect, useRef } from 'react';
import type { Bill, ComparisonRow, AccessPermission, UserProfile, BillStatus, VoteDecision, FederalGovernmentVerdict } from '../types/bill';
import { CommentsSection } from './CommentsSection';
import { ExpandedArticleModal } from './ExpandedArticleModal';
import { isSystemAdmin } from '../services/securityService';
import { computeWordDiff } from '../services/diffService';
import { 
  ArrowLeft, 
  Share2, 
  Plus, 
  Trash2, 
  CheckCircle2, 
  RotateCcw,
  Maximize2,
  Send,
  MessageSquare,
  ShieldCheck,
  Check,
  X,
  Copy,
  UserCheck,
  Crown,
  FileText,
  Sparkles,
  MoreVertical,
  Edit3,
  Columns
} from 'lucide-react';

interface BillEditorProps {
  bill: Bill;
  user: UserProfile;
  permission: AccessPermission;
  returnView?: 'dashboard' | 'admin_workspace';
  onSave: (updatedBill: Bill) => void;
  onDelete?: (billId: string) => void;
  onBack: () => void;
  onShare: (bill: Bill) => void;
  onToast: (type: 'success' | 'error' | 'info', text: string) => void;
}

export const BillEditor: React.FC<BillEditorProps> = ({
  bill: initialBill,
  user,
  permission,
  returnView = 'dashboard',
  onSave,
  onDelete,
  onBack,
  onShare,
  onToast
}) => {
  const [bill, setBill] = useState<Bill>(initialBill);
  const [isSavedNotice, setIsSavedNotice] = useState(false);
  const [expandedRow, setExpandedRow] = useState<ComparisonRow | null>(null);
  const [activeTabMap, setActiveTabMap] = useState<{ [rowId: string]: 'editor' | 'diff' }>({});
  const [showMoreMenu, setShowMoreMenu] = useState(false);

  // Admin verdict form state
  const [adminVerdictReason, setAdminVerdictReason] = useState('');

  const menuRef = useRef<HTMLDivElement>(null);

  const currentFullName = `${user.firstName} ${user.lastName}`.trim();
  const isAuthor = !bill.author || bill.author.trim().toLowerCase() === currentFullName.toLowerCase() || bill.author.trim() === currentFullName || isSystemAdmin(user);
  const isAdmin = isSystemAdmin(user);
  const isOfficial = user.isOfficialVerified && (user.officialRole === 'governor' || user.officialRole === 'prosecutor' || user.officialRole === 'judge');
  const canEdit = permission === 'edit' || isAuthor || isAdmin || (isOfficial && bill.status !== 'approved');
  const canDelete = isAuthor || isAdmin;

  // Auto-close menu on outside click
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        setShowMoreMenu(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Auto-save draft on changes
  const isInitialMount = useRef(true);
  useEffect(() => {
    if (isInitialMount.current) {
      isInitialMount.current = false;
      return;
    }
    if (canEdit) {
      const timer = setTimeout(() => {
        onSave(bill);
        setIsSavedNotice(true);
        setTimeout(() => setIsSavedNotice(false), 2000);
      }, 600);
      return () => clearTimeout(timer);
    }
  }, [bill, canEdit]);

  const handleFieldChange = (field: keyof Bill, value: any) => {
    if (!canEdit) return;
    setBill((prev) => ({ ...prev, [field]: value }));
  };

  const addComparisonRow = () => {
    if (!canEdit) return;
    const newId = 'comp_' + Date.now();
    const newRow: ComparisonRow = {
      id: newId,
      articleTitle: '',
      wasContent: '',
      becameContent: '',
      notes: ''
    };
    handleFieldChange('comparisons', [...bill.comparisons, newRow]);
  };

  const updateComparisonRow = (id: string, field: keyof ComparisonRow, value: string) => {
    if (!canEdit) return;
    setBill((prev) => {
      const updatedComparisons = prev.comparisons.map((row) => {
        if (row.id !== id) return row;
        const newRow = { ...row, [field]: value };
        if (field === 'wasContent' && (row.becameContent === '' || row.becameContent === row.wasContent)) {
          newRow.becameContent = value;
        }
        return newRow;
      });
      return { ...prev, comparisons: updatedComparisons };
    });
  };

  const copyWasToBecame = (id: string) => {
    if (!canEdit) return;
    setBill((prev) => {
      const updated = prev.comparisons.map((row) => {
        if (row.id !== id) return row;
        return { ...row, becameContent: row.wasContent };
      });
      return { ...prev, comparisons: updated };
    });
    onToast('info', 'Исходный текст скопирован в новую редакцию');
  };

  const removeComparisonRow = (id: string) => {
    if (!canEdit) return;
    const updated = bill.comparisons.filter((row) => row.id !== id);
    handleFieldChange('comparisons', updated);
    onToast('info', 'Статья удалена из проекта');
  };

  const handlePublish = async () => {
    const updated: Bill = { 
      ...bill, 
      status: 'under_review' as BillStatus,
      statusReason: 'Опубликован автором и передан на рассмотрение Законодательной Комиссии.',
      updatedAt: new Date().toISOString()
    };
    setBill(updated);
    await onSave(updated);
    onToast('success', 'Законопроект передан на рассмотрение Комиссии');
  };

  const votes = bill.votes || {};
  const approvedVotesCount = [votes.prosecutor, votes.judge, votes.governor].filter((v) => v === 'approved').length;
  const rejectedVotesCount = [votes.prosecutor, votes.judge, votes.governor].filter((v) => v === 'rejected').length;

  const isStage1Passed = approvedVotesCount >= 2;
  const isStage1Rejected = rejectedVotesCount >= 2;

  const handleCastVote = async (decision: VoteDecision) => {
    if (!isOfficial) {
      onToast('error', 'Голосование доступно только членам Законодательной Комиссии.');
      return;
    }

    const role = user.officialRole;
    if (role !== 'prosecutor' && role !== 'judge' && role !== 'governor' && role !== 'admin') {
      onToast('error', 'Только Прокурор, Председатель ВС и Губернатор голосуют в Комиссии.');
      return;
    }

    const voteRole = role === 'admin' ? 'governor' : role;
    const updatedVotes = { ...votes, [voteRole]: decision };

    const newApproveCount = [updatedVotes.prosecutor, updatedVotes.judge, updatedVotes.governor].filter((v) => v === 'approved').length;
    const newRejectCount = [updatedVotes.prosecutor, updatedVotes.judge, updatedVotes.governor].filter((v) => v === 'rejected').length;
    const newRevisionCount = [updatedVotes.prosecutor, updatedVotes.judge, updatedVotes.governor].filter((v) => v === 'needs_revision').length;

    let newStatus = bill.status;
    let statusReason = bill.statusReason || '';

    if (newApproveCount >= 2) {
      statusReason = `Одобрен Законодательной Комиссией (${newApproveCount}/3). Ожидает решения Администрации.`;
    } else if (newRejectCount >= 2) {
      newStatus = 'rejected';
      statusReason = `Отклонен Законодательной Комиссией (${newRejectCount}/3).`;
    } else if (newRevisionCount >= 2) {
      newStatus = 'needs_revision';
      statusReason = `Отправлен на доработку Законодательной Комиссией.`;
    }

    const updatedBill: Bill = {
      ...bill,
      votes: updatedVotes,
      status: newStatus,
      statusReason
    };

    setBill(updatedBill);
    await onSave(updatedBill);
    onToast('success', `Ваш голос записан в реестр`);
  };

  const handleExecuteAdminVerdict = async (decision: VoteDecision) => {
    if (!isAdmin) {
      onToast('error', 'Только Системный Администратор выносит вердикт 2-го этапа.');
      return;
    }

    if ((decision === 'rejected' || decision === 'needs_revision') && !adminVerdictReason.trim()) {
      onToast('error', 'Укажите обоснование вердикта.');
      return;
    }

    const note = adminVerdictReason.trim() || 'Официально утверждено Федеральным Правительством.';

    const verdict: FederalGovernmentVerdict = {
      status: decision,
      reason: note,
      updatedAt: new Date().toISOString(),
      adminName: `${user.firstName} ${user.lastName}`
    };

    let officialStatusReason = '';
    if (decision === 'approved') {
      officialStatusReason = 'Утвержден Федеральным Правительством и вступил в силу.';
    } else if (decision === 'rejected') {
      officialStatusReason = 'Отклонен Федеральным Правительством на 2-м этапе.';
    } else {
      officialStatusReason = 'Отправлен на доработку Федеральным Правительством.';
    }

    const updated: Bill = {
      ...bill,
      status: decision,
      statusReason: officialStatusReason,
      federalVerdict: verdict
    };

    setBill(updated);
    await onSave(updated);
    setAdminVerdictReason('');
    onToast('success', `Вердикт вынесен: ${decision === 'approved' ? 'Утверждено' : decision === 'rejected' ? 'Отклонено' : 'На доработку'}`);
  };

  const handleEnactLaws = async () => {
    const updated: Bill = {
      ...bill,
      status: 'approved',
      statusReason: 'Изменения официально внесены в законодательную базу Штата San Andreas.',
      updatedAt: new Date().toISOString()
    };
    setBill(updated);
    await onSave(updated);
    onToast('success', 'Изменения внесены в законодательную базу!');
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
            <span className="status-dot status-dot-review" /> {isStage1Passed ? '2-й этап (Администрация)' : '1-й этап (Комиссия)'}
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

  const formatDecreeNumber = (id: string) => {
    const numericId = id.replace(/\D/g, '').slice(-4) || '0042';
    return `АКТ № SA-${numericId}`;
  };

  const isReadOnly = bill.status === 'approved' || bill.status === 'rejected';

  return (
    <div style={{ display: 'flex', flexDirection: 'column', minHeight: '100vh', background: 'var(--bg-base)' }}>
      
      {/* ══════════════════════════════════════════════════════════════════
          MINIMALIST ZEN TOP BAR (CALM & UNCLUTTERED)
          ══════════════════════════════════════════════════════════════════ */}
      <div style={{ 
        height: '56px', 
        background: 'var(--bg-glass)', 
        backdropFilter: 'blur(16px)',
        WebkitBackdropFilter: 'blur(16px)',
        borderBottom: '1px solid var(--border-subtle)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        padding: '0 24px',
        position: 'sticky',
        top: 0,
        zIndex: 100
      }}>
        {/* Left: Back + Identity + Status */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px', minWidth: 0 }}>
          <button 
            onClick={onBack} 
            className="btn btn-ghost btn-pill" 
            style={{ padding: '6px 10px', fontSize: '0.8rem' }}
          >
            <ArrowLeft size={14} /> {returnView === 'admin_workspace' ? 'Администрация' : 'Реестр'}
          </button>
          
          <div style={{ width: '1px', height: '16px', background: 'var(--border-subtle)' }} />

          <span className="decree-stamp">
            {formatDecreeNumber(bill.id)}
          </span>

          <h2 style={{ 
            fontSize: '0.94rem', 
            margin: 0, 
            color: 'var(--text-primary)', 
            fontWeight: 600, 
            whiteSpace: 'nowrap', 
            overflow: 'hidden', 
            textOverflow: 'ellipsis',
            maxWidth: '340px' 
          }}>
            {bill.targetLaw || 'Новый законопроект'}
          </h2>

          {getStatusBadge(bill.status)}
        </div>

        {/* Right: Auto-save status + ONE Contextual Action + More Menu */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexShrink: 0 }}>
          {isSavedNotice && (
            <span style={{ fontSize: '0.74rem', color: 'var(--text-muted)', display: 'flex', alignItems: 'center', gap: '4px', marginRight: '6px', fontFamily: 'var(--font-mono)' }}>
              <Check size={13} color="var(--success-text)" /> Сохранено
            </span>
          )}

          {/* SINGLE CONTEXTUAL PRIMARY ACTION */}
          {bill.status === 'draft' && canEdit && (
            <button 
              onClick={handlePublish} 
              className="btn btn-primary btn-pill" 
              style={{ padding: '6px 16px', fontSize: '0.8rem' }}
            >
              <Send size={13} /> Опубликовать
            </button>
          )}

          {isAdmin && bill.status === 'under_review' && (
            <button 
              onClick={() => handleExecuteAdminVerdict('approved')} 
              className="btn btn-success btn-pill" 
              style={{ padding: '6px 16px', fontSize: '0.8rem' }}
            >
              <CheckCircle2 size={13} /> Одобрить вердикт
            </button>
          )}

          {bill.status === 'approved' && !bill.statusReason?.includes('внесены в законодательную базу') && (
            <button 
              onClick={handleEnactLaws} 
              className="btn btn-primary btn-pill" 
              style={{ padding: '6px 16px', fontSize: '0.8rem' }}
            >
              <FileText size={13} /> Внести в законы
            </button>
          )}

          {/* DELETE BUTTON FOR AUTHOR/ADMIN */}
          {canDelete && (
            <button 
              onClick={() => { if (onDelete) onDelete(bill.id); }} 
              className="btn btn-outline-danger btn-pill" 
              style={{ padding: '6px 16px', fontSize: '0.8rem' }}
            >
              <Trash2 size={13} /> Удалить
            </button>
          )}

          {/* MORE ACTIONS DROPDOWN (···) */}
          <div ref={menuRef} style={{ position: 'relative' }}>
            <button 
              onClick={() => setShowMoreMenu((prev) => !prev)}
              className="btn btn-ghost btn-icon"
              title="Дополнительные действия"
            >
              <MoreVertical size={16} />
            </button>

            {showMoreMenu && (
              <div className="dropdown-menu">
                <button 
                  onClick={() => {
                    setShowMoreMenu(false);
                    onShare(bill);
                  }}
                  className="dropdown-item"
                >
                  <Share2 size={14} /> Ссылка доступа
                </button>
              </div>
            )}
          </div>

        </div>
      </div>

      {/* ══════════════════════════════════════════════════════════════════
          MAIN WORKSPACE LAYOUT
          ══════════════════════════════════════════════════════════════════ */}
      <div style={{ 
        flex: 1, 
        maxWidth: '1320px', 
        width: '100%', 
        margin: '0 auto', 
        padding: '24px 20px 60px', 
        display: 'grid', 
        gridTemplateColumns: 'minmax(0, 1fr) 320px', 
        gap: '20px',
        alignItems: 'start'
      }}>
        
        {/* LEFT COLUMN: DOCUMENT CONTENT */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
          
          {/* LAW METADATA */}
          <div className="card" style={{ padding: '18px 20px' }}>
            <div style={{ marginBottom: '14px' }}>
              <label className="input-label">Наименование целевого закона / нормативного акта</label>
              <input 
                type="text" 
                value={bill.targetLaw}
                onChange={(e) => handleFieldChange('targetLaw', e.target.value)}
                disabled={!canEdit || isReadOnly}
                className="input-field"
                style={{ width: '100%', fontSize: '0.98rem', fontWeight: 600 }}
                placeholder="Например: Уголовный кодекс Штата San Andreas (УК)"
              />
            </div>

            <div>
              <label className="input-label">Пояснительная записка к законопроекту</label>
              <textarea 
                value={bill.explanatoryNote}
                onChange={(e) => handleFieldChange('explanatoryNote', e.target.value)}
                disabled={!canEdit || isReadOnly}
                className="input-field"
                style={{ width: '100%', minHeight: '75px', resize: 'vertical', lineHeight: 1.55 }}
                placeholder="Краткое обоснование необходимости и целей внесения поправок..."
              />
            </div>
          </div>

          {/* ARTICLES HEADER */}
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginTop: '4px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <h3 style={{ margin: 0, fontSize: '0.98rem', fontWeight: 700, color: 'var(--text-primary)' }}>
                Статьи законопроекта
              </h3>
              <span style={{ 
                padding: '1px 6px', 
                borderRadius: 'var(--radius-pill)', 
                background: 'rgba(56, 189, 248, 0.08)', 
                color: 'var(--text-accent)', 
                fontSize: '0.7rem', 
                fontFamily: 'var(--font-mono)',
                fontWeight: 600
              }}>
                {bill.comparisons.length}
              </span>
            </div>

            {canEdit && !isReadOnly && (
              <button 
                onClick={addComparisonRow} 
                className="btn btn-secondary btn-pill" 
                style={{ fontSize: '0.78rem', padding: '5px 14px' }}
              >
                <Plus size={13} /> Добавить статью
              </button>
            )}
          </div>

          {/* ARTICLES LIST */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
            {bill.comparisons.map((row, index) => {
              const diff = computeWordDiff(row.wasContent, row.becameContent);
              const activeTab = activeTabMap[row.id] || 'editor';

              return (
                <div key={row.id} className="card" style={{ padding: '0', overflow: 'hidden' }}>
                  
                  {/* ARTICLE CARD HEADER WITH TABS */}
                  <div style={{ 
                    background: 'var(--bg-surface-elevated)', 
                    padding: '8px 14px', 
                    borderBottom: '1px solid var(--border-subtle)', 
                    display: 'flex', 
                    alignItems: 'center', 
                    justifyContent: 'space-between',
                    gap: '10px',
                    flexWrap: 'wrap'
                  }}>
                    {/* Section Number & Title */}
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flex: 1, minWidth: '240px' }}>
                      <span style={{ 
                        fontSize: '0.76rem', 
                        color: 'var(--text-muted)', 
                        fontFamily: 'var(--font-mono)',
                        fontWeight: 600 
                      }}>
                        §{index + 1}
                      </span>
                      
                      <input 
                        type="text" 
                        value={row.articleTitle}
                        onChange={(e) => updateComparisonRow(row.id, 'articleTitle', e.target.value)}
                        disabled={!canEdit || isReadOnly}
                        className="input-field"
                        style={{ flex: 1, maxWidth: '320px', padding: '5px 10px', fontWeight: 600, fontSize: '0.84rem' }}
                        placeholder="Статья 1. Наименование статьи..."
                      />
                    </div>

                    {/* Mode Tabs: Editor vs Diff */}
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                      <div style={{ display: 'flex', gap: '2px', background: 'var(--bg-input)', padding: '2px', borderRadius: 'var(--radius-pill)', border: '1px solid var(--border-subtle)' }}>
                        <button
                          type="button"
                          onClick={() => setActiveTabMap((prev) => ({ ...prev, [row.id]: 'editor' }))}
                          className="btn btn-pill"
                          style={{
                            fontSize: '0.72rem',
                            padding: '4px 10px',
                            background: activeTab === 'editor' ? 'var(--bg-surface-active)' : 'transparent',
                            color: activeTab === 'editor' ? 'var(--text-primary)' : 'var(--text-muted)',
                            border: 'none'
                          }}
                        >
                          <Edit3 size={11} /> Редактор
                        </button>

                        <button
                          type="button"
                          onClick={() => setActiveTabMap((prev) => ({ ...prev, [row.id]: 'diff' }))}
                          className="btn btn-pill"
                          style={{
                            fontSize: '0.72rem',
                            padding: '4px 10px',
                            background: activeTab === 'diff' ? 'var(--bg-surface-active)' : 'transparent',
                            color: activeTab === 'diff' ? 'var(--text-primary)' : 'var(--text-muted)',
                            border: 'none'
                          }}
                        >
                          <Columns size={11} /> Сравнение {diff.stats.totalChanges > 0 && `(${diff.stats.totalChanges})`}
                        </button>
                      </div>

                      {/* Micro actions */}
                      {canEdit && !isReadOnly && (
                        <button 
                          onClick={() => copyWasToBecame(row.id)}
                          className="btn btn-ghost btn-icon"
                          style={{ width: '28px', height: '28px' }}
                          title="Скопировать исходный текст"
                        >
                          <Copy size={12} />
                        </button>
                      )}

                      <button 
                        onClick={() => setExpandedRow(row)}
                        className="btn btn-ghost btn-icon"
                        style={{ width: '28px', height: '28px' }}
                        title="Развернуть на весь экран"
                      >
                        <Maximize2 size={12} />
                      </button>

                      {canEdit && !isReadOnly && bill.comparisons.length > 1 && (
                        <button 
                          onClick={() => removeComparisonRow(row.id)}
                          className="btn btn-ghost btn-icon"
                          style={{ width: '28px', height: '28px', color: 'var(--danger-text)' }}
                          title="Удалить статью"
                        >
                          <Trash2 size={12} />
                        </button>
                      )}
                    </div>
                  </div>

                  {/* TAB 1: PARALLEL SPLIT EDITOR */}
                  {activeTab === 'editor' && (
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr' }}>
                      
                      {/* Left: Original Text */}
                      <div style={{ borderRight: '1px solid var(--border-subtle)', display: 'flex', flexDirection: 'column' }}>
                        <div style={{ 
                          padding: '5px 14px', 
                          background: 'rgba(255, 255, 255, 0.02)', 
                          borderBottom: '1px solid var(--border-subtle)',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'space-between'
                        }}>
                          <span style={{ fontSize: '0.68rem', fontWeight: 600, color: 'var(--text-muted)', fontFamily: 'var(--font-mono)' }}>
                            ДЕЙСТВУЮЩИЙ ТЕКСТ
                          </span>

                          {canEdit && !isReadOnly && (
                            <button
                              type="button"
                              onClick={() => updateComparisonRow(row.id, 'wasContent', '[Ранее статья в законе отсутствовала]')}
                              className="btn btn-ghost"
                              style={{ fontSize: '0.65rem', padding: '1px 6px', color: 'var(--text-accent)' }}
                            >
                              <Sparkles size={10} /> Ранее не было
                            </button>
                          )}
                        </div>
                        
                        <textarea 
                          value={row.wasContent}
                          onChange={(e) => updateComparisonRow(row.id, 'wasContent', e.target.value)}
                          disabled={!canEdit || isReadOnly}
                          style={{ 
                            width: '100%', 
                            border: 'none', 
                            background: 'transparent', 
                            color: 'var(--text-primary)', 
                            padding: '12px 14px', 
                            resize: 'vertical', 
                            outline: 'none', 
                            fontFamily: 'var(--font-sans)', 
                            fontSize: '0.86rem', 
                            lineHeight: 1.6,
                            minHeight: '120px'
                          }}
                          placeholder="Исходный текст статьи..."
                        />
                      </div>

                      {/* Right: New Revision Text */}
                      <div style={{ display: 'flex', flexDirection: 'column' }}>
                        <div style={{ 
                          padding: '5px 14px', 
                          background: 'rgba(255, 255, 255, 0.02)', 
                          borderBottom: '1px solid var(--border-subtle)',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'space-between'
                        }}>
                          <span style={{ fontSize: '0.68rem', fontWeight: 600, color: 'var(--text-muted)', fontFamily: 'var(--font-mono)' }}>
                            НОВАЯ РЕДАКЦИЯ
                          </span>
                        </div>

                        <textarea 
                          value={row.becameContent}
                          onChange={(e) => updateComparisonRow(row.id, 'becameContent', e.target.value)}
                          disabled={!canEdit || isReadOnly}
                          style={{ 
                            width: '100%', 
                            border: 'none', 
                            background: 'transparent', 
                            color: 'var(--text-primary)', 
                            padding: '12px 14px', 
                            resize: 'vertical', 
                            outline: 'none', 
                            fontFamily: 'var(--font-sans)', 
                            fontSize: '0.86rem', 
                            lineHeight: 1.6,
                            minHeight: '120px'
                          }}
                          placeholder="Предлагаемая новая редакция..."
                        />
                      </div>

                    </div>
                  )}

                  {/* TAB 2: CLEAN INLINE DIFF COMPARISON */}
                  {activeTab === 'diff' && (
                    <div style={{ padding: '14px 18px', fontSize: '0.86rem', lineHeight: 1.65, minHeight: '120px' }}>
                      {diff.unifiedFormatted.length > 0 ? (
                        <div>{diff.unifiedFormatted}</div>
                      ) : (
                        <div style={{ color: 'var(--text-muted)', fontSize: '0.8rem' }}>Текст статьи не заполнен.</div>
                      )}
                    </div>
                  )}

                </div>
              );
            })}
          </div>

        </div>

        {/* RIGHT COLUMN: WORKFLOW SIDEBAR */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
          
          {/* AUTHOR & REVISION CARD */}
          <div className="card" style={{ padding: '14px 16px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '10px' }}>
              <div style={{
                width: '32px', height: '32px', borderRadius: '50%',
                background: 'rgba(56, 189, 248, 0.08)',
                border: '1px solid rgba(56, 189, 248, 0.2)',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                flexShrink: 0
              }}>
                <UserCheck size={15} color="var(--text-accent)" />
              </div>
              <div style={{ minWidth: 0 }}>
                <div style={{ fontSize: '0.85rem', fontWeight: 600, color: 'var(--text-primary)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                  {bill.author}
                </div>
                <div style={{ fontSize: '0.68rem', color: 'var(--text-muted)', fontFamily: 'var(--font-mono)' }}>
                  {bill.authorRole || 'Инициатор'}
                </div>
              </div>
            </div>

            <div style={{ paddingTop: '8px', borderTop: '1px solid var(--border-subtle)', display: 'flex', flexDirection: 'column', gap: '3px', fontSize: '0.7rem', color: 'var(--text-muted)', fontFamily: 'var(--font-mono)' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                <span>Создан:</span>
                <span style={{ color: 'var(--text-secondary)' }}>{new Date(bill.createdAt).toLocaleDateString('ru-RU')}</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                <span>Ревизия:</span>
                <span style={{ color: 'var(--text-accent)' }}>v1.0 (SHA-256)</span>
              </div>
            </div>
          </div>

          {/* STAGE 1: LEGISLATIVE COMMISSION */}
          <div className="card" style={{ padding: '14px 16px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '10px', paddingBottom: '8px', borderBottom: '1px solid var(--border-subtle)' }}>
              <ShieldCheck size={15} color="var(--text-accent)" />
              <div>
                <h4 style={{ margin: 0, fontSize: '0.84rem', fontWeight: 600, color: 'var(--text-primary)' }}>
                  1-й Этап: Комиссия Штата
                </h4>
                <p style={{ margin: 0, fontSize: '0.66rem', color: 'var(--text-muted)', fontFamily: 'var(--font-mono)' }}>
                  Кворум 2/3 голосов
                </p>
              </div>
            </div>

            {/* COMMISSION MEMBER LIST */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '6px', marginBottom: '10px' }}>
              {[
                { roleKey: 'prosecutor', title: 'Ген. Прокурор', vote: votes.prosecutor },
                { roleKey: 'judge', title: 'Пред. Верх. Суда', vote: votes.judge },
                { roleKey: 'governor', title: 'Губернатор', vote: votes.governor }
              ].map((item) => (
                <div key={item.roleKey} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '5px 8px', background: 'var(--bg-input)', borderRadius: 'var(--radius-sm)', border: '1px solid var(--border-subtle)' }}>
                  <span style={{ fontSize: '0.74rem', color: 'var(--text-secondary)' }}>
                    {item.title}
                  </span>
                  {item.vote === 'approved' ? (
                    <span style={{ fontSize: '0.68rem', color: 'var(--success-text)', fontFamily: 'var(--font-mono)', fontWeight: 600, display: 'flex', alignItems: 'center', gap: '3px' }}>
                      <Check size={11} /> За
                    </span>
                  ) : item.vote === 'rejected' ? (
                    <span style={{ fontSize: '0.68rem', color: 'var(--danger-text)', fontFamily: 'var(--font-mono)', fontWeight: 600, display: 'flex', alignItems: 'center', gap: '3px' }}>
                      <X size={11} /> Против
                    </span>
                  ) : item.vote === 'needs_revision' ? (
                    <span style={{ fontSize: '0.68rem', color: 'var(--warning-text)', fontFamily: 'var(--font-mono)', fontWeight: 600, display: 'flex', alignItems: 'center', gap: '3px' }}>
                      <RotateCcw size={11} /> Правки
                    </span>
                  ) : (
                    <span style={{ fontSize: '0.68rem', color: 'var(--text-muted)', fontFamily: 'var(--font-mono)' }}>Ожидает</span>
                  )}
                </div>
              ))}
            </div>

            {/* PROGRESS BAR SUMMARY */}
            <div style={{ marginBottom: '14px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.72rem', fontFamily: 'var(--font-mono)', fontWeight: 600, marginBottom: '6px', color: isStage1Passed ? 'var(--success-text)' : isStage1Rejected ? 'var(--danger-text)' : 'var(--text-secondary)' }}>
                <span>
                  {isStage1Passed ? 'Одобрено Комиссией' : isStage1Rejected ? 'Отклонено Комиссией' : 'Итог голосования'}
                </span>
                <span>{approvedVotesCount} За / {rejectedVotesCount} Против</span>
              </div>
              <div className="voting-progress-bar">
                {(() => {
                  const revisionVotesCount = [votes.prosecutor, votes.judge, votes.governor].filter((v) => v === 'needs_revision').length;
                  const totalVoted = approvedVotesCount + rejectedVotesCount + revisionVotesCount;
                  const pendingCount = 3 - totalVoted;
                  
                  return (
                    <>
                      {approvedVotesCount > 0 && <div className="voting-segment voting-segment-approved" style={{ width: `${(approvedVotesCount / 3) * 100}%` }} title={`За: ${approvedVotesCount}`} />}
                      {rejectedVotesCount > 0 && <div className="voting-segment voting-segment-rejected" style={{ width: `${(rejectedVotesCount / 3) * 100}%` }} title={`Против: ${rejectedVotesCount}`} />}
                      {revisionVotesCount > 0 && <div className="voting-segment voting-segment-revision" style={{ width: `${(revisionVotesCount / 3) * 100}%` }} title={`Правки: ${revisionVotesCount}`} />}
                      {pendingCount > 0 && <div className="voting-segment voting-segment-pending" style={{ width: `${(pendingCount / 3) * 100}%` }} title={`Ожидают: ${pendingCount}`} />}
                    </>
                  );
                })()}
              </div>
            </div>

            {/* VOTE BUTTONS FOR COMMITTEE MEMBERS */}
            {bill.status === 'under_review' && !isStage1Passed && !isStage1Rejected && (() => {
              const myVote = (user.officialRole === 'prosecutor' ? votes.prosecutor : user.officialRole === 'judge' ? votes.judge : votes.governor);

              return (
                <div style={{ display: 'flex', gap: '4px' }}>
                  <button 
                    onClick={() => handleCastVote('approved')}
                    className="btn btn-pill" 
                    style={{ 
                      flex: 1, 
                      padding: '5px', 
                      fontSize: '0.72rem', 
                      background: myVote === 'approved' ? 'var(--success-bg)' : 'var(--bg-input)', 
                      color: myVote === 'approved' ? 'var(--success-text)' : 'var(--text-secondary)', 
                      border: `1px solid ${myVote === 'approved' ? 'var(--success-border)' : 'var(--border-subtle)'}`
                    }}
                  >
                    За
                  </button>
                  <button 
                    onClick={() => handleCastVote('needs_revision')}
                    className="btn btn-pill" 
                    style={{ 
                      flex: 1, 
                      padding: '5px', 
                      fontSize: '0.72rem', 
                      background: myVote === 'needs_revision' ? 'var(--warning-bg)' : 'var(--bg-input)', 
                      color: myVote === 'needs_revision' ? 'var(--warning-text)' : 'var(--text-secondary)', 
                      border: `1px solid ${myVote === 'needs_revision' ? 'var(--warning-border)' : 'var(--border-subtle)'}`
                    }}
                  >
                    Правки
                  </button>
                  <button 
                    onClick={() => handleCastVote('rejected')}
                    className="btn btn-pill" 
                    style={{ 
                      flex: 1, 
                      padding: '5px', 
                      fontSize: '0.72rem', 
                      background: myVote === 'rejected' ? 'var(--danger-bg)' : 'var(--bg-input)', 
                      color: myVote === 'rejected' ? 'var(--danger-text)' : 'var(--text-secondary)', 
                      border: `1px solid ${myVote === 'rejected' ? 'var(--danger-border)' : 'var(--border-subtle)'}`
                    }}
                  >
                    Против
                  </button>
                </div>
              );
            })()}
          </div>

          {/* STAGE 2: FEDERAL GOVERNMENT / ADMIN */}
          <div className="card" style={{ padding: '14px 16px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '10px', paddingBottom: '8px', borderBottom: '1px solid var(--border-subtle)' }}>
              <Crown size={15} color="var(--primary)" />
              <div>
                <h4 style={{ margin: 0, fontSize: '0.84rem', fontWeight: 600, color: 'var(--text-primary)' }}>
                  2-й Этап: Администрация
                </h4>
                <p style={{ margin: 0, fontSize: '0.66rem', color: 'var(--text-muted)', fontFamily: 'var(--font-mono)' }}>
                  Федеральное Правительство
                </p>
              </div>
            </div>

            {bill.status === 'approved' ? (
              <div style={{ padding: '10px', background: 'var(--bg-input)', borderRadius: 'var(--radius-sm)', border: '1px solid var(--success-border)' }}>
                <div style={{ fontSize: '0.74rem', fontFamily: 'var(--font-mono)', fontWeight: 600, color: 'var(--success-text)', marginBottom: '3px' }}>
                  ✓ УТВЕРЖДЕНО
                </div>
                <div style={{ fontSize: '0.76rem', color: 'var(--text-secondary)', lineHeight: 1.4 }}>
                  {bill.statusReason || bill.federalVerdict?.reason || 'Законопроект проверен и утвержден Администрацией.'}
                </div>
              </div>
            ) : bill.federalVerdict && bill.federalVerdict.status === 'rejected' ? (
              <div style={{ padding: '10px', background: 'var(--bg-input)', borderRadius: 'var(--radius-sm)', border: '1px solid var(--danger-border)' }}>
                <div style={{ fontSize: '0.74rem', fontFamily: 'var(--font-mono)', fontWeight: 600, color: 'var(--danger-text)', marginBottom: '3px' }}>
                  ОТКЛОНЕНО
                </div>
                <div style={{ fontSize: '0.76rem', color: 'var(--text-secondary)', lineHeight: 1.4 }}>
                  {bill.federalVerdict.reason}
                </div>
              </div>
            ) : isAdmin ? (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                <textarea 
                  value={adminVerdictReason}
                  onChange={(e) => setAdminVerdictReason(e.target.value)}
                  className="input-field"
                  style={{ width: '100%', minHeight: '60px', fontSize: '0.78rem', resize: 'vertical' }}
                  placeholder="Обоснование вердикта..."
                />

                <div style={{ display: 'flex', gap: '4px' }}>
                  <button 
                    onClick={() => handleExecuteAdminVerdict('approved')}
                    className="btn btn-success btn-pill"
                    style={{ flex: 1, padding: '5px', fontSize: '0.72rem' }}
                  >
                    Одобрить
                  </button>
                  <button 
                    onClick={() => handleExecuteAdminVerdict('needs_revision')}
                    className="btn btn-secondary btn-pill"
                    style={{ flex: 1, padding: '5px', fontSize: '0.72rem' }}
                  >
                    Правки
                  </button>
                  <button 
                    onClick={() => handleExecuteAdminVerdict('rejected')}
                    className="btn btn-danger btn-pill"
                    style={{ flex: 1, padding: '5px', fontSize: '0.72rem' }}
                  >
                    Отклонить
                  </button>
                </div>
              </div>
            ) : (
              <div style={{ fontSize: '0.74rem', color: 'var(--text-muted)', textAlign: 'center', padding: '8px 0', fontFamily: 'var(--font-mono)' }}>
                {isStage1Passed ? 'Ожидает решения Администрации' : 'Доступно после 1-го этапа'}
              </div>
            )}
          </div>

          {/* COMMENTS SECTION */}
          <div className="card" style={{ padding: '14px 16px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '10px', paddingBottom: '8px', borderBottom: '1px solid var(--border-subtle)' }}>
              <MessageSquare size={14} color="var(--text-accent)" />
              <h4 style={{ margin: 0, fontSize: '0.84rem', fontWeight: 600, color: 'var(--text-primary)' }}>
                Обсуждение ({bill.comments?.length || 0})
              </h4>
            </div>

            <CommentsSection 
              billId={bill.id}
              user={user}
              comments={bill.comments || []}
              canComment={!isReadOnly}
              onAddComment={(updatedComments) => {
                handleFieldChange('comments', updatedComments);
              }}
            />
          </div>

        </div>

      </div>

      {/* FULLSCREEN EXPANDED ARTICLE MODAL */}
      {expandedRow && (
        <ExpandedArticleModal
          row={expandedRow}
          canEdit={canEdit && !isReadOnly}
          onUpdateRow={(id, field, val) => {
            updateComparisonRow(id, field, val);
            setExpandedRow((prev) => prev ? { ...prev, [field]: val } : null);
          }}
          onClose={() => setExpandedRow(null)}
        />
      )}

    </div>
  );
};
