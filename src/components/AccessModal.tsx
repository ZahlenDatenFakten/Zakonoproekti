import React, { useState } from 'react';
import type { Bill, AccessLink, AccessPermission } from '../types/bill';
import { CustomSelect } from './CustomSelect';
import { X, Copy, Check, Link as LinkIcon, Shield, Trash2, Plus } from 'lucide-react';

interface AccessModalProps {
  bill: Bill;
  onUpdateBill: (updatedBill: Bill) => void;
  onClose: () => void;
}

export const AccessModal: React.FC<AccessModalProps> = ({ bill, onUpdateBill, onClose }) => {
  const [newLabel, setNewLabel] = useState('');
  const [newPermission, setNewPermission] = useState<AccessPermission>('read');
  const [copiedToken, setCopiedToken] = useState<string | null>(null);

  const handleCreateLink = () => {
    const token = 'link_' + Math.random().toString(36).substring(2, 10);
    const newLink: AccessLink = {
      id: 'st_' + Date.now(),
      token,
      permission: newPermission,
      label: newLabel || (newPermission === 'read' ? 'Ссылка читателя' : 'Ссылка соавтора'),
      createdAt: new Date().toISOString()
    };

    const updatedTokens = [...(bill.shareTokens || []), newLink];
    const updatedBill = { ...bill, shareTokens: updatedTokens };
    onUpdateBill(updatedBill);
    setNewLabel('');
  };

  const handleDeleteLink = (id: string) => {
    const updatedTokens = bill.shareTokens.filter((l) => l.id !== id);
    onUpdateBill({ ...bill, shareTokens: updatedTokens });
  };

  const getFullShareUrl = (token: string, permission: AccessPermission) => {
    const baseUrl = window.location.origin + window.location.pathname;
    return `${baseUrl}?billId=${bill.id}&token=${token}&perm=${permission}`;
  };

  const handleCopy = (url: string, token: string) => {
    navigator.clipboard.writeText(url);
    setCopiedToken(token);
    setTimeout(() => setCopiedToken(null), 2500);
  };

  return (
    <div className="modal-overlay" onClick={onClose} style={{ zIndex: 6000 }}>
      <div className="modal-content" onClick={(e) => e.stopPropagation()} style={{ maxWidth: '640px', width: '100%', overflow: 'hidden' }}>
        
        {/* Header */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '18px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <Shield size={20} color="var(--text-secondary)" />
            <div>
              <h3 style={{ color: 'var(--text-primary)', fontSize: '1.1rem', fontWeight: 600 }}>
                Ссылки доступа
              </h3>
              <p style={{ fontSize: '0.82rem', color: 'var(--text-tertiary)', maxWidth: '480px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                {bill.title}
              </p>
            </div>
          </div>
          <button onClick={onClose} className="btn btn-secondary" style={{ padding: '6px' }}>
            <X size={16} />
          </button>
        </div>

        {/* Generate New Link Form */}
        <div style={{ background: 'var(--bg-input)', border: '1px solid var(--border-subtle)', borderRadius: '12px', padding: '18px', marginBottom: '22px' }}>
          <h4 style={{ fontSize: '0.88rem', color: 'var(--text-primary)', marginBottom: '12px', fontWeight: 600 }}>
            Создать новую ссылку доступа
          </h4>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', marginBottom: '14px' }}>
            <div>
              <label style={{ fontSize: '0.78rem', color: 'var(--text-tertiary)', display: 'block', marginBottom: '4px' }}>
                Название ссылки:
              </label>
              <input
                type="text"
                className="input-field"
                placeholder="Например: Ссылка для соавтора / читателя..."
                value={newLabel}
                onChange={(e) => setNewLabel(e.target.value)}
                style={{ fontSize: '0.85rem' }}
              />
            </div>

            <div>
              <label style={{ fontSize: '0.78rem', color: 'var(--text-tertiary)', display: 'block', marginBottom: '4px' }}>
                Уровень доступа:
              </label>
              <CustomSelect
                options={[
                  { value: 'read', label: '👁️ Читатель (Чтение + Комментарии)' },
                  { value: 'edit', label: '✏️ Редактор (Соавтор)' }
                ]}
                value={newPermission}
                onChange={(val) => setNewPermission(val as AccessPermission)}
                width="100%"
              />
            </div>
          </div>

          <button onClick={handleCreateLink} className="btn btn-primary" style={{ width: '100%', fontSize: '0.85rem' }}>
            <Plus size={15} /> Сгенерировать ссылку
          </button>
        </div>

        {/* Active Links */}
        <h4 style={{ fontSize: '0.88rem', color: 'var(--text-secondary)', marginBottom: '12px', fontWeight: 600 }}>
          Активные ссылки ({bill.shareTokens?.length || 0})
        </h4>

        {(!bill.shareTokens || bill.shareTokens.length === 0) ? (
          <p style={{ fontSize: '0.85rem', color: 'var(--text-tertiary)', textAlign: 'center', padding: '20px 0' }}>
            Активных ссылок пока нет.
          </p>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', maxHeight: '260px', overflowY: 'auto' }}>
            {bill.shareTokens.map((link) => {
              const fullUrl = getFullShareUrl(link.token, link.permission);
              const isCopied = copiedToken === link.token;

              return (
                <div key={link.id} style={{ background: 'var(--bg-input)', border: '1px solid var(--border-subtle)', borderRadius: '10px', padding: '14px' }}>
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '8px', flexWrap: 'wrap', gap: '6px' }}>
                    <div style={{ fontWeight: 600, fontSize: '0.88rem', color: 'var(--text-primary)', display: 'flex', alignItems: 'center', gap: '6px' }}>
                      <LinkIcon size={14} color="var(--text-secondary)" />
                      {link.label}
                    </div>

                    <span style={{ fontSize: '0.75rem', padding: '3px 8px', borderRadius: '6px', background: 'var(--bg-card)', color: 'var(--text-secondary)', border: '1px solid var(--border-subtle)' }}>
                      {link.permission === 'edit' ? '✏️ Редактор' : '👁️ Читатель'}
                    </span>
                  </div>

                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <input
                      type="text"
                      className="input-field"
                      readOnly
                      value={fullUrl}
                      style={{ fontSize: '0.78rem', fontFamily: 'var(--font-mono)', color: 'var(--text-secondary)', flex: 1, minWidth: 0 }}
                    />

                    <button
                      onClick={() => handleCopy(fullUrl, link.token)}
                      className="btn btn-secondary"
                      style={{ padding: '6px 10px', fontSize: '0.8rem', flexShrink: 0 }}
                    >
                      {isCopied ? <Check size={13} color="#34d399" /> : <Copy size={13} />}
                      <span>{isCopied ? 'Скопировано' : 'Копировать'}</span>
                    </button>

                    <button
                      onClick={() => handleDeleteLink(link.id)}
                      className="btn btn-danger"
                      style={{ padding: '6px', flexShrink: 0 }}
                      title="Отозвать ссылку"
                    >
                      <Trash2 size={13} />
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
};
