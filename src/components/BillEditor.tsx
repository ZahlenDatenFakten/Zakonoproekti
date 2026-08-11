import React, { useState, useEffect, useRef } from 'react';
import type { Bill, ComparisonRow, AccessPermission, UserProfile, BillStatus, VoteDecision, FederalGovernmentVerdict } from '../types/bill';
import { CommentsSection } from './CommentsSection';
import { ExpandedArticleModal } from './ExpandedArticleModal';
import { isSystemAdmin } from '../services/securityService';
import { 
  ArrowLeft, 
  Save, 
  Share2, 
  Plus, 
  Trash2, 
  CheckCircle2, 
  XCircle, 
  Clock, 
  RotateCcw,
  Maximize2,
  Send,
  MessageSquare,
  ShieldCheck,
  Check,
  X,
  Copy,
  UserCheck,
  Crown
} from 'lucide-react';

interface BillEditorProps {
  bill: Bill;
  user: UserProfile;
  permission: AccessPermission;
  onSave: (updatedBill: Bill) => void;
  onBack: () => void;
  onShare: (bill: Bill) => void;
  onToast: (type: 'success' | 'error' | 'info', text: string) => void;
}

export const BillEditor: React.FC<BillEditorProps> = ({
  bill: initialBill,
  user,
  permission,
  onSave,
  onBack,
  onShare,
  onToast
}) => {
  const [bill, setBill] = useState<Bill>(initialBill);
  const [isSavedNotice, setIsSavedNotice] = useState(false);
  const [expandedRow, setExpandedRow] = useState<ComparisonRow | null>(null);

  // Admin verdict form state
  const [adminVerdictReason, setAdminVerdictReason] = useState('');

  const canEdit = permission === 'edit';
  const isAdmin = isSystemAdmin(user);
  const isOfficial = user.isOfficialVerified;

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
    onToast('info', 'Статья удалена');
  };

  const handleLocalSave = async () => {
    await onSave(bill);
    setIsSavedNotice(true);
    setTimeout(() => setIsSavedNotice(false), 3000);
    onToast('success', 'Законопроект сохранен');
  };

  const handlePublish = async () => {
    const updated = { ...bill, status: 'under_review' as BillStatus };
    setBill(updated);
    await onSave(updated);
    onToast('success', 'Законопроект отправлен на первый этап — Голосование Комиссии');
  };

  const votes = bill.votes || {};
  const approvedVotesCount = [votes.prosecutor, votes.judge, votes.governor].filter((v) => v === 'approved').length;
  const rejectedVotesCount = [votes.prosecutor, votes.judge, votes.governor].filter((v) => v === 'rejected').length;

  // Rule: 2/1 or 3/3 wins Stage 1!
  const isStage1Passed = approvedVotesCount >= 2;
  const isStage1Rejected = rejectedVotesCount >= 2;

  const handleCastVote = async (decision: VoteDecision) => {
    if (!isOfficial) {
      onToast('error', 'Голосование доступно только верифицированным членам Комиссии.');
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
    onToast('success', `Ваш голос (${decision === 'approved' ? 'За' : decision === 'rejected' ? 'Против' : 'На доработку'}) записан!`);
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
      officialStatusReason = 'Официально утвержден Федеральным Правительством.';
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
    onToast('success', `Финальный вердикт вынесен: ${decision === 'approved' ? 'ОДОБРЕНО' : decision === 'rejected' ? 'ОТКЛОНЕНО' : 'НА ДОРАБОТКУ'}`);
  };

  const getStatusBadge = (status: BillStatus) => {
    const map: Record<BillStatus, { label: string; cls: string; icon: any }> = {
      draft: { label: 'Черновик', cls: 'badge-status-draft', icon: Clock },
      under_review: { label: isStage1Passed ? '2-й Этап (Администрация)' : '1-й Этап (Комиссия)', cls: 'badge-status-review', icon: Clock },
      needs_revision: { label: 'На доработке', cls: 'badge-status-revision', icon: RotateCcw },
      approved: { label: 'Закон Одобрен', cls: 'badge-status-approved', icon: CheckCircle2 },
      rejected: { label: 'Отклонен', cls: 'badge-status-rejected', icon: XCircle }
    };
    const mapped = map[status] || map.draft;
    const Icon = mapped.icon;
    
    return (
      <div className={`badge ${mapped.cls}`}>
        <Icon size={14} /> {mapped.label}
      </div>
    );
  };

  const isReadOnly = bill.status === 'approved' || bill.status === 'rejected';

  return (
    <div style={{ display: 'flex', flexDirection: 'column', minHeight: '100vh', background: 'var(--bg-base)' }}>
      
      {/* EXECUTIVE TOP TOOLBAR */}
      <div style={{ 
        height: '64px', 
        background: 'var(--bg-surface)', 
        backdropFilter: 'blur(20px)',
        borderBottom: '1px solid var(--border-subtle)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        padding: '0 32px',
        position: 'sticky',
        top: 0,
        zIndex: 100,
        boxShadow: 'var(--shadow-sm)'
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '18px' }}>
          <button onClick={onBack} className="btn btn-secondary btn-pill" style={{ padding: '8px 16px', fontSize: '0.84rem' }}>
            <ArrowLeft size={16} /> На главную
          </button>
          
          <div style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
            <h2 style={{ fontSize: '1.15rem', margin: 0, color: 'var(--text-primary)', fontWeight: 800, letterSpacing: '-0.01em' }}>
              {bill.targetLaw || 'Редактор законопроекта'}
            </h2>
            {getStatusBadge(bill.status)}
          </div>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          {isSavedNotice && (
            <span style={{ fontSize: '0.85rem', color: 'var(--success-text)', display: 'flex', alignItems: 'center', gap: '6px', marginRight: '8px', fontWeight: 600 }}>
              <CheckCircle2 size={16} /> Сохранено
            </span>
          )}
          
          <button onClick={() => onShare(bill)} className="btn btn-secondary btn-pill" style={{ padding: '8px 18px', fontSize: '0.84rem' }}>
            <Share2 size={15} /> Поделиться
          </button>

          {canEdit && !isReadOnly && (
            <button onClick={handleLocalSave} className="btn btn-primary btn-pill" style={{ padding: '8px 22px', fontSize: '0.86rem' }}>
              <Save size={16} /> Сохранить
            </button>
          )}
        </div>
      </div>

      {/* MAIN WORKSPACE GRID LAYOUT */}
      <div style={{ flex: 1, maxWidth: '1360px', width: '100%', margin: '0 auto', padding: '32px 32px 60px', display: 'flex', gap: '28px', flexWrap: 'wrap' }}>
        
        {/* LEFT PRIMARY COLUMN (68%) */}
        <div style={{ flex: '1 1 650px', minWidth: 0, display: 'flex', flexDirection: 'column', gap: '28px' }}>
          
          {/* LAW METADATA CARD */}
          <div className="card" style={{ padding: '28px' }}>
            <div style={{ marginBottom: '20px' }}>
              <label className="input-label">Изменяемый Закон / Нормативно-Правовой Акт</label>
              <input 
                type="text" 
                value={bill.targetLaw}
                onChange={(e) => handleFieldChange('targetLaw', e.target.value)}
                disabled={!canEdit || isReadOnly}
                className="input-field"
                style={{ width: '100%', fontSize: '1.1rem', fontWeight: 700 }}
                placeholder="Например: Уголовный кодекс Штата (УК)"
              />
            </div>

            <div>
              <label className="input-label">Пояснительная записка (Обоснование и цели поправок)</label>
              <textarea 
                value={bill.explanatoryNote}
                onChange={(e) => handleFieldChange('explanatoryNote', e.target.value)}
                disabled={!canEdit || isReadOnly}
                className="input-field"
                style={{ width: '100%', minHeight: '95px', resize: 'vertical', lineHeight: 1.6 }}
                placeholder="Опишите цели, необходимость и практический смысл вносимых поправок..."
              />
            </div>
          </div>

          {/* ARTICLES HEADER */}
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <div>
              <h3 style={{ margin: 0, fontSize: '1.25rem', fontWeight: 800, color: 'var(--text-primary)' }}>
                Статьи к изменению ({bill.comparisons.length})
              </h3>
              <p style={{ margin: '3px 0 0 0', fontSize: '0.84rem', color: 'var(--text-muted)' }}>
                Укажите текущую редакцию слева и предлагаемую формулировку справа
              </p>
            </div>

            {canEdit && !isReadOnly && (
              <button onClick={addComparisonRow} className="btn btn-primary btn-pill" style={{ fontSize: '0.86rem', padding: '9px 22px' }}>
                <Plus size={16} /> Добавить статью
              </button>
            )}
          </div>

          {/* COMPARISON CARDS LIST */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
            {bill.comparisons.map((row, index) => (
              <div key={row.id} className="card" style={{ padding: '0', overflow: 'hidden', border: '1px solid var(--border-medium)' }}>
                
                {/* CARD HEADER BAR */}
                <div style={{ 
                  background: 'var(--bg-surface-elevated)', 
                  padding: '14px 24px', 
                  borderBottom: '1px solid var(--border-subtle)', 
                  display: 'flex', 
                  alignItems: 'center', 
                  justifyContent: 'space-between',
                  gap: '16px'
                }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '14px', flex: 1 }}>
                    <span style={{ fontSize: '0.9rem', color: 'var(--text-accent)', fontWeight: 800 }}>#{index + 1}</span>
                    <input 
                      type="text" 
                      value={row.articleTitle}
                      onChange={(e) => updateComparisonRow(row.id, 'articleTitle', e.target.value)}
                      disabled={!canEdit || isReadOnly}
                      className="input-field"
                      style={{ width: '360px', padding: '8px 16px', fontWeight: 600, fontSize: '0.92rem' }}
                      placeholder="Например: Статья 1. Общие положения"
                    />
                  </div>
                  
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    {canEdit && !isReadOnly && (
                      <button 
                        onClick={() => copyWasToBecame(row.id)}
                        className="btn btn-secondary"
                        style={{ padding: '6px 12px', fontSize: '0.78rem' }}
                        title="Скопировать текст оригинала в редактируемое поле"
                      >
                        <Copy size={13} /> Скопировать оригинал
                      </button>
                    )}

                    <button 
                      onClick={() => setExpandedRow(row)}
                      className="btn btn-secondary"
                      style={{ padding: '6px 12px', fontSize: '0.78rem' }}
                      title="Развернуть на весь экран"
                    >
                      <Maximize2 size={13} /> На весь экран
                    </button>

                    {canEdit && !isReadOnly && bill.comparisons.length > 1 && (
                      <button 
                        onClick={() => removeComparisonRow(row.id)}
                        className="btn btn-ghost"
                        style={{ padding: '6px', color: 'var(--danger-text)' }}
                        title="Удалить статью"
                      >
                        <Trash2 size={16} />
                      </button>
                    )}
                  </div>
                </div>

                {/* SIDE-BY-SIDE EDITOR COLUMNS */}
                <div style={{ display: 'flex', width: '100%', minHeight: '220px', flexWrap: 'wrap' }}>
                  
                  {/* LEFT: ORIGINAL TEXT */}
                  <div style={{ flex: '1 1 300px', borderRight: '1px solid var(--border-subtle)', display: 'flex', flexDirection: 'column' }}>
                    <div style={{ 
                      padding: '9px 24px', 
                      background: 'rgba(239, 68, 68, 0.08)', 
                      color: 'var(--danger-text)', 
                      fontSize: '0.74rem', 
                      fontWeight: 700, 
                      textTransform: 'uppercase', 
                      letterSpacing: '0.05em', 
                      borderBottom: '1px solid var(--border-subtle)' 
                    }}>
                      Действующая редакция (Оригинал / Было)
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
                        padding: '18px 24px', 
                        resize: 'vertical', 
                        outline: 'none', 
                        fontFamily: 'var(--font-sans)', 
                        fontSize: '0.92rem', 
                        lineHeight: 1.6 
                      }}
                      placeholder="Вставьте текущую редакцию статьи..."
                    />
                  </div>

                  {/* RIGHT: PROPOSED NEW TEXT */}
                  <div style={{ flex: '1 1 300px', display: 'flex', flexDirection: 'column' }}>
                    <div style={{ 
                      padding: '9px 24px', 
                      background: 'rgba(16, 185, 129, 0.08)', 
                      color: 'var(--success-text)', 
                      fontSize: '0.74rem', 
                      fontWeight: 700, 
                      textTransform: 'uppercase', 
                      letterSpacing: '0.05em', 
                      borderBottom: '1px solid var(--border-subtle)' 
                    }}>
                      Проектируемая редакция (Поправки / Стало)
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
                        padding: '18px 24px', 
                        resize: 'vertical', 
                        outline: 'none', 
                        fontFamily: 'var(--font-sans)', 
                        fontSize: '0.92rem', 
                        lineHeight: 1.6 
                      }}
                      placeholder="Внесите предлагаемые поправки..."
                    />
                  </div>

                </div>
              </div>
            ))}
          </div>

        </div>

        {/* RIGHT SIDEBAR COLUMN (32%) */}
        <div style={{ flex: '0 0 360px', display: 'flex', flexDirection: 'column', gap: '24px' }}>
          
          {/* AUTHOR CARD */}
          <div className="card" style={{ padding: '20px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '12px' }}>
              <div style={{
                width: '40px', height: '40px', borderRadius: '50%',
                background: 'var(--primary-gradient)',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                boxShadow: '0 2px 10px var(--primary-glow)'
              }}>
                <UserCheck size={20} color="#ffffff" />
              </div>
              <div>
                <div style={{ fontSize: '0.95rem', fontWeight: 800, color: 'var(--text-primary)' }}>
                  {bill.author}
                </div>
                <div style={{ fontSize: '0.76rem', color: 'var(--text-accent)', fontWeight: 600 }}>
                  {bill.authorRole}
                </div>
              </div>
            </div>

            {canEdit && bill.status === 'draft' && (
              <button 
                onClick={handlePublish}
                className="btn btn-primary btn-pill" 
                style={{ width: '100%', padding: '10px', fontSize: '0.88rem', marginTop: '6px' }}
              >
                <Send size={16} /> Опубликовать проект
              </button>
            )}
          </div>

          {/* STAGE 1: LEGISLATIVE COMMITTEE VOTING WIDGET */}
          <div className="card" style={{ padding: '20px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '14px', borderBottom: '1px solid var(--border-subtle)', paddingBottom: '10px' }}>
              <ShieldCheck size={20} color="var(--text-accent)" />
              <div>
                <h4 style={{ margin: 0, fontSize: '0.95rem', fontWeight: 800, color: 'var(--text-primary)' }}>
                  1-й Этап: Законодательная Комиссия
                </h4>
                <p style={{ margin: 0, fontSize: '0.72rem', color: 'var(--text-muted)' }}>
                  Победа определяется большинством (2/1 или 3/3)
                </p>
              </div>
            </div>

            {/* COMMITTEE MEMBERS VOTES SUMMARY */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', marginBottom: '16px' }}>
              {[
                { roleKey: 'prosecutor', title: 'Генеральный прокурор', vote: votes.prosecutor },
                { roleKey: 'judge', title: 'Председатель Верх. Суда', vote: votes.judge },
                { roleKey: 'governor', title: 'Губернатор Штата', vote: votes.governor }
              ].map((item) => (
                <div key={item.roleKey} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '8px 12px', background: 'var(--bg-input)', borderRadius: 'var(--radius-sm)', border: '1px solid var(--border-subtle)' }}>
                  <span style={{ fontSize: '0.8rem', fontWeight: 600, color: 'var(--text-secondary)' }}>
                    {item.title}
                  </span>
                  {item.vote === 'approved' ? (
                    <span style={{ fontSize: '0.74rem', color: 'var(--success-text)', fontWeight: 700, display: 'flex', alignItems: 'center', gap: '4px' }}>
                      <Check size={12} /> За
                    </span>
                  ) : item.vote === 'rejected' ? (
                    <span style={{ fontSize: '0.74rem', color: 'var(--danger-text)', fontWeight: 700, display: 'flex', alignItems: 'center', gap: '4px' }}>
                      <X size={12} /> Против
                    </span>
                  ) : item.vote === 'needs_revision' ? (
                    <span style={{ fontSize: '0.74rem', color: 'var(--warning-text)', fontWeight: 700, display: 'flex', alignItems: 'center', gap: '4px' }}>
                      <RotateCcw size={12} /> Доработка
                    </span>
                  ) : (
                    <span style={{ fontSize: '0.74rem', color: 'var(--text-muted)' }}>Ожидает</span>
                  )}
                </div>
              ))}
            </div>

            {/* VOTING COUNT BAR */}
            <div style={{ background: 'var(--bg-input)', padding: '10px 14px', borderRadius: 'var(--radius-sm)', marginBottom: '16px', border: '1px solid var(--border-subtle)', textAlign: 'center' }}>
              <div style={{ fontSize: '0.82rem', fontWeight: 700, color: isStage1Passed ? 'var(--success-text)' : isStage1Rejected ? 'var(--danger-text)' : 'var(--text-primary)' }}>
                {isStage1Passed 
                  ? `ОДОБРЕНО КОМИССИЕЙ (${approvedVotesCount}/3) — Перешел на 2-й этап!` 
                  : isStage1Rejected 
                  ? `ОТКЛОНЕНО КОМИССИЕЙ (${rejectedVotesCount}/3)`
                  : `Итог голосования: ${approvedVotesCount} За / ${rejectedVotesCount} Против`}
              </div>
            </div>

            {/* VOTING BUTTONS FOR COMMITTEE MEMBERS */}
            {bill.status === 'under_review' && !isStage1Passed && !isStage1Rejected && (
              <div>
                <label className="input-label" style={{ marginBottom: '8px' }}>Ваше решение Комиссии:</label>
                <div style={{ display: 'flex', gap: '8px' }}>
                  <button 
                    onClick={() => handleCastVote('approved')}
                    className="btn btn-pill" 
                    style={{ flex: 1, padding: '7px 8px', fontSize: '0.78rem', background: 'var(--success-bg)', color: 'var(--success-text)', borderColor: 'var(--success-border)' }}
                  >
                    <Check size={14} /> Одобрить
                  </button>
                  <button 
                    onClick={() => handleCastVote('needs_revision')}
                    className="btn btn-pill" 
                    style={{ flex: 1, padding: '7px 8px', fontSize: '0.78rem', background: 'var(--warning-bg)', color: 'var(--warning-text)', borderColor: 'var(--warning-border)' }}
                  >
                    <RotateCcw size={14} /> Доработка
                  </button>
                  <button 
                    onClick={() => handleCastVote('rejected')}
                    className="btn btn-pill" 
                    style={{ flex: 1, padding: '7px 8px', fontSize: '0.78rem', background: 'var(--danger-bg)', color: 'var(--danger-text)', borderColor: 'var(--danger-border)' }}
                  >
                    <X size={14} /> Отклонить
                  </button>
                </div>
              </div>
            )}
          </div>

          {/* STAGE 2: FEDERAL GOVERNMENT ADMIN VERDICT WIDGET */}
          <div className="card" style={{ padding: '20px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '14px', borderBottom: '1px solid var(--border-subtle)', paddingBottom: '10px' }}>
              <Crown size={20} color="var(--primary-hover)" />
              <div>
                <h4 style={{ margin: 0, fontSize: '0.95rem', fontWeight: 800, color: 'var(--text-primary)' }}>
                  2-й Этап: Администрация Штата
                </h4>
                <p style={{ margin: 0, fontSize: '0.72rem', color: 'var(--text-muted)' }}>
                  Финальный вердикт Федерального Правительства
                </p>
              </div>
            </div>

            {bill.federalVerdict ? (
              <div style={{ padding: '14px', background: 'var(--bg-input)', borderRadius: 'var(--radius-sm)', border: '1px solid var(--border-subtle)' }}>
                <div style={{ fontSize: '0.84rem', fontWeight: 800, color: bill.federalVerdict.status === 'approved' ? 'var(--success-text)' : 'var(--danger-text)', marginBottom: '4px' }}>
                  {bill.federalVerdict.status === 'approved' ? 'ОФИЦИАЛЬНО УТВЕРЖДЕНО' : 'ОТКЛОНЕНО АДМИНИСТРАЦИЕЙ'}
                </div>
                <div style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', lineHeight: 1.4 }}>
                  {bill.federalVerdict.reason}
                </div>
                <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)', marginTop: '8px' }}>
                  Вынес: {bill.federalVerdict.adminName}
                </div>
              </div>
            ) : isAdmin && (isStage1Passed || bill.status === 'under_review') ? (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                <label className="input-label">Мотивированное обоснование вердикта:</label>
                <textarea 
                  value={adminVerdictReason}
                  onChange={(e) => setAdminVerdictReason(e.target.value)}
                  className="input-field"
                  style={{ width: '100%', minHeight: '80px', fontSize: '0.84rem', resize: 'vertical' }}
                  placeholder="Введите решение и примечания Федерального Правительства..."
                />

                <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                  <button 
                    onClick={() => handleExecuteAdminVerdict('approved')}
                    className="btn btn-primary btn-pill"
                    style={{ width: '100%', padding: '9px', fontSize: '0.84rem' }}
                  >
                    <CheckCircle2 size={16} /> Окончательно утвердить закон
                  </button>
                  <div style={{ display: 'flex', gap: '8px' }}>
                    <button 
                      onClick={() => handleExecuteAdminVerdict('needs_revision')}
                      className="btn btn-secondary btn-pill"
                      style={{ flex: 1, padding: '8px', fontSize: '0.78rem' }}
                    >
                      <RotateCcw size={14} /> На доработку
                    </button>
                    <button 
                      onClick={() => handleExecuteAdminVerdict('rejected')}
                      className="btn btn-danger btn-pill"
                      style={{ flex: 1, padding: '8px', fontSize: '0.78rem' }}
                    >
                      <XCircle size={14} /> Отклонить
                    </button>
                  </div>
                </div>
              </div>
            ) : (
              <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)', textAlign: 'center', padding: '12px 0' }}>
                {isStage1Passed ? 'Ожидает решения Администрации' : 'Доступно после прохождения 1-го этапа Комиссии'}
              </div>
            )}
          </div>

          {/* COMMENTS & DISCUSSION SECTION */}
          <div className="card" style={{ padding: '20px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '14px', borderBottom: '1px solid var(--border-subtle)', paddingBottom: '10px' }}>
              <MessageSquare size={18} color="var(--text-accent)" />
              <h4 style={{ margin: 0, fontSize: '0.95rem', fontWeight: 800, color: 'var(--text-primary)' }}>
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
