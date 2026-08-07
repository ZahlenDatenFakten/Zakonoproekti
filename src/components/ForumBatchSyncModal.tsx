import React, { useState } from 'react';
import { fetchLawFromForumUrl } from '../services/forumParserService';
import { saveCustomStateLaw } from '../data/stateLaws';
import { saveStateLawToFirebase } from '../services/firebaseClient';
import { X, Layers, Play, RefreshCw } from 'lucide-react';

interface ForumBatchSyncModalProps {
  onClose: () => void;
  onToast: (type: 'success' | 'error' | 'info', text: string) => void;
  onLawsUpdated: () => void;
}

export const ForumBatchSyncModal: React.FC<ForumBatchSyncModalProps> = ({
  onClose,
  onToast,
  onLawsUpdated
}) => {
  const [urlsInput, setUrlsInput] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);
  const [progressCount, setProgressCount] = useState(0);
  const [totalCount, setTotalCount] = useState(0);
  const [logMessages, setLogMessages] = useState<string[]>([]);

  const handleStartBatchSync = async () => {
    const lines = urlsInput
      .split('\n')
      .map((l) => l.trim())
      .filter((l) => l.length > 0 && l.startsWith('http'));

    if (lines.length === 0) {
      onToast('error', 'Вставьте список ссылок (по одной ссылке на строку)');
      return;
    }

    setIsProcessing(true);
    setProgressCount(0);
    setTotalCount(lines.length);
    setLogMessages([`Старт авто-синхронизации ${lines.length} тем с форума...`]);

    let successCount = 0;

    for (let i = 0; i < lines.length; i++) {
      const url = lines[i];
      setProgressCount(i + 1);
      
      try {
        setLogMessages((prev) => [`[${i + 1}/${lines.length}] Парсинг: ${url}`, ...prev]);
        const parsedLaw = await fetchLawFromForumUrl(url);
        
        saveCustomStateLaw(parsedLaw);
        await saveStateLawToFirebase(parsedLaw);
        
        successCount++;
        setLogMessages((prev) => [`✓ [${i + 1}/${lines.length}] Успешно: ${parsedLaw.title} (${parsedLaw.articles.length} статей)`, ...prev]);
      } catch (err: any) {
        if (err.message === 'CLOUDFLARE_PROTECTED') {
          setLogMessages((prev) => [`⚠️ [${i + 1}/${lines.length}] Cloudflare защита на теме: ${url}`, ...prev]);
        } else {
          setLogMessages((prev) => [`❌ [${i + 1}/${lines.length}] Ошибка: ${url}`, ...prev]);
        }
      }

      // Short delay between requests
      await new Promise((res) => setTimeout(res, 300));
    }

    setIsProcessing(false);
    onLawsUpdated();
    onToast('success', `Пакетная синхронизация завершена! Успешно спарсено: ${successCount} из ${lines.length} законов.`);
  };

  return (
    <div className="modal-overlay" onClick={onClose} style={{ zIndex: 9000 }}>
      <div className="modal-content" onClick={(e) => e.stopPropagation()} style={{ maxWidth: '680px', padding: '24px' }}>
        
        {/* Header */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '16px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <Layers size={22} color="var(--text-primary)" />
            <div>
              <h3 style={{ fontSize: '1.1rem', fontWeight: 600, color: 'var(--text-primary)' }}>
                🌐 Единый Реестр 36+ Ссылок Форума (Batch Auto-Sync)
              </h3>
              <p style={{ fontSize: '0.78rem', color: 'var(--text-tertiary)' }}>
                Пакетный авто-парсинг и синхронизация всех кодексов и законов
              </p>
            </div>
          </div>

          <button onClick={onClose} className="btn btn-secondary" style={{ padding: '6px' }}>
            <X size={16} />
          </button>
        </div>

        {/* Input Textarea for 36+ URLs */}
        <div style={{ marginBottom: '16px' }}>
          <label style={{ fontSize: '0.82rem', color: 'var(--text-secondary)', display: 'block', marginBottom: '6px' }}>
            Вставьте список ваших 36+ ссылок на темы форума (каждая ссылка с новой строки):
          </label>
          <textarea
            className="textarea-field"
            rows={7}
            disabled={isProcessing}
            placeholder={`https://forum.gtap5rp.com/threads/ugolovnyj-kodeks-shtata.123/\nhttps://forum.gtap5rp.com/threads/dorozhnyj-kodeks-shtata.456/\nhttps://forum.gtap5rp.com/threads/zakon-o-fib.789/`}
            value={urlsInput}
            onChange={(e) => setUrlsInput(e.target.value)}
            style={{ fontSize: '0.84rem', fontFamily: 'var(--font-mono)' }}
          />
        </div>

        {/* Progress Bar */}
        {isProcessing && (
          <div style={{ marginBottom: '16px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.8rem', color: 'var(--text-secondary)', marginBottom: '4px' }}>
              <span>Обработка законов...</span>
              <span>{progressCount} / {totalCount} ({Math.round((progressCount / (totalCount || 1)) * 100)}%)</span>
            </div>

            <div style={{ width: '100%', height: '8px', background: 'var(--bg-input)', borderRadius: '4px', overflow: 'hidden' }}>
              <div style={{ width: `${(progressCount / (totalCount || 1)) * 100}%`, height: '100%', background: 'linear-gradient(90deg, #6366f1, #34d399)', transition: 'width 0.2s ease' }}></div>
            </div>
          </div>
        )}

        {/* Console Log Area */}
        {logMessages.length > 0 && (
          <div style={{ background: '#0f172a', border: '1px solid var(--border-subtle)', borderRadius: '8px', padding: '10px 12px', maxHeight: '150px', overflowY: 'auto', marginBottom: '16px', fontFamily: 'var(--font-mono)', fontSize: '0.78rem', color: '#cbd5e1' }}>
            {logMessages.map((msg, idx) => (
              <div key={idx} style={{ marginBottom: '2px' }}>{msg}</div>
            ))}
          </div>
        )}

        {/* Action Buttons */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <span style={{ fontSize: '0.78rem', color: 'var(--text-tertiary)' }}>
            Синхронизируется с Firebase & LocalDB
          </span>

          <div style={{ display: 'flex', gap: '10px' }}>
            <button onClick={onClose} className="btn btn-secondary" style={{ fontSize: '0.85rem' }}>
              Закрыть
            </button>

            <button onClick={handleStartBatchSync} disabled={isProcessing} className="btn btn-primary" style={{ fontSize: '0.85rem' }}>
              {isProcessing ? <RefreshCw size={15} className="spin" /> : <Play size={15} />}
              <span>{isProcessing ? 'Синхронизация...' : '🚀 Запустить авто-синхронизацию 36 законов'}</span>
            </button>
          </div>
        </div>

      </div>
    </div>
  );
};
