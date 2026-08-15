import React, { useState, useEffect, useRef } from 'react';
import type { Bill, ComparisonRow, AccessPermission, UserProfile, BillStatus, VoteDecision, FederalGovernmentVerdict } from '../types/bill';
import { CommentsSection } from './CommentsSection';
import { ExpandedArticleModal } from './ExpandedArticleModal';
import { ForumExportModal } from './ForumExportModal';
import { isSystemAdmin } from '../services/securityService';
import { computeWordDiff } from '../services/diffService';
import { 
  ArrowLeft, 
  Save, 
  Share2, 
  Plus, 
  Trash2, 
  CheckCircle2, 
  XCircle, 
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
  FileCode,
  Sparkles,
  ChevronDown,
  ChevronUp
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
  const [showForumExport, setShowForumExport] = useState(false);
  const [showDiffPreviewMap, setShowDiffPreviewMap] = useState<{ [key: string]: boolean }>({});

  // Admin verdict form state
  const [adminVerdictReason, setAdminVerdictReason] = useState('');

  const currentFullName = `${user.firstName} ${user.lastName}`.trim();
  const isAuthor = !bill.author || bill.author.trim().toLowerCase() === currentFullName.toLowerCase() || bill.author.trim() === currentFullName || isSystemAdmin(user);
  const isAdmin = isSystemAdmin(user);
  const isOfficial = user.isOfficialVerified && (user.officialRole === 'governor' || user.officialRole === 'prosecutor' || user.officialRole === 'judge');
  const canEdit = permission === 'edit' || isAuthor || isAdmin || (isOfficial && bill.status !== 'approved');
  const canDelete = isAuthor || isAdmin;

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
      }, 500);
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
    onToast('info', 'Текст оригинала скопирован в проектируемую редакцию');
  };

  const removeComparisonRow = (id: string) => {
    if (!canEdit) return;
    const updated = bill.comparisons.filter((row) => row.id !== id);
    handleFieldChange('comparisons', updated);
    onToast('info', 'Статья удалена из проекта');
  };

  const toggleDiffPreview = (id: string) => {
    setShowDiffPreviewMap((prev) => ({
      ...prev,
      [id]: !prev[id]
    }));
  };

  const handleLocalSave = async () => {
    await onSave(bill);
    setIsSavedNotice(true);
    setTimeout(() => setIsSavedNotice(false), 3000);
    onToast('success', 'Законопроект сохранен в реестре');
  };

  const handlePublish = async () => {
    const updated: Bill = { 
      ...bill, 
      status: 'under_review' as BillStatus,
      statusReason: 'Официально опубликован автором и передан на 1-й этап: Законодательная Комиссия',
      updatedAt: new Date().toISOString()
    };
    setBill(updated);
    await onSave(updated);
    setIsSavedNotice(true);
    setTimeout(() => setIsSavedNotice(false), 3000);
    onToast('success', '🚀 Законопроект опубликован и передан в Законодательную Комиссию!');
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
      onToast('error', 'Только Прокурор, Председатель ВС и Губернатор входят в Комиссию.');
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
      statusReason = `Прошел 1-й этап комиссии (${newApproveCount}/3 голосов За). Ожидает 2-й этап (Вердикт Администрации).`;
    } else if (newRejectCount >= 2) {
      newStatus = 'rejected';
      statusReason = `Отклонен Законодательной Комиссией (${newRejectCount}/3 голосов Против).`;
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
    onToast('success', `Ваш голос (${decision === 'approved' ? 'За' : decision === 'rejected' ? 'Против' : 'На доработку'}) учтен в реестре!`);
  };

  const handleExecuteAdminVerdict = async (decision: VoteDecision) => {
    if (!isAdmin) {
      onToast('error', 'Только Системный Администратор выносит вердикт 2-го этапа.');
      return;
    }

    if ((decision === 'rejected' || decision === 'needs_revision') && !adminVerdictReason.trim()) {
      onToast('error', 'Укажите обязательное обоснование вердикта.');
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
      officialStatusReason = 'Официально утвержден Федеральным Правительством и вступил в силу.';
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
    onToast('success', `Вердикт вынесен: ${decision === 'approved' ? 'УТВЕРЖДЕНО' : decision === 'rejected' ? 'ОТКЛОНЕНО' : 'НА ДОРАБОТКУ'}`);
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
    onToast('success', 'Изменения внесены в законодательную базу Штата!');
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
            <span className="status-dot status-dot-info" /> Реформирование
          </span>
        );
      case 'under_review':
        return (
          <span className="badge badge-status-review">
            <span className="status-dot status-dot-review" /> {isStage1Passed ? '2-й Этап (Администрация)' : '1-й Этап (Комиссия)'}
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
    <div className="bill-creation-active" style={{ display: 'flex', flexDirection: 'column', minHeight: '100vh', background: 'var(--bg-base)' }}>
      
      {/* ══════════════════════════════════════════════════════════════════
          EXECUTIVE ACTION TOOLBAR (TOP BAR)
          ══════════════════════════════════════════════════════════════════ */}
      <div style={{ 
        height: '60px', 
        background: 'var(--bg-glass)', 
        backdropFilter: 'blur(20px)',
        WebkitBackdropFilter: 'blur(20px)',
        borderBottom: '1px solid var(--border-subtle)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        padding: '0 28px',
        position: 'sticky',
        top: 0,
        zIndex: 100
      }}>
        {/* Left Side: Back navigation & Law Identity */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '14px', minWidth: 0 }}>
          <button 
            onClick={onBack} 
            className="btn btn-secondary btn-pill" 
            style={{ padding: '6px 14px', fontSize: '0.8rem' }}
          >
            <ArrowLeft size={14} /> {returnView === 'admin_workspace' ? 'Администрация' : 'В реестр'}
          </button>
          
          <div style={{ width: '1px', height: '18px', background: 'var(--border-subtle)' }} />

          <span className="decree-stamp">
            {formatDecreeNumber(bill.id)}
          </span>

          <h2 style={{ 
            fontSize: '1rem', 
            margin: 0, 
            color: 'var(--text-primary)', 
            fontWeight: 700, 
            whiteSpace: 'nowrap', 
            overflow: 'hidden', 
            textOverflow: 'ellipsis',
            maxWidth: '380px' 
          }}>
            {bill.targetLaw || 'Новый законопроект'}
          </h2>

          {getStatusBadge(bill.status)}
        </div>

        {/* Right Side: Grouped Actions with Clean Hierarchy */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexShrink: 0 }}>
          {isSavedNotice && (
            <span style={{ fontSize: '0.78rem', color: 'var(--success-text)', display: 'flex', alignItems: 'center', gap: '5px', marginRight: '6px', fontFamily: 'var(--font-mono)', fontWeight: 600 }}>
              <CheckCircle2 size={14} /> Сохранено
            </span>
          )}

          {/* Secondary Actions */}
          <button 
            onClick={() => onShare(bill)} 
            className="btn btn-secondary btn-pill" 
            style={{ padding: '6px 12px', fontSize: '0.78rem' }}
            title="Получить ссылку доступа к законопроекту"
          >
            <Share2 size={13} /> Поделиться
          </button>

          <button 
            onClick={() => setShowForumExport(true)} 
            className="btn btn-secondary btn-pill" 
            style={{ padding: '6px 12px', fontSize: '0.78rem' }}
            title="Сгенерировать официальный BB-код для Государственного Форума"
          >
            <FileCode size={13} /> Экспорт для форума
          </button>

          {canDelete && (
            <button 
              type="button"
              onClick={() => {
                if (onDelete) {
                  onDelete(bill.id);
                }
              }} 
              className="btn btn-danger btn-pill" 
              style={{ padding: '6px 12px', fontSize: '0.78rem' }}
              title="Отозвать и удалить проект"
            >
              <Trash2 size={13} /> Удалить
            </button>
          )}

          {/* Primary Action Button (Prominent & Clear) */}
          {bill.status === 'draft' && canEdit && (
            <button 
              onClick={handlePublish} 
              className="btn btn-primary btn-pill" 
              style={{ padding: '6px 18px', fontSize: '0.82rem', fontWeight: 700 }}
              title="Передать проект на рассмотрение Законодательной Комиссии"
            >
              <Send size={14} /> Опубликовать проект
            </button>
          )}
          
          {isAdmin && bill.status !== 'approved' && (
            <button 
              onClick={() => handleExecuteAdminVerdict('approved')} 
              className="btn btn-success btn-pill" 
              style={{ padding: '6px 18px', fontSize: '0.82rem', fontWeight: 700 }}
              title="Утвердить законопроект от лица Федерального Правительства"
            >
              <CheckCircle2 size={14} /> Одобрить законопроект
            </button>
          )}

          {bill.status === 'approved' && (
            bill.statusReason?.includes('внесены в законодательную базу') ? (
              <span className="badge badge-status-approved" style={{ padding: '6px 12px', fontSize: '0.78rem' }}>
                <CheckCircle2 size={14} /> Законы обновлены
              </span>
            ) : (
              <button 
                onClick={handleEnactLaws} 
                className="btn btn-primary btn-pill" 
                style={{ padding: '6px 18px', fontSize: '0.82rem', fontWeight: 700 }}
                title="Официально внести изменения в законы Штата"
              >
                <FileText size={14} /> Внести в законы
              </button>
            )
          )}

          {canEdit && !isReadOnly && (
            <button 
              onClick={handleLocalSave} 
              className="btn btn-secondary btn-pill" 
              style={{ padding: '6px 14px', fontSize: '0.8rem' }}
              title="Сохранить изменения"
            >
              <Save size={14} /> Сохранить
            </button>
          )}
        </div>
      </div>

      {/* ══════════════════════════════════════════════════════════════════
          MAIN WORKSPACE LAYOUT
          ══════════════════════════════════════════════════════════════════ */}
      <div style={{ 
        flex: 1, 
        maxWidth: '1360px', 
        width: '100%', 
        margin: '0 auto', 
        padding: '24px 24px 60px', 
        display: 'grid', 
        gridTemplateColumns: 'minmax(0, 1fr) 340px', 
        gap: '24px',
        alignItems: 'start'
      }}>
        
        {/* LEFT COLUMN: PRIMARY DOCUMENT */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
          
          {/* LAW METADATA CARD */}
          <div className="card" style={{ padding: '22px 24px' }}>
            <div style={{ marginBottom: '16px' }}>
              <label className="input-label">Наименование целевого Закона / Нормативного Акта</label>
              <input 
                type="text" 
                value={bill.targetLaw}
                onChange={(e) => handleFieldChange('targetLaw', e.target.value)}
                disabled={!canEdit || isReadOnly}
                className="input-field"
                style={{ width: '100%', fontSize: '1.05rem', fontWeight: 700 }}
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
                style={{ width: '100%', minHeight: '85px', resize: 'vertical', lineHeight: 1.6 }}
                placeholder="Официальное обоснование необходимости и целей внесения поправок..."
              />
            </div>
          </div>

          {/* ARTICLES SECTION HEADER */}
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginTop: '4px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
              <h3 style={{ margin: 0, fontSize: '1.05rem', fontWeight: 700, color: 'var(--text-primary)' }}>
                Реестр статей к изменению
              </h3>
              <span style={{ 
                padding: '2px 8px', 
                borderRadius: 'var(--radius-pill)', 
                background: 'rgba(56, 189, 248, 0.1)', 
                color: 'var(--text-accent)', 
                fontSize: '0.72rem', 
                fontFamily: 'var(--font-mono)',
                fontWeight: 700
              }}>
                {bill.comparisons.length}
              </span>
            </div>

            {canEdit && !isReadOnly && (
              <button 
                onClick={addComparisonRow} 
                className="btn btn-primary btn-pill" 
                style={{ fontSize: '0.8rem', padding: '7px 16px' }}
              >
                <Plus size={14} /> Добавить статью
              </button>
            )}
          </div>

          {/* ARTICLES LIST */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '18px' }}>
            {bill.comparisons.map((row, index) => {
              const diff = computeWordDiff(row.wasContent, row.becameContent);
              const isDiffOpen = showDiffPreviewMap[row.id] ?? true;

              return (
                <div key={row.id} className="card article-card-entry" style={{ padding: '0', overflow: 'hidden' }}>
                  
                  {/* ARTICLE CARD HEADER */}
                  <div style={{ 
                    background: 'var(--bg-surface-elevated)', 
                    padding: '10px 18px', 
                    borderBottom: '1px solid var(--border-subtle)', 
                    display: 'flex', 
                    alignItems: 'center', 
                    justifyContent: 'space-between',
                    gap: '12px',
                    flexWrap: 'wrap'
                  }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '10px', flex: 1, minWidth: '280px' }}>
                      <span style={{ 
                        fontSize: '0.82rem', 
                        color: 'var(--text-accent)', 
                        fontWeight: 700, 
                        fontFamily: 'var(--font-mono)',
                        padding: '2px 8px',
                        background: 'rgba(56, 189, 248, 0.08)',
                        borderRadius: 'var(--radius-xs)'
                      }}>
                        § {index + 1}
                      </span>
                      
                      <input 
                        type="text" 
                        value={row.articleTitle}
                        onChange={(e) => updateComparisonRow(row.id, 'articleTitle', e.target.value)}
                        disabled={!canEdit || isReadOnly}
                        className="input-field"
                        style={{ flex: 1, maxWidth: '360px', padding: '6px 12px', fontWeight: 600, fontSize: '0.86rem' }}
                        placeholder="Статья 1. Наименование статьи..."
                      />

                      {/* DIFF METRIC PILLS */}
                      <div style={{ display: 'flex', alignItems: 'center', gap: '5px' }}>
                        {diff.stats.addedWords > 0 && (
                          <span className="diff-token-added" style={{ fontSize: '0.68rem', fontFamily: 'var(--font-mono)' }}>
                            +{diff.stats.addedWords} слов
                          </span>
                        )}
                        {diff.stats.removedWords > 0 && (
                          <span className="diff-token-removed" style={{ fontSize: '0.68rem', fontFamily: 'var(--font-mono)' }}>
                            -{diff.stats.removedWords} слов
                          </span>
                        )}
                      </div>
                    </div>
                    
                    {/* QUICK ACTION BUTTONS */}
                    <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                      {canEdit && !isReadOnly && (
                        <button 
                          onClick={() => copyWasToBecame(row.id)}
                          className="btn btn-ghost"
                          style={{ padding: '5px 10px', fontSize: '0.74rem' }}
                          title="Скопировать оригинальный текст в проектируемый"
                        >
                          <Copy size={12} /> Копировать оригинал
                        </button>
                      )}

                      <button 
                        onClick={() => setExpandedRow(row)}
                        className="btn btn-ghost"
                        style={{ padding: '5px 10px', fontSize: '0.74rem' }}
                        title="Развернуть в полноэкранный режим"
                      >
                        <Maximize2 size={12} /> 100% Diff
                      </button>

                      {canEdit && !isReadOnly && bill.comparisons.length > 1 && (
                        <button 
                          onClick={() => removeComparisonRow(row.id)}
                          className="btn btn-ghost"
                          style={{ padding: '5px 8px', color: 'var(--danger-text)' }}
                          title="Удалить статью"
                        >
                          <Trash2 size={14} />
                        </button>
                      )}
                    </div>
                  </div>

                  {/* SIDE-BY-SIDE SPLIT EDITORS */}
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', borderBottom: '1px solid var(--border-subtle)' }}>
                    
                    {/* LEFT: ORIGINAL TEXT */}
                    <div style={{ borderRight: '1px solid var(--border-subtle)', display: 'flex', flexDirection: 'column' }}>
                      <div style={{ 
                        padding: '6px 16px', 
                        background: 'rgba(244, 63, 94, 0.04)', 
                        borderBottom: '1px solid var(--border-subtle)',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'space-between'
                      }}>
                        <span style={{ fontSize: '0.7rem', fontWeight: 600, color: 'var(--danger-text)', fontFamily: 'var(--font-mono)' }}>
                          ДЕЙСТВУЮЩАЯ РЕДАКЦИЯ (ОРИГИНАЛ)
                        </span>

                        {canEdit && !isReadOnly && (
                          <button
                            type="button"
                            onClick={() => updateComparisonRow(row.id, 'wasContent', '[Ранее статья в действующей редакции закона отсутствовала]')}
                            className="btn btn-ghost"
                            style={{
                              fontSize: '0.66rem',
                              padding: '2px 8px',
                              color: 'var(--text-accent)',
                              fontWeight: 600
                            }}
                            title="Отметить, что этой статьи не существовало в прежнем законе"
                          >
                            <Sparkles size={11} /> Статьи ранее не было
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
                          padding: '14px 16px', 
                          resize: 'vertical', 
                          outline: 'none', 
                          fontFamily: 'var(--font-sans)', 
                          fontSize: '0.88rem', 
                          lineHeight: 1.6,
                          minHeight: '130px'
                        }}
                        placeholder="Вставьте исходный текст действующей статьи..."
                      />
                    </div>

                    {/* RIGHT: PROPOSED REFORM TEXT */}
                    <div style={{ display: 'flex', flexDirection: 'column' }}>
                      <div style={{ 
                        padding: '6px 16px', 
                        background: 'rgba(16, 185, 129, 0.04)', 
                        borderBottom: '1px solid var(--border-subtle)',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'space-between'
                      }}>
                        <span style={{ fontSize: '0.7rem', fontWeight: 600, color: 'var(--success-text)', fontFamily: 'var(--font-mono)' }}>
                          ПРОЕКТИРУЕМАЯ РЕДАКЦИЯ (ПОПРАВКИ)
                        </span>
                        <span style={{ fontSize: '0.65rem', color: 'var(--text-muted)', fontFamily: 'var(--font-mono)' }}>
                          ДОБАВЛЕНИЯ (+)
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
                          padding: '14px 16px', 
                          resize: 'vertical', 
                          outline: 'none', 
                          fontFamily: 'var(--font-sans)', 
                          fontSize: '0.88rem', 
                          lineHeight: 1.6,
                          minHeight: '130px'
                        }}
                        placeholder="Введите предлагаемую новую формулировку статьи..."
                      />
                    </div>

                  </div>

                  {/* SEAMLESS INTEGRATED LIVE DIFF PREVIEW BAR */}
                  {(row.wasContent || row.becameContent) && (
                    <div style={{ background: 'var(--bg-input)' }}>
                      <div 
                        onClick={() => toggleDiffPreview(row.id)}
                        style={{ 
                          padding: '7px 16px', 
                          display: 'flex', 
                          alignItems: 'center', 
                          justifyContent: 'space-between',
                          cursor: 'pointer',
                          userSelect: 'none',
                          borderBottom: isDiffOpen ? '1px solid var(--border-subtle)' : 'none'
                        }}
                      >
                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                          <span style={{ fontSize: '0.7rem', color: 'var(--text-muted)', fontFamily: 'var(--font-mono)', fontWeight: 600 }}>
                            ⚡ СРАВНИТЕЛЬНЫЙ АНАЛИЗ (LIVE DIFF)
                          </span>
                          <span style={{ fontSize: '0.68rem', color: 'var(--text-secondary)' }}>
                            {diff.stats.totalChanges === 0 ? 'Тексты идентичны' : `${diff.stats.totalChanges} изменений`}
                          </span>
                        </div>
                        <div style={{ color: 'var(--text-muted)' }}>
                          {isDiffOpen ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
                        </div>
                      </div>

                      {isDiffOpen && (
                        <div style={{ padding: '12px 18px', fontSize: '0.86rem', lineHeight: 1.6 }}>
                          {diff.unifiedFormatted.length > 0 ? (
                            <div>{diff.unifiedFormatted}</div>
                          ) : (
                            <div style={{ color: 'var(--text-muted)', fontSize: '0.8rem' }}>Текст не введен</div>
                          )}
                        </div>
                      )}
                    </div>
                  )}

                </div>
              );
            })}
          </div>

        </div>

        {/* RIGHT COLUMN: WORKFLOW & APPROVAL SIDEBAR */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
          
          {/* AUTHOR / INITIATOR CARD */}
          <div className="card" style={{ padding: '16px 18px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '12px' }}>
              <div style={{
                width: '36px', height: '36px', borderRadius: '50%',
                background: 'rgba(56, 189, 248, 0.1)',
                border: '1px solid rgba(56, 189, 248, 0.25)',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                flexShrink: 0
              }}>
                <UserCheck size={16} color="var(--text-accent)" />
              </div>
              <div style={{ minWidth: 0 }}>
                <div style={{ fontSize: '0.88rem', fontWeight: 700, color: 'var(--text-primary)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                  {bill.author}
                </div>
                <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)', fontFamily: 'var(--font-mono)' }}>
                  {bill.authorRole || 'Автор инициативы'}
                </div>
              </div>
            </div>

            <div style={{ paddingTop: '10px', borderTop: '1px solid var(--border-subtle)', display: 'flex', flexDirection: 'column', gap: '4px', fontSize: '0.72rem', color: 'var(--text-muted)', fontFamily: 'var(--font-mono)' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                <span>Дата:</span>
                <span style={{ color: 'var(--text-secondary)' }}>{new Date(bill.createdAt).toLocaleDateString('ru-RU')}</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                <span>Ревизия:</span>
                <span style={{ color: 'var(--text-accent)' }}>v1.0 (SHA-256)</span>
              </div>
            </div>
          </div>

          {/* STAGE 1: LEGISLATIVE COMMISSION VOTING */}
          <div className="card" style={{ padding: '16px 18px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '12px', paddingBottom: '10px', borderBottom: '1px solid var(--border-subtle)' }}>
              <ShieldCheck size={16} color="var(--text-accent)" />
              <div>
                <h4 style={{ margin: 0, fontSize: '0.88rem', fontWeight: 700, color: 'var(--text-primary)' }}>
                  1-й Этап: Комиссия Штата
                </h4>
                <p style={{ margin: 0, fontSize: '0.68rem', color: 'var(--text-muted)', fontFamily: 'var(--font-mono)' }}>
                  Кворум 2/3 голосов
                </p>
              </div>
            </div>

            {/* COMMISSION MEMBER LIST */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', marginBottom: '12px' }}>
              {[
                { roleKey: 'prosecutor', title: 'Ген. Прокурор', vote: votes.prosecutor },
                { roleKey: 'judge', title: 'Пред. Верх. Суда', vote: votes.judge },
                { roleKey: 'governor', title: 'Губернатор', vote: votes.governor }
              ].map((item) => (
                <div key={item.roleKey} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '6px 10px', background: 'var(--bg-input)', borderRadius: 'var(--radius-sm)', border: '1px solid var(--border-subtle)' }}>
                  <span style={{ fontSize: '0.76rem', fontWeight: 500, color: 'var(--text-secondary)' }}>
                    {item.title}
                  </span>
                  {item.vote === 'approved' ? (
                    <span style={{ fontSize: '0.7rem', color: 'var(--success-text)', fontFamily: 'var(--font-mono)', fontWeight: 700, display: 'flex', alignItems: 'center', gap: '4px' }}>
                      <Check size={11} /> За
                    </span>
                  ) : item.vote === 'rejected' ? (
                    <span style={{ fontSize: '0.7rem', color: 'var(--danger-text)', fontFamily: 'var(--font-mono)', fontWeight: 700, display: 'flex', alignItems: 'center', gap: '4px' }}>
                      <X size={11} /> Против
                    </span>
                  ) : item.vote === 'needs_revision' ? (
                    <span style={{ fontSize: '0.7rem', color: 'var(--warning-text)', fontFamily: 'var(--font-mono)', fontWeight: 700, display: 'flex', alignItems: 'center', gap: '4px' }}>
                      <RotateCcw size={11} /> Правки
                    </span>
                  ) : (
                    <span style={{ fontSize: '0.7rem', color: 'var(--text-muted)', fontFamily: 'var(--font-mono)' }}>Ожидает</span>
                  )}
                </div>
              ))}
            </div>

            {/* VOTING SUMMARY BAR */}
            <div style={{ background: 'var(--bg-input)', padding: '8px 12px', borderRadius: 'var(--radius-sm)', marginBottom: '12px', border: '1px solid var(--border-subtle)', textAlign: 'center' }}>
              <div style={{ fontSize: '0.75rem', fontFamily: 'var(--font-mono)', fontWeight: 700, color: isStage1Passed ? 'var(--success-text)' : isStage1Rejected ? 'var(--danger-text)' : 'var(--text-secondary)' }}>
                {isStage1Passed 
                  ? `Одобрено Комиссией (${approvedVotesCount}/3)` 
                  : isStage1Rejected 
                  ? `Отклонено Комиссией (${rejectedVotesCount}/3)`
                  : `Итог: ${approvedVotesCount} За / ${rejectedVotesCount} Против`}
              </div>
            </div>

            {/* VOTE BUTTONS FOR COMMITTEE MEMBERS */}
            {bill.status === 'under_review' && !isStage1Passed && !isStage1Rejected && (() => {
              const myVote = (user.officialRole === 'prosecutor' ? votes.prosecutor : user.officialRole === 'judge' ? votes.judge : votes.governor);

              return (
                <div>
                  <label className="input-label" style={{ marginBottom: '6px' }}>Ваш голос:</label>
                  <div style={{ display: 'flex', gap: '5px' }}>
                    <button 
                      onClick={() => handleCastVote('approved')}
                      className="btn btn-pill" 
                      style={{ 
                        flex: 1, 
                        padding: '6px', 
                        fontSize: '0.74rem', 
                        background: myVote === 'approved' ? 'var(--success-bg)' : 'var(--bg-input)', 
                        color: myVote === 'approved' ? 'var(--success-text)' : 'var(--text-secondary)', 
                        border: `1px solid ${myVote === 'approved' ? 'var(--success-border)' : 'var(--border-subtle)'}`,
                        fontWeight: myVote === 'approved' ? 700 : 500
                      }}
                    >
                      <Check size={12} /> За
                    </button>
                    <button 
                      onClick={() => handleCastVote('needs_revision')}
                      className="btn btn-pill" 
                      style={{ 
                        flex: 1, 
                        padding: '6px', 
                        fontSize: '0.74rem', 
                        background: myVote === 'needs_revision' ? 'var(--warning-bg)' : 'var(--bg-input)', 
                        color: myVote === 'needs_revision' ? 'var(--warning-text)' : 'var(--text-secondary)', 
                        border: `1px solid ${myVote === 'needs_revision' ? 'var(--warning-border)' : 'var(--border-subtle)'}`,
                        fontWeight: myVote === 'needs_revision' ? 700 : 500
                      }}
                    >
                      <RotateCcw size={12} /> Правки
                    </button>
                    <button 
                      onClick={() => handleCastVote('rejected')}
                      className="btn btn-pill" 
                      style={{ 
                        flex: 1, 
                        padding: '6px', 
                        fontSize: '0.74rem', 
                        background: myVote === 'rejected' ? 'var(--danger-bg)' : 'var(--bg-input)', 
                        color: myVote === 'rejected' ? 'var(--danger-text)' : 'var(--text-secondary)', 
                        border: `1px solid ${myVote === 'rejected' ? 'var(--danger-border)' : 'var(--border-subtle)'}`,
                        fontWeight: myVote === 'rejected' ? 700 : 500
                      }}
                    >
                      <X size={12} /> Против
                    </button>
                  </div>
                </div>
              );
            })()}
          </div>

          {/* STAGE 2: FEDERAL GOVERNMENT / ADMIN VERDICT */}
          <div className="card" style={{ padding: '16px 18px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '12px', paddingBottom: '10px', borderBottom: '1px solid var(--border-subtle)' }}>
              <Crown size={16} color="var(--primary)" />
              <div>
                <h4 style={{ margin: 0, fontSize: '0.88rem', fontWeight: 700, color: 'var(--text-primary)' }}>
                  2-й Этап: Администрация
                </h4>
                <p style={{ margin: 0, fontSize: '0.68rem', color: 'var(--text-muted)', fontFamily: 'var(--font-mono)' }}>
                  Федеральное Правительство
                </p>
              </div>
            </div>

            {bill.status === 'approved' ? (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                <div style={{ padding: '12px', background: 'var(--bg-input)', borderRadius: 'var(--radius-sm)', border: '1px solid var(--success-border)' }}>
                  <div style={{ fontSize: '0.78rem', fontFamily: 'var(--font-mono)', fontWeight: 700, color: 'var(--success-text)', marginBottom: '4px', display: 'flex', alignItems: 'center', gap: '5px' }}>
                    <CheckCircle2 size={14} /> УТВЕРЖДЕНО
                  </div>
                  <div style={{ fontSize: '0.78rem', color: 'var(--text-secondary)', lineHeight: 1.45 }}>
                    {bill.statusReason || bill.federalVerdict?.reason || 'Законопроект проверен и утвержден Администрацией.'}
                  </div>
                  {bill.federalVerdict?.adminName && (
                    <div style={{ fontSize: '0.66rem', color: 'var(--text-muted)', marginTop: '6px', fontFamily: 'var(--font-mono)' }}>
                      Администратор: {bill.federalVerdict.adminName}
                    </div>
                  )}
                </div>

                {!bill.statusReason?.includes('внесены в законодательную базу') && (
                  <button 
                    onClick={handleEnactLaws}
                    className="btn btn-primary btn-pill"
                    style={{ width: '100%', padding: '8px', fontSize: '0.82rem', fontWeight: 700 }}
                  >
                    <FileText size={14} /> Внести в законы
                  </button>
                )}
              </div>
            ) : bill.federalVerdict && bill.federalVerdict.status === 'rejected' ? (
              <div style={{ padding: '12px', background: 'var(--bg-input)', borderRadius: 'var(--radius-sm)', border: '1px solid var(--danger-border)' }}>
                <div style={{ fontSize: '0.78rem', fontFamily: 'var(--font-mono)', fontWeight: 700, color: 'var(--danger-text)', marginBottom: '4px' }}>
                  ОТКЛОНЕНО АДМИНИСТРАЦИЕЙ
                </div>
                <div style={{ fontSize: '0.78rem', color: 'var(--text-secondary)', lineHeight: 1.45 }}>
                  {bill.federalVerdict.reason}
                </div>
              </div>
            ) : isAdmin ? (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                <label className="input-label">Обоснование вердикта:</label>
                <textarea 
                  value={adminVerdictReason}
                  onChange={(e) => setAdminVerdictReason(e.target.value)}
                  className="input-field"
                  style={{ width: '100%', minHeight: '70px', fontSize: '0.8rem', resize: 'vertical' }}
                  placeholder="Официальное заключение Администрации..."
                />

                <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                  <button 
                    onClick={() => handleExecuteAdminVerdict('approved')}
                    className="btn btn-success btn-pill"
                    style={{ width: '100%', padding: '8px', fontSize: '0.82rem', fontWeight: 700 }}
                  >
                    <CheckCircle2 size={14} /> Одобрить 2-й этап
                  </button>
                  <div style={{ display: 'flex', gap: '5px' }}>
                    <button 
                      onClick={() => handleExecuteAdminVerdict('needs_revision')}
                      className="btn btn-secondary btn-pill"
                      style={{ flex: 1, padding: '6px', fontSize: '0.74rem' }}
                    >
                      <RotateCcw size={12} /> Правки
                    </button>
                    <button 
                      onClick={() => handleExecuteAdminVerdict('rejected')}
                      className="btn btn-danger btn-pill"
                      style={{ flex: 1, padding: '6px', fontSize: '0.74rem' }}
                    >
                      <XCircle size={12} /> Отклонить
                    </button>
                  </div>
                </div>
              </div>
            ) : (
              <div style={{ fontSize: '0.76rem', color: 'var(--text-muted)', textAlign: 'center', padding: '10px 0', fontFamily: 'var(--font-mono)' }}>
                {isStage1Passed ? 'Ожидает решения Администрации' : 'Доступно после 1-го этапа'}
              </div>
            )}
          </div>

          {/* COMMENTS & FEEDBACK */}
          <div className="card" style={{ padding: '16px 18px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '12px', paddingBottom: '10px', borderBottom: '1px solid var(--border-subtle)' }}>
              <MessageSquare size={15} color="var(--text-accent)" />
              <h4 style={{ margin: 0, fontSize: '0.88rem', fontWeight: 700, color: 'var(--text-primary)' }}>
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

      {/* FORUM EXPORT MODAL */}
      {showForumExport && (
        <ForumExportModal
          bill={bill}
          onClose={() => setShowForumExport(false)}
          onToast={onToast}
        />
      )}

    </div>
  );
};
