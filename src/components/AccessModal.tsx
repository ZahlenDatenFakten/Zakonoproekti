import React, { useState } from 'react';
import { motion } from 'framer-motion';
import type { Bill, AccessLink, AccessPermission } from '../types/bill';
import { CustomSelect } from './CustomSelect';
import { X, Copy, Check, Link as LinkIcon, Shield, Trash2, Plus } from 'lucide-react';

interface AccessModalProps {
  bill: Bill;
  onUpdateBill: (updatedBill: Bill) => void;
  onClose: () => void;
}

export const AccessModal: React.FC<AccessModalProps> = ({ bill, onUpdateBill, onClose }) => {
  const [newLabel, setNewLabel] = useState('');
  const [newPermission, setNewPermission] = useState<AccessPermission>('read');
  const [copiedToken, setCopiedToken] = useState<string | null>(null);

  const handleCreateLink = () => {
    const token = 'link_' + Math.random().toString(36).substring(2, 10);
    const newLink: AccessLink = {
      id: 'st_' + Date.now(),
      token,
      permission: newPermission,
      label: newLabel || (newPermission === 'read' ? 'Ссылка читателя' : 'Ссылка соавтора'),
      createdAt: new Date().toISOString()
    };

    const updatedTokens = [...(bill.shareTokens || []), newLink];
    const updatedBill = { ...bill, shareTokens: updatedTokens };
    onUpdateBill(updatedBill);
    setNewLabel('');
  };

  const handleDeleteLink = (id: string) => {
    const updatedTokens = bill.shareTokens.filter((l) => l.id !== id);
    onUpdateBill({ ...bill, shareTokens: updatedTokens });
  };

  const getFullShareUrl = (token: string, permission: AccessPermission) => {
    const baseUrl = window.location.origin + window.location.pathname;
    return `${baseUrl}?billId=${bill.id}&token=${token}&perm=${permission}`;
  };

  const handleCopy = (url: string, token: string) => {
    navigator.clipboard.writeText(url);
    setCopiedToken(token);
    setTimeout(() => setCopiedToken(null), 2500);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <motion.div 
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="absolute inset-0 bg-black/80 backdrop-blur-sm"
        onClick={onClose}
      />
      <motion.div 
        initial={{ opacity: 0, scale: 0.95, y: 20 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.95, y: 20 }}
        className="relative w-full max-w-2xl bg-[#0C0D12] border border-white/10 rounded-2xl shadow-2xl overflow-hidden flex flex-col"
      >
        
        {/* Header */}
        <div className="p-5 border-b border-white/10 bg-white/[0.02] flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-indigo-500/10 border border-indigo-500/20 text-indigo-400 flex items-center justify-center">
              <Shield size={20} />
            </div>
            <div>
              <h3 className="text-lg font-bold text-white">Ссылки управления доступом</h3>
              <p className="text-[10px] font-mono text-zinc-500 uppercase tracking-wider max-w-[300px] truncate">
                {bill.targetLaw || bill.title}
              </p>
            </div>
          </div>
          <button 
            onClick={onClose} 
            className="w-8 h-8 flex items-center justify-center rounded-xl bg-transparent hover:bg-white/5 text-zinc-400 hover:text-white transition-colors"
          >
            <X size={18} />
          </button>
        </div>

        <div className="p-6">
          {/* Generate New Link Form */}
          <div className="bg-white/[0.02] border border-white/10 rounded-xl p-5 mb-6 shadow-lg shadow-black/20">
            <h4 className="text-[10px] font-mono font-bold text-indigo-400 uppercase tracking-wider mb-4">
              Сгенерировать токен доступа
            </h4>

            <div className="flex flex-col gap-4 mb-5">
              <div>
                <label className="block text-[10px] font-bold tracking-wider uppercase text-zinc-400 mb-2">
                  Наименование ключа доступа:
                </label>
                <input
                  type="text"
                  className="w-full bg-black/60 border border-white/10 rounded-xl px-4 py-2.5 text-sm text-white focus:outline-none focus:border-indigo-500/50 transition-colors placeholder-zinc-600"
                  placeholder="Например: Ссылка для эксперта..."
                  value={newLabel}
                  onChange={(e) => setNewLabel(e.target.value)}
                />
              </div>

              <div>
                <label className="block text-[10px] font-bold tracking-wider uppercase text-zinc-400 mb-2">
                  Права доступа:
                </label>
                {/* Fallback to custom select or just simple native select for now to avoid custom styling issues, but let's keep CustomSelect and we'll fix it if needed */}
                <CustomSelect
                  options={[
                    { value: 'read', label: '👁️ Читатель (Просмотр + Оценка)' },
                    { value: 'edit', label: '✏️ Соавтор (Полное редактирование)' }
                  ]}
                  value={newPermission}
                  onChange={(val) => setNewPermission(val as AccessPermission)}
                  width="100%"
                />
              </div>
            </div>

            <button 
              onClick={handleCreateLink} 
              className="w-full flex items-center justify-center gap-2 py-3 bg-indigo-600 hover:bg-indigo-500 text-white text-sm font-extrabold rounded-xl shadow-lg shadow-indigo-500/20 border border-indigo-400/30 active:scale-95 transition-all"
            >
              <Plus size={16} /> Выпустить токен доступа
            </button>
          </div>

          {/* Active Links */}
          <h4 className="text-[10px] font-mono font-bold text-zinc-500 uppercase tracking-wider mb-3">
            Активные токен-ссылки ({bill.shareTokens?.length || 0})
          </h4>

          {(!bill.shareTokens || bill.shareTokens.length === 0) ? (
            <div className="py-10 text-center flex flex-col items-center justify-center">
              <LinkIcon size={32} className="text-zinc-600 mb-3 opacity-50" />
              <p className="text-xs font-mono text-zinc-500 uppercase tracking-wider">
                Активных токенов не найдено
              </p>
            </div>
          ) : (
            <div className="flex flex-col gap-3 max-h-[240px] overflow-y-auto pr-2 custom-scrollbar">
              {bill.shareTokens.map((link) => {
                const fullUrl = getFullShareUrl(link.token, link.permission);
                const isCopied = copiedToken === link.token;

                return (
                  <div key={link.id} className="bg-black/40 border border-white/10 rounded-xl p-4">
                    <div className="flex items-center justify-between mb-3 flex-wrap gap-2">
                      <div className="flex items-center gap-2 font-bold text-sm text-white">
                        <LinkIcon size={14} className="text-indigo-400" />
                        {link.label}
                      </div>

                      <span className="px-2.5 py-1 rounded-full bg-white/[0.04] border border-white/10 text-[10px] font-mono font-bold text-indigo-300 uppercase tracking-wider">
                        {link.permission === 'edit' ? '✏️ Редактор' : '👁️ Читатель'}
                      </span>
                    </div>

                    <div className="flex items-center gap-2">
                      <input
                        type="text"
                        readOnly
                        value={fullUrl}
                        className="flex-1 min-w-0 bg-white/[0.02] border border-white/10 rounded-xl px-3 py-2 text-xs font-mono text-zinc-400 focus:outline-none"
                      />

                      <button
                        onClick={() => handleCopy(fullUrl, link.token)}
                        className="flex items-center gap-1.5 px-3 py-2 bg-white/[0.04] hover:bg-white/[0.08] text-zinc-300 text-xs font-bold rounded-xl border border-white/10 transition-colors"
                      >
                        {isCopied ? <Check size={14} className="text-emerald-400" /> : <Copy size={14} />}
                        <span>{isCopied ? 'Скоп.' : 'Копия'}</span>
                      </button>

                      <button
                        onClick={() => handleDeleteLink(link.id)}
                        className="p-2 bg-transparent hover:bg-rose-500/10 text-rose-500 rounded-xl border border-transparent hover:border-rose-500/20 transition-colors"
                        title="Отозвать токен"
                      >
                        <Trash2 size={16} />
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        <div className="p-5 border-t border-white/10 bg-white/[0.02] flex justify-end">
          <button 
            onClick={onClose} 
            className="px-6 py-2.5 bg-white/[0.04] hover:bg-white/[0.08] text-white text-sm font-bold rounded-xl border border-white/10 transition-colors"
          >
            Закрыть
          </button>
        </div>

      </motion.div>
    </div>
  );
};
