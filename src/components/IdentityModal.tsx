import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { UserCheck, Upload, File as FileIcon } from 'lucide-react';
import { R, ft, label, mono, shadow, btnAccent } from '../lib/ui';

interface IdentityModalProps {
  initialFirstName?: string;
  initialLastName?: string;
  onSubmit: (firstName: string, lastName: string) => void;
}

export const IdentityModal: React.FC<IdentityModalProps> = ({
  initialFirstName = '',
  initialLastName = '',
  onSubmit
}) => {
  const [firstName, setFirstName] = useState(initialFirstName === 'Александр' ? '' : initialFirstName);
  const [lastName, setLastName] = useState(initialLastName === 'Северов' ? '' : initialLastName);
  const [passportFile, setPassportFile] = useState<File | null>(null);
  const [error, setError] = useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const cleanFirst = firstName.trim();
    const cleanLast = lastName.trim();

    if (!cleanFirst || !cleanLast) {
      setError('Пожалуйста, введите и Имя, и Фамилию.');
      return;
    }

    if (cleanFirst.length < 2 || cleanLast.length < 2) {
      setError('Имя и Фамилия должны содержать минимум 2 символа.');
      return;
    }

    if (!passportFile) {
      setError('Для авторизации необходимо прикрепить скан-копию паспорта.');
      return;
    }

    onSubmit(cleanFirst, cleanLast);
  };

  return (
    <div
      style={{
        position: 'fixed',
        inset: 0,
        zIndex: 99999,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: 16,
        background: 'rgba(10, 9, 8, 0.75)',
        backdropFilter: 'blur(8px)',
        WebkitBackdropFilter: 'blur(8px)',
      }}
    >
      <motion.div 
        initial={{ opacity: 0, scale: 0.96, y: 15 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        style={{
          width: '100%',
          maxWidth: 440,
          background: R.bgPanel,
          border: ft.strong,
          borderRadius: 2,
          padding: '32px 28px',
          boxShadow: shadow.panel,
          display: 'flex',
          flexDirection: 'column',
        }}
      >
        <div style={{ textAlign: 'center', marginBottom: 24 }}>
          <img
            src="/favicon.png"
            alt="Логотип"
            style={{ width: 44, height: 44, display: 'block', margin: '0 auto 14px', objectFit: 'contain' }}
          />

          <div style={label}>GTA5RP · ЗАКОНОДАТЕЛЬСТВО</div>

          <h2
            style={{
              fontSize: 24,
              fontWeight: 800,
              letterSpacing: '-0.015em',
              color: R.text,
              margin: '4px 0 8px',
            }}
          >
            Идентификация
          </h2>
          <p style={{ fontSize: 13, color: R.textMuted, lineHeight: 1.5, margin: 0 }}>
            Для доступа в Государственный реестр укажите ваши данные и прикрепите копию паспорта.
          </p>
        </div>

        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
          <div>
            <label style={{ ...label, display: 'block', marginBottom: 6 }}>Имя гражданина</label>
            <input 
              type="text" 
              value={firstName}
              onChange={(e) => { setFirstName(e.target.value); setError(''); }}
              placeholder="Например: Александр"
              autoFocus
              autoComplete="off"
              spellCheck="false"
              style={{
                width: '100%',
                height: 38,
                padding: '0 12px',
                fontSize: 14,
                fontWeight: 700,
                background: R.bgInput,
                border: ft.edge,
                color: R.text,
                borderRadius: 2,
                outline: 'none',
              }}
              onFocus={(e) => (e.currentTarget.style.borderColor = R.accent)}
              onBlur={(e) => (e.currentTarget.style.borderColor = 'var(--rt-line)')}
            />
          </div>

          <div>
            <label style={{ ...label, display: 'block', marginBottom: 6 }}>Фамилия гражданина</label>
            <input 
              type="text" 
              value={lastName}
              onChange={(e) => { setLastName(e.target.value); setError(''); }}
              placeholder="Например: Северов"
              autoComplete="off"
              spellCheck="false"
              style={{
                width: '100%',
                height: 38,
                padding: '0 12px',
                fontSize: 14,
                fontWeight: 700,
                background: R.bgInput,
                border: ft.edge,
                color: R.text,
                borderRadius: 2,
                outline: 'none',
              }}
              onFocus={(e) => (e.currentTarget.style.borderColor = R.accent)}
              onBlur={(e) => (e.currentTarget.style.borderColor = 'var(--rt-line)')}
            />
          </div>

          <div>
            <label style={{ ...label, display: 'block', marginBottom: 6 }}>Паспорт (Скан/Копия)</label>
            <div style={{ position: 'relative' }}>
              <input
                type="file"
                accept="image/*,.pdf"
                onChange={(e) => {
                  if (e.target.files && e.target.files[0]) {
                    setPassportFile(e.target.files[0]);
                    setError('');
                  }
                }}
                style={{
                  position: 'absolute',
                  inset: 0,
                  width: '100%',
                  height: '100%',
                  opacity: 0,
                  cursor: 'pointer',
                  zIndex: 2,
                }}
              />
              <div
                style={{
                  width: '100%',
                  minHeight: 42,
                  padding: '10px 14px',
                  background: R.bgInput,
                  border: '1px dashed var(--rt-line)',
                  borderRadius: 2,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  fontSize: 13,
                  color: R.textMuted,
                  cursor: 'pointer',
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: 8, overflow: 'hidden' }}>
                  {passportFile ? (
                    <>
                      <FileIcon size={16} color={R.accent} style={{ flexShrink: 0 }} />
                      <span style={{ fontWeight: 700, color: R.text, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                        {passportFile.name}
                      </span>
                    </>
                  ) : (
                    <>
                      <Upload size={16} style={{ flexShrink: 0 }} />
                      <span>Прикрепить файл паспорта</span>
                    </>
                  )}
                </div>
              </div>
            </div>
          </div>

          {error && (
            <div
              style={{
                fontSize: 12,
                fontFamily: mono,
                color: R.danger,
                background: R.dangerSubtle,
                border: `1px solid ${R.dangerBorder}`,
                padding: '8px 12px',
                textAlign: 'center',
                borderRadius: 2,
              }}
            >
              {error}
            </div>
          )}

          <button 
            type="submit" 
            style={{
              ...btnAccent,
              width: '100%',
              height: 42,
              fontSize: 13,
              marginTop: 6,
            }}
          >
            <UserCheck size={16} /> Подтвердить и продолжить
          </button>
        </form>
      </motion.div>
    </div>
  );
};
