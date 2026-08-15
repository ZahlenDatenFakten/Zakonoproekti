import React, { useState, useRef, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { UploadCloud, X, Loader2, Plus, ArrowRight } from 'lucide-react';
import type { BillAttachment } from '../types/bill';
import { cn } from '../utils/cn';

import { uploadImage } from '../services/imageUploadService';

interface ImageUploaderProps {
  attachments: BillAttachment[];
  onChange: (attachments: BillAttachment[]) => void;
  disabled?: boolean;
}

export const ImageUploader: React.FC<ImageUploaderProps> = ({ attachments, onChange, disabled }) => {
  const [isUploading, setIsUploading] = useState<{ id: string, side: 'before' | 'after' } | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [expandedImage, setExpandedImage] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [focusedSlot, setFocusedSlot] = useState<{ id: string, side: 'before' | 'after' } | null>(null);

  const handleUploadFile = async (file: File, id: string, side: 'before' | 'after') => {
    if (!file.type.startsWith('image/')) {
      setError('Можно загружать только изображения (JPG, PNG, GIF и т.д.)');
      return;
    }
    if (file.size > 15 * 1024 * 1024) {
      setError('Файл слишком большой. Максимальный размер 15 МБ.');
      return;
    }

    setIsUploading({ id, side });
    setError(null);

    try {
      const url = await uploadImage(file);
      const newAttachments = attachments.map(att => {
        if (att.id === id) {
          return {
            ...att,
            [side === 'before' ? 'beforeUrl' : 'afterUrl']: url
          };
        }
        return att;
      });
      onChange(newAttachments);
    } catch (err: any) {
      setError(err.message || 'Ошибка загрузки');
      console.error(err);
    } finally {
      setIsUploading(null);
    }
  };

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>, id: string, side: 'before' | 'after') => {
    const files = e.target.files;
    if (files && files.length > 0) {
      handleUploadFile(files[0], id, side);
    }
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const removeAttachmentPair = (id: string) => {
    onChange(attachments.filter(att => att.id !== id));
  };

  const clearImage = (id: string, side: 'before' | 'after') => {
    onChange(attachments.map(att => {
      if (att.id === id) {
        return {
          ...att,
          [side === 'before' ? 'beforeUrl' : 'afterUrl']: undefined
        };
      }
      return att;
    }));
  };

  const addEmptyPair = () => {
    onChange([
      ...attachments,
      { id: Math.random().toString(36).substring(7) }
    ]);
  };

  // Global paste handler for focused slots
  useEffect(() => {
    const handlePaste = (e: ClipboardEvent) => {
      if (!focusedSlot || disabled) return;
      
      const items = e.clipboardData?.items;
      if (!items) return;

      for (let i = 0; i < items.length; i++) {
        if (items[i].type.indexOf('image') !== -1) {
          const file = items[i].getAsFile();
          if (file) {
            e.preventDefault();
            handleUploadFile(file, focusedSlot.id, focusedSlot.side);
            break; // Only upload one pasted image
          }
        }
      }
    };

    document.addEventListener('paste', handlePaste);
    return () => document.removeEventListener('paste', handlePaste);
  }, [focusedSlot, disabled, attachments]);

  const renderSlot = (pairId: string, side: 'before' | 'after', url?: string) => {
    const isUploadingThis = isUploading?.id === pairId && isUploading?.side === side;
    const isFocused = focusedSlot?.id === pairId && focusedSlot?.side === side;

    return (
      <div className="flex-1 flex flex-col gap-2">
        <span className={cn(
          "text-[10px] uppercase font-bold tracking-wider text-center",
          side === 'before' ? "text-rose-400" : "text-emerald-400"
        )}>
          {side === 'before' ? 'Было' : 'Стало'}
        </span>
        <div 
          tabIndex={!disabled ? 0 : -1}
          onFocus={() => !disabled && setFocusedSlot({ id: pairId, side })}
          onBlur={() => setFocusedSlot(null)}
          className={cn(
            "relative w-full aspect-square rounded-xl overflow-hidden border transition-all flex flex-col items-center justify-center group outline-none",
            url ? "bg-black/40 border-white/10 cursor-pointer" : "bg-black/20 border-dashed border-white/20",
            !url && !disabled && "hover:bg-white/5 hover:border-white/40 cursor-pointer",
            isFocused && !url && "border-indigo-500 bg-indigo-500/10 shadow-[0_0_15px_rgba(99,102,241,0.2)]"
          )}
          onClick={() => {
            if (url) {
              setExpandedImage(url);
            } else if (!disabled) {
              setFocusedSlot({ id: pairId, side });
              // Trigger file input by creating a temporary one
              const input = document.createElement('input');
              input.type = 'file';
              input.accept = 'image/*';
              input.onchange = (e: any) => handleFileSelect(e, pairId, side);
              input.click();
            }
          }}
        >
          {url ? (
            <>
              <img src={url} alt={side} className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-110" />
              {!disabled && (
                <button
                  type="button"
                  onClick={(e) => { e.stopPropagation(); clearImage(pairId, side); }}
                  className="absolute top-2 right-2 w-7 h-7 bg-black/60 hover:bg-rose-500/80 rounded-lg flex items-center justify-center opacity-0 group-hover:opacity-100 transition-all backdrop-blur-md"
                >
                  <X size={14} className="text-white" />
                </button>
              )}
            </>
          ) : (
            <>
              {isUploadingThis ? (
                <Loader2 size={24} className="text-indigo-400 animate-spin" />
              ) : (
                <div className="flex flex-col items-center opacity-40 group-hover:opacity-100 transition-opacity pointer-events-none">
                  <UploadCloud size={24} className="mb-2" />
                  {!disabled && (
                    <span className="text-[10px] text-center px-4 font-medium leading-tight text-white">
                      Кликните или нажмите <br/><span className="text-indigo-300">Ctrl+V</span> для вставки
                    </span>
                  )}
                </div>
              )}
            </>
          )}
        </div>
      </div>
    );
  };

  return (
    <div className="space-y-6">
      {attachments.length === 0 && disabled ? (
        <div className="text-sm text-zinc-500 italic py-4">Нет прикрепленных файлов</div>
      ) : (
        <div className="flex flex-col gap-6">
          {attachments.map((pair) => (
            <div key={pair.id} className="group relative flex items-center gap-4 p-4 rounded-2xl bg-white/[0.02] border border-white/5">
              {!disabled && (
                <button
                  type="button"
                  onClick={() => removeAttachmentPair(pair.id)}
                  className="absolute -top-2 -right-2 w-6 h-6 z-10 bg-rose-500 text-white rounded-full flex items-center justify-center opacity-0 hover:opacity-100 group-hover:opacity-100 transition-opacity shadow-lg"
                  title="Удалить пару"
                >
                  <X size={12} strokeWidth={3} />
                </button>
              )}
              
              {renderSlot(pair.id, 'before', pair.beforeUrl)}
              
              <div className="flex flex-col items-center justify-center shrink-0 text-zinc-600 px-2 pt-6">
                <ArrowRight size={20} />
              </div>
              
              {renderSlot(pair.id, 'after', pair.afterUrl)}
            </div>
          ))}

          {!disabled && (
            <button
              type="button"
              onClick={addEmptyPair}
              className="w-full py-4 rounded-2xl border border-dashed border-white/20 hover:border-indigo-500/50 hover:bg-indigo-500/5 flex flex-col items-center justify-center gap-2 transition-all text-zinc-400 hover:text-indigo-300"
            >
              <Plus size={24} />
              <span className="text-xs font-bold uppercase tracking-widest">Добавить пару фото</span>
            </button>
          )}
        </div>
      )}
      
      {error && (
        <div className="text-xs text-rose-400 flex items-center gap-2 bg-rose-500/10 px-3 py-2 rounded-lg border border-rose-500/20">
          <X size={14} />
          {error}
        </div>
      )}

      {/* Fullscreen Image Viewer */}
      {createPortal(
        <AnimatePresence>
          {expandedImage && (
            <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4">
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="absolute inset-0 bg-black/90 backdrop-blur-xl"
                onClick={() => setExpandedImage(null)}
              />
              <motion.div
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.95 }}
                className="relative max-w-full max-h-full flex items-center justify-center z-10"
                onClick={() => setExpandedImage(null)}
              >
                <img 
                  src={expandedImage} 
                  alt="Expanded view" 
                  className="max-w-full max-h-[90vh] object-contain rounded-lg shadow-2xl"
                  onClick={(e) => e.stopPropagation()}
                />
                <button
                  type="button"
                  onClick={() => setExpandedImage(null)}
                  className="absolute -top-4 -right-4 w-10 h-10 bg-rose-500 hover:bg-rose-600 text-white rounded-full flex items-center justify-center shadow-2xl transition-colors"
                >
                  <X size={20} strokeWidth={3} />
                </button>
              </motion.div>
            </div>
          )}
        </AnimatePresence>,
        document.body
      )}
    </div>
  );
};
