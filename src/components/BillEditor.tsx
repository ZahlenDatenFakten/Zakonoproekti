import React, { useState } from 'react';
import type { Bill, ComparisonRow, AccessPermission, UserProfile, BillStatus } from '../types/bill';
import { sanitizeInput, computeDocumentHash } from '../services/securityService';
import { CommentsSection } from './CommentsSection';
import { computeWordDiff } from '../utils/diff';
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
  Send,
  Users,
  ShieldCheck,
  Eye,
  Edit3
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
  const [viewMode, setViewMode] = useState<Record<string, 'edit' | 'diff'>>({});

  const canEdit = permission === 'edit';
  const currentFullName = `${user.firstName} ${user.lastName}`.trim();
  const isAuthor = bill.author.trim() === currentFullName;

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
    setViewMode(prev => ({ ...prev, [newId]: 'edit' }));
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

  const markRowAsNew = (id: string) => {
    if (!canEdit) return;
    setBill((prev) => {
      const updatedComparisons = prev.comparisons.map((row) => {
        if (row.id !== id) return row;
        return { 
          ...row, 
          wasContent: '— (Данной статьи не существовало) —',
          becameContent: row.becameContent === row.wasContent ? '' : row.becameContent
        };
      });
      return { ...prev, comparisons: updatedComparisons };
    });
  };

  const removeComparisonRow = (id: string) => {
    if (!canEdit) return;
    handleFieldChange('comparisons', bill.comparisons.filter(c => c.id !== id));
  };

  const toggleRowMode = (id: string) => {
    setViewMode(prev => ({
      ...prev,
      [id]: prev[id] === 'diff' ? 'edit' : 'diff'
    }));
  };

  const handleLocalSave = async () => {
    if (!canEdit) return;
    
    const targetLaw = bill.targetLaw.trim() || 'Новый Закон';
    
    let updated: Bill = {
      ...bill,
      targetLaw: sanitizeInput(targetLaw),
      explanatoryNote: sanitizeInput(bill.explanatoryNote),
      updatedAt: new Date().toISOString()
    };

    const integrityHash = await computeDocumentHash(updated);
    updated.sha256Hash = integrityHash;
    
    setBill(updated);
    onSave(updated);
    onToast('success', 'Изменения успешно сохранены');
    
    setIsSavedNotice(true);
    setTimeout(() => setIsSavedNotice(false), 3000);
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

  const renderDiffView = (was: string, became: string) => {
    const isNew = was === '— (Данной статьи не существовало) —';
    if (isNew) {
      return (
        <div style={{ display: 'flex', width: '100%', minHeight: '150px' }}>
          <div style={{ flex: 1, padding: '16px 20px', color: 'var(--text-muted)', borderRight: '1px solid var(--border-subtle)' }}>
            {was}
          </div>
          <div style={{ flex: 1, padding: '16px 20px', whiteSpace: 'pre-wrap' }}>
            <span className="diff-add">{became}</span>
          </div>
        </div>
      );
    }

    const diffs = computeWordDiff(was, became);
    return (
      <div style={{ display: 'flex', width: '100%', minHeight: '150px' }}>
        <div style={{ flex: 1, padding: '16px 20px', whiteSpace: 'pre-wrap', borderRight: '1px solid var(--border-subtle)', lineHeight: 1.6 }}>
          {diffs.map((d, i) => (
            <span key={i} className={d.type === 'removed' ? 'diff-remove' : d.type === 'added' ? 'diff-hidden' : ''} style={{ display: d.type === 'added' ? 'none' : 'inline' }}>
              {d.value}
            </span>
          ))}
        </div>
        <div style={{ flex: 1, padding: '16px 20px', whiteSpace: 'pre-wrap', lineHeight: 1.6 }}>
          {diffs.map((d, i) => (
            <span key={i} className={d.type === 'added' ? 'diff-add' : d.type === 'removed' ? 'diff-hidden' : ''} style={{ display: d.type === 'removed' ? 'none' : 'inline' }}>
              {d.value}
            </span>
          ))}
        </div>
      </div>
    );
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100vh', background: 'var(--bg-base)' }}>
      {/* COURTRAN Style Toolbar */}
      <div style={{ 
        height: '64px', 
        background: 'var(--bg-surface)', 
        borderBottom: '1px solid var(--border-subtle)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        padding: '0 24px',
        position: 'sticky',
        top: 0,
        zIndex: 100
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
          <button onClick={onBack} className="btn btn-secondary" style={{ padding: '8px' }}>
            <ArrowLeft size={18} />
          </button>
          
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            <h2 style={{ fontSize: '1.1rem', margin: 0, color: 'var(--text-primary)', fontWeight: 600 }}>
              {bill.targetLaw || 'Редактор законопроекта'}
            </h2>
            {getStatusBadge(bill.status)}
          </div>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          {isSavedNotice && (
            <span style={{ fontSize: '0.85rem', color: 'var(--success)', display: 'flex', alignItems: 'center', gap: '4px', marginRight: '8px' }}>
              <CheckCircle2 size={16} /> Сохранено
            </span>
          )}
          
          <button onClick={() => onShare(bill)} className="btn btn-ghost">
            <Share2 size={16} /> Поделиться
          </button>

          {canEdit && !isReadOnly && (
            <button onClick={handleLocalSave} className="btn btn-primary">
              <Save size={16} /> Сохранить изменения
            </button>
          )}
        </div>
      </div>

      <div style={{ flex: 1, display: 'flex', overflow: 'hidden' }}>
        <div style={{ flex: 1, overflowY: 'auto', padding: '32px 0' }}>
          <div style={{ maxWidth: '900px', margin: '0 auto', display: 'flex', flexDirection: 'column', gap: '24px' }}>
            
            {/* Meta Card */}
            <div className="card" style={{ padding: '24px' }}>
              <div style={{ marginBottom: '20px' }}>
                <label className="input-label">Изменяемый Закон / Документ</label>
                <input 
                  type="text" 
                  value={bill.targetLaw}
                  onChange={(e) => handleFieldChange('targetLaw', e.target.value)}
                  disabled={!canEdit || isReadOnly}
                  className="input-field"
                  style={{ width: '100%', fontSize: '1.1rem', fontWeight: 600, background: 'var(--bg-base)' }}
                  placeholder="Например: Уголовный Кодекс Штата"
                />
              </div>

              <div>
                <label className="input-label">Пояснительная записка</label>
                <textarea 
                  value={bill.explanatoryNote}
                  onChange={(e) => handleFieldChange('explanatoryNote', e.target.value)}
                  disabled={!canEdit || isReadOnly}
                  className="input-field"
                  style={{ width: '100%', minHeight: '80px', resize: 'vertical', background: 'var(--bg-base)' }}
                  placeholder="Обоснование и цели внесения поправок..."
                />
              </div>
            </div>

            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <h3 style={{ margin: 0, fontSize: '1rem', color: 'var(--text-secondary)' }}>СТАТЬИ К ИЗМЕНЕНИЮ</h3>
              {canEdit && !isReadOnly && (
                <button onClick={addComparisonRow} className="btn btn-primary" style={{ fontSize: '0.8rem', padding: '6px 12px' }}>
                  <Plus size={14} /> Добавить статью
                </button>
              )}
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
              {bill.comparisons.map((row, index) => {
                const mode = isReadOnly ? 'diff' : (viewMode[row.id] || 'edit');

                return (
                  <div key={row.id} className="card" style={{ padding: '0', overflow: 'hidden', border: '1px solid var(--border-medium)' }}>
                    <div style={{ background: 'var(--bg-input)', padding: '12px 20px', borderBottom: '1px solid var(--border-subtle)', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '12px', flex: 1 }}>
                        <span style={{ fontSize: '0.85rem', color: 'var(--text-muted)', fontWeight: 600 }}>#{index + 1}</span>
                        <input 
                          type="text" 
                          value={row.articleTitle}
                          onChange={(e) => updateComparisonRow(row.id, 'articleTitle', e.target.value)}
                          disabled={!canEdit || isReadOnly}
                          className="input-field"
                          style={{ width: '300px', padding: '6px 12px', background: 'var(--bg-base)', border: '1px solid var(--border-subtle)' }}
                          placeholder="Номер или название статьи"
                        />
                      </div>
                      
                      <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                        {!isReadOnly && (
                          <button 
                            onClick={() => toggleRowMode(row.id)}
                            className="btn btn-secondary"
                            style={{ padding: '6px 12px', fontSize: '0.75rem' }}
                          >
                            {mode === 'edit' ? <><Eye size={14} /> Просмотр Diff</> : <><Edit3 size={14} /> Редактировать</>}
                          </button>
                        )}
                        {canEdit && !isReadOnly && (
                          <button 
                            onClick={() => removeComparisonRow(row.id)}
                            className="btn btn-ghost"
                            style={{ padding: '6px', color: 'var(--danger)' }}
                            title="Удалить статью"
                          >
                            <Trash2 size={16} />
                          </button>
                        )}
                      </div>
                    </div>

                    {mode === 'edit' ? (
                      <div style={{ display: 'flex', width: '100%', minHeight: '200px' }}>
                        <div style={{ flex: 1, borderRight: '1px solid var(--border-subtle)', display: 'flex', flexDirection: 'column' }}>
                          <div style={{ padding: '8px 20px', background: 'rgba(239, 68, 68, 0.05)', color: '#fca5a5', fontSize: '0.7rem', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.05em', borderBottom: '1px solid var(--border-subtle)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                            <span>Было (Оригинал)</span>
                            {canEdit && !isReadOnly && (
                              <button 
                                onClick={() => markRowAsNew(row.id)}
                                style={{ background: 'transparent', border: 'none', color: '#fca5a5', fontSize: '0.7rem', cursor: 'pointer', textDecoration: 'underline' }}
                              >
                                Не было раньше
                              </button>
                            )}
                          </div>
                          <textarea 
                            value={row.wasContent}
                            onChange={(e) => updateComparisonRow(row.id, 'wasContent', e.target.value)}
                            disabled={!canEdit || isReadOnly}
                            style={{ flex: 1, border: 'none', background: 'transparent', color: 'var(--text-primary)', padding: '16px 20px', resize: 'vertical', outline: 'none', fontFamily: 'var(--font-sans)', fontSize: '0.9rem', lineHeight: 1.6 }}
                            placeholder="Вставьте текущий текст статьи..."
                          />
                        </div>

                        <div style={{ flex: 1, display: 'flex', flexDirection: 'column' }}>
                          <div style={{ padding: '8px 20px', background: 'rgba(16, 185, 129, 0.05)', color: '#6ee7b7', fontSize: '0.7rem', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.05em', borderBottom: '1px solid var(--border-subtle)' }}>
                            Стало (Проект)
                          </div>
                          <textarea 
                            value={row.becameContent}
                            onChange={(e) => updateComparisonRow(row.id, 'becameContent', e.target.value)}
                            disabled={!canEdit || isReadOnly}
                            style={{ flex: 1, border: 'none', background: 'transparent', color: 'var(--text-primary)', padding: '16px 20px', resize: 'vertical', outline: 'none', fontFamily: 'var(--font-sans)', fontSize: '0.9rem', lineHeight: 1.6 }}
                            placeholder="Внесите ваши изменения..."
                          />
                        </div>
                      </div>
                    ) : (
                      renderDiffView(row.wasContent, row.becameContent)
                    )}
                  </div>
                );
              })}

              {bill.comparisons.length === 0 && (
                <div style={{ textAlign: 'center', padding: '60px 0', border: '1px dashed var(--border-medium)', borderRadius: 'var(--radius-md)' }}>
                  <p style={{ color: 'var(--text-muted)' }}>В этом законопроекте пока нет ни одной статьи.</p>
                </div>
              )}
            </div>
            
            <div style={{ height: '100px' }}></div>
          </div>
        </div>

        <div style={{ width: '380px', borderLeft: '1px solid var(--border-subtle)', background: 'var(--bg-surface)', display: 'flex', flexDirection: 'column' }}>
          <div style={{ display: 'flex', padding: '12px', gap: '8px', borderBottom: '1px solid var(--border-subtle)' }}>
            <button 
              onClick={() => setActiveTab('editor')}
              className="btn"
              style={{ flex: 1, background: activeTab === 'editor' ? 'var(--bg-hover)' : 'transparent', color: activeTab === 'editor' ? 'var(--text-primary)' : 'var(--text-secondary)' }}
            >
              <FileText size={16} /> Сведения
            </button>
            <button 
              onClick={() => setActiveTab('comments')}
              className="btn"
              style={{ flex: 1, background: activeTab === 'comments' ? 'var(--bg-hover)' : 'transparent', color: activeTab === 'comments' ? 'var(--text-primary)' : 'var(--text-secondary)' }}
            >
              <Users size={16} /> Обсуждение
            </button>
          </div>

          <div style={{ flex: 1, overflowY: 'auto' }}>
            {activeTab === 'editor' ? (
              <div style={{ padding: '20px', display: 'flex', flexDirection: 'column', gap: '24px' }}>
                
                <div>
                  <h4 style={{ fontSize: '0.7rem', textTransform: 'uppercase', color: 'var(--text-muted)', marginBottom: '8px' }}>Инициатор</h4>
                  <div style={{ background: 'var(--bg-input)', padding: '16px', borderRadius: 'var(--radius-md)', border: '1px solid var(--border-subtle)' }}>
                    <div style={{ fontWeight: 600, color: 'var(--text-primary)' }}>{bill.author}</div>
                    <div style={{ fontSize: '0.8rem', color: 'var(--primary)', marginTop: '4px' }}>{bill.authorRole}</div>
                  </div>
                </div>

                {canEdit && bill.status === 'draft' && isAuthor && (
                  <div>
                    <h4 style={{ fontSize: '0.7rem', textTransform: 'uppercase', color: 'var(--text-muted)', marginBottom: '8px' }}>Действия</h4>
                    <button 
                      onClick={() => {
                        const upd: Bill = { ...bill, status: 'under_review', updatedAt: new Date().toISOString() };
                        setBill(upd);
                        onSave(upd);
                        onToast('success', 'Законопроект отправлен на рассмотрение!');
                      }}
                      className="btn btn-primary"
                      style={{ width: '100%', padding: '12px' }}
                    >
                      <Send size={16} /> Опубликовать проект
                    </button>
                  </div>
                )}

                {bill.sha256Hash && (
                  <div>
                    <h4 style={{ fontSize: '0.7rem', textTransform: 'uppercase', color: 'var(--text-muted)', marginBottom: '8px' }}>Электронная подпись</h4>
                    <div style={{ background: 'rgba(33, 123, 248, 0.05)', border: '1px solid rgba(33, 123, 248, 0.2)', padding: '12px', borderRadius: 'var(--radius-md)' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '6px', color: 'var(--primary)', fontWeight: 600, fontSize: '0.8rem', marginBottom: '4px' }}>
                        <ShieldCheck size={14} /> SHA-256
                      </div>
                      <div style={{ fontFamily: 'var(--font-mono)', fontSize: '0.65rem', wordBreak: 'break-all', color: 'var(--text-secondary)' }}>
                        {bill.sha256Hash}
                      </div>
                    </div>
                  </div>
                )}

              </div>
            ) : (
              <CommentsSection 
                billId={bill.id} 
                user={user} 
                comments={bill.comments} 
                canComment={!isReadOnly}
                onAddComment={(updatedComments) => {
                  const upd = { ...bill, comments: updatedComments };
                  setBill(upd); 
                  onSave(upd);
                }} 
              />
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
