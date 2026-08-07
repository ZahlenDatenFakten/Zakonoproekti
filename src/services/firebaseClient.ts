import { initializeApp, getApps, getApp } from 'firebase/app';
import { getFirestore, collection, doc, setDoc, getDocs, deleteDoc, query, orderBy } from 'firebase/firestore';
import type { Bill } from '../types/bill';
import type { StateLaw } from '../data/stateLaws';

export interface FirebaseConfig {
  apiKey: string;
  authDomain: string;
  projectId: string;
  storageBucket: string;
  messagingSenderId: string;
  appId: string;
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
    storageBucket: '',
    messagingSenderId: '',
    appId: '',
    isConnected: false
  };
}

export function saveFirebaseConfig(config: FirebaseConfig): void {
  localStorage.setItem(FIREBASE_CONFIG_KEY, JSON.stringify(config));
}

export function getFirebaseFirestore() {
  const config = getStoredFirebaseConfig();
  if (!config.isConnected || !config.apiKey || !config.projectId) {
    return null;
  }

  try {
    const app = !getApps().length
      ? initializeApp({
          apiKey: config.apiKey,
          authDomain: config.authDomain,
          projectId: config.projectId,
          storageBucket: config.storageBucket,
          messagingSenderId: config.messagingSenderId,
          appId: config.appId
        })
      : getApp();

    return getFirestore(app);
  } catch (err) {
    console.warn('Firebase init error:', err);
    return null;
  }
}

// Bills Firestore Operations
export async function saveBillToFirebase(bill: Bill): Promise<boolean> {
  const db = getFirebaseFirestore();
  if (!db) return false;

  try {
    const docRef = doc(db, 'bills', bill.id);
    await setDoc(docRef, {
      ...bill,
      updatedAt: new Date().toISOString()
    });
    return true;
  } catch (err) {
    console.warn('Firebase saveBill error:', err);
    return false;
  }
}

export async function fetchBillsFromFirebase(): Promise<Bill[] | null> {
  const db = getFirebaseFirestore();
  if (!db) return null;

  try {
    const q = query(collection(db, 'bills'), orderBy('updatedAt', 'desc'));
    const snapshot = await getDocs(q);
    const bills: Bill[] = [];
    snapshot.forEach((docSnap) => {
      bills.push(docSnap.data() as Bill);
    });
    return bills;
  } catch (err) {
    console.warn('Firebase fetchBills error:', err);
    return null;
  }
}

export async function deleteBillFromFirebase(billId: string): Promise<boolean> {
  const db = getFirebaseFirestore();
  if (!db) return false;

  try {
    await deleteDoc(doc(db, 'bills', billId));
    return true;
  } catch (err) {
    console.warn('Firebase deleteBill error:', err);
    return false;
  }
}

// State Laws Firestore Operations
export async function saveStateLawToFirebase(law: StateLaw): Promise<boolean> {
  const db = getFirebaseFirestore();
  if (!db) return false;

  try {
    const docRef = doc(db, 'state_laws', law.id);
    await setDoc(docRef, law);
    return true;
  } catch (err) {
    console.warn('Firebase saveStateLaw error:', err);
    return false;
  }
}

export async function fetchStateLawsFromFirebase(): Promise<StateLaw[] | null> {
  const db = getFirebaseFirestore();
  if (!db) return null;

  try {
    const snapshot = await getDocs(collection(db, 'state_laws'));
    const laws: StateLaw[] = [];
    snapshot.forEach((docSnap) => {
      laws.push(docSnap.data() as StateLaw);
    });
    return laws;
  } catch (err) {
    console.warn('Firebase fetchStateLaws error:', err);
    return null;
  }
}
