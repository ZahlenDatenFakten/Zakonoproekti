import React, { useState } from 'react';
import type { Bill, ComparisonRow, AccessPermission, UserProfile, VoteDecision, CommissionVotes, BillStatus, FederalGovernmentVerdict } from '../types/bill';
import { OFFICIAL_ROLE_LABELS } from '../types/bill';
import { sanitizeInput, isOfficialCommitteeMember, isSystemAdmin, computeDocumentHash } from '../services/securityService';
import { CommentsSection } from './CommentsSection';
import { ExpandedArticleModal } from './ExpandedArticleModal';
import { 
  ArrowLeft, 
  Save, 
  Share2, 
  Plus, 
  Trash2, 
  CheckCircle2, 
  XCircle, 
  Clock, 
  FileText, 
  Maximize2,
  RotateCcw,
  Send,
  Users,
  Check,
  ShieldCheck,
  Lock,
  AlertTriangle
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
  const [activeTab, setActiveTab] = useState<'editor' | 'comments'>('editor');
  const [isSavedNotice, setIsSavedNotice] = useState(false);

  // Fullscreen Article Expander Modal State
  const [expandedRow, setExpandedRow] = useState<ComparisonRow | null>(null);

  // Federal Government Modal State
  const [showFedModal, setShowFedModal] = useState(false);
  const [pendingFedStatus, setPendingFedStatus] = useState<VoteDecision | null>(null);
  const [fedReasonInput, setFedReasonInput] = useState('');

  const canEdit = permission === 'edit';
  const isCommittee = isOfficialCommitteeMember(user);
  const isAdmin = isSystemAdmin(user);

  const currentFullName = `${user.firstName} ${user.lastName}`.trim();
  const isAuthor = bill.author.trim() === currentFullName;

  const votes: CommissionVotes = bill.votes || {};

  const handleFieldChange = (field: keyof Bill, value: any) => {
    if (!canEdit) return;
    setBill((prev) => ({ ...prev, [field]: value }));
  };

  // 1-st STAGE: Collegial Commission Vote (Only Prosecutor, Judge, Governor)
  const handleCastCommissionVote = (decision: VoteDecision) => {
    if (!isCommittee) {
      onToast('error', 'Первый этап коллегиального голосования доступен только Прокурору, Судье и Губернатору.');
      return;
    }

    let roleKey: 'prosecutor' | 'judge' | 'governor' | null = null;
    if (user.officialRole === 'prosecutor') roleKey = 'prosecutor';
    if (user.officialRole === 'judge') roleKey = 'judge';
    if (user.officialRole === 'governor') roleKey = 'governor';

    if (!roleKey) {
      onToast('error', 'Ваша роль не входит в состав 1-го этапа Комиссии.');
      return;
    }

    const updatedVotes: CommissionVotes = {
      ...votes,
      [roleKey]: decision
    };

    const votedCount = Object.keys(updatedVotes).length;
    let newStatus = bill.status;
    let statusReason = bill.statusReason || '';

    // If ALL 3 Commission Members Voted -> Tally 1st Stage Result!
    if (votedCount >= 3) {
      const tally: Record<VoteDecision, number> = { approved: 0, rejected: 0, needs_revision: 0 };
      if (updatedVotes.prosecutor) tally[updatedVotes.prosecutor]++;
      if (updatedVotes.judge) tally[updatedVotes.judge]++;
      if (updatedVotes.governor) tally[updatedVotes.governor]++;

      if (tally.approved >= 2) {
        statusReason = `Специальной Законодательной Комиссией законопроект ОДОБРЕН по большинству голосов (${tally.approved}/3). Передано на 2-й этап в Федеральное Правительство.`;
      } else if (tally.rejected >= 2) {
        newStatus = 'rejected';
        statusReason = `Специальной Законодательной Комиссией законопроект ОТКЛОНЕН по большинству голосов (${tally.rejected}/3).`;
      } else {
        newStatus = 'needs_revision';
        statusReason = `Специальной Законодательной Комиссией законопроект отправлен НА ДОРАБОТКУ по большинству голосов.`;
      }

      onToast('success', `Голосование Комиссии 1-го этапа завершено (${votedCount}/3).`);
    } else {
      newStatus = 'under_review';
      statusReason = `Голосование Специальной Комиссии в процессе (${votedCount}/3 голосов).`;
      onToast('info', `Голос члена Комиссии принят! Прогресс: ${votedCount}/3`);
    }

    const updatedBill: Bill = {
      ...bill,
      status: newStatus,
      statusReason,
      votes: updatedVotes
    };

    setBill(updatedBill);
    onSave(updatedBill);
  };

  // 2-nd STAGE: Federal Government Action Trigger
  const handleOpenFedVerdictModal = (decision: VoteDecision) => {
    if (!isAdmin) {
      onToast('error', 'Только Федеральное Правительство (Администрация) выносит вердикт 2-го этапа.');
      return;
    }

    if (decision === 'approved') {
      // Approve can be applied directly or with optional note
      executeFederalVerdict('approved', 'Официально утверждено Федеральным Правительством.');
    } else {
      // Rejection or Revision requires mandatory written justification modal
      setPendingFedStatus(decision);
      setFedReasonInput('');
      setShowFedModal(true);
    }
  };

  const executeFederalVerdict = (status: VoteDecision, reason: string) => {
    const verdict: FederalGovernmentVerdict = {
      status,
      reason,
      updatedAt: new Date().toISOString(),
      adminName: `${user.firstName} ${user.lastName}`
    };

    let officialStatusReason = '';
    const commissionApproved = (votes.prosecutor === 'approved' && votes.judge === 'approved') ||
                              (votes.prosecutor === 'approved' && votes.governor === 'approved') ||
                              (votes.judge === 'approved' && votes.governor === 'approved');

    if (status === 'rejected') {
      officialStatusReason = commissionApproved
        ? 'Специальной законодательной комиссией законопроект был ОДОБРЕН, однако на 2-м этапе проверки Федеральным Правительством данный законопроект был ОТКЛОНЕН.'
        : 'Отклонено на 2-м этапе проверки Федеральным Правительством.';
    } else if (status === 'needs_revision') {
      officialStatusReason = commissionApproved
        ? 'Специальной законодательной комиссией законопроект был ОДОБРЕН, однако Федеральным Правительством отправлен НА ДОРАБОТКУ.'
        : 'Отправлено на доработку Федеральным Правительством.';
    } else {
      officialStatusReason = 'Законопроект прошли оба этапа: Одобрен Законодательной Комиссией и официально утвержден Федеральным Правительством.';
    }

    const updatedBill: Bill = {
      ...bill,
      status,
      statusReason: officialStatusReason,
      federalVerdict: verdict
    };

    setBill(updatedBill);
    onSave(updatedBill);
    setShowFedModal(false);
    onToast('success', `Вердикт Федерального Правительства вынесен: ${status === 'approved' ? 'ОДОБРЕНО' : status === 'rejected' ? 'ОТКЛОНЕНО' : 'НА ДОРАБОТКУ'}`);
  };

  const handleConfirmFedVerdictModal = () => {
    if (!fedReasonInput.trim()) {
      onToast('error', 'Введите обязательное мотивированное обоснование вердикта.');
      return;
    }
    if (pendingFedStatus) {
      executeFederalVerdict(pendingFedStatus, fedReasonInput.trim());
    }
  };

  // Publish Draft Handler
  const handlePublishDraft = () => {
    const updated = {
      ...bill,
      status: 'under_review' as BillStatus,
      statusReason: 'Опубликовано автором и направлено на рассмотрение Законодательной Комиссии.'
    };
    setBill(updated);
    onSave(updated);
    onToast('success', 'Черновик опубликован и направлен на рассмотрение комиссии');
  };

  const handleAddComparisonRow = () => {
    if (!canEdit) return;
    const newRow: ComparisonRow = {
      id: 'comp_' + Date.now() + '_' + Math.random().toString(36).substring(2, 5),
      articleTitle: `Статья ${bill.comparisons.length + 1}.`,
      wasContent: '',
      becameContent: '',
      notes: ''
    };
    setBill((prev) => ({
      ...prev,
      comparisons: [...prev.comparisons, newRow]
    }));
  };

  const handleUpdateRow = (id: string, field: keyof ComparisonRow, value: string) => {
    if (!canEdit) return;
    setBill((prev) => ({
      ...prev,
      comparisons: prev.comparisons.map((row) => (row.id === id ? { ...row, [field]: value } : row))
    }));

    if (expandedRow && expandedRow.id === id) {
      setExpandedRow((prev) => (prev ? { ...prev, [field]: value } : null));
    }
  };

  const handleDeleteRow = (id: string) => {
    if (!canEdit) return;
    setBill((prev) => ({
      ...prev,
      comparisons: prev.comparisons.filter((row) => row.id !== id)
    }));
  };

  const handleSaveClick = async () => {
    const hash = await computeDocumentHash(bill);
    const sanitizedBill: Bill = {
      ...bill,
      sha256Hash: hash,
      title: sanitizeInput(bill.title),
      targetLaw: sanitizeInput(bill.targetLaw),
      explanatoryNote: sanitizeInput(bill.explanatoryNote)
    };
    onSave(sanitizedBill);
    setIsSavedNotice(true);
    setTimeout(() => setIsSavedNotice(false), 2500);
  };

  const renderVoteBadge = (decision?: VoteDecision) => {
    if (!decision) return <span style={{ color: 'var(--text-tertiary)', fontSize: '0.78rem' }}>⏳ Ожидается голос</span>;
    if (decision === 'approved') return <span style={{ color: '#4ade80', fontSize: '0.78rem', fontWeight: 600 }}>✅ Одобрено</span>;
    if (decision === 'rejected') return <span style={{ color: '#f87171', fontSize: '0.78rem', fontWeight: 600 }}>❌ Отклонено</span>;
    return <span style={{ color: '#93c5fd', fontSize: '0.78rem', fontWeight: 600 }}>🔄 На доработку</span>;
  };

  return (
    <div style={{ maxWidth: '1240px', margin: '0 auto', padding: '0 24px 60px 24px' }}>
      
      {/* Top Action Bar */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '14px', marginBottom: '20px' }}>
        <button onClick={onBack} className="btn btn-secondary" style={{ fontSize: '0.85rem' }}>
          <ArrowLeft size={16} /> К списку проектов
        </button>

        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          {permission !== 'edit' && (
            <span style={{ fontSize: '0.8rem', background: 'var(--bg-input)', color: 'var(--text-secondary)', padding: '5px 12px', borderRadius: '6px', border: '1px solid var(--border-subtle)' }}>
              👁️ Читатель (Чтение + Комментарии)
            </span>
          )}

          {/* Author Publish Draft Button */}
          {bill.status === 'draft' && isAuthor && (
            <button 
              onClick={handlePublishDraft} 
              className="btn btn-primary" 
              style={{ fontSize: '0.85rem', background: 'rgba(52, 211, 153, 0.15)', color: '#34d399', border: '1px solid rgba(52, 211, 153, 0.3)' }}
            >
              <Send size={15} /> Опубликовать черновик
            </button>
          )}

          <button onClick={() => onShare(bill)} className="btn btn-secondary" style={{ fontSize: '0.85rem' }}>
            <Share2 size={16} /> Ссылки доступа
          </button>

          {canEdit && (
            <button onClick={handleSaveClick} className="btn btn-primary" style={{ fontSize: '0.85rem' }}>
              <Save size={16} /> Сохранить
            </button>
          )}
        </div>
      </div>

      {/* 1-st STAGE PANEL: Collegial Commission Voting (Prosecutor, Judge, Governor) */}
      <div 
        className="card-dark" 
        style={{ 
          padding: '20px 24px', 
          marginBottom: '20px', 
          background: 'var(--bg-card)', 
          border: '1px solid var(--border-medium)'
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '14px', flexWrap: 'wrap', gap: '10px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <Users size={22} color="var(--text-primary)" />
            <div>
              <h3 style={{ fontSize: '1rem', fontWeight: 600, color: 'var(--text-primary)' }}>
                1 этап: Голосование Специальной Законодательной Комиссии (3/3)
              </h3>
              <p style={{ fontSize: '0.78rem', color: 'var(--text-tertiary)' }}>
                Первичная экспертиза: Прокурор, Председатель суда и Губернатор.
              </p>
            </div>
          </div>

          <div style={{ fontSize: '0.82rem', background: 'var(--bg-input)', padding: '4px 12px', borderRadius: '6px', border: '1px solid var(--border-subtle)', fontWeight: 600 }}>
            Голоса: {Object.keys(votes).length} / 3
          </div>
        </div>

        {/* Live Votes Status Grid */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: '12px', marginBottom: '14px' }}>
          
          <div style={{ background: 'var(--bg-input)', border: '1px solid var(--border-subtle)', padding: '12px 14px', borderRadius: '10px', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <div>
              <div style={{ fontSize: '0.85rem', fontWeight: 600 }}>⚖️ Генеральный прокурор</div>
              {renderVoteBadge(votes.prosecutor)}
            </div>
            {votes.prosecutor && <Check size={16} color="#34d399" />}
          </div>

          <div style={{ background: 'var(--bg-input)', border: '1px solid var(--border-subtle)', padding: '12px 14px', borderRadius: '10px', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <div>
              <div style={{ fontSize: '0.85rem', fontWeight: 600 }}>🏛️ Председатель суда</div>
              {renderVoteBadge(votes.judge)}
            </div>
            {votes.judge && <Check size={16} color="#34d399" />}
          </div>

          <div style={{ background: 'var(--bg-input)', border: '1px solid var(--border-subtle)', padding: '12px 14px', borderRadius: '10px', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <div>
              <div style={{ fontSize: '0.85rem', fontWeight: 600 }}>📜 Губернатор</div>
              {renderVoteBadge(votes.governor)}
            </div>
            {votes.governor && <Check size={16} color="#34d399" />}
          </div>
        </div>

        {/* Voting Buttons for Commission Members ONLY */}
        {isCommittee && (
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', borderTop: '1px solid var(--border-subtle)', paddingTop: '12px', flexWrap: 'wrap', gap: '10px' }}>
            <span style={{ fontSize: '0.82rem', color: 'var(--text-secondary)' }}>
              Ваш голос (1 этап): <strong>{OFFICIAL_ROLE_LABELS[user.officialRole]}</strong>
            </span>

            <div style={{ display: 'flex', gap: '8px' }}>
              <button onClick={() => handleCastCommissionVote('approved')} className="btn" style={{ background: 'var(--status-approved-bg)', color: 'var(--status-approved-text)', border: '1px solid var(--status-approved-border)', fontSize: '0.82rem', padding: '6px 12px' }}>
                <CheckCircle2 size={14} /> Одобрить (1 этап)
              </button>
              <button onClick={() => handleCastCommissionVote('needs_revision')} className="btn" style={{ background: 'rgba(59, 130, 246, 0.15)', color: '#93c5fd', border: '1px solid rgba(59, 130, 246, 0.3)', fontSize: '0.82rem', padding: '6px 12px' }}>
                <RotateCcw size={14} /> На доработку
              </button>
              <button onClick={() => handleCastCommissionVote('rejected')} className="btn" style={{ background: 'var(--status-rejected-bg)', color: 'var(--status-rejected-text)', border: '1px solid var(--status-rejected-border)', fontSize: '0.82rem', padding: '6px 12px' }}>
                <XCircle size={14} /> Отклонить (1 этап)
              </button>
            </div>
          </div>
        )}
      </div>

      {/* 2-nd STAGE PANEL: Federal Government Action (Administrator Only) */}
      {isAdmin && (
        <div 
          className="card-dark" 
          style={{ 
            padding: '20px 24px', 
            marginBottom: '24px', 
            background: 'linear-gradient(135deg, rgba(30, 41, 59, 0.7), rgba(15, 23, 42, 0.95))', 
            border: '1px solid rgba(99, 102, 241, 0.4)'
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '14px', flexWrap: 'wrap', gap: '10px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
              <ShieldCheck size={22} color="#a5b4fc" />
              <div>
                <h3 style={{ fontSize: '1rem', fontWeight: 600, color: '#f8fafc' }}>
                  2 этап: Панель Проверки Федерального Правительства
                </h3>
                <p style={{ fontSize: '0.78rem', color: '#94a3b8' }}>
                  Вы вошли как Системный Администратор. Вынесите официальный вердикт 2-го этапа.
                </p>
              </div>
            </div>

            <div style={{ display: 'flex', gap: '8px' }}>
              <button onClick={() => handleOpenFedVerdictModal('approved')} className="btn" style={{ background: 'var(--status-approved-bg)', color: 'var(--status-approved-text)', border: '1px solid var(--status-approved-border)', fontSize: '0.84rem' }}>
                <CheckCircle2 size={15} /> Одобрить (Правительство)
              </button>
              <button onClick={() => handleOpenFedVerdictModal('needs_revision')} className="btn" style={{ background: 'rgba(59, 130, 246, 0.2)', color: '#93c5fd', border: '1px solid rgba(59, 130, 246, 0.4)', fontSize: '0.84rem' }}>
                <RotateCcw size={15} /> На доработку + Обоснование
              </button>
              <button onClick={() => handleOpenFedVerdictModal('rejected')} className="btn" style={{ background: 'var(--status-rejected-bg)', color: 'var(--status-rejected-text)', border: '1px solid var(--status-rejected-border)', fontSize: '0.84rem' }}>
                <XCircle size={15} /> Отклонить + Обоснование
              </button>
            </div>
          </div>
        </div>
      )}

      {/* INTERNAL REASON CARD FOR COMMISSION & ADMIN ONLY */}
      {bill.federalVerdict?.reason && (isCommittee || isAdmin) && (
        <div style={{ background: 'rgba(30, 41, 59, 0.8)', border: '1px solid rgba(99, 102, 241, 0.3)', borderRadius: '12px', padding: '16px 20px', marginBottom: '24px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '6px' }}>
            <Lock size={15} color="#a5b4fc" />
            <strong style={{ fontSize: '0.88rem', color: '#f8fafc' }}>
              🔒 Закрытое мотивированное обоснование Федерального Правительства (Видно Комиссии и Администрации):
            </strong>
          </div>
          <p style={{ fontSize: '0.88rem', color: '#cbd5e1', whiteSpace: 'pre-wrap', lineHeight: 1.5, paddingLeft: '24px' }}>
            {bill.federalVerdict.reason}
          </p>
          <div style={{ fontSize: '0.75rem', color: '#64748b', textAlign: 'right', marginTop: '6px' }}>
            Вынесено: {bill.federalVerdict.adminName} &bull; {new Date(bill.federalVerdict.updatedAt).toLocaleString('ru-RU')}
          </div>
        </div>
      )}

      {isSavedNotice && (
        <div style={{ background: 'var(--status-approved-bg)', border: '1px solid var(--status-approved-border)', color: 'var(--status-approved-text)', padding: '10px 16px', borderRadius: '8px', marginBottom: '16px', fontSize: '0.88rem' }}>
          ✓ Законопроект успешно сохранен
        </div>
      )}

      {/* Main Document Card */}
      <div className="card-dark" style={{ padding: '28px' }}>
        
        {/* Document Header */}
        <div style={{ borderBottom: '1px solid var(--border-subtle)', paddingBottom: '20px', marginBottom: '24px' }}>
          
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '14px', marginBottom: '16px' }}>
            
            {/* Status Indicator */}
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <span style={{ fontSize: '0.82rem', color: 'var(--text-tertiary)' }}>Итоговый статус:</span>
              <span className={`badge-status badge-${bill.status}`}>
                {bill.status === 'approved' && <CheckCircle2 size={13} />}
                {bill.status === 'rejected' && <XCircle size={13} />}
                {bill.status === 'under_review' && <Clock size={13} />}
                {bill.status === 'needs_revision' && <RotateCcw size={13} />}
                {bill.status === 'draft' && <FileText size={13} />}
                {bill.status === 'approved' ? 'ОДОБРЕН' : bill.status === 'rejected' ? 'ОТКЛОНЕН' : bill.status === 'needs_revision' ? 'НА ДОРАБОТКЕ' : bill.status === 'under_review' ? 'НА РАССМОТРЕНИИ' : 'ЛИЧНЫЙ ЧЕРНОВИК'}
              </span>
            </div>

            {/* Registration Code */}
            <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
              <span style={{ fontSize: '0.82rem', color: 'var(--text-tertiary)' }}>Рег. номер:</span>
              {canEdit ? (
                <input
                  type="text"
                  className="input-field"
                  value={bill.lawCode || ''}
                  onChange={(e) => handleFieldChange('lawCode', e.target.value)}
                  placeholder="ЗП-2026/001"
                  style={{ width: '130px', padding: '4px 10px', fontSize: '0.82rem', fontFamily: 'var(--font-mono)' }}
                />
              ) : (
                <span style={{ fontFamily: 'var(--font-mono)', color: 'var(--text-primary)', fontSize: '0.88rem' }}>{bill.lawCode}</span>
              )}
            </div>
          </div>

          {/* Official Public Status Message (Visible to Author & Everyone) */}
          {bill.statusReason && (
            <div style={{ fontSize: '0.86rem', color: 'var(--text-primary)', background: 'var(--bg-input)', border: '1px solid var(--border-medium)', padding: '12px 16px', borderRadius: '10px', marginBottom: '16px', lineHeight: 1.5, display: 'flex', alignItems: 'flex-start', gap: '10px' }}>
              <AlertTriangle size={18} color="#facc15" style={{ flexShrink: 0, marginTop: '2px' }} />
              <div>
                <strong>Официальная формулировка решения:</strong>
                <div style={{ marginTop: '2px', color: 'var(--text-secondary)' }}>{bill.statusReason}</div>
              </div>
            </div>
          )}

          {/* Bill Title Input */}
          <div style={{ marginBottom: '16px' }}>
            <label style={{ fontSize: '0.8rem', color: 'var(--text-tertiary)', display: 'block', marginBottom: '4px' }}>
              НАЗВАНИЕ ЗАКОНОПРОЕКТА
            </label>
            {canEdit ? (
              <input
                type="text"
                className="input-field"
                value={bill.title}
                onChange={(e) => handleFieldChange('title', e.target.value)}
                placeholder="Наименование законопроекта..."
                style={{ fontSize: '1.15rem', fontWeight: 600, color: 'var(--text-primary)' }}
              />
            ) : (
              <h2 style={{ fontSize: '1.25rem', fontWeight: 600, color: 'var(--text-primary)' }}>{bill.title}</h2>
            )}
          </div>

          {/* Target Law Input */}
          <div>
            <label style={{ fontSize: '0.8rem', color: 'var(--text-tertiary)', display: 'block', marginBottom: '4px' }}>
              ИМЯ / НАЗВАНИЕ ИСХОДНОГО ЗАКОНА (к которому ведется законопроект):
            </label>
            {canEdit ? (
              <input
                type="text"
                className="input-field"
                value={bill.targetLaw}
                onChange={(e) => handleFieldChange('targetLaw', e.target.value)}
                placeholder="Например: Закон «О дорожном движении»..."
                style={{ fontWeight: 500, color: 'var(--text-primary)' }}
              />
            ) : (
              <div style={{ fontSize: '0.95rem', color: 'var(--text-primary)', fontWeight: 500 }}>{bill.targetLaw}</div>
            )}
          </div>
        </div>

        {/* Navigation Tabs */}
        <div style={{ display: 'flex', gap: '12px', borderBottom: '1px solid var(--border-subtle)', marginBottom: '24px' }}>
          <button
            onClick={() => setActiveTab('editor')}
            style={{
              background: 'none',
              border: 'none',
              borderBottom: activeTab === 'editor' ? '2px solid var(--text-primary)' : '2px solid transparent',
              color: activeTab === 'editor' ? 'var(--text-primary)' : 'var(--text-tertiary)',
              fontSize: '0.9rem',
              fontWeight: 500,
              padding: '8px 12px',
              cursor: 'pointer'
            }}
          >
            Сравнительная таблица («Было / Стало»)
          </button>

          <button
            onClick={() => setActiveTab('comments')}
            style={{
              background: 'none',
              border: 'none',
              borderBottom: activeTab === 'comments' ? '2px solid var(--text-primary)' : '2px solid transparent',
              color: activeTab === 'comments' ? 'var(--text-primary)' : 'var(--text-tertiary)',
              fontSize: '0.9rem',
              fontWeight: 500,
              padding: '8px 12px',
              cursor: 'pointer'
            }}
          >
            Комментарии ({bill.comments?.length || 0})
          </button>
        </div>

        {activeTab === 'comments' ? (
          <CommentsSection
            billId={bill.id}
            user={user}
            comments={bill.comments || []}
            canComment={true}
            onAddComment={(updatedComments) => {
              setBill((prev) => ({ ...prev, comments: updatedComments }));
              onSave({ ...bill, comments: updatedComments });
            }}
          />
        ) : (
          <div>
            {/* COMPARATIVE MATRIX */}
            <div style={{ marginBottom: '28px' }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '12px' }}>
                <h3 style={{ fontSize: '1.05rem', fontWeight: 600, color: 'var(--text-primary)' }}>
                  Таблица изменений («Было / Стало»)
                </h3>

                {canEdit && (
                  <button onClick={handleAddComparisonRow} className="btn btn-secondary" style={{ padding: '6px 12px', fontSize: '0.82rem' }}>
                    <Plus size={15} /> Добавить статью
                  </button>
                )}
              </div>

              {/* Table */}
              <div style={{ width: '100%' }}>
                <table className="comparison-table">
                  <thead>
                    <tr>
                      <th style={{ width: '45%' }}>БЫЛО (Старая редакция / Удаляемый текст)</th>
                      <th style={{ width: '45%' }}>СТАЛО (Новая редакция / Итоговая формулировка)</th>
                      <th style={{ width: '10%', textAlign: 'center' }}>Действия</th>
                    </tr>
                  </thead>
                  <tbody>
                    {bill.comparisons.map((row) => (
                      <tr key={row.id}>
                        {/* Was Cell */}
                        <td className="cell-was">
                          <div style={{ marginBottom: '6px' }}>
                            {canEdit ? (
                              <input
                                type="text"
                                className="input-field"
                                value={row.articleTitle}
                                onChange={(e) => handleUpdateRow(row.id, 'articleTitle', e.target.value)}
                                placeholder="Статья / Норма..."
                                style={{ fontWeight: 600, fontSize: '0.88rem', marginBottom: '6px' }}
                              />
                            ) : (
                              <div style={{ fontWeight: 600, marginBottom: '4px' }}>
                                {row.articleTitle}
                              </div>
                            )}
                          </div>

                          {canEdit ? (
                            <textarea
                              className="textarea-field"
                              value={row.wasContent}
                              onChange={(e) => handleUpdateRow(row.id, 'wasContent', e.target.value)}
                              placeholder="Текст статьи в 'Было'..."
                              style={{ fontSize: '0.88rem', width: '100%', minHeight: '90px' }}
                            />
                          ) : (
                            <div style={{ whiteSpace: 'pre-wrap', lineHeight: 1.6 }}>{row.wasContent || '—'}</div>
                          )}
                        </td>

                        {/* Became Cell */}
                        <td className="cell-became">
                          <div style={{ height: '32px' }}></div>
                          {canEdit ? (
                            <textarea
                              className="textarea-field"
                              value={row.becameContent}
                              onChange={(e) => handleUpdateRow(row.id, 'becameContent', e.target.value)}
                              placeholder="Итоговая формулировка в 'Стало'..."
                              style={{ fontSize: '0.88rem', width: '100%', minHeight: '90px' }}
                            />
                          ) : (
                            <div style={{ whiteSpace: 'pre-wrap', lineHeight: 1.6 }}>{row.becameContent || '—'}</div>
                          )}
                        </td>

                        {/* Actions */}
                        <td style={{ textAlign: 'center', verticalAlign: 'middle' }}>
                          <div style={{ display: 'flex', flexDirection: 'column', gap: '6px', alignItems: 'center' }}>
                            <button
                              onClick={() => setExpandedRow(row)}
                              className="btn btn-secondary"
                              style={{ padding: '6px', fontSize: '0.78rem' }}
                              title="🔍 Развернуть во весь экран"
                            >
                              <Maximize2 size={15} />
                            </button>

                            {canEdit && (
                              <button
                                onClick={() => handleDeleteRow(row.id)}
                                className="btn btn-danger"
                                style={{ padding: '6px' }}
                                title="Удалить статью"
                              >
                                <Trash2 size={15} />
                              </button>
                            )}
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>

            {/* BILL COMMENT */}
            <div style={{ background: 'var(--bg-input)', border: '1px solid var(--border-subtle)', borderRadius: '10px', padding: '18px' }}>
              <h4 style={{ fontSize: '0.92rem', fontWeight: 600, color: 'var(--text-primary)', marginBottom: '8px' }}>
                Комментарий к законопроекту
              </h4>
              {canEdit ? (
                <textarea
                  className="textarea-field"
                  rows={4}
                  value={bill.explanatoryNote}
                  onChange={(e) => handleFieldChange('explanatoryNote', e.target.value)}
                  placeholder="Введите пояснительный комментарий..."
                />
              ) : (
                <p style={{ fontSize: '0.88rem', color: 'var(--text-secondary)', whiteSpace: 'pre-wrap' }}>
                  {bill.explanatoryNote}
                </p>
              )}
            </div>

            {/* Author Footer */}
            <div style={{ marginTop: '24px', paddingTop: '16px', borderTop: '1px solid var(--border-subtle)', display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: '0.82rem', color: 'var(--text-tertiary)' }}>
              <div>Автор: {bill.author} ({bill.authorRole})</div>
              <div>Обновлено: {new Date(bill.updatedAt).toLocaleDateString('ru-RU')}</div>
            </div>
          </div>
        )}
      </div>

      {/* Mandatory Federal Government Justification Modal */}
      {showFedModal && (
        <div className="modal-overlay" onClick={() => setShowFedModal(false)} style={{ zIndex: 8000 }}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()} style={{ maxWidth: '540px', padding: '24px' }}>
            <h3 style={{ fontSize: '1.1rem', fontWeight: 600, color: 'var(--text-primary)', marginBottom: '12px' }}>
              Обязательное мотивированное обоснование Федерального Правительства
            </h3>

            <p style={{ fontSize: '0.84rem', color: 'var(--text-secondary)', marginBottom: '14px', lineHeight: 1.5 }}>
              Вы выносите вердикт: <strong style={{ color: pendingFedStatus === 'rejected' ? '#f87171' : '#93c5fd' }}>{pendingFedStatus === 'rejected' ? 'ОТКЛОНИТЬ' : 'НА ДОРАБОТКУ'}</strong>.
              Укажите закрытые замечания и причину отказа (будет видно Комиссии):
            </p>

            <div style={{ marginBottom: '18px' }}>
              <textarea
                className="textarea-field"
                rows={4}
                placeholder="Подробное мотивированное обоснование..."
                value={fedReasonInput}
                onChange={(e) => setFedReasonInput(e.target.value)}
              />
            </div>

            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px' }}>
              <button onClick={() => setShowFedModal(false)} className="btn btn-secondary">
                Отмена
              </button>
              <button onClick={handleConfirmFedVerdictModal} className="btn btn-primary">
                Подтвердить и отправить решение
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Fullscreen Article Expansion Modal */}
      {expandedRow && (
        <ExpandedArticleModal
          row={expandedRow}
          canEdit={canEdit}
          onUpdateRow={handleUpdateRow}
          onClose={() => setExpandedRow(null)}
        />
      )}
    </div>
  );
};
