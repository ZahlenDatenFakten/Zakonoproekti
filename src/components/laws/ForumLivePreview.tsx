import React, { useState } from 'react';
import type { StateLawDocument, LawArticle } from '../../types/lawAst';
import { compileArticleBBCode, compileFullLawBBCode } from '../../services/bbcodeCompiler';
import { Copy, Check, Eye, Code2 } from 'lucide-react';
import { ft, mono, btnAccent } from '../../lib/ui';

import { bbcodeToHtml } from '../../services/bbcodeRenderer';
import { copyToClipboard } from '../../lib/clipboard';

interface ForumLivePreviewProps {
  law?: StateLawDocument;
  article?: LawArticle;
  rawBBCode?: string;
  onToast?: (type: 'success' | 'error' | 'info', text: string) => void;
  title?: string;
}

export const ForumLivePreview: React.FC<ForumLivePreviewProps> = ({
  law,
  article,
  rawBBCode,
  onToast,
  title = 'Предпросмотр на форуме GTA5RP'
}) => {
  const [viewMode, setViewMode] = useState<'preview' | 'bbcode'>('preview');
  const [isCopied, setIsCopied] = useState(false);

  // Compute BBCode
  const bbCode = rawBBCode || (article ? compileArticleBBCode(article) : law ? (law.activeBBCode || compileFullLawBBCode(law)) : '');

  const handleCopy = async () => {
    if (!bbCode) return;
    const ok = await copyToClipboard(bbCode);
    if (ok) {
      setIsCopied(true);
      if (onToast) onToast('success', 'BB-код скопирован в буфер обмена!');
      setTimeout(() => setIsCopied(false), 2500);
    } else {
      if (onToast) onToast('error', 'Не удалось скопировать в буфер.');
    }
  };

  const charCount = bbCode.length;
  const isApproachingLimit = charCount > 40000;
  const isOverLimit = charCount > 50000;

  return (
    <div
      style={{
        display: 'flex',
        flexDirection: 'column',
        height: '100%',
        background: '#151517',
        border: ft.strong,
        borderRadius: 4,
        overflow: 'hidden',
      }}
    >
      {/* Top Bar */}
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          padding: '10px 14px',
          background: '#1d1d20',
          borderBottom: '1px solid rgba(255,255,255,0.08)',
          flexWrap: 'wrap',
          gap: 10,
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <span style={{ fontSize: 12, fontWeight: 700, color: '#ecc781', fontFamily: mono, letterSpacing: '0.04em' }}>
            {title.toUpperCase()}
          </span>
          <span
            style={{
              fontSize: 11,
              padding: '2px 6px',
              background: isOverLimit ? 'rgba(239, 68, 68, 0.2)' : isApproachingLimit ? 'rgba(234, 179, 8, 0.2)' : 'rgba(255,255,255,0.05)',
              color: isOverLimit ? '#f87171' : isApproachingLimit ? '#facc15' : 'rgba(255,255,255,0.5)',
              fontFamily: mono,
              borderRadius: 2,
            }}
          >
            {charCount.toLocaleString()} символов {isOverLimit ? '(Превышен лимит поста!)' : ''}
          </span>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
          <div style={{ display: 'flex', background: 'rgba(0,0,0,0.3)', padding: 2, borderRadius: 3 }}>
            <button
              type="button"
              onClick={() => setViewMode('preview')}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: 5,
                padding: '4px 10px',
                fontSize: 11,
                fontWeight: 600,
                color: viewMode === 'preview' ? '#ecc781' : 'rgba(255,255,255,0.6)',
                background: viewMode === 'preview' ? 'rgba(236,199,129,0.15)' : 'transparent',
                border: 'none',
                cursor: 'pointer',
                borderRadius: 2,
              }}
            >
              <Eye size={13} />
              Вид
            </button>
            <button
              type="button"
              onClick={() => setViewMode('bbcode')}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: 5,
                padding: '4px 10px',
                fontSize: 11,
                fontWeight: 600,
                color: viewMode === 'bbcode' ? '#ecc781' : 'rgba(255,255,255,0.6)',
                background: viewMode === 'bbcode' ? 'rgba(236,199,129,0.15)' : 'transparent',
                border: 'none',
                cursor: 'pointer',
                borderRadius: 2,
              }}
            >
              <Code2 size={13} />
              BB-код
            </button>
          </div>

          <button
            type="button"
            onClick={handleCopy}
            style={{
              ...btnAccent,
              padding: '4px 12px',
              height: 28,
              fontSize: 11,
              display: 'flex',
              alignItems: 'center',
              gap: 6,
              background: isCopied ? '#10b981' : '#ecc781',
              color: '#151517',
              fontWeight: 700,
            }}
          >
            {isCopied ? <Check size={14} /> : <Copy size={13} />}
            {isCopied ? 'Скопировано!' : 'Скопировать BB-код'}
          </button>
        </div>
      </div>

      {/* Main Content Area */}
      <div style={{ flex: 1, overflowY: 'auto', padding: '16px', color: '#ffffff' }}>
        {viewMode === 'preview' ? (
          <div
            className="forum-bbcode-render"
            style={{
              fontFamily: 'Verdana, Geneva, sans-serif',
              fontSize: 14,
              lineHeight: 1.6,
              maxWidth: 820,
              margin: '0 auto',
              color: '#ffffff',
              wordBreak: 'break-word',
            }}
            dangerouslySetInnerHTML={{ __html: bbcodeToHtml(bbCode) }}
          />
        ) : (
          <pre
            style={{
              margin: 0,
              fontFamily: mono,
              fontSize: 12,
              lineHeight: 1.5,
              color: '#d4d4d8',
              whiteSpace: 'pre-wrap',
              wordBreak: 'break-word',
              background: '#0e0e10',
              padding: 14,
              border: '1px solid rgba(255,255,255,0.06)',
              borderRadius: 3,
            }}
          >
            {bbCode}
          </pre>
        )}
      </div>
    </div>
  );
};
