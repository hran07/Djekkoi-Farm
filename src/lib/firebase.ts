import { initializeApp, getApps, getApp } from 'firebase/app';
import { getFirestore } from 'firebase/firestore';
import {
  initializeAuth,
  getAuth,
  Auth,
} from 'firebase/auth';
// @ts-expect-error Firebase exports getReactNativePersistence in React Native runtime bundle
import { getReactNativePersistence } from 'firebase/auth';
import AsyncStorage from '@react-native-async-storage/async-storage';

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

let authInstance: Auth;
try {
  authInstance = initializeAuth(app, {
    persistence: getReactNativePersistence(AsyncStorage),
  });
} catch {
  authInstance = getAuth(app);
}

export const auth = authInstance;

