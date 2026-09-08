import React, { useState } from 'react';
import { motion } from 'framer-motion';
import type { DbConfig } from '../types/bill';
import { saveDbConfig, resetSupabaseClient, testSupabaseConnection } from '../services/supabaseClient';
import { getStoredFirebaseConfig, testFirebaseConnection, saveFirebaseConfigToServer } from '../services/firebaseClient';
import type { FirebaseConfig } from '../services/firebaseClient';
import { Database, X, Flame, ShieldAlert, CheckCircle2, AlertTriangle, Copy, Check, RefreshCw } from 'lucide-react';
import { useDialog } from '../contexts/DialogContext';
import { R, ft, label, mono, shadow, chip, btnAccent, btnOutline, btnDanger } from '../lib/ui';

import { isSystemAdmin } from '../services/securityService';
import { getUserProfile } from '../services/storageService';

interface DbConfigModalProps {
  config: DbConfig;
  onUpdateConfig: (newConfig: DbConfig) => void;
  onClose: () => void;
}

export const DbConfigModal: React.FC<DbConfigModalProps> = ({ config, onUpdateConfig, onClose }) => {
  const activeUser = getUserProfile();
  if (!isSystemAdmin(activeUser)) {
    return null;
  }

  const { alert, prompt } = useDialog();
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

  const getUpdatedFirebaseConfig = () => {
    return {
      ...firebaseConfig,
      apiKey: firebaseConfig.apiKey.trim(),
      projectId: firebaseConfig.projectId.trim(),
      authDomain: (firebaseConfig.authDomain || '').trim(),
      databaseURL: (firebaseConfig.databaseURL || '').trim(),
      storageBucket: (firebaseConfig.storageBucket || '').trim(),
      messagingSenderId: (firebaseConfig.messagingSenderId || '').trim(),
      appId: (firebaseConfig.appId || '').trim(),
      imgbbApiKey: (firebaseConfig.imgbbApiKey || '').trim(),
      isConnected: Boolean(firebaseConfig.apiKey.trim() && firebaseConfig.projectId.trim())
    };
  };

  const handleSaveFirebaseLocal = async () => {
    const updated = getUpdatedFirebaseConfig();
    try {
      localStorage.setItem('legaldraft_firebase_config_v1', JSON.stringify(updated));
      await alert({
        title: 'Сохранено локально',
        message: 'Настройки применены для вашего браузера.',
        variant: 'success'
      });
      onClose();
      window.location.reload();
    } catch (err: any) {
      await alert({ title: 'Ошибка', message: err.message, variant: 'error' });
    }
  };

  const handleSaveFirebaseServer = async () => {
    const updated = getUpdatedFirebaseConfig();
    
    const token = await prompt({
      title: 'Авторизация Администратора',
      message: 'Для применения этих настроек для всех пользователей требуется Admin Token сервера.',
      placeholder: 'Введите Admin Token'
    });
    
    if (token === null) return;
    
    try {
      await saveFirebaseConfigToServer(updated, token);
      await alert({
        title: 'Успех',
        message: 'Настройки успешно применены для всех пользователей!',
        variant: 'success'
      });
      onClose();
    } catch (err: any) {
      await alert({
        title: 'Ошибка',
        message: 'Ошибка при сохранении: ' + err.message,
        variant: 'error'
      });
    }
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
    try {
      const res = await testFirebaseConnection(getUpdatedFirebaseConfig());
      setTestResult(res);
    } catch (err: any) {
      setTestResult({
        success: false,
        message: 'Ошибка при проверке Firebase: ' + err.message
      });
    } finally {
      setIsTesting(false);
    }
  };

  const handleTestSupabase = async () => {
    setIsTesting(true);
    setTestResult(null);
    try {
      const res = await testSupabaseConnection({
        supabaseUrl: url.trim(),
        supabaseAnonKey: key.trim(),
        isConnected: true
      });
      setTestResult(res);
    } catch (err: any) {
      setTestResult({
        success: false,
        message: 'Ошибка при проверке Supabase: ' + err.message
      });
    } finally {
      setIsTesting(false);
    }
  };

  const handleCopyShareableLink = () => {
    try {
      let payload: any = {};
      if (activeTab === 'firebase') {
        const updated = getUpdatedFirebaseConfig();
        payload = {
          type: 'firebase',
          fb: {
            apiKey: updated.apiKey,
            projectId: updated.projectId,
            authDomain: updated.authDomain,
            databaseURL: updated.databaseURL,
            storageBucket: updated.storageBucket,
            appId: updated.appId
          }
        };
      } else {
        payload = {
          type: 'supabase',
          sb: {
            url: url.trim(),
            key: key.trim()
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

  const handleDisconnect = async () => {
    if (activeTab === 'firebase') {
      const token = await prompt({
        title: 'Отключение Firebase',
        message: 'Для отключения базы данных Firebase у всех пользователей требуется Admin Token сервера:',
        placeholder: 'Введите Admin Token'
      });
      if (token === null) return;
      try {
        await saveFirebaseConfigToServer({
          apiKey: '',
          projectId: '',
          authDomain: '',
          databaseURL: '',
          storageBucket: '',
          messagingSenderId: '',
          appId: '',
          imgbbApiKey: '',
          isConnected: false
        }, token);
        await alert({
          title: 'Отключено',
          message: 'База данных Firebase успешно отключена для всех пользователей!',
          variant: 'success'
        });
        onClose();
      } catch (err: any) {
        await alert({
          title: 'Ошибка',
          message: 'Ошибка при отключении: ' + err.message,
          variant: 'error'
        });
      }
    } else {
      const emptyConfig = { supabaseUrl: '', supabaseAnonKey: '', isConnected: false };
      saveDbConfig(emptyConfig);
      resetSupabaseClient();
      onUpdateConfig(emptyConfig);
      await alert({
        title: 'Отключено',
        message: 'База данных Supabase отключена на вашем устройстве.',
        variant: 'info'
      });
      onClose();
    }
  };

  return (
    <div
      style={{
        position: 'fixed',
        inset: 0,
        zIndex: 9999,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: 16,
        background: 'rgba(10, 9, 8, 0.7)',
        backdropFilter: 'blur(6px)',
      }}
    >
      <motion.div 
        initial={{ opacity: 0, scale: 0.96, y: 15 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.96, y: 15 }}
        style={{
          width: '100%',
          maxWidth: 680,
          maxHeight: '90vh',
          background: R.bgPanel,
          border: ft.strong,
          borderRadius: 2,
          boxShadow: shadow.panel,
          overflow: 'hidden',
          display: 'flex',
          flexDirection: 'column',
        }}
      >
        {/* Header */}
        <div
          style={{
            padding: '14px 20px',
            borderBottom: ft.hair,
            background: R.bgElevated,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <div style={{ width: 32, height: 32, display: 'grid', placeItems: 'center', background: R.accentSubtle, color: R.accent, borderRadius: 2 }}>
              <Database size={16} />
            </div>
            <div>
              <h3 style={{ fontSize: 14, fontWeight: 800, color: R.text, margin: 0 }}>
                Облачная база данных
              </h3>
              <div style={{ fontSize: 10.5, fontFamily: mono, color: R.textMuted, marginTop: 1, textTransform: 'uppercase' }}>
                Автосинхронизация проектов
              </div>
            </div>
          </div>
          <button 
            onClick={onClose} 
            style={{
              background: 'none',
              border: 'none',
              color: R.textMuted,
              cursor: 'pointer',
              display: 'grid',
              placeItems: 'center',
              padding: 4,
            }}
          >
            <X size={18} />
          </button>
        </div>

        <div style={{ padding: 20, overflowY: 'auto' }} className="rt-scroll">
          {/* Tabs */}
          <div style={{ display: 'flex', gap: 6, marginBottom: 18 }}>
            <button
              onClick={() => { setActiveTab('firebase'); setTestResult(null); }}
              style={chip(activeTab === 'firebase')}
            >
              🔥 Firebase Firestore
            </button>
            <button
              onClick={() => { setActiveTab('supabase'); setTestResult(null); }}
              style={chip(activeTab === 'supabase')}
            >
              ⚡ Supabase PostgreSQL
            </button>
          </div>

          {/* TAB 1: Firebase Firestore */}
          {activeTab === 'firebase' && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
              <div
                style={{
                  padding: 14,
                  background: firebaseConfig.isConnected ? R.successSubtle : R.bgInput,
                  border: `1px solid ${firebaseConfig.isConnected ? R.success : 'var(--rt-line)'}`,
                  borderRadius: 2,
                  display: 'flex',
                  flexDirection: 'column',
                  gap: 4,
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 13, fontWeight: 700, color: firebaseConfig.isConnected ? R.success : R.text }}>
                  {firebaseConfig.isConnected ? <CheckCircle2 size={16} /> : <Flame size={16} color={R.warning} />}
                  {firebaseConfig.isConnected ? 'Синхронизация Firebase активна' : 'Облачное хранилище Firebase Firestore'}
                </div>
                <div style={{ fontSize: 12, color: R.textMuted, lineHeight: 1.4 }}>
                  Законопроекты и поправки мгновенно отправляются в Firebase и зеркально отображаются у всех подключенных пользователей.
                </div>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
                <div>
                  <label style={{ ...label, display: 'block', marginBottom: 4 }}>API Key (apiKey):</label>
                  <input
                    type="text"
                    placeholder="AIzaSy..."
                    value={firebaseConfig.apiKey}
                    onChange={(e) => setFirebaseConfigState({ ...firebaseConfig, apiKey: e.target.value })}
                    style={{ width: '100%', height: 34, padding: '0 10px', fontSize: 12, fontFamily: mono, background: R.bgInput, border: ft.edge, color: R.text, borderRadius: 2 }}
                  />
                </div>

                <div>
                  <label style={{ ...label, display: 'block', marginBottom: 4 }}>Project ID (projectId):</label>
                  <input
                    type="text"
                    placeholder="my-zakonoproekti-app"
                    value={firebaseConfig.projectId}
                    onChange={(e) => setFirebaseConfigState({ ...firebaseConfig, projectId: e.target.value })}
                    style={{ width: '100%', height: 34, padding: '0 10px', fontSize: 12, fontFamily: mono, background: R.bgInput, border: ft.edge, color: R.text, borderRadius: 2 }}
                  />
                </div>

                <div>
                  <label style={{ ...label, display: 'block', marginBottom: 4 }}>Storage Bucket:</label>
                  <input
                    type="text"
                    placeholder="my-app.appspot.com"
                    value={firebaseConfig.storageBucket || ''}
                    onChange={(e) => setFirebaseConfigState({ ...firebaseConfig, storageBucket: e.target.value })}
                    style={{ width: '100%', height: 34, padding: '0 10px', fontSize: 12, fontFamily: mono, background: R.bgInput, border: ft.edge, color: R.text, borderRadius: 2 }}
                  />
                </div>

                <div>
                  <label style={{ ...label, display: 'block', marginBottom: 4 }}>App ID:</label>
                  <input
                    type="text"
                    placeholder="1:123456789:web:..."
                    value={firebaseConfig.appId || ''}
                    onChange={(e) => setFirebaseConfigState({ ...firebaseConfig, appId: e.target.value })}
                    style={{ width: '100%', height: 34, padding: '0 10px', fontSize: 12, fontFamily: mono, background: R.bgInput, border: ft.edge, color: R.text, borderRadius: 2 }}
                  />
                </div>
              </div>
            </div>
          )}

          {/* TAB 2: Supabase */}
          {activeTab === 'supabase' && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
              <div>
                <label style={{ ...label, display: 'block', marginBottom: 6 }}>Supabase URL:</label>
                <input
                  type="text"
                  placeholder="https://xyzcompany.supabase.co"
                  value={url}
                  onChange={(e) => setUrl(e.target.value)}
                  style={{ width: '100%', height: 36, padding: '0 10px', fontSize: 13, fontFamily: mono, background: R.bgInput, border: ft.edge, color: R.text, borderRadius: 2 }}
                />
              </div>

              <div>
                <label style={{ ...label, display: 'block', marginBottom: 6 }}>Supabase Anon Key:</label>
                <input
                  type="password"
                  placeholder="eyJh..."
                  value={key}
                  onChange={(e) => setKey(e.target.value)}
                  style={{ width: '100%', height: 36, padding: '0 10px', fontSize: 13, fontFamily: mono, background: R.bgInput, border: ft.edge, color: R.text, borderRadius: 2 }}
                />
              </div>
            </div>
          )}

          {/* Test Results Display */}
          {testResult && (
            <div
              style={{
                marginTop: 14,
                padding: 12,
                borderRadius: 2,
                background: testResult.success ? R.successSubtle : R.dangerSubtle,
                border: `1px solid ${testResult.success ? R.success : R.dangerBorder}`,
                color: testResult.success ? R.success : R.danger,
                fontSize: 12,
              }}
            >
              <div style={{ fontWeight: 700, display: 'flex', alignItems: 'center', gap: 6 }}>
                {testResult.success ? <CheckCircle2 size={16} /> : <AlertTriangle size={16} />}
                {testResult.message}
              </div>
              {testResult.details && (
                <div style={{ fontSize: 11, fontFamily: mono, marginTop: 4, color: R.textSecondary }}>
                  {testResult.details}
                </div>
              )}
            </div>
          )}

          {/* Action buttons */}
          <div style={{ display: 'flex', gap: 10, marginTop: 16 }}>
            <button
              onClick={activeTab === 'firebase' ? handleTestFirebase : handleTestSupabase}
              disabled={isTesting}
              style={{ ...btnOutline, flex: '1 1 0', height: 34, fontSize: 12 }}
            >
              {isTesting ? <RefreshCw size={14} className="rt-spin" /> : <ShieldAlert size={14} />}
              {isTesting ? 'Проверка...' : 'Проверить подключение'}
            </button>

            <button
              onClick={handleCopyShareableLink}
              style={{ ...btnOutline, flex: '1 1 0', height: 34, fontSize: 12 }}
            >
              {copiedLink ? <Check size={14} color={R.success} /> : <Copy size={14} />}
              {copiedLink ? 'Ссылка скопирована!' : 'Ссылка для коллег'}
            </button>
          </div>
        </div>

        {/* Footer */}
        <div
          style={{
            padding: '12px 20px',
            borderTop: ft.hair,
            background: R.bgElevated,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
          }}
        >
          <button 
            onClick={handleDisconnect}
            style={{ ...btnDanger, height: 34, fontSize: 12 }}
          >
            Отключить базу
          </button>

          <div style={{ display: 'flex', gap: 8 }}>
            <button 
              onClick={onClose} 
              style={{ ...btnOutline, height: 34, fontSize: 12 }}
            >
              Отмена
            </button>
            {activeTab === 'firebase' && (
              <button
                onClick={handleSaveFirebaseServer}
                style={{ ...btnOutline, height: 34, fontSize: 12, color: R.accent, borderColor: R.accentBorder }}
                title="Применить конфигурацию на сервере для всех пользователей"
              >
                На сервер
              </button>
            )}
            <button 
              onClick={activeTab === 'firebase' ? handleSaveFirebaseLocal : handleSaveSupabase} 
              style={{ ...btnAccent, height: 34, fontSize: 12 }}
            >
              Сохранить
            </button>
          </div>
        </div>
      </motion.div>
    </div>
  );
};
