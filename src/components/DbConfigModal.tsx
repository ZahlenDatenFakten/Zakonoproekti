import React, { useState } from 'react';
import type { DbConfig } from '../types/bill';
import { saveDbConfig, resetSupabaseClient, testSupabaseConnection } from '../services/supabaseClient';
import { getStoredFirebaseConfig, saveFirebaseConfig, testFirebaseConnection } from '../services/firebaseClient';
import type { FirebaseConfig } from '../services/firebaseClient';
import { Database, X, Flame, ShieldAlert, CheckCircle2, AlertTriangle, Copy, Check, RefreshCw } from 'lucide-react';

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

  // Diagnostic state
  const [isTesting, setIsTesting] = useState(false);
  const [testResult, setTestResult] = useState<{ success?: boolean; message?: string; details?: string } | null>(null);
  const [copiedLink, setCopiedLink] = useState(false);

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

  const handleTestFirebase = async () => {
    setIsTesting(true);
    setTestResult(null);
    const res = await testFirebaseConnection({ ...firebaseConfig, isConnected: true });
    setIsTesting(false);
    setTestResult(res);
  };

  const handleTestSupabase = async () => {
    setIsTesting(true);
    setTestResult(null);
    const res = await testSupabaseConnection({ supabaseUrl: url.trim(), supabaseAnonKey: key.trim(), isConnected: true });
    setIsTesting(false);
    setTestResult(res);
  };

  const handleCopyShareableLink = () => {
    try {
      let payload = {};
      if (activeTab === 'firebase') {
        payload = {
          type: 'firebase',
          config: {
            apiKey: firebaseConfig.apiKey.trim(),
            projectId: firebaseConfig.projectId.trim(),
            authDomain: (firebaseConfig.authDomain || '').trim(),
            databaseURL: (firebaseConfig.databaseURL || '').trim(),
            storageBucket: (firebaseConfig.storageBucket || '').trim(),
            messagingSenderId: (firebaseConfig.messagingSenderId || '').trim(),
            appId: (firebaseConfig.appId || '').trim(),
            isConnected: true
          }
        };
      } else {
        payload = {
          type: 'supabase',
          config: {
            supabaseUrl: url.trim(),
            supabaseAnonKey: key.trim(),
            isConnected: true
          }
        };
      }

      const encoded = btoa(unescape(encodeURIComponent(JSON.stringify(payload))));
      const shareUrl = window.location.origin + window.location.pathname + '?db_sync=' + encoded;
      navigator.clipboard.writeText(shareUrl);
      setCopiedLink(true);
      setTimeout(() => setCopiedLink(false), 3000);
    } catch (e) {
      console.error(e);
    }
  };

  const backdropMouseDownRef = React.useRef(false);

  return (
    <div 
      className="modal-overlay animate-fade-in" 
      onMouseDown={(e) => { backdropMouseDownRef.current = (e.target === e.currentTarget); }}
      onClick={(e) => {
        if (e.target === e.currentTarget && backdropMouseDownRef.current) {
          onClose();
        }
      }} 
      style={{ zIndex: 7000, padding: '20px' }}
    >
      <div className="modal-content" onClick={(e) => e.stopPropagation()} style={{ maxWidth: '680px', width: '100%', maxHeight: '90vh', overflowY: 'auto' }}>
        
        {/* Header */}
        <div className="modal-header">
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            <div style={{ width: '38px', height: '38px', borderRadius: 'var(--radius-md)', background: 'var(--primary-gradient)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <Database size={18} color="#ffffff" />
            </div>
            <div>
              <h3 style={{ margin: 0, fontSize: '1.05rem', fontWeight: 800, color: 'var(--text-primary)' }}>
                Облачная База Данных и Автосинхронизация
              </h3>
              <p style={{ margin: '2px 0 0', fontSize: '0.74rem', color: 'var(--text-accent)', fontFamily: 'var(--font-mono)' }}>
                Мгновенное зеркалирование проектов между всеми гражданами и руководством
              </p>
            </div>
          </div>

          <button onClick={onClose} className="btn btn-ghost" style={{ padding: '6px' }}>
            <X size={16} />
          </button>
        </div>

        <div className="modal-body" style={{ padding: '20px' }}>
          
          {/* Database Selection Tabs */}
          <div style={{ display: 'flex', gap: '4px', background: 'var(--bg-input)', padding: '4px', borderRadius: 'var(--radius-pill)', marginBottom: '18px', border: '1px solid var(--border-subtle)' }}>
            <button
              onClick={() => { setActiveTab('firebase'); setTestResult(null); }}
              className="btn btn-pill"
              style={{
                flex: 1,
                fontSize: '0.8rem',
                padding: '7px 12px',
                background: activeTab === 'firebase' ? 'var(--primary-gradient)' : 'transparent',
                color: activeTab === 'firebase' ? '#ffffff' : 'var(--text-secondary)',
                border: 'none',
                fontWeight: 600
              }}
            >
              🔥 Firebase Cloud Firestore
            </button>

            <button
              onClick={() => { setActiveTab('supabase'); setTestResult(null); }}
              className="btn btn-pill"
              style={{
                flex: 1,
                fontSize: '0.8rem',
                padding: '7px 12px',
                background: activeTab === 'supabase' ? 'var(--primary-gradient)' : 'transparent',
                color: activeTab === 'supabase' ? '#ffffff' : 'var(--text-secondary)',
                border: 'none',
                fontWeight: 600
              }}
            >
              ⚡ Supabase PostgreSQL
            </button>
          </div>

          {/* TAB 1: Firebase Firestore */}
          {activeTab === 'firebase' && (
            <div>
              <div style={{ background: firebaseConfig.isConnected ? 'rgba(46, 160, 67, 0.12)' : 'var(--bg-input)', border: `1px solid ${firebaseConfig.isConnected ? 'rgba(63, 185, 80, 0.4)' : 'var(--border-subtle)'}`, borderRadius: 'var(--radius-md)', padding: '14px', marginBottom: '16px' }}>
                <div style={{ fontSize: '0.86rem', fontWeight: 700, color: firebaseConfig.isConnected ? 'var(--success-text)' : 'var(--text-primary)', display: 'flex', alignItems: 'center', gap: '6px' }}>
                  <Flame size={16} color="var(--warning-text)" />
                  {firebaseConfig.isConnected ? '✓ Синхронизация Firebase активна' : 'Облачное хранилище Firebase Firestore'}
                </div>
                <p style={{ fontSize: '0.78rem', color: 'var(--text-secondary)', marginTop: '4px', lineHeight: 1.5, fontFamily: 'var(--font-mono)' }}>
                  Законопроекты и поправки мгновенно отправляются в Firebase и зеркально отображаются у всех подключенных пользователей.
                </p>
              </div>

              {/* Rules Guidance Alert */}
              <div style={{ padding: '12px 14px', background: 'rgba(56, 189, 248, 0.08)', border: '1px solid rgba(56, 189, 248, 0.25)', borderRadius: 'var(--radius-md)', marginBottom: '16px', fontSize: '0.78rem', color: '#e2e8f0', lineHeight: 1.5 }}>
                💡 <strong>Важная настройка в Firebase Console:</strong><br />
                В разделе <strong>Firestore Database ➔ Rules</strong> укажите:
                <div style={{ background: '#0a0d14', padding: '6px 10px', borderRadius: '4px', marginTop: '6px', fontFamily: 'monospace', color: '#38bdf8' }}>
                  allow read, write: if true;
                </div>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px', marginBottom: '14px' }}>
                <div>
                  <label className="input-label">API Key (apiKey):</label>
                  <input
                    type="text"
                    className="input-field"
                    placeholder="AIzaSy..."
                    value={firebaseConfig.apiKey}
                    onChange={(e) => setFirebaseConfigState({ ...firebaseConfig, apiKey: e.target.value })}
                    style={{ fontSize: '0.8rem', fontFamily: 'var(--font-mono)', width: '100%' }}
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
                    style={{ fontSize: '0.8rem', fontFamily: 'var(--font-mono)', width: '100%' }}
                  />
                </div>

                <div>
                  <label className="input-label">Realtime DB URL (необязательно):</label>
                  <input
                    type="text"
                    className="input-field"
                    placeholder="https://app-rtdb.firebaseio.com"
                    value={firebaseConfig.databaseURL || ''}
                    onChange={(e) => setFirebaseConfigState({ ...firebaseConfig, databaseURL: e.target.value })}
                    style={{ fontSize: '0.8rem', fontFamily: 'var(--font-mono)', width: '100%' }}
                  />
                </div>

                <div>
                  <label className="input-label">App ID (appId, необязательно):</label>
                  <input
                    type="text"
                    className="input-field"
                    placeholder="1:12345:web:abcde"
                    value={firebaseConfig.appId || ''}
                    onChange={(e) => setFirebaseConfigState({ ...firebaseConfig, appId: e.target.value })}
                    style={{ fontSize: '0.8rem', fontFamily: 'var(--font-mono)', width: '100%' }}
                  />
                </div>
              </div>
            </div>
          )}

          {/* TAB 2: Supabase Postgres */}
          {activeTab === 'supabase' && (
            <div>
              <div style={{ marginBottom: '16px' }}>
                <label className="input-label">Supabase Project URL:</label>
                <input
                  type="text"
                  className="input-field"
                  placeholder="https://xyzxyz.supabase.co"
                  value={url}
                  onChange={(e) => setUrl(e.target.value)}
                  style={{ fontSize: '0.82rem', fontFamily: 'var(--font-mono)', marginBottom: '12px', width: '100%' }}
                />

                <label className="input-label">Supabase Anon Public API Key:</label>
                <input
                  type="password"
                  className="input-field"
                  placeholder="eyJhbGciOiJIUzI1NiIsInR5cCI6..."
                  value={key}
                  onChange={(e) => setKey(e.target.value)}
                  style={{ fontSize: '0.82rem', fontFamily: 'var(--font-mono)', width: '100%' }}
                />
              </div>
            </div>
          )}

          {/* DIAGNOSTIC RESULT BOX */}
          {testResult && (
            <div style={{ 
              marginTop: '14px', 
              padding: '12px 16px', 
              borderRadius: 'var(--radius-md)', 
              background: testResult.success ? 'rgba(46, 160, 67, 0.15)' : 'rgba(218, 54, 51, 0.15)',
              border: `1px solid ${testResult.success ? 'rgba(63, 185, 80, 0.4)' : 'rgba(248, 81, 73, 0.4)'}`,
              color: testResult.success ? '#56d364' : '#ff7b72'
            }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', fontWeight: 700, fontSize: '0.86rem' }}>
                {testResult.success ? <CheckCircle2 size={16} /> : <AlertTriangle size={16} />}
                {testResult.message}
              </div>
              {testResult.details && (
                <div style={{ fontSize: '0.78rem', marginTop: '6px', color: '#cbd5e1', lineHeight: 1.45 }}>
                  {testResult.details}
                </div>
              )}
            </div>
          )}

          {/* ACTION BUTTONS: TEST CONNECTION & SHAREABLE LINK */}
          <div style={{ display: 'flex', gap: '10px', marginTop: '18px', flexWrap: 'wrap' }}>
            <button
              onClick={activeTab === 'firebase' ? handleTestFirebase : handleTestSupabase}
              disabled={isTesting}
              className="btn btn-secondary btn-pill"
              style={{ fontSize: '0.82rem', display: 'flex', alignItems: 'center', gap: '6px' }}
            >
              {isTesting ? <RefreshCw size={14} className="spin" /> : <ShieldAlert size={14} />}
              {isTesting ? 'Проверка соединения...' : '🧪 Проверить подключение к БД'}
            </button>

            <button
              onClick={handleCopyShareableLink}
              className="btn btn-secondary btn-pill"
              style={{ fontSize: '0.82rem', display: 'flex', alignItems: 'center', gap: '6px' }}
              title="Скопировать ссылку, при переходе по которой любой пользователь сразу подключится к этой же базе данных"
            >
              {copiedLink ? <Check size={14} color="var(--success-text)" /> : <Copy size={14} />}
              {copiedLink ? '✓ Ссылка для коллег скопирована!' : '🔗 Ссылка подключения для коллег'}
            </button>
          </div>

        </div>

        <div className="modal-footer" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <button className="btn btn-secondary btn-pill" onClick={onClose} style={{ fontSize: '0.82rem' }}>
            Отмена
          </button>
          <button 
            className="btn btn-primary btn-pill" 
            onClick={activeTab === 'firebase' ? handleSaveFirebase : handleSaveSupabase} 
            style={{ fontSize: '0.84rem' }}
          >
            Сохранить и Подключить
          </button>
        </div>

      </div>
    </div>
  );
};
