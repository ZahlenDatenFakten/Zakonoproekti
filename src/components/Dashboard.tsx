import React, { useState, useMemo } from 'react';
import { motion } from 'framer-motion';
import type { Bill, BillStatus, UserProfile } from '../types/bill';
import { isSystemAdmin } from '../services/securityService';
import { 
  Search, 
  ChevronRight,
  Plus, 
  Calendar,
  User as UserIcon,
  Layers,
  Trash2,
  FileText
} from 'lucide-react';
import { cn } from '../utils/cn';

interface DashboardProps {
  user: UserProfile;
  bills: Bill[];
  onSelectBill: (bill: Bill) => void;
  onShareBill: (bill: Bill) => void;
  onDeleteBill: (billId: string) => void;
  onNewBill: () => void;
}

export const Dashboard: React.FC<DashboardProps> = ({
  user,
  bills,
  onSelectBill,
  onDeleteBill,
  onNewBill
}) => {
  const [activeTab, setActiveTab] = useState<'all' | 'my' | 'active' | 'approved'>('all');
  const [searchQuery, setSearchQuery] = useState('');

  const currentFullName = `${user.firstName} ${user.lastName}`.trim();

  // Filter out private drafts of other users first
  const visibleBills = useMemo(() => {
    return bills.filter((b) => {
      // Drafts remain private to their author (and Admin) until submitted
      if (b.status === 'draft' && b.author.trim() !== currentFullName && !isSystemAdmin(user)) {
        return false;
      }
      return true;
    });
  }, [bills, currentFullName, user]);

  // Statistics calculation based ONLY on bills the user is allowed to see
  const stats = useMemo(() => {
    const total = visibleBills.length;
    const active = visibleBills.filter(b => b.status === 'under_review' || b.status === 'needs_revision' || b.status === 'draft').length;
    const approved = visibleBills.filter(b => b.status === 'approved').length;
    const myCount = visibleBills.filter(b => b.author.trim() === currentFullName).length;
    return { total, active, approved, myCount };
  }, [visibleBills, currentFullName]);

  // Tab and Search filtering logic
  const filteredBills = useMemo(() => {
    return visibleBills
      .filter((b) => {
        if (activeTab === 'my') {
          if (b.author.trim() !== currentFullName) return false;
        } else if (activeTab === 'active') {
          if (b.status === 'approved' || b.status === 'rejected') return false;
        } else if (activeTab === 'approved') {
          if (b.status !== 'approved') return false;
        }

        if (searchQuery) {
          const query = searchQuery.toLowerCase();
          return (
            (b.targetLaw && b.targetLaw.toLowerCase().includes(query)) ||
            (b.author && b.author.toLowerCase().includes(query)) ||
            (b.title && b.title.toLowerCase().includes(query)) ||
            (b.id && b.id.toLowerCase().includes(query))
          );
        }

        return true;
      })
      .sort((a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime());
  }, [visibleBills, activeTab, searchQuery, currentFullName]);

  const formatDate = (isoStr: string) => {
    const d = new Date(isoStr);
    return `${d.toLocaleDateString('ru-RU')} ${d.toLocaleTimeString('ru-RU', { hour: '2-digit', minute: '2-digit' })}`;
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
            <span className="w-1.5 h-1.5 rounded-full bg-blue-400 shadow-[0_0_8px_rgba(96,165,250,0.8)] animate-pulse" /> На рассмотрении
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

  const formatDecreeNumber = (billId: string) => {
    const numericId = billId.replace(/\D/g, '').slice(-4) || '0042';
    return `АКТ № SA-${numericId}`;
  };

  // Animation variants
  const containerVariants = {
    hidden: { opacity: 0 },
    show: {
      opacity: 1,
      transition: { staggerChildren: 0.05 }
    }
  };

  const itemVariants = {
    hidden: { opacity: 0, y: 15 },
    show: { opacity: 1, y: 0, transition: { type: "spring" as const, stiffness: 300, damping: 30 } }
  };

  return (
    <div className="max-w-6xl mx-auto space-y-8 pb-12">
      
      {/* Header Area */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-6">
        <div>
          <h2 className="text-3xl font-extrabold tracking-tight text-white mb-2">
            Реестр законопроектов
          </h2>
          <p className="text-sm text-zinc-400 font-medium">
            Электронный архив законодательных актов и экспертиз Штата San Andreas
          </p>
        </div>

        <button 
          onClick={onNewBill} 
          className="flex items-center gap-2 bg-indigo-600 hover:bg-indigo-500 text-white font-extrabold px-5 py-3 rounded-xl shadow-lg shadow-indigo-500/20 border border-indigo-400/30 active:scale-95 transition-all"
        >
          <Plus size={18} />
          Внести законопроект
        </button>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {[
          { icon: <Layers size={20} />, value: stats.total, label: 'Всего актов', color: 'indigo' },
          { icon: <FileText size={20} />, value: stats.active, label: 'На рассмотрении', color: 'amber' },
          { icon: <ChevronRight size={20} />, value: stats.approved, label: 'Вступили в силу', color: 'emerald' },
          { icon: <UserIcon size={20} />, value: stats.myCount, label: 'Мои проекты', color: 'zinc' },
        ].map((stat, i) => (
          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.1 }}
            key={i} 
            className="flex items-center gap-4 p-5 rounded-2xl bg-white/[0.02] backdrop-blur-xl border border-white/10 shadow-2xl shadow-black/50 hover:border-white/20 transition-all duration-200"
          >
            <div className={cn(
              "w-12 h-12 rounded-xl flex items-center justify-center shrink-0 border",
              stat.color === 'indigo' && "bg-indigo-500/10 border-indigo-500/20 text-indigo-400 shadow-[inset_0_2px_8px_rgba(99,102,241,0.15)]",
              stat.color === 'amber' && "bg-amber-500/10 border-amber-500/20 text-amber-400 shadow-[inset_0_2px_8px_rgba(245,158,11,0.15)]",
              stat.color === 'emerald' && "bg-emerald-500/10 border-emerald-500/20 text-emerald-400 shadow-[inset_0_2px_8px_rgba(16,185,129,0.15)]",
              stat.color === 'zinc' && "bg-zinc-500/10 border-zinc-500/20 text-zinc-400 shadow-[inset_0_2px_8px_rgba(161,161,170,0.15)]",
            )}>
              {stat.icon}
            </div>
            <div>
              <div className="text-2xl font-extrabold font-mono text-white leading-none mb-1">
                {stat.value}
              </div>
              <div className="text-[11px] font-bold tracking-wider uppercase text-zinc-400">
                {stat.label}
              </div>
            </div>
          </motion.div>
        ))}
      </div>

      {/* Filters & Search */}
      <div className="flex flex-col md:flex-row items-center justify-between gap-4 bg-white/[0.02] backdrop-blur-xl border border-white/10 rounded-2xl p-2 shadow-2xl shadow-black/50">
        
        {/* TABS */}
        <div className="flex w-full md:w-auto gap-1">
          {[
            { id: 'all', label: 'Все' },
            { id: 'active', label: 'На рассмотрении' },
            { id: 'approved', label: 'Вступили в силу' },
            { id: 'my', label: 'Мои проекты' }
          ].map((tab) => {
            const isActive = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id as any)}
                className={cn(
                  "flex-1 md:flex-none px-4 py-2 rounded-xl text-xs font-bold tracking-wide transition-all duration-200",
                  isActive 
                    ? "bg-white/10 text-white shadow-lg" 
                    : "text-zinc-400 hover:text-white hover:bg-white/5"
                )}
              >
                {tab.label}
              </button>
            );
          })}
        </div>

        {/* SEARCH INPUT */}
        <div className="relative w-full md:w-80 shrink-0">
          <Search size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-zinc-500" />
          <input 
            type="text" 
            placeholder="Поиск (название, автор, номер)..." 
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full bg-black/60 border border-white/10 rounded-xl py-2 pl-10 pr-4 text-sm text-white placeholder-zinc-500 focus:outline-none focus:border-indigo-500/50 focus:ring-1 focus:ring-indigo-500/50 transition-all duration-200"
          />
        </div>
      </div>

      {/* BILLS LIST */}
      <motion.div 
        variants={containerVariants}
        initial="hidden"
        animate="show"
        className="flex flex-col gap-3"
      >
        {filteredBills.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-20 px-4 text-center bg-white/[0.02] backdrop-blur-xl border border-white/10 rounded-2xl shadow-2xl shadow-black/50">
            <Search size={48} className="text-zinc-600 mb-4" />
            <p className="text-zinc-400 text-sm font-medium">
              Законопроекты не найдены. Измените параметры поиска.
            </p>
          </div>
        ) : (
          filteredBills.map((bill) => {
            const decreeStamp = formatDecreeNumber(bill.id);
            const isAuthor = !bill.author || bill.author.trim().toLowerCase() === currentFullName.toLowerCase() || bill.author.trim() === currentFullName || isSystemAdmin(user);
            const canDelete = isAuthor || isSystemAdmin(user);

            return (
              <motion.div 
                variants={itemVariants}
                key={bill.id}
                onClick={() => onSelectBill(bill)}
                className="group flex flex-col sm:flex-row sm:items-center justify-between p-5 rounded-2xl bg-white/[0.02] backdrop-blur-xl border border-white/10 shadow-2xl shadow-black/50 hover:border-white/20 hover:bg-white/[0.04] cursor-pointer transition-all duration-200"
              >
                <div className="flex-1 min-w-0 pr-4">
                  {/* Top Meta Line */}
                  <div className="flex items-center gap-3 mb-3 flex-wrap">
                    <span className="px-2 py-0.5 rounded-md bg-indigo-500/10 border border-indigo-500/20 text-[10px] font-mono font-bold text-indigo-300 uppercase tracking-wider">
                      {decreeStamp}
                    </span>
                    {getStatusBadge(bill.status)}
                    <span className="text-[10px] font-mono uppercase tracking-wider text-zinc-500">
                      {bill.authorRole || 'Инициатива'}
                    </span>
                  </div>

                  {/* Title */}
                  <h3 className="text-base font-bold text-white mb-2 leading-snug truncate">
                    {bill.targetLaw || bill.title || 'Внесение изменений в закон'}
                  </h3>
                  
                  {/* Note preview */}
                  {bill.explanatoryNote && (
                    <p className="text-sm text-zinc-400 mb-4 truncate max-w-3xl">
                      {bill.explanatoryNote}
                    </p>
                  )}

                  {/* Bottom Meta */}
                  <div className="flex items-center gap-4 text-[11px] font-mono text-zinc-500 flex-wrap uppercase tracking-wider">
                    <div className="flex items-center gap-1.5">
                      <UserIcon size={12} className="text-zinc-600" />
                      <span className="text-zinc-300 font-bold">{bill.author}</span>
                    </div>
                    <span className="opacity-30">•</span>
                    <div className="flex items-center gap-1.5">
                      <Calendar size={12} className="text-zinc-600" />
                      <span>{formatDate(bill.updatedAt)}</span>
                    </div>
                    <span className="opacity-30">•</span>
                    <div>
                      Статей: <span className="text-indigo-400 font-extrabold">{bill.comparisons.length}</span>
                    </div>
                  </div>
                </div>
                
                {/* Actions */}
                <div className="flex items-center gap-2 mt-4 sm:mt-0 shrink-0">
                  {canDelete && (
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        onDeleteBill(bill.id);
                      }}
                      className="p-2.5 rounded-xl bg-transparent hover:bg-rose-500/10 text-zinc-500 hover:text-rose-400 transition-colors duration-200"
                      title="Удалить законопроект"
                    >
                      <Trash2 size={16} />
                    </button>
                  )}

                  <div className="w-10 h-10 rounded-xl bg-white/[0.04] border border-white/10 flex items-center justify-center text-zinc-400 group-hover:bg-indigo-500 group-hover:text-white group-hover:border-indigo-400/50 group-hover:shadow-[0_0_15px_rgba(99,102,241,0.4)] transition-all duration-300">
                    <ChevronRight size={18} />
                  </div>
                </div>
              </motion.div>
            );
          })
        )}
      </motion.div>

    </div>
  );
};
