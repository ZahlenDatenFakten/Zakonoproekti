import React, { useState } from 'react';
import { motion } from 'framer-motion';
import type { ComparisonRow } from '../types/bill';
import { computeWordDiff } from '../services/diffService';
import { X, Maximize2, Edit3, Columns, Sparkles } from 'lucide-react';
import { cn } from '../utils/cn';

interface ExpandedArticleModalProps {
  row: ComparisonRow;
  canEdit: boolean;
  onUpdateRow: (id: string, field: keyof ComparisonRow, value: string) => void;
  onClose: () => void;
}

export const ExpandedArticleModal: React.FC<ExpandedArticleModalProps> = ({
  row,
  canEdit,
  onUpdateRow,
  onClose
}) => {
  const [viewMode, setViewMode] = useState<'split_editor' | 'protocol'>('split_editor');
  const diff = computeWordDiff(row.wasContent, row.becameContent);

  return (
    <div className="fixed inset-0 z-[6000] flex items-center justify-center p-4">
      <motion.div 
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="absolute inset-0 bg-black/90 backdrop-blur-md"
        onClick={onClose}
      />
      <motion.div 
        initial={{ opacity: 0, scale: 0.95, y: 20 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.95, y: 20 }}
        className="relative w-full max-w-[1400px] h-[90vh] bg-[#0C0D12] border border-white/10 rounded-3xl shadow-2xl overflow-hidden flex flex-col"
      >
        {/* MODAL HEADER */}
        <div className="p-5 border-b border-white/10 bg-white/[0.02] flex items-center justify-between flex-wrap gap-4">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 rounded-xl bg-indigo-500/10 border border-indigo-500/20 text-indigo-400 flex items-center justify-center">
              <Maximize2 size={20} />
            </div>
            <div>
              <div className="flex items-center gap-3">
                <span className="px-2.5 py-1 rounded-md bg-white/[0.04] border border-white/10 text-[10px] font-mono font-bold text-zinc-400 uppercase tracking-wider">
                  Постатейный Анализ
                </span>
                <span className="text-lg font-bold text-white max-w-xl truncate">
                  {row.articleTitle || 'Статья без названия'}
                </span>
              </div>
            </div>
          </div>

          <div className="flex items-center gap-4">
            {/* METRICS */}
            <div className="flex items-center gap-2 font-mono text-xs font-bold">
              {diff.stats.addedWords > 0 && (
                <span className="px-2 py-1 bg-emerald-500/10 text-emerald-400 rounded-md border border-emerald-500/20">
                  +{diff.stats.addedWords} доб.
                </span>
              )}
              {diff.stats.removedWords > 0 && (
                <span className="px-2 py-1 bg-rose-500/10 text-rose-400 rounded-md border border-rose-500/20">
                  -{diff.stats.removedWords} уд.
                </span>
              )}
            </div>

            <div className="w-px h-6 bg-white/10" />

            {/* VIEW MODE TABS */}
            <div className="flex items-center gap-1 bg-black/60 p-1 rounded-xl border border-white/10">
              <button
                onClick={() => setViewMode('split_editor')}
                className={cn(
                  "flex items-center gap-2 px-4 py-2 rounded-lg text-xs font-bold transition-all",
                  viewMode === 'split_editor' ? "bg-white/10 text-white" : "text-zinc-500 hover:text-zinc-300 hover:bg-white/5"
                )}
              >
                <Edit3 size={14} /> Параллельный редактор
              </button>
              <button
                onClick={() => setViewMode('protocol')}
                className={cn(
                  "flex items-center gap-2 px-4 py-2 rounded-lg text-xs font-bold transition-all",
                  viewMode === 'protocol' ? "bg-white/10 text-white" : "text-zinc-500 hover:text-zinc-300 hover:bg-white/5"
                )}
              >
                <Columns size={14} /> Сравнительный протокол
              </button>
            </div>

            <button 
              onClick={onClose} 
              className="w-10 h-10 flex items-center justify-center rounded-xl bg-transparent hover:bg-white/5 text-zinc-400 hover:text-white transition-colors"
              title="Закрыть (Esc)"
            >
              <X size={20} />
            </button>
          </div>
        </div>

        {/* MODAL BODY */}
        <div className="flex-1 overflow-y-auto custom-scrollbar p-6 flex flex-col min-h-0">
          
          {/* ARTICLE TITLE BAR */}
          <div className="mb-6 shrink-0">
            <label className="block text-[10px] font-bold tracking-wider uppercase text-zinc-500 mb-2">Наименование статьи</label>
            <input 
              type="text"
              value={row.articleTitle}
              onChange={(e) => onUpdateRow(row.id, 'articleTitle', e.target.value)}
              disabled={!canEdit}
              className="w-full bg-black/60 border border-white/10 rounded-xl px-4 py-3 text-white font-bold focus:outline-none focus:border-indigo-500/50 transition-colors placeholder-zinc-600"
              placeholder="Статья 1. Наименование статьи..."
            />
          </div>

          {viewMode === 'split_editor' ? (
            <div className="flex-1 grid grid-cols-1 md:grid-cols-2 gap-6 min-h-0">
              
              {/* WAS COLUMN */}
              <div className="flex flex-col bg-white/[0.02] border border-white/10 rounded-2xl overflow-hidden min-h-[400px]">
                <div className="px-5 py-3 bg-rose-500/5 border-b border-white/10 flex items-center justify-between shrink-0">
                  <span className="text-[10px] font-mono font-bold text-rose-400 uppercase tracking-wider">
                    Действующая Редакция (Оригинал)
                  </span>
                  {canEdit && (
                    <button
                      type="button"
                      onClick={() => onUpdateRow(row.id, 'wasContent', '[Ранее статья в действующей редакции закона отсутствовала]')}
                      className="flex items-center gap-1.5 px-2.5 py-1 rounded-md bg-rose-500/10 text-[10px] font-bold text-rose-300 hover:bg-rose-500/20 transition-colors uppercase tracking-wider"
                    >
                      <Sparkles size={12} /> Ранее не было
                    </button>
                  )}
                </div>
                <textarea
                  value={row.wasContent}
                  onChange={(e) => onUpdateRow(row.id, 'wasContent', e.target.value)}
                  disabled={!canEdit}
                  className="flex-1 w-full bg-transparent border-none text-zinc-300 p-5 text-sm leading-loose focus:outline-none resize-none"
                  placeholder="Вставьте исходный текст действующей статьи..."
                />
              </div>

              {/* BECAME COLUMN */}
              <div className="flex flex-col bg-white/[0.02] border border-white/10 rounded-2xl overflow-hidden min-h-[400px]">
                <div className="px-5 py-3 bg-emerald-500/5 border-b border-white/10 shrink-0">
                  <span className="text-[10px] font-mono font-bold text-emerald-400 uppercase tracking-wider">
                    Проектируемая Редакция (Поправки)
                  </span>
                </div>
                <textarea
                  value={row.becameContent}
                  onChange={(e) => onUpdateRow(row.id, 'becameContent', e.target.value)}
                  disabled={!canEdit}
                  className="flex-1 w-full bg-transparent border-none text-white p-5 text-sm leading-loose focus:outline-none resize-none"
                  placeholder="Введите предлагаемую новую формулировку статьи..."
                />
              </div>

            </div>
          ) : (
            /* PROTOCOL UNIFIED DIFF VIEW */
            <div className="flex-1 bg-white/[0.02] border border-white/10 rounded-2xl p-6 overflow-y-auto">
              <div className="text-[10px] font-mono font-bold text-zinc-500 uppercase tracking-wider mb-6 pb-4 border-b border-white/10">
                Полный сравнительный протокол изменений
              </div>
              <div className="text-sm leading-loose">
                {diff.unifiedFormatted.length > 0 ? (
                  <div className="whitespace-pre-wrap font-sans">
                    {diff.unifiedFormatted.map((token: any, i: number) => {
                      if (typeof token === 'string') return <span key={i} className="text-zinc-300">{token}</span>;
                      if (token.type === 'added') {
                        return <span key={i} className="bg-emerald-500/20 text-emerald-400 px-1.5 py-0.5 rounded-md font-medium">{token.value}</span>;
                      }
                      if (token.type === 'removed') {
                        return <span key={i} className="bg-rose-500/20 text-rose-400 px-1.5 py-0.5 rounded-md font-medium line-through">{token.value}</span>;
                      }
                      return null;
                    })}
                  </div>
                ) : (
                  <div className="text-zinc-600 italic">Текст статьи не заполнен.</div>
                )}
              </div>
            </div>
          )}

        </div>

        {/* MODAL FOOTER */}
        <div className="p-6 border-t border-white/10 bg-black/40 flex justify-end shrink-0">
          <button 
            onClick={onClose} 
            className="px-8 py-3 bg-indigo-600 hover:bg-indigo-500 text-white text-sm font-extrabold rounded-xl shadow-lg shadow-indigo-500/20 border border-indigo-400/30 active:scale-95 transition-all"
          >
            Готово
          </button>
        </div>
      </motion.div>
    </div>
  );
};
