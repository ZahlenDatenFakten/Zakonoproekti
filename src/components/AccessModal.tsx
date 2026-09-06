import React, { useState } from 'react';
import type { Bill, AccessLink, AccessPermission } from '../types/bill';
import { CustomSelect } from './CustomSelect';
import { X, Copy, Check, Link as LinkIcon, Shield, Trash2, Plus } from 'lucide-react';
import { R, ft, shadow, mono, btnAccent, btnOutline, fieldLabel } from '../lib/ui';
import { ConfirmModal } from './ConfirmModal';

interface AccessModalProps {
  bill: Bill;
  onUpdateBill: (updatedBill: Bill) => void;
  onClose: () => void;
}

export const AccessModal: React.FC<AccessModalProps> = ({ bill, onUpdateBill, onClose }) => {
  const [newLabel, setNewLabel] = useState('');
  const [newPermission, setNewPermission] = useState<AccessPermission>('read');
  const [copiedToken, setCopiedToken] = useState<string | null>(null);
  const [confirmDeleteLinkId, setConfirmDeleteLinkId] = useState<string | null>(null);

  const handleCreateLink = () => {
    const token = 'link_' + Math.random().toString(36).substring(2, 10);
    const newLink: AccessLink = {
      id: 'st_' + Date.now(),
      token,
      permission: newPermission,
      label: newLabel.trim() || (newPermission === 'read' ? 'Ссылка читателя' : 'Ссылка соавтора'),
      createdAt: new Date().toISOString(),
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
    <div
      onClick={onClose}
      style={{
        position: 'fixed',
        inset: 0,
        background: 'rgba(20, 18, 17, 0.65)',
        backdropFilter: 'blur(3px)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: 16,
        zIndex: 100,
        animation: 'rtFade .12s ease',
      }}
    >
      <div
        onClick={(e) => e.stopPropagation()}
        style={{
          width: 580,
          maxWidth: '100%',
          maxHeight: 'calc(100vh - 32px)',
          display: 'flex',
          flexDirection: 'column',
          background: R.bgPanel,
          border: ft.strong,
          boxShadow: shadow.panel,
          animation: 'rtIn .18s ease',
        }}
      >
        {/* Header */}
        <header
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            padding: '14px 18px',
            borderBottom: ft.strong,
            background: R.bgPanel,
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <div
              style={{
                width: 28,
                height: 28,
                background: R.accentSubtle,
                border: `1px solid ${R.accentBorder}`,
                color: R.accent,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
              }}
            >
              <Shield size={16} />
            </div>
            <div>
              <h3 style={{ fontSize: 16, fontWeight: 800, color: R.text }}>
                Ссылки управления доступом
              </h3>
              <div
                style={{
                  fontSize: 11,
                  fontFamily: mono,
                  color: R.textMuted,
                  maxWidth: 340,
                  overflow: 'hidden',
                  textOverflow: 'ellipsis',
                  whiteSpace: 'nowrap',
                }}
              >
                {bill.targetLaw || bill.title}
              </div>
            </div>
          </div>

          <button
            onClick={onClose}
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              width: 28,
              height: 28,
              color: R.textMuted,
              background: 'transparent',
              border: 'none',
              cursor: 'pointer',
            }}
            onMouseEnter={(e) => (e.currentTarget.style.background = R.bgElevated)}
            onMouseLeave={(e) => (e.currentTarget.style.background = 'transparent')}
          >
            <X size={16} />
          </button>
        </header>

        {/* Content */}
        <div className="rt-scroll" style={{ padding: 18, overflowY: 'auto', flex: 1 }}>
          {/* Generate New Link Form */}
          <div
            style={{
              background: R.bgSubtle,
              border: ft.edge,
              padding: 16,
              marginBottom: 18,
            }}
          >
            <div
              style={{
                fontSize: 11,
                fontFamily: mono,
                fontWeight: 700,
                color: R.accent,
                textTransform: 'uppercase',
                letterSpacing: '0.06em',
                marginBottom: 12,
              }}
            >
              Сгенерировать токен доступа
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: 12, marginBottom: 14 }}>
              <div>
                <label style={fieldLabel}>Наименование ключа доступа</label>
                <input
                  type="text"
                  style={{
                    width: '100%',
                    background: R.bgInput,
                    border: ft.edge,
                    padding: '8px 12px',
                    fontSize: 13,
                    color: R.text,
                    outline: 'none',
                  }}
                  placeholder="Например: Ссылка для эксперта..."
                  value={newLabel}
                  onChange={(e) => setNewLabel(e.target.value)}
                  onFocus={(e) => (e.currentTarget.style.borderColor = R.accent)}
                  onBlur={(e) => (e.currentTarget.style.borderColor = R.border)}
                />
              </div>

              <div>
                <label style={fieldLabel}>Права доступа</label>
                <CustomSelect
                  options={[
                    { value: 'read', label: 'Читатель (Просмотр и оценка)' },
                    { value: 'edit', label: 'Соавтор (Полное редактирование)' },
                  ]}
                  value={newPermission}
                  onChange={(val) => setNewPermission(val as AccessPermission)}
                />
              </div>
            </div>

            <button
              type="button"
              onClick={handleCreateLink}
              style={{
                ...btnAccent,
                width: '100%',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: 8,
              }}
            >
              <Plus size={15} /> Выпустить токен доступа
            </button>
          </div>

          {/* Active Links */}
          <div
            style={{
              fontSize: 11,
              fontFamily: mono,
              fontWeight: 700,
              color: R.textMuted,
              textTransform: 'uppercase',
              letterSpacing: '0.06em',
              marginBottom: 10,
            }}
          >
            Активные токен-ссылки ({bill.shareTokens?.length || 0})
          </div>

          {!bill.shareTokens || bill.shareTokens.length === 0 ? (
            <div
              style={{
                padding: '24px 16px',
                textAlign: 'center',
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                justifyContent: 'center',
                border: ft.edge,
                background: R.bgSubtle,
              }}
            >
              <LinkIcon size={24} style={{ color: R.textMuted, marginBottom: 8, opacity: 0.5 }} />
              <span style={{ fontSize: 12, fontFamily: mono, color: R.textMuted }}>
                Активных токенов не найдено
              </span>
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 8, maxHeight: 220, overflowY: 'auto' }} className="rt-scroll">
              {bill.shareTokens.map((link) => {
                const fullUrl = getFullShareUrl(link.token, link.permission);
                const isCopied = copiedToken === link.token;

                return (
                  <div
                    key={link.id}
                    style={{
                      background: R.bgInput,
                      border: ft.edge,
                      padding: '10px 12px',
                    }}
                  >
                    <div
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'space-between',
                        marginBottom: 8,
                        gap: 8,
                      }}
                    >
                      <div style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 13, fontWeight: 700, color: R.text }}>
                        <LinkIcon size={13} style={{ color: R.accent }} />
                        <span>{link.label}</span>
                      </div>

                      <span
                        style={{
                          fontSize: 11,
                          fontFamily: mono,
                          color: link.permission === 'edit' ? R.accent : R.textMuted,
                          background: R.bgElevated,
                          padding: '2px 8px',
                          border: ft.edge,
                        }}
                      >
                        {link.permission === 'edit' ? 'Редактор' : 'Читатель'}
                      </span>
                    </div>

                    <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                      <input
                        type="text"
                        readOnly
                        value={fullUrl}
                        style={{
                          flex: 1,
                          minWidth: 0,
                          background: R.bgSubtle,
                          border: ft.edge,
                          padding: '6px 8px',
                          fontSize: 11,
                          fontFamily: mono,
                          color: R.textMuted,
                          outline: 'none',
                        }}
                      />

                      <button
                        type="button"
                        onClick={() => handleCopy(fullUrl, link.token)}
                        style={{
                          display: 'flex',
                          alignItems: 'center',
                          gap: 6,
                          padding: '6px 10px',
                          background: R.bgElevated,
                          color: isCopied ? '#34d399' : R.text,
                          border: ft.edge,
                          fontSize: 12,
                          cursor: 'pointer',
                        }}
                      >
                        {isCopied ? <Check size={13} /> : <Copy size={13} />}
                        <span>{isCopied ? 'Скопировано' : 'Копия'}</span>
                      </button>

                      <button
                        type="button"
                        onClick={() => setConfirmDeleteLinkId(link.id)}
                        data-tooltip="Отозвать ссылку доступа"
                        style={{
                          padding: '6px 8px',
                          background: 'transparent',
                          color: '#f87171',
                          border: ft.edge,
                          cursor: 'pointer',
                        }}
                      >
                        <Trash2 size={14} />
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Footer */}
        <footer
          style={{
            padding: '12px 18px',
            borderTop: ft.strong,
            background: R.bgPanel,
            display: 'flex',
            justifyContent: 'flex-end',
          }}
        >
          <button type="button" onClick={onClose} style={btnOutline}>
            Закрыть
          </button>
        </footer>
      </div>

      {confirmDeleteLinkId && (
        <ConfirmModal
          title="Отозвать ссылку доступа?"
          message="Пользователи, использующие данную ссылку или токен, мгновенно потеряют доступ к законопроекту."
          confirmLabel="Отозвать"
          onConfirm={() => {
            handleDeleteLink(confirmDeleteLinkId);
            setConfirmDeleteLinkId(null);
          }}
          onCancel={() => setConfirmDeleteLinkId(null)}
        />
      )}
    </div>
  );
};
