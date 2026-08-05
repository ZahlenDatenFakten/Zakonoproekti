import { createClient, SupabaseClient } from '@supabase/supabase-js';
import type { DbConfig } from '../types/bill';

const CONFIG_KEY = 'legaldraft_db_config';

export function getStoredDbConfig(): DbConfig {
  const saved = localStorage.getItem(CONFIG_KEY);
  if (saved) {
    try {
      return JSON.parse(saved);
    } catch {
      // fallback
    }
  }
  return {
    supabaseUrl: import.meta.env.VITE_SUPABASE_URL || '',
    supabaseAnonKey: import.meta.env.VITE_SUPABASE_ANON_KEY || '',
    isConnected: false
  };
}

export function saveDbConfig(config: DbConfig) {
  localStorage.setItem(CONFIG_KEY, JSON.stringify(config));
}

let supabaseInstance: SupabaseClient | null = null;

export function getSupabaseClient(): SupabaseClient | null {
  const config = getStoredDbConfig();
  if (config.supabaseUrl && config.supabaseAnonKey) {
    if (!supabaseInstance) {
      try {
        supabaseInstance = createClient(config.supabaseUrl, config.supabaseAnonKey);
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
