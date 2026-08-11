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
  Vote,
  FileCode2
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
      officialStatusReason = 'Официально утвержден Федеральным Правительством и вступил в силу.';
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
    onToast('success', `Финальный вердикт записан в реестр`);
    setSelectedBillForAction(null);
    setPendingDecision(null);
    setAdminNoteInput('');
  };

  const formatDecreeNumber = (id: string) => {
    const numericId = id.replace(/\D/g, '').slice(-4) || '0042';
    return `SA-${numericId}`;
  };

  if (!isAuthorizedToAccess) {
    return (
      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', minHeight: '60vh', color: 'var(--text-muted)' }}>
        <Lock size={64} style={{ marginBottom: '24px', opacity: 0.25, color: 'var(--text-accent)' }} />
        <h2 style={{ fontSize: '1.4rem', fontWeight: 800, color: 'var(--text-primary)', marginBottom: '8px' }}>Доступ ограничен</h2>
        <p style={{ fontFamily: 'var(--font-mono)', fontSize: '0.85rem' }}>Раздел доступен исключительно уполномоченным членам Комиссии и Администрации.</p>
      </div>
    );
  }

  return (
    <div className="animate-fade-in" style={{ maxWidth: '1240px', margin: '36px auto 60px', padding: '0 24px' }}>
      
      {/* HEADER SECTION */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '18px', marginBottom: '32px' }}>
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
            <span className="decree-stamp">SA TECH GOV</span>
          </div>
          <p style={{ margin: 0, fontSize: '0.86rem', color: 'var(--text-secondary)', marginTop: '2px', fontFamily: 'var(--font-mono)' }}>
            Двухэтапный контроль нормативных актов, голоса Законодательной Комиссии и вердикты Администрации
          </p>
        </div>
      </div>

      {/* REGISTRY QUEUE TABLE CARD */}
      <div className="card" style={{ padding: '0', overflow: 'hidden' }}>
        <div style={{ padding: '18px 28px', borderBottom: '1px solid var(--border-subtle)', display: 'flex', alignItems: 'center', justifyContent: 'space-between', background: 'var(--bg-surface-elevated)' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            <Layers size={18} color="var(--text-accent)" />
            <h3 style={{ margin: 0, fontSize: '1.05rem', fontWeight: 800, color: 'var(--text-primary)' }}>
              Очередь законопроектов на рассмотрение
            </h3>
          </div>
          <span style={{ fontSize: '0.78rem', color: 'var(--text-muted)', fontFamily: 'var(--font-mono)' }}>
            Всего актов: {adminQueueBills.length}
          </span>
        </div>

        {adminQueueBills.length === 0 ? (
          <div style={{ padding: '64px 20px', textAlign: 'center', color: 'var(--text-muted)' }}>
            <FileCode2 size={40} style={{ opacity: 0.3, margin: '0 auto 12px', color: 'var(--text-accent)' }} />
            <p style={{ margin: 0, fontFamily: 'var(--font-mono)', fontSize: '0.88rem' }}>В очереди нет законопроектов, требующих рассмотрения.</p>
          </div>
        ) : (
          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: '0.88rem' }}>
              <thead>
                <tr style={{ background: 'var(--bg-input)', color: 'var(--text-secondary)', borderBottom: '1px solid var(--border-medium)' }}>
                  <th style={{ padding: '16px 24px', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.08em', fontSize: '0.72rem', fontFamily: 'var(--font-mono)' }}>Номер / Закон</th>
                  <th style={{ padding: '16px 24px', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.08em', fontSize: '0.72rem', fontFamily: 'var(--font-mono)' }}>Статус / Этап</th>
                  <th style={{ padding: '16px 24px', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.08em', fontSize: '0.72rem', fontFamily: 'var(--font-mono)' }}>1-й Этап (Комиссия)</th>
                  <th style={{ padding: '16px 24px', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.08em', fontSize: '0.72rem', fontFamily: 'var(--font-mono)' }}>Инициатор</th>
                  <th style={{ padding: '16px 24px', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.08em', fontSize: '0.72rem', fontFamily: 'var(--font-mono)', textAlign: 'right' }}>Действия</th>
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
                      <td style={{ padding: '16px 24px' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                          <span className="decree-stamp" style={{ padding: '2px 6px', fontSize: '0.65rem' }}>
                            {formatDecreeNumber(bill.id)}
                          </span>
                          <span style={{ fontWeight: 700, color: 'var(--text-primary)' }}>
                            {bill.targetLaw || bill.title}
                          </span>
                        </div>
                      </td>
                      <td style={{ padding: '16px 24px' }}>
                        {bill.status === 'approved' ? (
                          <span className="badge badge-status-approved">
                            <span className="status-dot status-dot-active" /> Вступил в силу
                          </span>
                        ) : bill.status === 'rejected' ? (
                          <span className="badge badge-status-rejected">
                            <span className="status-dot status-dot-danger" /> Отклонен
                          </span>
                        ) : bill.status === 'needs_revision' ? (
                          <span className="badge badge-status-revision">
                            <span className="status-dot status-dot-info" /> Реформирование
                          </span>
                        ) : (
                          <span className="badge badge-status-review">
                            <span className="status-dot status-dot-review" /> {isPassedStage1 ? '2-й Этап (Админ)' : '1-й Этап (Комиссия)'}
                          </span>
                        )}
                      </td>
                      <td style={{ padding: '16px 24px' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '0.78rem', fontFamily: 'var(--font-mono)', fontWeight: 600, color: isPassedStage1 ? 'var(--success-text)' : rejectCount >= 2 ? 'var(--danger-text)' : 'var(--text-muted)' }}>
                          <Vote size={14} />
                          {approveCount > 0 || rejectCount > 0 ? `${approveCount} За / ${rejectCount} Против` : 'Ожидает голосов'}
                        </div>
                      </td>
                      <td style={{ padding: '16px 24px', color: 'var(--text-secondary)', fontFamily: 'var(--font-mono)', fontSize: '0.82rem' }}>
                        {bill.author}
                      </td>
                      <td style={{ padding: '16px 24px', textAlign: 'right' }}>
                        <div style={{ display: 'inline-flex', gap: '8px' }}>
                          <button onClick={() => onSelectBill(bill)} className="btn btn-secondary" style={{ padding: '6px 12px', fontSize: '0.78rem' }}>
                            <Eye size={14} /> Просмотр
                          </button>
                          {isAdmin && bill.status === 'under_review' && (
                            <>
                              <button onClick={() => handleOpenActionModal(bill, 'approved')} className="btn btn-primary" style={{ padding: '6px 12px', fontSize: '0.78rem' }}>
                                <CheckCircle2 size={14} /> Утвердить
                              </button>
                              <button onClick={() => handleOpenActionModal(bill, 'needs_revision')} className="btn btn-secondary" style={{ padding: '6px 12px', fontSize: '0.78rem' }}>
                                <RotateCcw size={14} /> Правки
                              </button>
                              <button onClick={() => handleOpenActionModal(bill, 'rejected')} className="btn btn-danger" style={{ padding: '6px 12px', fontSize: '0.78rem' }}>
                                <XCircle size={14} /> Отклонить
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
                2-й Этап: Решение Федерального Правительства
              </h3>
            </div>
            <div className="modal-body">
              <p style={{ fontSize: '0.88rem', color: 'var(--text-secondary)', marginBottom: '18px', lineHeight: 1.5 }}>
                Вы выносите окончательное вердиктное решение по нормативному акту: <strong style={{ color: 'var(--text-primary)' }}>{selectedBillForAction.targetLaw}</strong>
              </p>

              <div style={{ marginBottom: '18px', padding: '16px', borderRadius: 'var(--radius-md)', border: `1px solid ${pendingDecision === 'approved' ? 'var(--success-border)' : pendingDecision === 'rejected' ? 'var(--danger-border)' : 'var(--warning-border)'}`, background: 'var(--bg-input)' }}>
                <div style={{ fontWeight: 800, fontFamily: 'var(--font-mono)', color: pendingDecision === 'approved' ? 'var(--success-text)' : pendingDecision === 'rejected' ? 'var(--danger-text)' : 'var(--warning-text)', marginBottom: '10px', display: 'flex', alignItems: 'center', gap: '8px', fontSize: '0.88rem' }}>
                  {pendingDecision === 'approved' ? <CheckCircle2 size={16}/> : pendingDecision === 'rejected' ? <XCircle size={16}/> : <RotateCcw size={16}/>}
                  ВЕРДИКТ: {pendingDecision === 'approved' ? 'УТВЕРДИТЬ И ВВЕСТИ В СИЛУ' : pendingDecision === 'rejected' ? 'ОТКЛОНИТЬ' : 'ОТПРАВИТЬ НА ДОРАБОТКУ'}
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
                Зафиксировать вердикт
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
};
