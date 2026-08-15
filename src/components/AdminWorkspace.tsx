import React, { useState, useMemo } from 'react';
import type { Bill, UserProfile, VoteDecision, FederalGovernmentVerdict } from '../types/bill';
import { isSystemAdmin } from '../services/securityService';
import { 
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

  // STAGE 2 QUEUE FILTER:
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

  // Stage 2 approved bills waiting for Admin to enact into laws
  const pendingEnactmentBills = useMemo(() => {
    return bills.filter((b) => {
      return b.federalVerdict?.status === 'approved' && b.status !== 'approved';
    });
  }, [bills]);

  const handleEnactAllApprovedBills = async () => {
    if (!isAdmin) {
      onToast('error', 'Только Администратор применяет поправки в законах.');
      return;
    }

    const billsToEnact = bills.filter((b) => b.federalVerdict?.status === 'approved' && b.status !== 'approved');
    
    if (billsToEnact.length === 0) {
      onToast('info', 'Сначала вынесите решение "Одобрить 2-й этап" по законопроекту.');
      return;
    }

    for (const b of billsToEnact) {
      const enactedBill: Bill = {
        ...b,
        status: 'approved',
        statusReason: 'Официально внесен в Законодательную Базу Штата.'
      };
      await onSaveBill(enactedBill);
    }

    onToast('success', `Изменения внесены в законы (актов: ${billsToEnact.length})`);
  };

  const handleOpenActionModal = (bill: Bill, decision: VoteDecision) => {
    setSelectedBillForAction(bill);
    setPendingDecision(decision);
    setAdminNoteInput('');
  };

  const handleExecuteAdminVerdict = () => {
    if (!isAdmin || !selectedBillForAction || !pendingDecision) {
      onToast('error', 'Только Администратор выносит вердикт 2-го этапа.');
      return;
    }

    if ((pendingDecision === 'rejected' || pendingDecision === 'needs_revision') && !adminNoteInput.trim()) {
      onToast('error', 'Укажите обоснование вердикта.');
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
      officialStatusReason = 'Одобрен на 2-м этапе Администрацией. Ожидает внесения в законы.';
    } else if (pendingDecision === 'rejected') {
      officialStatusReason = 'Отклонен Федеральным Правительством на 2-м этапе.';
    } else {
      officialStatusReason = 'Отправлен на доработку Федеральным Правительством.';
    }

    const updated: Bill = {
      ...selectedBillForAction,
      status: pendingDecision,
      statusReason: officialStatusReason,
      federalVerdict: verdict
    };

    onSaveBill(updated);
    onToast('success', `Вердикт вынесен: ${pendingDecision === 'approved' ? 'ОДОБРЕНО' : pendingDecision === 'rejected' ? 'ОТКЛОНЕНО' : 'НА ДОРАБОТКУ'}`);
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
        <Lock size={48} style={{ marginBottom: '16px', opacity: 0.25, color: 'var(--text-accent)' }} />
        <h2 style={{ fontSize: '1.2rem', fontWeight: 700, color: 'var(--text-primary)', marginBottom: '4px' }}>Доступ ограничен</h2>
        <p style={{ fontFamily: 'var(--font-mono)', fontSize: '0.8rem' }}>Раздел доступен только Администратору.</p>
      </div>
    );
  }

  return (
    <div className="animate-fade-in" style={{ maxWidth: '1200px', margin: '24px auto 60px', padding: '0 20px' }}>
      
      {/* HEADER WITH ENACT BUTTON */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '24px', flexWrap: 'wrap', gap: '14px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          <img 
            src="/logo.png" 
            alt="State Seal" 
            style={{ 
              width: '38px', 
              height: '38px', 
              aspectRatio: '1 / 1',
              objectFit: 'contain', 
              flexShrink: 0 
            }} 
          />
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <h2 style={{ margin: 0, fontSize: '1.3rem', fontWeight: 700, color: 'var(--text-primary)' }}>
                Панель Администрации
              </h2>
              <span className="decree-stamp">2-Й ЭТАП</span>
            </div>
            <p style={{ margin: 0, fontSize: '0.8rem', color: 'var(--text-muted)' }}>
              Рассмотрение законопроектов после Законодательной Комиссии
            </p>
          </div>
        </div>

        {/* ENACT BUTTON */}
        <button 
          onClick={handleEnactAllApprovedBills}
          className="btn btn-pill"
          style={{ 
            padding: '8px 18px', 
            fontSize: '0.84rem', 
            fontWeight: 600,
            border: pendingEnactmentBills.length > 0 ? '1px solid var(--success-border)' : '1px solid var(--border-subtle)', 
            background: pendingEnactmentBills.length > 0 ? 'var(--success-bg)' : 'var(--bg-surface-elevated)', 
            color: pendingEnactmentBills.length > 0 ? 'var(--success-text)' : 'var(--text-muted)', 
            cursor: pendingEnactmentBills.length > 0 ? 'pointer' : 'not-allowed'
          }}
        >
          <Zap size={14} /> Внести в законы {pendingEnactmentBills.length > 0 ? `(${pendingEnactmentBills.length})` : '(0)'}
        </button>
      </div>

      {/* QUEUE TABLE CARD */}
      <div className="card" style={{ padding: '0', overflow: 'hidden' }}>
        <div style={{ padding: '12px 18px', borderBottom: '1px solid var(--border-subtle)', display: 'flex', alignItems: 'center', justifyContent: 'space-between', background: 'var(--bg-surface-elevated)' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <Layers size={15} color="var(--text-accent)" />
            <h3 style={{ margin: 0, fontSize: '0.92rem', fontWeight: 600, color: 'var(--text-primary)' }}>
              Очередь законопроектов на рассмотрение
            </h3>
          </div>
          <span style={{ fontSize: '0.74rem', color: 'var(--text-muted)', fontFamily: 'var(--font-mono)' }}>
            В очереди: {adminQueueBills.length}
          </span>
        </div>

        {adminQueueBills.length === 0 ? (
          <div style={{ padding: '48px 20px', textAlign: 'center', color: 'var(--text-muted)' }}>
            <FileCode2 size={36} style={{ opacity: 0.2, margin: '0 auto 10px', color: 'var(--text-accent)' }} />
            <p style={{ margin: 0, fontSize: '0.84rem' }}>
              Нет законопроектов, ожидающих вердикта Администрации.
            </p>
          </div>
        ) : (
          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: '0.84rem' }}>
              <thead>
                <tr style={{ background: 'var(--bg-input)', color: 'var(--text-muted)', borderBottom: '1px solid var(--border-subtle)' }}>
                  <th style={{ padding: '10px 16px', fontWeight: 600, fontSize: '0.7rem', fontFamily: 'var(--font-mono)' }}>НОМЕР / ЗАКОН</th>
                  <th style={{ padding: '10px 16px', fontWeight: 600, fontSize: '0.7rem', fontFamily: 'var(--font-mono)' }}>СТАТУС</th>
                  <th style={{ padding: '10px 16px', fontWeight: 600, fontSize: '0.7rem', fontFamily: 'var(--font-mono)' }}>КОМИССИЯ</th>
                  <th style={{ padding: '10px 16px', fontWeight: 600, fontSize: '0.7rem', fontFamily: 'var(--font-mono)' }}>АВТОР</th>
                  <th style={{ padding: '10px 16px', fontWeight: 600, fontSize: '0.7rem', fontFamily: 'var(--font-mono)', textAlign: 'right' }}>ДЕЙСТВИЯ</th>
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
                      <td style={{ padding: '12px 16px' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                          <span className="decree-stamp" style={{ padding: '1px 5px', fontSize: '0.62rem' }}>
                            {formatDecreeNumber(index)}
                          </span>
                          <span style={{ fontWeight: 600, color: 'var(--text-primary)' }}>
                            {bill.targetLaw || bill.title}
                          </span>
                        </div>
                      </td>
                      <td style={{ padding: '12px 16px' }}>
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
                      <td style={{ padding: '12px 16px' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '5px', fontSize: '0.75rem', fontFamily: 'var(--font-mono)', color: 'var(--success-text)' }}>
                          <Vote size={13} />
                          {approveCount} За / {rejectCount} Против
                        </div>
                      </td>
                      <td style={{ padding: '12px 16px', color: 'var(--text-secondary)', fontFamily: 'var(--font-mono)', fontSize: '0.78rem' }}>
                        {bill.author}
                      </td>
                      <td style={{ padding: '12px 16px', textAlign: 'right' }}>
                        <div style={{ display: 'inline-flex', gap: '5px', alignItems: 'center', justifyContent: 'flex-end' }}>
                          <button 
                            onClick={() => onSelectBill(bill)} 
                            className="btn btn-secondary btn-pill" 
                            style={{ padding: '4px 10px', fontSize: '0.74rem' }}
                          >
                            <Eye size={12} /> Просмотр
                          </button>

                          {isEnacted && (
                            bill.statusReason?.includes('внесены в законодательную базу') ? (
                              <span style={{ fontSize: '0.7rem', color: 'var(--success-text)', fontFamily: 'var(--font-mono)', padding: '3px 8px' }}>
                                ✓ Внесен
                              </span>
                            ) : (
                              <button 
                                onClick={async () => {
                                  const updated: Bill = {
                                    ...bill,
                                    status: 'approved',
                                    statusReason: 'Изменения официально внесены в законодательную базу Штата San Andreas.',
                                    updatedAt: new Date().toISOString()
                                  };
                                  await onSaveBill(updated);
                                  onToast('success', 'Изменения внесены в законы');
                                }} 
                                className="btn btn-primary btn-pill" 
                                style={{ padding: '4px 10px', fontSize: '0.74rem' }}
                              >
                                <FileText size={12} /> Внести
                              </button>
                            )
                          )}

                          {!isEnacted && (
                            <>
                              <button 
                                onClick={() => handleOpenActionModal(bill, 'approved')} 
                                className="btn btn-success btn-pill" 
                                style={{ padding: '4px 10px', fontSize: '0.74rem' }}
                              >
                                <CheckCircle2 size={12} /> Одобрить
                              </button>

                              <button 
                                onClick={() => handleOpenActionModal(bill, 'needs_revision')} 
                                className="btn btn-secondary btn-pill" 
                                style={{ padding: '4px 8px', fontSize: '0.74rem' }}
                              >
                                <RotateCcw size={12} /> Правки
                              </button>

                              <button 
                                onClick={() => handleOpenActionModal(bill, 'rejected')} 
                                className="btn btn-danger btn-pill" 
                                style={{ padding: '4px 8px', fontSize: '0.74rem' }}
                              >
                                <XCircle size={12} /> Отклонить
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

      {/* VERDICT MODAL */}
      {selectedBillForAction && pendingDecision && (
        <div className="modal-overlay">
          <div className="modal-content">
            <div className="modal-header">
              <h3 style={{ margin: 0, fontSize: '0.98rem', color: 'var(--text-primary)', display: 'flex', alignItems: 'center', gap: '8px' }}>
                <Crown size={16} color="var(--primary)" /> 
                Вердикт Администрации (2-й этап)
              </h3>
            </div>
            <div className="modal-body">
              <p style={{ fontSize: '0.84rem', color: 'var(--text-secondary)', marginBottom: '14px' }}>
                Законопроект: <strong style={{ color: 'var(--text-primary)' }}>{selectedBillForAction.targetLaw}</strong>
              </p>

              <div style={{ marginBottom: '14px', padding: '12px', borderRadius: 'var(--radius-md)', background: 'var(--bg-input)', border: '1px solid var(--border-subtle)' }}>
                <div style={{ fontWeight: 700, fontFamily: 'var(--font-mono)', color: pendingDecision === 'approved' ? 'var(--success-text)' : pendingDecision === 'rejected' ? 'var(--danger-text)' : 'var(--warning-text)', marginBottom: '8px', display: 'flex', alignItems: 'center', gap: '6px', fontSize: '0.82rem' }}>
                  {pendingDecision === 'approved' ? <CheckCircle2 size={15}/> : pendingDecision === 'rejected' ? <XCircle size={15}/> : <RotateCcw size={15}/>}
                  РЕШЕНИЕ: {pendingDecision === 'approved' ? 'ОДОБРИТЬ' : pendingDecision === 'rejected' ? 'ОТКЛОНИТЬ' : 'НА ДОРАБОТКУ'}
                </div>
                <label className="input-label" style={{ marginTop: '10px' }}>Обоснование {pendingDecision !== 'approved' && '(обязательно)'}</label>
                <textarea
                  className="input-field"
                  style={{ width: '100%', minHeight: '80px', resize: 'vertical', fontSize: '0.82rem' }}
                  placeholder="Официальное заключение..."
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
                Вынести решение
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
};
