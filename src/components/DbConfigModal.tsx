import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import type { DbConfig } from '../types/bill';
import { saveDbConfig, resetSupabaseClient, testSupabaseConnection } from '../services/supabaseClient';
import { getStoredFirebaseConfig, testFirebaseConnection, saveFirebaseConfigToServer } from '../services/firebaseClient';
import type { FirebaseConfig } from '../services/firebaseClient';
import { Database, X, Flame, ShieldAlert, CheckCircle2, AlertTriangle, Copy, Check, RefreshCw } from 'lucide-react';
import { useDialog } from '../contexts/DialogContext';
import { cn } from '../utils/cn';

interface DbConfigModalProps {
  config: DbConfig;
  onUpdateConfig: (newConfig: DbConfig) => void;
  onClose: () => void;
}

export const DbConfigModal: React.FC<DbConfigModalProps> = ({ config, onUpdateConfig, onClose }) => {
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

  const handleSaveFirebase = async () => {
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
      imgbbApiKey: (firebaseConfig.imgbbApiKey || '').trim(),
      isConnected: isConn
    };
    
    // Only prompt for token if we actually want to save to the server
    const token = await prompt({
      title: 'Авторизация Администратора',
      message: 'Для применения этих настроек для всех пользователей требуется Admin Token сервера.\nЕсли вы его не знаете, проверьте консоль (логи docker) вашего сервера.',
      placeholder: 'Введите Admin Token'
    });
    
    if (token === null) return; // User cancelled
    
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
            imgbbApiKey: (firebaseConfig.imgbbApiKey || '').trim(),
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
      // Supabase is client-side only based on local storage anyway
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
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <motion.div 
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="absolute inset-0 bg-black/80 backdrop-blur-sm"
        onClick={onClose}
      />
      <motion.div 
        initial={{ opacity: 0, scale: 0.95, y: 20 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.95, y: 20 }}
        className="relative w-full max-w-3xl bg-[#0C0D12] border border-white/10 rounded-2xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh]"
      >
        
        {/* Header */}
        <div className="p-5 border-b border-white/10 bg-white/[0.02] flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-indigo-500/10 border border-indigo-500/20 text-indigo-400 flex items-center justify-center">
              <Database size={20} />
            </div>
            <div>
              <h3 className="text-lg font-bold text-white">Облачная База Данных</h3>
              <p className="text-[10px] font-mono text-zinc-500 uppercase tracking-wider">
                Автосинхронизация проектов
              </p>
            </div>
          </div>
          <button 
            onClick={onClose} 
            className="w-8 h-8 flex items-center justify-center rounded-xl bg-transparent hover:bg-white/5 text-zinc-400 hover:text-white transition-colors"
          >
            <X size={18} />
          </button>
        </div>

        <div className="p-6 overflow-y-auto custom-scrollbar">
          
          {/* Database Selection Tabs */}
          <div className="flex gap-2 p-1 bg-black/60 border border-white/10 rounded-xl mb-6">
            <button
              onClick={() => { setActiveTab('firebase'); setTestResult(null); }}
              className={cn(
                "flex-1 py-2 text-sm font-bold rounded-lg transition-all",
                activeTab === 'firebase' ? "bg-white/10 text-white shadow-sm" : "text-zinc-500 hover:text-zinc-300 hover:bg-white/5"
              )}
            >
              🔥 Firebase Cloud Firestore
            </button>
            <button
              onClick={() => { setActiveTab('supabase'); setTestResult(null); }}
              className={cn(
                "flex-1 py-2 text-sm font-bold rounded-lg transition-all",
                activeTab === 'supabase' ? "bg-white/10 text-white shadow-sm" : "text-zinc-500 hover:text-zinc-300 hover:bg-white/5"
              )}
            >
              ⚡ Supabase PostgreSQL
            </button>
          </div>

          {/* TAB 1: Firebase Firestore */}
          {activeTab === 'firebase' && (
            <div className="space-y-6">
              <div className={cn(
                "p-4 rounded-xl border flex flex-col gap-2 transition-colors",
                firebaseConfig.isConnected ? "bg-emerald-500/10 border-emerald-500/20" : "bg-white/[0.02] border-white/10"
              )}>
                <div className={cn(
                  "flex items-center gap-2 text-sm font-bold",
                  firebaseConfig.isConnected ? "text-emerald-400" : "text-white"
                )}>
                  {firebaseConfig.isConnected ? <CheckCircle2 size={16} /> : <Flame size={16} className="text-amber-400" />}
                  {firebaseConfig.isConnected ? 'Синхронизация Firebase активна' : 'Облачное хранилище Firebase Firestore'}
                </div>
                <p className="text-xs font-mono text-zinc-400">
                  Законопроекты и поправки мгновенно отправляются в Firebase и зеркально отображаются у всех подключенных пользователей.
                </p>
              </div>

              {/* Rules Guidance Alert */}
              <div className="p-4 bg-indigo-500/10 border border-indigo-500/20 rounded-xl space-y-3">
                <div>
                  <p className="text-[11px] text-indigo-200/80 leading-relaxed font-medium mb-1">
                    💡 <strong className="text-indigo-300">В Firebase Console ➔ Firestore Database ➔ Rules</strong> укажите:
                  </p>
                  <div className="bg-black/60 border border-white/5 rounded-lg p-2 font-mono text-[10px] text-indigo-400">
                    allow read, write: if true;
                  </div>
                </div>
                <div>
                  <p className="text-[11px] text-indigo-200/80 leading-relaxed font-medium mb-1">
                    💡 <strong className="text-indigo-300">В Firebase Console ➔ Storage ➔ Rules</strong> укажите (более безопасно):
                  </p>
                  <div className="bg-black/60 border border-white/5 rounded-lg p-2 font-mono text-[10px] text-indigo-400 whitespace-pre-wrap">
{`rules_version = '2';
service firebase.storage {
  match /b/{bucket}/o {
    match /uploads/{imageId} {
      allow read: if true;
      allow write: if request.resource.size < 15 * 1024 * 1024
                   && request.resource.contentType.matches('image/.*');
    }
  }
}`}
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-[10px] font-bold tracking-wider uppercase text-zinc-500 mb-2">API Key (apiKey):</label>
                  <input
                    type="text"
                    className="w-full bg-black/60 border border-white/10 rounded-xl px-4 py-2.5 text-xs font-mono text-white focus:outline-none focus:border-indigo-500/50 transition-colors placeholder-zinc-600"
                    placeholder="AIzaSy..."
                    value={firebaseConfig.apiKey}
                    onChange={(e) => setFirebaseConfigState({ ...firebaseConfig, apiKey: e.target.value })}
                  />
                </div>

                <div>
                  <label className="block text-[10px] font-bold tracking-wider uppercase text-zinc-500 mb-2">Project ID (projectId):</label>
                  <input
                    type="text"
                    className="w-full bg-black/60 border border-white/10 rounded-xl px-4 py-2.5 text-xs font-mono text-white focus:outline-none focus:border-indigo-500/50 transition-colors placeholder-zinc-600"
                    placeholder="my-zakonoproekti-app"
                    value={firebaseConfig.projectId}
                    onChange={(e) => setFirebaseConfigState({ ...firebaseConfig, projectId: e.target.value })}
                  />
                </div>

                <div>
                  <label className="block text-[10px] font-bold tracking-wider uppercase text-zinc-500 mb-2">Realtime DB URL (необязательно):</label>
                  <input
                    type="text"
                    className="w-full bg-black/60 border border-white/10 rounded-xl px-4 py-2.5 text-xs font-mono text-white focus:outline-none focus:border-indigo-500/50 transition-colors placeholder-zinc-600"
                    placeholder="https://app-rtdb.firebaseio.com"
                    value={firebaseConfig.databaseURL || ''}
                    onChange={(e) => setFirebaseConfigState({ ...firebaseConfig, databaseURL: e.target.value })}
                  />
                </div>

                <div>
                  <label className="block text-[10px] font-bold tracking-wider uppercase text-zinc-500 mb-2 flex items-center justify-between">
                    <span>Storage Bucket (для фото):</span>
                  </label>
                  <input
                    type="text"
                    className="w-full bg-black/60 border border-white/10 rounded-xl px-4 py-2.5 text-xs font-mono text-white focus:outline-none focus:border-indigo-500/50 transition-colors placeholder-zinc-600"
                    placeholder="my-project.appspot.com"
                    value={firebaseConfig.storageBucket || ''}
                    onChange={(e) => setFirebaseConfigState({ ...firebaseConfig, storageBucket: e.target.value })}
                  />
                </div>

                <div>
                  <label className="block text-[10px] font-bold tracking-wider uppercase text-zinc-500 mb-2">App ID (appId, необязательно):</label>
                  <input
                    type="text"
                    className="w-full bg-black/60 border border-white/10 rounded-xl px-4 py-2.5 text-xs font-mono text-white focus:outline-none focus:border-indigo-500/50 transition-colors placeholder-zinc-600"
                    placeholder="1:12345:web:abcde"
                    value={firebaseConfig.appId || ''}
                    onChange={(e) => setFirebaseConfigState({ ...firebaseConfig, appId: e.target.value })}
                  />
                </div>

                <div className="md:col-span-2 mt-2 pt-4 border-t border-white/5">
                  <label className="block text-[10px] font-bold tracking-wider uppercase text-amber-500/80 mb-2">
                    🔥 Альтернативная загрузка фото (ImgBB API Key, необязательно)
                  </label>
                  <p className="text-[10px] text-zinc-500 mb-3 leading-relaxed">
                    Если в Firebase Storage требуется платный тариф (Blaze), вы можете бесплатно загружать фото через <a href="https://api.imgbb.com/" target="_blank" rel="noreferrer" className="text-indigo-400 hover:underline">ImgBB API</a>. Вставьте API ключ ниже, и он будет использоваться вместо Firebase Storage.
                  </p>
                  <input
                    type="text"
                    className="w-full bg-black/60 border border-amber-500/20 rounded-xl px-4 py-2.5 text-xs font-mono text-white focus:outline-none focus:border-amber-500/50 transition-colors placeholder-zinc-600"
                    placeholder="Ваш ImgBB API Key (например: 7a8b9c...)"
                    value={firebaseConfig.imgbbApiKey || ''}
                    onChange={(e) => setFirebaseConfigState({ ...firebaseConfig, imgbbApiKey: e.target.value })}
                  />
                </div>
              </div>
            </div>
          )}

          {/* TAB 2: Supabase Postgres */}
          {activeTab === 'supabase' && (
            <div className="space-y-6">
              <div className="flex flex-col gap-4">
                <div>
                  <label className="block text-[10px] font-bold tracking-wider uppercase text-zinc-500 mb-2">Supabase Project URL:</label>
                  <input
                    type="text"
                    className="w-full bg-black/60 border border-white/10 rounded-xl px-4 py-2.5 text-xs font-mono text-white focus:outline-none focus:border-indigo-500/50 transition-colors placeholder-zinc-600"
                    placeholder="https://xyzxyz.supabase.co"
                    value={url}
                    onChange={(e) => setUrl(e.target.value)}
                  />
                </div>

                <div>
                  <label className="block text-[10px] font-bold tracking-wider uppercase text-zinc-500 mb-2">Supabase Anon Public API Key:</label>
                  <input
                    type="password"
                    className="w-full bg-black/60 border border-white/10 rounded-xl px-4 py-2.5 text-xs font-mono text-white focus:outline-none focus:border-indigo-500/50 transition-colors placeholder-zinc-600"
                    placeholder="eyJhbGciOiJIUzI1NiIsInR5cCI6..."
                    value={key}
                    onChange={(e) => setKey(e.target.value)}
                  />
                </div>
              </div>

              {/* RLS / Sharing Guidance */}
              <div className="p-4 bg-indigo-500/10 border border-indigo-500/20 rounded-xl">
                <p className="text-xs text-indigo-200/80 leading-relaxed font-medium mb-2">
                  💡 <strong className="text-indigo-300">База данных настраивается прямо здесь, без <code>.env</code>!</strong><br />
                  Вам не нужно создавать файлы конфигурации на вашем сервере (VPS). Просто введите ключи сюда, нажмите «Сохранить» и поделитесь ссылкой с коллегами.
                </p>
                <p className="text-xs text-indigo-200/80 leading-relaxed font-medium">
                  <em>Важно:</em> В Supabase → <strong>Table Editor → bills → RLS</strong> отключите политики (или добавьте политику: <code className="bg-black/60 border border-white/5 rounded p-0.5 text-indigo-400">allow all for anon</code>), чтобы другие пользователи могли читать и писать данные.
                </p>
              </div>
            </div>
          )}

          {/* DIAGNOSTIC RESULT BOX */}
          <AnimatePresence>
            {testResult && (
              <motion.div 
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: 'auto' }}
                exit={{ opacity: 0, height: 0 }}
                className={cn(
                  "mt-6 p-4 rounded-xl border flex flex-col gap-2 overflow-hidden",
                  testResult.success ? "bg-emerald-500/10 border-emerald-500/20" : "bg-rose-500/10 border-rose-500/20"
                )}
              >
                <div className={cn(
                  "flex items-center gap-2 text-sm font-bold",
                  testResult.success ? "text-emerald-400" : "text-rose-400"
                )}>
                  {testResult.success ? <CheckCircle2 size={16} /> : <AlertTriangle size={16} />}
                  {testResult.message}
                </div>
                {testResult.details && (
                  <div className="text-xs font-mono text-zinc-400 leading-relaxed">
                    {testResult.details}
                  </div>
                )}
              </motion.div>
            )}
          </AnimatePresence>

          {/* ACTION BUTTONS: TEST CONNECTION & SHAREABLE LINK */}
          <div className="flex flex-col sm:flex-row gap-3 mt-6">
            <button
              onClick={activeTab === 'firebase' ? handleTestFirebase : handleTestSupabase}
              disabled={isTesting}
              className="flex-1 flex justify-center items-center gap-2 py-2.5 bg-white/[0.04] hover:bg-white/[0.08] text-white text-xs font-bold rounded-xl border border-white/10 transition-colors disabled:opacity-50"
            >
              {isTesting ? <RefreshCw size={14} className="animate-spin" /> : <ShieldAlert size={14} />}
              {isTesting ? 'Проверка...' : '🧪 Проверить подключение'}
            </button>

            <button
              onClick={handleCopyShareableLink}
              className="flex-1 flex justify-center items-center gap-2 py-2.5 bg-white/[0.04] hover:bg-white/[0.08] text-white text-xs font-bold rounded-xl border border-white/10 transition-colors"
            >
              {copiedLink ? <Check size={14} className="text-emerald-400" /> : <Copy size={14} />}
              {copiedLink ? '✓ Ссылка скопирована!' : '🔗 Ссылка для коллег'}
            </button>
          </div>

        </div>

        <div className="p-5 border-t border-white/10 bg-white/[0.02] flex items-center justify-between gap-4">
          <div className="flex gap-4">
            <button 
              onClick={onClose} 
              className="px-6 py-2.5 bg-transparent hover:bg-white/5 text-zinc-400 hover:text-white text-sm font-bold rounded-xl transition-colors"
            >
              Отмена
            </button>
            <button 
              onClick={handleDisconnect}
              className="px-6 py-2.5 bg-rose-500/10 hover:bg-rose-500/20 text-rose-400 text-sm font-bold rounded-xl border border-rose-500/20 transition-colors"
            >
              Отключить базу
            </button>
          </div>
          <button 
            onClick={activeTab === 'firebase' ? handleSaveFirebase : handleSaveSupabase} 
            className="px-6 py-2.5 bg-indigo-600 hover:bg-indigo-500 text-white text-sm font-extrabold rounded-xl shadow-lg shadow-indigo-500/20 border border-indigo-400/30 active:scale-95 transition-all"
          >
            Сохранить и Подключить
          </button>
        </div>

      </motion.div>
    </div>
  );
};
