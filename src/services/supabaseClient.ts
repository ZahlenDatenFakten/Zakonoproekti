import { createClient, SupabaseClient } from '@supabase/supabase-js';
import type { DbConfig } from '../types/bill';

const CONFIG_KEY = 'legaldraft_db_config';

/**
 * Reads Supabase config.
 * Priority:
 *   1. Vite build-time environment variables (VITE_SUPABASE_URL, VITE_SUPABASE_ANON_KEY)
 *      — these are baked into every user's bundle, so ALL users connect automatically.
 *   2. Admin-entered values saved in localStorage (via DbConfigModal).
 *
 * isConnected is derived purely from whether a valid URL + key exist.
 * The stored `isConnected` flag is ignored to prevent a mismatch where
 * User A saved the config but User B's localStorage has no entry.
 */
export function getStoredDbConfig(): DbConfig {
  const envUrl = (import.meta.env.VITE_SUPABASE_URL || '').trim();
  const envKey = (import.meta.env.VITE_SUPABASE_ANON_KEY || '').trim();

  // If env vars are set (e.g. deployed on Vercel with env configured), always use them.
  if (envUrl && envKey) {
    return {
      supabaseUrl: envUrl,
      supabaseAnonKey: envKey,
      isConnected: true
    };
  }

  // Fall back to admin-configured values stored in localStorage.
  const saved = localStorage.getItem(CONFIG_KEY);
  if (saved) {
    try {
      const parsed = JSON.parse(saved);
      if (parsed && typeof parsed === 'object') {
        const url = (parsed.supabaseUrl || '').trim();
        const key = (parsed.supabaseAnonKey || '').trim();
        // Derive connection status purely from key presence — ignore the stored flag.
        return {
          supabaseUrl: url,
          supabaseAnonKey: key,
          isConnected: Boolean(url && key)
        };
      }
    } catch {
      // fallback
    }
  }

  return {
    supabaseUrl: '',
    supabaseAnonKey: '',
    isConnected: false
  };
}

export function saveDbConfig(config: DbConfig) {
  localStorage.setItem(CONFIG_KEY, JSON.stringify(config));
}

let supabaseInstance: SupabaseClient | null = null;

export function getSupabaseClient(customConfig?: DbConfig): SupabaseClient | null {
  const config = customConfig || getStoredDbConfig();
  if (config.supabaseUrl && config.supabaseAnonKey) {
    if (!supabaseInstance || customConfig) {
      try {
        const client = createClient(config.supabaseUrl, config.supabaseAnonKey);
        if (!customConfig) supabaseInstance = client;
        return client;
      } catch (err) {
        console.error('Failed to initialize Supabase client:', err);
        return null;
      }
    }
    return supabaseInstance;
  }
  return null;
}

export function resetSupabaseClient() {
  supabaseInstance = null;
}

export async function testSupabaseConnection(customConfig?: DbConfig): Promise<{ success: boolean; message: string; details?: string }> {
  const config = customConfig || getStoredDbConfig();
  if (!config.supabaseUrl || !config.supabaseAnonKey) {
    return {
      success: false,
      message: 'Не заполнены URL или Anon Key проекта Supabase.',
      details: 'Скопируйте Project URL и anon/public ключ из настроек Supabase → API.'
    };
  }

  try {
    const client = createClient(config.supabaseUrl, config.supabaseAnonKey);
    const { error } = await client.from('bills').select('id').limit(1);

    if (error) {
      if (error.code === '42P01' || error.message?.includes('does not exist')) {
        return {
          success: false,
          message: 'Таблица "bills" не найдена в Supabase.',
          details: 'Откройте SQL Editor в Supabase и выполните скрипт schema.sql для создания таблиц.'
        };
      }
      if (error.code === 'PGRST301' || error.message?.includes('row-level security') || error.message?.includes('policy')) {
        return {
          success: false,
          message: 'Блокировка Row Level Security (RLS).',
          details: 'В Supabase → Table Editor → bills → RLS отключите политики или добавьте политику: allow all for anon.'
        };
      }
      return {
        success: false,
        message: 'Ошибка при запросе к Supabase.',
        details: error.message
      };
    }

    return {
      success: true,
      message: 'Связь с базой данных Supabase PostgreSQL установлена успешно!'
    };
  } catch (err: any) {
    return {
      success: false,
      message: 'Ошибка инициализации клиента Supabase.',
      details: err?.message || String(err)
    };
  }
}
