import React, { useState } from 'react';
import { ShieldCheck, UserCheck } from 'lucide-react';

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

    onSubmit(cleanFirst, cleanLast);
  };

  return (
    <div 
      className="modal-overlay" 
      style={{ 
        zIndex: 99999, 
        background: 'rgba(4, 7, 14, 0.95)',
        backdropFilter: 'blur(16px)'
      }}
    >
      <div 
        className="modal-content animate-fade-in" 
        style={{ 
          maxWidth: '460px', 
          padding: '32px',
          border: '1px solid var(--border-accent)',
          boxShadow: 'var(--shadow-lg), 0 0 50px var(--primary-glow)'
        }}
      >
        <div style={{ textAlign: 'center', marginBottom: '24px' }}>
          <div style={{
            width: '56px', height: '56px', borderRadius: '50%',
            background: 'var(--primary-gradient)',
            boxShadow: '0 4px 20px var(--primary-glow)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            margin: '0 auto 16px'
          }}>
            <ShieldCheck size={28} color="#ffffff" />
          </div>

          <h2 style={{ fontSize: '1.35rem', fontWeight: 800, color: 'var(--text-primary)', marginBottom: '6px' }}>
            Авторизация Гражданина
          </h2>
          <p style={{ fontSize: '0.86rem', color: 'var(--text-muted)', margin: 0, lineHeight: 1.4 }}>
            При заходе на портал законопроектов Штата San Andreas укажите ваше реальное Имя и Фамилию.
          </p>
        </div>

        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '18px' }}>
          <div>
            <label className="input-label">Ваше Имя</label>
            <input 
              type="text" 
              value={firstName}
              onChange={(e) => { setFirstName(e.target.value); setError(''); }}
              placeholder="Например: Александр"
              className="input-field"
              autoFocus
              style={{ fontSize: '0.95rem' }}
            />
          </div>

          <div>
            <label className="input-label">Ваша Фамилия</label>
            <input 
              type="text" 
              value={lastName}
              onChange={(e) => { setLastName(e.target.value); setError(''); }}
              placeholder="Например: Северов"
              className="input-field"
              style={{ fontSize: '0.95rem' }}
            />
          </div>

          {error && (
            <div style={{ fontSize: '0.82rem', color: 'var(--danger-text)', background: 'var(--danger-bg)', border: '1px solid var(--danger-border)', padding: '8px 14px', borderRadius: 'var(--radius-sm)', textAlign: 'center' }}>
              {error}
            </div>
          )}

          <button 
            type="submit" 
            className="btn btn-primary btn-pill" 
            style={{ width: '100%', padding: '12px', fontSize: '0.95rem', marginTop: '6px' }}
          >
            <UserCheck size={18} /> Подтвердить и Войти
          </button>
        </form>
      </div>
    </div>
  );
};
