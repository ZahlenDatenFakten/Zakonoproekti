import React, { useState, useMemo } from 'react';
import type { Bill, UserProfile, VoteDecision, FederalGovernmentVerdict } from '../types/bill';
import { isSystemAdmin } from '../services/securityService';
import { ForumExportModal } from './ForumExportModal';
import { 
  ShieldCheck, 
  Eye, 
  CheckCircle2, 
  XCircle, 
  RotateCcw, 
  Lock, 
  Layers,
  Crown,
  Vote,
  FileCode2,
  Zap,
  FileText
} from 'lucide-react';

interface AdminWorkspaceProps {
  user: UserProfile;
  bills: Bill[];
  onSelectBill: (bill: Bill) => void;
  onSaveBill: (updatedBill: Bill) => void;
  onToast: (type: 'success' | 'error' | 'info', text: string) => void;
}

export const AdminWorkspace: React.FC<AdminWorkspaceProps> = ({
  user,
  bills,
  onSelectBill,
  onSaveBill,
  onToast
}) => {
  const isAdmin = isSystemAdmin(user);
  const isAuthorizedToAccess = isAdmin;

  const [selectedBillForAction, setSelectedBillForAction] = useState<Bill | null>(null);
  const [pendingDecision, setPendingDecision] = useState<VoteDecision | null>(null);
  const [adminNoteInput, setAdminNoteInput] = useState('');

  // Forum export modal target bill state
  const [forumExportBill, setForumExportBill] = useState<Bill | null>(null);

  // STAGE 2 QUEUE FILTER RULE:
  // Show ONLY bills that have been APPROVED by the Legislative Commission in Stage 1 (>= 2 votes 'approved')
  // or bills already processed by Administration
  const adminQueueBills = useMemo(() => {
    return bills.filter((b) => {
      if (b.status === 'draft') return false;
      
      const votes = b.votes || {};
      const approveCount = [votes.prosecutor, votes.judge, votes.governor].filter((v) => v === 'approved').length;
      
      const isStage1Approved = approveCount >= 2;
      const isAlreadyProcessed = b.federalVerdict !== undefined || b.status === 'approved' || b.status === 'rejected';

      return isStage1Approved || isAlreadyProcessed;
    });
  }, [bills]);

  // Stage 2 approved bills waiting for Admin to click "Изменить в законах"
  const pendingEnactmentBills = useMemo(() => {
    return bills.filter((b) => {
      return b.federalVerdict?.status === 'approved' && b.status !== 'approved';
    });
  }, [bills]);

  // Global Enactment Action: "Изменить в законах"
  const handleEnactAllApprovedBills = async () => {
    if (!isAdmin) {
      onToast('error', 'Только Системный Администратор выносит и применяет поправки в законах.');
      return;
    }

    const billsToEnact = bills.filter((b) => b.federalVerdict?.status === 'approved' && b.status !== 'approved');
    
    if (billsToEnact.length === 0) {
      onToast('info', 'Сначала вынесите решение "Одобрить 2-й этап" по законопроекту. Без одобрения 2-го этапа внести поправки в закон нельзя.');
      return;
    }

    for (const b of billsToEnact) {
      const enactedBill: Bill = {
        ...b,
        status: 'approved',
        statusReason: 'Официально внесен в Законодательную Базу Штата (Изменен в законах).'
      };
      await onSaveBill(enactedBill);
    }

    onToast('success', `Успешно внесены изменения в законы! Актов вступило в силу: ${billsToEnact.length}. Теперь доступна сфера экспорта на Форум.`);
    
    // Automatically offer forum export for the first enacted bill
    if (billsToEnact.length > 0) {
      setForumExportBill(billsToEnact[0]);
    }
  };

  const handleOpenActionModal = (bill: Bill, decision: VoteDecision) => {
    setSelectedBillForAction(bill);
    setPendingDecision(decision);
    setAdminNoteInput('');
  };

  const handleExecuteAdminVerdict = () => {
    if (!isAdmin || !selectedBillForAction || !pendingDecision) {
      onToast('error', 'Только Системный Администратор выносит вердикт 2-го этапа.');
      return;
    }

    if ((pendingDecision === 'rejected' || pendingDecision === 'needs_revision') && !adminNoteInput.trim()) {
      onToast('error', 'Укажите обязательное мотивированное обоснование вердикта.');
      return;
    }

    const note = adminNoteInput.trim() || 'Официально утверждено Федеральным Правительством на 2-м этапе.';

    const verdict: FederalGovernmentVerdict = {
      status: pendingDecision,
      reason: note,
      updatedAt: new Date().toISOString(),
      adminName: `${user.firstName} ${user.lastName}`
    };

    let officialStatusReason = '';
    if (pendingDecision === 'approved') {
      officialStatusReason = 'Одобрен на 2-м этапе Администрацией. Ожидает применения кнопки "Изменить в законах".';
    } else if (pendingDecision === 'rejected') {
      officialStatusReason = 'Отклонен Федеральным Правительством на 2-м этапе.';
    } else {
      officialStatusReason = 'Отправлен на доработку Федеральным Правительством.';
    }

    const updated: Bill = {
      ...selectedBillForAction,
      status: pendingDecision === 'approved' ? ('under_review' as any) : pendingDecision,
      statusReason: officialStatusReason,
      federalVerdict: verdict
    };

    onSaveBill(updated);
    onToast('success', `Финальное решение 2-го этапа вынесено (${pendingDecision === 'approved' ? 'ОДОБРЕНО (Нажмите "Изменить в законах")' : pendingDecision === 'rejected' ? 'ОТКЛОНЕНО' : 'НА ДОРАБОТКУ'})`);
    setSelectedBillForAction(null);
    setPendingDecision(null);
    setAdminNoteInput('');
  };

  const formatDecreeNumber = (billIndex: number) => {
    return `№ SA-${String(billIndex).padStart(3, '0')}`;
  };

  if (!isAuthorizedToAccess) {
    return (
      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', minHeight: '60vh', color: 'var(--text-muted)' }}>
        <Lock size={64} style={{ marginBottom: '24px', opacity: 0.25, color: 'var(--text-accent)' }} />
        <h2 style={{ fontSize: '1.4rem', fontWeight: 800, color: 'var(--text-primary)', marginBottom: '8px' }}>Доступ ограничен</h2>
        <p style={{ fontFamily: 'var(--font-mono)', fontSize: '0.85rem' }}>Раздел «Администрация» доступен исключительно Системному Администратору.</p>
      </div>
    );
  }

  return (
    <div className="animate-fade-in" style={{ maxWidth: '1280px', margin: '36px auto 60px', padding: '0 24px' }}>
      
      {/* HEADER SECTION WITH ENACTMENT ACTION BUTTON */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '32px', flexWrap: 'wrap', gap: '18px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '18px' }}>
          <div style={{ 
            width: '50px', height: '50px', borderRadius: 'var(--radius-md)', 
            background: 'var(--primary-gradient)', 
            boxShadow: '0 0 20px var(--primary-glow)',
            border: '1px solid rgba(56, 189, 248, 0.4)',
            display: 'flex', alignItems: 'center', justifyContent: 'center' 
          }}>
            <ShieldCheck size={26} color="#ffffff" />
          </div>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
              <h2 style={{ margin: 0, fontSize: '1.5rem', fontWeight: 800, color: 'var(--text-primary)', letterSpacing: '-0.01em' }}>
                Панель Экспертизы и Вердиктов
              </h2>
              <span className="decree-stamp">2-Й ЭТАП (АДМИНИСТРАЦИЯ)</span>
            </div>
            <p style={{ margin: 0, fontSize: '0.86rem', color: 'var(--text-secondary)', marginTop: '2px', fontFamily: 'var(--font-mono)' }}>
              Рассмотрение законопроектов, прошедших 1-й этап Комиссии, и ввод в законную силу
            </p>
          </div>
        </div>

        {/* ENACTMENT BUTTON ("Изменить в законах") FOR ADMIN */}
        <button 
          onClick={handleEnactAllApprovedBills}
          className="btn btn-pill"
          style={{ 
            padding: '12px 26px', 
            fontSize: '0.9rem', 
            fontWeight: 700,
            border: pendingEnactmentBills.length > 0 ? '1px solid var(--success-border)' : '1px solid var(--border-medium)', 
            background: pendingEnactmentBills.length > 0 ? 'linear-gradient(135deg, #10b981 0%, #059669 100%)' : 'var(--bg-surface-elevated)', 
            color: pendingEnactmentBills.length > 0 ? '#ffffff' : 'var(--text-muted)', 
            boxShadow: pendingEnactmentBills.length > 0 ? '0 4px 20px rgba(16, 185, 129, 0.35)' : 'none',
            cursor: pendingEnactmentBills.length > 0 ? 'pointer' : 'not-allowed'
          }}
        >
          <Zap size={18} /> Изменить в законах {pendingEnactmentBills.length > 0 ? `(${pendingEnactmentBills.length})` : '(0)'}
        </button>
      </div>

      {/* REGISTRY QUEUE TABLE CARD */}
      <div className="card" style={{ padding: '0', overflow: 'hidden' }}>
        <div style={{ padding: '18px 28px', borderBottom: '1px solid var(--border-subtle)', display: 'flex', alignItems: 'center', justifyContent: 'space-between', background: 'var(--bg-surface-elevated)' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            <Layers size={18} color="var(--text-accent)" />
            <h3 style={{ margin: 0, fontSize: '1.05rem', fontWeight: 800, color: 'var(--text-primary)' }}>
              Очередь 2-го этапа (Законопроекты с одобрением Комиссии)
            </h3>
          </div>
          <span style={{ fontSize: '0.78rem', color: 'var(--text-muted)', fontFamily: 'var(--font-mono)' }}>
            В очереди: {adminQueueBills.length}
          </span>
        </div>

        {adminQueueBills.length === 0 ? (
          <div style={{ padding: '64px 20px', textAlign: 'center', color: 'var(--text-muted)' }}>
            <FileCode2 size={40} style={{ opacity: 0.3, margin: '0 auto 12px', color: 'var(--text-accent)' }} />
            <p style={{ margin: 0, fontFamily: 'var(--font-mono)', fontSize: '0.88rem' }}>
              Нет законопроектов с одобрением Комиссии (1-й этап), ожидающих вердикта Администрации.
            </p>
          </div>
        ) : (
          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: '0.88rem' }}>
              <thead>
                <tr style={{ background: 'var(--bg-input)', color: 'rgba(255, 255, 255, 0.65)', borderBottom: '1px solid var(--border-medium)' }}>
                  <th style={{ padding: '16px 20px', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.08em', fontSize: '0.72rem', fontFamily: 'var(--font-mono)' }}>Номер / Закон</th>
                  <th style={{ padding: '16px 20px', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.08em', fontSize: '0.72rem', fontFamily: 'var(--font-mono)' }}>Статус / Этап</th>
                  <th style={{ padding: '16px 20px', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.08em', fontSize: '0.72rem', fontFamily: 'var(--font-mono)' }}>1-й Этап (Комиссия)</th>
                  <th style={{ padding: '16px 20px', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.08em', fontSize: '0.72rem', fontFamily: 'var(--font-mono)' }}>Инициатор</th>
                  <th style={{ padding: '16px 20px', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.08em', fontSize: '0.72rem', fontFamily: 'var(--font-mono)', textAlign: 'right', minWidth: '340px' }}>Действия 2-го Этапа</th>
                </tr>
              </thead>
              <tbody>
                {adminQueueBills.map((bill, index) => {
                  const votes = bill.votes || {};
                  const approveCount = [votes.prosecutor, votes.judge, votes.governor].filter((v) => v === 'approved').length;
                  const rejectCount = [votes.prosecutor, votes.judge, votes.governor].filter((v) => v === 'rejected').length;
                  
                  const isEnacted = bill.status === 'approved';
                  const isStage2ApprovedPendingEnactment = bill.federalVerdict?.status === 'approved' && !isEnacted;

                  return (
                    <tr key={bill.id} style={{ borderBottom: '1px solid var(--border-subtle)' }}>
                      <td style={{ padding: '16px 20px' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                          <span className="decree-stamp" style={{ padding: '2px 6px', fontSize: '0.65rem' }}>
                            {formatDecreeNumber(index)}
                          </span>
                          <span style={{ fontWeight: 700, color: 'var(--text-primary)' }}>
                            {bill.targetLaw || bill.title}
                          </span>
                        </div>
                      </td>
                      <td style={{ padding: '16px 20px' }}>
                        {isEnacted ? (
                          <span className="badge badge-status-approved">
                            <span className="status-dot status-dot-active" /> Вступил в силу
                          </span>
                        ) : isStage2ApprovedPendingEnactment ? (
                          <span className="badge badge-status-review" style={{ borderColor: 'var(--success-border)', background: 'var(--success-bg)', color: 'var(--success-text)' }}>
                            <span className="status-dot status-dot-active" /> Одобрен 2-м этапом
                          </span>
                        ) : bill.status === 'rejected' ? (
                          <span className="badge badge-status-rejected">
                            <span className="status-dot status-dot-danger" /> Отклонен
                          </span>
                        ) : bill.status === 'needs_revision' ? (
                          <span className="badge badge-status-revision">
                            <span className="status-dot status-dot-info" /> Доработка
                          </span>
                        ) : (
                          <span className="badge badge-status-review">
                            <span className="status-dot status-dot-review" /> Ожидает 2-го этапа
                          </span>
                        )}
                      </td>
                      <td style={{ padding: '16px 20px' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '0.78rem', fontFamily: 'var(--font-mono)', fontWeight: 600, color: 'var(--success-text)' }}>
                          <Vote size={14} />
                          {approveCount} За / {rejectCount} Против (Одобрен)
                        </div>
                      </td>
                      <td style={{ padding: '16px 20px', color: '#f8fafc', fontFamily: 'var(--font-mono)', fontSize: '0.82rem', fontWeight: 600 }}>
                        {bill.author}
                      </td>
                      <td style={{ padding: '16px 20px', textAlign: 'right' }}>
                        <div style={{ display: 'inline-flex', gap: '6px', alignItems: 'center', flexWrap: 'wrap', justifyContent: 'flex-end' }}>
                          
                          {/* VIEW BUTTON */}
                          <button 
                            onClick={() => onSelectBill(bill)} 
                            className="btn btn-secondary btn-pill" 
                            style={{ padding: '6px 12px', fontSize: '0.76rem' }}
                          >
                            <Eye size={13} /> Просмотр
                          </button>

                          {/* FORUM EXPORT BUTTON FOR ENACTED BILLS */}
                          {isEnacted && (
                            <button 
                              onClick={() => setForumExportBill(bill)} 
                              className="btn btn-pill" 
                              style={{ padding: '6px 12px', fontSize: '0.76rem', background: 'rgba(56, 189, 248, 0.12)', color: 'var(--text-accent)', border: '1px solid rgba(56, 189, 248, 0.35)' }}
                              title="Открыть сферу публикаций на Форуме"
                            >
                              <FileText size={13} /> Текст для Форума
                            </button>
                          )}

                          {/* ACTION BUTTONS FOR STAGE 2 VERDICT */}
                          {!isEnacted && (
                            <>
                              <button 
                                onClick={() => handleOpenActionModal(bill, 'approved')} 
                                className="btn btn-pill" 
                                style={{ padding: '6px 12px', fontSize: '0.76rem', background: bill.federalVerdict?.status === 'approved' ? 'var(--success-bg)' : 'rgba(63, 185, 80, 0.14)', color: 'var(--success-text)', border: '1px solid var(--success-border)', fontWeight: 600 }}
                              >
                                <CheckCircle2 size={13} /> Одобрить 2-й этап
                              </button>

                              <button 
                                onClick={() => handleOpenActionModal(bill, 'needs_revision')} 
                                className="btn btn-secondary btn-pill" 
                                style={{ padding: '6px 12px', fontSize: '0.76rem', color: 'var(--warning-text)', borderColor: 'var(--warning-border)' }}
                              >
                                <RotateCcw size={13} /> Доработка
                              </button>

                              <button 
                                onClick={() => handleOpenActionModal(bill, 'rejected')} 
                                className="btn btn-danger btn-pill" 
                                style={{ padding: '6px 12px', fontSize: '0.76rem' }}
                              >
                                <XCircle size={13} /> Отклонить
                              </button>
                            </>
                          )}

                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* ACTION MODAL FOR STAGE 2 VERDICT */}
      {selectedBillForAction && pendingDecision && (
        <div className="modal-overlay">
          <div className="modal-content">
            <div className="modal-header">
              <h3 style={{ margin: 0, fontSize: '1.05rem', color: 'var(--text-primary)', display: 'flex', alignItems: 'center', gap: '10px' }}>
                <Crown size={18} color="var(--primary)" /> 
                2-й Этап: Вердикт Администрации
              </h3>
            </div>
            <div className="modal-body">
              <p style={{ fontSize: '0.88rem', color: 'var(--text-secondary)', marginBottom: '18px', lineHeight: 1.5 }}>
                Вы выносите вердикт 2-го этапа по нормативному акту: <strong style={{ color: 'var(--text-primary)' }}>{selectedBillForAction.targetLaw}</strong>
              </p>

              <div style={{ marginBottom: '18px', padding: '16px', borderRadius: 'var(--radius-md)', border: `1px solid ${pendingDecision === 'approved' ? 'var(--success-border)' : pendingDecision === 'rejected' ? 'var(--danger-border)' : 'var(--warning-border)'}`, background: 'var(--bg-input)' }}>
                <div style={{ fontWeight: 800, fontFamily: 'var(--font-mono)', color: pendingDecision === 'approved' ? 'var(--success-text)' : pendingDecision === 'rejected' ? 'var(--danger-text)' : 'var(--warning-text)', marginBottom: '10px', display: 'flex', alignItems: 'center', gap: '8px', fontSize: '0.88rem' }}>
                  {pendingDecision === 'approved' ? <CheckCircle2 size={16}/> : pendingDecision === 'rejected' ? <XCircle size={16}/> : <RotateCcw size={16}/>}
                  ВЕРДИКТ 2-го ЭТАПА: {pendingDecision === 'approved' ? 'ОДОБРИТЬ 2-й ЭТАП (Затем нажмите "Изменить в законах")' : pendingDecision === 'rejected' ? 'ОТКЛОНИТЬ' : 'ОТПРАВИТЬ НА ДОРАБОТКУ'}
                </div>
                <label className="input-label" style={{ marginTop: '14px' }}>Мотивированное обоснование вердикта {pendingDecision !== 'approved' && '(обязательно)'}</label>
                <textarea
                  className="input-field"
                  style={{ width: '100%', minHeight: '100px', resize: 'vertical', fontSize: '0.85rem' }}
                  placeholder="Официальное заключение Администрации..."
                  value={adminNoteInput}
                  onChange={(e) => setAdminNoteInput(e.target.value)}
                />
              </div>
            </div>
            <div className="modal-footer">
              <button className="btn btn-secondary btn-pill" onClick={() => setSelectedBillForAction(null)}>Отмена</button>
              <button 
                className="btn btn-primary btn-pill" 
                onClick={handleExecuteAdminVerdict}
                disabled={(pendingDecision !== 'approved' && !adminNoteInput.trim())}
              >
                Вынести решение 2-го этапа
              </button>
            </div>
          </div>
        </div>
      )}

      {/* FORUM EXPORT MODAL */}
      {forumExportBill && (
        <ForumExportModal
          bill={forumExportBill}
          onClose={() => setForumExportBill(null)}
          onToast={onToast}
        />
      )}

    </div>
  );
};
