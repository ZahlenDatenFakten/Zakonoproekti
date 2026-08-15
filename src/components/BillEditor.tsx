import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import type { Bill, ComparisonRow, AccessPermission, UserProfile, BillStatus, VoteDecision, FederalGovernmentVerdict } from '../types/bill';
import { CommentsSection } from './CommentsSection';
import { ExpandedArticleModal } from './ExpandedArticleModal';
import { isSystemAdmin } from '../services/securityService';
import { computeWordDiff } from '../services/diffService';
import { 
  ArrowLeft, 
  Share2, 
  Plus, 
  Trash2, 
  CheckCircle2, 
  RotateCcw,
  Maximize2,
  Send,
  MessageSquare,
  ShieldCheck,
  Check,
  X,
  Copy,
  UserCheck,
  Crown,
  FileText,
  Sparkles,
  MoreVertical,
  Edit3,
  Columns
} from 'lucide-react';
import { cn } from '../utils/cn';

interface BillEditorProps {
  bill: Bill;
  user: UserProfile;
  permission: AccessPermission;
  returnView?: 'dashboard' | 'admin_workspace';
  onSave: (updatedBill: Bill) => void;
  onDelete?: (billId: string) => void;
  onBack: () => void;
  onShare: (bill: Bill) => void;
  onToast: (type: 'success' | 'error' | 'info', text: string) => void;
}

export const BillEditor: React.FC<BillEditorProps> = ({
  bill: initialBill,
  user,
  permission,
  returnView = 'dashboard',
  onSave,
  onDelete,
  onBack,
  onShare,
  onToast
}) => {
  const [bill, setBill] = useState<Bill>(initialBill);
  const [isSavedNotice, setIsSavedNotice] = useState(false);
  const [expandedRow, setExpandedRow] = useState<ComparisonRow | null>(null);
  const [activeTabMap, setActiveTabMap] = useState<{ [rowId: string]: 'editor' | 'diff' }>({});
  const [showMoreMenu, setShowMoreMenu] = useState(false);

  // Admin verdict form state
  const [adminVerdictReason, setAdminVerdictReason] = useState('');

  const menuRef = useRef<HTMLDivElement>(null);

  const currentFullName = `${user.firstName} ${user.lastName}`.trim();
  const isAuthor = !bill.author || bill.author.trim().toLowerCase() === currentFullName.toLowerCase() || bill.author.trim() === currentFullName || isSystemAdmin(user);
  const isAdmin = isSystemAdmin(user);
  const isOfficial = user.isOfficialVerified && (user.officialRole === 'governor' || user.officialRole === 'prosecutor' || user.officialRole === 'judge');
  const canEdit = permission === 'edit' || isAuthor || isAdmin || (isOfficial && bill.status !== 'approved');
  const canDelete = isAuthor || isAdmin;

  // Auto-close menu on outside click
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        setShowMoreMenu(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

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
        setIsSavedNotice(true);
        setTimeout(() => setIsSavedNotice(false), 2000);
      }, 600);
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
    onToast('info', 'Исходный текст скопирован в новую редакцию');
  };

  const removeComparisonRow = (id: string) => {
    if (!canEdit) return;
    const updated = bill.comparisons.filter((row) => row.id !== id);
    handleFieldChange('comparisons', updated);
    onToast('info', 'Статья удалена из проекта');
  };

  const handlePublish = async () => {
    const updated: Bill = { 
      ...bill, 
      status: 'under_review' as BillStatus,
      statusReason: 'Опубликован автором и передан на рассмотрение Законодательной Комиссии.',
      updatedAt: new Date().toISOString()
    };
    setBill(updated);
    await onSave(updated);
    onToast('success', 'Законопроект передан на рассмотрение Комиссии');
  };

  const votes = bill.votes || {};
  const approvedVotesCount = [votes.prosecutor, votes.judge, votes.governor].filter((v) => v === 'approved').length;
  const rejectedVotesCount = [votes.prosecutor, votes.judge, votes.governor].filter((v) => v === 'rejected').length;

  const isStage1Passed = approvedVotesCount >= 2;
  const isStage1Rejected = rejectedVotesCount >= 2;

  const handleCastVote = async (decision: VoteDecision) => {
    if (!isOfficial) {
      onToast('error', 'Голосование доступно только членам Законодательной Комиссии.');
      return;
    }

    const role = user.officialRole;
    if (role !== 'prosecutor' && role !== 'judge' && role !== 'governor' && role !== 'admin') {
      onToast('error', 'Только Прокурор, Председатель ВС и Губернатор голосуют в Комиссии.');
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
      newStatus = 'under_review';
      statusReason = `Одобрен Законодательной Комиссией (${newApproveCount}/3). Ожидает решения Администрации.`;
    } else if (newRejectCount >= 2) {
      newStatus = 'rejected';
      statusReason = `Отклонен Законодательной Комиссией (${newRejectCount}/3).`;
    } else if (newRevisionCount >= 2) {
      newStatus = 'needs_revision';
      statusReason = `Отправлен на доработку Законодательной Комиссией.`;
    } else {
      newStatus = 'under_review';
      statusReason = `На рассмотрении Законодательной Комиссии.`;
    }

    const updatedBill: Bill = {
      ...bill,
      votes: updatedVotes,
      status: newStatus,
      statusReason
    };

    setBill(updatedBill);
    await onSave(updatedBill);
    onToast('success', `Ваш голос записан в реестр`);
  };

  const handleExecuteAdminVerdict = async (decision: VoteDecision) => {
    if (!isAdmin) {
      onToast('error', 'Только Системный Администратор выносит вердикт 2-го этапа.');
      return;
    }

    if ((decision === 'rejected' || decision === 'needs_revision') && !adminVerdictReason.trim()) {
      onToast('error', 'Укажите обоснование вердикта.');
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
      officialStatusReason = 'Утвержден Федеральным Правительством и вступил в силу.';
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
    onToast('success', `Вердикт вынесен: ${decision === 'approved' ? 'Утверждено' : decision === 'rejected' ? 'Отклонено' : 'На доработку'}`);
  };

  const handleEnactLaws = async () => {
    const updated: Bill = {
      ...bill,
      status: 'approved',
      statusReason: 'Изменения официально внесены в законодательную базу Штата San Andreas.',
      updatedAt: new Date().toISOString()
    };
    setBill(updated);
    await onSave(updated);
    onToast('success', 'Изменения внесены в законодательную базу!');
  };

  const getStatusBadge = (status: BillStatus) => {
    switch (status) {
      case 'approved':
        return (
          <span className="flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-emerald-500/10 border border-emerald-500/20 text-[10px] font-extrabold uppercase tracking-wider text-emerald-400">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 shadow-[0_0_8px_rgba(52,211,153,0.8)]" /> Вступил в силу
          </span>
        );
      case 'rejected':
        return (
          <span className="flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-rose-500/10 border border-rose-500/20 text-[10px] font-extrabold uppercase tracking-wider text-rose-400">
            <span className="w-1.5 h-1.5 rounded-full bg-rose-500 shadow-[0_0_8px_rgba(244,63,94,0.8)]" /> Отклонен
          </span>
        );
      case 'needs_revision':
        return (
          <span className="flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-amber-500/10 border border-amber-500/20 text-[10px] font-extrabold uppercase tracking-wider text-amber-400">
            <span className="w-1.5 h-1.5 rounded-full bg-amber-400 shadow-[0_0_8px_rgba(251,191,36,0.8)] animate-pulse" /> Доработка
          </span>
        );
      case 'under_review':
        return (
          <span className="flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-blue-500/10 border border-blue-500/20 text-[10px] font-extrabold uppercase tracking-wider text-blue-400">
            <span className="w-1.5 h-1.5 rounded-full bg-blue-400 shadow-[0_0_8px_rgba(96,165,250,0.8)] animate-pulse" /> {isStage1Passed ? '2-й этап (Администрация)' : '1-й этап (Комиссия)'}
          </span>
        );
      case 'draft':
      default:
        return (
          <span className="flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-zinc-500/10 border border-zinc-500/20 text-[10px] font-extrabold uppercase tracking-wider text-zinc-400">
            <span className="w-1.5 h-1.5 rounded-full bg-zinc-500" /> Черновик
          </span>
        );
    }
  };

  const formatDecreeNumber = (id: string) => {
    const numericId = id.replace(/\D/g, '').slice(-4) || '0042';
    return `АКТ № SA-${numericId}`;
  };

  const isReadOnly = bill.status === 'approved' || bill.status === 'rejected';

  // Animation Variants
  const fadeUp = {
    hidden: { opacity: 0, y: 15 },
    show: { opacity: 1, y: 0, transition: { type: "spring" as const, stiffness: 300, damping: 30 } }
  };

  return (
    <div className="flex flex-col min-h-screen bg-transparent">
      
      {/* ZEN TOP BAR */}
      <div className="sticky top-0 z-40 h-16 bg-[#090B10]/80 backdrop-blur-xl border-b border-white/10 flex items-center justify-between px-6 -mt-8 -mx-8 mb-8 shadow-xl">
        {/* Left: Back + Identity + Status */}
        <div className="flex items-center gap-4 min-w-0">
          <button 
            onClick={onBack} 
            className="flex items-center gap-2 px-3 py-1.5 rounded-xl hover:bg-white/5 text-sm font-medium text-zinc-300 transition-colors"
          >
            <ArrowLeft size={16} /> {returnView === 'admin_workspace' ? 'Администрация' : 'Реестр'}
          </button>
          
          <div className="w-px h-5 bg-white/10" />

          <span className="px-2 py-0.5 rounded-md bg-indigo-500/10 border border-indigo-500/20 text-[11px] font-mono font-bold text-indigo-300 uppercase tracking-wider shrink-0">
            {formatDecreeNumber(bill.id)}
          </span>

          <h2 className="text-sm font-bold text-white truncate max-w-sm">
            {bill.targetLaw || 'Новый законопроект'}
          </h2>

          <div className="hidden sm:block">
            {getStatusBadge(bill.status)}
          </div>
        </div>

        {/* Right: Actions */}
        <div className="flex items-center gap-3 shrink-0">
          <AnimatePresence>
            {isSavedNotice && (
              <motion.span 
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.9 }}
                className="flex items-center gap-1.5 text-xs font-mono text-zinc-400 mr-2"
              >
                <Check size={14} className="text-emerald-400" /> Сохранено
              </motion.span>
            )}
          </AnimatePresence>

          {bill.status === 'draft' && canEdit && (
            <button 
              onClick={handlePublish} 
              className="flex items-center gap-2 px-4 py-2 bg-indigo-600 hover:bg-indigo-500 text-white text-sm font-extrabold rounded-xl shadow-lg shadow-indigo-500/20 border border-indigo-400/30 active:scale-95 transition-all"
            >
              <Send size={14} /> Опубликовать
            </button>
          )}

          {isAdmin && bill.status === 'under_review' && (
            <button 
              onClick={() => handleExecuteAdminVerdict('approved')} 
              className="flex items-center gap-2 px-4 py-2 bg-emerald-600 hover:bg-emerald-500 text-white text-sm font-extrabold rounded-xl shadow-lg shadow-emerald-500/20 border border-emerald-400/30 active:scale-95 transition-all"
            >
              <CheckCircle2 size={14} /> Одобрить вердикт
            </button>
          )}

          {bill.status === 'approved' && !bill.statusReason?.includes('внесены в законодательную базу') && (
            <button 
              onClick={handleEnactLaws} 
              className="flex items-center gap-2 px-4 py-2 bg-indigo-600 hover:bg-indigo-500 text-white text-sm font-extrabold rounded-xl shadow-lg shadow-indigo-500/20 border border-indigo-400/30 active:scale-95 transition-all"
            >
              <FileText size={14} /> Внести в законы
            </button>
          )}

          {canDelete && (
            <button 
              onClick={() => { if (onDelete) onDelete(bill.id); }} 
              className="flex items-center gap-2 px-4 py-2 bg-transparent hover:bg-rose-500/10 text-rose-400 text-sm font-bold rounded-xl border border-rose-500/30 transition-colors"
            >
              <Trash2 size={14} /> Удалить
            </button>
          )}

          <div ref={menuRef} className="relative">
            <button 
              onClick={() => setShowMoreMenu((prev) => !prev)}
              className="w-9 h-9 flex items-center justify-center rounded-xl bg-white/[0.04] hover:bg-white/[0.08] text-zinc-300 border border-white/10 transition-colors"
            >
              <MoreVertical size={16} />
            </button>

            <AnimatePresence>
              {showMoreMenu && (
                <motion.div 
                  initial={{ opacity: 0, y: 10, scale: 0.95 }}
                  animate={{ opacity: 1, y: 0, scale: 1 }}
                  exit={{ opacity: 0, y: 10, scale: 0.95 }}
                  className="absolute right-0 top-full mt-2 w-48 bg-[#0C0D12] border border-white/10 rounded-2xl shadow-2xl p-1 z-50 overflow-hidden"
                >
                  <button 
                    onClick={() => {
                      setShowMoreMenu(false);
                      onShare(bill);
                    }}
                    className="w-full flex items-center gap-3 px-3 py-2 text-sm font-medium text-zinc-300 hover:text-white hover:bg-white/5 rounded-xl transition-colors"
                  >
                    <Share2 size={16} /> Ссылка доступа
                  </button>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </div>
      </div>

      {/* MAIN WORKSPACE LAYOUT */}
      <div className="grid grid-cols-1 xl:grid-cols-[1fr_340px] gap-6 max-w-[1400px] mx-auto w-full pb-20">
        
        {/* LEFT COLUMN: DOCUMENT CONTENT */}
        <motion.div variants={fadeUp} initial="hidden" animate="show" className="flex flex-col gap-6 min-w-0">
          
          {/* LAW METADATA */}
          <div className="bg-white/[0.02] backdrop-blur-xl border border-white/10 rounded-2xl p-6 shadow-2xl shadow-black/50">
            <div className="mb-5">
              <label className="block text-[11px] font-bold tracking-wider uppercase text-zinc-400 mb-2">
                Наименование целевого закона / нормативного акта
              </label>
              <input 
                type="text" 
                value={bill.targetLaw}
                onChange={(e) => handleFieldChange('targetLaw', e.target.value)}
                disabled={!canEdit || isReadOnly}
                className="w-full bg-black/60 border border-white/10 rounded-xl px-4 py-3 text-white font-bold focus:outline-none focus:border-indigo-500/50 focus:ring-1 focus:ring-indigo-500/50 transition-all placeholder-zinc-600 disabled:opacity-50"
                placeholder="Например: Уголовный кодекс Штата San Andreas (УК)"
              />
            </div>

            <div>
              <label className="block text-[11px] font-bold tracking-wider uppercase text-zinc-400 mb-2">
                Пояснительная записка к законопроекту
              </label>
              <textarea 
                value={bill.explanatoryNote}
                onChange={(e) => handleFieldChange('explanatoryNote', e.target.value)}
                disabled={!canEdit || isReadOnly}
                className="w-full min-h-[100px] bg-black/60 border border-white/10 rounded-xl px-4 py-3 text-white text-sm focus:outline-none focus:border-indigo-500/50 focus:ring-1 focus:ring-indigo-500/50 transition-all placeholder-zinc-600 resize-y disabled:opacity-50"
                placeholder="Краткое обоснование необходимости и целей внесения поправок..."
              />
            </div>
          </div>

          {/* ARTICLES HEADER */}
          <div className="flex items-center justify-between pt-2">
            <div className="flex items-center gap-3">
              <h3 className="text-lg font-bold text-white">Статьи законопроекта</h3>
              <span className="px-2 py-0.5 rounded-full bg-indigo-500/10 text-indigo-400 text-xs font-mono font-bold border border-indigo-500/20">
                {bill.comparisons.length}
              </span>
            </div>

            {canEdit && !isReadOnly && (
              <button 
                onClick={addComparisonRow} 
                className="flex items-center gap-2 px-4 py-2 bg-white/[0.04] hover:bg-white/[0.08] text-zinc-300 text-sm font-bold rounded-xl border border-white/10 transition-colors"
              >
                <Plus size={16} /> Добавить статью
              </button>
            )}
          </div>

          {/* ARTICLES LIST */}
          <div className="flex flex-col gap-6">
            {bill.comparisons.map((row, index) => {
              const diff = computeWordDiff(row.wasContent, row.becameContent);
              const activeTab = activeTabMap[row.id] || 'editor';

              return (
                <div key={row.id} className="bg-white/[0.02] backdrop-blur-xl border border-white/10 rounded-2xl shadow-2xl shadow-black/50 overflow-hidden flex flex-col">
                  
                  {/* ARTICLE CARD HEADER */}
                  <div className="bg-black/40 px-4 py-3 border-b border-white/10 flex flex-wrap items-center justify-between gap-4">
                    <div className="flex items-center gap-3 flex-1 min-w-[240px]">
                      <span className="text-xs font-mono font-bold text-zinc-500">§{index + 1}</span>
                      <input 
                        type="text" 
                        value={row.articleTitle}
                        onChange={(e) => updateComparisonRow(row.id, 'articleTitle', e.target.value)}
                        disabled={!canEdit || isReadOnly}
                        className="flex-1 max-w-sm bg-transparent border-none text-white text-sm font-bold placeholder-zinc-600 focus:outline-none focus:ring-0 px-2 py-1"
                        placeholder="Статья 1. Наименование..."
                      />
                    </div>

                    <div className="flex items-center gap-2">
                      {/* Tabs */}
                      <div className="flex items-center gap-1 bg-black/60 p-1 rounded-xl border border-white/10">
                        <button
                          onClick={() => setActiveTabMap((prev) => ({ ...prev, [row.id]: 'editor' }))}
                          className={cn(
                            "flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold transition-all",
                            activeTab === 'editor' ? "bg-white/10 text-white" : "text-zinc-500 hover:text-zinc-300"
                          )}
                        >
                          <Edit3 size={14} /> Редактор
                        </button>
                        <button
                          onClick={() => setActiveTabMap((prev) => ({ ...prev, [row.id]: 'diff' }))}
                          className={cn(
                            "flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold transition-all",
                            activeTab === 'diff' ? "bg-white/10 text-white" : "text-zinc-500 hover:text-zinc-300"
                          )}
                        >
                          <Columns size={14} /> Сравнение {diff.stats.totalChanges > 0 && `(${diff.stats.totalChanges})`}
                        </button>
                      </div>

                      {/* Micro actions */}
                      {canEdit && !isReadOnly && (
                        <button 
                          onClick={() => copyWasToBecame(row.id)}
                          className="w-8 h-8 flex items-center justify-center rounded-xl bg-transparent hover:bg-white/5 text-zinc-500 hover:text-white transition-colors"
                          title="Скопировать исходный текст"
                        >
                          <Copy size={14} />
                        </button>
                      )}

                      <button 
                        onClick={() => setExpandedRow(row)}
                        className="w-8 h-8 flex items-center justify-center rounded-xl bg-transparent hover:bg-white/5 text-zinc-500 hover:text-white transition-colors"
                        title="На весь экран"
                      >
                        <Maximize2 size={14} />
                      </button>

                      {canEdit && !isReadOnly && bill.comparisons.length > 1 && (
                        <button 
                          onClick={() => removeComparisonRow(row.id)}
                          className="w-8 h-8 flex items-center justify-center rounded-xl bg-transparent hover:bg-rose-500/10 text-rose-500 transition-colors"
                          title="Удалить статью"
                        >
                          <Trash2 size={14} />
                        </button>
                      )}
                    </div>
                  </div>

                  {/* TAB 1: PARALLEL SPLIT EDITOR */}
                  {activeTab === 'editor' && (
                    <div className="grid grid-cols-1 md:grid-cols-2 divide-y md:divide-y-0 md:divide-x divide-white/10 flex-1">
                      {/* Original */}
                      <div className="flex flex-col">
                        <div className="flex items-center justify-between px-4 py-2 bg-white/[0.02] border-b border-white/10">
                          <span className="text-[10px] font-mono font-bold text-zinc-500 uppercase tracking-wider">Действующий текст</span>
                          {canEdit && !isReadOnly && (
                            <button
                              onClick={() => updateComparisonRow(row.id, 'wasContent', '[Ранее статья в законе отсутствовала]')}
                              className="flex items-center gap-1 text-[10px] font-bold text-indigo-400 hover:text-indigo-300 uppercase tracking-wider"
                            >
                              <Sparkles size={12} /> Ранее не было
                            </button>
                          )}
                        </div>
                        <textarea 
                          value={row.wasContent}
                          onChange={(e) => updateComparisonRow(row.id, 'wasContent', e.target.value)}
                          disabled={!canEdit || isReadOnly}
                          className="w-full flex-1 bg-transparent border-none text-zinc-300 p-4 text-sm leading-relaxed focus:outline-none resize-none min-h-[160px]"
                          placeholder="Исходный текст..."
                        />
                      </div>
                      {/* New */}
                      <div className="flex flex-col">
                        <div className="flex items-center justify-between px-4 py-2 bg-white/[0.02] border-b border-white/10">
                          <span className="text-[10px] font-mono font-bold text-zinc-500 uppercase tracking-wider">Новая редакция</span>
                        </div>
                        <textarea 
                          value={row.becameContent}
                          onChange={(e) => updateComparisonRow(row.id, 'becameContent', e.target.value)}
                          disabled={!canEdit || isReadOnly}
                          className="w-full flex-1 bg-transparent border-none text-white p-4 text-sm leading-relaxed focus:outline-none resize-none min-h-[160px]"
                          placeholder="Предлагаемая редакция..."
                        />
                      </div>
                    </div>
                  )}

                  {/* TAB 2: DIFF */}
                  {activeTab === 'diff' && (
                    <div className="grid grid-cols-1 md:grid-cols-2 divide-y md:divide-y-0 md:divide-x divide-white/10 flex-1">
                      {/* Original (Was) */}
                      <div className="flex flex-col">
                        <div className="flex items-center justify-between px-4 py-2 bg-rose-500/5 border-b border-white/10">
                          <span className="text-[10px] font-mono font-bold text-rose-400 uppercase tracking-wider">Действующий текст (с удаленными)</span>
                        </div>
                        <div className="w-full flex-1 bg-transparent p-4 text-sm leading-relaxed min-h-[160px] whitespace-pre-wrap font-sans">
                          {diff.wasFormatted.length > 0 ? (
                            <>{diff.wasFormatted}</>
                          ) : (
                            <span className="text-zinc-500 italic">Текст статьи не заполнен.</span>
                          )}
                        </div>
                      </div>
                      {/* New (Became) */}
                      <div className="flex flex-col">
                        <div className="flex items-center justify-between px-4 py-2 bg-emerald-500/5 border-b border-white/10">
                          <span className="text-[10px] font-mono font-bold text-emerald-400 uppercase tracking-wider">Новая редакция (с добавленными)</span>
                        </div>
                        <div className="w-full flex-1 bg-transparent p-4 text-sm leading-relaxed min-h-[160px] whitespace-pre-wrap font-sans">
                          {diff.becameFormatted.length > 0 ? (
                            <>{diff.becameFormatted}</>
                          ) : (
                            <span className="text-zinc-500 italic">Текст статьи не заполнен.</span>
                          )}
                        </div>
                      </div>
                    </div>
                  )}

                </div>
              );
            })}
          </div>
        </motion.div>

        {/* RIGHT COLUMN: SIDEBAR */}
        <motion.div variants={fadeUp} initial="hidden" animate="show" className="flex flex-col gap-6">
          
          {/* AUTHOR CARD */}
          <div className="bg-white/[0.02] backdrop-blur-xl border border-white/10 rounded-2xl p-5 shadow-2xl shadow-black/50">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-10 h-10 rounded-full bg-indigo-500/10 border border-indigo-500/20 text-indigo-400 flex items-center justify-center shrink-0">
                <UserCheck size={18} />
              </div>
              <div className="min-w-0">
                <div className="text-sm font-bold text-white truncate">{bill.author}</div>
              </div>
            </div>

            <div className="pt-3 border-t border-white/10 flex flex-col gap-2 text-xs font-mono">
              <div className="flex justify-between text-zinc-500">
                <span>Создан:</span>
                <span className="text-zinc-300">{new Date(bill.createdAt).toLocaleDateString('ru-RU')}</span>
              </div>
              <div className="flex justify-between text-zinc-500">
                <span>Ревизия:</span>
                <span className="text-indigo-400 font-bold">v1.0</span>
              </div>
            </div>
          </div>

          {/* STAGE 1 */}
          <div className="bg-white/[0.02] backdrop-blur-xl border border-white/10 rounded-2xl p-5 shadow-2xl shadow-black/50">
            <div className="flex items-center gap-2 mb-4 pb-3 border-b border-white/10">
              <ShieldCheck size={18} className="text-indigo-400" />
              <div>
                <h4 className="text-sm font-bold text-white">1-й Этап: Комиссия</h4>
                <p className="text-[10px] font-mono text-zinc-500 uppercase tracking-wider">Кворум 2/3 голосов</p>
              </div>
            </div>

            <div className="flex flex-col gap-2 mb-4">
              {[
                { roleKey: 'prosecutor', title: 'Ген. Прокурор', vote: votes.prosecutor },
                { roleKey: 'judge', title: 'Пред. Верх. Суда', vote: votes.judge },
                { roleKey: 'governor', title: 'Губернатор', vote: votes.governor }
              ].map((item) => (
                <div key={item.roleKey} className="flex items-center justify-between p-2.5 bg-black/40 rounded-xl border border-white/5">
                  <span className="text-xs font-medium text-zinc-400">{item.title}</span>
                  {item.vote === 'approved' ? (
                    <span className="flex items-center gap-1.5 text-[10px] font-mono font-bold text-emerald-400 uppercase tracking-wider">
                      <Check size={12} /> За
                    </span>
                  ) : item.vote === 'rejected' ? (
                    <span className="flex items-center gap-1.5 text-[10px] font-mono font-bold text-rose-400 uppercase tracking-wider">
                      <X size={12} /> Против
                    </span>
                  ) : item.vote === 'needs_revision' ? (
                    <span className="flex items-center gap-1.5 text-[10px] font-mono font-bold text-amber-400 uppercase tracking-wider">
                      <RotateCcw size={12} /> Правки
                    </span>
                  ) : (
                    <span className="text-[10px] font-mono text-zinc-600 uppercase tracking-wider">Ожидает</span>
                  )}
                </div>
              ))}
            </div>

            <div className="mb-4">
              <div className="flex justify-between text-[10px] font-mono font-bold uppercase tracking-wider mb-2">
                <span className={isStage1Passed ? 'text-emerald-400' : isStage1Rejected ? 'text-rose-400' : 'text-zinc-500'}>
                  {isStage1Passed ? 'Одобрено Комиссией' : isStage1Rejected ? 'Отклонено Комиссией' : 'Итог голосования'}
                </span>
                <span className="text-zinc-400">{approvedVotesCount} За / {rejectedVotesCount} Против</span>
              </div>
              <div className="h-2 w-full bg-black/60 rounded-full overflow-hidden border border-white/5 flex">
                {approvedVotesCount > 0 && <div className="h-full bg-emerald-500 transition-all" style={{ width: `${(approvedVotesCount / 3) * 100}%` }} />}
                {rejectedVotesCount > 0 && <div className="h-full bg-rose-500 transition-all" style={{ width: `${(rejectedVotesCount / 3) * 100}%` }} />}
                {([votes.prosecutor, votes.judge, votes.governor].filter(v => v === 'needs_revision').length) > 0 && 
                  <div className="h-full bg-amber-500 transition-all" style={{ width: `${([votes.prosecutor, votes.judge, votes.governor].filter(v => v === 'needs_revision').length / 3) * 100}%` }} />}
                {(3 - approvedVotesCount - rejectedVotesCount - [votes.prosecutor, votes.judge, votes.governor].filter(v => v === 'needs_revision').length) > 0 && 
                  <div className="h-full bg-white/5 transition-all" style={{ width: `${((3 - approvedVotesCount - rejectedVotesCount - [votes.prosecutor, votes.judge, votes.governor].filter(v => v === 'needs_revision').length) / 3) * 100}%` }} />}
              </div>
            </div>

            {['under_review', 'rejected', 'needs_revision'].includes(bill.status) && !bill.federalVerdict && (() => {
              const myVote = (user.officialRole === 'prosecutor' ? votes.prosecutor : user.officialRole === 'judge' ? votes.judge : votes.governor);
              return (
                <div className="flex gap-2 mt-4">
                  <button onClick={() => handleCastVote('approved')} className={cn("flex-1 py-2 text-xs font-bold rounded-xl transition-all border", myVote === 'approved' ? "bg-emerald-500/20 text-emerald-400 border-emerald-500/30" : "bg-white/[0.04] text-zinc-400 border-white/10 hover:bg-white/[0.08]")}>За</button>
                  <button onClick={() => handleCastVote('needs_revision')} className={cn("flex-1 py-2 text-xs font-bold rounded-xl transition-all border", myVote === 'needs_revision' ? "bg-amber-500/20 text-amber-400 border-amber-500/30" : "bg-white/[0.04] text-zinc-400 border-white/10 hover:bg-white/[0.08]")}>Правки</button>
                  <button onClick={() => handleCastVote('rejected')} className={cn("flex-1 py-2 text-xs font-bold rounded-xl transition-all border", myVote === 'rejected' ? "bg-rose-500/20 text-rose-400 border-rose-500/30" : "bg-white/[0.04] text-zinc-400 border-white/10 hover:bg-white/[0.08]")}>Против</button>
                </div>
              );
            })()}
          </div>

          {/* STAGE 2 */}
          <div className="bg-white/[0.02] backdrop-blur-xl border border-white/10 rounded-2xl p-5 shadow-2xl shadow-black/50">
            <div className="flex items-center gap-2 mb-4 pb-3 border-b border-white/10">
              <Crown size={18} className="text-amber-400" />
              <div>
                <h4 className="text-sm font-bold text-white">2-й Этап: Администрация</h4>
                <p className="text-[10px] font-mono text-zinc-500 uppercase tracking-wider">Федеральное Правительство</p>
              </div>
            </div>

            {bill.status === 'approved' ? (
              <div className="p-3 bg-emerald-500/10 border border-emerald-500/20 rounded-xl">
                <div className="text-[10px] font-mono font-bold text-emerald-400 mb-1">✓ ВНЕСЕН В ЗАКОНОДАТЕЛЬСТВО</div>
                <div className="text-xs text-emerald-200/70">{bill.statusReason || 'Законопроект проверен, утвержден и официально внесен.'}</div>
              </div>
            ) : bill.federalVerdict?.status === 'approved' ? (
              <div className="flex flex-col gap-3 p-3 bg-indigo-500/10 border border-indigo-500/20 rounded-xl">
                <div className="text-[10px] font-mono font-bold text-indigo-400 mb-1">ОДОБРЕН (ОЖИДАЕТ ВНЕСЕНИЯ)</div>
                <div className="text-xs text-indigo-200/70">{bill.federalVerdict.reason || 'Законопроект одобрен Администрацией.'}</div>
                {isAdmin && (
                  <button 
                    onClick={async () => {
                      const updated: Bill = {
                        ...bill,
                        status: 'approved',
                        statusReason: 'Изменения официально внесены в законодательную базу Штата San Andreas.',
                        updatedAt: new Date().toISOString()
                      };
                      await onSave(updated);
                      onToast('success', 'Изменения внесены в законы');
                    }}
                    className="mt-2 w-full py-2 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl text-xs font-bold transition-all shadow-[0_0_15px_rgba(79,70,229,0.3)]"
                  >
                    Внести в реестр
                  </button>
                )}
              </div>
            ) : bill.federalVerdict?.status === 'rejected' ? (
              <div className="p-3 bg-rose-500/10 border border-rose-500/20 rounded-xl">
                <div className="text-[10px] font-mono font-bold text-rose-400 mb-1">ОТКЛОНЕНО</div>
                <div className="text-xs text-rose-200/70">{bill.federalVerdict.reason}</div>
              </div>
            ) : isAdmin ? (
              <div className="flex flex-col gap-3">
                <textarea 
                  value={adminVerdictReason}
                  onChange={(e) => setAdminVerdictReason(e.target.value)}
                  className="w-full min-h-[80px] bg-black/60 border border-white/10 rounded-xl p-3 text-xs text-white focus:outline-none focus:border-indigo-500/50 resize-y placeholder-zinc-600"
                  placeholder="Обоснование вердикта..."
                />
                <div className="flex gap-2">
                  <button onClick={() => handleExecuteAdminVerdict('approved')} className="flex-1 py-2 bg-emerald-600/20 hover:bg-emerald-600/30 text-emerald-400 border border-emerald-500/30 rounded-xl text-xs font-bold transition-colors">Одобрить</button>
                  <button onClick={() => handleExecuteAdminVerdict('needs_revision')} className="flex-1 py-2 bg-amber-600/20 hover:bg-amber-600/30 text-amber-400 border border-amber-500/30 rounded-xl text-xs font-bold transition-colors">Правки</button>
                  <button onClick={() => handleExecuteAdminVerdict('rejected')} className="flex-1 py-2 bg-rose-600/20 hover:bg-rose-600/30 text-rose-400 border border-rose-500/30 rounded-xl text-xs font-bold transition-colors">Отклонить</button>
                </div>
              </div>
            ) : (
              <div className="text-[10px] font-mono text-zinc-500 text-center uppercase tracking-wider py-2">
                {isStage1Passed ? 'Ожидает решения' : 'Доступно после 1-го этапа'}
              </div>
            )}
          </div>

          {/* COMMENTS */}
          <div className="bg-white/[0.02] backdrop-blur-xl border border-white/10 rounded-2xl p-5 shadow-2xl shadow-black/50">
            <div className="flex items-center gap-2 mb-4 pb-3 border-b border-white/10">
              <MessageSquare size={18} className="text-indigo-400" />
              <h4 className="text-sm font-bold text-white">Обсуждение ({bill.comments?.length || 0})</h4>
            </div>
            
            {/* The CommentsSection component needs its own redesign to match, but we will pass down props */}
            <CommentsSection 
              billId={bill.id}
              user={user}
              comments={bill.comments || []}
              canComment={!isReadOnly}
              onAddComment={(updatedComments) => handleFieldChange('comments', updatedComments)}
            />
          </div>

        </motion.div>
      </div>

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
