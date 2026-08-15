import React, { useState, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { UploadCloud, X, Loader2 } from 'lucide-react';
import { cn } from '../utils/cn';

interface ImageUploaderProps {
  attachments: string[];
  onChange: (attachments: string[]) => void;
  disabled?: boolean;
}

export const ImageUploader: React.FC<ImageUploaderProps> = ({ attachments, onChange, disabled }) => {
  const [isUploading, setIsUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [expandedImage, setExpandedImage] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;

    setIsUploading(true);
    setError(null);

    const newAttachments = [...attachments];

    for (let i = 0; i < files.length; i++) {
      const file = files[i];
      if (!file.type.startsWith('image/')) {
        setError('Можно загружать только изображения (JPG, PNG, GIF и т.д.)');
        continue;
      }

      if (file.size > 15 * 1024 * 1024) {
        setError('Файл слишком большой. Максимальный размер 15 МБ.');
        continue;
      }

      const formData = new FormData();
      formData.append('image', file);

      try {
        const response = await fetch('/api/upload', {
          method: 'POST',
          body: formData,
        });
        
        if (!response.ok) {
          throw new Error('Ошибка при загрузке на сервер');
        }

        const data = await response.json();
        if (data.success && data.url) {
          newAttachments.push(data.url);
        } else {
          throw new Error(data.error || 'Неизвестная ошибка сервера');
        }
      } catch (err: any) {
        setError(err.message || 'Ошибка загрузки');
        console.error(err);
      }
    }

    setIsUploading(false);
    onChange(newAttachments);
    
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const removeAttachment = (indexToRemove: number) => {
    onChange(attachments.filter((_, idx) => idx !== indexToRemove));
  };

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap gap-4">
        {attachments.map((url, idx) => (
          <div key={idx} className="relative group w-32 h-32 rounded-xl overflow-hidden border border-white/10 bg-black/40 cursor-pointer" onClick={() => setExpandedImage(url)}>
            <img src={url} alt={`Приложение ${idx + 1}`} className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-110" />
            {!disabled && (
              <button
                type="button"
                onClick={(e) => { e.stopPropagation(); removeAttachment(idx); }}
                className="absolute top-2 right-2 w-7 h-7 bg-black/60 hover:bg-rose-500/80 rounded-lg flex items-center justify-center opacity-0 group-hover:opacity-100 transition-all backdrop-blur-md"
              >
                <X size={14} className="text-white" />
              </button>
            )}
          </div>
        ))}

        {!disabled && (
          <label className={cn(
            "w-32 h-32 flex flex-col items-center justify-center gap-2 rounded-xl border border-dashed transition-all cursor-pointer",
            isUploading ? "border-indigo-500/50 bg-indigo-500/5" : "border-white/20 hover:border-indigo-500 hover:bg-indigo-500/5 bg-black/20"
          )}>
            {isUploading ? (
              <Loader2 size={24} className="text-indigo-400 animate-spin" />
            ) : (
              <>
                <UploadCloud size={24} className="text-zinc-500" />
                <span className="text-[10px] uppercase font-bold tracking-wider text-zinc-500 text-center px-2">Загрузить фото</span>
              </>
            )}
            <input
              type="file"
              ref={fileInputRef}
              accept="image/*"
              multiple
              className="hidden"
              onChange={handleUpload}
              disabled={isUploading}
            />
          </label>
        )}
      </div>
      
      {error && (
        <div className="text-xs text-rose-400 flex items-center gap-2">
          <X size={14} />
          {error}
        </div>
      )}

      {/* Fullscreen Image Viewer */}
      <AnimatePresence>
        {expandedImage && (
          <div className="fixed inset-0 z-[200] flex items-center justify-center p-4">
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
              className="relative max-w-full max-h-full flex items-center justify-center"
              onClick={() => setExpandedImage(null)}
            >
              <img 
                src={expandedImage} 
                alt="Просмотр на весь экран" 
                className="max-w-[90vw] max-h-[90vh] object-contain rounded-xl shadow-2xl"
              />
              <button
                onClick={(e) => { e.stopPropagation(); setExpandedImage(null); }}
                className="absolute top-4 right-4 w-12 h-12 bg-black/50 hover:bg-white/10 rounded-full flex items-center justify-center backdrop-blur-md transition-colors"
              >
                <X size={24} className="text-white" />
              </button>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
};
