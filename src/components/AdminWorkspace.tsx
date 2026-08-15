import React, { useState, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import type { Bill, UserProfile, VoteDecision, FederalGovernmentVerdict } from '../types/bill';
import { isSystemAdmin } from '../services/securityService';
import { cn } from '../utils/cn';
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
    }).sort((a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime());
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
      onToast('info', 'Нет одобренных проектов для внесения в законы.');
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
      status: pendingDecision === 'approved' ? 'under_review' : pendingDecision,
      statusReason: officialStatusReason,
      federalVerdict: verdict
    };

    onSaveBill(updated);
    onToast('success', `Вердикт вынесен: ${pendingDecision === 'approved' ? 'ОДОБРЕНО' : pendingDecision === 'rejected' ? 'ОТКЛОНЕНО' : 'НА ДОРАБОТКУ'}`);
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
      <div className="flex flex-col items-center justify-center min-h-[60vh] text-zinc-500">
        <Lock size={48} className="mb-4 opacity-20 text-indigo-400" />
        <h2 className="text-xl font-bold text-white mb-2">Доступ ограничен</h2>
        <p className="font-mono text-sm">Раздел доступен только Администратору.</p>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto space-y-8 pb-12 animate-in fade-in duration-500">
      
      {/* HEADER */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-6">
        <div className="flex items-center gap-4">
          <div className="w-12 h-12 rounded-2xl bg-amber-500/10 border border-amber-500/20 text-amber-400 flex items-center justify-center shrink-0 shadow-[0_0_15px_rgba(245,158,11,0.2)]">
            <Crown size={24} />
          </div>
          <div>
            <div className="flex items-center gap-3 mb-1">
              <h2 className="text-3xl font-extrabold tracking-tight text-white">
                Панель Администрации
              </h2>
              <span className="px-2 py-0.5 rounded-md bg-amber-500/10 border border-amber-500/20 text-[10px] font-mono font-bold text-amber-400 uppercase tracking-wider">
                2-Й ЭТАП
              </span>
            </div>
            <p className="text-sm text-zinc-400 font-medium">
              Рассмотрение законопроектов после Законодательной Комиссии
            </p>
          </div>
        </div>

        {/* ENACT BUTTON */}
        <button 
          onClick={handleEnactAllApprovedBills}
          disabled={pendingEnactmentBills.length === 0}
          className={cn(
            "flex items-center gap-2 px-5 py-3 text-sm font-extrabold rounded-xl transition-all shadow-lg",
            pendingEnactmentBills.length > 0
              ? "bg-emerald-600 hover:bg-emerald-500 text-white shadow-emerald-500/20 border border-emerald-400/30 active:scale-95"
              : "bg-white/[0.04] text-zinc-500 border border-white/10 cursor-not-allowed shadow-none"
          )}
        >
          <Zap size={18} /> 
          Внести в законы {pendingEnactmentBills.length > 0 ? `(${pendingEnactmentBills.length})` : '(0)'}
        </button>
      </div>

      {/* QUEUE TABLE CARD */}
      <div className="bg-white/[0.02] backdrop-blur-xl border border-white/10 rounded-2xl shadow-2xl shadow-black/50 overflow-hidden">
        <div className="px-6 py-4 border-b border-white/10 bg-black/40 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Layers size={18} className="text-indigo-400" />
            <h3 className="text-base font-bold text-white">
              Очередь на рассмотрение
            </h3>
          </div>
          <span className="text-xs font-mono font-bold text-zinc-500 uppercase tracking-wider">
            В очереди: {adminQueueBills.length}
          </span>
        </div>

        {adminQueueBills.length === 0 ? (
          <div className="py-20 px-6 text-center flex flex-col items-center">
            <FileCode2 size={48} className="text-zinc-600 mb-4 opacity-50" />
            <p className="text-zinc-400 text-sm font-medium">
              Нет законопроектов, ожидающих вердикта Администрации.
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-black/60 border-b border-white/10 text-[10px] font-mono font-bold text-zinc-500 uppercase tracking-wider">
                  <th className="px-6 py-4">Номер / Закон</th>
                  <th className="px-6 py-4">Статус</th>
                  <th className="px-6 py-4">Комиссия</th>
                  <th className="px-6 py-4">Автор</th>
                  <th className="px-6 py-4 text-right">Действия</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/5">
                {adminQueueBills.map((bill) => {
                  const votes = bill.votes || {};
                  const approveCount = [votes.prosecutor, votes.judge, votes.governor].filter((v) => v === 'approved').length;
                  const rejectCount = [votes.prosecutor, votes.judge, votes.governor].filter((v) => v === 'rejected').length;
                  
                  const isEnacted = bill.status === 'approved';
                  const isStage2ApprovedPendingEnactment = bill.federalVerdict?.status === 'approved' && !isEnacted;

                  return (
                    <tr key={bill.id} className="hover:bg-white/[0.04] transition-colors">
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-3">
                          <span className="px-2 py-0.5 rounded bg-indigo-500/10 border border-indigo-500/20 text-[10px] font-mono font-bold text-indigo-400">
                            {formatDecreeNumber(bill.id)}
                          </span>
                          <span className="font-bold text-sm text-white truncate max-w-[200px] xl:max-w-xs">
                            {bill.targetLaw || bill.title}
                          </span>
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        {isEnacted ? (
                          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-emerald-500/10 border border-emerald-500/20 text-[10px] font-extrabold uppercase tracking-wider text-emerald-400">
                            <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 shadow-[0_0_8px_rgba(52,211,153,0.8)]" /> Вступил в силу
                          </span>
                        ) : isStage2ApprovedPendingEnactment ? (
                          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-emerald-500/20 border border-emerald-500/30 text-[10px] font-extrabold uppercase tracking-wider text-emerald-300">
                            <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 shadow-[0_0_8px_rgba(52,211,153,0.8)] animate-pulse" /> Одобрен 2-м этапом
                          </span>
                        ) : bill.status === 'rejected' ? (
                          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-rose-500/10 border border-rose-500/20 text-[10px] font-extrabold uppercase tracking-wider text-rose-400">
                            <span className="w-1.5 h-1.5 rounded-full bg-rose-500 shadow-[0_0_8px_rgba(244,63,94,0.8)]" /> Отклонен
                          </span>
                        ) : bill.status === 'needs_revision' ? (
                          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-amber-500/10 border border-amber-500/20 text-[10px] font-extrabold uppercase tracking-wider text-amber-400">
                            <span className="w-1.5 h-1.5 rounded-full bg-amber-400 shadow-[0_0_8px_rgba(251,191,36,0.8)] animate-pulse" /> Доработка
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-blue-500/10 border border-blue-500/20 text-[10px] font-extrabold uppercase tracking-wider text-blue-400">
                            <span className="w-1.5 h-1.5 rounded-full bg-blue-400 shadow-[0_0_8px_rgba(96,165,250,0.8)] animate-pulse" /> Ожидает 2-го этапа
                          </span>
                        )}
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-2 text-xs font-mono font-bold text-emerald-400">
                          <Vote size={14} className="text-emerald-500" />
                          {approveCount} За / {rejectCount} Против
                        </div>
                      </td>
                      <td className="px-6 py-4 text-xs font-mono text-zinc-400 truncate max-w-[150px]">
                        {bill.author}
                      </td>
                      <td className="px-6 py-4 text-right">
                        <div className="flex items-center justify-end gap-2">
                          <button 
                            onClick={() => onSelectBill(bill)} 
                            className="p-2 rounded-xl bg-white/[0.04] hover:bg-white/[0.08] text-zinc-300 border border-white/10 transition-colors"
                            title="Просмотр"
                          >
                            <Eye size={16} />
                          </button>

                          {isEnacted && (
                            <span className="flex items-center gap-1 text-[10px] font-mono font-bold text-emerald-400 uppercase tracking-wider px-2">
                              <CheckCircle2 size={14} /> Внесен
                            </span>
                          )}

                          {isStage2ApprovedPendingEnactment && (
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
                              className="flex items-center gap-1.5 px-3 py-1.5 bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-bold rounded-xl transition-all border border-indigo-400/30"
                            >
                              <FileText size={14} /> Внести
                            </button>
                          )}

                          {!isEnacted && !isStage2ApprovedPendingEnactment && (
                            <>
                              <button 
                                onClick={() => handleOpenActionModal(bill, 'approved')} 
                                className="flex items-center gap-1.5 px-3 py-1.5 bg-emerald-600/20 hover:bg-emerald-600/40 text-emerald-400 border border-emerald-500/30 rounded-xl text-xs font-bold transition-colors"
                              >
                                <CheckCircle2 size={14} /> Одобрить
                              </button>

                              <button 
                                onClick={() => handleOpenActionModal(bill, 'needs_revision')} 
                                className="p-2 rounded-xl bg-amber-500/10 hover:bg-amber-500/20 text-amber-400 border border-amber-500/20 transition-colors"
                                title="На доработку"
                              >
                                <RotateCcw size={16} />
                              </button>

                              <button 
                                onClick={() => handleOpenActionModal(bill, 'rejected')} 
                                className="p-2 rounded-xl bg-rose-500/10 hover:bg-rose-500/20 text-rose-400 border border-rose-500/20 transition-colors"
                                title="Отклонить"
                              >
                                <XCircle size={16} />
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
      <AnimatePresence>
        {selectedBillForAction && pendingDecision && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="absolute inset-0 bg-black/80 backdrop-blur-sm"
              onClick={() => setSelectedBillForAction(null)}
            />
            <motion.div 
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              className="relative w-full max-w-lg bg-[#0C0D12] border border-white/10 rounded-2xl shadow-2xl overflow-hidden flex flex-col"
            >
              <div className="p-5 border-b border-white/10 bg-white/[0.02]">
                <h3 className="text-lg font-bold text-white flex items-center gap-2">
                  <Crown size={20} className="text-amber-400" />
                  Вердикт Администрации
                </h3>
              </div>
              
              <div className="p-6 flex flex-col gap-5">
                <div>
                  <span className="text-[10px] font-mono font-bold text-zinc-500 uppercase tracking-wider block mb-1">
                    Законопроект
                  </span>
                  <div className="text-sm text-white font-medium bg-black/40 border border-white/10 rounded-xl px-4 py-3">
                    {selectedBillForAction.targetLaw || selectedBillForAction.title}
                  </div>
                </div>

                <div className="bg-black/40 border border-white/10 rounded-xl p-4 flex flex-col gap-4">
                  <div className={cn(
                    "flex items-center gap-2 text-sm font-mono font-bold tracking-wider uppercase",
                    pendingDecision === 'approved' ? "text-emerald-400" :
                    pendingDecision === 'rejected' ? "text-rose-400" : "text-amber-400"
                  )}>
                    {pendingDecision === 'approved' ? <CheckCircle2 size={18}/> : pendingDecision === 'rejected' ? <XCircle size={18}/> : <RotateCcw size={18}/>}
                    РЕШЕНИЕ: {pendingDecision === 'approved' ? 'ОДОБРИТЬ' : pendingDecision === 'rejected' ? 'ОТКЛОНИТЬ' : 'НА ДОРАБОТКУ'}
                  </div>

                  <div className="flex flex-col gap-2">
                    <label className="text-[10px] font-mono font-bold text-zinc-500 uppercase tracking-wider">
                      Обоснование {pendingDecision !== 'approved' && <span className="text-rose-400">*</span>}
                    </label>
                    <textarea
                      className="w-full bg-black/60 border border-white/10 rounded-xl p-3 text-sm text-white focus:outline-none focus:border-indigo-500/50 resize-y min-h-[100px] placeholder-zinc-600"
                      placeholder="Официальное заключение..."
                      value={adminNoteInput}
                      onChange={(e) => setAdminNoteInput(e.target.value)}
                    />
                  </div>
                </div>
              </div>

              <div className="p-5 border-t border-white/10 bg-white/[0.02] flex items-center justify-end gap-3">
                <button 
                  onClick={() => setSelectedBillForAction(null)}
                  className="px-5 py-2.5 rounded-xl text-sm font-bold text-zinc-400 hover:text-white hover:bg-white/5 transition-colors"
                >
                  Отмена
                </button>
                <button 
                  onClick={handleExecuteAdminVerdict}
                  disabled={(pendingDecision !== 'approved' && !adminNoteInput.trim())}
                  className={cn(
                    "px-5 py-2.5 rounded-xl text-sm font-extrabold text-white shadow-lg transition-all active:scale-95",
                    (pendingDecision !== 'approved' && !adminNoteInput.trim())
                      ? "bg-white/[0.04] text-zinc-500 cursor-not-allowed shadow-none"
                      : "bg-indigo-600 hover:bg-indigo-500 shadow-indigo-500/20 border border-indigo-400/30"
                  )}
                >
                  Вынести решение
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

    </div>
  );
};
