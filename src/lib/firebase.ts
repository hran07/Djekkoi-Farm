import {
  initializeApp,
  getApps,
  getApp,
} from 'firebase/app';
import { getFirestore, enableNetwork, disableNetwork } from 'firebase/firestore';
import {
  initializeAuth,
  getAuth,
  Auth,
  // @ts-ignore
  getReactNativePersistence,
} from 'firebase/auth';
import { secureStoragePersistence } from './secureStoragePersistence';

const firebaseConfig = {
  apiKey: "AIzaSyB28PpZMR8egA1FyjEvlAKvYlUbvat5KOI",
  authDomain: "djekkoi-farm.firebaseapp.com",
  projectId: "djekkoi-farm",
  storageBucket: "djekkoi-farm.firebasestorage.app",
  messagingSenderId: "354691461632",
  appId: "1:354691461632:web:af1110c578f10b9b3c9ee5",
  measurementId: "G-R3EDBQD9TE"
};

const app = getApps().length === 0 ? initializeApp(firebaseConfig) : getApp();
export const db = getFirestore(app);

let reconnectPromise: Promise<void> | null = null;

export async function forceFirestoreReconnect(): Promise<void> {
  if (reconnectPromise) {
    return reconnectPromise;
  }

  reconnectPromise = (async () => {
    try {
      console.log('[Firestore] Reconnecting: disableNetwork -> enableNetwork...');
      await disableNetwork(db);
      await enableNetwork(db);
      console.log('[Firestore] Reconnect successful, network enabled');
    } catch (e) {
      console.warn('[Firestore] forceFirestoreReconnect error:', e);
    } finally {
      reconnectPromise = null;
    }
  })();

  return reconnectPromise;
}

let authInstance: Auth;
try {
  authInstance = initializeAuth(app, {
    persistence: getReactNativePersistence(secureStoragePersistence),
  });
} catch {
  authInstance = getAuth(app);
}

export const auth = authInstance;

