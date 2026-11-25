import { auth, db } from "@/lib/firebase";
import { AppState, StoreLocation, UserProfile } from "@/lib/types";
import {
    User,
    createUserWithEmailAndPassword,
    onAuthStateChanged,
    sendEmailVerification,
    signInWithEmailAndPassword,
    signOut,
    updateProfile,
} from "firebase/auth";
import {
    collection,
    deleteField,
    doc,
    getDoc,
    getDocs,
    query,
    setDoc,
    where,
    writeBatch,
} from "firebase/firestore";
import React, { createContext, useContext, useEffect, useState } from "react";

interface AuthContextType {
  user: User | null;
  profile: UserProfile | null;
  isLoading: boolean;
  isAuthenticated: boolean;
  login: (email: string, pass: string) => Promise<void>;
  register: (name: string, email: string, pass: string) => Promise<void>;
  resendVerificationEmail: (email: string, pass: string) => Promise<void>;
  logout: () => Promise<void>;
  updateStoreLocation: (store: StoreLocation | null) => Promise<void>;
}

const AuthContext = createContext<AuthContextType | null>(null);

export const getAuthErrorMessage = (error: any): string => {
  const code = error?.code || "";
  switch (code) {
    case "auth/email-not-verified":
      return "Email Anda belum diverifikasi. Silakan cek kotak masuk email Anda.";
    case "auth/email-already-in-use":
      return "Email ini sudah terdaftar. Silakan masuk atau gunakan email lain.";
    case "auth/invalid-email":
      return "Format email tidak valid.";
    case "auth/weak-password":
      return "Kata sandi terlalu singkat (minimal 6 karakter).";
    case "auth/user-not-found":
      return "Akun dengan email ini tidak ditemukan.";
    case "auth/wrong-password":
      return "Kata sandi salah. Silakan periksa kembali.";
    case "auth/invalid-credential":
      return "Email atau kata sandi salah.";
    case "auth/too-many-requests":
      return "Terlalu banyak permintaan. Silakan tunggu beberapa saat sebelum mencoba lagi.";
    case "auth/network-request-failed":
      return "Gagal terhubung ke server. Periksa koneksi internet Anda.";
    case "auth/configuration-not-found":
    case "auth/operation-not-allowed":
      return 'Layanan Authentication belum diaktifkan di Firebase Console. Buka Firebase Console > Build > Authentication > Sign-in method, lalu aktifkan penyedia "Email/Password".';
    default:
      return error?.message || "Terjadi kesalahan saat autentikasi.";
  }
};

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({
  children,
}) => {
  const [user, setUser] = useState<User | null>(null);
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (currentUser) => {
      // Hanya izinkan pengguna yang telah memverifikasi email
      if (currentUser && currentUser.emailVerified) {
        setUser(currentUser);
        try {
          const userDocRef = doc(db, "users", currentUser.uid);
          const userDoc = await getDoc(userDocRef);
          if (userDoc.exists()) {
            setProfile(userDoc.data() as UserProfile);
          } else {
            const fallbackProfile: UserProfile = {
              uid: currentUser.uid,
              name:
                currentUser.displayName ||
                currentUser.email?.split("@")[0] ||
                "User",
              email: currentUser.email || "",
              createdAt: new Date().toISOString(),
            };
            setProfile((prev) =>
              prev?.uid === currentUser.uid ? prev : fallbackProfile,
            );
            await setDoc(userDocRef, fallbackProfile, { merge: true });
          }
        } catch (err) {
          console.error("Error fetching user profile from Firestore:", err);
        }
      } else {
        setUser(null);
        setProfile(null);
      }
      setIsLoading(false);
    });

    return () => unsubscribe();
  }, []);

  const login = async (email: string, pass: string): Promise<void> => {
    const trimmedEmail = email.trim();
    const credential = await signInWithEmailAndPassword(
      auth,
      trimmedEmail,
      pass,
    );

    // Validasi email verification
    if (!credential.user.emailVerified) {
      await signOut(auth);
      setUser(null);
      setProfile(null);

      const error: any = new Error(
        "Email Anda belum diverifikasi. Silakan cek kotak masuk email Anda.",
      );
      error.code = "auth/email-not-verified";
      throw error;
    }

    const userDocRef = doc(db, "users", credential.user.uid);
    const userDoc = await getDoc(userDocRef);
    if (userDoc.exists()) {
      setProfile(userDoc.data() as UserProfile);
    } else {
      const fallbackProfile: UserProfile = {
        uid: credential.user.uid,
        name:
          credential.user.displayName ||
          credential.user.email?.split("@")[0] ||
          "User",
        email: credential.user.email || "",
        createdAt: new Date().toISOString(),
      };
      setProfile(fallbackProfile);
      await setDoc(userDocRef, fallbackProfile, { merge: true });
    }
    setUser(credential.user);
  };

  const register = async (
    name: string,
    email: string,
    pass: string,
  ): Promise<void> => {
    const trimmedName = name.trim();
    const trimmedEmail = email.trim();

    const credential = await createUserWithEmailAndPassword(
      auth,
      trimmedEmail,
      pass,
    );
    await updateProfile(credential.user, { displayName: trimmedName });

    const newProfile: UserProfile = {
      uid: credential.user.uid,
      name: trimmedName,
      email: trimmedEmail.toLowerCase(),
      createdAt: new Date().toISOString(),
    };

    // Simpan profil user baru di database Firestore
    await setDoc(doc(db, "users", credential.user.uid), newProfile);

    // Inisialisasi struktur farm terisolasi
    const initialUserStore: AppState = {
      userId: credential.user.uid,
      updatedAt: new Date().toISOString(),
      ponds: [
        {
          id: `pond-1-${credential.user.uid.slice(0, 6)}`,
          userId: credential.user.uid,
          name: "Kolam Utama",
          lokasi: "Area Depan",
        },
        {
          id: `pond-2-${credential.user.uid.slice(0, 6)}`,
          userId: credential.user.uid,
          name: "Kolam Karantina",
          lokasi: "Area Karantina",
        },
      ],
      fish: [],
      history: [],
      varietyHistory: [],
    };

    await setDoc(doc(db, "user_stores", credential.user.uid), initialUserStore);

    // Kirim email verifikasi Firebase Auth
    await sendEmailVerification(credential.user);

    // Keluarkan sesi sementara agar user harus verifikasi terlebih dahulu sebelum login
    await signOut(auth);
    setUser(null);
    setProfile(null);
  };

  const resendVerificationEmail = async (
    email: string,
    pass: string,
  ): Promise<void> => {
    const trimmedEmail = email.trim();
    if (!trimmedEmail) throw new Error("Email tidak boleh kosong.");
    if (!pass)
      throw new Error(
        "Kata sandi diperlukan untuk mengirim ulang email verifikasi.",
      );

    const credential = await signInWithEmailAndPassword(
      auth,
      trimmedEmail,
      pass,
    );
    await sendEmailVerification(credential.user);
    await signOut(auth);
    setUser(null);
    setProfile(null);
  };

  const logout = async (): Promise<void> => {
    await signOut(auth);
    setUser(null);
    setProfile(null);
  };

  const updateStoreLocation = async (
    store: StoreLocation | null,
  ): Promise<void> => {
    if (!user) throw new Error("Pengguna belum login.");
    const userDocRef = doc(db, "users", user.uid);

    // 1. Simpan ke users/{uid}.store di Firestore
    if (store) {
      await setDoc(userDocRef, { store }, { merge: true });
    } else {
      await setDoc(userDocRef, { store: deleteField() }, { merge: true });
    }

    // 2. Cari semua produk milik penjual di marketplace_products
    const q = query(
      collection(db, "marketplace_products"),
      where("userId", "==", user.uid),
    );
    const snap = await getDocs(q);

    // 3. Batch write pembaruan ke marketplace_products (maks 490 operasi per batch)
    const docs = snap.docs;
    const CHUNK_SIZE = 490;
    for (let i = 0; i < docs.length; i += CHUNK_SIZE) {
      const chunk = docs.slice(i, i + CHUNK_SIZE);
      const batch = writeBatch(db);
      for (const docSnap of chunk) {
        if (store) {
          batch.update(docSnap.ref, {
            storeName: store.name,
            storeLat: store.lat,
            storeLng: store.lng,
            storeAddress: store.address,
            updatedAt: new Date().toISOString(),
          });
        } else {
          batch.update(docSnap.ref, {
            storeName: deleteField(),
            storeLat: deleteField(),
            storeLng: deleteField(),
            storeAddress: deleteField(),
            updatedAt: new Date().toISOString(),
          });
        }
      }
      await batch.commit();
    }

    // 4. Perbarui state profile lokal
    setProfile((prev) => {
      if (!prev) return null;
      if (store) {
        return { ...prev, store };
      } else {
        const copy = { ...prev };
        delete copy.store;
        return copy;
      }
    });
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        profile,
        isLoading,
        isAuthenticated: !!user && !!user.emailVerified,
        login,
        register,
        resendVerificationEmail,
        logout,
        updateStoreLocation,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
};
