import React, { useState, useMemo, useEffect } from 'react';
import type { Bill } from '../../types/bill';
import type { StateLawDocument, LawPatchResult } from '../../types/lawAst';
import { getActiveLaw, patchLawWithBill, findLawByTitleOrCode, getLawPartBBCode } from '../../services/lawStorageService';
import { copyToClipboard } from '../../lib/clipboard';
import { ForumLivePreview } from './ForumLivePreview';
import { 
  X, 
  CheckCircle2, 
  Zap, 
  Copy, 
  Check, 
  Layers, 
  Sparkles
} from 'lucide-react';
import { R, ft, mono, btnAccent, btnOutline, shadow } from '../../lib/ui';
import { isSystemAdmin } from '../../services/securityService';
import { getUserProfile } from '../../services/storageService';

interface EnactLawModalProps {
  bill: Bill;
  isOpen: boolean;
  onClose: () => void;
  onEnacted: (updatedBill: Bill, updatedLaw: StateLawDocument) => void;
  onToast: (type: 'success' | 'error' | 'info', text: string) => void;
}

export const EnactLawModal: React.FC<EnactLawModalProps> = ({
  bill,
  isOpen,
  onClose,
  onEnacted,
  onToast,
}) => {
  const activeUser = getUserProfile();
  const isAdmin = isSystemAdmin(activeUser);

  useEffect(() => {
    if (isOpen && !isAdmin) {
      onToast('error', 'Внесение изменений в законы разрешено исключительно администратору.');
      onClose();
    }
  }, [isOpen, isAdmin, onClose, onToast]);

  // Dynamically resolve target law from the bill
  const initialTargetLaw = useMemo(() => {
    return findLawByTitleOrCode(bill.targetLaw) || getActiveLaw('road_code');
  }, [bill.targetLaw]);

  const [currentLaw, setCurrentLaw] = useState<StateLawDocument>(initialTargetLaw);
  const [patchResult, setPatchResult] = useState<LawPatchResult | null>(null);
  const [copiedArticle, setCopiedArticle] = useState<string | null>(null);
  const [copiedPart, setCopiedPart] = useState<number | null>(null);
  const [copiedFull, setCopiedFull] = useState(false);
  const [selectedArticleNum, setSelectedArticleNum] = useState<string | null>(null);
  const [activeLawId, setActiveLawId] = useState<string>(initialTargetLaw.id);

  // Sync state whenever modal is opened or target bill changes
  useEffect(() => {
    if (isOpen) {
      setCurrentLaw(initialTargetLaw);
      setActiveLawId(initialTargetLaw.id);
      setPatchResult(null);
      setCopiedArticle(null);
      setCopiedPart(null);
      setCopiedFull(false);
      setSelectedArticleNum(null);
    }
  }, [isOpen, initialTargetLaw, bill.id]);

  // Handle clicking "Внести"
  const handleExecuteEnact = () => {
    if (!isAdmin) {
      onToast('error', 'Отказано в доступе: внесение изменений доступно только администратору.');
      return;
    }
    try {
      const result = patchLawWithBill(bill, initialTargetLaw.id);
      setPatchResult(result);
      setCurrentLaw(result.updatedLaw);
      setActiveLawId(result.updatedLaw.id);

      if (result.affectedArticleNumbers.length > 0) {
        setSelectedArticleNum(result.affectedArticleNumbers[0]);
      }

      // Mark bill status as officially enacted
      const affectedTitles = result.multiLawResults
        ? Object.values(result.multiLawResults).map(r => `${r.updatedLaw.shortTitle || r.updatedLaw.title} (v${r.updatedLaw.version})`).join(', ')
        : `${result.updatedLaw.title} (Редакция v${result.updatedLaw.version})`;

      const updatedBill: Bill = {
        ...bill,
        status: 'approved',
        statusReason: `Официально внесён в реестр: ${affectedTitles}`,
        updatedAt: new Date().toISOString()
      };

      onEnacted(updatedBill, result.updatedLaw);
      onToast('success', `Поправки внесены! База законов успешно синхронизирована.`);
    } catch (err: any) {
      console.error('Enact error:', err);
      onToast('error', 'Ошибка при обновлении закона: ' + (err.message || 'Неизвестная ошибка'));
    }
  };

  // Switch active law when examining multi-law result
  const handleSelectLawTab = (lawId: string) => {
    if (!patchResult?.multiLawResults?.[lawId]) return;
    const targetSubResult = patchResult.multiLawResults[lawId];
    setActiveLawId(lawId);
    setCurrentLaw(targetSubResult.updatedLaw);
    if (targetSubResult.affectedArticleNumbers.length > 0) {
      setSelectedArticleNum(targetSubResult.affectedArticleNumbers[0]);
    }
  };

  const handleCopyArticle = async (artNum: string) => {
    const code = patchResult?.articleBBCodes[artNum];
    if (!code) return;
    const ok = await copyToClipboard(code);
    if (ok) {
      setCopiedArticle(artNum);
      onToast('success', `BB-код статьи ${artNum} скопирован в буфер!`);
      setTimeout(() => setCopiedArticle(null), 2500);
    } else {
      onToast('error', 'Не удалось скопировать.');
    }
  };

  const handleCopyPart = async (partIndex: number) => {
    const code = patchResult?.partBBCodes?.[partIndex] || getLawPartBBCode(currentLaw.id, partIndex);
    if (!code) return;
    const ok = await copyToClipboard(code);
    if (ok) {
      setCopiedPart(partIndex);
      onToast('success', `BB-код Части ${partIndex} скопирован в буфер!`);
      setTimeout(() => setCopiedPart(null), 2500);
    } else {
      onToast('error', 'Не удалось скопировать.');
    }
  };

  const handleCopyFullLaw = async () => {
    const code = patchResult ? patchResult.fullLawBBCode : currentLaw.activeBBCode || '';
    if (!code) return;
    const ok = await copyToClipboard(code);
    if (ok) {
      setCopiedFull(true);
      onToast('success', `Полный BB-код «${currentLaw.title}» скопирован в буфер!`);
      setTimeout(() => setCopiedFull(false), 2500);
    } else {
      onToast('error', 'Не удалось скопировать.');
    }
  };

  if (!isOpen || !isAdmin) return null;

  return (
    <div
      style={{
        position: 'fixed',
        inset: 0,
        zIndex: 9999,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '24px',
        background: 'rgba(0, 0, 0, 0.85)',
        backdropFilter: 'blur(8px)',
      }}
    >
      <div
        style={{
          width: '100%',
          maxWidth: 1100,
          height: '90vh',
          maxHeight: 850,
          background: R.bgPanel,
          border: ft.strong,
          borderRadius: 6,
          display: 'flex',
          flexDirection: 'column',
          boxShadow: shadow.panel,
          overflow: 'hidden',
        }}
      >
        {/* Header */}
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            padding: '16px 20px',
            borderBottom: ft.edge,
            background: R.bgSubtle,
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
            <div
              style={{
                width: 36,
                height: 36,
                borderRadius: 4,
                background: patchResult ? 'rgba(16, 185, 129, 0.15)' : R.accentSubtle,
                border: `1px solid ${patchResult ? 'rgba(16, 185, 129, 0.4)' : R.accentBorder}`,
                color: patchResult ? '#10b981' : R.accent,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
              }}
            >
              {patchResult ? <CheckCircle2 size={20} /> : <Zap size={20} />}
            </div>
            <div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <h3 style={{ fontSize: 16, fontWeight: 700, color: R.text, margin: 0 }}>
                  Внесение в закон: {currentLaw.title}
                </h3>
                <span
                  style={{
                    fontSize: 10,
                    fontFamily: mono,
                    fontWeight: 700,
                    padding: '2px 6px',
                    borderRadius: 2,
                    background: patchResult ? 'rgba(16, 185, 129, 0.2)' : R.bgSubtle,
                    color: patchResult ? '#10b981' : R.accent,
                    border: ft.edge,
                  }}
                >
                  {patchResult ? `РЕДАКЦИЯ v${patchResult.updatedLaw.version}` : `ТЕКУЩАЯ v${currentLaw.version}`}
                </span>
              </div>
              <p style={{ fontSize: 12, color: R.textMuted, margin: '2px 0 0 0' }}>
                Законопроект: {bill.title || bill.targetLaw} (Автор: {bill.author})
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            style={{
              background: 'transparent',
              border: 'none',
              color: R.textMuted,
              cursor: 'pointer',
              padding: 6,
              borderRadius: 4,
            }}
          >
            <X size={20} />
          </button>
        </div>

        {/* Content Body - Split View */}
        <div style={{ display: 'flex', flex: 1, overflow: 'hidden' }}>
          {/* Left Column: Diff & Enactment Action */}
          <div
            style={{
              width: '45%',
              borderRight: ft.edge,
              display: 'flex',
              flexDirection: 'column',
              background: R.bg,
              overflowY: 'auto',
              padding: 20,
              gap: 16,
            }}
          >
            {/* Status Banner */}
            {!patchResult ? (
              <div
                style={{
                  padding: 14,
                  background: 'rgba(236, 199, 129, 0.08)',
                  border: `1px solid ${R.accentBorder}`,
                  borderRadius: 4,
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 4 }}>
                  <Sparkles size={16} style={{ color: R.accent }} />
                  <span style={{ fontSize: 13, fontWeight: 700, color: R.text }}>
                    Готово к внесению в Кодекс
                  </span>
                </div>
                <p style={{ fontSize: 12, color: R.textMuted, margin: 0, lineHeight: 1.5 }}>
                  Нажмите кнопку ниже, чтобы автоматически обновить статьи в памяти фронтенда. BB-код закона
                  сформируется моментально, и все последующие законопроекты будут опираться на эту новую редакцию.
                </p>
              </div>
            ) : (
              <div
                style={{
                  padding: 14,
                  background: 'rgba(16, 185, 129, 0.1)',
                  border: '1px solid rgba(16, 185, 129, 0.3)',
                  borderRadius: 4,
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 4 }}>
                  <CheckCircle2 size={16} style={{ color: '#10b981' }} />
                  <span style={{ fontSize: 13, fontWeight: 700, color: '#10b981' }}>
                    Редакция успешно обновлена!
                  </span>
                </div>
                <p style={{ fontSize: 12, color: R.textMuted, margin: 0, lineHeight: 1.5 }}>
                  Кодекс v{patchResult.updatedLaw.version} сохранён во фронтенде. Теперь скопируйте готовый BB-код для вставки на форум GTA5RP.
                </p>
              </div>
            )}

            {/* Multi-law Law Tabs if bill touched multiple laws */}
            {patchResult?.multiLawResults && Object.keys(patchResult.multiLawResults).length > 1 && (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                <span style={{ fontSize: 10.5, fontFamily: mono, color: R.textMuted, textTransform: 'uppercase', letterSpacing: '0.04em' }}>
                  Затронутые нормативно-правовые акты:
                </span>
                <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
                  {Object.entries(patchResult.multiLawResults).map(([lawKey, subRes]) => {
                    const isSelected = activeLawId === lawKey;
                    return (
                      <button
                        key={lawKey}
                        type="button"
                        onClick={() => handleSelectLawTab(lawKey)}
                        style={{
                          padding: '5px 10px',
                          fontSize: 11,
                          fontWeight: 700,
                          background: isSelected ? R.accentSubtle : R.bgPanel,
                          color: isSelected ? R.accent : R.textMuted,
                          border: isSelected ? `1px solid ${R.accent}` : ft.hair,
                          borderRadius: 3,
                          cursor: 'pointer',
                          display: 'inline-flex',
                          alignItems: 'center',
                          gap: 5,
                        }}
                      >
                        <Layers size={12} color={isSelected ? R.accent : R.textMuted} />
                        <span>{subRes.updatedLaw.code ? `[${subRes.updatedLaw.code}] ` : ''}{subRes.updatedLaw.shortTitle || subRes.updatedLaw.title}</span>
                        <span style={{ fontSize: 10, opacity: 0.75, fontFamily: mono }}>v{subRes.updatedLaw.version}</span>
                      </button>
                    );
                  })}
                </div>
              </div>
            )}

            {/* List of Affected Articles / Amendments */}
            <div>
              <span style={{ fontSize: 11, fontWeight: 700, color: R.textMuted, textTransform: 'uppercase', fontFamily: mono, letterSpacing: '0.06em' }}>
                Поправки к внесению:
              </span>

              <div style={{ display: 'flex', flexDirection: 'column', gap: 10, marginTop: 8 }}>
                {bill.isTotalReform ? (
                  <div style={{ padding: 12, background: R.bgPanel, border: ft.strong, borderRadius: 4 }}>
                    <div style={{ fontWeight: 700, fontSize: 13, color: R.accent, marginBottom: 6 }}>
                      📜 Общая реформа законодательного акта
                    </div>
                    <div style={{ fontSize: 12, color: R.textMuted, maxHeight: 150, overflowY: 'auto', whiteSpace: 'pre-wrap' }}>
                      {bill.totalReformContent}
                    </div>
                  </div>
                ) : (
                  bill.comparisons.map((comp, idx) => (
                    <div
                      key={comp.id || idx}
                      onClick={() => patchResult && setSelectedArticleNum(comp.articleTitle)}
                      style={{
                        padding: 12,
                        background: R.bgPanel,
                        border: selectedArticleNum === comp.articleTitle ? `1px solid ${R.accent}` : ft.strong,
                        borderRadius: 4,
                        cursor: patchResult ? 'pointer' : 'default',
                      }}
                    >
                      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 6 }}>
                        <span style={{ fontWeight: 700, fontSize: 13, color: R.accent }}>
                          {comp.articleTitle || `Статья ${idx + 1}`}
                        </span>
                        {patchResult && (
                          <span style={{ fontSize: 10, color: '#10b981', fontFamily: mono, fontWeight: 700 }}>
                            ✓ ОБНОВЛЕНО
                          </span>
                        )}
                      </div>

                      {/* Was -> Became */}
                      <div style={{ display: 'flex', flexDirection: 'column', gap: 6, fontSize: 12 }}>
                        {comp.wasContent && (
                          <div style={{ color: '#f87171', background: 'rgba(239, 68, 68, 0.08)', padding: 6, borderRadius: 2 }}>
                            <span style={{ fontWeight: 700, fontSize: 10, textTransform: 'uppercase' }}>Было: </span>
                            {comp.wasContent}
                          </div>
                        )}
                        <div style={{ color: '#34d399', background: 'rgba(16, 185, 129, 0.08)', padding: 6, borderRadius: 2 }}>
                          <span style={{ fontWeight: 700, fontSize: 10, textTransform: 'uppercase' }}>Стало: </span>
                          {comp.becameContent}
                        </div>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>

            {/* Actions Bar */}
            <div style={{ marginTop: 'auto', paddingTop: 16, borderTop: ft.edge, display: 'flex', flexDirection: 'column', gap: 10 }}>
              {!patchResult ? (
                <button
                  type="button"
                  onClick={handleExecuteEnact}
                  style={{
                    ...btnAccent,
                    width: '100%',
                    height: 42,
                    fontSize: 13,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: 8,
                    fontWeight: 700,
                  }}
                >
                  <Zap size={17} />
                  <span>Внести поправки и перегенерировать BB-код</span>
                </button>
              ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                  {/* Copy Article Button */}
                  {selectedArticleNum && patchResult.articleBBCodes[selectedArticleNum] && (
                    <button
                      type="button"
                      onClick={() => handleCopyArticle(selectedArticleNum)}
                      style={{
                        ...btnAccent,
                        width: '100%',
                        height: 38,
                        fontSize: 12,
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        gap: 8,
                        background: copiedArticle === selectedArticleNum ? '#10b981' : R.accent,
                        color: '#151517',
                      }}
                    >
                      {copiedArticle === selectedArticleNum ? <Check size={16} /> : <Copy size={15} />}
                      <span>
                        {copiedArticle === selectedArticleNum
                          ? 'Скопировано!'
                          : `Скопировать BB-код (${selectedArticleNum})`}
                      </span>
                    </button>
                  )}

                  {/* Multi-part Copy Buttons if applicable */}
                  {currentLaw.partsMeta && currentLaw.partsMeta.length > 1 && (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
                      <span style={{ fontSize: 10, fontFamily: mono, color: R.textMuted, textTransform: 'uppercase' }}>
                        Копирование частей для тем форума:
                      </span>
                      <div style={{ display: 'grid', gridTemplateColumns: `repeat(${Math.min(currentLaw.partsMeta.length, 2)}, 1fr)`, gap: 6 }}>
                        {currentLaw.partsMeta.map((p) => (
                          <button
                            key={p.partIndex}
                            type="button"
                            onClick={() => handleCopyPart(p.partIndex)}
                            style={{
                              ...btnOutline,
                              height: 34,
                              fontSize: 11,
                              fontWeight: 700,
                              display: 'flex',
                              alignItems: 'center',
                              justifyContent: 'center',
                              gap: 6,
                              borderColor: copiedPart === p.partIndex ? '#10b981' : undefined,
                              color: copiedPart === p.partIndex ? '#10b981' : R.text,
                            }}
                          >
                            {copiedPart === p.partIndex ? <Check size={14} /> : <Copy size={13} />}
                            <span>{copiedPart === p.partIndex ? 'Скопировано!' : `Часть ${p.partIndex}`}</span>
                          </button>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Copy Full Law Button */}
                  <button
                    type="button"
                    onClick={handleCopyFullLaw}
                    style={{
                      ...btnOutline,
                      width: '100%',
                      height: 38,
                      fontSize: 12,
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      gap: 8,
                      borderColor: copiedFull ? '#10b981' : undefined,
                      color: copiedFull ? '#10b981' : R.text,
                    }}
                  >
                    {copiedFull ? <Check size={16} /> : <Layers size={15} />}
                    <span>{copiedFull ? 'Скопировано!' : `Скопировать весь акт целиком (${currentLaw.shortTitle || currentLaw.title})`}</span>
                  </button>
                </div>
              )}
            </div>
          </div>


          {/* Right Column: Forum Live Preview */}
          <div style={{ width: '55%', display: 'flex', flexDirection: 'column', background: '#121214' }}>
            <ForumLivePreview
              law={patchResult ? patchResult.updatedLaw : currentLaw}
              rawBBCode={
                patchResult && selectedArticleNum && patchResult.articleBBCodes[selectedArticleNum]
                  ? patchResult.articleBBCodes[selectedArticleNum]
                  : undefined
              }
              onToast={onToast}
              title={
                patchResult && selectedArticleNum
                  ? `Предпросмотр: ${selectedArticleNum}`
                  : `Предпросмотр Кодекса (v${patchResult ? patchResult.updatedLaw.version : currentLaw.version})`
              }
            />
          </div>
        </div>
      </div>
    </div>
  );
};
