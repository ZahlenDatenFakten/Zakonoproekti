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
  FileText
} from 'lucide-react';

interface BillEditorProps {
  bill: Bill;
  user: UserProfile;
  permission: AccessPermission;
  returnView?: 'dashboard' | 'admin_workspace';
  onSave: (updatedBill: Bill) => void;
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
  onBack,
  onShare,
  onToast
}) => {
  const [bill, setBill] = useState<Bill>(initialBill);
  const [isSavedNotice, setIsSavedNotice] = useState(false);
  const [expandedRow, setExpandedRow] = useState<ComparisonRow | null>(null);
  const [showForumExport, setShowForumExport] = useState(false);

  // Admin verdict form state
  const [adminVerdictReason, setAdminVerdictReason] = useState('');

  const currentFullName = `${user.firstName} ${user.lastName}`.trim();
  const isAuthor = bill.author.trim() === currentFullName;
  const isAdmin = isSystemAdmin(user);
  const isOfficial = user.isOfficialVerified && (user.officialRole === 'governor' || user.officialRole === 'prosecutor' || user.officialRole === 'judge');
  const canEdit = permission === 'edit' || isAuthor || isAdmin || (isOfficial && bill.status !== 'approved');

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
    onToast('info', 'Статья удалена из реестра проекта');
  };

  const handleLocalSave = async () => {
    await onSave(bill);
    setIsSavedNotice(true);
    setTimeout(() => setIsSavedNotice(false), 3000);
    onToast('success', 'Законопроект сохранен в реестре');
  };

  const handlePublish = async () => {
    const updated = { ...bill, status: 'under_review' as BillStatus };
    setBill(updated);
    await onSave(updated);
    onToast('success', 'Законопроект отправлен на 1-й этап: Голосование Законодательной Комиссии');
  };

  const votes = bill.votes || {};
  const approvedVotesCount = [votes.prosecutor, votes.judge, votes.governor].filter((v) => v === 'approved').length;
  const rejectedVotesCount = [votes.prosecutor, votes.judge, votes.governor].filter((v) => v === 'rejected').length;

  const isStage1Passed = approvedVotesCount >= 2;
  const isStage1Rejected = rejectedVotesCount >= 2;

  const handleCastVote = async (decision: VoteDecision) => {
    if (!isOfficial) {
      onToast('error', 'Голосование доступно только верифицированным членам Законодательной Комиссии.');
      return;
    }

    const role = user.officialRole;
    if (role !== 'prosecutor' && role !== 'judge' && role !== 'governor' && role !== 'admin') {
      onToast('error', 'Только Прокурор, Председатель ВС и Губернатор входят в Законодательную Комиссию.');
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
    onToast('success', `Ваш голос (${decision === 'approved' ? 'За' : decision === 'rejected' ? 'Против' : 'На доработку'}) записан в реестр!`);
  };

  // --- STAGE 2: ADMIN VERDICT LOGIC ---
  const handleExecuteAdminVerdict = async (decision: VoteDecision) => {
    if (!isAdmin) {
      onToast('error', 'Только Системный Администратор (Федеральное Правительство) выносит вердикт 2-го этапа.');
      return;
    }

    if ((decision === 'rejected' || decision === 'needs_revision') && !adminVerdictReason.trim()) {
      onToast('error', 'Укажите обязательное мотивированное обоснование вердикта.');
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
    onToast('success', `Финальный вердикт вынесен: ${decision === 'approved' ? 'УТВЕРЖДЕНО' : decision === 'rejected' ? 'ОТКЛОНЕНО' : 'НА ДОРАБОТКУ'}`);
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
    <div style={{ display: 'flex', flexDirection: 'column', minHeight: '100vh', background: 'var(--bg-base)' }}>
      
      {/* HIGH-TECH TOP TOOLBAR */}
      <div style={{ 
        height: '64px', 
        background: 'rgba(18, 21, 30, 0.9)', 
        backdropFilter: 'blur(20px)',
        borderBottom: '1px solid var(--border-subtle)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        padding: '0 32px',
        position: 'sticky',
        top: 0,
        zIndex: 100,
        boxShadow: '0 4px 20px rgba(0, 0, 0, 0.4)'
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '18px' }}>
          <button onClick={onBack} className="btn btn-secondary btn-pill" style={{ padding: '7px 16px', fontSize: '0.82rem' }}>
            <ArrowLeft size={15} /> {returnView === 'admin_workspace' ? 'В администрацию' : 'В реестр'}
          </button>
          
          <div style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
            <span className="decree-stamp">
              {formatDecreeNumber(bill.id)}
            </span>
            <h2 style={{ fontSize: '1.1rem', margin: 0, color: 'var(--text-primary)', fontWeight: 800, letterSpacing: '-0.01em' }}>
              {bill.targetLaw || 'Редактор нормативного акта'}
            </h2>
            {getStatusBadge(bill.status)}
          </div>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          {isSavedNotice && (
            <span style={{ fontSize: '0.82rem', color: 'var(--success-text)', display: 'flex', alignItems: 'center', gap: '6px', marginRight: '8px', fontFamily: 'var(--font-mono)', fontWeight: 600 }}>
              <CheckCircle2 size={15} /> Синхронизировано
            </span>
          )}
          
          {bill.status === 'approved' && (
            <button 
              onClick={() => setShowForumExport(true)} 
              className="btn btn-pill" 
              style={{ padding: '7px 16px', fontSize: '0.82rem', background: 'rgba(56, 189, 248, 0.12)', color: 'var(--text-accent)', border: '1px solid rgba(56, 189, 248, 0.35)' }}
            >
              <FileText size={14} /> Текст для Форума
            </button>
          )}

          <button onClick={() => onShare(bill)} className="btn btn-secondary btn-pill" style={{ padding: '7px 16px', fontSize: '0.82rem' }}>
            <Share2 size={14} /> Ссылка доступа
          </button>

          {canEdit && !isReadOnly && (
            <button onClick={handleLocalSave} className="btn btn-primary btn-pill" style={{ padding: '7px 20px', fontSize: '0.84rem' }}>
              <Save size={15} /> Сохранить
            </button>
          )}
        </div>
      </div>

      {/* MAIN WORKSPACE GRID LAYOUT */}
      <div style={{ flex: 1, maxWidth: '1380px', width: '100%', margin: '0 auto', padding: '32px 32px 60px', display: 'flex', gap: '28px', flexWrap: 'wrap' }}>
        
        {/* LEFT PRIMARY DOCUMENT COLUMN */}
        <div style={{ flex: '1 1 680px', minWidth: 0, display: 'flex', flexDirection: 'column', gap: '28px' }}>
          
          {/* LAW METADATA CARD */}
          <div className="card" style={{ padding: '28px' }}>
            <div style={{ marginBottom: '20px' }}>
              <label className="input-label">Наименование целевого Закона / Нормативного Акта</label>
              <input 
                type="text" 
                value={bill.targetLaw}
                onChange={(e) => handleFieldChange('targetLaw', e.target.value)}
                disabled={!canEdit || isReadOnly}
                className="input-field"
                style={{ width: '100%', fontSize: '1.1rem', fontWeight: 700, fontFamily: 'var(--font-sans)' }}
                placeholder="Например: Уголовный кодекс Штата SA (УК)"
              />
            </div>

            <div>
              <label className="input-label">Пояснительная записка к законопроекту</label>
              <textarea 
                value={bill.explanatoryNote}
                onChange={(e) => handleFieldChange('explanatoryNote', e.target.value)}
                disabled={!canEdit || isReadOnly}
                className="input-field"
                style={{ width: '100%', minHeight: '95px', resize: 'vertical', lineHeight: 1.6 }}
                placeholder="Официальное обоснование необходимости и правовых последствий поправок..."
              />
            </div>
          </div>

          {/* ARTICLES HEADER BAR */}
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <div>
              <h3 style={{ margin: 0, fontSize: '1.2rem', fontWeight: 800, color: 'var(--text-primary)' }}>
                Реестр статей к изменению ({bill.comparisons.length})
              </h3>
              <p style={{ margin: '2px 0 0 0', fontSize: '0.82rem', color: 'var(--text-muted)', fontFamily: 'var(--font-mono)' }}>
                Параллельное сопоставление действующих и проектируемых норм
              </p>
            </div>

            {canEdit && !isReadOnly && (
              <button onClick={addComparisonRow} className="btn btn-primary btn-pill" style={{ fontSize: '0.84rem', padding: '8px 20px' }}>
                <Plus size={15} /> Добавить статью
              </button>
            )}
          </div>

          {/* COMPARISON CARDS LIST */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '22px' }}>
            {bill.comparisons.map((row, index) => {
              const diff = computeWordDiff(row.wasContent, row.becameContent);

              return (
                <div key={row.id} className="card" style={{ padding: '0', overflow: 'hidden', border: '1px solid var(--border-medium)' }}>
                  
                  {/* ARTICLE HEADER CONTROL BAR */}
                  <div style={{ 
                    background: 'var(--bg-surface-elevated)', 
                    padding: '12px 24px', 
                    borderBottom: '1px solid var(--border-subtle)', 
                    display: 'flex', 
                    alignItems: 'center', 
                    justifyContent: 'space-between',
                    gap: '16px',
                    flexWrap: 'wrap'
                  }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '12px', flex: 1, minWidth: '320px' }}>
                      <span style={{ fontSize: '0.85rem', color: 'var(--text-accent)', fontWeight: 800, fontFamily: 'var(--font-mono)' }}>
                        §{index + 1}
                      </span>
                      <input 
                        type="text" 
                        value={row.articleTitle}
                        onChange={(e) => updateComparisonRow(row.id, 'articleTitle', e.target.value)}
                        disabled={!canEdit || isReadOnly}
                        className="input-field"
                        style={{ width: '380px', padding: '7px 14px', fontWeight: 600, fontSize: '0.9rem' }}
                        placeholder="Статья 1. Наименование статьи..."
                      />

                      {/* LIVE DIFF METRIC CHIPS */}
                      <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                        {diff.stats.addedWords > 0 && (
                          <span className="badge badge-status-approved" style={{ fontSize: '0.68rem', padding: '2px 8px' }}>
                            +{diff.stats.addedWords} слов
                          </span>
                        )}
                        {diff.stats.removedWords > 0 && (
                          <span className="badge badge-status-rejected" style={{ fontSize: '0.68rem', padding: '2px 8px' }}>
                            -{diff.stats.removedWords} слов
                          </span>
                        )}
                      </div>
                    </div>
                    
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                      {canEdit && !isReadOnly && (
                        <button 
                          onClick={() => copyWasToBecame(row.id)}
                          className="btn btn-secondary"
                          style={{ padding: '6px 12px', fontSize: '0.76rem', fontFamily: 'var(--font-mono)' }}
                          title="Скопировать оригинальный текст в проектируемый"
                        >
                          <Copy size={13} /> Копировать оригинал
                        </button>
                      )}

                      <button 
                        onClick={() => setExpandedRow(row)}
                        className="btn btn-secondary"
                        style={{ padding: '6px 12px', fontSize: '0.76rem', fontFamily: 'var(--font-mono)' }}
                        title="Развернуть в полноэкранный режим 100% Diff"
                      >
                        <Maximize2 size={13} /> 100% Diff Экран
                      </button>

                      {canEdit && !isReadOnly && bill.comparisons.length > 1 && (
                        <button 
                          onClick={() => removeComparisonRow(row.id)}
                          className="btn btn-ghost"
                          style={{ padding: '6px', color: 'var(--danger-text)' }}
                          title="Удалить статью"
                        >
                          <Trash2 size={15} />
                        </button>
                      )}
                    </div>
                  </div>

                  {/* SIDE-BY-SIDE DIFF COLUMNS */}
                  <div style={{ display: 'flex', width: '100%', minHeight: '220px', flexWrap: 'wrap' }}>
                    
                    {/* LEFT: ORIGINAL TEXT & LIVE REMOVAL PREVIEW */}
                    <div style={{ flex: '1 1 300px', borderRight: '1px solid var(--border-subtle)', display: 'flex', flexDirection: 'column' }}>
                      <div style={{ 
                        padding: '8px 24px', 
                        background: 'rgba(248, 81, 73, 0.08)', 
                        color: 'var(--danger-text)', 
                        fontSize: '0.7rem', 
                        fontWeight: 700, 
                        textTransform: 'uppercase', 
                        letterSpacing: '0.08em', 
                        fontFamily: 'var(--font-mono)',
                        borderBottom: '1px solid var(--border-subtle)',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'space-between'
                      }}>
                        <span>Действующая редакция (Оригинал)</span>
                        <span style={{ fontSize: '0.65rem', opacity: 0.8 }}>УДАЛЕНИЯ (-)</span>
                      </div>
                      
                      <textarea 
                        value={row.wasContent}
                        onChange={(e) => updateComparisonRow(row.id, 'wasContent', e.target.value)}
                        disabled={!canEdit || isReadOnly}
                        style={{ 
                          flex: 1, 
                          border: 'none', 
                          background: 'transparent', 
                          color: 'var(--text-primary)', 
                          padding: '16px 24px', 
                          resize: 'vertical', 
                          outline: 'none', 
                          fontFamily: 'var(--font-sans)', 
                          fontSize: '0.9rem', 
                          lineHeight: 1.6,
                          minHeight: '140px'
                        }}
                        placeholder="Текст действующей статьи..."
                      />

                      {/* LIVE REAL-TIME DIFF VISUALIZER BOX */}
                      {row.wasContent && (
                        <div style={{ 
                          margin: '0 16px 16px', 
                          padding: '12px 16px', 
                          background: 'var(--bg-input)', 
                          border: '1px solid rgba(248, 81, 73, 0.3)', 
                          borderRadius: 'var(--radius-sm)', 
                          fontSize: '0.86rem', 
                          lineHeight: 1.6 
                        }}>
                          <div className="tech-label" style={{ color: 'var(--danger-text)', marginBottom: '4px', fontSize: '0.65rem' }}>
                            🔍 Живой аналитический просмотр вычеркиваний:
                          </div>
                          {diff.wasFormatted}
                        </div>
                      )}
                    </div>

                    {/* RIGHT: PROPOSED REFORM TEXT & LIVE ADDITION PREVIEW */}
                    <div style={{ flex: '1 1 300px', display: 'flex', flexDirection: 'column' }}>
                      <div style={{ 
                        padding: '8px 24px', 
                        background: 'rgba(63, 185, 80, 0.08)', 
                        color: 'var(--success-text)', 
                        fontSize: '0.7rem', 
                        fontWeight: 700, 
                        textTransform: 'uppercase', 
                        letterSpacing: '0.08em', 
                        fontFamily: 'var(--font-mono)',
                        borderBottom: '1px solid var(--border-subtle)',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'space-between'
                      }}>
                        <span>Проектируемая редакция (Поправки)</span>
                        <span style={{ fontSize: '0.65rem', opacity: 0.8 }}>ДОБАВЛЕНИЯ (+)</span>
                      </div>

                      <textarea 
                        value={row.becameContent}
                        onChange={(e) => updateComparisonRow(row.id, 'becameContent', e.target.value)}
                        disabled={!canEdit || isReadOnly}
                        style={{ 
                          flex: 1, 
                          border: 'none', 
                          background: 'transparent', 
                          color: 'var(--text-primary)', 
                          padding: '16px 24px', 
                          resize: 'vertical', 
                          outline: 'none', 
                          fontFamily: 'var(--font-sans)', 
                          fontSize: '0.9rem', 
                          lineHeight: 1.6,
                          minHeight: '140px'
                        }}
                        placeholder="Предлагаемая формулировка статьи..."
                      />

                      {/* LIVE REAL-TIME DIFF VISUALIZER BOX */}
                      {row.becameContent && (
                        <div style={{ 
                          margin: '0 16px 16px', 
                          padding: '12px 16px', 
                          background: 'var(--bg-input)', 
                          border: '1px solid rgba(63, 185, 80, 0.3)', 
                          borderRadius: 'var(--radius-sm)', 
                          fontSize: '0.86rem', 
                          lineHeight: 1.6 
                        }}>
                          <div className="tech-label" style={{ color: 'var(--success-text)', marginBottom: '4px', fontSize: '0.65rem' }}>
                            🔍 Живой аналитический просмотр поправок:
                          </div>
                          {diff.becameFormatted}
                        </div>
                      )}
                    </div>

                  </div>
                </div>
              );
            })}
          </div>

        </div>

        {/* RIGHT SIDEBAR COLUMN */}
        <div style={{ flex: '0 0 360px', display: 'flex', flexDirection: 'column', gap: '24px' }}>
          
          {/* INITIATOR / AUTHOR CARD */}
          <div className="card" style={{ padding: '20px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '14px' }}>
              <div style={{
                width: '40px', height: '40px', borderRadius: '50%',
                background: 'rgba(56, 189, 248, 0.12)',
                border: '1px solid rgba(56, 189, 248, 0.3)',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                flexShrink: 0
              }}>
                <UserCheck size={18} color="var(--text-accent)" />
              </div>
              <div>
                <div style={{ fontSize: '0.96rem', fontWeight: 700, color: '#f8fafc', lineHeight: 1.2 }}>
                  {bill.author}
                </div>
                <div style={{ 
                  padding: '2px 8px', 
                  borderRadius: '6px', 
                  background: 'rgba(255, 255, 255, 0.05)', 
                  border: '1px solid rgba(255, 255, 255, 0.1)', 
                  color: '#cbd5e1', 
                  fontSize: '0.72rem', 
                  fontWeight: 600, 
                  display: 'inline-flex', 
                  alignItems: 'center', 
                  marginTop: '4px' 
                }}>
                  {bill.authorRole}
                </div>
              </div>
            </div>

            {canEdit && bill.status === 'draft' && (
              <button 
                onClick={handlePublish}
                className="btn btn-primary btn-pill" 
                style={{ width: '100%', padding: '10px', fontSize: '0.86rem', marginTop: '4px' }}
              >
                <Send size={15} /> Опубликовать на рассмотрение
              </button>
            )}
          </div>

          {/* STAGE 1: LEGISLATIVE COMMISSION VOTING WIDGET */}
          <div className="card" style={{ padding: '20px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '14px', borderBottom: '1px solid var(--border-subtle)', paddingBottom: '10px' }}>
              <ShieldCheck size={18} color="var(--text-accent)" />
              <div>
                <h4 style={{ margin: 0, fontSize: '0.92rem', fontWeight: 800, color: 'var(--text-primary)' }}>
                  1-й Этап: Комиссия Штата
                </h4>
                <p style={{ margin: 0, fontSize: '0.7rem', color: 'var(--text-muted)', fontFamily: 'var(--font-mono)' }}>
                  Голосование руководства (кворум 2/3)
                </p>
              </div>
            </div>

            {/* COMMITTEE VOTES LIST */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', marginBottom: '16px' }}>
              {[
                { roleKey: 'prosecutor', title: 'Ген. Прокурор', vote: votes.prosecutor },
                { roleKey: 'judge', title: 'Пред. Верх. Суда', vote: votes.judge },
                { roleKey: 'governor', title: 'Губернатор Штата', vote: votes.governor }
              ].map((item) => (
                <div key={item.roleKey} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '8px 12px', background: 'var(--bg-input)', borderRadius: 'var(--radius-sm)', border: '1px solid var(--border-subtle)' }}>
                  <span style={{ fontSize: '0.78rem', fontWeight: 600, color: 'var(--text-secondary)' }}>
                    {item.title}
                  </span>
                  {item.vote === 'approved' ? (
                    <span style={{ fontSize: '0.72rem', color: 'var(--success-text)', fontFamily: 'var(--font-mono)', fontWeight: 700, display: 'flex', alignItems: 'center', gap: '4px' }}>
                      <Check size={12} /> За
                    </span>
                  ) : item.vote === 'rejected' ? (
                    <span style={{ fontSize: '0.72rem', color: 'var(--danger-text)', fontFamily: 'var(--font-mono)', fontWeight: 700, display: 'flex', alignItems: 'center', gap: '4px' }}>
                      <X size={12} /> Против
                    </span>
                  ) : item.vote === 'needs_revision' ? (
                    <span style={{ fontSize: '0.72rem', color: 'var(--warning-text)', fontFamily: 'var(--font-mono)', fontWeight: 700, display: 'flex', alignItems: 'center', gap: '4px' }}>
                      <RotateCcw size={12} /> Доработка
                    </span>
                  ) : (
                    <span style={{ fontSize: '0.72rem', color: 'var(--text-muted)', fontFamily: 'var(--font-mono)' }}>Ожидает</span>
                  )}
                </div>
              ))}
            </div>

            {/* VOTING SUMMARY CHIP */}
            <div style={{ background: 'var(--bg-input)', padding: '10px 14px', borderRadius: 'var(--radius-sm)', marginBottom: '16px', border: '1px solid var(--border-subtle)', textAlign: 'center' }}>
              <div style={{ fontSize: '0.78rem', fontFamily: 'var(--font-mono)', fontWeight: 700, color: isStage1Passed ? 'var(--success-text)' : isStage1Rejected ? 'var(--danger-text)' : 'var(--text-primary)' }}>
                {isStage1Passed 
                  ? `ОДОБРЕНО КОМИССИЕЙ (${approvedVotesCount}/3) — 2-й этап!` 
                  : isStage1Rejected 
                  ? `ОТКЛОНЕНО КОМИССИЕЙ (${rejectedVotesCount}/3)`
                  : `Итог: ${approvedVotesCount} За / ${rejectedVotesCount} Против`}
              </div>
            </div>

            {/* VOTING BUTTONS FOR OFFICIALS */}
            {bill.status === 'under_review' && !isStage1Passed && !isStage1Rejected && (() => {
              const myCurrentVote = (user.officialRole === 'prosecutor' ? votes.prosecutor : user.officialRole === 'judge' ? votes.judge : votes.governor);

              return (
                <div>
                  <label className="input-label" style={{ marginBottom: '8px' }}>Ваше решение Комиссии:</label>
                  <div style={{ display: 'flex', gap: '6px' }}>
                    <button 
                      onClick={() => handleCastVote('approved')}
                      className="btn btn-pill vote-btn-approved" 
                      style={{ 
                        flex: 1, 
                        padding: '7px 6px', 
                        fontSize: '0.76rem', 
                        background: myCurrentVote === 'approved' ? 'var(--success-bg)' : 'var(--bg-input)', 
                        color: myCurrentVote === 'approved' ? 'var(--success-text)' : 'var(--text-secondary)', 
                        border: `1px solid ${myCurrentVote === 'approved' ? 'var(--success-border)' : 'rgba(255, 255, 255, 0.1)'}`,
                        boxShadow: myCurrentVote === 'approved' ? '0 0 12px var(--success-glow)' : 'none',
                        fontWeight: myCurrentVote === 'approved' ? 700 : 500
                      }}
                    >
                      <Check size={13} /> За
                    </button>
                    <button 
                      onClick={() => handleCastVote('needs_revision')}
                      className="btn btn-pill vote-btn-revision" 
                      style={{ 
                        flex: 1, 
                        padding: '7px 6px', 
                        fontSize: '0.76rem', 
                        background: myCurrentVote === 'needs_revision' ? 'var(--warning-bg)' : 'var(--bg-input)', 
                        color: myCurrentVote === 'needs_revision' ? 'var(--warning-text)' : 'var(--text-secondary)', 
                        border: `1px solid ${myCurrentVote === 'needs_revision' ? 'var(--warning-border)' : 'rgba(255, 255, 255, 0.1)'}`,
                        boxShadow: myCurrentVote === 'needs_revision' ? '0 0 12px var(--warning-glow)' : 'none',
                        fontWeight: myCurrentVote === 'needs_revision' ? 700 : 500
                      }}
                    >
                      <RotateCcw size={13} /> Правки
                    </button>
                    <button 
                      onClick={() => handleCastVote('rejected')}
                      className="btn btn-pill vote-btn-rejected" 
                      style={{ 
                        flex: 1, 
                        padding: '7px 6px', 
                        fontSize: '0.76rem', 
                        background: myCurrentVote === 'rejected' ? 'var(--danger-bg)' : 'var(--bg-input)', 
                        color: myCurrentVote === 'rejected' ? 'var(--danger-text)' : 'var(--text-secondary)', 
                        border: `1px solid ${myCurrentVote === 'rejected' ? 'var(--danger-border)' : 'rgba(255, 255, 255, 0.1)'}`,
                        boxShadow: myCurrentVote === 'rejected' ? '0 0 12px var(--danger-glow)' : 'none',
                        fontWeight: myCurrentVote === 'rejected' ? 700 : 500
                      }}
                    >
                      <X size={13} /> Против
                    </button>
                  </div>
                </div>
              );
            })()}
          </div>

          {/* STAGE 2: ADMIN VERDICT WIDGET */}
          <div className="card" style={{ padding: '20px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '14px', borderBottom: '1px solid var(--border-subtle)', paddingBottom: '10px' }}>
              <Crown size={18} color="var(--primary)" />
              <div>
                <h4 style={{ margin: 0, fontSize: '0.92rem', fontWeight: 800, color: 'var(--text-primary)' }}>
                  2-й Этап: Вердикт Администрации
                </h4>
                <p style={{ margin: 0, fontSize: '0.7rem', color: 'var(--text-muted)', fontFamily: 'var(--font-mono)' }}>
                  Утверждение Федеральным Правительством
                </p>
              </div>
            </div>

            {bill.federalVerdict ? (
              <div style={{ padding: '14px', background: 'var(--bg-input)', borderRadius: 'var(--radius-sm)', border: '1px solid var(--border-subtle)' }}>
                <div style={{ fontSize: '0.82rem', fontFamily: 'var(--font-mono)', fontWeight: 800, color: bill.federalVerdict.status === 'approved' ? 'var(--success-text)' : 'var(--danger-text)', marginBottom: '4px' }}>
                  {bill.federalVerdict.status === 'approved' ? 'ОФИЦИАЛЬНО УТВЕРЖДЕНО' : 'ОТКЛОНЕНО АДМИНИСТРАЦИЕЙ'}
                </div>
                <div style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', lineHeight: 1.45 }}>
                  {bill.federalVerdict.reason}
                </div>
                <div style={{ fontSize: '0.68rem', color: 'var(--text-muted)', marginTop: '8px', fontFamily: 'var(--font-mono)' }}>
                  Администратор: {bill.federalVerdict.adminName}
                </div>
              </div>
            ) : isAdmin && (isStage1Passed || bill.status === 'under_review') ? (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                <label className="input-label">Мотивированное обоснование вердикта:</label>
                <textarea 
                  value={adminVerdictReason}
                  onChange={(e) => setAdminVerdictReason(e.target.value)}
                  className="input-field"
                  style={{ width: '100%', minHeight: '80px', fontSize: '0.82rem', resize: 'vertical' }}
                  placeholder="Официальное заключение Администрации..."
                />

                <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                  <button 
                    onClick={() => handleExecuteAdminVerdict('approved')}
                    className="btn btn-primary btn-pill"
                    style={{ width: '100%', padding: '9px', fontSize: '0.82rem' }}
                  >
                    <CheckCircle2 size={15} /> Утвердить законом
                  </button>
                  <div style={{ display: 'flex', gap: '6px' }}>
                    <button 
                      onClick={() => handleExecuteAdminVerdict('needs_revision')}
                      className="btn btn-secondary btn-pill"
                      style={{ flex: 1, padding: '7px', fontSize: '0.76rem' }}
                    >
                      <RotateCcw size={13} /> Правки
                    </button>
                    <button 
                      onClick={() => handleExecuteAdminVerdict('rejected')}
                      className="btn btn-danger btn-pill"
                      style={{ flex: 1, padding: '7px', fontSize: '0.76rem' }}
                    >
                      <XCircle size={13} /> Отклонить
                    </button>
                  </div>
                </div>
              </div>
            ) : (
              <div style={{ fontSize: '0.78rem', color: 'var(--text-muted)', textAlign: 'center', padding: '12px 0', fontFamily: 'var(--font-mono)' }}>
                {isStage1Passed ? 'Ожидает решения Администрации' : 'Доступно после 1-го этапа'}
              </div>
            )}
          </div>

          {/* COMMENTS & EXPERT FEEDBACK */}
          <div className="card" style={{ padding: '20px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '14px', borderBottom: '1px solid var(--border-subtle)', paddingBottom: '10px' }}>
              <MessageSquare size={16} color="var(--text-accent)" />
              <h4 style={{ margin: 0, fontSize: '0.92rem', fontWeight: 800, color: 'var(--text-primary)' }}>
                Правовое обсуждение ({bill.comments?.length || 0})
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
