import React, { useState } from 'react';
import type { DbConfig } from '../types/bill';
import { saveDbConfig, resetSupabaseClient } from '../services/supabaseClient';
import { getStoredFirebaseConfig, saveFirebaseConfig } from '../services/firebaseClient';
import type { FirebaseConfig } from '../services/firebaseClient';
import { Database, X, Flame } from 'lucide-react';

interface DbConfigModalProps {
  config: DbConfig;
  onUpdateConfig: (newConfig: DbConfig) => void;
  onClose: () => void;
}

export const DbConfigModal: React.FC<DbConfigModalProps> = ({ config, onUpdateConfig, onClose }) => {
  const [activeTab, setActiveTab] = useState<'firebase' | 'supabase'>('firebase');

  // Firebase Form State
  const [firebaseConfig, setFirebaseConfigState] = useState<FirebaseConfig>(getStoredFirebaseConfig());

  // Supabase Form State
  const [url, setUrl] = useState(config.supabaseUrl || '');
  const [key, setKey] = useState(config.supabaseAnonKey || '');

  const handleSaveFirebase = () => {
    const isConn = Boolean(firebaseConfig.apiKey.trim() && firebaseConfig.projectId.trim());
    const updated = {
      ...firebaseConfig,
      apiKey: firebaseConfig.apiKey.trim(),
      projectId: firebaseConfig.projectId.trim(),
      authDomain: firebaseConfig.authDomain.trim(),
      storageBucket: firebaseConfig.storageBucket.trim(),
      messagingSenderId: firebaseConfig.messagingSenderId.trim(),
      appId: firebaseConfig.appId.trim(),
      isConnected: isConn
    };
    saveFirebaseConfig(updated);
    onClose();
  };

  const handleSaveSupabase = () => {
    const newConfig: DbConfig = {
      supabaseUrl: url.trim(),
      supabaseAnonKey: key.trim(),
      isConnected: Boolean(url.trim() && key.trim())
    };
    saveDbConfig(newConfig);
    resetSupabaseClient();
    onUpdateConfig(newConfig);
    onClose();
  };

  return (
    <div className="modal-overlay" onClick={onClose} style={{ zIndex: 7000 }}>
      <div className="modal-content" onClick={(e) => e.stopPropagation()} style={{ maxWidth: '680px', padding: '24px' }}>
        
        {/* Header */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '18px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <div style={{ width: '42px', height: '42px', borderRadius: '10px', background: 'var(--bg-input)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <Database size={22} color="var(--text-primary)" />
            </div>
            <div>
              <h3 style={{ fontSize: '1.15rem', fontWeight: 600, color: 'var(--text-primary)' }}>
                Подключение Бесплатной Облачной БД
              </h3>
              <p style={{ fontSize: '0.8rem', color: 'var(--text-tertiary)' }}>
                Бесплатный тариф: Firebase Firestore или Supabase Postgres
              </p>
            </div>
          </div>

          <button onClick={onClose} className="btn btn-secondary" style={{ padding: '6px' }}>
            <X size={18} />
          </button>
        </div>

        {/* Database Selection Tabs */}
        <div style={{ display: 'flex', gap: '10px', borderBottom: '1px solid var(--border-subtle)', paddingBottom: '10px', marginBottom: '20px' }}>
          <button
            onClick={() => setActiveTab('firebase')}
            className="btn btn-secondary"
            style={{
              fontSize: '0.85rem',
              padding: '8px 14px',
              background: activeTab === 'firebase' ? 'rgba(251, 146, 60, 0.15)' : 'transparent',
              borderColor: activeTab === 'firebase' ? 'rgba(251, 146, 60, 0.4)' : 'transparent',
              color: activeTab === 'firebase' ? '#fb923c' : 'var(--text-secondary)'
            }}
          >
            🔥 Firebase Cloud Firestore (Рекомендуется)
          </button>

          <button
            onClick={() => setActiveTab('supabase')}
            className="btn btn-secondary"
            style={{
              fontSize: '0.85rem',
              padding: '8px 14px',
              background: activeTab === 'supabase' ? 'rgba(52, 211, 153, 0.15)' : 'transparent',
              borderColor: activeTab === 'supabase' ? 'rgba(52, 211, 153, 0.4)' : 'transparent',
              color: activeTab === 'supabase' ? '#34d399' : 'var(--text-secondary)'
            }}
          >
            ⚡ Supabase PostgreSQL
          </button>
        </div>

        {/* TAB 1: Firebase Firestore */}
        {activeTab === 'firebase' && (
          <div>
            <div style={{ background: firebaseConfig.isConnected ? 'rgba(52, 211, 153, 0.12)' : 'var(--bg-input)', border: '1px solid var(--border-subtle)', borderRadius: '10px', padding: '14px', marginBottom: '18px' }}>
              <div style={{ fontSize: '0.88rem', fontWeight: 600, color: firebaseConfig.isConnected ? '#34d399' : 'var(--text-primary)', display: 'flex', alignItems: 'center', gap: '6px' }}>
                <Flame size={16} color="#fb923c" />
                {firebaseConfig.isConnected ? '✓ База данных Firebase подключена' : '🔥 Firebase Cloud Firestore — 100% Бесплатно'}
              </div>
              <p style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', marginTop: '4px', lineHeight: 1.5 }}>
                Создайте бесплатный проект на <a href="https://console.firebase.google.com" target="_blank" rel="noreferrer" style={{ color: '#60a5fa' }}>console.firebase.google.com</a>, перейдите в Project Settings и скопируйте ключи `firebaseConfig`:
              </p>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px', marginBottom: '14px' }}>
              <div>
                <label style={{ fontSize: '0.78rem', color: 'var(--text-tertiary)', display: 'block', marginBottom: '4px' }}>API Key (apiKey):</label>
                <input
                  type="text"
                  className="input-field"
                  placeholder="AIzaSy..."
                  value={firebaseConfig.apiKey}
                  onChange={(e) => setFirebaseConfigState({ ...firebaseConfig, apiKey: e.target.value })}
                  style={{ fontSize: '0.82rem' }}
                />
              </div>

              <div>
                <label style={{ fontSize: '0.78rem', color: 'var(--text-tertiary)', display: 'block', marginBottom: '4px' }}>Project ID (projectId):</label>
                <input
                  type="text"
                  className="input-field"
                  placeholder="my-zakonoproekti-app"
                  value={firebaseConfig.projectId}
                  onChange={(e) => setFirebaseConfigState({ ...firebaseConfig, projectId: e.target.value })}
                  style={{ fontSize: '0.82rem' }}
                />
              </div>

              <div>
                <label style={{ fontSize: '0.78rem', color: 'var(--text-tertiary)', display: 'block', marginBottom: '4px' }}>Auth Domain (authDomain):</label>
                <input
                  type="text"
                  className="input-field"
                  placeholder="app.firebaseapp.com"
                  value={firebaseConfig.authDomain}
                  onChange={(e) => setFirebaseConfigState({ ...firebaseConfig, authDomain: e.target.value })}
                  style={{ fontSize: '0.82rem' }}
                />
              </div>

              <div>
                <label style={{ fontSize: '0.78rem', color: 'var(--text-tertiary)', display: 'block', marginBottom: '4px' }}>App ID (appId):</label>
                <input
                  type="text"
                  className="input-field"
                  placeholder="1:12345:web:abcde"
                  value={firebaseConfig.appId}
                  onChange={(e) => setFirebaseConfigState({ ...firebaseConfig, appId: e.target.value })}
                  style={{ fontSize: '0.82rem' }}
                />
              </div>
            </div>

            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px' }}>
              <button onClick={onClose} className="btn btn-secondary">Отмена</button>
              <button onClick={handleSaveFirebase} className="btn btn-primary">Сохранить Firebase БД</button>
            </div>
          </div>
        )}

        {/* TAB 2: Supabase Postgres */}
        {activeTab === 'supabase' && (
          <div>
            <div style={{ marginBottom: '18px' }}>
              <label style={{ fontSize: '0.82rem', color: 'var(--text-tertiary)', display: 'block', marginBottom: '4px' }}>
                Supabase / Postgres Project URL:
              </label>
              <input
                type="text"
                className="input-field"
                placeholder="https://xyzxyz.supabase.co"
                value={url}
                onChange={(e) => setUrl(e.target.value)}
                style={{ fontSize: '0.84rem', marginBottom: '12px' }}
              />

              <label style={{ fontSize: '0.78rem', color: 'var(--text-tertiary)', display: 'block', marginBottom: '4px' }}>
                Supabase Anon Public API Key:
              </label>
              <input
                type="password"
                className="input-field"
                placeholder="eyJhbGciOiJIUzI1NiIsInR5cCI6..."
                value={key}
                onChange={(e) => setKey(e.target.value)}
                style={{ fontSize: '0.84rem' }}
              />
            </div>

            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px' }}>
              <button onClick={onClose} className="btn btn-secondary">Отмена</button>
              <button onClick={handleSaveSupabase} className="btn btn-primary">Сохранить Supabase БД</button>
            </div>
          </div>
        )}

      </div>
    </div>
  );
};
