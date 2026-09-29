import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import type { Bill, ComparisonRow, AccessPermission, UserProfile, BillStatus, VoteDecision, FederalGovernmentVerdict } from '../types/bill';
import { CommentsSection } from './CommentsSection';
import { ExpandedArticleModal } from './ExpandedArticleModal';
import { ImageUploader } from './ImageUploader';
import { ConfirmModal } from './ConfirmModal';
import { isSystemAdmin } from '../services/securityService';
import { computeWordDiff } from '../services/diffService';
import { BillPrintView } from './BillPrintView';
// @ts-ignore
import html2pdf from 'html2pdf.js';
import { 
  ArrowLeft, 
  Share2, Download, 
  Plus, 
  Trash2, 
  CheckCircle2, 
  Maximize2,
  Send,
  MessageSquare,
  ShieldCheck,
  Check,
  Copy,
  UserCheck,
  Crown,
  FileText,
  MoreVertical,
  Edit3,
  Image as ImageIcon,
  AlertTriangle,
  Layers,
  Minimize2,
  Zap,
  Undo2,
  Redo2
} from 'lucide-react';
import { R, ft, label, mono, btnAccent, btnOutline, btnDanger } from '../lib/ui';
import { useBillHistory } from '../hooks/useBillHistory';
import { getLatestArticleContent, getActiveLaw, findLawByTitleOrCode } from '../services/lawStorageService';
import { Popover, MenuItem } from './Primitives';
import { EnactLawModal } from './laws/EnactLawModal';
import { LawSelectPicker } from './laws/LawSelectPicker';
import { 
  validateBillForPublishing, 
  checkAuthorQuota, 
  checkPublishCooldown, 
  checkDuplicateBill, 
  recordPublishTimestamp 
} from '../services/antiSpamService';

interface BillEditorProps {
  bill: Bill;
  user: UserProfile;
  permission: AccessPermission;
  returnView?: 'dashboard' | 'admin_workspace';
  existingBills?: Bill[];
  onSave: (updatedBill: Bill) => void;
  onDelete?: (billId: string) => void;
  onBack: () => void;
  onShare: (bill: Bill) => void;
  onToast: (type: 'success' | 'error' | 'info', text: string) => void;
}

export const BillEditor: React.FC<BillEditorProps> = ({
  bill: initialBill,
  user,
  permission,
  returnView = 'dashboard',
  existingBills,
  onSave,
  onDelete,
  onBack,
  onShare,
  onToast
}) => {
  const { bill, setBill, undo, redo, canUndo, canRedo } = useBillHistory(initialBill);
  const [isSavedNotice, setIsSavedNotice] = useState(false);
  const [isPublishing, setIsPublishing] = useState(false);
  const [expandedRow, setExpandedRow] = useState<ComparisonRow | null>(null);
  const [activeTabMap, setActiveTabMap] = useState<{ [rowId: string]: 'editor' | 'diff' }>({});
  const [showMoreMenu, setShowMoreMenu] = useState(false);

  // Admin verdict form state
  const [adminVerdictReason, setAdminVerdictReason] = useState('');
  const [isEditingAdminVerdict, setIsEditingAdminVerdict] = useState(false);
  const [confirmDeleteArticleId, setConfirmDeleteArticleId] = useState<string | null>(null);
  const [isFullscreenReform, setIsFullscreenReform] = useState(false);
  const [showEnactModal, setShowEnactModal] = useState(false);

  const menuRef = useRef<HTMLDivElement>(null);

  const currentFullName = `${user.firstName} ${user.lastName}`.trim();
  const isAuthor = !bill.author || bill.author.trim().toLowerCase() === currentFullName.toLowerCase() || bill.author.trim() === currentFullName || isSystemAdmin(user);
  const isAdmin = isSystemAdmin(user);
  const isOfficial = user.isOfficialVerified && (user.officialRole === 'governor' || user.officialRole === 'prosecutor' || user.officialRole === 'judge');
  const canEdit = permission === 'edit' || isAuthor || isAdmin;
  const canDelete = isAuthor || isAdmin;
  const canCreateTotalReform = (user.isOfficialVerified && (user.officialRole === 'governor' || user.officialRole === 'prosecutor' || user.officialRole === 'judge')) || isAdmin;

  // Auto-close menu on outside click
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        setShowMoreMenu(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Global Undo / Redo keyboard shortcuts (Ctrl+Z, Ctrl+Shift+Z, Ctrl+Y)
  useEffect(() => {
    if (!canEdit) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      // Must have Ctrl or Meta
      if (!e.ctrlKey && !e.metaKey) return;

      // Don't intercept inside comments section
      const target = e.target as HTMLElement | null;
      if (target?.closest('.comments-container')) return;

      // Check for Ctrl+Z (or Cmd+Z on Mac)
      // Note: In Russian keyboard layout, 'z' key produces key: 'я' or 'Я', code: 'KeyZ'
      const isZ = e.code === 'KeyZ' || e.key.toLowerCase() === 'z' || e.key.toLowerCase() === 'я';
      const isY = e.code === 'KeyY' || e.key.toLowerCase() === 'y' || e.key.toLowerCase() === 'н';

      if (isZ) {
        if (e.shiftKey) {
          // Ctrl + Shift + Z -> Redo
          e.preventDefault();
          e.stopPropagation();
          redo();
        } else {
          // Ctrl + Z -> Undo
          e.preventDefault();
          e.stopPropagation();
          undo();
        }
      } else if (isY) {
        // Ctrl + Y -> Redo
        e.preventDefault();
        e.stopPropagation();
        redo();
      }
    };

    window.addEventListener('keydown', handleKeyDown, true);
    return () => window.removeEventListener('keydown', handleKeyDown, true);
  }, [canEdit, undo, redo]);

  // Auto-save draft on changes
  const isInitialMount = useRef(true);
  useEffect(() => {
    if (isInitialMount.current) {
      isInitialMount.current = false;
      return;
    }
    if (canEdit) {
      const timer = setTimeout(() => {
        onSave(bill);
        setIsSavedNotice(true);
        setTimeout(() => setIsSavedNotice(false), 2000);
      }, 600);
      return () => clearTimeout(timer);
    }
  }, [bill, canEdit]);

  const handleFieldChange = (field: keyof Bill, value: any) => {
    if (!canEdit) return;
    setBill((prev) => ({ ...prev, [field]: value }));
  };

  const addComparisonRow = () => {
    if (!canEdit) return;
    const newId = 'comp_' + Date.now();
    const newRow: ComparisonRow = {
      id: newId,
      articleTitle: '',
      targetLaw: bill.targetLaw || 'Дорожный кодекс (ДК)',
      wasContent: '',
      becameContent: '',
      notes: ''
    };
    handleFieldChange('comparisons', [...bill.comparisons, newRow]);
  };

  const updateComparisonRow = (id: string, field: keyof ComparisonRow, value: string) => {
    if (!canEdit) return;
    setBill((prev) => {
      const updatedComparisons = prev.comparisons.map((row) => {
        if (row.id !== id) return row;
        const newRow = { ...row, [field]: value };
        if (field === 'wasContent' && (row.becameContent === '' || row.becameContent === row.wasContent)) {
          newRow.becameContent = value;
        }
        // Auto-fetch latest edition from active frontend Law Store if user enters article number and wasContent is empty
        if (field === 'articleTitle' && (!row.wasContent || row.wasContent.trim() === '')) {
          const lawToQuery = newRow.targetLaw || prev.targetLaw || 'road_code';
          const latest = getLatestArticleContent(lawToQuery, value);
          if (latest) {
            newRow.wasContent = latest;
            newRow.becameContent = latest;
          }
        }
        return newRow;
      });
      return { ...prev, comparisons: updatedComparisons };
    });
  };

  const copyWasToBecame = (id: string) => {
    if (!canEdit) return;
    setBill((prev) => {
      const updated = prev.comparisons.map((row) => {
        if (row.id !== id) return row;
        return { ...row, becameContent: row.wasContent };
      });
      return { ...prev, comparisons: updated };
    });
    onToast('info', 'Исходный текст скопирован в новую редакцию');
  };

  const removeComparisonRow = (id: string) => {
    if (!canEdit) return;
    const updated = bill.comparisons.filter((row) => row.id !== id);
    handleFieldChange('comparisons', updated);
    onToast('info', 'Статья удалена из проекта');
  };

  const handlePublish = async () => {
    if (isPublishing) return;

    // 1. Anti-spam Content Validation
    const validation = validateBillForPublishing(bill);
    if (!validation.isValid) {
      onToast('error', validation.error || 'Ошибка валидации законопроекта');
      return;
    }

    // 2. Cooldown check
    const cooldown = checkPublishCooldown(bill.author, isOfficial || isAdmin);
    if (!cooldown.allowed) {
      onToast('error', `Защита от спама: подождите еще ${cooldown.remainingSeconds} сек. перед следующей публикацией.`);
      return;
    }

    // 3. Author Quota check (max active under review)
    const currentBills = existingBills || [];
    const quota = checkAuthorQuota(bill.author, currentBills, isOfficial || isAdmin);
    if (!quota.allowed) {
      onToast('error', quota.message || 'Превышен лимит активных законопроектов');
      return;
    }

    // 4. Duplicate bill check
    const dupCheck = checkDuplicateBill(bill, currentBills);
    if (dupCheck.isDuplicate) {
      onToast('error', 'Защита от спама: у вас уже есть отправленный законопроект с идентичным содержанием.');
      return;
    }

    setIsPublishing(true);
    try {
      // Calculate affected distinct laws for omnibus multi-law support
      const distinctLaws = Array.from(
        new Set(bill.comparisons.map((c) => c.targetLaw || bill.targetLaw).filter(Boolean))
      );
      const isMultiLaw = distinctLaws.length > 1;

      const updated: Bill = { 
        ...bill, 
        isMultiLaw,
        targetLaws: distinctLaws,
        status: 'under_review' as BillStatus,
        statusReason: 'Опубликован автором и передан на рассмотрение Законодательной Комиссии.',
        updatedAt: new Date().toISOString()
      };
      setBill(updated);
      await onSave(updated);
      recordPublishTimestamp(bill.author);
      onToast('success', 'Законопроект передан на рассмотрение Законодательной Комиссии');
    } catch (err: any) {
      onToast('error', err.message || 'Ошибка при отправке законопроекта');
    } finally {
      setIsPublishing(false);
    }
  };

  const [isDownloadingPdf, setIsDownloadingPdf] = useState(false);
  const handleDownloadPDF = async () => {
    const element = document.getElementById('pdf-content-container');
    if (!element) return;
    
    setIsDownloadingPdf(true);
    onToast('info', 'Генерация PDF начата, пожалуйста, подождите...');
    
    const decreeStamp = bill.id ? `SA-${bill.id.replace(/\D/g, '').slice(-4) || '0042'}` : 'Draft';
    
    const opt = {
      margin:       0,
      filename:     `Bill_${decreeStamp}.pdf`,
      image:        { type: 'jpeg' as const, quality: 0.98 },
      html2canvas:  { scale: 2, useCORS: true, logging: false },
      jsPDF:        { unit: 'in', format: 'a4', orientation: 'portrait' as const }
    };

    try {
      await html2pdf().set(opt).from(element).save();
      onToast('success', 'PDF успешно скачан!');
    } catch (error) {
      console.error('PDF Generation Error:', error);
      onToast('error', 'Не удалось сгенерировать PDF.');
    } finally {
      setIsDownloadingPdf(false);
    }
  };

  const votes = bill.votes || {};
  const approvedVotesCount = [votes.prosecutor, votes.judge, votes.governor].filter((v) => v === 'approved').length;
  const rejectedVotesCount = [votes.prosecutor, votes.judge, votes.governor].filter((v) => v === 'rejected').length;

  const isStage1Passed = approvedVotesCount >= 2;
  const isStage1Rejected = rejectedVotesCount >= 2;

  const handleCastVote = async (decision: VoteDecision) => {
    if (!isOfficial) {
      onToast('error', 'Голосование доступно только членам Законодательной Комиссии.');
      return;
    }

    const role = user.officialRole;
    if (role !== 'prosecutor' && role !== 'judge' && role !== 'governor' && role !== 'admin') {
      onToast('error', 'Только Прокурор, Председатель ВС и Губернатор голосуют в Комиссии.');
      return;
    }

    const voteRole = role === 'admin' ? 'governor' : role;
    const updatedVotes = { ...votes, [voteRole]: decision };

    let newStatus = bill.status;
    let newStatusReason = bill.statusReason;

    const newApproved = [updatedVotes.prosecutor, updatedVotes.judge, updatedVotes.governor].filter((v) => v === 'approved').length;
    const newRejected = [updatedVotes.prosecutor, updatedVotes.judge, updatedVotes.governor].filter((v) => v === 'rejected').length;

    if (newApproved >= 2) {
      newStatus = 'under_review';
      newStatusReason = 'Одобрен Законодательной Комиссией. Ожидает решения Федерального Правительства.';
    } else if (newRejected >= 2) {
      newStatus = 'rejected';
      newStatusReason = 'Отклонен большинством голосов Законодательной Комиссии.';
    }

    const updated: Bill = {
      ...bill,
      votes: updatedVotes,
      status: newStatus,
      statusReason: newStatusReason,
      updatedAt: new Date().toISOString()
    };

    setBill(updated);
    await onSave(updated);
    onToast('success', `Ваш голос (${decision === 'approved' ? 'ЗА' : decision === 'rejected' ? 'ПРОТИВ' : 'НА ДОРАБОТКУ'}) учтен`);
  };

  const handleExecuteAdminVerdict = async (decision: 'approved' | 'rejected' | 'needs_revision') => {
    if (!isAdmin) {
      onToast('error', 'Только Федеральное Правительство может выносить окончательный вердикт.');
      return;
    }

    const trimmedReason = adminVerdictReason.trim();
    if ((decision === 'rejected' || decision === 'needs_revision') && !trimmedReason) {
      onToast('error', 'Пожалуйста, укажите причину вердикта для автора и Законодательной Комиссии.');
      return;
    }

    const defaultReason = decision === 'approved'
      ? 'Законопроект проверен, утвержден Федеральным Правительством и готов к внесению.'
      : decision === 'needs_revision'
      ? 'Законопроект отправлен на доработку. Ознакомьтесь с замечаниями.'
      : 'Законопроект отклонен Федеральным Правительством.';

    const verdict: FederalGovernmentVerdict = {
      status: decision,
      reason: trimmedReason || defaultReason,
      updatedAt: new Date().toISOString(),
      adminName: `${user.firstName} ${user.lastName}`.trim() || 'Федеральное Правительство'
    };

    let officialStatusReason = '';
    if (decision === 'approved') {
      officialStatusReason = 'Утвержден Федеральным Правительством. Ожидает внесения в реестр.';
    } else if (decision === 'rejected') {
      officialStatusReason = `Отклонен Федеральным Правительством: ${verdict.reason}`;
    } else {
      officialStatusReason = `Отправлен на доработку: ${verdict.reason}`;
    }

    const updated: Bill = {
      ...bill,
      status: decision,
      statusReason: officialStatusReason,
      federalVerdict: verdict,
      updatedAt: new Date().toISOString()
    };

    setBill(updated);
    await onSave(updated);
    setAdminVerdictReason('');
    setIsEditingAdminVerdict(false);
    onToast('success', `Вердикт вынесен: ${decision === 'approved' ? 'Утверждено' : decision === 'rejected' ? 'Отклонено' : 'Направлено на доработку'}`);
  };

  const handleEnactLaws = () => {
    if (!isAdmin) {
      if (onToast) onToast('error', 'Внесение изменений в законы доступно только Администратору.');
      return;
    }
    setShowEnactModal(true);
  };

  const getStatusBadge = (status: BillStatus) => {
    switch (status) {
      case 'approved':
        return (
          <span
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: 5,
              padding: '3px 8px',
              fontSize: 11,
              fontWeight: 700,
              background: R.successSubtle,
              color: R.success,
              border: `1px solid ${R.success}`,
              borderRadius: 2,
            }}
          >
            <span style={{ width: 6, height: 6, borderRadius: '50%', background: R.success }} />
            Вступил в силу
          </span>
        );
      case 'rejected':
        return (
          <span
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: 5,
              padding: '3px 8px',
              fontSize: 11,
              fontWeight: 700,
              background: R.dangerSubtle,
              color: R.danger,
              border: `1px solid ${R.dangerBorder}`,
              borderRadius: 2,
            }}
          >
            <span style={{ width: 6, height: 6, borderRadius: '50%', background: R.danger }} />
            Отклонен
          </span>
        );
      case 'needs_revision':
        return (
          <span
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: 5,
              padding: '3px 8px',
              fontSize: 11,
              fontWeight: 700,
              background: R.accentSubtle,
              color: R.accentText,
              border: `1px solid ${R.accentBorder}`,
              borderRadius: 2,
            }}
          >
            <span style={{ width: 6, height: 6, borderRadius: '50%', background: R.accent }} />
            Доработка
          </span>
        );
      case 'under_review':
        return (
          <span
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: 5,
              padding: '3px 8px',
              fontSize: 11,
              fontWeight: 700,
              background: R.warningSubtle,
              color: R.warning,
              border: `1px solid ${R.warning}`,
              borderRadius: 2,
            }}
          >
            <span style={{ width: 6, height: 6, borderRadius: '50%', background: R.warning }} />
            {isStage1Passed ? '2-й этап (Администрация)' : '1-й этап (Комиссия)'}
          </span>
        );
      case 'draft':
      default:
        return (
          <span
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: 5,
              padding: '3px 8px',
              fontSize: 11,
              fontWeight: 600,
              background: R.bgElevated,
              color: R.textMuted,
              border: ft.edge,
              borderRadius: 2,
            }}
          >
            <span style={{ width: 6, height: 6, borderRadius: '50%', background: R.textMuted }} />
            Черновик
          </span>
        );
    }
  };

  const formatDecreeNumber = (id: string) => {
    const numericId = id.replace(/\D/g, '').slice(-4) || '0042';
    return `SA-${numericId}`;
  };

  const isReadOnly = (permission === 'read' && !isAuthor && !isAdmin) || bill.status === 'approved' || bill.status === 'rejected';

  return (
    <div style={{ maxWidth: 1180, margin: '0 auto', display: 'flex', flexDirection: 'column', gap: 20 }}>
      
      {/* Sticky Top Bar */}
      <div
        style={{
          position: 'sticky',
          top: 0,
          zIndex: 30,
          height: 54,
          background: R.bgPanel,
          borderBottom: ft.edge,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          padding: '0 16px',
          margin: '-32px -32px 12px -32px',
          boxShadow: '0 4px 20px rgba(0,0,0,0.1)',
        }}
      >
        {/* Left: Back + Identity + Status */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 12, minWidth: 0 }}>
          <button
            onClick={onBack}
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: 6,
              height: 32,
              padding: '0 10px',
              fontSize: 13,
              fontWeight: 700,
              color: R.text,
              background: R.bgInput,
              border: ft.edge,
              borderRadius: 2,
              cursor: 'pointer',
            }}
          >
            <ArrowLeft size={14} />
            <span>{returnView === 'admin_workspace' ? 'Администрация' : 'Реестр'}</span>
          </button>
          
          <div style={{ width: 1, height: 20, background: R.border }} />

          <span
            style={{
              fontFamily: mono,
              fontSize: 11,
              fontWeight: 700,
              padding: '2px 6px',
              background: R.bgInput,
              border: ft.hair,
              color: R.textMuted,
              borderRadius: 2,
            }}
          >
            {formatDecreeNumber(bill.id)}
          </span>

          <h2
            style={{
              fontSize: 14,
              fontWeight: 800,
              color: R.text,
              margin: 0,
              whiteSpace: 'nowrap',
              overflow: 'hidden',
              textOverflow: 'ellipsis',
              maxWidth: 320,
            }}
          >
            {bill.targetLaw || 'Новый законопроект'}
          </h2>

          {/* Multi-law badge if comparisons touch > 1 law */}
          {(() => {
            const distinctLaws = Array.from(
              new Set(bill.comparisons.map((c) => c.targetLaw || bill.targetLaw).filter(Boolean))
            );
            if (distinctLaws.length > 1) {
              return (
                <span
                  style={{
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: 4,
                    padding: '2px 7px',
                    fontSize: 10.5,
                    fontWeight: 800,
                    background: 'rgba(59, 130, 246, 0.15)',
                    color: '#60a5fa',
                    border: '1px solid rgba(59, 130, 246, 0.4)',
                    borderRadius: 2,
                    letterSpacing: '0.03em',
                  }}
                >
                  <Layers size={11} />
                  ПАКЕТНЫЙ ({distinctLaws.length} ЗАКОНА)
                </span>
              );
            }
            return null;
          })()}

          <div style={{ display: 'flex', alignItems: 'center' }}>
            {getStatusBadge(bill.status)}
          </div>
        </div>

        {/* Right: Actions */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexShrink: 0 }}>
          {/* Undo / Redo Toolbar Controls */}
          {canEdit && (
            <div
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                background: R.bgInput,
                border: ft.edge,
                borderRadius: 3,
                padding: 1,
                gap: 1,
                marginRight: 2,
              }}
            >
              <button
                type="button"
                onClick={() => undo()}
                disabled={!canUndo}
                title="Отменить последнее действие (Ctrl+Z)"
                style={{
                  width: 30,
                  height: 30,
                  display: 'grid',
                  placeItems: 'center',
                  background: 'transparent',
                  border: 'none',
                  color: canUndo ? R.text : R.textMuted,
                  opacity: canUndo ? 1 : 0.35,
                  cursor: canUndo ? 'pointer' : 'not-allowed',
                  borderRadius: 2,
                  transition: 'all 0.15s ease',
                }}
                onMouseEnter={(e) => {
                  if (canUndo) e.currentTarget.style.background = R.bgElevated;
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.background = 'transparent';
                }}
              >
                <Undo2 size={15} />
              </button>
              <div style={{ width: 1, height: 16, background: R.border }} />
              <button
                type="button"
                onClick={() => redo()}
                disabled={!canRedo}
                title="Повторить отменённое действие (Ctrl+Y / Ctrl+Shift+Z)"
                style={{
                  width: 30,
                  height: 30,
                  display: 'grid',
                  placeItems: 'center',
                  background: 'transparent',
                  border: 'none',
                  color: canRedo ? R.text : R.textMuted,
                  opacity: canRedo ? 1 : 0.35,
                  cursor: canRedo ? 'pointer' : 'not-allowed',
                  borderRadius: 2,
                  transition: 'all 0.15s ease',
                }}
                onMouseEnter={(e) => {
                  if (canRedo) e.currentTarget.style.background = R.bgElevated;
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.background = 'transparent';
                }}
              >
                <Redo2 size={15} />
              </button>
            </div>
          )}

          <AnimatePresence>
            {isSavedNotice && (
              <motion.span
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.9 }}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: 4,
                  fontSize: 11,
                  fontFamily: mono,
                  color: R.success,
                  marginRight: 6,
                }}
              >
                <Check size={12} /> Сохранено
              </motion.span>
            )}
          </AnimatePresence>

          {bill.status === 'draft' && canEdit && (
            <button
              onClick={handlePublish}
              disabled={isPublishing}
              style={{ ...btnAccent, height: 32, fontSize: 12, opacity: isPublishing ? 0.7 : 1 }}
            >
              <Send size={13} /> {isPublishing ? 'Проверка...' : 'Опубликовать'}
            </button>
          )}

          {isAdmin && bill.status === 'under_review' && (
            <button
              onClick={() => handleExecuteAdminVerdict('approved')}
              style={{ ...btnAccent, height: 32, fontSize: 12 }}
            >
              <CheckCircle2 size={13} /> Одобрить вердикт
            </button>
          )}

          {isAdmin && bill.status === 'approved' && !bill.statusReason?.includes('внесены в законодательную базу') && (
            <button
              onClick={handleEnactLaws}
              style={{ ...btnAccent, height: 32, fontSize: 12 }}
            >
              <FileText size={13} /> Внести в законы
            </button>
          )}

          {canDelete && (
            <button
              onClick={() => { if (onDelete) onDelete(bill.id); }}
              style={{ ...btnDanger, height: 32, fontSize: 12 }}
            >
              <Trash2 size={13} /> Удалить
            </button>
          )}

          <div ref={menuRef} style={{ position: 'relative' }}>
            <button
              onClick={() => setShowMoreMenu((prev) => !prev)}
              style={{
                width: 32,
                height: 32,
                display: 'grid',
                placeItems: 'center',
                background: R.bgInput,
                border: ft.edge,
                borderRadius: 2,
                color: R.text,
                cursor: 'pointer',
              }}
            >
              <MoreVertical size={15} />
            </button>

            <AnimatePresence>
              {showMoreMenu && (
                <Popover
                  style={{
                    position: 'absolute',
                    top: 'calc(100% + 4px)',
                    right: 0,
                    width: 220,
                    zIndex: 50,
                  }}
                >
                  {canEdit && (
                    <>
                      <MenuItem
                        icon={Undo2}
                        label="Отменить (Ctrl+Z)"
                        onClick={() => {
                          setShowMoreMenu(false);
                          undo();
                        }}
                      />
                      <MenuItem
                        icon={Redo2}
                        label="Повторить (Ctrl+Y)"
                        onClick={() => {
                          setShowMoreMenu(false);
                          redo();
                        }}
                      />
                      <div style={{ height: 1, background: R.border, margin: '4px 0' }} />
                    </>
                  )}
                  <MenuItem
                    icon={Download}
                    label={isDownloadingPdf ? "Скачивание..." : "Скачать в PDF"}
                    onClick={() => {
                      setShowMoreMenu(false);
                      handleDownloadPDF();
                    }}
                  />
                  <MenuItem
                    icon={Share2}
                    label="Поделиться ссылкой"
                    onClick={() => {
                      setShowMoreMenu(false);
                      onShare(bill);
                    }}
                  />
                  {bill.forumUrl && (
                    <MenuItem
                      icon={Share2}
                      label="Тема на форуме"
                      onClick={() => {
                        setShowMoreMenu(false);
                        window.open(bill.forumUrl, '_blank');
                      }}
                    />
                  )}
                </Popover>
              )}
            </AnimatePresence>
          </div>
        </div>
      </div>

      {/* IN-UI SECTION ROLL NAVIGATION (Быстрый скролл по разделам акта) */}
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: 6,
          marginBottom: 16,
          padding: '8px 12px',
          background: R.bgPanel,
          border: ft.edge,
          borderRadius: 2,
          overflowX: 'auto',
          flexWrap: 'wrap',
        }}
      >
        <span style={{ fontSize: 10.5, fontFamily: mono, color: R.textMuted, textTransform: 'uppercase', marginRight: 4, letterSpacing: '0.04em' }}>
          Навигация:
        </span>
        <button
          type="button"
          onClick={() => document.getElementById('section-target-law')?.scrollIntoView({ behavior: 'smooth', block: 'start' })}
          style={{ ...btnOutline, height: 26, fontSize: 11, padding: '0 8px' }}
        >
          Нормативный акт
        </button>
        <button
          type="button"
          onClick={() => {
            const targetId = bill.isTotalReform ? 'section-total-reform' : 'section-articles';
            document.getElementById(targetId)?.scrollIntoView({ behavior: 'smooth', block: 'start' });
          }}
          style={{ ...btnOutline, height: 26, fontSize: 11, padding: '0 8px' }}
        >
          {bill.isTotalReform ? 'Общая реформа (1 ячейка)' : `Статьи (${bill.comparisons.length})`}
        </button>
        <button
          type="button"
          onClick={() => document.getElementById('section-photos')?.scrollIntoView({ behavior: 'smooth', block: 'start' })}
          style={{ ...btnOutline, height: 26, fontSize: 11, padding: '0 8px' }}
        >
          Фотоматериалы
        </button>
        {bill.federalVerdict && (
          <button
            type="button"
            onClick={() => document.getElementById('section-federal-verdict')?.scrollIntoView({ behavior: 'smooth', block: 'start' })}
            style={{ ...btnOutline, height: 26, fontSize: 11, padding: '0 8px', color: R.accentText, borderColor: R.accentBorder }}
          >
            👑 Вердикт ФП
          </button>
        )}
        <button
          type="button"
          onClick={() => document.getElementById('section-comments')?.scrollIntoView({ behavior: 'smooth', block: 'start' })}
          style={{ ...btnOutline, height: 26, fontSize: 11, padding: '0 8px' }}
        >
          Обсуждение ({bill.comments?.length || 0})
        </button>
      </div>

      {/* FEDERAL GOVERNMENT VERDICT BANNER (Visible to Author, Legislative Commission, and Admins) */}
      {bill.federalVerdict && (
        <div
          id="section-federal-verdict"
          style={{
            marginBottom: 24,
            background: bill.federalVerdict.status === 'approved'
              ? 'rgba(34, 197, 94, 0.07)'
              : bill.federalVerdict.status === 'needs_revision'
              ? 'rgba(234, 179, 8, 0.09)'
              : 'rgba(239, 68, 68, 0.09)',
            border: `1px solid ${
              bill.federalVerdict.status === 'approved'
                ? 'rgba(34, 197, 94, 0.35)'
                : bill.federalVerdict.status === 'needs_revision'
                ? 'rgba(234, 179, 8, 0.35)'
                : 'rgba(239, 68, 68, 0.35)'
            }`,
            borderLeft: `5px solid ${
              bill.federalVerdict.status === 'approved'
                ? '#22c55e'
                : bill.federalVerdict.status === 'needs_revision'
                ? '#eab308'
                : '#ef4444'
            }`,
            borderRadius: 2,
            padding: '16px 20px',
            display: 'flex',
            flexDirection: 'column',
            gap: 12,
            boxShadow: '0 2px 10px rgba(0,0,0,0.14)'
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 10 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
              <div
                style={{
                  width: 34,
                  height: 34,
                  borderRadius: 2,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  background: bill.federalVerdict.status === 'approved'
                    ? 'rgba(34, 197, 94, 0.16)'
                    : bill.federalVerdict.status === 'needs_revision'
                    ? 'rgba(234, 179, 8, 0.18)'
                    : 'rgba(239, 68, 68, 0.18)',
                }}
              >
                <Crown
                  size={20}
                  color={
                    bill.federalVerdict.status === 'approved'
                      ? '#22c55e'
                      : bill.federalVerdict.status === 'needs_revision'
                      ? '#eab308'
                      : '#ef4444'
                  }
                />
              </div>
              <div>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
                  <span style={{ fontSize: 13, fontWeight: 800, color: R.text, textTransform: 'uppercase', letterSpacing: '0.02em' }}>
                    Решение Федерального Правительства
                  </span>
                  <span
                    style={{
                      fontFamily: mono,
                      fontSize: 10.5,
                      fontWeight: 800,
                      padding: '2px 8px',
                      borderRadius: 2,
                      textTransform: 'uppercase',
                      background: bill.federalVerdict.status === 'approved'
                        ? 'rgba(34, 197, 94, 0.2)'
                        : bill.federalVerdict.status === 'needs_revision'
                        ? 'rgba(234, 179, 8, 0.2)'
                        : 'rgba(239, 68, 68, 0.2)',
                      color: bill.federalVerdict.status === 'approved'
                        ? '#22c55e'
                        : bill.federalVerdict.status === 'needs_revision'
                        ? '#eab308'
                        : '#ef4444',
                      border: `1px solid ${
                        bill.federalVerdict.status === 'approved'
                          ? 'rgba(34, 197, 94, 0.4)'
                          : bill.federalVerdict.status === 'needs_revision'
                          ? 'rgba(234, 179, 8, 0.4)'
                          : 'rgba(239, 68, 68, 0.4)'
                      }`
                    }}
                  >
                    {bill.federalVerdict.status === 'approved'
                      ? (bill.status === 'approved' && bill.statusReason?.includes('внесен') ? '✓ ВНЕСЕН В ЗАКОНОДАТЕЛЬСТВО' : 'ОДОБРЕНО ФЕДЕРАЛЬНЫМ ПРАВИТЕЛЬСТВОМ')
                      : bill.federalVerdict.status === 'needs_revision'
                      ? 'ОТПРАВЛЕНО НА ДОРАБОТКУ (ТРЕБУЮТСЯ ПРАВКИ)'
                      : 'ОТКЛОНЕНО ФЕДЕРАЛЬНЫМ ПРАВИТЕЛЬСТВОМ'}
                  </span>
                </div>
                <div style={{ fontSize: 11, color: R.textMuted, marginTop: 3, display: 'flex', alignItems: 'center', gap: 12, flexWrap: 'wrap' }}>
                  <span>
                    Уполномоченное лицо: <strong style={{ color: R.textSecondary }}>{bill.federalVerdict.adminName || 'Федеральное Правительство'}</strong>
                  </span>
                  {bill.federalVerdict.updatedAt && (
                    <span style={{ fontFamily: mono }}>
                      {new Date(bill.federalVerdict.updatedAt).toLocaleString('ru-RU', { dateStyle: 'long', timeStyle: 'short' })}
                    </span>
                  )}
                </div>
              </div>
            </div>

            {isAdmin && (
              <button
                type="button"
                onClick={() => {
                  setIsEditingAdminVerdict((prev) => !prev);
                  if (!isEditingAdminVerdict && bill.federalVerdict) {
                    setAdminVerdictReason(bill.federalVerdict.reason || '');
                  }
                }}
                style={{
                  ...btnOutline,
                  height: 28,
                  fontSize: 11,
                  display: 'flex',
                  alignItems: 'center',
                  gap: 5,
                  padding: '0 10px'
                }}
              >
                <Edit3 size={12} />
                {isEditingAdminVerdict ? 'Отмена изменения' : 'Изменить вердикт'}
              </button>
            )}
          </div>

          {/* Reasoning Quote Box */}
          <div
            style={{
              background: R.bgPanel,
              border: ft.edge,
              borderRadius: 2,
              padding: '12px 14px',
              display: 'flex',
              flexDirection: 'column',
              gap: 5
            }}
          >
            <div style={{ fontSize: 10, fontFamily: mono, fontWeight: 700, color: R.textMuted, textTransform: 'uppercase', letterSpacing: '0.04em' }}>
              Официальное обоснование / Замечания для автора и специальной комиссии:
            </div>
            <div
              style={{
                fontSize: 13,
                lineHeight: 1.5,
                color: R.text,
                whiteSpace: 'pre-wrap',
                fontWeight: 500
              }}
            >
              {bill.federalVerdict.reason || 'Обоснование не указано.'}
            </div>
          </div>

          {bill.federalVerdict.status === 'needs_revision' && isAuthor && (
            <div style={{ fontSize: 12, color: R.textSecondary, display: 'flex', alignItems: 'center', gap: 6, background: 'rgba(234, 179, 8, 0.08)', padding: '6px 10px', borderRadius: 2 }}>
              <AlertTriangle size={14} color="#eab308" style={{ flexShrink: 0 }} />
              <span>
                <strong>Указание автору:</strong> Ознакомьтесь с замечаниями выше и внесите необходимые правки в статьи законопроекта.
              </span>
            </div>
          )}
        </div>
      )}

      {/* Main Grid: Left editor (articles & metadata), Right sidebar (voting, author, comments) */}
      <div style={{ display: 'grid', gridTemplateColumns: 'minmax(0, 1fr) 320px', gap: 24, alignItems: 'start' }}>
        
        {/* LEFT COLUMN: Metadata & Articles */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
          
          {/* Metadata Card */}
          <div
            id="section-target-law"
            style={{
              background: R.bgPanel,
              border: ft.edge,
              borderRadius: 2,
              padding: 20,
              display: 'flex',
              flexDirection: 'column',
              gap: 14,
            }}
          >
            <div>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 6 }}>
                <label style={{ ...label, margin: 0 }}>Целевой нормативно-правовой акт</label>
                <span style={{ fontSize: 11, color: R.textMuted }}>Официальный реестр штата Сан-Андреас (27 законов)</span>
              </div>
              <LawSelectPicker
                value={bill.targetLaw}
                onChange={(lawTitle, lawCode) => {
                  handleFieldChange('targetLaw', lawTitle);
                  if (lawCode) handleFieldChange('lawCode', lawCode);
                  onToast('info', `Выбран закон: ${lawTitle}`);
                }}
                disabled={!canEdit || isReadOnly}
                placeholder="Выберите закон из официального реестра или укажите вручную..."
              />
            </div>

            <div>
              <label style={{ ...label, display: 'block', marginBottom: 6 }}>Пояснительная записка</label>
              <textarea
                value={bill.explanatoryNote}
                onChange={(e) => handleFieldChange('explanatoryNote', e.target.value)}
                disabled={!canEdit || isReadOnly}
                style={{
                  width: '100%',
                  minHeight: 84,
                  padding: '10px 12px',
                  fontSize: 13,
                  background: R.bgInput,
                  border: ft.edge,
                  color: R.text,
                  borderRadius: 2,
                  outline: 'none',
                  resize: 'vertical',
                }}
                placeholder="Краткое обоснование необходимости внесения поправок..."
              />
            </div>

            {/* TOTAL LAW REFORM TOGGLE (Общая реформа закона) */}
            <div
              style={{
                background: bill.isTotalReform 
                  ? 'linear-gradient(135deg, rgba(234, 88, 12, 0.09) 0%, rgba(245, 158, 11, 0.05) 100%)' 
                  : R.bgElevated,
                border: bill.isTotalReform 
                  ? '1px solid rgba(234, 88, 12, 0.45)' 
                  : ft.edge,
                borderRadius: 2,
                padding: '14px 16px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                gap: 16,
                transition: 'all 0.2s ease',
              }}
            >
              <div style={{ display: 'flex', alignItems: 'flex-start', gap: 12 }}>
                <div
                  style={{
                    width: 36,
                    height: 36,
                    borderRadius: 2,
                    background: bill.isTotalReform ? R.accent : R.bgInput,
                    color: bill.isTotalReform ? R.onAccent : R.textMuted,
                    display: 'grid',
                    placeItems: 'center',
                    flexShrink: 0,
                    border: bill.isTotalReform ? 'none' : ft.edge,
                    boxShadow: bill.isTotalReform ? '0 2px 8px rgba(234, 88, 12, 0.35)' : 'none',
                  }}
                >
                  <Layers size={18} />
                </div>
                <div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
                    <span style={{ fontSize: 13, fontWeight: 800, color: R.text, textTransform: 'uppercase', letterSpacing: '0.02em' }}>
                      Общая реформа закона
                    </span>
                    <span
                      style={{
                        fontFamily: mono,
                        fontSize: 9.5,
                        fontWeight: 800,
                        padding: '2px 6px',
                        borderRadius: 2,
                        textTransform: 'uppercase',
                        background: bill.isTotalReform ? 'rgba(234, 88, 12, 0.2)' : R.bgInput,
                        color: bill.isTotalReform ? R.accent : R.textMuted,
                        border: `1px solid ${bill.isTotalReform ? R.accentBorder : ft.edge}`,
                      }}
                    >
                      {bill.isTotalReform ? 'Полная замена закона' : 'Высшее руководство'}
                    </span>
                  </div>
                  <p style={{ fontSize: 12, color: R.textSecondary, margin: '4px 0 0', lineHeight: 1.45 }}>
                    Полная смена текста нормативно-правового акта целиком в единой редакции. Отключает сравнительные таблицы (без зелёного и красного).
                  </p>
                  {!canCreateTotalReform && !bill.isTotalReform && (
                    <span style={{ fontSize: 11, color: R.textMuted, fontStyle: 'italic', display: 'block', marginTop: 4 }}>
                      🔒 Доступно исключительно Губернатору, Генеральному Прокурору и Председателю ВС.
                    </span>
                  )}
                </div>
              </div>

              <div style={{ flexShrink: 0 }}>
                <label
                  style={{
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: 8,
                    cursor: (canCreateTotalReform && canEdit && !isReadOnly) ? 'pointer' : 'not-allowed',
                    opacity: (!canCreateTotalReform && !bill.isTotalReform) ? 0.5 : 1,
                    userSelect: 'none',
                  }}
                >
                  <input
                    type="checkbox"
                    id="toggle-total-reform"
                    checked={Boolean(bill.isTotalReform)}
                    disabled={!canCreateTotalReform || !canEdit || isReadOnly}
                    onChange={(e) => {
                      const checked = e.target.checked;
                      handleFieldChange('isTotalReform', checked);
                      if (checked) {
                        if (!bill.totalReformContent && bill.comparisons?.length > 0) {
                          const initialText = bill.comparisons.map((c) => (c.articleTitle ? `${c.articleTitle}\n` : '') + (c.becameContent || c.wasContent || '')).join('\n\n');
                          handleFieldChange('totalReformContent', initialText);
                        }
                        onToast('success', 'Включен режим Общей реформы закона (единая редакция)');
                      } else {
                        onToast('info', 'Возвращен стандартный постатейный режим');
                      }
                    }}
                    style={{
                      width: 18,
                      height: 18,
                      accentColor: R.accent,
                      cursor: (canCreateTotalReform && canEdit && !isReadOnly) ? 'pointer' : 'not-allowed',
                    }}
                  />
                  <span style={{ fontSize: 12, fontWeight: 700, color: bill.isTotalReform ? R.accent : R.text }}>
                    {bill.isTotalReform ? 'Включено' : 'Выключено'}
                  </span>
                </label>
              </div>
            </div>
          </div>

          {/* CONDITIONAL RENDERING: TOTAL LAW REFORM (SINGLE CELL) vs STANDARD ARTICLE COMPARISONS */}
          {bill.isTotalReform ? (
            /* ========================================================================= */
            /* SINGLE REFORM CELL - NO GREEN, NO RED, ONLY NEW LAW TEXT IN FULL          */
            /* ========================================================================= */
            <div
              id="section-total-reform"
              style={{
                background: R.bgPanel,
                border: `1px solid ${R.accentBorder}`,
                borderRadius: 2,
                overflow: 'hidden',
                display: 'flex',
                flexDirection: 'column',
                boxShadow: '0 4px 20px rgba(0,0,0,0.18)',
              }}
            >
              {/* Single Cell Header */}
              <div
                style={{
                  padding: '12px 16px',
                  background: R.bgElevated,
                  borderBottom: ft.edge,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  flexWrap: 'wrap',
                  gap: 10,
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                  <div
                    style={{
                      width: 30,
                      height: 30,
                      borderRadius: 2,
                      background: 'rgba(234, 88, 12, 0.15)',
                      color: R.accent,
                      display: 'grid',
                      placeItems: 'center',
                    }}
                  >
                    <FileText size={16} />
                  </div>
                  <div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
                      <span style={{ fontSize: 13.5, fontWeight: 800, color: R.text, textTransform: 'uppercase', letterSpacing: '0.02em' }}>
                        Текст новой редакции закона в полном объеме
                      </span>
                      <span
                        style={{
                          fontFamily: mono,
                          fontSize: 10,
                          fontWeight: 700,
                          color: R.accent,
                          background: R.accentSubtle,
                          padding: '2px 7px',
                          borderRadius: 2,
                          border: `1px solid ${R.accentBorder}`,
                          textTransform: 'uppercase',
                        }}
                      >
                        Единая редакция
                      </span>
                    </div>
                    <div style={{ fontSize: 11, color: R.textMuted, marginTop: 2 }}>
                      Полная замена нормативного акта · Рассматривается Специальной Законодательной Комиссией и Федеральным Правительством
                    </div>
                  </div>
                </div>

                {/* Header Actions */}
                <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                  <span style={{ fontFamily: mono, fontSize: 11, color: R.textMuted, padding: '3px 8px', background: R.bgInput, borderRadius: 2, border: ft.edge }}>
                    Символов: {(bill.totalReformContent || '').length} · Слов: {(bill.totalReformContent || '').trim() ? (bill.totalReformContent || '').trim().split(/\s+/).length : 0}
                  </span>
                  {canEdit && !isReadOnly && (
                    <button
                      type="button"
                      onClick={() => {
                        const activeDoc = findLawByTitleOrCode(bill.targetLaw) || getActiveLaw('road_code');
                        if (activeDoc && activeDoc.activeBBCode) {
                          handleFieldChange('totalReformContent', activeDoc.activeBBCode);
                          onToast('success', `Загружен актуальный текст «${activeDoc.title}» в поле общей реформы!`);
                        } else {
                          onToast('info', 'Не удалось автоматически найти текст закона');
                        }
                      }}
                      style={{ ...btnOutline, height: 28, fontSize: 11, padding: '0 8px', display: 'flex', alignItems: 'center', gap: 4, color: R.accent, borderColor: R.accentBorder }}
                      title="Загрузить текущий текст нормативного акта целиком"
                    >
                      <Zap size={12} /> Загрузить текущий закон
                    </button>
                  )}
                  <button
                    type="button"
                    onClick={() => {
                      navigator.clipboard.writeText(bill.totalReformContent || '');
                      onToast('success', 'Текст закона скопирован в буфер обмена');
                    }}
                    style={{ ...btnOutline, height: 28, fontSize: 11, padding: '0 8px', display: 'flex', alignItems: 'center', gap: 4 }}
                    title="Скопировать полный текст"
                  >
                    <Copy size={12} /> Скопировать
                  </button>
                  <button
                    type="button"
                    onClick={() => setIsFullscreenReform((prev) => !prev)}
                    style={{ ...btnOutline, height: 28, fontSize: 11, padding: '0 8px', display: 'flex', alignItems: 'center', gap: 4 }}
                    title="Полноэкранный режим"
                  >
                    {isFullscreenReform ? <Minimize2 size={12} /> : <Maximize2 size={12} />}
                    {isFullscreenReform ? 'Свернуть' : 'Во весь экран'}
                  </button>
                </div>
              </div>

              {/* Single Cell Body (Strictly no red and no green) */}
              <div style={{ padding: 18, background: R.bgPanel, display: 'flex', flexDirection: 'column', gap: 8 }}>
                {canEdit && !isReadOnly ? (
                  <div style={{ position: 'relative' }}>
                    <textarea
                      value={bill.totalReformContent || ''}
                      onChange={(e) => {
                        const val = e.target.value;
                        handleFieldChange('totalReformContent', val);
                        // Maintain single synthetic comparison row for backward-compatibility
                        const updatedComp: ComparisonRow[] = [
                          {
                            id: 'reform_full',
                            articleTitle: 'Полный текст закона (Общая реформа)',
                            wasContent: '',
                            becameContent: val,
                            notes: 'Общая реформа нормативно-правового акта'
                          }
                        ];
                        handleFieldChange('comparisons', updatedComp);
                      }}
                      placeholder="Вставьте или введите полный текст новой редакции закона целиком...&#10;&#10;Пример структуры:&#10;ГЛАВА I. ОБЩИЕ ПОЛОЖЕНИЯ&#10;Статья 1. Основные понятия...&#10;Статья 2. Сфера действия...&#10;&#10;ГЛАВА II. СТРУКТУРА И ПОЛНОМОЧИЯ...&#10;Статья 3..."
                      style={{
                        width: '100%',
                        minHeight: isFullscreenReform ? '72vh' : '520px',
                        padding: '16px 18px',
                        fontSize: 13.5,
                        lineHeight: 1.68,
                        fontFamily: 'inherit',
                        background: R.bgInput,
                        color: R.text,
                        border: ft.edge,
                        borderRadius: 2,
                        outline: 'none',
                        resize: 'vertical',
                        boxSizing: 'border-box',
                        boxShadow: 'inset 0 1px 3px rgba(0,0,0,0.15)',
                      }}
                    />
                  </div>
                ) : (
                  <div
                    style={{
                      minHeight: '320px',
                      padding: '20px 22px',
                      fontSize: 13.5,
                      lineHeight: 1.7,
                      color: R.text,
                      background: R.bgInput,
                      border: ft.edge,
                      borderRadius: 2,
                      whiteSpace: 'pre-wrap',
                      fontFamily: 'inherit',
                      maxHeight: isFullscreenReform ? '75vh' : '650px',
                      overflowY: 'auto',
                    }}
                  >
                    {bill.totalReformContent || 'Текст новой редакции закона не заполнен.'}
                  </div>
                )}
              </div>
            </div>
          ) : (
            /* ========================================================================= */
            /* STANDARD ARTICLE COMPARISONS (WITH WAS / BECAME DIFF TABLES)              */
            /* ========================================================================= */
            <>
              {/* Articles Header */}
              <div id="section-articles" style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                  <h3 style={{ fontSize: 16, fontWeight: 800, color: R.text, margin: 0 }}>
                    Статьи законопроекта
                  </h3>
                  <span style={{ fontFamily: mono, fontSize: 11, padding: '2px 8px', background: R.accentSubtle, color: R.accent, border: `1px solid ${R.accentBorder}`, borderRadius: 2 }}>
                    {bill.comparisons.length}
                  </span>
                </div>

                {canEdit && !isReadOnly && (
                  <button
                    onClick={addComparisonRow}
                    style={{ ...btnOutline, height: 32, fontSize: 12 }}
                  >
                    <Plus size={14} /> Добавить статью
                  </button>
                )}
              </div>

              {/* Articles List */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
                {bill.comparisons.map((row, index) => {
                  const diff = computeWordDiff(row.wasContent, row.becameContent);
                  const activeTab = activeTabMap[row.id] || 'editor';

                  return (
                    <div
                      key={row.id}
                      style={{
                        background: R.bgPanel,
                        border: ft.edge,
                        borderRadius: 2,
                        overflow: 'hidden',
                        display: 'flex',
                        flexDirection: 'column',
                      }}
                    >
                      {/* Article Card Header */}
                      <div
                        style={{
                          background: R.bgElevated,
                          padding: '10px 14px',
                          borderBottom: ft.hair,
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'space-between',
                          gap: 12,
                          flexWrap: 'wrap',
                        }}
                      >
                        <div style={{ display: 'flex', alignItems: 'center', gap: 8, flex: '1 1 360px', flexWrap: 'wrap' }}>
                          <span style={{ fontFamily: mono, fontSize: 12, fontWeight: 700, color: R.textMuted }}>
                            §{index + 1}
                          </span>

                          {/* Target Law selector per row for multi-law legislation */}
                          <LawSelectPicker
                            variant="compact"
                            value={row.targetLaw || bill.targetLaw || 'Дорожный Кодекс штата Сан-Андреас'}
                            onChange={(lawTitle) => {
                              updateComparisonRow(row.id, 'targetLaw', lawTitle);
                              onToast('info', `Для §${index + 1} выбран закон: ${lawTitle}`);
                            }}
                            disabled={!canEdit || isReadOnly}
                          />

                          <input
                            type="text"
                            value={row.articleTitle}
                            onChange={(e) => updateComparisonRow(row.id, 'articleTitle', e.target.value)}
                            disabled={!canEdit || isReadOnly}
                            style={{
                              flex: '1 1 auto',
                              minWidth: 160,
                              background: 'transparent',
                              border: 'none',
                              fontSize: 13,
                              fontWeight: 700,
                              color: R.text,
                              outline: 'none',
                            }}
                            placeholder="Статья 1. Наименование статьи..."
                          />
                        </div>

                        <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                          {/* Editor vs Diff Tabs */}
                          <div
                            style={{
                              display: 'flex',
                              alignItems: 'center',
                              background: R.bgInput,
                              border: ft.hair,
                              borderRadius: 2,
                              padding: 2,
                            }}
                          >
                            <button
                              type="button"
                              onClick={() => setActiveTabMap((prev) => ({ ...prev, [row.id]: 'editor' }))}
                              style={{
                                padding: '3px 8px',
                                fontSize: 11,
                                fontWeight: 700,
                                background: activeTab === 'editor' ? R.bgElevated : 'transparent',
                                color: activeTab === 'editor' ? R.accent : R.textMuted,
                                border: 'none',
                                borderRadius: 2,
                                cursor: 'pointer',
                              }}
                            >
                              Редактор
                            </button>
                            <button
                              type="button"
                              onClick={() => setActiveTabMap((prev) => ({ ...prev, [row.id]: 'diff' }))}
                              style={{
                                padding: '3px 8px',
                                fontSize: 11,
                                fontWeight: 700,
                                background: activeTab === 'diff' ? R.bgElevated : 'transparent',
                                color: activeTab === 'diff' ? R.accent : R.textMuted,
                                border: 'none',
                                borderRadius: 2,
                                cursor: 'pointer',
                              }}
                            >
                              Сравнение
                            </button>
                          </div>

                          {canEdit && !isReadOnly && (
                            <button
                              type="button"
                              onClick={() => {
                                if (!row.articleTitle || !row.articleTitle.trim()) {
                                  onToast('info', 'Укажите номер или название статьи (например: 9.1 или Статья 1)');
                                  return;
                                }
                                const lawToFetch = row.targetLaw || bill.targetLaw || 'Дорожный кодекс (ДК)';
                                const latestText = getLatestArticleContent(lawToFetch, row.articleTitle);
                                if (latestText) {
                                  updateComparisonRow(row.id, 'wasContent', latestText);
                                  onToast('success', `Исходный текст статьи «${row.articleTitle}» загружен из «${lawToFetch}»!`);
                                } else {
                                  onToast('error', `Статья «${row.articleTitle}» не найдена в законе «${lawToFetch}»`);
                                }
                              }}
                              title="Загрузить актуальный текст статьи из действующей редакции выбранного закона в «Было»"
                              style={{
                                height: 26,
                                padding: '0 8px',
                                fontSize: 11,
                                fontWeight: 700,
                                background: 'rgba(236, 199, 129, 0.1)',
                                border: `1px solid ${R.accentBorder}`,
                                borderRadius: 2,
                                color: R.accent,
                                display: 'flex',
                                alignItems: 'center',
                                gap: 4,
                                cursor: 'pointer',
                              }}
                            >
                              <Zap size={11} />
                              <span>Из закона</span>
                            </button>
                          )}

                          {canEdit && !isReadOnly && (
                            <button
                              type="button"
                              onClick={() => copyWasToBecame(row.id)}
                              title="Скопировать исходный текст в новую редакцию"
                              style={{
                                width: 28,
                                height: 28,
                                display: 'grid',
                                placeItems: 'center',
                                background: 'transparent',
                                border: 'none',
                                color: R.textMuted,
                                cursor: 'pointer',
                              }}
                            >
                              <Copy size={13} />
                            </button>
                          )}

                          <button
                            type="button"
                            onClick={() => setExpandedRow(row)}
                            title="На весь экран"
                            style={{
                              width: 28,
                              height: 28,
                              display: 'grid',
                              placeItems: 'center',
                              background: 'transparent',
                              border: 'none',
                              color: R.textMuted,
                              cursor: 'pointer',
                            }}
                          >
                            <Maximize2 size={13} />
                          </button>

                          {canEdit && !isReadOnly && bill.comparisons.length > 1 && (
                            <button
                              type="button"
                              onClick={() => setConfirmDeleteArticleId(row.id)}
                              data-tooltip="Удалить статью"
                              style={{
                                width: 28,
                                height: 28,
                                display: 'grid',
                                placeItems: 'center',
                                background: 'transparent',
                                border: 'none',
                                color: R.danger,
                                cursor: 'pointer',
                              }}
                            >
                              <Trash2 size={13} />
                            </button>
                          )}
                        </div>
                      </div>

                      {/* TAB 1: Editor Side-by-Side */}
                      {activeTab === 'editor' && (
                        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', minHeight: 180 }}>
                          <div style={{ display: 'flex', flexDirection: 'column', borderRight: ft.hair }}>
                            <div style={{ padding: '6px 12px', background: R.bg, borderBottom: ft.hair, display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                              <span style={{ ...label, fontSize: 9.5 }}>Действующий текст</span>
                              {canEdit && !isReadOnly && (
                                <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                                    <button
                                      type="button"
                                      onClick={() => {
                                        const lawToFetch = row.targetLaw || bill.targetLaw || 'Дорожный кодекс (ДК)';
                                        const latest = getLatestArticleContent(lawToFetch, row.articleTitle);
                                        if (latest) {
                                          updateComparisonRow(row.id, 'wasContent', latest);
                                          onToast('success', `Исходный текст статьи «${row.articleTitle}» загружен из «${lawToFetch}»!`);
                                        } else {
                                          onToast('info', `Статья «${row.articleTitle}» не найдена в действующей редакции «${lawToFetch}»`);
                                        }
                                      }}
                                      data-tooltip="Подтянуть действующий текст из актуального закона"
                                      style={{ fontSize: 10, fontFamily: mono, fontWeight: 700, color: '#ecc781', background: 'none', border: 'none', cursor: 'pointer' }}
                                    >
                                      ⚡ Из закона
                                    </button>
                                  <button
                                    type="button"
                                    onClick={() => updateComparisonRow(row.id, 'wasContent', '[Ранее статья в законе отсутствовала]')}
                                    style={{ fontSize: 10, fontFamily: mono, fontWeight: 700, color: R.accentText, background: 'none', border: 'none', cursor: 'pointer' }}
                                  >
                                    + Ранее не было
                                  </button>
                                </div>
                              )}
                            </div>
                            <textarea
                              value={row.wasContent}
                              onChange={(e) => updateComparisonRow(row.id, 'wasContent', e.target.value)}
                              disabled={!canEdit || isReadOnly}
                              style={{
                                width: '100%',
                                flex: '1 1 auto',
                                padding: 12,
                                background: R.bgInput,
                                border: 'none',
                                fontSize: 13,
                                color: R.textSecondary,
                                outline: 'none',
                                resize: 'none',
                                lineHeight: 1.5,
                              }}
                              placeholder="Исходный текст статьи..."
                            />
                          </div>

                          <div style={{ display: 'flex', flexDirection: 'column' }}>
                            <div style={{ padding: '6px 12px', background: R.bg, borderBottom: ft.hair }}>
                              <span style={{ ...label, fontSize: 9.5 }}>Новая редакция</span>
                            </div>
                            <textarea
                              value={row.becameContent}
                              onChange={(e) => updateComparisonRow(row.id, 'becameContent', e.target.value)}
                              disabled={!canEdit || isReadOnly}
                              style={{
                                width: '100%',
                                flex: '1 1 auto',
                                padding: 12,
                                background: R.bgInput,
                                border: 'none',
                                fontSize: 13,
                                color: R.text,
                                outline: 'none',
                                resize: 'none',
                                lineHeight: 1.5,
                              }}
                              placeholder="Предлагаемая редакция статьи..."
                            />
                          </div>
                        </div>
                      )}

                      {/* TAB 2: Diff */}
                      {activeTab === 'diff' && (
                        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', minHeight: 180 }}>
                          <div style={{ display: 'flex', flexDirection: 'column', borderRight: ft.hair }}>
                            <div style={{ padding: '6px 12px', background: R.bg, borderBottom: ft.hair }}>
                              <span style={{ ...label, fontSize: 9.5, color: R.danger }}>Действующий текст</span>
                            </div>
                            <div style={{ padding: 12, fontSize: 13, color: R.text, lineHeight: 1.5, whiteSpace: 'pre-wrap' }}>
                              {diff.wasFormatted.length > 0 ? diff.wasFormatted : <span style={{ color: R.textMuted }}>Текст не заполнен</span>}
                            </div>
                          </div>

                          <div style={{ display: 'flex', flexDirection: 'column' }}>
                            <div style={{ padding: '6px 12px', background: R.bg, borderBottom: ft.hair }}>
                              <span style={{ ...label, fontSize: 9.5, color: R.success }}>Новая редакция</span>
                            </div>
                            <div style={{ padding: 12, fontSize: 13, color: R.text, lineHeight: 1.5, whiteSpace: 'pre-wrap' }}>
                              {diff.becameFormatted.length > 0 ? diff.becameFormatted : <span style={{ color: R.textMuted }}>Текст не заполнен</span>}
                            </div>
                          </div>
                        </div>
                      )}

                    </div>
                  );
                })}
              </div>
            </>
          )}

          {/* Attachments (Media) */}
          <div id="section-photos" style={{ background: R.bgPanel, border: ft.edge, borderRadius: 2, padding: 20 }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 14 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <ImageIcon size={16} color={R.accent} />
                <h3 style={{ fontSize: 14, fontWeight: 800, color: R.text, margin: 0 }}>
                  Фотоматериалы и приложения
                </h3>
              </div>
              <span style={{ fontSize: 11, fontFamily: mono, color: R.textMuted }}>
                Ссылки (.jpg, .png, .webp)
              </span>
            </div>
            
            <ImageUploader 
              attachments={bill.attachments || []} 
              onChange={(urls) => setBill({ ...bill, attachments: urls })}
              disabled={!canEdit || isReadOnly}
            />
          </div>

        </div>

        {/* RIGHT COLUMN: Sidebar (Author, Votes, Verdicts, Comments) */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
          
          {/* Author Card */}
          <div style={{ background: R.bgPanel, border: ft.edge, borderRadius: 2, padding: 16 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 12 }}>
              <div style={{ width: 34, height: 34, display: 'grid', placeItems: 'center', background: R.bgInput, border: ft.hair, borderRadius: 2 }}>
                <UserCheck size={16} color={R.accent} />
              </div>
              <div style={{ minWidth: 0 }}>
                <div style={{ fontSize: 13, fontWeight: 700, color: R.text, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                  {bill.author || 'Автор не указан'}
                </div>
                <div style={{ fontSize: 10.5, fontFamily: mono, color: R.textMuted }}>
                  Автор законопроекта
                </div>
              </div>
            </div>

            <div style={{ borderTop: ft.hair, paddingTop: 10, display: 'flex', flexDirection: 'column', gap: 4, fontSize: 11, fontFamily: mono }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', color: R.textMuted }}>
                <span>Создан:</span>
                <span style={{ color: R.text }}>{new Date(bill.createdAt).toLocaleDateString('ru-RU')}</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', color: R.textMuted }}>
                <span>Обновлен:</span>
                <span style={{ color: R.text }}>{new Date(bill.updatedAt).toLocaleDateString('ru-RU')}</span>
              </div>
            </div>
          </div>

          {/* Stage 1: Commission Voting */}
          <div style={{ background: R.bgPanel, border: ft.edge, borderRadius: 2, padding: 16 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 12, paddingBottom: 8, borderBottom: ft.hair }}>
              <ShieldCheck size={16} color={R.accent} />
              <div>
                <h4 style={{ fontSize: 13, fontWeight: 800, color: R.text, margin: 0 }}>
                  1-й Этап: Комиссия
                </h4>
                <div style={{ fontSize: 10, fontFamily: mono, color: R.textMuted, textTransform: 'uppercase' }}>
                  Кворум 2/3 голосов
                </div>
              </div>
            </div>

            {/* Voting rows */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: 6, marginBottom: 14 }}>
              {[
                { roleKey: 'prosecutor', title: 'Ген. Прокурор', vote: votes.prosecutor },
                { roleKey: 'judge', title: 'Пред. Верх. Суда', vote: votes.judge },
                { roleKey: 'governor', title: 'Губернатор', vote: votes.governor },
              ].map((item) => (
                <div
                  key={item.roleKey}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    padding: '8px 10px',
                    background: R.bgInput,
                    border: ft.hair,
                    borderRadius: 2,
                  }}
                >
                  <span style={{ fontSize: 12, color: R.textSecondary }}>{item.title}</span>
                  {item.vote === 'approved' ? (
                    <span style={{ fontSize: 11, fontFamily: mono, fontWeight: 700, color: R.success }}>
                      ✓ ЗА
                    </span>
                  ) : item.vote === 'rejected' ? (
                    <span style={{ fontSize: 11, fontFamily: mono, fontWeight: 700, color: R.danger }}>
                      ✕ ПРОТИВ
                    </span>
                  ) : item.vote === 'needs_revision' ? (
                    <span style={{ fontSize: 11, fontFamily: mono, fontWeight: 700, color: R.accentText }}>
                      ПРАВКИ
                    </span>
                  ) : (
                    <span style={{ fontSize: 11, fontFamily: mono, color: R.textMuted }}>
                      ОЖИДАЕТ
                    </span>
                  )}
                </div>
              ))}
            </div>

            {/* Progress summary bar */}
            <div style={{ marginBottom: 12 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 10, fontFamily: mono, fontWeight: 700, textTransform: 'uppercase', marginBottom: 6 }}>
                <span style={{ color: isStage1Passed ? R.success : isStage1Rejected ? R.danger : R.textMuted }}>
                  {isStage1Passed ? 'Одобрено Комиссией' : isStage1Rejected ? 'Отклонено' : 'Итог'}
                </span>
                <span style={{ color: R.textMuted }}>{approvedVotesCount} За / {rejectedVotesCount} Против</span>
              </div>
              <div style={{ height: 6, width: '100%', background: R.bgInput, borderRadius: 2, overflow: 'hidden', display: 'flex' }}>
                {approvedVotesCount > 0 && <div style={{ height: '100%', width: `${(approvedVotesCount / 3) * 100}%`, background: R.success }} />}
                {rejectedVotesCount > 0 && <div style={{ height: '100%', width: `${(rejectedVotesCount / 3) * 100}%`, background: R.danger }} />}
              </div>
            </div>

            {/* Voting buttons for commission members */}
            {['under_review', 'rejected', 'needs_revision'].includes(bill.status) && !bill.federalVerdict && (() => {
              const myVote = (user.officialRole === 'prosecutor' ? votes.prosecutor : user.officialRole === 'judge' ? votes.judge : votes.governor);
              return (
                <div style={{ display: 'flex', gap: 6, marginTop: 10 }}>
                  <button
                    onClick={() => handleCastVote('approved')}
                    style={{ ...btnOutline, flex: '1 1 0', height: 30, fontSize: 11, background: myVote === 'approved' ? R.success : 'transparent', color: myVote === 'approved' ? '#fff' : R.text }}
                  >
                    За
                  </button>
                  <button
                    onClick={() => handleCastVote('needs_revision')}
                    style={{ ...btnOutline, flex: '1 1 0', height: 30, fontSize: 11, background: myVote === 'needs_revision' ? R.accent : 'transparent', color: myVote === 'needs_revision' ? '#fff' : R.text }}
                  >
                    Правки
                  </button>
                  <button
                    onClick={() => handleCastVote('rejected')}
                    style={{ ...btnDanger, flex: '1 1 0', height: 30, fontSize: 11, background: myVote === 'rejected' ? R.danger : 'transparent', color: myVote === 'rejected' ? '#fff' : R.danger }}
                  >
                    Против
                  </button>
                </div>
              );
            })()}
          </div>

          {/* Stage 2: Administration Verdict */}
          <div style={{ background: R.bgPanel, border: ft.edge, borderRadius: 2, padding: 16 }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12, paddingBottom: 8, borderBottom: ft.hair }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <Crown size={16} color={R.accent} />
                <div>
                  <h4 style={{ fontSize: 13, fontWeight: 800, color: R.text, margin: 0 }}>
                    2-й Этап: Администрация
                  </h4>
                  <div style={{ fontSize: 10, fontFamily: mono, color: R.textMuted, textTransform: 'uppercase' }}>
                    Федеральное Правительство
                  </div>
                </div>
              </div>

              {isAdmin && bill.federalVerdict && (
                <button
                  type="button"
                  onClick={() => {
                    setIsEditingAdminVerdict((v) => !v);
                    if (!isEditingAdminVerdict) {
                      setAdminVerdictReason(bill.federalVerdict?.reason || '');
                    }
                  }}
                  style={{
                    background: 'transparent',
                    border: 'none',
                    color: R.accentText,
                    fontSize: 11,
                    cursor: 'pointer',
                    textDecoration: 'underline',
                    padding: 0
                  }}
                >
                  {isEditingAdminVerdict ? 'Отмена' : 'Изменить'}
                </button>
              )}
            </div>

            {/* Admin editing form OR no verdict yet and isAdmin */}
            {(isEditingAdminVerdict || (!bill.federalVerdict && isAdmin)) ? (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                <div style={{ fontSize: 11, fontWeight: 600, color: R.textSecondary }}>
                  {bill.federalVerdict ? 'Пересмотр вердикта ФП:' : 'Вынести вердикт ФП:'}
                </div>
                <textarea
                  value={adminVerdictReason}
                  onChange={(e) => setAdminVerdictReason(e.target.value)}
                  style={{
                    width: '100%',
                    minHeight: 74,
                    background: R.bgInput,
                    border: ft.edge,
                    color: R.text,
                    fontSize: 12,
                    padding: 8,
                    borderRadius: 2,
                    outline: 'none',
                  }}
                  placeholder="Укажите причину одобрения, замечания для правок или причину отказа..."
                />
                <div style={{ display: 'flex', gap: 6 }}>
                  <button onClick={() => handleExecuteAdminVerdict('approved')} style={{ ...btnAccent, flex: '1 1 0', height: 28, fontSize: 11 }}>Одобрить</button>
                  <button onClick={() => handleExecuteAdminVerdict('needs_revision')} style={{ ...btnOutline, flex: '1 1 0', height: 28, fontSize: 11 }}>Правки</button>
                  <button onClick={() => handleExecuteAdminVerdict('rejected')} style={{ ...btnDanger, flex: '1 1 0', height: 28, fontSize: 11 }}>Отклонить</button>
                </div>
              </div>
            ) : bill.federalVerdict ? (
              /* Display federal verdict to author, commission, and admin */
              <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                <div
                  style={{
                    padding: 10,
                    borderRadius: 2,
                    background: bill.federalVerdict.status === 'approved'
                      ? R.successSubtle
                      : bill.federalVerdict.status === 'needs_revision'
                      ? 'rgba(234, 179, 8, 0.1)'
                      : R.dangerSubtle,
                    border: `1px solid ${
                      bill.federalVerdict.status === 'approved'
                        ? R.success
                        : bill.federalVerdict.status === 'needs_revision'
                        ? 'rgba(234, 179, 8, 0.35)'
                        : R.danger
                    }`,
                  }}
                >
                  <div
                    style={{
                      fontSize: 10,
                      fontFamily: mono,
                      fontWeight: 800,
                      color: bill.federalVerdict.status === 'approved'
                        ? R.success
                        : bill.federalVerdict.status === 'needs_revision'
                        ? '#eab308'
                        : R.danger,
                      marginBottom: 4,
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between'
                    }}
                  >
                    <span>
                      {bill.federalVerdict.status === 'approved'
                        ? (bill.status === 'approved' && bill.statusReason?.includes('внесен') ? '✓ ВНЕСЕН В РЕЕСТР' : '✓ ОДОБРЕНО АДМИНИСТРАЦИЕЙ')
                        : bill.federalVerdict.status === 'needs_revision'
                        ? '⚠ НА ДОРАБОТКУ (ПРАВКИ)'
                        : '✕ ОТКЛОНЕНО АДМИНИСТРАЦИЕЙ'}
                    </span>
                  </div>

                  <div style={{ fontSize: 11, color: R.textMuted, marginBottom: 6 }}>
                    <div>Указал: <strong style={{ color: R.textSecondary }}>{bill.federalVerdict.adminName || 'Федеральное Правительство'}</strong></div>
                    {bill.federalVerdict.updatedAt && (
                      <div style={{ fontFamily: mono, fontSize: 10 }}>
                        {new Date(bill.federalVerdict.updatedAt).toLocaleDateString('ru-RU')}
                      </div>
                    )}
                  </div>

                  <div style={{ fontSize: 10, fontFamily: mono, color: R.textMuted, marginBottom: 2, textTransform: 'uppercase' }}>
                    Причина / Указание ФП:
                  </div>
                  <div style={{ fontSize: 12, color: R.text, whiteSpace: 'pre-wrap', lineHeight: 1.4, background: R.bgPanel, padding: 6, border: ft.hair, borderRadius: 2 }}>
                    {bill.federalVerdict.reason || 'Причина не указана.'}
                  </div>
                </div>

                {bill.federalVerdict.status === 'approved' && bill.status !== 'approved' && isAdmin && (
                  <button
                    onClick={handleEnactLaws}
                    style={{ ...btnAccent, height: 32, fontSize: 12, width: '100%' }}
                  >
                    Внести в реестр законодательства
                  </button>
                )}
              </div>
            ) : (
              <div style={{ fontSize: 11, fontFamily: mono, color: R.textMuted, textAlign: 'center', padding: '8px 0' }}>
                {isStage1Passed ? 'Ожидает решения Администрации' : 'Доступно после 1-го этапа'}
              </div>
            )}
          </div>

          {/* Comments Section */}
          <div style={{ background: R.bgPanel, border: ft.edge, borderRadius: 2, padding: 16 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 12, paddingBottom: 8, borderBottom: ft.hair }}>
              <MessageSquare size={16} color={R.accent} />
              <h4 style={{ fontSize: 13, fontWeight: 800, color: R.text, margin: 0 }}>
                Обсуждение ({bill.comments?.length || 0})
              </h4>
            </div>
            
            <CommentsSection 
              billId={bill.id}
              user={user}
              comments={bill.comments || []}
              canComment={!isReadOnly && (canEdit || isOfficial)}
              onAddComment={(updatedComments) => handleFieldChange('comments', updatedComments)}
            />
          </div>

        </div>

      </div>

      {expandedRow && (
        <ExpandedArticleModal
          row={bill.comparisons.find(r => r.id === expandedRow.id) || expandedRow}
          canEdit={canEdit && !isReadOnly}
          onUpdateRow={(id, field, val) => {
            updateComparisonRow(id, field, val);
            setExpandedRow((prev) => prev ? { ...prev, [field]: val } : null);
          }}
          onClose={() => setExpandedRow(null)}
        />
      )}

      {/* Hidden Print View for PDF Export */}
      <div style={{ position: 'absolute', top: '-9999px', left: '-9999px' }}>
        <div id="pdf-content-container">
          <BillPrintView bill={bill} />
        </div>
      </div>

      {/* In-UI Article Deletion Confirmation Modal */}
      {confirmDeleteArticleId && (
        <ConfirmModal
          title="Удалить статью из проекта?"
          message="Вы действительно хотите удалить эту статью? Внесённый текст действующей редакции и предлагаемых поправок будет безвозвратно удален."
          confirmLabel="Удалить статью"
          onConfirm={() => {
            removeComparisonRow(confirmDeleteArticleId);
            setConfirmDeleteArticleId(null);
          }}
          onCancel={() => setConfirmDeleteArticleId(null)}
        />
      )}

      {showEnactModal && isAdmin && (
        <EnactLawModal
          bill={bill}
          isOpen={true}
          onClose={() => setShowEnactModal(false)}
          onEnacted={async (updatedBill) => {
            setBill(updatedBill);
            await onSave(updatedBill);
          }}
          onToast={onToast}
        />
      )}
    </div>
  );
};
