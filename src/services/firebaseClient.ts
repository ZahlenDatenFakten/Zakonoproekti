import { initializeApp, getApps, getApp } from 'firebase/app';
import { getFirestore, collection, doc, setDoc, getDocs, deleteDoc } from 'firebase/firestore';
import { getDatabase, ref, set, get, remove } from 'firebase/database';
import type { Bill } from '../types/bill';
import type { StateLaw } from '../data/stateLaws';

export interface FirebaseConfig {
  apiKey: string;
  authDomain: string;
  projectId: string;
  databaseURL?: string;
  storageBucket?: string;
  messagingSenderId?: string;
  appId?: string;
  isConnected: boolean;
}

const FIREBASE_CONFIG_KEY = 'legaldraft_firebase_config_v1';

export function getStoredFirebaseConfig(): FirebaseConfig {
  const saved = localStorage.getItem(FIREBASE_CONFIG_KEY);
  if (saved) {
    try {
      return JSON.parse(saved);
    } catch {
      // ignore
    }
  }
  return {
    apiKey: '',
    authDomain: '',
    projectId: '',
    databaseURL: '',
    storageBucket: '',
    messagingSenderId: '',
    appId: '',
    isConnected: false
  };
}

export function saveFirebaseConfig(config: FirebaseConfig): void {
  localStorage.setItem(FIREBASE_CONFIG_KEY, JSON.stringify(config));
}

export function getFirebaseApp() {
  const config = getStoredFirebaseConfig();
  if (!config.isConnected || !config.apiKey || (!config.projectId && !config.databaseURL)) {
    return null;
  }

  try {
    return !getApps().length
      ? initializeApp({
          apiKey: config.apiKey,
          authDomain: config.authDomain,
          projectId: config.projectId,
          databaseURL: config.databaseURL,
          storageBucket: config.storageBucket,
          messagingSenderId: config.messagingSenderId,
          appId: config.appId
        })
      : getApp();
  } catch (err) {
    console.warn('Firebase init error:', err);
    return null;
  }
}

// Support both Realtime Database & Cloud Firestore
export async function saveBillToFirebase(bill: Bill): Promise<boolean> {
  const app = getFirebaseApp();
  if (!app) return false;

  const updatedBill: Bill = {
    ...bill,
    updatedAt: new Date().toISOString()
  };

  let savedSuccess = false;

  // 1. Save to Cloud Firestore
  try {
    const firestore = getFirestore(app);
    if (firestore) {
      const docRef = doc(firestore, 'bills', bill.id);
      await setDoc(docRef, updatedBill, { merge: true });
      savedSuccess = true;
    }
  } catch (err) {
    console.warn('Firebase Firestore save error:', err);
  }

  // 2. Save to Realtime Database if databaseURL is configured
  try {
    const config = getStoredFirebaseConfig();
    if (config.databaseURL) {
      const rtdb = getDatabase(app);
      if (rtdb) {
        const billRef = ref(rtdb, 'bills/' + bill.id);
        await set(billRef, updatedBill);
        savedSuccess = true;
      }
    }
  } catch (err) {
    console.warn('Firebase RealtimeDB save error:', err);
  }

  return savedSuccess;
}

export async function fetchBillsFromFirebase(): Promise<Bill[] | null> {
  const app = getFirebaseApp();
  if (!app) return null;

  const fetchedMap = new Map<string, Bill>();

  // 1. Try Cloud Firestore (without orderBy to avoid requiring custom Firestore indexes)
  try {
    const firestore = getFirestore(app);
    if (firestore) {
      const snapshot = await getDocs(collection(firestore, 'bills'));
      snapshot.forEach((docSnap) => {
        const data = docSnap.data() as Bill;
        if (data && data.id) {
          fetchedMap.set(data.id, data);
        }
      });
    }
  } catch (err) {
    console.warn('Firebase Firestore fetch error:', err);
  }

  // 2. Try Realtime Database if databaseURL is configured
  try {
    const config = getStoredFirebaseConfig();
    if (config.databaseURL) {
      const rtdb = getDatabase(app);
      if (rtdb) {
        const billsRef = ref(rtdb, 'bills');
        const snapshot = await get(billsRef);
        if (snapshot.exists()) {
          const val = snapshot.val();
          const list: Bill[] = Object.values(val);
          list.forEach((item) => {
            if (item && item.id) {
              const existing = fetchedMap.get(item.id);
              if (!existing || new Date(item.updatedAt).getTime() >= new Date(existing.updatedAt).getTime()) {
                fetchedMap.set(item.id, item);
              }
            }
          });
        }
      }
    }
  } catch (err) {
    console.warn('Firebase RealtimeDB fetch error:', err);
  }

  if (fetchedMap.size > 0) {
    const billsList = Array.from(fetchedMap.values());
    return billsList.sort((a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime());
  }

  return null;
}

export async function deleteBillFromFirebase(billId: string): Promise<boolean> {
  const app = getFirebaseApp();
  if (!app) return false;

  try {
    const rtdb = getDatabase(app);
    if (rtdb) {
      await remove(ref(rtdb, 'bills/' + billId));
    }
  } catch {
    // ignore
  }

  try {
    const firestore = getFirestore(app);
    if (firestore) {
      await deleteDoc(doc(firestore, 'bills', billId));
    }
  } catch {
    // ignore
  }

  return true;
}

// State Laws Operations
export async function saveStateLawToFirebase(law: StateLaw): Promise<boolean> {
  const app = getFirebaseApp();
  if (!app) return false;

  try {
    const rtdb = getDatabase(app);
    if (rtdb) {
      await set(ref(rtdb, 'state_laws/' + law.id), law);
      return true;
    }
  } catch {
    // fallback
  }

  try {
    const firestore = getFirestore(app);
    if (firestore) {
      await setDoc(doc(firestore, 'state_laws', law.id), law);
      return true;
    }
  } catch {
    // fallback
  }

  return false;
}

export async function fetchStateLawsFromFirebase(): Promise<StateLaw[] | null> {
  const app = getFirebaseApp();
  if (!app) return null;

  try {
    const rtdb = getDatabase(app);
    if (rtdb) {
      const snapshot = await get(ref(rtdb, 'state_laws'));
      if (snapshot.exists()) {
        return Object.values(snapshot.val());
      }
    }
  } catch {
    // fallback
  }

  try {
    const firestore = getFirestore(app);
    if (firestore) {
      const snapshot = await getDocs(collection(firestore, 'state_laws'));
      const laws: StateLaw[] = [];
      snapshot.forEach((docSnap) => {
        laws.push(docSnap.data() as StateLaw);
      });
      return laws;
    }
  } catch {
    // fallback
  }

  return null;
}
