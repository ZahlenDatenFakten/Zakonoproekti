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
      authDomain: (firebaseConfig.authDomain || '').trim(),
      databaseURL: (firebaseConfig.databaseURL || '').trim(),
      storageBucket: (firebaseConfig.storageBucket || '').trim(),
      messagingSenderId: (firebaseConfig.messagingSenderId || '').trim(),
      appId: (firebaseConfig.appId || '').trim(),
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
      style={{ zIndex: 7000 }}
    >
      <div className="modal-content" onClick={(e) => e.stopPropagation()} style={{ maxWidth: '660px', width: '100%' }}>
        
        {/* Header */}
        <div className="modal-header">
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            <div style={{ width: '38px', height: '38px', borderRadius: 'var(--radius-md)', background: 'var(--primary-gradient)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <Database size={18} color="#ffffff" />
            </div>
            <div>
              <h3 style={{ fontSize: '1.05rem', fontWeight: 800, color: 'var(--text-primary)' }}>
                Конфигурация Облачной БД
              </h3>
              <p style={{ fontSize: '0.76rem', color: 'var(--text-accent)', fontFamily: 'var(--font-mono)' }}>
                Синхронизация реестра: Firebase Firestore или Supabase Postgres
              </p>
            </div>
          </div>

          <button onClick={onClose} className="btn btn-ghost" style={{ padding: '6px' }}>
            <X size={16} />
          </button>
        </div>

        <div className="modal-body">
          {/* Database Selection Tabs */}
          <div style={{ display: 'flex', gap: '4px', background: 'var(--bg-input)', padding: '4px', borderRadius: 'var(--radius-pill)', marginBottom: '20px', border: '1px solid var(--border-subtle)' }}>
            <button
              onClick={() => setActiveTab('firebase')}
              className="btn btn-pill"
              style={{
                flex: 1,
                fontSize: '0.78rem',
                padding: '7px 12px',
                background: activeTab === 'firebase' ? 'var(--primary-gradient)' : 'transparent',
                color: activeTab === 'firebase' ? '#ffffff' : 'var(--text-secondary)',
                border: 'none'
              }}
            >
              🔥 Firebase Cloud Firestore
            </button>

            <button
              onClick={() => setActiveTab('supabase')}
              className="btn btn-pill"
              style={{
                flex: 1,
                fontSize: '0.78rem',
                padding: '7px 12px',
                background: activeTab === 'supabase' ? 'var(--primary-gradient)' : 'transparent',
                color: activeTab === 'supabase' ? '#ffffff' : 'var(--text-secondary)',
                border: 'none'
              }}
            >
              ⚡ Supabase PostgreSQL
            </button>
          </div>

          {/* TAB 1: Firebase Firestore */}
          {activeTab === 'firebase' && (
            <div>
              <div style={{ background: firebaseConfig.isConnected ? 'var(--success-bg)' : 'var(--bg-input)', border: `1px solid ${firebaseConfig.isConnected ? 'var(--success-border)' : 'var(--border-subtle)'}`, borderRadius: 'var(--radius-md)', padding: '14px', marginBottom: '18px' }}>
                <div style={{ fontSize: '0.84rem', fontWeight: 700, color: firebaseConfig.isConnected ? 'var(--success-text)' : 'var(--text-primary)', display: 'flex', alignItems: 'center', gap: '6px' }}>
                  <Flame size={16} color="var(--warning-text)" />
                  {firebaseConfig.isConnected ? '✓ Синхронизация Firebase подключена' : 'Облачное хранилище Firebase Firestore'}
                </div>
                <p style={{ fontSize: '0.78rem', color: 'var(--text-secondary)', marginTop: '4px', lineHeight: 1.5, fontFamily: 'var(--font-mono)' }}>
                  Укажите ключи вашей облачной базы данных из консоли Firebase для мгновенной синхронизации изменений:
                </p>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px', marginBottom: '16px' }}>
                <div>
                  <label className="input-label">API Key (apiKey):</label>
                  <input
                    type="text"
                    className="input-field"
                    placeholder="AIzaSy..."
                    value={firebaseConfig.apiKey}
                    onChange={(e) => setFirebaseConfigState({ ...firebaseConfig, apiKey: e.target.value })}
                    style={{ fontSize: '0.8rem', fontFamily: 'var(--font-mono)' }}
                  />
                </div>

                <div>
                  <label className="input-label">Project ID (projectId):</label>
                  <input
                    type="text"
                    className="input-field"
                    placeholder="my-zakonoproekti-app"
                    value={firebaseConfig.projectId}
                    onChange={(e) => setFirebaseConfigState({ ...firebaseConfig, projectId: e.target.value })}
                    style={{ fontSize: '0.8rem', fontFamily: 'var(--font-mono)' }}
                  />
                </div>

                <div>
                  <label className="input-label">Realtime DB URL:</label>
                  <input
                    type="text"
                    className="input-field"
                    placeholder="https://app-default-rtdb.firebaseio.com"
                    value={firebaseConfig.databaseURL || ''}
                    onChange={(e) => setFirebaseConfigState({ ...firebaseConfig, databaseURL: e.target.value })}
                    style={{ fontSize: '0.8rem', fontFamily: 'var(--font-mono)' }}
                  />
                </div>

                <div>
                  <label className="input-label">App ID (appId):</label>
                  <input
                    type="text"
                    className="input-field"
                    placeholder="1:12345:web:abcde"
                    value={firebaseConfig.appId}
                    onChange={(e) => setFirebaseConfigState({ ...firebaseConfig, appId: e.target.value })}
                    style={{ fontSize: '0.8rem', fontFamily: 'var(--font-mono)' }}
                  />
                </div>
              </div>

              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px' }}>
                <button onClick={onClose} className="btn btn-secondary btn-pill" style={{ fontSize: '0.82rem' }}>Отмена</button>
                <button onClick={handleSaveFirebase} className="btn btn-primary btn-pill" style={{ fontSize: '0.82rem' }}>Сохранить Firebase</button>
              </div>
            </div>
          )}

          {/* TAB 2: Supabase Postgres */}
          {activeTab === 'supabase' && (
            <div>
              <div style={{ marginBottom: '18px' }}>
                <label className="input-label">Supabase Project URL:</label>
                <input
                  type="text"
                  className="input-field"
                  placeholder="https://xyzxyz.supabase.co"
                  value={url}
                  onChange={(e) => setUrl(e.target.value)}
                  style={{ fontSize: '0.82rem', fontFamily: 'var(--font-mono)', marginBottom: '12px' }}
                />

                <label className="input-label">Supabase Anon Public API Key:</label>
                <input
                  type="password"
                  className="input-field"
                  placeholder="eyJhbGciOiJIUzI1NiIsInR5cCI6..."
                  value={key}
                  onChange={(e) => setKey(e.target.value)}
                  style={{ fontSize: '0.82rem', fontFamily: 'var(--font-mono)' }}
                />
              </div>

              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px' }}>
                <button onClick={onClose} className="btn btn-secondary btn-pill" style={{ fontSize: '0.82rem' }}>Отмена</button>
                <button onClick={handleSaveSupabase} className="btn btn-primary btn-pill" style={{ fontSize: '0.82rem' }}>Сохранить Supabase</button>
              </div>
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
