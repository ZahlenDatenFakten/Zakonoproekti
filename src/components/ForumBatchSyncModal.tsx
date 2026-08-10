import React, { useState, useRef } from 'react';
import { parseForumTextToLaw } from '../services/forumParserService';
import { parsePdfToStateLaw, extractTextFromPdf } from '../services/pdfParserService';
import { saveCustomStateLaw, clearAllStateLaws } from '../data/stateLaws';
import { saveStateLawToFirebase } from '../services/firebaseClient';
import { parsePdfWithAI } from '../services/aiParsingService';
import { X, Layers, FileText, Trash2, Upload, RefreshCw, BrainCircuit } from 'lucide-react';

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
  const [activeTab, setActiveTab] = useState<'pdf_upload' | 'text_paste'>('pdf_upload');
  const [rawTextInput, setRawTextInput] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);
  const [logMessages, setLogMessages] = useState<string[]>([]);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const geminiKey = localStorage.getItem('legaldraft_gemini_api_key') || '';
  const [useAIParsing, setUseAIParsing] = useState(!!geminiKey);

  const handlePdfUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;

    setIsProcessing(true);
    setLogMessages([`Начата обработка ${files.length} PDF-файлов...`]);

    let successCount = 0;

    for (let i = 0; i < files.length; i++) {
      const file = files[i];
      setLogMessages((prev) => [`[${i + 1}/${files.length}] Обработка: ${file.name}...`, ...prev]);

      try {
        let parsedLaw;
        
        if (useAIParsing && geminiKey) {
          setLogMessages((prev) => [`🧠 [${i + 1}/${files.length}] Извлечение текста для ИИ...`, ...prev]);
          const rawText = await extractTextFromPdf(file);
          parsedLaw = await parsePdfWithAI(
            rawText, 
            file.name, 
            geminiKey, 
            (msg) => setLogMessages((prev) => [`🧠 ${msg}`, ...prev])
          );
        } else {
          parsedLaw = await parsePdfToStateLaw(file);
        }

        saveCustomStateLaw(parsedLaw);
        await saveStateLawToFirebase(parsedLaw);
        successCount++;
        setLogMessages((prev) => [`✓ [${i + 1}/${files.length}] ${parsedLaw.title} — ${parsedLaw.articles.length} статей`, ...prev]);
      } catch (err: any) {
        setLogMessages((prev) => [`✗ [${i + 1}/${files.length}] Ошибка: ${err.message || 'Не удалось обработать файл'}`, ...prev]);
      }
    }

    setIsProcessing(false);
    onLawsUpdated();

    if (successCount > 0) {
      onToast('success', `Загружено ${successCount} из ${files.length} PDF-файлов.`);
    } else {
      onToast('error', 'Ни один PDF не был обработан. Проверьте формат файлов.');
    }

    // Reset file input
    if (fileInputRef.current) fileInputRef.current.value = '';
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
      onToast('success', `Закон «${parsedLaw.title}» — ${parsedLaw.articles.length} статей добавлено.`);
    } catch {
      onToast('error', 'Не удалось распарсить текст.');
    }
  };

  const handleClearAllLaws = () => {
    clearAllStateLaws();
    onLawsUpdated();
    onToast('info', 'Все законы удалены из базы.');
  };

  const tabStyle = (isActive: boolean): React.CSSProperties => ({
    fontSize: '0.8rem',
    fontWeight: 550,
    padding: '7px 14px',
    borderRadius: 'var(--radius-xs)',
    border: 'none',
    cursor: 'pointer',
    transition: 'all 0.15s ease',
    background: isActive ? 'var(--bg-4)' : 'transparent',
    color: isActive ? 'var(--text-primary)' : 'var(--text-tertiary)',
    display: 'flex',
    alignItems: 'center',
    gap: '6px'
  });

  return (
    <div className="modal-overlay" onClick={onClose} style={{ zIndex: 9000 }}>
      <div className="modal-content" onClick={(e) => e.stopPropagation()} style={{ maxWidth: '680px', padding: '24px' }}>

        {/* Header */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '18px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <Layers size={20} color="var(--text-primary)" />
            <div>
              <h3 style={{ fontSize: '1rem', fontWeight: 600, color: 'var(--text-primary)' }}>
                Управление реестром законов
              </h3>
              <p style={{ fontSize: '0.75rem', color: 'var(--text-tertiary)' }}>
                Загрузите PDF-файлы или вставьте текст для распознавания статей
              </p>
            </div>
          </div>
          <button onClick={onClose} className="btn btn-secondary" style={{ padding: '6px' }}>
            <X size={16} />
          </button>
        </div>

        {/* Tabs */}
        <div style={{ display: 'flex', gap: '2px', background: 'var(--bg-input)', padding: '3px', borderRadius: 'var(--radius-sm)', border: '1px solid var(--border-subtle)', marginBottom: '18px' }}>
          <button onClick={() => setActiveTab('pdf_upload')} style={tabStyle(activeTab === 'pdf_upload')}>
            <Upload size={13} /> Загрузка PDF
          </button>
          <button onClick={() => setActiveTab('text_paste')} style={tabStyle(activeTab === 'text_paste')}>
            <FileText size={13} /> Вставка текста
          </button>
        </div>

        {/* TAB 1: PDF Upload */}
        {activeTab === 'pdf_upload' && (
          <div>
            <div style={{
              border: '2px dashed var(--border-medium)',
              borderRadius: 'var(--radius-md)',
              padding: '32px 20px',
              textAlign: 'center',
              marginBottom: '16px',
              cursor: 'pointer',
              transition: 'border-color 0.2s ease',
              background: 'var(--bg-input)'
            }}
              onClick={() => fileInputRef.current?.click()}
              onDragOver={(e) => { e.preventDefault(); e.currentTarget.style.borderColor = 'var(--accent)'; }}
              onDragLeave={(e) => { e.currentTarget.style.borderColor = ''; }}
              onDrop={(e) => {
                e.preventDefault();
                e.currentTarget.style.borderColor = '';
                const dt = e.dataTransfer;
                if (dt.files.length > 0 && fileInputRef.current) {
                  const inputEl = fileInputRef.current;
                  const dataTransfer = new DataTransfer();
                  Array.from(dt.files).forEach(f => dataTransfer.items.add(f));
                  inputEl.files = dataTransfer.files;
                  inputEl.dispatchEvent(new Event('change', { bubbles: true }));
                }
              }}
            >
              {isProcessing ? (
                <RefreshCw size={28} className="spin" color="var(--accent)" />
              ) : (
                <Upload size={28} color="var(--text-tertiary)" />
              )}
              <p style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', marginTop: '10px' }}>
                {isProcessing ? 'Обработка файлов...' : 'Нажмите или перетащите PDF-файлы сюда'}
              </p>
              <p style={{ fontSize: '0.75rem', color: 'var(--text-tertiary)', marginTop: '4px' }}>
                Поддерживается загрузка нескольких файлов одновременно
              </p>
            </div>

            <input
              ref={fileInputRef}
              type="file"
              accept=".pdf"
              multiple
              style={{ display: 'none' }}
              onChange={handlePdfUpload}
            />

            <div style={{ marginTop: '16px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', background: 'var(--bg-input)', padding: '12px', borderRadius: '8px', border: '1px solid var(--border-subtle)' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <BrainCircuit size={16} color="var(--text-accent)" />
                <div>
                  <div style={{ fontSize: '0.85rem', fontWeight: 600, color: 'var(--text-primary)' }}>Глубокий ИИ-парсинг (Gemini)</div>
                  <div style={{ fontSize: '0.75rem', color: 'var(--text-tertiary)' }}>Максимальная точность структуры</div>
                </div>
              </div>
              
              <label style={{ display: 'flex', alignItems: 'center', cursor: geminiKey ? 'pointer' : 'not-allowed', opacity: geminiKey ? 1 : 0.5 }}>
                <input 
                  type="checkbox" 
                  checked={useAIParsing}
                  onChange={(e) => setUseAIParsing(e.target.checked)}
                  disabled={!geminiKey || isProcessing}
                  style={{ cursor: 'inherit', width: '16px', height: '16px' }}
                />
                <span style={{ fontSize: '0.8rem', marginLeft: '6px', color: 'var(--text-secondary)' }}>
                  {geminiKey ? 'Включить' : 'Нет API ключа'}
                </span>
              </label>
            </div>

            {/* Console Logs */}
            {logMessages.length > 0 && (
              <div style={{
                background: 'var(--bg-0)',
                border: '1px solid var(--border-subtle)',
                borderRadius: 'var(--radius-sm)',
                padding: '10px 12px',
                maxHeight: '160px',
                overflowY: 'auto',
                marginBottom: '16px',
                fontFamily: 'var(--font-mono)',
                fontSize: '0.75rem',
                color: 'var(--text-secondary)'
              }}>
                {logMessages.map((msg, idx) => (
                  <div key={idx} style={{ marginBottom: '2px' }}>{msg}</div>
                ))}
              </div>
            )}

            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <button onClick={handleClearAllLaws} className="btn btn-danger" style={{ fontSize: '0.78rem', padding: '6px 12px' }}>
                <Trash2 size={13} /> Очистить все законы
              </button>
              <button onClick={onClose} className="btn btn-secondary">Закрыть</button>
            </div>
          </div>
        )}

        {/* TAB 2: Text Paste */}
        {activeTab === 'text_paste' && (
          <div>
            <p style={{ fontSize: '0.82rem', color: 'var(--text-secondary)', marginBottom: '10px', lineHeight: 1.5 }}>
              Скопируйте текст закона и вставьте сюда. Парсер распознает структуру и разложит по статьям.
            </p>

            <textarea
              className="textarea-field"
              rows={8}
              placeholder="Вставьте скопированный текст закона..."
              value={rawTextInput}
              onChange={(e) => setRawTextInput(e.target.value)}
              style={{ fontSize: '0.82rem', marginBottom: '14px' }}
            />

            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px' }}>
              <button onClick={onClose} className="btn btn-secondary">Закрыть</button>
              <button onClick={handleParseBatchText} className="btn btn-primary" style={{ fontSize: '0.82rem' }}>
                <FileText size={14} /> Распарсить и добавить
              </button>
            </div>
          </div>
        )}

      </div>
    </div>
  );
};
