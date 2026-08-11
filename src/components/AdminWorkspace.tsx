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
  Layers
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
    const votes = selectedBillForAction.votes || {};
    const commissionApproved = (votes.prosecutor === 'approved' && votes.judge === 'approved') ||
                               (votes.prosecutor === 'approved' && votes.governor === 'approved') ||
                               (votes.judge === 'approved' && votes.governor === 'approved');

    if (pendingDecision === 'rejected') {
      officialStatusReason = commissionApproved
        ? 'Комиссией ОДОБРЕН, но Федеральным Правительством ОТКЛОНЕН.'
        : 'Отклонено Федеральным Правительством.';
    } else if (pendingDecision === 'needs_revision') {
      officialStatusReason = commissionApproved
        ? 'Комиссией ОДОБРЕН, но отправлен НА ДОРАБОТКУ.'
        : 'Отправлено на доработку Федеральным Правительством.';
    } else {
      officialStatusReason = 'Официально утвержден Федеральным Правительством.';
    }

    const updated: Bill = {
      ...selectedBillForAction,
      status: pendingDecision,
      statusReason: officialStatusReason,
      federalVerdict: verdict
    };

    onSaveBill(updated);
    onToast('success', `Решение записано`);
    setSelectedBillForAction(null);
    setPendingDecision(null);
    setAdminNoteInput('');
  };

  if (!isAuthorizedToAccess) {
    return (
      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', minHeight: '60vh', color: 'var(--text-muted)' }}>
        <Lock size={64} style={{ marginBottom: '24px', opacity: 0.2 }} />
        <h2 style={{ fontSize: '1.5rem', fontWeight: 600, color: 'var(--text-primary)', marginBottom: '8px' }}>Доступ закрыт</h2>
        <p>Этот раздел предназначен только для Правительства.</p>
      </div>
    );
  }

  return (
    <div style={{ maxWidth: '1240px', margin: '0 auto', padding: '0 24px 60px' }}>
      
      <div style={{ display: 'flex', alignItems: 'center', gap: '16px', marginBottom: '32px' }}>
        <div style={{ width: '48px', height: '48px', borderRadius: '12px', background: 'var(--primary-subtle)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <ShieldCheck size={24} color="var(--primary)" />
        </div>
        <div>
          <h2 style={{ margin: 0, fontSize: '1.5rem', fontWeight: 600, color: 'var(--text-primary)' }}>Административная панель</h2>
          <p style={{ margin: 0, fontSize: '0.85rem', color: 'var(--text-muted)', marginTop: '4px' }}>Управление реестром и вердикты Федерального Правительства</p>
        </div>
      </div>

      <div className="card" style={{ padding: '0', overflow: 'hidden' }}>
        <div style={{ padding: '20px 24px', borderBottom: '1px solid var(--border-subtle)', display: 'flex', alignItems: 'center', gap: '12px' }}>
          <Layers size={18} color="var(--primary)" />
          <h3 style={{ margin: 0, fontSize: '1rem', fontWeight: 600, color: 'var(--text-primary)' }}>Очередь законопроектов</h3>
        </div>

        {adminQueueBills.length === 0 ? (
          <div style={{ padding: '60px 20px', textAlign: 'center', color: 'var(--text-muted)' }}>
            <p>Нет законопроектов, ожидающих решения.</p>
          </div>
        ) : (
          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: '0.85rem' }}>
              <thead>
                <tr style={{ background: 'var(--bg-input)', color: 'var(--text-secondary)', borderBottom: '1px solid var(--border-medium)' }}>
                  <th style={{ padding: '16px 24px', fontWeight: 500, textTransform: 'uppercase', letterSpacing: '0.05em' }}>Закон</th>
                  <th style={{ padding: '16px 24px', fontWeight: 500, textTransform: 'uppercase', letterSpacing: '0.05em' }}>Статус</th>
                  <th style={{ padding: '16px 24px', fontWeight: 500, textTransform: 'uppercase', letterSpacing: '0.05em' }}>Инициатор</th>
                  <th style={{ padding: '16px 24px', fontWeight: 500, textTransform: 'uppercase', letterSpacing: '0.05em', textAlign: 'right' }}>Действия (Фед.Прав.)</th>
                </tr>
              </thead>
              <tbody>
                {adminQueueBills.map((bill) => (
                  <tr key={bill.id} style={{ borderBottom: '1px solid var(--border-subtle)', transition: 'background 0.2s', cursor: 'default' }} className="table-row-hover">
                    <td style={{ padding: '16px 24px', fontWeight: 500, color: 'var(--text-primary)' }}>
                      {bill.targetLaw || bill.title}
                    </td>
                    <td style={{ padding: '16px 24px' }}>
                      <span className={`badge badge-status-${bill.status === 'under_review' ? 'review' : bill.status === 'approved' ? 'approved' : bill.status === 'needs_revision' ? 'revision' : 'rejected'}`}>
                        {bill.status === 'under_review' ? 'На рассмотрении' : bill.status === 'approved' ? 'Одобрен' : bill.status === 'needs_revision' ? 'Доработка' : 'Отклонен'}
                      </span>
                    </td>
                    <td style={{ padding: '16px 24px', color: 'var(--text-secondary)' }}>
                      {bill.author}
                    </td>
                    <td style={{ padding: '16px 24px', textAlign: 'right' }}>
                      <div style={{ display: 'inline-flex', gap: '8px' }}>
                        <button onClick={() => onSelectBill(bill)} className="btn btn-secondary" style={{ padding: '6px 10px' }} title="Просмотр">
                          <Eye size={14} />
                        </button>
                        {isAdmin && bill.status === 'under_review' && (
                          <>
                            <button onClick={() => handleOpenActionModal(bill, 'approved')} className="btn" style={{ background: 'rgba(16, 185, 129, 0.1)', color: 'var(--success)', border: '1px solid rgba(16, 185, 129, 0.2)', padding: '6px 10px' }}>
                              <CheckCircle2 size={14} /> Утвердить
                            </button>
                            <button onClick={() => handleOpenActionModal(bill, 'needs_revision')} className="btn" style={{ background: 'rgba(245, 158, 11, 0.1)', color: 'var(--warning)', border: '1px solid rgba(245, 158, 11, 0.2)', padding: '6px 10px' }}>
                              <RotateCcw size={14} /> На доработку
                            </button>
                            <button onClick={() => handleOpenActionModal(bill, 'rejected')} className="btn" style={{ background: 'rgba(239, 68, 68, 0.1)', color: 'var(--danger)', border: '1px solid rgba(239, 68, 68, 0.2)', padding: '6px 10px' }}>
                              <XCircle size={14} /> Отклонить
                            </button>
                          </>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Federal Verdict Modal */}
      {selectedBillForAction && pendingDecision && (
        <div className="modal-overlay">
          <div className="modal-content">
            <div className="modal-header">
              <h3 style={{ margin: 0, fontSize: '1.1rem', color: 'var(--text-primary)', display: 'flex', alignItems: 'center', gap: '8px' }}>
                <ShieldCheck size={18} color="var(--primary)" /> 
                Вердикт Федерального Правительства
              </h3>
            </div>
            <div className="modal-body">
              <p style={{ fontSize: '0.9rem', color: 'var(--text-secondary)', marginBottom: '20px' }}>
                Вы выносите вердикт 2-го этапа по законопроекту: <strong style={{ color: 'var(--text-primary)' }}>{selectedBillForAction.targetLaw}</strong>
              </p>

              <div style={{ marginBottom: '20px', padding: '16px', borderRadius: 'var(--radius-sm)', border: `1px solid ${pendingDecision === 'approved' ? 'var(--success)' : pendingDecision === 'rejected' ? 'var(--danger)' : 'var(--warning)'}`, background: 'var(--bg-input)' }}>
                <div style={{ fontWeight: 600, color: pendingDecision === 'approved' ? 'var(--success)' : pendingDecision === 'rejected' ? 'var(--danger)' : 'var(--warning)', marginBottom: '8px', display: 'flex', alignItems: 'center', gap: '6px' }}>
                  {pendingDecision === 'approved' ? <CheckCircle2 size={16}/> : pendingDecision === 'rejected' ? <XCircle size={16}/> : <RotateCcw size={16}/>}
                  РЕШЕНИЕ: {pendingDecision === 'approved' ? 'ОДОБРИТЬ' : pendingDecision === 'rejected' ? 'ОТКЛОНИТЬ' : 'ОТПРАВИТЬ НА ДОРАБОТКУ'}
                </div>
                <label className="input-label" style={{ marginTop: '16px' }}>Обоснование вердикта {pendingDecision !== 'approved' && '(обязательно)'}</label>
                <textarea
                  className="input-field"
                  style={{ width: '100%', minHeight: '100px', resize: 'vertical' }}
                  placeholder="Введите обоснование решения для автора..."
                  value={adminNoteInput}
                  onChange={(e) => setAdminNoteInput(e.target.value)}
                />
              </div>
            </div>
            <div className="modal-footer">
              <button className="btn btn-secondary" onClick={() => setSelectedBillForAction(null)}>Отмена</button>
              <button 
                className="btn btn-primary" 
                onClick={handleExecuteAdminVerdict}
                disabled={(pendingDecision !== 'approved' && !adminNoteInput.trim())}
              >
                Подтвердить вердикт
              </button>
            </div>
          </div>
        </div>
      )}

      <style>{`
        .table-row-hover:hover {
          background: var(--bg-hover) !important;
        }
      `}</style>
    </div>
  );
};
