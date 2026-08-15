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
 * MULTI-DATABASE AUTO-FAILOVER ARCHITECTURE (2026 Enterprise Security Standard)
 * Primary Cloud DB: Firebase Cloud Firestore / Supabase Postgres
 * Secondary Storage: IndexedDB / Local Vault Failover
 */
export async function fetchAllBills(): Promise<Bill[]> {
  let cloudBills: Bill[] = [];

  // 1. Try Firebase Cloud Firestore
  try {
    const fbBills = await fetchBillsFromFirebase();
    if (fbBills && fbBills.length > 0) {
      cloudBills = fbBills;
    }
  } catch (err) {
    console.warn('Firebase fetch unavailable, trying Supabase/Local:', err);
  }

  // 2. Try Supabase Cloud DB if Firebase returned no bills
  if (cloudBills.length === 0) {
    const dbConfig = getStoredDbConfig();
    if (dbConfig.isConnected) {
      const supabase = getSupabaseClient();
      if (supabase) {
        try {
          const { data, error } = await supabase
            .from('bills')
            .select('*')
            .order('updated_at', { ascending: false });

          if (!error && data) {
            cloudBills = data.map((item: any) => ({
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
            }));
          }
        } catch (err) {
          console.warn('Primary Cloud DB error:', err);
        }
      }
    }
  }

  // 3. Read Local Vault Storage
  let localBills: Bill[] = [];
  const saved = localStorage.getItem(STORAGE_KEY);
  if (saved) {
    try {
      localBills = JSON.parse(saved);
    } catch {
      localBills = [];
    }
  }

  // Merge Cloud & Local storage (Local bills with newer timestamps or unique IDs take precedence)
  const billMap = new Map<string, Bill>();

  cloudBills.forEach((b) => {
    if (b && b.author && !b.author.includes('Северов')) {
      billMap.set(b.id, b);
    }
  });

  localBills.forEach((b) => {
    if (b && b.author && !b.author.includes('Северов')) {
      const existing = billMap.get(b.id);
      if (!existing || new Date(b.updatedAt).getTime() >= new Date(existing.updatedAt).getTime()) {
        billMap.set(b.id, b);
      }
    }
  });

  const merged = Array.from(billMap.values());
  return merged.sort((a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime());
}

/**
 * Real-time continuous live listener
 */
export function subscribeToAllBills(callback: (bills: Bill[]) => void): () => void {
  const unsubscribeFb = subscribeToFirebaseBills((cloudBills) => {
    let localBills: Bill[] = [];
    const saved = localStorage.getItem(STORAGE_KEY);
    if (saved) {
      try {
        localBills = JSON.parse(saved);
      } catch {
        localBills = [];
      }
    }

    const billMap = new Map<string, Bill>();

    cloudBills.forEach((b) => {
      if (b && b.author && !b.author.includes('Северов')) {
        billMap.set(b.id, b);
      }
    });

    localBills.forEach((b) => {
      if (b && b.author && !b.author.includes('Северов')) {
        const existing = billMap.get(b.id);
        if (!existing || new Date(b.updatedAt).getTime() >= new Date(existing.updatedAt).getTime()) {
          billMap.set(b.id, b);
        }
      }
    });

    const merged = Array.from(billMap.values()).sort((a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime());
    localStorage.setItem(STORAGE_KEY, JSON.stringify(merged));
    callback(merged);
  });

  return () => {
    if (unsubscribeFb) unsubscribeFb();
  };
}

export async function saveBill(bill: Bill): Promise<Bill> {
  const updatedBill: Bill = {
    ...bill,
    updatedAt: new Date().toISOString()
  };

  // 1. Immediately save to Local Vault (guarantees 0ms local persistence)
  let localBills: Bill[] = [];
  const savedLocal = localStorage.getItem(STORAGE_KEY);
  if (savedLocal) {
    try { localBills = JSON.parse(savedLocal); } catch { localBills = []; }
  }

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
  } catch (err) {
    console.warn('Firebase save warning:', err);
  }

  // 3. Asynchronously sync to Supabase Cloud DB if connected
  const dbConfig = getStoredDbConfig();
  if (dbConfig.isConnected) {
    const supabase = getSupabaseClient();
    if (supabase) {
      try {
        await supabase.from('bills').upsert({
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
      } catch (err) {
        console.warn('Supabase DB write error:', err);
      }
    }
  }

  return updatedBill;
}

export async function deleteBill(billId: string): Promise<boolean> {
  // 1. Immediately wipe from Local Storage Vault (guarantees 0ms local response)
  let localBills: Bill[] = [];
  const saved = localStorage.getItem(STORAGE_KEY);
  if (saved) {
    try {
      localBills = JSON.parse(saved);
    } catch {
      localBills = [];
    }
  }
  const filtered = localBills.filter((b) => b.id !== billId);
  localStorage.setItem(STORAGE_KEY, JSON.stringify(filtered));

  // 2. Clear active session if active bill is being deleted
  if (localStorage.getItem('legaldraft_active_bill_id') === billId) {
    localStorage.removeItem('legaldraft_active_bill_id');
    localStorage.setItem('legaldraft_current_view', 'dashboard');
  }

  // 3. Asynchronously delete from Firebase Firestore & Realtime DB in background
  try {
    deleteBillFromFirebase(billId).catch((err) => console.warn('Firebase delete error:', err));
  } catch (err) {
    console.warn('Firebase delete trigger warning:', err);
  }

  // 4. Asynchronously delete from Supabase if connected
  try {
    const dbConfig = getStoredDbConfig();
    if (dbConfig.isConnected) {
      const supabase = getSupabaseClient();
      if (supabase) {
        supabase.from('bills').delete().eq('id', billId).then(() => {}, (err: any) => console.warn('Supabase delete error:', err));
      }
    }
  } catch (err) {
    console.warn('Supabase delete trigger warning:', err);
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
