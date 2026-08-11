import React, { useState, useEffect, useRef } from 'react';
import type { Bill, ComparisonRow, AccessPermission, UserProfile, BillStatus } from '../types/bill';
import { CommentsSection } from './CommentsSection';
import { ExpandedArticleModal } from './ExpandedArticleModal';
import { 
  ArrowLeft, 
  Save, 
  Share2, 
  Plus, 
  Trash2, 
  CheckCircle2, 
  XCircle, 
  Clock, 
  FileText, 
  RotateCcw,
  Maximize2,
  Send,
  MessageSquare
} from 'lucide-react';

interface BillEditorProps {
  bill: Bill;
  user: UserProfile;
  permission: AccessPermission;
  onSave: (updatedBill: Bill) => void;
  onBack: () => void;
  onShare: (bill: Bill) => void;
  onToast: (type: 'success' | 'error' | 'info', text: string) => void;
}

export const BillEditor: React.FC<BillEditorProps> = ({
  bill: initialBill,
  user,
  permission,
  onSave,
  onBack,
  onShare,
  onToast
}) => {
  const [bill, setBill] = useState<Bill>(initialBill);
  const [activeTab, setActiveTab] = useState<'editor' | 'comments'>('editor');
  const [isSavedNotice, setIsSavedNotice] = useState(false);
  const [expandedRow, setExpandedRow] = useState<ComparisonRow | null>(null);

  const canEdit = permission === 'edit';

  // Auto-save draft on changes so browser refresh never loses draft state
  const isInitialMount = useRef(true);
  useEffect(() => {
    if (isInitialMount.current) {
      isInitialMount.current = false;
      return;
    }
    if (canEdit) {
      const timer = setTimeout(() => {
        onSave(bill);
      }, 500);
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
        return newRow;
      });
      return { ...prev, comparisons: updatedComparisons };
    });
  };

  const removeComparisonRow = (id: string) => {
    if (!canEdit) return;
    const updated = bill.comparisons.filter((row) => row.id !== id);
    handleFieldChange('comparisons', updated);
    onToast('info', 'Статья удалена');
  };

  const handleLocalSave = async () => {
    await onSave(bill);
    setIsSavedNotice(true);
    setTimeout(() => setIsSavedNotice(false), 3000);
    onToast('success', 'Законопроект сохранен');
  };

  const handlePublish = async () => {
    const updated = { ...bill, status: 'under_review' as BillStatus };
    setBill(updated);
    await onSave(updated);
    onToast('success', 'Законопроект отправлен на рассмотрение в Парламент / Губернатору');
  };

  const getStatusBadge = (status: BillStatus) => {
    const map: Record<BillStatus, { label: string; cls: string; icon: any }> = {
      draft: { label: 'Черновик', cls: 'badge-status-draft', icon: Clock },
      under_review: { label: 'На рассмотрении', cls: 'badge-status-review', icon: Clock },
      needs_revision: { label: 'На доработке', cls: 'badge-status-revision', icon: RotateCcw },
      approved: { label: 'Одобрен', cls: 'badge-status-approved', icon: CheckCircle2 },
      rejected: { label: 'Отклонен', cls: 'badge-status-rejected', icon: XCircle }
    };
    const mapped = map[status] || map.draft;
    const Icon = mapped.icon;
    
    return (
      <div className={`badge ${mapped.cls}`}>
        <Icon size={14} /> {mapped.label}
      </div>
    );
  };

  const isReadOnly = bill.status === 'approved' || bill.status === 'rejected';

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100vh', background: 'var(--bg-base)' }}>
      
      {/* EXECUTIVE TOOLBAR */}
      <div style={{ 
        height: '64px', 
        background: 'var(--bg-surface)', 
        backdropFilter: 'blur(20px)',
        borderBottom: '1px solid var(--border-subtle)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        padding: '0 28px',
        position: 'sticky',
        top: 0,
        zIndex: 100,
        boxShadow: 'var(--shadow-sm)'
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
          <button onClick={onBack} className="btn btn-secondary btn-pill" style={{ padding: '8px 14px' }}>
            <ArrowLeft size={18} /> К списку
          </button>
          
          <div style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
            <h2 style={{ fontSize: '1.15rem', margin: 0, color: 'var(--text-primary)', fontWeight: 700, letterSpacing: '-0.01em' }}>
              {bill.targetLaw || 'Редактор законопроекта'}
            </h2>
            {getStatusBadge(bill.status)}
          </div>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          {isSavedNotice && (
            <span style={{ fontSize: '0.85rem', color: 'var(--success-text)', display: 'flex', alignItems: 'center', gap: '6px', marginRight: '8px', fontWeight: 600 }}>
              <CheckCircle2 size={16} /> Сохранено
            </span>
          )}
          
          <button onClick={() => onShare(bill)} className="btn btn-secondary btn-pill" style={{ padding: '8px 18px' }}>
            <Share2 size={16} /> Поделиться
          </button>

          {canEdit && !isReadOnly && (
            <button onClick={handleLocalSave} className="btn btn-primary btn-pill" style={{ padding: '8px 22px' }}>
              <Save size={16} /> Сохранить
            </button>
          )}
        </div>
      </div>

      <div style={{ flex: 1, display: 'flex', overflow: 'hidden' }}>
        
        {/* MAIN WORKSPACE CONTENT AREA */}
        <div style={{ flex: 1, overflowY: 'auto', padding: '36px 40px' }}>
          <div className="animate-fade-in" style={{ maxWidth: '1040px', margin: '0 auto', display: 'flex', flexDirection: 'column', gap: '28px' }}>
            
            {/* LAW METADATA CARD */}
            <div className="card" style={{ padding: '28px' }}>
              <div style={{ marginBottom: '20px' }}>
                <label className="input-label">Изменяемый Закон / Нормативный Акт</label>
                <input 
                  type="text" 
                  value={bill.targetLaw}
                  onChange={(e) => handleFieldChange('targetLaw', e.target.value)}
                  disabled={!canEdit || isReadOnly}
                  className="input-field"
                  style={{ width: '100%', fontSize: '1.1rem', fontWeight: 700 }}
                  placeholder="Например: Уголовный кодекс Штата (УК)"
                />
              </div>

              <div>
                <label className="input-label">Пояснительная записка (Обоснование инициативы)</label>
                <textarea 
                  value={bill.explanatoryNote}
                  onChange={(e) => handleFieldChange('explanatoryNote', e.target.value)}
                  disabled={!canEdit || isReadOnly}
                  className="input-field"
                  style={{ width: '100%', minHeight: '90px', resize: 'vertical', lineHeight: 1.5 }}
                  placeholder="Опишите цели, причины и необходимость вносимых поправок..."
                />
              </div>
            </div>

            {/* ARTICLES HEADER */}
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <div>
                <h3 style={{ margin: 0, fontSize: '1.2rem', fontWeight: 700, color: 'var(--text-primary)' }}>
                  Статьи к изменению ({bill.comparisons.length})
                </h3>
                <p style={{ margin: '2px 0 0 0', fontSize: '0.82rem', color: 'var(--text-muted)' }}>
                  Укажите действующую редакцию слева и предлагаемые изменения справа
                </p>
              </div>

              {canEdit && !isReadOnly && (
                <button onClick={addComparisonRow} className="btn btn-primary btn-pill" style={{ fontSize: '0.86rem', padding: '8px 20px' }}>
                  <Plus size={16} /> Добавить статью
                </button>
              )}
            </div>

            {/* COMPARISON CARDS LIST */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
              {bill.comparisons.map((row, index) => (
                <div key={row.id} className="card" style={{ padding: '0', overflow: 'hidden', border: '1px solid var(--border-medium)' }}>
                  
                  {/* CARD HEADER BAR */}
                  <div style={{ 
                    background: 'var(--bg-surface-elevated)', 
                    padding: '14px 24px', 
                    borderBottom: '1px solid var(--border-subtle)', 
                    display: 'flex', 
                    alignItems: 'center', 
                    justifyContent: 'space-between' 
                  }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '14px', flex: 1 }}>
                      <span style={{ fontSize: '0.88rem', color: 'var(--text-accent)', fontWeight: 800 }}>#{index + 1}</span>
                      <input 
                        type="text" 
                        value={row.articleTitle}
                        onChange={(e) => updateComparisonRow(row.id, 'articleTitle', e.target.value)}
                        disabled={!canEdit || isReadOnly}
                        className="input-field"
                        style={{ width: '360px', padding: '8px 16px', fontWeight: 600, fontSize: '0.92rem' }}
                        placeholder="Например: Статья 1. Общие положения"
                      />
                    </div>
                    
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                      <button 
                        onClick={() => setExpandedRow(row)}
                        className="btn btn-secondary"
                        style={{ padding: '6px 12px', fontSize: '0.78rem' }}
                        title="Развернуть в полноэкранный режим"
                      >
                        <Maximize2 size={14} /> На весь экран
                      </button>

                      {canEdit && !isReadOnly && bill.comparisons.length > 1 && (
                        <button 
                          onClick={() => removeComparisonRow(row.id)}
                          className="btn btn-ghost"
                          style={{ padding: '6px', color: 'var(--danger-text)' }}
                          title="Удалить статью"
                        >
                          <Trash2 size={16} />
                        </button>
                      )}
                    </div>
                  </div>

                  {/* SIDE-BY-SIDE EDITOR TEXT AREAS */}
                  <div style={{ display: 'flex', width: '100%', minHeight: '200px' }}>
                    
                    {/* LEFT: ORIGINAL TEXT */}
                    <div style={{ flex: 1, borderRight: '1px solid var(--border-subtle)', display: 'flex', flexDirection: 'column' }}>
                      <div style={{ 
                        padding: '8px 24px', 
                        background: 'rgba(239, 68, 68, 0.08)', 
                        color: 'var(--danger-text)', 
                        fontSize: '0.74rem', 
                        fontWeight: 700, 
                        textTransform: 'uppercase', 
                        letterSpacing: '0.05em', 
                        borderBottom: '1px solid var(--border-subtle)' 
                      }}>
                        Действующая редакция (Было)
                      </div>
                      <textarea 
                        value={row.wasContent}
                        onChange={(e) => updateComparisonRow(row.id, 'wasContent', e.target.value)}
                        disabled={!canEdit || isReadOnly}
                        style={{ 
                          flex: 1, 
                          border: 'none', 
                          background: 'transparent', 
                          color: 'var(--text-primary)', 
                          padding: '18px 24px', 
                          resize: 'vertical', 
                          outline: 'none', 
                          fontFamily: 'var(--font-sans)', 
                          fontSize: '0.92rem', 
                          lineHeight: 1.6 
                        }}
                        placeholder="Вставьте текущую редакцию статьи..."
                      />
                    </div>

                    {/* RIGHT: PROPOSED NEW TEXT */}
                    <div style={{ flex: 1, display: 'flex', flexDirection: 'column' }}>
                      <div style={{ 
                        padding: '8px 24px', 
                        background: 'rgba(16, 185, 129, 0.08)', 
                        color: 'var(--success-text)', 
                        fontSize: '0.74rem', 
                        fontWeight: 700, 
                        textTransform: 'uppercase', 
                        letterSpacing: '0.05em', 
                        borderBottom: '1px solid var(--border-subtle)' 
                      }}>
                        Проектируемая редакция (Стало)
                      </div>
                      <textarea 
                        value={row.becameContent}
                        onChange={(e) => updateComparisonRow(row.id, 'becameContent', e.target.value)}
                        disabled={!canEdit || isReadOnly}
                        style={{ 
                          flex: 1, 
                          border: 'none', 
                          background: 'transparent', 
                          color: 'var(--text-primary)', 
                          padding: '18px 24px', 
                          resize: 'vertical', 
                          outline: 'none', 
                          fontFamily: 'var(--font-sans)', 
                          fontSize: '0.92rem', 
                          lineHeight: 1.6 
                        }}
                        placeholder="Внесите предлагаемые поправки и изменения..."
                      />
                    </div>

                  </div>
                </div>
              ))}
            </div>

          </div>
        </div>

        {/* RIGHT SIDEBAR: METADATA & ACTIONS */}
        <div style={{ 
          width: '320px', 
          background: 'var(--bg-surface)', 
          borderLeft: '1px solid var(--border-subtle)', 
          display: 'flex', 
          flexDirection: 'column' 
        }}>
          {/* TAB PIPES */}
          <div style={{ display: 'flex', borderBottom: '1px solid var(--border-subtle)', background: 'var(--bg-input)' }}>
            <button
              onClick={() => setActiveTab('editor')}
              style={{
                flex: 1,
                padding: '14px',
                border: 'none',
                background: activeTab === 'editor' ? 'var(--bg-surface)' : 'transparent',
                color: activeTab === 'editor' ? 'var(--text-accent)' : 'var(--text-muted)',
                fontWeight: 600,
                fontSize: '0.84rem',
                borderBottom: activeTab === 'editor' ? '2px solid var(--primary)' : 'none',
                cursor: 'pointer',
                display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px'
              }}
            >
              <FileText size={15} /> Сведения
            </button>
            <button
              onClick={() => setActiveTab('comments')}
              style={{
                flex: 1,
                padding: '14px',
                border: 'none',
                background: activeTab === 'comments' ? 'var(--bg-surface)' : 'transparent',
                color: activeTab === 'comments' ? 'var(--text-accent)' : 'var(--text-muted)',
                fontWeight: 600,
                fontSize: '0.84rem',
                borderBottom: activeTab === 'comments' ? '2px solid var(--primary)' : 'none',
                cursor: 'pointer',
                display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px'
              }}
            >
              <MessageSquare size={15} /> Обсуждение ({bill.comments?.length || 0})
            </button>
          </div>

          <div style={{ flex: 1, overflowY: 'auto', padding: '24px' }}>
            {activeTab === 'editor' ? (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
                
                {/* AUTHOR INFO */}
                <div style={{ background: 'var(--bg-surface-elevated)', padding: '16px', borderRadius: 'var(--radius-md)', border: '1px solid var(--border-subtle)' }}>
                  <label className="input-label">Инициатор Законопроекта</label>
                  <div style={{ fontSize: '0.95rem', fontWeight: 700, color: 'var(--text-primary)', marginBottom: '4px' }}>
                    {bill.author}
                  </div>
                  <div style={{ fontSize: '0.78rem', color: 'var(--text-accent)', fontWeight: 500 }}>
                    {bill.authorRole}
                  </div>
                </div>

                {/* PUBLISH ACTION */}
                {canEdit && bill.status === 'draft' && (
                  <button 
                    onClick={handlePublish}
                    className="btn btn-primary btn-pill" 
                    style={{ width: '100%', padding: '12px', fontSize: '0.9rem' }}
                  >
                    <Send size={16} /> Опубликовать проект
                  </button>
                )}

              </div>
            ) : (
              <CommentsSection 
                billId={bill.id}
                user={user}
                comments={bill.comments || []}
                canComment={!isReadOnly}
                onAddComment={(updatedComments) => {
                  handleFieldChange('comments', updatedComments);
                }}
              />
            )}
          </div>
        </div>

      </div>

      {/* FULLSCREEN EXPANDED ARTICLE MODAL */}
      {expandedRow && (
        <ExpandedArticleModal
          row={expandedRow}
          canEdit={canEdit && !isReadOnly}
          onUpdateRow={(id, field, val) => {
            updateComparisonRow(id, field, val);
            setExpandedRow((prev) => prev ? { ...prev, [field]: val } : null);
          }}
          onClose={() => setExpandedRow(null)}
        />
      )}

    </div>
  );
};
