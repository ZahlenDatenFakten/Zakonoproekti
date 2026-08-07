import React, { useState } from 'react';
import { fetchLawFromForumUrl, parseForumTextToLaw } from '../services/forumParserService';
import { saveCustomStateLaw } from '../data/stateLaws';
import { saveStateLawToFirebase } from '../services/firebaseClient';
import { X, Layers, Play, RefreshCw, FileText, AlertTriangle } from 'lucide-react';

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
  const [activeTab, setActiveTab] = useState<'url_batch' | 'text_batch'>('url_batch');
  const [urlsInput, setUrlsInput] = useState('');
  const [rawTextInput, setRawTextInput] = useState('');
  
  const [isProcessing, setIsProcessing] = useState(false);
  const [progressCount, setProgressCount] = useState(0);
  const [totalCount, setTotalCount] = useState(0);
  const [logMessages, setLogMessages] = useState<string[]>([]);
  const [blockedUrls, setBlockedUrls] = useState<string[]>([]);

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
    setBlockedUrls([]);

    let successCount = 0;
    const blocked: string[] = [];

    for (let i = 0; i < lines.length; i++) {
      const url = lines[i];
      setProgressCount(i + 1);
      
      try {
        setLogMessages((prev) => [`[${i + 1}/${lines.length}] Парсинг: ${url.substring(0, 60)}...`, ...prev]);
        const parsedLaw = await fetchLawFromForumUrl(url);
        
        saveCustomStateLaw(parsedLaw);
        await saveStateLawToFirebase(parsedLaw);
        
        successCount++;
        setLogMessages((prev) => [`✓ [${i + 1}/${lines.length}] Успешно спарсен: ${parsedLaw.title} (${parsedLaw.articles.length} статей)`, ...prev]);
      } catch (err: any) {
        if (err.message === 'CLOUDFLARE_PROTECTED') {
          blocked.push(url);
          setLogMessages((prev) => [`⚠️ [${i + 1}/${lines.length}] Защита Cloudflare (Нужен переход в браузере): ${url.substring(0, 50)}...`, ...prev]);
        } else {
          setLogMessages((prev) => [`❌ [${i + 1}/${lines.length}] Ошибка запроса темы: ${url.substring(0, 50)}...`, ...prev]);
        }
      }

      await new Promise((res) => setTimeout(res, 250));
    }

    setIsProcessing(false);
    setBlockedUrls(blocked);
    onLawsUpdated();

    if (blocked.length > 0) {
      onToast('info', `Спарсено ${successCount} из ${lines.length}. Темы под Cloudflare можно вставить списком текстов на 2-й вкладке!`);
    } else {
      onToast('success', `Пакетная синхронизация 100% завершена! Спарсено ${successCount} законов.`);
    }
  };

  const handleParseBatchText = () => {
    if (!rawTextInput.trim()) {
      onToast('error', 'Вставьте скопированный текст закона');
      return;
    }

    try {
      const parsedLaw = parseForumTextToLaw(rawTextInput.trim());
      saveCustomStateLaw(parsedLaw);
      saveStateLawToFirebase(parsedLaw);
      onLawsUpdated();
      setRawTextInput('');
      onToast('success', `Закон «${parsedLaw.title}» успешно спарсен и сохранен в базу (${parsedLaw.articles.length} статей)!`);
    } catch {
      onToast('error', 'Не удалось распарсить текст');
    }
  };

  return (
    <div className="modal-overlay" onClick={onClose} style={{ zIndex: 9000 }}>
      <div className="modal-content" onClick={(e) => e.stopPropagation()} style={{ maxWidth: '720px', padding: '24px' }}>
        
        {/* Header */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '16px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <Layers size={22} color="var(--text-primary)" />
            <div>
              <h3 style={{ fontSize: '1.1rem', fontWeight: 600, color: 'var(--text-primary)' }}>
                🌐 Единый Реестр 36+ Ссылок Форума (Batch Auto-Sync)
              </h3>
              <p style={{ fontSize: '0.78rem', color: 'var(--text-tertiary)' }}>
                Пакетная выкачка и создание единой базы кодексов и законов Штата
              </p>
            </div>
          </div>

          <button onClick={onClose} className="btn btn-secondary" style={{ padding: '6px' }}>
            <X size={16} />
          </button>
        </div>

        {/* Tabs */}
        <div style={{ display: 'flex', gap: '10px', borderBottom: '1px solid var(--border-subtle)', paddingBottom: '8px', marginBottom: '16px' }}>
          <button
            onClick={() => setActiveTab('url_batch')}
            className="btn btn-secondary"
            style={{
              fontSize: '0.82rem',
              padding: '6px 12px',
              background: activeTab === 'url_batch' ? 'var(--bg-input)' : 'transparent',
              color: activeTab === 'url_batch' ? 'var(--text-primary)' : 'var(--text-tertiary)',
              borderColor: activeTab === 'url_batch' ? 'var(--border-medium)' : 'transparent'
            }}
          >
            🌐 1. Авто-скачивание 36+ ссылок URL
          </button>

          <button
            onClick={() => setActiveTab('text_batch')}
            className="btn btn-secondary"
            style={{
              fontSize: '0.82rem',
              padding: '6px 12px',
              background: activeTab === 'text_batch' ? 'var(--bg-input)' : 'transparent',
              color: activeTab === 'text_batch' ? 'var(--text-primary)' : 'var(--text-tertiary)',
              borderColor: activeTab === 'text_batch' ? 'var(--border-medium)' : 'transparent'
            }}
          >
            📋 2. Мгновенный импорт любого скопированного закона (0.1 сек)
          </button>
        </div>

        {/* TAB 1: URL Batch */}
        {activeTab === 'url_batch' && (
          <div>
            <div style={{ marginBottom: '16px' }}>
              <label style={{ fontSize: '0.82rem', color: 'var(--text-secondary)', display: 'block', marginBottom: '6px' }}>
                Вставьте ваш список ссылок на темы форума (по одной ссылке на строку):
              </label>
              <textarea
                className="textarea-field"
                rows={7}
                disabled={isProcessing}
                placeholder={`https://forum.gta5rp.com/threads/sa-gov-ugolovno-administrativnyi-kodeks-shtata-san-andreas.1973527/\nhttps://forum.gta5rp.com/threads/sa-gov-zakon-o-ministerstve-finansov-shtata-san-andreas.1973496/`}
                value={urlsInput}
                onChange={(e) => setUrlsInput(e.target.value)}
                style={{ fontSize: '0.82rem', fontFamily: 'var(--font-mono)' }}
              />
            </div>

            {/* Progress Bar */}
            {isProcessing && (
              <div style={{ marginBottom: '16px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.8rem', color: 'var(--text-secondary)', marginBottom: '4px' }}>
                  <span>Обход ссылок форума...</span>
                  <span>{progressCount} / {totalCount} ({Math.round((progressCount / (totalCount || 1)) * 100)}%)</span>
                </div>

                <div style={{ width: '100%', height: '8px', background: 'var(--bg-input)', borderRadius: '4px', overflow: 'hidden' }}>
                  <div style={{ width: `${(progressCount / (totalCount || 1)) * 100}%`, height: '100%', background: 'linear-gradient(90deg, #6366f1, #34d399)', transition: 'width 0.2s ease' }}></div>
                </div>
              </div>
            )}

            {/* Cloudflare Protected Notice */}
            {blockedUrls.length > 0 && !isProcessing && (
              <div style={{ background: 'rgba(251, 191, 36, 0.12)', border: '1px solid rgba(251, 191, 36, 0.3)', borderRadius: '10px', padding: '12px 14px', marginBottom: '14px', fontSize: '0.82rem', color: '#facc15' }}>
                <div style={{ fontWeight: 600, display: 'flex', alignItems: 'center', gap: '6px', marginBottom: '4px' }}>
                  <AlertTriangle size={16} /> Часть тем ({blockedUrls.length}) заблокирована Cloudflare для автоматических ботов
                </div>
                <div>
                  Не бойтесь! Вы можете открыть заблокированную тему в соседней вкладке браузера, сделать <code>Ctrl+A</code> -&gt; <code>Ctrl+C</code> и вставить на 2-й вкладке. Парсер разберет весь закон за 0.1 секунды!
                </div>
              </div>
            )}

            {/* Console Logs */}
            {logMessages.length > 0 && (
              <div style={{ background: '#0f172a', border: '1px solid var(--border-subtle)', borderRadius: '8px', padding: '10px 12px', maxHeight: '140px', overflowY: 'auto', marginBottom: '16px', fontFamily: 'var(--font-mono)', fontSize: '0.78rem', color: '#cbd5e1' }}>
                {logMessages.map((msg, idx) => (
                  <div key={idx} style={{ marginBottom: '2px' }}>{msg}</div>
                ))}
              </div>
            )}

            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px' }}>
              <button onClick={onClose} className="btn btn-secondary">Закрыть</button>
              <button onClick={handleStartBatchSync} disabled={isProcessing} className="btn btn-primary" style={{ fontSize: '0.85rem' }}>
                {isProcessing ? <RefreshCw size={15} className="spin" /> : <Play size={15} />}
                <span>{isProcessing ? 'Загрузка...' : '🚀 Запустить авто-синхронизацию всех ссылок'}</span>
              </button>
            </div>
          </div>
        )}

        {/* TAB 2: Text Import */}
        {activeTab === 'text_batch' && (
          <div>
            <p style={{ fontSize: '0.82rem', color: 'var(--text-secondary)', marginBottom: '10px', lineHeight: 1.5 }}>
              Откройте тему с законом на форуме в браузере, выделите весь текст (<code>Ctrl+A</code>) -&gt; (<code>Ctrl+C</code>) и вставьте сюда. Парсер мгновенно распознает заголовок и разложит всё по статьям:
            </p>

            <textarea
              className="textarea-field"
              rows={8}
              placeholder="Вставьте скопированный текст закона с форума..."
              value={rawTextInput}
              onChange={(e) => setRawTextInput(e.target.value)}
              style={{ fontSize: '0.82rem', marginBottom: '14px' }}
            />

            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px' }}>
              <button onClick={onClose} className="btn btn-secondary">Закрыть</button>
              <button onClick={handleParseBatchText} className="btn btn-primary" style={{ fontSize: '0.85rem' }}>
                <FileText size={15} /> ⚡ Распарсить и добавить закон в базу (0.1 сек)
              </button>
            </div>
          </div>
        )}

      </div>
    </div>
  );
};
