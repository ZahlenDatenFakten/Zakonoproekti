import React, { useState } from 'react';
import type { Bill } from '../types/bill';
import { X, Copy, Check, FileText, Columns, ShieldCheck } from 'lucide-react';

interface ForumExportModalProps {
  bill: Bill;
  onClose: () => void;
  onToast?: (type: 'success' | 'error' | 'info', text: string) => void;
}

export const ForumExportModal: React.FC<ForumExportModalProps> = ({
  bill,
  onClose,
  onToast
}) => {
  const [tab, setTab] = useState<'new_revision' | 'comparison'>('new_revision');
  const [copied, setCopied] = useState(false);

  const backdropMouseDownRef = React.useRef(false);

  // Generate clean new article text strictly for law forum threads
  const generateNewArticlesText = () => {
    return bill.comparisons
      .map((comp) => `${comp.articleTitle}\n${comp.becameContent}`)
      .join('\n\n');
  };

  // Generate full comparison protocol
  const generateComparisonText = () => {
    let text = `ПРОТОКОЛ ИЗМЕНЕНИЙ — ${bill.targetLaw || bill.title}\n`;
    text += `====================================================\n\n`;
    bill.comparisons.forEach((comp, idx) => {
      text += `§${idx + 1}. ${comp.articleTitle}\n`;
      text += `[БЫЛО]: ${comp.wasContent}\n`;
      text += `[СТАЛО]: ${comp.becameContent}\n\n`;
    });
    return text;
  };

  const handleCopy = () => {
    const textToCopy = tab === 'new_revision' ? generateNewArticlesText() : generateComparisonText();
    navigator.clipboard.writeText(textToCopy);
    setCopied(true);
    if (onToast) {
      onToast('success', tab === 'new_revision' ? 'Новая редакция статей скопирована в буфер обмена!' : 'Протокол изменений скопирован!');
    }
    setTimeout(() => setCopied(false), 2500);
  };

  return (
    <div 
      className="modal-overlay animate-fade-in" 
      onMouseDown={(e) => { backdropMouseDownRef.current = (e.target === e.currentTarget); }}
      onClick={(e) => {
        if (e.target === e.currentTarget && backdropMouseDownRef.current) {
          onClose();
        }
      }} 
      style={{ zIndex: 7000, padding: '20px' }}
    >
      <div 
        className="modal-content" 
        onClick={(e) => e.stopPropagation()} 
        style={{ 
          maxWidth: '860px', 
          width: '92vw', 
          maxHeight: '85vh', 
          display: 'flex', 
          flexDirection: 'column',
          overflow: 'hidden',
          position: 'relative'
        }}
      >
        
        {/* FIXED TOP MODAL HEADER — ALWAYS 100% VISIBLE AT TOP */}
        <div className="modal-header" style={{ flexShrink: 0, padding: '16px 24px', background: 'var(--bg-surface-elevated)', borderBottom: '1px solid var(--border-subtle)' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            <div style={{ width: '36px', height: '36px', borderRadius: 'var(--radius-md)', background: 'linear-gradient(135deg, #10b981 0%, #059669 100%)', display: 'flex', alignItems: 'center', justifyContent: 'center', boxShadow: '0 0 16px rgba(16, 185, 129, 0.3)', flexShrink: 0 }}>
              <ShieldCheck size={18} color="#ffffff" />
            </div>
            <div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <h3 style={{ margin: 0, fontSize: '1.05rem', fontWeight: 800, color: 'var(--text-primary)' }}>
                  Экспорт Новой Редакции на Форум
                </h3>
                <span className="decree-stamp" style={{ borderColor: 'var(--success-border)', background: 'var(--success-bg)', color: 'var(--success-text)', fontSize: '0.65rem' }}>
                  НОВАЯ РЕДАКЦИЯ
                </span>
              </div>
              <p style={{ margin: '2px 0 0 0', fontSize: '0.74rem', color: 'rgba(255, 255, 255, 0.65)', fontFamily: 'var(--font-mono)' }}>
                Готовый чистый текст новых статей для вставки в тему закона на форуме
              </p>
            </div>
          </div>

          <button onClick={onClose} className="btn btn-ghost" style={{ padding: '6px' }}>
            <X size={18} />
          </button>
        </div>

        {/* CONTROLS BAR */}
        <div style={{ padding: '12px 24px', background: 'var(--bg-surface)', borderBottom: '1px solid var(--border-subtle)', display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '12px', flexShrink: 0 }}>
          
          {/* TAB BUTTONS */}
          <div style={{ display: 'flex', gap: '4px', background: 'var(--bg-input)', padding: '3px', borderRadius: 'var(--radius-pill)', border: '1px solid var(--border-subtle)' }}>
            <button
              onClick={() => setTab('new_revision')}
              className="btn btn-pill"
              style={{
                fontSize: '0.78rem',
                padding: '6px 16px',
                fontWeight: 600,
                background: tab === 'new_revision' ? 'var(--primary-gradient)' : 'transparent',
                color: tab === 'new_revision' ? '#ffffff' : 'var(--text-secondary)',
                border: 'none'
              }}
            >
              <FileText size={14} /> 📜 Новая редакция статей
            </button>
            <button
              onClick={() => setTab('comparison')}
              className="btn btn-pill"
              style={{
                fontSize: '0.78rem',
                padding: '6px 16px',
                fontWeight: 600,
                background: tab === 'comparison' ? 'var(--primary-gradient)' : 'transparent',
                color: tab === 'comparison' ? '#ffffff' : 'var(--text-secondary)',
                border: 'none'
              }}
            >
              <Columns size={14} /> 🔍 Сравнение (Было / Стало)
            </button>
          </div>

          {/* COPY ACTION BUTTON */}
          <button 
            onClick={handleCopy}
            className="btn btn-primary btn-pill"
            style={{ padding: '8px 20px', fontSize: '0.84rem', background: copied ? 'var(--success-bg)' : undefined, color: copied ? 'var(--success-text)' : undefined, borderColor: copied ? 'var(--success-border)' : undefined }}
          >
            {copied ? <Check size={16} /> : <Copy size={16} />}
            {copied ? 'Скопировано!' : 'Скопировать новую редакцию'}
          </button>
        </div>

        {/* SCROLLABLE BODY */}
        <div className="modal-body" style={{ flex: 1, overflowY: 'auto', padding: '24px' }}>
          
          {tab === 'new_revision' && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
              <div style={{ fontSize: '0.78rem', color: 'rgba(255, 255, 255, 0.65)', fontFamily: 'var(--font-mono)', padding: '10px 14px', background: 'rgba(56, 189, 248, 0.08)', borderRadius: 'var(--radius-sm)', border: '1px solid rgba(56, 189, 248, 0.2)' }}>
                💡 <strong>Инструкция для форума:</strong> Скопируйте данный готовый текст и замените им соответствующие статьи в теме закона на форуме.
              </div>

              {bill.comparisons.map((comp, idx) => (
                <div key={comp.id} style={{ background: '#0e111a', border: '1px solid var(--border-medium)', borderRadius: 'var(--radius-md)', padding: '20px' }}>
                  <div style={{ fontSize: '0.96rem', fontWeight: 700, color: 'var(--text-accent)', marginBottom: '10px', fontFamily: 'var(--font-mono)' }}>
                    {comp.articleTitle || `Статья ${idx + 1}`}
                  </div>
                  <div style={{ fontSize: '0.92rem', color: '#ffffff', lineHeight: 1.65, whiteSpace: 'pre-wrap', background: 'var(--bg-surface)', padding: '14px', borderRadius: 'var(--radius-sm)', border: '1px solid var(--border-subtle)' }}>
                    {comp.becameContent || <span style={{ opacity: 0.4 }}>Текст отсутствуют</span>}
                  </div>
                </div>
              ))}
            </div>
          )}

          {tab === 'comparison' && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
              {bill.comparisons.map((comp, idx) => (
                <div key={comp.id} style={{ background: '#0e111a', border: '1px solid var(--border-medium)', borderRadius: 'var(--radius-md)', padding: '20px' }}>
                  <div style={{ fontSize: '0.94rem', fontWeight: 700, color: 'var(--text-primary)', marginBottom: '12px' }}>
                    §{idx + 1}. {comp.articleTitle}
                  </div>
                  <div style={{ fontSize: '0.86rem', color: 'var(--danger-text)', background: 'var(--danger-bg)', padding: '10px 14px', borderRadius: '6px', marginBottom: '8px', border: '1px solid var(--danger-border)', lineHeight: 1.6 }}>
                    <strong>[БЫЛО]:</strong> {comp.wasContent}
                  </div>
                  <div style={{ fontSize: '0.86rem', color: 'var(--success-text)', fontWeight: 600, background: 'var(--success-bg)', padding: '10px 14px', borderRadius: '6px', border: '1px solid var(--success-border)', lineHeight: 1.6 }}>
                    <strong>[СТАЛО]:</strong> {comp.becameContent}
                  </div>
                </div>
              ))}
            </div>
          )}

        </div>

        {/* FIXED FOOTER */}
        <div className="modal-footer" style={{ flexShrink: 0 }}>
          <button className="btn btn-secondary btn-pill" onClick={onClose}>
            Закрыть
          </button>
          <button className="btn btn-primary btn-pill" onClick={handleCopy}>
            <Copy size={15} /> Скопировать новую редакцию
          </button>
        </div>

      </div>
    </div>
  );
};
