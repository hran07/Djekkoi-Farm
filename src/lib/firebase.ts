import { initializeApp } from 'firebase/app';
import { getFirestore } from 'firebase/firestore';
import { getAuth } from 'firebase/auth';

const firebaseConfig = {
  apiKey: "AIzaSyB28PpZMR8egA1FyjEvlAKvYlUbvat5KOI",
  authDomain: "djekkoi-farm.firebaseapp.com",
  projectId: "djekkoi-farm",
  storageBucket: "djekkoi-farm.firebasestorage.app",
  messagingSenderId: "354691461632",
  appId: "1:354691461632:web:af1110c578f10b9b3c9ee5",
  measurementId: "G-R3EDBQD9TE"
};

const app = initializeApp(firebaseConfig);
export const db = getFirestore(app);
export const auth = getAuth(app);
