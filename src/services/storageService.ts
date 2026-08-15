import type { Bill, UserProfile, BillComment } from '../types/bill';
import { INITIAL_USER } from './mockData';
import { getStoredDbConfig, getSupabaseClient } from './supabaseClient';
import { saveBillToFirebase, fetchBillsFromFirebase, deleteBillFromFirebase, subscribeToFirebaseBills } from './firebaseClient';

const STORAGE_KEY = 'legaldraft_bills_v3_clean';
const USER_KEY = 'legaldraft_user_v3';

// Force wipe old legacy keys containing Severov mock bills
(function purgeLegacySeverovCache() {
  const legacyKeys = ['legaldraft_bills', 'legaldraft_bills_v2', 'legaldraft_backup'];
  legacyKeys.forEach((key) => {
    if (localStorage.getItem(key)) {
      localStorage.removeItem(key);
    }
  });
})();

/**
 * Map Supabase DB row → Bill object
 */
function mapSupabaseRow(item: any): Bill {
  return {
    id: item.id,
    title: item.title,
    targetLaw: item.target_law,
    lawCode: item.law_code,
    author: item.author,
    authorRole: item.author_role,
    status: item.status,
    statusReason: item.status_reason,
    explanatoryNote: item.explanatory_note || '',
    comparisons: typeof item.comparisons === 'string' ? JSON.parse(item.comparisons) : item.comparisons || [],
    shareTokens: typeof item.share_tokens === 'string' ? JSON.parse(item.share_tokens) : item.share_tokens || [],
    comments: typeof item.comments === 'string' ? JSON.parse(item.comments) : item.comments || [],
    votes: typeof item.votes === 'string' ? JSON.parse(item.votes) : item.votes || {},
    federalVerdict: typeof item.federal_verdict === 'string' ? JSON.parse(item.federal_verdict) : item.federal_verdict || null,
    sha256Hash: item.sha256_hash,
    createdAt: item.created_at,
    updatedAt: item.updated_at,
    viewCount: item.view_count || 1
  };
}

function isValidBill(b: any): b is Bill {
  if (!b || !b.id || !b.author) return false;
  
  // Ensure critical fields have correct types to prevent UI crashes
  if (typeof b.author !== 'string') b.author = String(b.author);
  if (b.targetLaw && typeof b.targetLaw !== 'string') b.targetLaw = String(b.targetLaw);
  if (b.title && typeof b.title !== 'string') b.title = String(b.title);
  
  if (!Array.isArray(b.comparisons)) b.comparisons = [];
  if (!Array.isArray(b.shareTokens)) b.shareTokens = [];
  if (!Array.isArray(b.comments)) b.comments = [];
  return true;
}

function mergeBills(primary: Bill[], secondary: Bill[]): Bill[] {
  const map = new Map<string, Bill>();
  primary.forEach((b) => { if (isValidBill(b)) map.set(b.id, b); });
  secondary.forEach((b) => {
    if (!isValidBill(b)) return;
    const existing = map.get(b.id);
    if (!existing || new Date(b.updatedAt).getTime() >= new Date(existing.updatedAt).getTime()) {
      map.set(b.id, b);
    }
  });
  return Array.from(map.values()).sort((a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime());
}

async function fetchFromSupabase(): Promise<Bill[]> {
  const dbConfig = getStoredDbConfig();
  if (!dbConfig.isConnected) return [];
  const supabase = getSupabaseClient();
  if (!supabase) return [];
  try {
    const { data, error } = await supabase
      .from('bills')
      .select('*')
      .order('updated_at', { ascending: false });
    if (error) {
      console.warn('Supabase fetch error:', error.message);
      return [];
    }
    return (data || []).map(mapSupabaseRow).filter(isValidBill);
  } catch (err) {
    console.warn('Supabase fetch exception:', err);
    return [];
  }
}

function readLocalBills(): Bill[] {
  const saved = localStorage.getItem(STORAGE_KEY);
  if (!saved) return [];
  try { return JSON.parse(saved); } catch { return []; }
}

/**
 * MULTI-DATABASE AUTO-FAILOVER ARCHITECTURE
 * Reads from Firebase AND Supabase in parallel, then merges with local cache.
 * All users — regardless of their localStorage — get the full shared cloud dataset.
 */
export async function fetchAllBills(): Promise<Bill[]> {
  // Run all cloud fetches in parallel
  const [fbBills, supaBills] = await Promise.allSettled([
    fetchBillsFromFirebase().catch(() => []),
    fetchFromSupabase()
  ]);

  const fromFirebase: Bill[] = fbBills.status === 'fulfilled' ? fbBills.value || [] : [];
  const fromSupabase: Bill[] = supaBills.status === 'fulfilled' ? supaBills.value || [] : [];
  const localBills = readLocalBills();

  // Merge: cloud sources first, then local (local wins on newer timestamp)
  const cloudMerged = mergeBills(fromFirebase, fromSupabase);
  const all = mergeBills(cloudMerged, localBills);

  return all;
}

/**
 * Real-time continuous live listener.
 * Firebase provides websocket events. Supabase is polled as supplement.
 */
export function subscribeToAllBills(callback: (bills: Bill[]) => void): () => void {
  let latestFirebaseBills: Bill[] = [];
  let latestSupaBills: Bill[] = [];

  const pushMerge = () => {
    const localBills = readLocalBills();
    const cloudMerged = mergeBills(latestFirebaseBills, latestSupaBills);
    const all = mergeBills(cloudMerged, localBills);
    // Update local cache with authoritative cloud state
    localStorage.setItem(STORAGE_KEY, JSON.stringify(all));
    callback(all);
  };

  // 1. Firebase real-time listener
  const unsubscribeFb = subscribeToFirebaseBills((cloudBills) => {
    latestFirebaseBills = (cloudBills || []).filter(isValidBill);
    pushMerge();
  });

  // 2. Supabase realtime via polling (Supabase Realtime requires auth config;
  //    polling every 5s is sufficient and works with any anon key setup)
  let supaInterval: ReturnType<typeof setInterval> | null = null;
  const dbConfig = getStoredDbConfig();
  if (dbConfig.isConnected) {
    // Initial fetch
    fetchFromSupabase().then((bills) => {
      latestSupaBills = bills;
      pushMerge();
    });

    supaInterval = setInterval(async () => {
      const bills = await fetchFromSupabase();
      latestSupaBills = bills;
      pushMerge();
    }, 5000);
  }

  return () => {
    if (unsubscribeFb) unsubscribeFb();
    if (supaInterval) clearInterval(supaInterval);
  };
}

export async function saveBill(bill: Bill): Promise<Bill> {
  const updatedBill: Bill = {
    ...bill,
    updatedAt: new Date().toISOString()
  };

  // 1. Immediately save to Local Vault (guarantees 0ms local persistence)
  const localBills = readLocalBills();
  const index = localBills.findIndex((b) => b.id === updatedBill.id);
  if (index >= 0) {
    localBills[index] = updatedBill;
  } else {
    localBills.unshift(updatedBill);
  }
  localStorage.setItem(STORAGE_KEY, JSON.stringify(localBills));

  // 2. Asynchronously sync to Firebase Firestore Cloud
  try {
    await saveBillToFirebase(updatedBill);
  } catch (err: any) {
    console.warn('Firebase save warning:', err);
    throw err; // Re-throw so UI can show the error toast
  }

  // 3. Asynchronously sync to Supabase Cloud DB if connected
  const dbConfig = getStoredDbConfig();
  if (dbConfig.isConnected) {
    const supabase = getSupabaseClient();
    if (supabase) {
      try {
        const { error } = await supabase.from('bills').upsert({
          id: updatedBill.id,
          title: updatedBill.title,
          target_law: updatedBill.targetLaw,
          law_code: updatedBill.lawCode,
          author: updatedBill.author,
          author_role: updatedBill.authorRole,
          status: updatedBill.status,
          status_reason: updatedBill.statusReason,
          explanatory_note: updatedBill.explanatoryNote,
          comparisons: JSON.stringify(updatedBill.comparisons),
          share_tokens: JSON.stringify(updatedBill.shareTokens),
          comments: JSON.stringify(updatedBill.comments),
          votes: JSON.stringify(updatedBill.votes || {}),
          federal_verdict: JSON.stringify(updatedBill.federalVerdict || null),
          sha256_hash: updatedBill.sha256Hash,
          updated_at: updatedBill.updatedAt,
          view_count: updatedBill.viewCount
        });
        if (error) {
          console.warn('Supabase upsert error:', error.message);
        }
      } catch (err) {
        console.warn('Supabase DB write error:', err);
      }
    }
  }

  return updatedBill;
}

export async function deleteBill(billId: string): Promise<boolean> {
  // 1. Immediately wipe from Local Storage Vault
  const localBills = readLocalBills().filter((b) => b.id !== billId);
  localStorage.setItem(STORAGE_KEY, JSON.stringify(localBills));

  // 2. Clear active session if active bill is being deleted
  if (localStorage.getItem('legaldraft_active_bill_id') === billId) {
    localStorage.removeItem('legaldraft_active_bill_id');
    localStorage.setItem('legaldraft_current_view', 'dashboard');
  }

  // 3. Delete from Firebase and await
  try {
    await deleteBillFromFirebase(billId);
  } catch (err) {
    console.warn('Firebase delete error:', err);
  }

  // 4. Delete from Supabase if connected and await
  try {
    const dbConfig = getStoredDbConfig();
    if (dbConfig.isConnected) {
      const supabase = getSupabaseClient();
      if (supabase) {
        const { error } = await supabase.from('bills').delete().eq('id', billId);
        if (error) console.warn('Supabase delete error:', error.message);
      }
    }
  } catch (err) {
    console.warn('Supabase delete error:', err);
  }

  return true;
}

export function getUserProfile(): UserProfile {
  const saved = localStorage.getItem(USER_KEY);
  if (saved) {
    try {
      return JSON.parse(saved);
    } catch {
      // ignore
    }
  }
  return INITIAL_USER;
}

export function saveUserProfile(user: UserProfile): void {
  localStorage.setItem(USER_KEY, JSON.stringify(user));
}

export async function addCommentToBill(billId: string, commentData: Omit<BillComment, 'id' | 'createdAt'>): Promise<BillComment> {
  const bills = await fetchAllBills();
  const targetBill = bills.find((b) => b.id === billId);

  const newComment: BillComment = {
    ...commentData,
    id: 'cm_' + Date.now() + '_' + Math.random().toString(36).substring(2, 5),
    createdAt: new Date().toISOString()
  };

  if (targetBill) {
    const updatedComments = [...(targetBill.comments || []), newComment];
    const updatedBill = { ...targetBill, comments: updatedComments };
    await saveBill(updatedBill);
  }

  return newComment;
}
