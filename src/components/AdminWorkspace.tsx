import React, { useState, useMemo } from 'react';
import type { Bill, UserProfile, VoteDecision, FederalGovernmentVerdict } from '../types/bill';
import { isSystemAdmin, isOfficialCommitteeMember } from '../services/securityService';
import { 
  ShieldCheck, 
  Eye, 
  CheckCircle2, 
  XCircle, 
  RotateCcw, 
  Lock, 
  Layers,
  Crown,
  Vote
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
  const isCommittee = isOfficialCommitteeMember(user);
  const isAuthorizedToAccess = isAdmin || isCommittee;

  const [selectedBillForAction, setSelectedBillForAction] = useState<Bill | null>(null);
  const [pendingDecision, setPendingDecision] = useState<VoteDecision | null>(null);
  const [adminNoteInput, setAdminNoteInput] = useState('');

  const adminQueueBills = useMemo(() => {
    return bills.filter((b) => b.status !== 'draft');
  }, [bills]);

  const handleOpenActionModal = (bill: Bill, decision: VoteDecision) => {
    setSelectedBillForAction(bill);
    setPendingDecision(decision);
    setAdminNoteInput('');
  };

  const handleExecuteAdminVerdict = () => {
    if (!isAdmin || !selectedBillForAction || !pendingDecision) {
      onToast('error', 'Только Системный Администратор (Федеральное Правительство) выносит вердикт 2-го этапа.');
      return;
    }

    if ((pendingDecision === 'rejected' || pendingDecision === 'needs_revision') && !adminNoteInput.trim()) {
      onToast('error', 'Укажите обязательное мотивированное обоснование вердикта.');
      return;
    }

    const note = adminNoteInput.trim() || 'Официально утверждено Федеральным Правительством.';

    const verdict: FederalGovernmentVerdict = {
      status: pendingDecision,
      reason: note,
      updatedAt: new Date().toISOString(),
      adminName: `${user.firstName} ${user.lastName}`
    };

    let officialStatusReason = '';
    if (pendingDecision === 'approved') {
      officialStatusReason = 'Официально утвержден Федеральным Правительством.';
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
    onToast('success', `Финальное решение записано`);
    setSelectedBillForAction(null);
    setPendingDecision(null);
    setAdminNoteInput('');
  };

  if (!isAuthorizedToAccess) {
    return (
      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', minHeight: '60vh', color: 'var(--text-muted)' }}>
        <Lock size={64} style={{ marginBottom: '24px', opacity: 0.25 }} />
        <h2 style={{ fontSize: '1.5rem', fontWeight: 600, color: 'var(--text-primary)', marginBottom: '8px' }}>Доступ ограничен</h2>
        <p>Раздел доступен исключительно уполномоченным членам Законодательной Комиссии и Администрации.</p>
      </div>
    );
  }

  return (
    <div className="animate-fade-in" style={{ maxWidth: '1180px', margin: '36px auto 60px', padding: '0 24px' }}>
      
      <div style={{ display: 'flex', alignItems: 'center', gap: '18px', marginBottom: '32px' }}>
        <div style={{ 
          width: '52px', height: '52px', borderRadius: '16px', 
          background: 'var(--primary-gradient)', 
          boxShadow: '0 4px 20px var(--primary-glow)',
          display: 'flex', alignItems: 'center', justifyContent: 'center' 
        }}>
          <ShieldCheck size={28} color="#ffffff" />
        </div>
        <div>
          <h2 style={{ margin: 0, fontSize: '1.5rem', fontWeight: 800, color: 'var(--text-primary)' }}>Панель Правительства и Комиссии</h2>
          <p style={{ margin: 0, fontSize: '0.88rem', color: 'var(--text-muted)', marginTop: '4px' }}>Двухэтапное голосование комиссии и вердикты Администрации</p>
        </div>
      </div>

      <div className="card" style={{ padding: '0', overflow: 'hidden' }}>
        <div style={{ padding: '20px 28px', borderBottom: '1px solid var(--border-subtle)', display: 'flex', alignItems: 'center', gap: '12px', background: 'var(--bg-surface-elevated)' }}>
          <Layers size={20} color="var(--text-accent)" />
          <h3 style={{ margin: 0, fontSize: '1.05rem', fontWeight: 700, color: 'var(--text-primary)' }}>Очередь рассмотрения (1-й и 2-й Этапы)</h3>
        </div>

        {adminQueueBills.length === 0 ? (
          <div style={{ padding: '64px 20px', textAlign: 'center', color: 'var(--text-muted)' }}>
            <p style={{ margin: 0 }}>Нет законопроектов, ожидающих решения.</p>
          </div>
        ) : (
          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: '0.88rem' }}>
              <thead>
                <tr style={{ background: 'var(--bg-input)', color: 'var(--text-secondary)', borderBottom: '1px solid var(--border-medium)' }}>
                  <th style={{ padding: '18px 28px', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.05em', fontSize: '0.75rem' }}>Законопроект</th>
                  <th style={{ padding: '18px 28px', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.05em', fontSize: '0.75rem' }}>Статус / Этап</th>
                  <th style={{ padding: '18px 28px', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.05em', fontSize: '0.75rem' }}>1-й Этап (Комиссия)</th>
                  <th style={{ padding: '18px 28px', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.05em', fontSize: '0.75rem' }}>Инициатор</th>
                  <th style={{ padding: '18px 28px', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.05em', fontSize: '0.75rem', textAlign: 'right' }}>Действия</th>
                </tr>
              </thead>
              <tbody>
                {adminQueueBills.map((bill) => {
                  const votes = bill.votes || {};
                  const approveCount = [votes.prosecutor, votes.judge, votes.governor].filter((v) => v === 'approved').length;
                  const rejectCount = [votes.prosecutor, votes.judge, votes.governor].filter((v) => v === 'rejected').length;
                  const isPassedStage1 = approveCount >= 2;

                  return (
                    <tr key={bill.id} style={{ borderBottom: '1px solid var(--border-subtle)' }}>
                      <td style={{ padding: '18px 28px', fontWeight: 700, color: 'var(--text-primary)' }}>
                        {bill.targetLaw || bill.title}
                      </td>
                      <td style={{ padding: '18px 28px' }}>
                        <span className={`badge badge-status-${bill.status === 'under_review' ? 'review' : bill.status === 'approved' ? 'approved' : bill.status === 'needs_revision' ? 'revision' : 'rejected'}`}>
                          {bill.status === 'under_review' ? (isPassedStage1 ? '2-й Этап (Админ)' : '1-й Этап (Комиссия)') : bill.status === 'approved' ? 'Закон Одобрен' : bill.status === 'needs_revision' ? 'На доработке' : 'Отклонен'}
                        </span>
                      </td>
                      <td style={{ padding: '18px 28px' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '0.8rem', fontWeight: 600, color: isPassedStage1 ? 'var(--success-text)' : rejectCount >= 2 ? 'var(--danger-text)' : 'var(--text-muted)' }}>
                          <Vote size={14} />
                          {approveCount > 0 || rejectCount > 0 ? `${approveCount} За / ${rejectCount} Против` : 'Ожидает голосов'}
                        </div>
                      </td>
                      <td style={{ padding: '18px 28px', color: 'var(--text-secondary)', fontWeight: 500 }}>
                        {bill.author}
                      </td>
                      <td style={{ padding: '18px 28px', textAlign: 'right' }}>
                        <div style={{ display: 'inline-flex', gap: '8px' }}>
                          <button onClick={() => onSelectBill(bill)} className="btn btn-secondary" style={{ padding: '7px 14px' }}>
                            <Eye size={15} /> Открыть
                          </button>
                          {isAdmin && bill.status === 'under_review' && (
                            <>
                              <button onClick={() => handleOpenActionModal(bill, 'approved')} className="btn btn-primary" style={{ padding: '7px 14px' }}>
                                <CheckCircle2 size={15} /> 2-й Этап: Утвердить
                              </button>
                              <button onClick={() => handleOpenActionModal(bill, 'needs_revision')} className="btn btn-secondary" style={{ padding: '7px 14px' }}>
                                <RotateCcw size={15} /> Доработка
                              </button>
                              <button onClick={() => handleOpenActionModal(bill, 'rejected')} className="btn btn-danger" style={{ padding: '7px 14px' }}>
                                <XCircle size={15} /> Отклонить
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
              <h3 style={{ margin: 0, fontSize: '1.1rem', color: 'var(--text-primary)', display: 'flex', alignItems: 'center', gap: '10px' }}>
                <Crown size={20} color="var(--primary-hover)" /> 
                2-й Этап: Вердикт Администрации
              </h3>
            </div>
            <div className="modal-body">
              <p style={{ fontSize: '0.92rem', color: 'var(--text-secondary)', marginBottom: '20px' }}>
                Вы выносите окончательный вердикт по документу: <strong style={{ color: 'var(--text-primary)' }}>{selectedBillForAction.targetLaw}</strong>
              </p>

              <div style={{ marginBottom: '20px', padding: '18px', borderRadius: 'var(--radius-md)', border: `1px solid ${pendingDecision === 'approved' ? 'var(--success-border)' : pendingDecision === 'rejected' ? 'var(--danger-border)' : 'var(--warning-border)'}`, background: 'var(--bg-input)' }}>
                <div style={{ fontWeight: 700, color: pendingDecision === 'approved' ? 'var(--success-text)' : pendingDecision === 'rejected' ? 'var(--danger-text)' : 'var(--warning-text)', marginBottom: '10px', display: 'flex', alignItems: 'center', gap: '8px', fontSize: '0.95rem' }}>
                  {pendingDecision === 'approved' ? <CheckCircle2 size={18}/> : pendingDecision === 'rejected' ? <XCircle size={18}/> : <RotateCcw size={18}/>}
                  ВЕРДИКТ 2-го ЭТАПА: {pendingDecision === 'approved' ? 'УТВЕРДИТЬ ЗАКОН' : pendingDecision === 'rejected' ? 'ОТКЛОНИТЬ' : 'НА ДОРАБОТКУ'}
                </div>
                <label className="input-label" style={{ marginTop: '16px' }}>Мотивированное обоснование {pendingDecision !== 'approved' && '(обязательно)'}</label>
                <textarea
                  className="input-field"
                  style={{ width: '100%', minHeight: '110px', resize: 'vertical' }}
                  placeholder="Введите решение и официальный комментарий Федерального Правительства..."
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
                Вынести вердикт
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
};
