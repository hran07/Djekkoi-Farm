import React, { createContext, useContext, useEffect, useState } from 'react';
import {
  User,
  onAuthStateChanged,
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  signOut,
  updateProfile,
} from 'firebase/auth';
import { doc, getDoc, setDoc } from 'firebase/firestore';
import { auth, db } from '@/lib/firebase';
import { UserProfile, AppState } from '@/lib/types';

interface AuthContextType {
  user: User | null;
  profile: UserProfile | null;
  isLoading: boolean;
  isAuthenticated: boolean;
  login: (email: string, pass: string) => Promise<void>;
  register: (name: string, email: string, pass: string) => Promise<void>;
  logout: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | null>(null);

export const getAuthErrorMessage = (error: any): string => {
  const code = error?.code || '';
  switch (code) {
    case 'auth/email-already-in-use':
      return 'Email ini sudah terdaftar. Silakan masuk atau gunakan email lain.';
    case 'auth/invalid-email':
      return 'Format email tidak valid.';
    case 'auth/weak-password':
      return 'Kata sandi terlalu singkat (minimal 6 karakter).';
    case 'auth/user-not-found':
      return 'Akun dengan email ini tidak ditemukan.';
    case 'auth/wrong-password':
      return 'Kata sandi salah. Silakan periksa kembali.';
    case 'auth/invalid-credential':
      return 'Email atau kata sandi salah.';
    case 'auth/too-many-requests':
      return 'Terlalu banyak percobaan login gagal. Coba lagi dalam beberapa saat.';
    case 'auth/network-request-failed':
      return 'Gagal terhubung ke server. Periksa koneksi internet Anda.';
    case 'auth/configuration-not-found':
    case 'auth/operation-not-allowed':
      return 'Layanan Authentication belum diaktifkan di Firebase Console. Buka Firebase Console > Build > Authentication > Sign-in method, lalu aktifkan penyedia "Email/Password".';
    default:
      return error?.message || 'Terjadi kesalahan saat autentikasi.';
  }
};

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (currentUser) => {
      setUser(currentUser);
      if (currentUser) {
        try {
          const userDocRef = doc(db, 'users', currentUser.uid);
          const userDoc = await getDoc(userDocRef);
          if (userDoc.exists()) {
            setProfile(userDoc.data() as UserProfile);
          } else {
            const fallbackProfile: UserProfile = {
              uid: currentUser.uid,
              name: currentUser.displayName || currentUser.email?.split('@')[0] || 'User',
              email: currentUser.email || '',
              createdAt: new Date().toISOString(),
            };
            setProfile((prev) => (prev?.uid === currentUser.uid ? prev : fallbackProfile));
            await setDoc(userDocRef, fallbackProfile, { merge: true });
          }
        } catch (err) {
          console.error('Error fetching user profile from Firestore:', err);
        }
      } else {
        setProfile(null);
      }
      setIsLoading(false);
    });

    return () => unsubscribe();
  }, []);

  const login = async (email: string, pass: string): Promise<void> => {
    const credential = await signInWithEmailAndPassword(auth, email.trim(), pass);
    const userDocRef = doc(db, 'users', credential.user.uid);
    const userDoc = await getDoc(userDocRef);
    if (userDoc.exists()) {
      setProfile(userDoc.data() as UserProfile);
    } else {
      const fallbackProfile: UserProfile = {
        uid: credential.user.uid,
        name: credential.user.displayName || credential.user.email?.split('@')[0] || 'User',
        email: credential.user.email || '',
        createdAt: new Date().toISOString(),
      };
      setProfile(fallbackProfile);
      await setDoc(userDocRef, fallbackProfile, { merge: true });
    }
  };

  const register = async (name: string, email: string, pass: string): Promise<void> => {
    const trimmedName = name.trim();
    const trimmedEmail = email.trim();

    const credential = await createUserWithEmailAndPassword(auth, trimmedEmail, pass);
    await updateProfile(credential.user, { displayName: trimmedName });

    const newProfile: UserProfile = {
      uid: credential.user.uid,
      name: trimmedName,
      email: trimmedEmail.toLowerCase(),
      createdAt: new Date().toISOString(),
    };

    setProfile(newProfile);

    // Simpan profil user baru di database Firestore
    await setDoc(doc(db, 'users', credential.user.uid), newProfile);

    // Inisialisasi struktur penyimpanan data ikan terisolasi untuk akun ini
    const initialUserStore: AppState = {
      ponds: [
        { id: 'pond-1', userId: credential.user.uid, name: 'Kolam Utama', lokasi: 'Area Depan' },
        { id: 'pond-2', userId: credential.user.uid, name: 'Kolam Karantina', lokasi: 'Area Karantina' },
      ],
      fish: [],
      history: [],
      varietyHistory: ['Kohaku', 'Taisho Sanke', 'Showa Sanshoku', 'Asagi', 'Shiro Utsuri'],
    };

    // Jika sebelumnya ada data ikan di app_data/main_store sebelum sistem login dibuat,
    // salin data tersebut agar tidak hilang
    try {
      const legacySnap = await getDoc(doc(db, 'app_data', 'main_store'));
      if (legacySnap.exists()) {
        const legacyData = legacySnap.data();
        if (Array.isArray(legacyData.fish) && legacyData.fish.length > 0) {
          initialUserStore.fish = legacyData.fish.map((f: any) => ({ ...f, userId: credential.user.uid }));
        }
        if (Array.isArray(legacyData.ponds) && legacyData.ponds.length > 0) {
          initialUserStore.ponds = legacyData.ponds.map((p: any) => ({ ...p, userId: credential.user.uid }));
        }
        if (Array.isArray(legacyData.history) && legacyData.history.length > 0) {
          initialUserStore.history = legacyData.history.map((h: any) => ({ ...h, userId: credential.user.uid }));
        }
        if (Array.isArray(legacyData.varietyHistory) && legacyData.varietyHistory.length > 0) {
          initialUserStore.varietyHistory = legacyData.varietyHistory;
        }
      }
    } catch {
      // Tidak masalah jika tidak ada dokumen legacy atau permission terbatas
    }

    await setDoc(doc(db, 'user_stores', credential.user.uid), initialUserStore);
  };

  const logout = async (): Promise<void> => {
    await signOut(auth);
    setProfile(null);
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        profile,
        isLoading,
        isAuthenticated: !!user,
        login,
        register,
        logout,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
