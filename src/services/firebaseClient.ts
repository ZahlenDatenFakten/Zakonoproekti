import { initializeApp, getApps } from 'firebase/app';
import { getFirestore, collection, doc, setDoc, getDocs, deleteDoc, onSnapshot, getDoc } from 'firebase/firestore';
import { getDatabase, ref, set, get, remove, onValue } from 'firebase/database';
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
  const envApiKey = (import.meta.env.VITE_FIREBASE_API_KEY || '').trim();
  const envProjectId = (import.meta.env.VITE_FIREBASE_PROJECT_ID || '').trim();
  const envAuthDomain = (import.meta.env.VITE_FIREBASE_AUTH_DOMAIN || '').trim();
  const envDbUrl = (import.meta.env.VITE_FIREBASE_DATABASE_URL || '').trim();
  const envBucket = (import.meta.env.VITE_FIREBASE_STORAGE_BUCKET || '').trim();
  const envSenderId = (import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID || '').trim();
  const envAppId = (import.meta.env.VITE_FIREBASE_APP_ID || '').trim();

  // 1. Priority to ENV variables
  if (envApiKey && envProjectId) {
    return {
      apiKey: envApiKey,
      authDomain: envAuthDomain,
      projectId: envProjectId,
      databaseURL: envDbUrl,
      storageBucket: envBucket,
      messagingSenderId: envSenderId,
      appId: envAppId,
      isConnected: true
    };
  }

  // 2. Fallback to localStorage
  const saved = localStorage.getItem(FIREBASE_CONFIG_KEY);
  if (saved) {
    try {
      const parsed = JSON.parse(saved);
      if (parsed && typeof parsed === 'object') {
        const apiKey = (parsed.apiKey || '').trim();
        const projectId = (parsed.projectId || '').trim();
        return {
          apiKey,
          authDomain: (parsed.authDomain || '').trim(),
          projectId,
          databaseURL: (parsed.databaseURL || '').trim(),
          storageBucket: (parsed.storageBucket || '').trim(),
          messagingSenderId: (parsed.messagingSenderId || '').trim(),
          appId: (parsed.appId || '').trim(),
          isConnected: parsed.isConnected !== undefined ? parsed.isConnected : Boolean(apiKey && projectId)
        };
      }
    } catch {
      // ignore
    }
  }

  // 3. Fallback to empty config
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

export function getFirebaseApp(customConfig?: FirebaseConfig) {
  const config = customConfig || getStoredFirebaseConfig();
  if (!config.isConnected || !config.apiKey || (!config.projectId && !config.databaseURL)) {
    return null;
  }

  try {
    const existingApps = getApps();
    if (existingApps.length > 0) {
      return existingApps[0];
    }
    return initializeApp({
      apiKey: config.apiKey,
      authDomain: config.authDomain,
      projectId: config.projectId,
      databaseURL: config.databaseURL,
      storageBucket: config.storageBucket,
      messagingSenderId: config.messagingSenderId,
      appId: config.appId
    });
  } catch (err) {
    console.warn('Firebase init error:', err);
    return null;
  }
}

/**
 * Diagnostic test tool to verify Firebase credentials, connectivity, and Read/Write rules
 */
export async function testFirebaseConnection(customConfig?: FirebaseConfig): Promise<{ success: boolean; message: string; details?: string }> {
  const config = customConfig || getStoredFirebaseConfig();
  if (!config.apiKey || (!config.projectId && !config.databaseURL)) {
    return {
      success: false,
      message: 'Не заполнены обязательные поля (API Key и Project ID).',
      details: 'Скопируйте конфигурацию из Firebase Console -> Project Settings.'
    };
  }

  try {
    const app = getFirebaseApp({ ...config, isConnected: true });
    if (!app) {
      return { success: false, message: 'Не удалось инициализировать Firebase SDK.' };
    }

    let writePassed = false;
    let readPassed = false;

    // Test Firestore
    if (config.projectId) {
      const firestore = getFirestore(app);
      const testDocRef = doc(firestore, '_system_health', 'ping_' + Date.now());
      await setDoc(testDocRef, { timestamp: new Date().toISOString(), test: true });
      writePassed = true;

      const snap = await getDoc(testDocRef);
      if (snap.exists()) {
        readPassed = true;
      }
      try {
        await deleteDoc(testDocRef);
      } catch {}
    }

    // Test Realtime Database if configured
    if (config.databaseURL) {
      const rtdb = getDatabase(app);
      const testRef = ref(rtdb, '_system_health/ping');
      await set(testRef, { timestamp: new Date().toISOString(), test: true });
      writePassed = true;
      const snap = await get(testRef);
      if (snap.exists()) {
        readPassed = true;
      }
    }

    if (writePassed || readPassed) {
      return {
        success: true,
        message: 'Соединение установлено! Запись и чтение работают штатно.'
      };
    }

    return {
      success: false,
      message: 'База данных не ответила на проверочный запрос.'
    };
  } catch (err: any) {
    const errStr = err?.message || String(err);
    if (errStr.includes('permission-denied') || errStr.includes('Missing or insufficient permissions')) {
      return {
        success: false,
        message: 'Ошибка прав доступа (Permission Denied).',
        details: 'В консоли Firebase перейдите в Firestore Database -> вкладка Rules и установите: allow read, write: if true; (после чего нажмите Publish).'
      };
    }
    if (errStr.includes('invalid-api-key') || errStr.includes('API key not valid')) {
      return {
        success: false,
        message: 'Неверный API Key.',
        details: 'Проверьте правильность строки apiKey.'
      };
    }
    return {
      success: false,
      message: 'Ошибка при проверке соединения.',
      details: errStr
    };
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
  } catch (err: any) {
    console.warn('Firebase Firestore save error:', err);
    if (err?.message?.includes('permission') || err?.code?.includes('permission')) {
      throw new Error('Firebase Firestore: Отказано в доступе (Permission Denied). Установите правила "allow read, write: if true;"');
    }
    throw new Error(`Firebase Firestore ошибка: ${err?.message || 'Неизвестная ошибка'}`);
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
  } catch (err: any) {
    console.warn('Firebase RealtimeDB save error:', err);
    if (err?.message?.includes('permission') || err?.code?.includes('permission') || err?.message?.includes('denied')) {
      throw new Error('Firebase Realtime DB: Отказано в доступе (Permission Denied). Установите ".read": true, ".write": true в правилах.');
    }
    throw new Error(`Firebase Realtime DB ошибка: ${err?.message || 'Неизвестная ошибка'}`);
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

/**
 * Realtime Live Listener for Firebase Firestore & Realtime DB
 * Automatically notifies when any user creates, modifies, or deletes a bill
 */
export function subscribeToFirebaseBills(callback: (bills: Bill[]) => void): (() => void) | null {
  const app = getFirebaseApp();
  if (!app) return null;

  const unsubscribers: Array<() => void> = [];

  // 1. Firestore Realtime Snapshot
  try {
    const firestore = getFirestore(app);
    if (firestore) {
      const unsubFirestore = onSnapshot(
        collection(firestore, 'bills'),
        (snapshot) => {
          const list: Bill[] = [];
          snapshot.forEach((docSnap) => {
            const data = docSnap.data() as Bill;
            if (data && data.id) {
              list.push(data);
            }
          });
          if (list.length > 0) {
            callback(list.sort((a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime()));
          }
        },
        (err) => {
          console.warn('Firestore snapshot listener error:', err);
        }
      );
      unsubscribers.push(unsubFirestore);
    }
  } catch (err) {
    console.warn('Firestore listener setup error:', err);
  }

  // 2. Realtime DB Snapshot if configured
  try {
    const config = getStoredFirebaseConfig();
    if (config.databaseURL) {
      const rtdb = getDatabase(app);
      if (rtdb) {
        const billsRef = ref(rtdb, 'bills');
        const unsubRtdb = onValue(
          billsRef,
          (snapshot) => {
            if (snapshot.exists()) {
              const val = snapshot.val();
              const list: Bill[] = Object.values(val);
              if (list.length > 0) {
                callback(list.sort((a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime()));
              }
            }
          },
          (err) => {
            console.warn('RealtimeDB listener error:', err);
          }
        );
        unsubscribers.push(unsubRtdb);
      }
    }
  } catch (err) {
    console.warn('RealtimeDB listener setup error:', err);
  }

  if (unsubscribers.length === 0) return null;

  return () => {
    unsubscribers.forEach((unsub) => {
      try {
        unsub();
      } catch {}
    });
  };
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
