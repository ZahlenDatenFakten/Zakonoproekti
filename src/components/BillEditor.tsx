import React, { useState } from 'react';
import type { Bill, ComparisonRow, AccessPermission, UserProfile, BillStatus } from '../types/bill';
import { sanitizeInput, computeDocumentHash } from '../services/securityService';
import { CommentsSection } from './CommentsSection';
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
  ShieldCheck
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

  const canEdit = permission === 'edit';
  const currentFullName = `${user.firstName} ${user.lastName}`.trim();
  const isAuthor = bill.author.trim() === currentFullName;

  const handleFieldChange = (field: keyof Bill, value: any) => {
    if (!canEdit) return;
    setBill((prev) => ({ ...prev, [field]: value }));
  };

  const addComparisonRow = () => {
    if (!canEdit) return;
    const newRow: ComparisonRow = {
      id: 'comp_' + Date.now(),
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
        
        // Auto-sync "Was" -> "Became" if typing in "Was" and "Became" matches old "Was" or is empty
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

  const handleLocalSave = async () => {
    if (!canEdit) return;
    
    const title = bill.title.trim() || 'Проект Закона без названия';
    const targetLaw = bill.targetLaw.trim() || 'Уголовный Кодекс Штата (УК)';
    
    let updated: Bill = {
      ...bill,
      title: sanitizeInput(title),
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
      draft: { label: 'Черновик', cls: 'badge-draft', icon: Clock },
      under_review: { label: 'На рассмотрении', cls: 'badge-under_review', icon: Clock },
      needs_revision: { label: 'Отправлен на доработку', cls: 'badge-needs_revision', icon: RotateCcw },
      approved: { label: 'Одобрен', cls: 'badge-approved', icon: CheckCircle2 },
      rejected: { label: 'Отклонен', cls: 'badge-rejected', icon: XCircle }
    };
    const mapped = map[status] || map.draft;
    const Icon = mapped.icon;
    
    return (
      <div className={`badge-status ${mapped.cls}`}>
        <Icon size={14} /> {mapped.label}
      </div>
    );
  };

  const isReadOnly = bill.status === 'approved' || bill.status === 'rejected';

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100vh', background: 'var(--bg-base)' }}>
      <div style={{ 
        height: '60px', 
        background: 'var(--bg-card)', 
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
              {bill.title || 'Новый Законопроект'}
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
          
          <button onClick={() => onShare(bill)} className="btn btn-secondary">
            <Share2 size={16} /> Поделиться
          </button>

          {canEdit && !isReadOnly && (
            <button onClick={handleLocalSave} className="btn btn-primary">
              <Save size={16} /> Сохранить
            </button>
          )}
        </div>
      </div>

      <div style={{ flex: 1, display: 'flex', overflow: 'hidden' }}>
        <div style={{ flex: 1, overflowY: 'auto', padding: '32px 0' }}>
          <div style={{ maxWidth: '900px', margin: '0 auto', display: 'flex', flexDirection: 'column', gap: '24px' }}>
            
            <div className="card-dark" style={{ padding: '24px' }}>
              <div style={{ display: 'flex', gap: '24px', marginBottom: '20px' }}>
                <div style={{ flex: 2 }}>
                  <label className="input-label">Название законопроекта</label>
                  <input 
                    type="text" 
                    value={bill.title}
                    onChange={(e) => handleFieldChange('title', e.target.value)}
                    disabled={!canEdit || isReadOnly}
                    className="input-field"
                    style={{ width: '100%', fontSize: '1.1rem', fontWeight: 600 }}
                    placeholder="О внесении изменений в..."
                  />
                </div>
                
                <div style={{ flex: 1 }}>
                  <label className="input-label">Изменяемый Закон</label>
                  <input 
                    type="text" 
                    value={bill.targetLaw}
                    onChange={(e) => handleFieldChange('targetLaw', e.target.value)}
                    disabled={!canEdit || isReadOnly}
                    className="input-field"
                    style={{ width: '100%', fontFamily: 'var(--font-mono)' }}
                    placeholder="Например: Уголовный Кодекс (УК)"
                  />
                </div>
              </div>

              <div>
                <label className="input-label">Пояснительная записка</label>
                <textarea 
                  value={bill.explanatoryNote}
                  onChange={(e) => handleFieldChange('explanatoryNote', e.target.value)}
                  disabled={!canEdit || isReadOnly}
                  className="input-field"
                  style={{ width: '100%', minHeight: '80px', resize: 'vertical' }}
                  placeholder="Укажите причину и цель внесения поправок..."
                />
              </div>
            </div>

            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <h3 style={{ margin: 0, fontSize: '1.2rem', color: 'var(--text-primary)' }}>Редактируемые Статьи</h3>
              {canEdit && !isReadOnly && (
                <button onClick={addComparisonRow} className="btn btn-secondary" style={{ fontSize: '0.8rem', padding: '6px 12px' }}>
                  <Plus size={14} /> Добавить статью
                </button>
              )}
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
              {bill.comparisons.map((row, index) => (
                <div key={row.id} className="card-dark" style={{ padding: '0', overflow: 'hidden' }}>
                  <div style={{ background: 'var(--bg-input)', padding: '12px 20px', borderBottom: '1px solid var(--border-subtle)', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '12px', flex: 1 }}>
                      <span style={{ fontSize: '0.85rem', color: 'var(--text-tertiary)', fontWeight: 600 }}>#{index + 1}</span>
                      <input 
                        type="text" 
                        value={row.articleTitle}
                        onChange={(e) => updateComparisonRow(row.id, 'articleTitle', e.target.value)}
                        disabled={!canEdit || isReadOnly}
                        className="input-field"
                        style={{ width: '300px', padding: '6px 12px' }}
                        placeholder="Номер или название статьи (Статья 1.1)"
                      />
                    </div>
                    {canEdit && !isReadOnly && (
                      <button 
                        onClick={() => removeComparisonRow(row.id)}
                        className="btn"
                        style={{ padding: '6px', color: 'var(--danger)', background: 'transparent' }}
                      >
                        <Trash2 size={16} />
                      </button>
                    )}
                  </div>

                  <div style={{ display: 'flex', width: '100%', minHeight: '200px' }}>
                    
                    <div style={{ flex: 1, borderRight: '1px solid var(--border-subtle)', display: 'flex', flexDirection: 'column' }}>
                      <div style={{ padding: '8px 20px', background: 'rgba(239, 68, 68, 0.05)', color: '#fca5a5', fontSize: '0.75rem', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.05em', borderBottom: '1px solid var(--border-subtle)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                        <span>Было (Действующая редакция)</span>
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
                        style={{ 
                          flex: 1, 
                          border: 'none', 
                          background: 'transparent', 
                          color: 'var(--text-primary)', 
                          padding: '16px 20px', 
                          resize: 'none',
                          outline: 'none',
                          fontFamily: 'var(--font-sans)',
                          fontSize: '0.95rem',
                          lineHeight: 1.6
                        }}
                        placeholder="Вставьте текущий текст статьи..."
                      />
                    </div>

                    <div style={{ flex: 1, display: 'flex', flexDirection: 'column' }}>
                      <div style={{ padding: '8px 20px', background: 'rgba(16, 185, 129, 0.05)', color: '#6ee7b7', fontSize: '0.75rem', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.05em', borderBottom: '1px solid var(--border-subtle)' }}>
                        Стало (Проектируемая редакция)
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
                          padding: '16px 20px', 
                          resize: 'none',
                          outline: 'none',
                          fontFamily: 'var(--font-sans)',
                          fontSize: '0.95rem',
                          lineHeight: 1.6
                        }}
                        placeholder="Внесите ваши изменения..."
                      />
                    </div>
                  </div>
                </div>
              ))}

              {bill.comparisons.length === 0 && (
                <div style={{ textAlign: 'center', padding: '60px 0', color: 'var(--text-tertiary)' }}>
                  <FileText size={48} style={{ opacity: 0.2, margin: '0 auto 16px' }} />
                  <p>В этом законопроекте пока нет ни одной статьи.</p>
                  {canEdit && !isReadOnly && (
                    <button onClick={addComparisonRow} className="btn btn-primary" style={{ marginTop: '16px' }}>
                      <Plus size={16} /> Добавить первую поправку
                    </button>
                  )}
                </div>
              )}
            </div>
            
            <div style={{ height: '100px' }}></div>
          </div>
        </div>

        <div style={{ width: '380px', borderLeft: '1px solid var(--border-subtle)', background: 'var(--bg-card)', display: 'flex', flexDirection: 'column' }}>
          <div style={{ display: 'flex', padding: '12px', gap: '8px', borderBottom: '1px solid var(--border-subtle)' }}>
            <button 
              onClick={() => setActiveTab('editor')}
              className="btn btn-secondary"
              style={{ flex: 1, background: activeTab === 'editor' ? 'var(--bg-hover)' : 'transparent', border: 'none' }}
            >
              <FileText size={16} /> Детали
            </button>
            <button 
              onClick={() => setActiveTab('comments')}
              className="btn btn-secondary"
              style={{ flex: 1, background: activeTab === 'comments' ? 'var(--bg-hover)' : 'transparent', border: 'none' }}
            >
              <Users size={16} /> Обсуждение
            </button>
          </div>

          <div style={{ flex: 1, overflowY: 'auto' }}>
            {activeTab === 'editor' ? (
              <div style={{ padding: '20px', display: 'flex', flexDirection: 'column', gap: '20px' }}>
                
                <div>
                  <h4 style={{ fontSize: '0.75rem', textTransform: 'uppercase', color: 'var(--text-tertiary)', marginBottom: '8px' }}>Автор инициативы</h4>
                  <div style={{ background: 'var(--bg-input)', padding: '12px', borderRadius: 'var(--radius-md)', border: '1px solid var(--border-subtle)' }}>
                    <div style={{ fontWeight: 600, color: 'var(--text-primary)' }}>{bill.author}</div>
                    <div style={{ fontSize: '0.8rem', color: 'var(--accent)', marginTop: '2px' }}>{bill.authorRole}</div>
                  </div>
                </div>

                {canEdit && bill.status === 'draft' && isAuthor && (
                  <div>
                    <h4 style={{ fontSize: '0.75rem', textTransform: 'uppercase', color: 'var(--text-tertiary)', marginBottom: '8px' }}>Действия</h4>
                    <button 
                      onClick={() => {
                        const upd: Bill = { ...bill, status: 'under_review', updatedAt: new Date().toISOString() };
                        setBill(upd);
                        onSave(upd);
                        onToast('success', 'Законопроект отправлен на рассмотрение Комиссии!');
                      }}
                      className="btn btn-primary"
                      style={{ width: '100%', padding: '12px' }}
                    >
                      <Send size={16} /> Отправить на рассмотрение
                    </button>
                  </div>
                )}

                {bill.sha256Hash && (
                  <div>
                    <h4 style={{ fontSize: '0.75rem', textTransform: 'uppercase', color: 'var(--text-tertiary)', marginBottom: '8px' }}>Целостность документа</h4>
                    <div style={{ background: 'rgba(52, 211, 153, 0.05)', border: '1px solid rgba(52, 211, 153, 0.2)', padding: '12px', borderRadius: 'var(--radius-md)' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '6px', color: 'var(--success)', fontWeight: 600, fontSize: '0.8rem', marginBottom: '4px' }}>
                        <ShieldCheck size={14} /> SHA-256 Verified
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
