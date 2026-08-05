import React, { useState, useMemo } from 'react';
import type { Bill, UserProfile, VoteDecision, FederalGovernmentVerdict } from '../types/bill';
import { OFFICIAL_ROLE_LABELS } from '../types/bill';
import { isSystemAdmin, isOfficialCommitteeMember } from '../services/securityService';
import { 
  ShieldCheck, 
  Eye, 
  CheckCircle2, 
  XCircle, 
  RotateCcw, 
  Calendar, 
  User as UserIcon, 
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

  // Bills in 2nd stage review
  const adminQueueBills = useMemo(() => {
    return bills.filter((b) => b.status === 'under_review' || b.status === 'approved' || b.status === 'needs_revision' || b.status === 'rejected');
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
        ? 'Специальной законодательной комиссией законопроект был ОДОБРЕН, однако на 2-м этапе проверки Федеральным Правительством данный законопроект был ОТКЛОНЕН.'
        : 'Отклонено на 2-м этапе проверки Федеральным Правительством.';
    } else if (pendingDecision === 'needs_revision') {
      officialStatusReason = commissionApproved
        ? 'Специальной законодательной комиссией законопроект был ОДОБРЕН, однако Федеральным Правительством отправлен НА ДОРАБОТКУ.'
        : 'Отправлено на доработку Федеральным Правительством.';
    } else {
      officialStatusReason = 'Законопроект прошел оба этапа: Одобрен Законодательной Комиссией и официально утвержден Федеральным Правительством.';
    }

    const updated: Bill = {
      ...selectedBillForAction,
      status: pendingDecision,
      statusReason: officialStatusReason,
      federalVerdict: verdict
    };

    onSaveBill(updated);
    onToast('success', `Решение 2-го этапа записано: ${pendingDecision === 'approved' ? 'ОДОБРЕНО' : pendingDecision === 'rejected' ? 'ОТКЛОНЕНО' : 'НА ДОРАБОТКУ'}`);
    setSelectedBillForAction(null);
    setPendingDecision(null);
    setAdminNoteInput('');
  };

  if (!isAuthorizedToAccess) {
    return (
      <div style={{ maxWidth: '800px', margin: '60px auto', padding: '0 24px' }}>
        <div className="card-dark" style={{ padding: '48px 24px', textAlign: 'center' }}>
          <Lock size={42} color="var(--text-tertiary)" style={{ opacity: 0.5, marginBottom: '16px' }} />
          <h3 style={{ fontSize: '1.2rem', fontWeight: 600, color: 'var(--text-primary)', marginBottom: '8px' }}>
            Доступ в Кабинет Администрации ограничен
          </h3>
          <p style={{ fontSize: '0.88rem', color: 'var(--text-tertiary)', maxWidth: '500px', margin: '0 auto 20px auto', lineHeight: 1.6 }}>
            Рабочая среда 2-го этапа поверки предназначена исключительно для Системного Администратора (Федеральное Правительство) и Законодательной Комиссии (Прокурор, Судья, Губернатор).
          </p>
        </div>
      </div>
    );
  }

  return (
    <div style={{ maxWidth: '1240px', margin: '0 auto', padding: '0 24px 60px 24px' }}>
      
      {/* Workspace Header Banner */}
      <div 
        className="card-dark" 
        style={{ 
          padding: '24px 28px', 
          marginBottom: '28px', 
          background: 'linear-gradient(135deg, rgba(30, 41, 59, 0.6), rgba(15, 23, 42, 0.9))',
          border: '1px solid var(--border-medium)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          flexWrap: 'wrap',
          gap: '16px'
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
          <div style={{ width: '48px', height: '48px', borderRadius: '12px', background: 'rgba(248, 250, 252, 0.1)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <ShieldCheck size={26} color="#f8fafc" />
          </div>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <h2 style={{ fontSize: '1.25rem', fontWeight: 700, color: '#f8fafc' }}>
                Кабинет Администрации — Федеральное Правительство (2-й этап)
              </h2>
              <span style={{ fontSize: '0.75rem', background: isAdmin ? 'rgba(52, 211, 153, 0.2)' : 'rgba(148, 163, 184, 0.2)', color: isAdmin ? '#34d399' : '#cbd5e1', padding: '2px 8px', borderRadius: '4px', border: '1px solid var(--border-subtle)' }}>
                {isAdmin ? '👑 Федеральное Правительство (Модерация)' : '👁️ Комиссия (Наблюдение Read-Only)'}
              </span>
            </div>
            <p style={{ fontSize: '0.82rem', color: '#94a3b8', marginTop: '2px' }}>
              {isAdmin 
                ? 'Вы выносите вердикт 2-го этапа от лица Федерального Правительства.'
                : `Вы вошли как ${OFFICIAL_ROLE_LABELS[user.officialRole]}. Вам доступен режим чтения решений 2-го этапа.`
              }
            </p>
          </div>
        </div>
      </div>

      {/* Queue List */}
      <h3 style={{ fontSize: '1.05rem', fontWeight: 600, color: 'var(--text-primary)', marginBottom: '16px' }}>
        Законопроекты на модерации 2-го этапа ({adminQueueBills.length})
      </h3>

      {adminQueueBills.length === 0 ? (
        <div className="card-dark" style={{ padding: '48px 20px', textAlign: 'center', color: 'var(--text-tertiary)' }}>
          <Layers size={36} color="var(--text-tertiary)" style={{ opacity: 0.5, marginBottom: '12px' }} />
          <h4 style={{ fontSize: '1rem', color: 'var(--text-primary)', marginBottom: '4px' }}>
            Очередь 2-го этапа пуста
          </h4>
          <p style={{ fontSize: '0.85rem' }}>
            Новые законопроекты появятся здесь после прохождения голосования Комиссии.
          </p>
        </div>
      ) : (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(360px, 1fr))', gap: '16px' }}>
          {adminQueueBills.map((bill) => {
            const voteCount = bill.votes ? Object.keys(bill.votes).length : 0;
            return (
              <div key={bill.id} className="card-dark" style={{ padding: '20px', display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}>
                <div>
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '10px' }}>
                    <span className={`badge-status badge-${bill.status}`}>
                      {bill.status === 'approved' && <CheckCircle2 size={13} />}
                      {bill.status === 'rejected' && <XCircle size={13} />}
                      {bill.status === 'needs_revision' && <RotateCcw size={13} />}
                      {bill.status === 'under_review' && <ShieldCheck size={13} />}
                      {bill.status === 'approved' ? 'Утвержден Правительством' : bill.status === 'rejected' ? 'Отклонен Правительством' : bill.status === 'needs_revision' ? 'На доработке' : 'На проверке 2 этапа'}
                    </span>
                    <span style={{ fontSize: '0.75rem', color: 'var(--text-tertiary)', fontFamily: 'var(--font-mono)' }}>
                      {bill.lawCode || 'БЕЗ НОМЕРА'}
                    </span>
                  </div>

                  <div style={{ fontSize: '0.78rem', color: 'var(--text-secondary)', marginBottom: '6px' }}>
                    Законодательная Комиссия: <strong>{voteCount}/3 голосов</strong>
                  </div>

                  <h3 
                    onClick={() => onSelectBill(bill)}
                    style={{ fontSize: '1.02rem', fontWeight: 600, color: 'var(--text-primary)', lineHeight: 1.4, marginBottom: '10px', cursor: 'pointer' }}
                  >
                    {bill.title}
                  </h3>

                  {bill.statusReason && (
                    <div style={{ fontSize: '0.78rem', color: 'var(--text-tertiary)', background: 'var(--bg-input)', padding: '6px 10px', borderRadius: '6px', marginBottom: '14px' }}>
                      {bill.statusReason}
                    </div>
                  )}
                </div>

                <div>
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', fontSize: '0.78rem', color: 'var(--text-tertiary)', paddingTop: '10px', borderTop: '1px solid var(--border-subtle)', marginBottom: '12px' }}>
                    <span style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                      <UserIcon size={12} /> {bill.author}
                    </span>
                    <span style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                      <Calendar size={12} /> {new Date(bill.updatedAt).toLocaleDateString('ru-RU')}
                    </span>
                  </div>

                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <button 
                      onClick={() => onSelectBill(bill)} 
                      className="btn btn-secondary" 
                      style={{ flex: 1, fontSize: '0.82rem', padding: '6px 10px' }}
                    >
                      <Eye size={14} /> Просмотр
                    </button>

                    {isAdmin && (
                      <div style={{ display: 'flex', gap: '4px' }}>
                        <button onClick={() => handleOpenActionModal(bill, 'approved')} className="btn btn-primary" style={{ padding: '6px 8px', fontSize: '0.75rem' }}>
                          Одобрить
                        </button>
                        <button onClick={() => handleOpenActionModal(bill, 'needs_revision')} className="btn btn-secondary" style={{ padding: '6px 8px', fontSize: '0.75rem' }}>
                          Доработка
                        </button>
                        <button onClick={() => handleOpenActionModal(bill, 'rejected')} className="btn btn-danger" style={{ padding: '6px 8px', fontSize: '0.75rem' }}>
                          Отказ
                        </button>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Mandatory Reason Modal */}
      {selectedBillForAction && pendingDecision && isAdmin && (
        <div className="modal-overlay" onClick={() => setSelectedBillForAction(null)} style={{ zIndex: 7000 }}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()} style={{ maxWidth: '540px', padding: '24px' }}>
            <h3 style={{ fontSize: '1.1rem', fontWeight: 600, color: 'var(--text-primary)', marginBottom: '12px' }}>
              Мотивированное обоснование Федерального Правительства
            </h3>

            <p style={{ fontSize: '0.84rem', color: 'var(--text-secondary)', marginBottom: '14px', lineHeight: 1.5 }}>
              Проект: <strong>{selectedBillForAction.title}</strong><br />
              Вердикт: <strong style={{ color: pendingDecision === 'approved' ? '#4ade80' : pendingDecision === 'rejected' ? '#f87171' : '#93c5fd' }}>{pendingDecision === 'approved' ? 'ОДОБРИТЬ' : pendingDecision === 'rejected' ? 'ОТКЛОНИТЬ' : 'НА ДОРАБОТКУ'}</strong>
            </p>

            <div style={{ marginBottom: '16px' }}>
              <label style={{ fontSize: '0.82rem', color: 'var(--text-tertiary)', display: 'block', marginBottom: '4px' }}>
                Обязательное мотивированное обоснование (Видно Комиссии и Администрации):
              </label>
              <textarea
                className="textarea-field"
                rows={4}
                placeholder="Введите текст мотивированного вердикта..."
                value={adminNoteInput}
                onChange={(e) => setAdminNoteInput(e.target.value)}
              />
            </div>

            <div style={{ display: 'flex', gap: '8px', justifyContent: 'flex-end' }}>
              <button onClick={() => setSelectedBillForAction(null)} className="btn btn-secondary">
                Отмена
              </button>
              <button onClick={handleExecuteAdminVerdict} className="btn btn-primary">
                Подтвердить и вынести вердикт
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
