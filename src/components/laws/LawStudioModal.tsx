import React, { useState, useEffect, useMemo } from 'react';
import type { StateLawDocument, LawArticle } from '../../types/lawAst';
import { 
  getActiveLaw, 
  saveActiveLaw, 
  resetLawToDefault, 
  getLawPartBBCode 
} from '../../services/lawStorageService';
import { ForumLivePreview } from './ForumLivePreview';
import { LawSelectPicker } from './LawSelectPicker';
import { 
  X, 
  Search, 
  BookOpen, 
  Save, 
  RotateCcw, 
  Layers, 
  ChevronRight,
  Copy,
  Check,
  FileText
} from 'lucide-react';
import { R, ft, mono, btnAccent, btnOutline, shadow } from '../../lib/ui';

import { copyToClipboard } from '../../lib/clipboard';
import type { UserProfile } from '../../types/bill';
import { isSystemAdmin } from '../../services/securityService';
import { getUserProfile } from '../../services/storageService';

interface LawStudioModalProps {
  isOpen: boolean;
  onClose: () => void;
  onToast: (type: 'success' | 'error' | 'info', text: string) => void;
  initialLawId?: string;
  user?: UserProfile;
}

export const LawStudioModal: React.FC<LawStudioModalProps> = ({
  isOpen,
  onClose,
  onToast,
  initialLawId = 'road_code',
  user,
}) => {
  const activeUser = user || getUserProfile();
  const isAdmin = isSystemAdmin(activeUser);

  // Security gate: strictly prohibit access to non-admin users
  useEffect(() => {
    if (isOpen && !isAdmin) {
      onToast('error', 'Доступ запрещён: раздел «База законов» доступен исключительно системному администратору.');
      onClose();
    }
  }, [isOpen, isAdmin, onClose, onToast]);

  const [selectedLawId, setSelectedLawId] = useState<string>(initialLawId);
  const [law, setLaw] = useState<StateLawDocument>(() => getActiveLaw(initialLawId));
  const [selectedArticleId, setSelectedArticleId] = useState<string | null>(null);
  const [activePartIndex, setActivePartIndex] = useState<number | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [editingContent, setEditingContent] = useState('');
  const [editingSanction, setEditingSanction] = useState('');
  const [isEditing, setIsEditing] = useState(false);
  const [copiedPart, setCopiedPart] = useState<number | null>(null);
  const [copiedFull, setCopiedFull] = useState(false);

  // Sync with initialLawId when modal opens
  useEffect(() => {
    if (isOpen && initialLawId) {
      setSelectedLawId(initialLawId);
      const loaded = getActiveLaw(initialLawId);
      setLaw(loaded);
      setSelectedArticleId(null);
      setActivePartIndex(null);
    }
  }, [isOpen, initialLawId]);

  // When selectedLawId changes, load that law
  useEffect(() => {
    const loaded = getActiveLaw(selectedLawId);
    setLaw(loaded);
    setSelectedArticleId(null);
    setActivePartIndex(null);
  }, [selectedLawId]);

  // Sync with law updates
  useEffect(() => {
    const handleUpdate = (e: any) => {
      const updatedId = e.detail?.lawId;
      if (!updatedId || updatedId === selectedLawId) {
        setLaw(getActiveLaw(selectedLawId));
      }
    };
    window.addEventListener('legaldraft_law_updated', handleUpdate);
    return () => window.removeEventListener('legaldraft_law_updated', handleUpdate);
  }, [selectedLawId]);

  // Find currently selected article
  const selectedArticle: LawArticle | undefined = useMemo(() => {
    if (!selectedArticleId) return undefined;
    for (const ch of law.chapters) {
      const a = ch.articles.find((art) => art.id === selectedArticleId);
      if (a) return a;
    }
    return undefined;
  }, [law, selectedArticleId]);

  // When selection changes, update edit form
  useEffect(() => {
    if (selectedArticle) {
      setEditingContent(selectedArticle.content);
      const s = selectedArticle.sanctions?.[0]?.text || '';
      setEditingSanction(s);
      setIsEditing(false);
    }
  }, [selectedArticle]);

  // Handle saving direct article edit
  const handleSaveArticle = () => {
    if (!isAdmin) {
      onToast('error', 'Отказано в доступе: внесение изменений доступно только администратору.');
      return;
    }
    if (!selectedArticle) return;

    const updatedChapters = law.chapters.map((ch) => ({
      ...ch,
      articles: ch.articles.map((a) => {
        if (a.id === selectedArticle.id) {
          return {
            ...a,
            content: editingContent.trim(),
            rawBBCode: undefined, // Force recompilation with clean forum styling
            sanctions: editingSanction.trim() ? [{ id: 's_' + Date.now(), text: editingSanction.trim() }] : [],
            updatedAt: new Date().toISOString()
          };
        }
        return a;
      })
    }));

    const updatedLaw: StateLawDocument = {
      ...law,
      chapters: updatedChapters,
      version: (law.version || 1) + 1,
      updatedAt: new Date().toISOString()
    };

    const saved = saveActiveLaw(updatedLaw);
    setLaw(saved);
    setIsEditing(false);
    onToast('success', `Статья ${selectedArticle.articleNumber} обновлена! Редакция v${saved.version}`);
  };

  // Reset to default
  const handleResetToDefault = () => {
    if (!isAdmin) {
      onToast('error', 'Отказано в доступе: сброс закона доступен только администратору.');
      return;
    }
    if (window.confirm(`Сбросить «${law.title}» к исходной эталонной редакции? Все внесенные поправки будут отменены.`)) {
      const reset = resetLawToDefault(law.id);
      setLaw(reset);
      onToast('info', `«${law.title}» сброшен к исходной редакции v1`);
    }
  };

  // Copy specific part
  const handleCopyPart = async (partIndex: number) => {
    const code = getLawPartBBCode(law.id, partIndex);
    const ok = await copyToClipboard(code);
    if (ok) {
      setCopiedPart(partIndex);
      onToast('success', `BB-код Части ${partIndex} скопирован в буфер!`);
      setTimeout(() => setCopiedPart(null), 2500);
    } else {
      onToast('error', 'Не удалось скопировать.');
    }
  };

  // Copy full law
  const handleCopyFullLaw = async () => {
    const code = law.activeBBCode || '';
    const ok = await copyToClipboard(code);
    if (ok) {
      setCopiedFull(true);
      onToast('success', `Полный BB-код «${law.shortTitle || law.title}» скопирован!`);
      setTimeout(() => setCopiedFull(false), 2500);
    } else {
      onToast('error', 'Не удалось скопировать.');
    }
  };

  // Filtered chapters/articles
  const filteredChapters = useMemo(() => {
    return law.chapters
      .filter((ch) => activePartIndex === null || ch.partIndex === activePartIndex)
      .map((ch) => ({
        ...ch,
        articles: ch.articles.filter((a) => {
          const q = searchQuery.toLowerCase();
          return (
            a.articleNumber.toLowerCase().includes(q) ||
            a.content.toLowerCase().includes(q) ||
            (a.title && a.title.toLowerCase().includes(q))
          );
        })
      }))
      .filter((ch) => ch.articles.length > 0 || !searchQuery);
  }, [law.chapters, activePartIndex, searchQuery]);

  if (!isOpen || !isAdmin) return null;

  return (
    <div
      style={{
        position: 'fixed',
        inset: 0,
        zIndex: 9998,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '20px',
        background: 'rgba(0, 0, 0, 0.85)',
        backdropFilter: 'blur(8px)',
      }}
    >
      <div
        style={{
          width: '100%',
          maxWidth: 1320,
          height: '94vh',
          background: R.bgPanel,
          border: ft.strong,
          borderRadius: 6,
          display: 'flex',
          flexDirection: 'column',
          boxShadow: shadow.panel,
          overflow: 'hidden',
        }}
      >
        {/* Top Header */}
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            padding: '12px 20px',
            borderBottom: ft.edge,
            background: R.bgSubtle,
            gap: 16,
            flexWrap: 'wrap',
          }}
        >
          {/* Law Selector & Title */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 12, flex: '1 1 500px' }}>
            <div
              style={{
                width: 36,
                height: 36,
                borderRadius: 4,
                background: R.accentSubtle,
                border: `1px solid ${R.accentBorder}`,
                color: R.accent,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                flexShrink: 0,
              }}
            >
              <BookOpen size={18} />
            </div>

            <div style={{ flex: '1 1 auto' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 10, flexWrap: 'wrap' }}>
                {/* Searchable Custom Law Picker */}
                <LawSelectPicker
                  variant="compact"
                  value={selectedLawId}
                  onChange={(_title, _code, id) => {
                    if (id) setSelectedLawId(id);
                  }}
                  style={{ maxWidth: 360 }}
                />

                <span
                  style={{
                    fontSize: 10.5,
                    fontFamily: mono,
                    fontWeight: 700,
                    padding: '2px 8px',
                    borderRadius: 2,
                    background: 'rgba(236,199,129,0.15)',
                    color: R.accent,
                    border: ft.edge,
                  }}
                >
                  РЕДАКЦИЯ v{law.version}
                </span>

                <span style={{ fontSize: 11, color: R.textMuted }}>
                  {law.chapters.reduce((sum, ch) => sum + ch.articles.length, 0)} статей
                </span>
              </div>
            </div>
          </div>

          {/* Action Buttons */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
            {/* Multi-part Copy Buttons */}
            {law.partsMeta && law.partsMeta.length > 1 && (
              <div style={{ display: 'flex', alignItems: 'center', gap: 6, background: R.bgElevated, padding: '3px 8px', borderRadius: 4, border: ft.edge }}>
                <span style={{ fontSize: 10.5, fontFamily: mono, color: R.textMuted }}>ФОРУМ:</span>
                {law.partsMeta.map((p) => (
                  <button
                    key={p.partIndex}
                    type="button"
                    onClick={() => handleCopyPart(p.partIndex)}
                    style={{
                      ...btnOutline,
                      height: 26,
                      padding: '0 8px',
                      fontSize: 10.5,
                      fontWeight: 700,
                      display: 'flex',
                      alignItems: 'center',
                      gap: 4,
                      borderColor: copiedPart === p.partIndex ? '#10b981' : undefined,
                      color: copiedPart === p.partIndex ? '#10b981' : R.text,
                    }}
                  >
                    {copiedPart === p.partIndex ? <Check size={12} /> : <Copy size={11} />}
                    <span>Часть {p.partIndex}</span>
                  </button>
                ))}
              </div>
            )}

            {/* Copy Full Law */}
            <button
              type="button"
              onClick={handleCopyFullLaw}
              style={{
                ...btnOutline,
                height: 30,
                padding: '0 10px',
                fontSize: 11,
                display: 'flex',
                alignItems: 'center',
                gap: 6,
                borderColor: copiedFull ? '#10b981' : undefined,
                color: copiedFull ? '#10b981' : R.text,
              }}
            >
              {copiedFull ? <Check size={13} /> : <Copy size={12} />}
              <span>{copiedFull ? 'Скопировано!' : 'Весь закон целиком'}</span>
            </button>

            {/* Reset Law */}
            <button
              type="button"
              onClick={handleResetToDefault}
              title="Сбросить данный акт к исходной эталонной редакции"
              style={{
                ...btnOutline,
                padding: '0 10px',
                height: 30,
                fontSize: 11,
                display: 'flex',
                alignItems: 'center',
                gap: 6,
                color: R.textMuted,
              }}
            >
              <RotateCcw size={12} />
              <span>Сбросить к v1</span>
            </button>

            {/* Close */}
            <button
              type="button"
              onClick={onClose}
              style={{
                background: 'transparent',
                border: 'none',
                color: R.textMuted,
                cursor: 'pointer',
                padding: 6,
              }}
            >
              <X size={20} />
            </button>
          </div>
        </div>

        {/* 3-Column Layout */}
        <div style={{ display: 'flex', flex: 1, overflow: 'hidden' }}>
          {/* Column 1: Codex Navigator */}
          <div
            style={{
              width: 320,
              borderRight: ft.edge,
              display: 'flex',
              flexDirection: 'column',
              background: R.bg,
            }}
          >
            {/* Multi-Part Filter Tabs if law has parts */}
            {law.partsMeta && law.partsMeta.length > 1 && (
              <div style={{ display: 'flex', borderBottom: ft.edge, background: R.bgElevated, padding: '4px 8px', gap: 4, overflowX: 'auto' }}>
                <button
                  type="button"
                  onClick={() => setActivePartIndex(null)}
                  style={{
                    padding: '4px 8px',
                    fontSize: 11,
                    fontWeight: 700,
                    background: activePartIndex === null ? R.bgPanel : 'transparent',
                    color: activePartIndex === null ? R.accent : R.textMuted,
                    border: 'none',
                    borderRadius: 2,
                    cursor: 'pointer',
                  }}
                >
                  Все главы
                </button>
                {law.partsMeta.map((p) => (
                  <button
                    key={p.partIndex}
                    type="button"
                    onClick={() => setActivePartIndex(p.partIndex)}
                    style={{
                      padding: '4px 8px',
                      fontSize: 11,
                      fontWeight: 700,
                      background: activePartIndex === p.partIndex ? R.bgPanel : 'transparent',
                      color: activePartIndex === p.partIndex ? R.accent : R.textMuted,
                      border: 'none',
                      borderRadius: 2,
                      cursor: 'pointer',
                    }}
                  >
                    Ч. {p.partIndex}
                  </button>
                ))}
              </div>
            )}

            {/* Search */}
            <div style={{ padding: '12px', borderBottom: ft.edge }}>
              <div
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: 8,
                  background: R.bgSubtle,
                  border: ft.edge,
                  borderRadius: 4,
                  padding: '6px 10px',
                }}
              >
                <Search size={14} style={{ color: R.textMuted }} />
                <input
                  type="text"
                  placeholder="Поиск статьи или ключевых слов..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  style={{
                    background: 'transparent',
                    border: 'none',
                    outline: 'none',
                    color: R.text,
                    fontSize: 12,
                    width: '100%',
                  }}
                />
              </div>
            </div>

            {/* List */}
            <div style={{ flex: 1, overflowY: 'auto', padding: '10px' }}>
              <div
                onClick={() => setSelectedArticleId(null)}
                style={{
                  padding: '8px 12px',
                  borderRadius: 4,
                  cursor: 'pointer',
                  marginBottom: 8,
                  background: selectedArticleId === null ? R.accentSubtle : 'transparent',
                  color: selectedArticleId === null ? R.accent : R.text,
                  fontWeight: selectedArticleId === null ? 700 : 500,
                  fontSize: 12,
                  display: 'flex',
                  alignItems: 'center',
                  gap: 8,
                }}
              >
                <Layers size={14} />
                <span>Весь закон целиком</span>
              </div>

              {filteredChapters.map((chapter) => (
                <div key={chapter.id} style={{ marginBottom: 12 }}>
                  <div
                    style={{
                      fontSize: 11,
                      fontWeight: 700,
                      color: R.textMuted,
                      textTransform: 'uppercase',
                      fontFamily: mono,
                      padding: '4px 8px',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                      background: 'rgba(255,255,255,0.02)',
                      borderRadius: 3,
                    }}
                  >
                    <span>Гл. {chapter.numberRoman} {chapter.title ? `— ${chapter.title}` : ''}</span>
                    <span style={{ fontSize: 9.5 }}>{chapter.articles.length}</span>
                  </div>

                  <div style={{ display: 'flex', flexDirection: 'column', gap: 2, marginTop: 4 }}>
                    {chapter.articles.map((art) => {
                      const isSelected = selectedArticleId === art.id;
                      return (
                        <div
                          key={art.id}
                          onClick={() => setSelectedArticleId(art.id)}
                          style={{
                            padding: '6px 10px',
                            borderRadius: 4,
                            cursor: 'pointer',
                            background: isSelected ? R.accentSubtle : 'transparent',
                            color: isSelected ? R.accent : R.text,
                            fontSize: 12,
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'space-between',
                            borderLeft: isSelected ? `2px solid ${R.accent}` : '2px solid transparent',
                          }}
                        >
                          <div style={{ display: 'flex', alignItems: 'center', gap: 6, overflow: 'hidden' }}>
                            <span style={{ fontWeight: 700, fontFamily: mono, flexShrink: 0 }}>
                              {art.articleNumber}
                            </span>
                            <span
                              style={{
                                overflow: 'hidden',
                                textOverflow: 'ellipsis',
                                whiteSpace: 'nowrap',
                                fontSize: 11.5,
                                color: isSelected ? R.accent : R.textMuted,
                              }}
                            >
                              {art.title || art.content.slice(0, 35)}
                            </span>
                          </div>
                          <ChevronRight size={12} style={{ opacity: isSelected ? 1 : 0.3 }} />
                        </div>
                      );
                    })}
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Column 2: Article Editor / Viewer */}
          <div
            style={{
              width: 440,
              borderRight: ft.edge,
              display: 'flex',
              flexDirection: 'column',
              background: R.bgPanel,
              padding: 20,
              overflowY: 'auto',
            }}
          >
            {selectedArticle ? (
              <div style={{ display: 'flex', flexDirection: 'column', height: '100%', gap: 16 }}>
                <div>
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                    <span
                      style={{
                        fontFamily: mono,
                        fontSize: 11,
                        fontWeight: 700,
                        color: R.accent,
                        background: R.accentSubtle,
                        padding: '2px 8px',
                        borderRadius: 2,
                        border: `1px solid ${R.accentBorder}`,
                      }}
                    >
                      СТАТЬЯ {selectedArticle.articleNumber}
                    </span>

                    <button
                      type="button"
                      onClick={() => setIsEditing(!isEditing)}
                      style={{
                        ...btnOutline,
                        height: 28,
                        padding: '0 10px',
                        fontSize: 11,
                      }}
                    >
                      {isEditing ? 'Отмена' : 'Редактировать'}
                    </button>
                  </div>

                  {selectedArticle.title && (
                    <h4 style={{ fontSize: 14, fontWeight: 700, color: R.text, marginTop: 10, marginBottom: 4 }}>
                      {selectedArticle.title}
                    </h4>
                  )}
                </div>

                {isEditing ? (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 14, flex: 1 }}>
                    <div style={{ flex: 1, display: 'flex', flexDirection: 'column' }}>
                      <label style={{ fontSize: 11, fontWeight: 700, color: R.textMuted, marginBottom: 6 }}>
                        Текст диспозиции статьи:
                      </label>
                      <textarea
                        value={editingContent}
                        onChange={(e) => setEditingContent(e.target.value)}
                        style={{
                          flex: 1,
                          minHeight: 180,
                          background: R.bgInput,
                          border: ft.edge,
                          borderRadius: 4,
                          color: R.text,
                          padding: 12,
                          fontSize: 13,
                          lineHeight: 1.5,
                          outline: 'none',
                          resize: 'none',
                        }}
                      />
                    </div>

                    <div>
                      <label style={{ fontSize: 11, fontWeight: 700, color: R.textMuted, marginBottom: 6, display: 'block' }}>
                        Санкции (штрафы / лишение):
                      </label>
                      <input
                        type="text"
                        value={editingSanction}
                        onChange={(e) => setEditingSanction(e.target.value)}
                        placeholder="Например: Штраф до $10.000 и изъятие прав."
                        style={{
                          width: '100%',
                          height: 36,
                          background: R.bgInput,
                          border: ft.edge,
                          borderRadius: 4,
                          color: R.text,
                          padding: '0 12px',
                          fontSize: 13,
                          outline: 'none',
                        }}
                      />
                    </div>

                    <button
                      type="button"
                      onClick={handleSaveArticle}
                      style={{
                        ...btnAccent,
                        height: 38,
                        fontSize: 12,
                        fontWeight: 700,
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        gap: 8,
                      }}
                    >
                      <Save size={14} />
                      <span>Сохранить в Кодекс</span>
                    </button>
                  </div>
                ) : (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 14, flex: 1 }}>
                    <div
                      style={{
                        padding: 14,
                        background: R.bgSubtle,
                        border: ft.hair,
                        borderRadius: 4,
                        fontSize: 13,
                        lineHeight: 1.6,
                        color: R.text,
                        whiteSpace: 'pre-wrap',
                      }}
                    >
                      {selectedArticle.content}
                    </div>

                    {selectedArticle.clauses && selectedArticle.clauses.length > 0 && (
                      <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                        <span style={{ fontSize: 11, fontWeight: 700, color: R.textMuted, fontFamily: mono }}>
                          ИСКЛЮЧЕНИЯ И ПРИМЕЧАНИЯ:
                        </span>
                        {selectedArticle.clauses.map((c) => (
                          <div
                            key={c.id}
                            style={{
                              padding: 10,
                              background: 'rgba(236, 199, 129, 0.05)',
                              borderLeft: `2px solid ${R.accent}`,
                              fontSize: 12,
                              color: R.textSecondary,
                            }}
                          >
                            <span style={{ color: R.accent, fontWeight: 700 }}>{c.prefix || 'Исключение:'} </span>
                            {c.content}
                          </div>
                        ))}
                      </div>
                    )}

                    {selectedArticle.sanctions && selectedArticle.sanctions.length > 0 && (
                      <div>
                        <span style={{ fontSize: 11, fontWeight: 700, color: R.textMuted, fontFamily: mono }}>
                          САНКЦИИ:
                        </span>
                        <div
                          style={{
                            marginTop: 4,
                            padding: 10,
                            background: 'rgba(239, 68, 68, 0.08)',
                            borderLeft: '2px solid #ef4444',
                            fontSize: 12,
                            color: '#f87171',
                            fontStyle: 'italic',
                          }}
                        >
                          - {selectedArticle.sanctions[0].text}
                        </div>
                      </div>
                    )}
                  </div>
                )}
              </div>
            ) : (
              <div
                style={{
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: 'center',
                  justifyContent: 'center',
                  height: '100%',
                  textAlign: 'center',
                  color: R.textMuted,
                  gap: 12,
                }}
              >
                <div
                  style={{
                    width: 48,
                    height: 48,
                    borderRadius: '50%',
                    background: R.bgSubtle,
                    display: 'grid',
                    placeItems: 'center',
                    color: R.accent,
                  }}
                >
                  <FileText size={22} />
                </div>
                <div>
                  <h4 style={{ fontSize: 14, fontWeight: 700, color: R.text, margin: '0 0 4px 0' }}>
                    {law.title}
                  </h4>
                  <p style={{ fontSize: 12, maxWidth: 300, margin: 0, lineHeight: 1.5 }}>
                    Выберите любую статью в левой колонке для просмотра и точечного редактирования, либо
                    скопируйте готовый BB-код справа.
                  </p>
                </div>
              </div>
            )}
          </div>

          {/* Column 3: Forum BB-Code Live Preview */}
          <div style={{ flex: 1, display: 'flex', flexDirection: 'column', background: '#121214' }}>
            <ForumLivePreview
              law={law}
              rawBBCode={
                selectedArticle
                  ? undefined
                  : (activePartIndex !== null ? getLawPartBBCode(law.id, activePartIndex) : undefined)
              }
              onToast={onToast}
              title={
                selectedArticle
                  ? `Предпросмотр Статьи ${selectedArticle.articleNumber}`
                  : (activePartIndex !== null ? `Предпросмотр: Часть ${activePartIndex}` : `Предпросмотр всего Кодекса`)
              }
            />
          </div>
        </div>
      </div>
    </div>
  );
};
