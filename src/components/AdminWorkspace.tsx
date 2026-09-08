import React, { useState, useMemo } from 'react';
import type { Bill, UserProfile, VoteDecision, FederalGovernmentVerdict } from '../types/bill';
import { isSystemAdmin } from '../services/securityService';
import { groupBillsByWeek } from '../utils/dateUtils';
import { useSessionState } from '../hooks/useSessionState';
import { 
  Eye, 
  CheckCircle2, 
  XCircle, 
  RotateCcw, 
  Lock, 
  Layers,
  Crown,
  FileCode2,
  Zap,
  FileText,
  Edit3,
  ChevronDown,
  X
} from 'lucide-react';
import { R, ft, shadow, mono, btnAccent, btnOutline, fieldLabel } from '../lib/ui';
import { ConfirmModal } from './ConfirmModal';

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
  onToast,
}) => {
  const isAdmin = isSystemAdmin(user);
  const isAuthorizedToAccess = isAdmin;

  const [selectedBillForAction, setSelectedBillForAction] = useState<Bill | null>(null);
  const [pendingDecision, setPendingDecision] = useState<VoteDecision | null>(null);
  const [adminNoteInput, setAdminNoteInput] = useState('');
  const [showConfirmEnactAll, setShowConfirmEnactAll] = useState(false);

  // Pack Accordeons
  const [expandedPacks, setExpandedPacks] = useSessionState<Record<string, boolean>>('admin_expanded_packs', {});

  const togglePack = (label: string) => {
    setExpandedPacks((prev) => ({ ...prev, [label]: !prev[label] }));
  };

  // STAGE 2 QUEUE FILTER:
  const adminQueueBills = useMemo(() => {
    return bills.filter((b) => {
      if (b.status === 'draft') return false;
      
      const votes = b.votes || {};
      const approveCount = [votes.prosecutor, votes.judge, votes.governor].filter((v) => v === 'approved').length;
      
      const isStage1Approved = approveCount >= 2;
      const isAlreadyProcessed = b.federalVerdict !== undefined || b.status === 'approved' || b.status === 'rejected';

      return isStage1Approved || isAlreadyProcessed;
    }).sort((a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime());
  }, [bills]);

  // Stage 2 approved bills waiting for Admin to enact into laws
  const pendingEnactmentBills = useMemo(() => {
    return bills.filter((b) => {
      return b.federalVerdict?.status === 'approved' && b.status !== 'approved';
    });
  }, [bills]);

  const handleEnactAllApprovedBills = async () => {
    setShowConfirmEnactAll(false);
    if (!isAdmin) {
      onToast('error', 'Только Администратор применяет поправки в законах.');
      return;
    }

    const billsToEnact = bills.filter((b) => b.federalVerdict?.status === 'approved' && b.status !== 'approved');
    
    if (billsToEnact.length === 0) {
      onToast('info', 'Нет одобренных проектов для внесения в законы.');
      return;
    }

    for (const b of billsToEnact) {
      const enactedBill: Bill = {
        ...b,
        status: 'approved',
        statusReason: 'Официально внесен в Законодательную Базу Штата.',
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
      adminName: `${user.firstName} ${user.lastName}`,
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
      status: pendingDecision === 'approved' ? 'under_review' : pendingDecision,
      statusReason: officialStatusReason,
      federalVerdict: verdict,
    };

    onSaveBill(updated);
    onToast(
      'success',
      `Вердикт вынесен: ${
        pendingDecision === 'approved'
          ? 'ОДОБРЕНО'
          : pendingDecision === 'rejected'
          ? 'ОТКЛОНЕНО'
          : 'НА ДОРАБОТКУ'
      }`
    );
    setSelectedBillForAction(null);
    setPendingDecision(null);
    setAdminNoteInput('');
  };

  const formatDecreeNumber = (billId: string) => {
    const numericId = billId.replace(/\D/g, '').slice(-4) || '0042';
    return `АКТ № SA-${numericId}`;
  };

  if (!isAuthorizedToAccess) {
    return (
      <div
        style={{
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          minHeight: '60vh',
          color: R.textMuted,
        }}
      >
        <Lock size={48} style={{ marginBottom: 16, opacity: 0.3, color: R.accent }} />
        <h2 style={{ fontSize: 20, fontWeight: 800, color: R.text, marginBottom: 8 }}>
          Доступ ограничен
        </h2>
        <p style={{ fontFamily: mono, fontSize: 13, color: R.textMuted }}>
          Раздел доступен только Администратору.
        </p>
      </div>
    );
  }

  return (
    <div style={{ maxWidth: 1200, margin: '0 auto', paddingBottom: 48 }}>
      {/* HEADER */}
      <div
        style={{
          display: 'flex',
          alignItems: 'flex-end',
          justifyContent: 'space-between',
          gap: 16,
          marginBottom: 28,
          flexWrap: 'wrap',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
          <div
            style={{
              width: 44,
              height: 44,
              background: R.accentSubtle,
              border: `1px solid ${R.accentBorder}`,
              color: R.accent,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              flexShrink: 0,
            }}
          >
            <Crown size={22} />
          </div>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 4 }}>
              <h2 style={{ fontSize: 24, fontWeight: 800, color: R.text, margin: 0 }}>
                Панель Администрации
              </h2>
              <span
                style={{
                  padding: '2px 8px',
                  background: R.bgSubtle,
                  border: ft.edge,
                  fontSize: 10,
                  fontFamily: mono,
                  fontWeight: 700,
                  color: R.accent,
                  textTransform: 'uppercase',
                  letterSpacing: '0.06em',
                }}
              >
                2-Й ЭТАП
              </span>
            </div>
            <p style={{ fontSize: 13, color: R.textMuted, margin: 0 }}>
              Рассмотрение законопроектов после Законодательной Комиссии
            </p>
          </div>
        </div>

        {/* ENACT BUTTON */}
        <button
          type="button"
          onClick={() => setShowConfirmEnactAll(true)}
          disabled={pendingEnactmentBills.length === 0}
          data-tooltip="Официально внести все утверждённые акты в законы"
          style={{
            ...btnAccent,
            display: 'flex',
            alignItems: 'center',
            gap: 8,
            opacity: pendingEnactmentBills.length === 0 ? 0.5 : 1,
            cursor: pendingEnactmentBills.length === 0 ? 'not-allowed' : 'pointer',
          }}
        >
          <Zap size={16} />
          <span>
            Внести в законы {pendingEnactmentBills.length > 0 ? `(${pendingEnactmentBills.length})` : '(0)'}
          </span>
        </button>
      </div>

      {/* BILLS LIST */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
        {adminQueueBills.length === 0 ? (
          <div
            style={{
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              justifyContent: 'center',
              padding: '60px 20px',
              textAlign: 'center',
              background: R.bgPanel,
              border: ft.strong,
            }}
          >
            <FileCode2 size={40} style={{ color: R.textMuted, marginBottom: 12, opacity: 0.4 }} />
            <p style={{ fontSize: 14, color: R.textMuted, margin: 0 }}>
              Нет законопроектов, ожидающих официального утверждения.
            </p>
          </div>
        ) : (
          (() => {
            const sortedGroups = groupBillsByWeek(adminQueueBills);

            return sortedGroups.map((group) => {
              const isExpanded = expandedPacks[group.label] || false;

              return (
                <div key={group.label} style={{ marginBottom: 12 }}>
                  {/* Pack Header */}
                  <div
                    onClick={() => togglePack(group.label)}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: 12,
                      padding: '12px 16px',
                      background: R.bgPanel,
                      border: ft.strong,
                      cursor: 'pointer',
                      userSelect: 'none',
                    }}
                  >
                    <div
                      style={{
                        width: 28,
                        height: 28,
                        background: R.bgSubtle,
                        border: ft.edge,
                        color: R.textMuted,
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        flexShrink: 0,
                      }}
                    >
                      <Layers size={14} />
                    </div>
                    <h4
                      style={{
                        flex: 1,
                        fontSize: 12,
                        fontFamily: mono,
                        fontWeight: 700,
                        color: R.text,
                        textTransform: 'uppercase',
                        letterSpacing: '0.06em',
                        margin: 0,
                      }}
                    >
                      {group.label}
                    </h4>
                    <span
                      style={{
                        fontSize: 11,
                        fontFamily: mono,
                        color: R.textMuted,
                        marginRight: 8,
                      }}
                    >
                      {group.bills.length} биллей
                    </span>
                    <ChevronDown
                      size={14}
                      style={{
                        color: R.textMuted,
                        transform: isExpanded ? 'rotate(180deg)' : 'rotate(0deg)',
                        transition: 'transform .15s',
                      }}
                    />
                  </div>

                  {/* Pack Bills */}
                  {isExpanded && (
                    <div
                      style={{
                        display: 'flex',
                        flexDirection: 'column',
                        gap: 8,
                        marginTop: 8,
                        paddingLeft: 16,
                        borderLeft: `2px solid ${R.border}`,
                      }}
                    >
                      {group.bills.map((bill) => {
                        const decreeStamp = formatDecreeNumber(bill.id);
                        const isEnacted =
                          bill.status === 'approved' &&
                          bill.statusReason?.includes('внесены в законодательную базу');
                        const isStage2ApprovedPendingEnactment =
                          bill.status === 'approved' && !isEnacted;

                        return (
                          <div
                            key={bill.id}
                            style={{
                              display: 'flex',
                              alignItems: 'center',
                              justifyContent: 'space-between',
                              padding: '14px 18px',
                              background: R.bgPanel,
                              border: ft.strong,
                              gap: 16,
                              flexWrap: 'wrap',
                            }}
                          >
                            <div style={{ flex: 1, minWidth: 260 }}>
                              <div
                                style={{
                                  display: 'flex',
                                  alignItems: 'center',
                                  gap: 8,
                                  marginBottom: 8,
                                  flexWrap: 'wrap',
                                }}
                              >
                                <span
                                  style={{
                                    padding: '2px 6px',
                                    background: R.bgSubtle,
                                    border: ft.edge,
                                    fontSize: 10,
                                    fontFamily: mono,
                                    fontWeight: 700,
                                    color: R.textMuted,
                                    textTransform: 'uppercase',
                                  }}
                                >
                                  {decreeStamp}
                                </span>
                                {bill.isTotalReform && (
                                  <span
                                    style={{
                                      padding: '2px 6px',
                                      background: 'rgba(217, 119, 6, 0.14)',
                                      border: '1px solid rgba(245, 158, 11, 0.4)',
                                      fontSize: 10,
                                      fontFamily: mono,
                                      fontWeight: 700,
                                      color: '#f59e0b',
                                      textTransform: 'uppercase',
                                      display: 'inline-flex',
                                      alignItems: 'center',
                                      gap: 3,
                                    }}
                                  >
                                    <Layers size={10} color="#f59e0b" />
                                    ОБЩАЯ РЕФОРМА
                                  </span>
                                )}
                                {isEnacted && (
                                  <span
                                    style={{
                                      padding: '2px 6px',
                                      background: 'rgba(34, 197, 94, 0.12)',
                                      border: '1px solid rgba(34, 197, 94, 0.25)',
                                      fontSize: 10,
                                      fontFamily: mono,
                                      fontWeight: 700,
                                      color: '#22c55e',
                                      textTransform: 'uppercase',
                                    }}
                                  >
                                    Внесено в законы
                                  </span>
                                )}
                                <span style={{ fontSize: 11, fontFamily: mono, color: R.textMuted }}>
                                  Обновлено: {new Date(bill.updatedAt).toLocaleDateString('ru-RU')}
                                </span>
                              </div>

                              <h4
                                style={{
                                  fontSize: 14,
                                  fontWeight: 800,
                                  color: R.text,
                                  margin: 0,
                                }}
                              >
                                {bill.targetLaw || bill.title}
                              </h4>
                            </div>

                            <div style={{ display: 'flex', alignItems: 'center', gap: 6, flexWrap: 'wrap' }}>
                              <button
                                type="button"
                                onClick={() => onSelectBill(bill)}
                                style={{
                                  ...btnOutline,
                                  display: 'flex',
                                  alignItems: 'center',
                                  gap: 6,
                                  padding: '6px 12px',
                                  fontSize: 12,
                                }}
                              >
                                <Eye size={13} /> Просмотр
                              </button>

                              {isStage2ApprovedPendingEnactment && (
                                <button
                                  type="button"
                                  onClick={async () => {
                                    const updated: Bill = {
                                      ...bill,
                                      status: 'approved',
                                      statusReason: 'Официально внесены в законодательную базу SA.',
                                      updatedAt: new Date().toISOString(),
                                    };
                                    await onSaveBill(updated);
                                    onToast('success', 'Закон внесен в базу');
                                  }}
                                  style={{
                                    ...btnAccent,
                                    display: 'flex',
                                    alignItems: 'center',
                                    gap: 6,
                                    padding: '6px 12px',
                                    fontSize: 12,
                                  }}
                                >
                                  <FileText size={13} /> Внести
                                </button>
                              )}

                              {!isEnacted && !isStage2ApprovedPendingEnactment && (
                                <>
                                  <button
                                    type="button"
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      handleOpenActionModal(bill, 'approved');
                                    }}
                                    style={{
                                      display: 'flex',
                                      alignItems: 'center',
                                      gap: 6,
                                      padding: '6px 10px',
                                      background: 'rgba(34, 197, 94, 0.1)',
                                      color: '#22c55e',
                                      border: '1px solid rgba(34, 197, 94, 0.25)',
                                      fontSize: 12,
                                      fontWeight: 600,
                                      cursor: 'pointer',
                                    }}
                                  >
                                    <CheckCircle2 size={13} /> Одобрить
                                  </button>

                                  <button
                                    type="button"
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      handleOpenActionModal(bill, 'needs_revision');
                                    }}
                                    style={{
                                      display: 'flex',
                                      alignItems: 'center',
                                      gap: 6,
                                      padding: '6px 10px',
                                      background: 'rgba(234, 179, 8, 0.1)',
                                      color: '#eab308',
                                      border: '1px solid rgba(234, 179, 8, 0.25)',
                                      fontSize: 12,
                                      fontWeight: 600,
                                      cursor: 'pointer',
                                    }}
                                  >
                                    <Edit3 size={13} /> Доработка
                                  </button>

                                  <button
                                    type="button"
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      handleOpenActionModal(bill, 'rejected');
                                    }}
                                    style={{
                                      display: 'flex',
                                      alignItems: 'center',
                                      gap: 6,
                                      padding: '6px 10px',
                                      background: 'rgba(239, 68, 68, 0.1)',
                                      color: '#ef4444',
                                      border: '1px solid rgba(239, 68, 68, 0.25)',
                                      fontSize: 12,
                                      fontWeight: 600,
                                      cursor: 'pointer',
                                    }}
                                  >
                                    <XCircle size={13} /> Отклонить
                                  </button>
                                </>
                              )}
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  )}
                </div>
              );
            });
          })()
        )}
      </div>

      {/* VERDICT MODAL */}
      {selectedBillForAction && pendingDecision && (
        <div
          onClick={() => setSelectedBillForAction(null)}
          style={{
            position: 'fixed',
            inset: 0,
            background: 'rgba(20, 18, 17, 0.65)',
            backdropFilter: 'blur(3px)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            padding: 16,
            zIndex: 100,
            animation: 'rtFade .12s ease',
          }}
        >
          <div
            onClick={(e) => e.stopPropagation()}
            style={{
              width: 520,
              maxWidth: '100%',
              background: R.bgPanel,
              border: ft.strong,
              boxShadow: shadow.panel,
              animation: 'rtIn .18s ease',
            }}
          >
            <header
              style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                padding: '14px 18px',
                borderBottom: ft.strong,
                background: R.bgPanel,
              }}
            >
              <h3 style={{ fontSize: 16, fontWeight: 800, color: R.text, display: 'flex', alignItems: 'center', gap: 8, margin: 0 }}>
                <Crown size={18} style={{ color: R.accent }} /> Вердикт Администрации
              </h3>
              <button
                type="button"
                onClick={() => setSelectedBillForAction(null)}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  width: 26,
                  height: 26,
                  color: R.textMuted,
                  background: 'transparent',
                  border: 'none',
                  cursor: 'pointer',
                }}
              >
                <X size={16} />
              </button>
            </header>

            <div style={{ padding: 18, display: 'flex', flexDirection: 'column', gap: 16 }}>
              <div>
                <label style={fieldLabel}>Законопроект</label>
                <div
                  style={{
                    padding: '10px 14px',
                    background: R.bgInput,
                    border: ft.edge,
                    fontSize: 13,
                    color: R.text,
                    fontWeight: 600,
                  }}
                >
                  {selectedBillForAction.targetLaw || selectedBillForAction.title}
                </div>
              </div>

              <div
                style={{
                  background: R.bgSubtle,
                  border: ft.edge,
                  padding: 14,
                  display: 'flex',
                  flexDirection: 'column',
                  gap: 12,
                }}
              >
                <div
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: 8,
                    fontSize: 12,
                    fontFamily: mono,
                    fontWeight: 700,
                    textTransform: 'uppercase',
                    color:
                      pendingDecision === 'approved'
                        ? '#22c55e'
                        : pendingDecision === 'rejected'
                        ? '#ef4444'
                        : '#eab308',
                  }}
                >
                  {pendingDecision === 'approved' ? (
                    <CheckCircle2 size={16} />
                  ) : pendingDecision === 'rejected' ? (
                    <XCircle size={16} />
                  ) : (
                    <RotateCcw size={16} />
                  )}
                  РЕШЕНИЕ: {pendingDecision === 'approved' ? 'ОДОБРИТЬ' : pendingDecision === 'rejected' ? 'ОТКЛОНИТЬ' : 'НА ДОРАБОТКУ'}
                </div>

                <div>
                  <label style={fieldLabel}>
                    Обоснование {pendingDecision !== 'approved' && <span style={{ color: '#ef4444' }}>*</span>}
                  </label>
                  <textarea
                    style={{
                      width: '100%',
                      background: R.bgInput,
                      border: ft.edge,
                      padding: '10px 12px',
                      fontSize: 13,
                      color: R.text,
                      outline: 'none',
                      minHeight: 90,
                      resize: 'vertical',
                      fontFamily: 'inherit',
                    }}
                    placeholder="Официальное заключение Администрации..."
                    value={adminNoteInput}
                    onChange={(e) => setAdminNoteInput(e.target.value)}
                    onFocus={(e) => (e.currentTarget.style.borderColor = R.accent)}
                    onBlur={(e) => (e.currentTarget.style.borderColor = R.border)}
                  />
                </div>
              </div>
            </div>

            <footer
              style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'flex-end',
                gap: 10,
                padding: '12px 18px',
                borderTop: ft.strong,
                background: R.bgPanel,
              }}
            >
              <button
                type="button"
                onClick={() => setSelectedBillForAction(null)}
                style={btnOutline}
              >
                Отмена
              </button>
              <button
                type="button"
                onClick={handleExecuteAdminVerdict}
                disabled={pendingDecision !== 'approved' && !adminNoteInput.trim()}
                style={{
                  ...btnAccent,
                  opacity: pendingDecision !== 'approved' && !adminNoteInput.trim() ? 0.5 : 1,
                  cursor:
                    pendingDecision !== 'approved' && !adminNoteInput.trim()
                      ? 'not-allowed'
                      : 'pointer',
                }}
              >
                Вынести решение
              </button>
            </footer>
          </div>
        </div>
      )}

      {showConfirmEnactAll && (
        <ConfirmModal
          title="Внести одобренные акты в законы?"
          message={`Вы собираетесь официально внести в законодательную базу Штата San Andreas одобренных проектов: ${pendingEnactmentBills.length}. Акты получат статус 'Вступил в силу' и будут применены в реестре.`}
          confirmLabel="Внести в законы"
          isDanger={false}
          onConfirm={handleEnactAllApprovedBills}
          onCancel={() => setShowConfirmEnactAll(false)}
        />
      )}
    </div>
  );
};
