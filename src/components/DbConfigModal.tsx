import React, { useState } from 'react';
import type { DbConfig } from '../types/bill';
import { saveDbConfig, resetSupabaseClient } from '../services/supabaseClient';
import { Database, X, Check, Copy, Sparkles, Terminal } from 'lucide-react';

interface DbConfigModalProps {
  config: DbConfig;
  onUpdateConfig: (newConfig: DbConfig) => void;
  onClose: () => void;
}

export const DbConfigModal: React.FC<DbConfigModalProps> = ({ config, onUpdateConfig, onClose }) => {
  const [url, setUrl] = useState(config.supabaseUrl || '');
  const [key, setKey] = useState(config.supabaseAnonKey || '');
  const [copiedSql, setCopiedSql] = useState(false);

  const handleSave = () => {
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

  const handleDisconnect = () => {
    const newConfig: DbConfig = {
      supabaseUrl: '',
      supabaseAnonKey: '',
      isConnected: false
    };
    saveDbConfig(newConfig);
    resetSupabaseClient();
    onUpdateConfig(newConfig);
    setUrl('');
    setKey('');
  };

  const sqlSchemaText = `-- Таблица законопроектов для Supabase / PostgreSQL
CREATE TABLE IF NOT EXISTS public.bills (
    id TEXT PRIMARY KEY,
    title TEXT NOT NULL,
    target_law TEXT NOT NULL,
    law_code TEXT,
    author TEXT NOT NULL,
    author_role TEXT,
    status TEXT NOT NULL DEFAULT 'draft',
    status_reason TEXT,
    explanatory_note TEXT,
    financial_justification TEXT,
    comparisons JSONB NOT NULL DEFAULT '[]'::jsonb,
    share_tokens JSONB NOT NULL DEFAULT '[]'::jsonb,
    comments JSONB NOT NULL DEFAULT '[]'::jsonb,
    view_count INT DEFAULT 0,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);
ALTER TABLE public.bills ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Public Access" ON public.bills FOR ALL USING (true);`;

  const copySql = () => {
    navigator.clipboard.writeText(sqlSchemaText);
    setCopiedSql(true);
    setTimeout(() => setCopiedSql(false), 2500);
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content" onClick={(e) => e.stopPropagation()} style={{ maxWidth: '680px' }}>
        
        {/* Header */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '20px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <div style={{ width: '42px', height: '42px', borderRadius: '50%', background: 'rgba(59, 130, 246, 0.15)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <Database size={22} color="#60a5fa" />
            </div>
            <div>
              <h3 className="title-serif" style={{ color: 'var(--text-gold)', fontSize: '1.25rem' }}>
                Подключение Бесплатной Облачной БД
              </h3>
              <p style={{ fontSize: '0.84rem', color: 'var(--text-muted)' }}>
                Поддержка бесплатной PostgreSQL баз данных (Supabase / Neon / Render)
              </p>
            </div>
          </div>

          <button onClick={onClose} className="btn btn-secondary" style={{ padding: '6px' }}>
            <X size={18} />
          </button>
        </div>

        {/* Current Connection Status */}
        <div style={{ background: config.isConnected ? 'rgba(16, 185, 129, 0.12)' : 'rgba(245, 158, 11, 0.12)', border: config.isConnected ? '1px solid rgba(16, 185, 129, 0.3)' : '1px solid rgba(245, 158, 11, 0.3)', padding: '14px 18px', borderRadius: '12px', marginBottom: '20px', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <Sparkles size={18} color={config.isConnected ? '#34d399' : '#fbbf24'} />
            <div>
              <strong style={{ fontSize: '0.9rem', color: config.isConnected ? '#34d399' : '#fbbf24' }}>
                {config.isConnected ? 'Подключена облачная БД Supabase' : 'Режим автономной локальной БД (IndexedDB)'}
              </strong>
              <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>
                {config.isConnected ? 'Все новые законопроекты синхронизируются в облаке в реальном времени.' : 'Приложение работает локально на вашем ПК. Данные сохраняются в браузере.'}
              </div>
            </div>
          </div>

          {config.isConnected && (
            <button onClick={handleDisconnect} className="btn btn-danger" style={{ fontSize: '0.8rem', padding: '6px 12px' }}>
              Отключить БД
            </button>
          )}
        </div>

        {/* Credentials Form */}
        <div style={{ marginBottom: '24px' }}>
          <label style={{ fontSize: '0.85rem', color: 'var(--text-main)', display: 'block', marginBottom: '6px' }}>
            Supabase / Postgres Project URL:
          </label>
          <input
            type="text"
            className="input-field"
            placeholder="https://xyzxyz.supabase.co"
            value={url}
            onChange={(e) => setUrl(e.target.value)}
            style={{ marginBottom: '14px' }}
          />

          <label style={{ fontSize: '0.85rem', color: 'var(--text-main)', display: 'block', marginBottom: '6px' }}>
            Supabase Anon Public API Key:
          </label>
          <input
            type="password"
            className="input-field"
            placeholder="eyJhbGciOiJIUzI1NiIsInR5cCI6..."
            value={key}
            onChange={(e) => setKey(e.target.value)}
          />
        </div>

        {/* SQL Initializer Preview */}
        <div style={{ background: 'rgba(11, 15, 25, 0.9)', border: '1px solid var(--border-subtle)', borderRadius: '12px', padding: '16px', marginBottom: '24px' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '10px' }}>
            <span style={{ fontSize: '0.85rem', color: 'var(--text-gold)', fontWeight: 600, display: 'flex', alignItems: 'center', gap: '6px' }}>
              <Terminal size={15} /> SQL-скрипт инициализации таблиц (schema.sql)
            </span>
            <button onClick={copySql} className="btn btn-secondary" style={{ fontSize: '0.78rem', padding: '4px 10px' }}>
              {copiedSql ? <Check size={14} color="#34d399" /> : <Copy size={14} />}
              <span>{copiedSql ? 'Скопировано' : 'Скопировать SQL'}</span>
            </button>
          </div>

          <pre style={{ fontSize: '0.76rem', color: '#94a3b8', fontFamily: 'var(--font-mono)', overflowX: 'auto', maxHeight: '120px', margin: 0, whiteSpace: 'pre-wrap' }}>
            {sqlSchemaText}
          </pre>
        </div>

        {/* Footer */}
        <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '12px' }}>
          <button onClick={onClose} className="btn btn-secondary">Отмена</button>
          <button onClick={handleSave} className="btn btn-primary">Сохранить подключение</button>
        </div>
      </div>
    </div>
  );
};
