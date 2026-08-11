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

  const backdropMouseDownRef = React.useRef(false);

  return (
    <div 
      className="modal-overlay" 
      onMouseDown={(e) => { backdropMouseDownRef.current = (e.target === e.currentTarget); }}
      onClick={(e) => {
        if (e.target === e.currentTarget && backdropMouseDownRef.current) {
          onClose();
        }
      }} 
      style={{ zIndex: 6000 }}
    >
      <div className="modal-content" onClick={(e) => e.stopPropagation()} style={{ maxWidth: '640px', width: '100%', overflow: 'hidden' }}>
        
        {/* Header */}
        <div className="modal-header">
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <Shield size={18} color="var(--text-accent)" />
            <div>
              <h3 style={{ color: 'var(--text-primary)', fontSize: '1.05rem', fontWeight: 800 }}>
                Ссылки управления доступом
              </h3>
              <p style={{ fontSize: '0.78rem', color: 'var(--text-secondary)', maxWidth: '420px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', fontFamily: 'var(--font-mono)' }}>
                {bill.targetLaw || bill.title}
              </p>
            </div>
          </div>
          <button onClick={onClose} className="btn btn-ghost" style={{ padding: '6px' }}>
            <X size={16} />
          </button>
        </div>

        <div className="modal-body">
          {/* Generate New Link Form */}
          <div style={{ background: 'var(--bg-input)', border: '1px solid var(--border-subtle)', borderRadius: 'var(--radius-md)', padding: '18px', marginBottom: '22px' }}>
            <h4 className="tech-label" style={{ marginBottom: '12px', color: 'var(--text-accent)' }}>
              Сгенерировать токен доступа
            </h4>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', marginBottom: '14px' }}>
              <div>
                <label className="input-label">
                  Наименование ключа доступа:
                </label>
                <input
                  type="text"
                  className="input-field"
                  placeholder="Например: Ссылка для рабочей группы / эксперта..."
                  value={newLabel}
                  onChange={(e) => setNewLabel(e.target.value)}
                  style={{ fontSize: '0.85rem' }}
                />
              </div>

              <div>
                <label className="input-label">
                  Права доступа:
                </label>
                <CustomSelect
                  options={[
                    { value: 'read', label: '👁️ Читатель (Просмотр + Оценка)' },
                    { value: 'edit', label: '✏️ Соавтор (Полное редактирование)' }
                  ]}
                  value={newPermission}
                  onChange={(val) => setNewPermission(val as AccessPermission)}
                  width="100%"
                />
              </div>
            </div>

            <button onClick={handleCreateLink} className="btn btn-primary btn-pill" style={{ width: '100%', fontSize: '0.84rem', padding: '9px' }}>
              <Plus size={15} /> Выпустить токен доступа
            </button>
          </div>

          {/* Active Links */}
          <h4 className="tech-label" style={{ marginBottom: '12px' }}>
            Активные токен-ссылки ({bill.shareTokens?.length || 0})
          </h4>

          {(!bill.shareTokens || bill.shareTokens.length === 0) ? (
            <p style={{ fontSize: '0.82rem', color: 'var(--text-muted)', textAlign: 'center', padding: '20px 0', fontFamily: 'var(--font-mono)' }}>
              Активных внешних токенов доступа не найдено.
            </p>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', maxHeight: '240px', overflowY: 'auto' }}>
              {bill.shareTokens.map((link) => {
                const fullUrl = getFullShareUrl(link.token, link.permission);
                const isCopied = copiedToken === link.token;

                return (
                  <div key={link.id} style={{ background: 'var(--bg-input)', border: '1px solid var(--border-subtle)', borderRadius: 'var(--radius-md)', padding: '12px' }}>
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '8px', flexWrap: 'wrap', gap: '6px' }}>
                      <div style={{ fontWeight: 600, fontSize: '0.84rem', color: 'var(--text-primary)', display: 'flex', alignItems: 'center', gap: '6px' }}>
                        <LinkIcon size={13} color="var(--text-accent)" />
                        {link.label}
                      </div>

                      <span style={{ fontSize: '0.7rem', padding: '2px 8px', borderRadius: 'var(--radius-pill)', background: 'var(--bg-surface)', color: 'var(--text-accent)', border: '1px solid var(--border-subtle)', fontFamily: 'var(--font-mono)' }}>
                        {link.permission === 'edit' ? '✏️ Редактор' : '👁️ Читатель'}
                      </span>
                    </div>

                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                      <input
                        type="text"
                        className="input-field"
                        readOnly
                        value={fullUrl}
                        style={{ fontSize: '0.76rem', fontFamily: 'var(--font-mono)', color: 'var(--text-secondary)', flex: 1, minWidth: 0, padding: '6px 12px' }}
                      />

                      <button
                        onClick={() => handleCopy(fullUrl, link.token)}
                        className="btn btn-secondary btn-pill"
                        style={{ padding: '6px 12px', fontSize: '0.78rem', flexShrink: 0 }}
                      >
                        {isCopied ? <Check size={13} color="var(--success)" /> : <Copy size={13} />}
                        <span>{isCopied ? 'Скопировано' : 'Копия'}</span>
                      </button>

                      <button
                        onClick={() => handleDeleteLink(link.id)}
                        className="btn btn-danger btn-pill"
                        style={{ padding: '6px 10px', flexShrink: 0 }}
                        title="Отозвать токен"
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

        <div className="modal-footer">
          <button className="btn btn-secondary btn-pill" onClick={onClose}>
            Закрыть
          </button>
        </div>

      </div>
    </div>
  );
};
