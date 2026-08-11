import React, { useState } from 'react';
import type { Bill } from '../types/bill';
import { X, Copy, Check, FileText, Code, Sparkles, ShieldCheck } from 'lucide-react';

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
  const [tab, setTab] = useState<'visual' | 'bbcode' | 'plain'>('visual');
  const [copied, setCopied] = useState(false);

  const formatDate = (isoStr: string) => {
    const d = new Date(isoStr);
    return d.toLocaleDateString('ru-RU');
  };

  // Generate Forum BBCode
  const generateBBCode = () => {
    let code = `[ALIGN=center][SIZE=5][B]ОФИЦИАЛЬНЫЙ РЕЕСТР ЗАКОНОДАТЕЛЬНЫХ РЕФОРМ ШТАТА[/B][/SIZE]\n`;
    code += `[SIZE=4][B]УКАЗ / ПОСТАНОВЛЕНИЕ № SA-000[/B][/SIZE]\n`;
    code += `[SIZE=3][I]«${bill.targetLaw || bill.title}»[/I][/SIZE][/ALIGN]\n\n`;
    code += `[HR][/HR]\n\n`;
    code += `[B]Дата регистрации:[/B] ${formatDate(bill.updatedAt)}\n`;
    code += `[B]Инициатор / Автор:[/B] ${bill.author} (${bill.authorRole || 'Официальное лицо'})\n`;
    code += `[B]Статус акта:[/B] [COLOR=#3fb950][B]ВСТУПИЛ В ЗАКОННУЮ СИЛУ[/B][/COLOR]\n\n`;
    code += `[HR][/HR]\n\n`;
    code += `[SIZE=4][B]I. ПОЯСНИТЕЛЬНАЯ ЗАПИСКА[/B][/SIZE]\n`;
    code += `${bill.explanatoryNote || 'Настоящим реформируются действующие правовые нормы Штата.'}\n\n`;
    code += `[SIZE=4][B]II. РЕЕСТР ВНЕСЕННЫХ ИЗМЕНЕНИЙ В СТАТЬИ[/B][/SIZE]\n\n`;

    bill.comparisons.forEach((comp, idx) => {
      code += `[B]§${idx + 1}. ${comp.articleTitle}[/B]\n`;
      code += `[COLOR=#f85149][S]Было: ${comp.wasContent}[/S][/COLOR]\n`;
      code += `[COLOR=#3fb950][B]Стало: ${comp.becameContent}[/B][/COLOR]\n\n`;
    });

    code += `[HR][/HR]\n`;
    code += `[ALIGN=right][B]Федеральное Правительство Штата San Andreas[/B]\n`;
    code += `[I]Электронная подпись / Штамп реестра SA GOV TECH[/I][/ALIGN]`;
    return code;
  };

  // Generate Clean Formatted Text
  const generatePlainText = () => {
    let text = `====================================================\n`;
    text += `   ОФИЦИАЛЬНЫЙ РЕЕСТР ЗАКОНОДАТЕЛЬНЫХ РЕФОРМ ШТАТА\n`;
    text += `   УКАЗ / ПОСТАНОВЛЕНИЕ № SA-000\n`;
    text += `   «${bill.targetLaw || bill.title}»\n`;
    text += `====================================================\n\n`;
    text += `Дата ввода в силу: ${formatDate(bill.updatedAt)}\n`;
    text += `Автор реформы: ${bill.author} (${bill.authorRole || 'Официальное лицо'})\n`;
    text += `Статус: ВСТУПИЛ В ЗАКОННУЮ СИЛУ\n\n`;
    text += `----------------------------------------------------\n`;
    text += `I. ПОЯСНИТЕЛЬНАЯ ЗАПИСКА\n`;
    text += `----------------------------------------------------\n`;
    text += `${bill.explanatoryNote || 'Настоящим реформируются действующие правовые нормы Штата.'}\n\n`;
    text += `----------------------------------------------------\n`;
    text += `II. РЕДАКЦИЯ ИЗМЕНЕНИЙ В СТАТЬЯХ\n`;
    text += `----------------------------------------------------\n\n`;

    bill.comparisons.forEach((comp, idx) => {
      text += `§${idx + 1}. ${comp.articleTitle}\n`;
      text += `[— ДЕЙСТВОВАЛО]: ${comp.wasContent}\n`;
      text += `[+ ВСТУПИЛО В СИЛУ]: ${comp.becameContent}\n\n`;
    });

    text += `====================================================\n`;
    text += `Подписано и утверждено Администрацией Штата San Andreas\n`;
    return text;
  };

  const handleCopy = () => {
    const contentToCopy = tab === 'bbcode' ? generateBBCode() : generatePlainText();
    navigator.clipboard.writeText(contentToCopy);
    setCopied(true);
    if (onToast) onToast('success', 'Текст указа скопирован в буфер обмена!');
    setTimeout(() => setCopied(false), 2500);
  };

  return (
    <div className="modal-overlay animate-fade-in" style={{ zIndex: 7000 }}>
      <div className="modal-content" style={{ maxWidth: '900px', width: '92vw', maxHeight: '90vh', display: 'flex', flexDirection: 'column' }}>
        
        {/* HEADER */}
        <div className="modal-header">
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            <div style={{ width: '38px', height: '38px', borderRadius: 'var(--radius-md)', background: 'linear-gradient(135deg, #10b981 0%, #059669 100%)', display: 'flex', alignItems: 'center', justifyContent: 'center', boxShadow: '0 0 16px rgba(16, 185, 129, 0.3)' }}>
              <ShieldCheck size={20} color="#ffffff" />
            </div>
            <div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <h3 style={{ margin: 0, fontSize: '1.1rem', fontWeight: 800, color: 'var(--text-primary)' }}>
                  Сфера Публикации на Форуме Штата
                </h3>
                <span className="decree-stamp" style={{ borderColor: 'var(--success-border)', background: 'var(--success-bg)', color: 'var(--success-text)' }}>
                  ВСТУПИЛ В СИЛУ
                </span>
              </div>
              <p style={{ margin: '2px 0 0 0', fontSize: '0.76rem', color: 'var(--text-secondary)', fontFamily: 'var(--font-mono)' }}>
                Готовый высококонтрастный указ для 1-click копирования на форум сервера
              </p>
            </div>
          </div>

          <button onClick={onClose} className="btn btn-ghost" style={{ padding: '6px' }}>
            <X size={18} />
          </button>
        </div>

        {/* CONTROLS BAR */}
        <div style={{ padding: '14px 28px', background: 'var(--bg-surface-elevated)', borderBottom: '1px solid var(--border-subtle)', display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '12px' }}>
          
          {/* TABS */}
          <div style={{ display: 'flex', gap: '4px', background: 'var(--bg-input)', padding: '3px', borderRadius: 'var(--radius-pill)', border: '1px solid var(--border-subtle)' }}>
            <button
              onClick={() => setTab('visual')}
              className="btn btn-pill"
              style={{
                fontSize: '0.78rem',
                padding: '6px 14px',
                background: tab === 'visual' ? 'var(--primary-gradient)' : 'transparent',
                color: tab === 'visual' ? '#ffffff' : 'var(--text-secondary)',
                border: 'none'
              }}
            >
              <FileText size={14} /> Текст Указа
            </button>
            <button
              onClick={() => setTab('bbcode')}
              className="btn btn-pill"
              style={{
                fontSize: '0.78rem',
                padding: '6px 14px',
                background: tab === 'bbcode' ? 'var(--primary-gradient)' : 'transparent',
                color: tab === 'bbcode' ? '#ffffff' : 'var(--text-secondary)',
                border: 'none'
              }}
            >
              <Code size={14} /> BBCode (Форум)
            </button>
            <button
              onClick={() => setTab('plain')}
              className="btn btn-pill"
              style={{
                fontSize: '0.78rem',
                padding: '6px 14px',
                background: tab === 'plain' ? 'var(--primary-gradient)' : 'transparent',
                color: tab === 'plain' ? '#ffffff' : 'var(--text-secondary)',
                border: 'none'
              }}
            >
              <Sparkles size={14} /> Простой текст
            </button>
          </div>

          {/* COPY ACTION BUTTON */}
          <button 
            onClick={handleCopy}
            className="btn btn-primary btn-pill"
            style={{ padding: '8px 20px', fontSize: '0.84rem', background: copied ? 'var(--success-bg)' : undefined, color: copied ? 'var(--success-text)' : undefined, borderColor: copied ? 'var(--success-border)' : undefined }}
          >
            {copied ? <Check size={16} /> : <Copy size={16} />}
            {copied ? 'Скопировано в буфер!' : 'Скопировать для Форума'}
          </button>
        </div>

        {/* BODY */}
        <div className="modal-body" style={{ flex: 1, overflowY: 'auto', padding: '24px' }}>
          
          {tab === 'visual' && (
            <div style={{ background: '#0e111a', border: '1px solid var(--border-medium)', borderRadius: 'var(--radius-md)', padding: '32px', fontFamily: 'var(--font-sans)', color: '#f8fafc', lineHeight: 1.7 }}>
              
              <div style={{ textAlign: 'center', marginBottom: '24px', paddingBottom: '16px', borderBottom: '1px solid var(--border-subtle)' }}>
                <div style={{ fontSize: '0.76rem', color: 'var(--text-accent)', fontFamily: 'var(--font-mono)', fontWeight: 700, letterSpacing: '0.1em' }}>
                  ОФИЦИАЛЬНЫЙ РЕЕСТР ЗАКОНОДАТЕЛЬНЫХ РЕФОРМ ШТАТА SAN ANDREAS
                </div>
                <h2 style={{ fontSize: '1.4rem', fontWeight: 800, margin: '8px 0 4px 0', color: '#ffffff' }}>
                  УКАЗ / ПОСТАНОВЛЕНИЕ ОБ ИЗМЕНЕНИИ ЗАКОНА
                </h2>
                <div style={{ fontSize: '1.05rem', color: 'var(--text-secondary)', fontWeight: 600 }}>
                  «{bill.targetLaw || bill.title}»
                </div>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px', padding: '14px', background: 'rgba(255, 255, 255, 0.03)', borderRadius: 'var(--radius-sm)', marginBottom: '24px', fontSize: '0.84rem', fontFamily: 'var(--font-mono)' }}>
                <div><strong>Дата вступления в силу:</strong> {formatDate(bill.updatedAt)}</div>
                <div><strong>Автор реформы:</strong> {bill.author} ({bill.authorRole || 'Официальное лицо'})</div>
                <div><strong>Юридический статус:</strong> <span style={{ color: 'var(--success-text)', fontWeight: 700 }}>ВСТУПИЛ В ЗАКОННУЮ СИЛУ</span></div>
                <div><strong>Штамп Администрации:</strong> ПОДПИСАНО И ВНЕСЕНО</div>
              </div>

              <div style={{ marginBottom: '24px' }}>
                <h4 className="tech-label" style={{ fontSize: '0.8rem', color: 'var(--text-accent)', marginBottom: '8px' }}>
                  I. ПОЯСНИТЕЛЬНАЯ ЗАПИСКА
                </h4>
                <p style={{ margin: 0, fontSize: '0.92rem', color: 'var(--text-secondary)', background: 'var(--bg-surface)', padding: '14px', borderRadius: 'var(--radius-sm)', border: '1px solid var(--border-subtle)' }}>
                  {bill.explanatoryNote || 'Настоящим реформируются действующие правовые нормы Штата.'}
                </p>
              </div>

              <div>
                <h4 className="tech-label" style={{ fontSize: '0.8rem', color: 'var(--text-accent)', marginBottom: '12px' }}>
                  II. РЕДАКЦИЯ ИЗМЕНЕННЫХ СТАТЕЙ
                </h4>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                  {bill.comparisons.map((comp, idx) => (
                    <div key={comp.id} style={{ background: 'var(--bg-surface)', borderRadius: 'var(--radius-sm)', padding: '18px', border: '1px solid var(--border-subtle)' }}>
                      <div style={{ fontSize: '0.94rem', fontWeight: 700, color: '#ffffff', marginBottom: '10px' }}>
                        §{idx + 1}. {comp.articleTitle}
                      </div>
                      <div style={{ fontSize: '0.86rem', color: 'var(--danger-text)', textDecoration: 'line-through', background: 'var(--danger-bg)', padding: '8px 12px', borderRadius: '4px', marginBottom: '8px' }}>
                        Было: {comp.wasContent}
                      </div>
                      <div style={{ fontSize: '0.86rem', color: 'var(--success-text)', fontWeight: 600, background: 'var(--success-bg)', padding: '8px 12px', borderRadius: '4px' }}>
                        Стало: {comp.becameContent}
                      </div>
                    </div>
                  ))}
                </div>
              </div>

            </div>
          )}

          {tab === 'bbcode' && (
            <textarea
              readOnly
              className="textarea-field"
              value={generateBBCode()}
              style={{ width: '100%', height: '420px', fontFamily: 'var(--font-mono)', fontSize: '0.82rem', lineHeight: 1.5, background: '#090b10' }}
            />
          )}

          {tab === 'plain' && (
            <textarea
              readOnly
              className="textarea-field"
              value={generatePlainText()}
              style={{ width: '100%', height: '420px', fontFamily: 'var(--font-mono)', fontSize: '0.82rem', lineHeight: 1.5, background: '#090b10' }}
            />
          )}

        </div>

        {/* FOOTER */}
        <div className="modal-footer">
          <button className="btn btn-secondary btn-pill" onClick={onClose}>
            Закрыть
          </button>
          <button className="btn btn-primary btn-pill" onClick={handleCopy}>
            <Copy size={15} /> Скопировать для Форума
          </button>
        </div>

      </div>
    </div>
  );
};
