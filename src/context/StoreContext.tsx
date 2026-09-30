import React, { createContext, useContext, useEffect, useState, useCallback } from 'react';
import { doc, onSnapshot, setDoc } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { AppState, Fish, HistoryEntry, Pond, SaleInfo } from '@/lib/types';
import { fLabel, uid } from '@/lib/format';
import { useAuth } from '@/context/AuthContext';

export type SheetType =
  | 'addFish'
  | 'fishDetail'
  | 'editFish'
  | 'sellFish'
  | 'moveFish'
  | 'deleteFish'
  | 'addPond'
  | 'editPond'
  | 'deletePond'
  | 'settings'
  | 'confirm'
  | 'proofImage';

export interface SheetState {
  type: SheetType;
  data?: any;
}

interface StoreContextType {
  // Data State
  state: AppState;
  isLoaded: boolean;

  // UI State
  searchQuery: string;
  setSearchQuery: (q: string) => void;
  pondFilter: string;
  setPondFilter: (p: string) => void;
  activePondDetailId: string | null;
  setActivePondDetailId: (id: string | null) => void;
  historyFilter: string;
  setHistoryFilter: (h: string) => void;
  periodFilter: number;
  setPeriodFilter: (p: number) => void;

  // Toast State
  toastMessage: string | null;
  showToast: (msg: string) => void;

  // Sheet State
  activeSheet: SheetState | null;
  openSheet: (type: SheetType, data?: any) => void;
  closeSheet: () => void;

  // Clear / Reset State on Logout
  clearStore: () => void;

  // Data Actions
  addFish: (fishData: Omit<Fish, 'id' | 'tgl'>) => void;
  editFish: (id: string, updates: Partial<Fish>, logEntries: { judul: string; detail: string }[]) => void;
  sellFish: (id: string, count: number, saleInfo: SaleInfo) => void;
  moveFish: (id: string, targetPondId: string, count: number) => void;
  deleteFish: (id: string) => void;
  toggleDisplay: (id: string) => void;

  addPond: (name: string, lokasi: string) => void;
  editPond: (id: string, name: string, lokasi: string) => void;
  deletePond: (id: string) => void;

  wipeData: () => void;
  deleteVarietyHistory: (name: string) => void;
  getPondName: (id: string) => string;
}


const StoreContext = createContext<StoreContextType | null>(null);

const initialAppState: AppState = {
  ponds: [],
  fish: [],
  history: [],
  varietyHistory: [],
};

export const StoreProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { user } = useAuth();
  const [state, setState] = useState<AppState>(initialAppState);
  const [isLoaded, setIsLoaded] = useState(false);

  // UI filters
  const [searchQuery, setSearchQuery] = useState('');
  const [pondFilter, setPondFilter] = useState('all');
  const [activePondDetailId, setActivePondDetailId] = useState<string | null>(null);
  const [historyFilter, setHistoryFilter] = useState('all');
  const [periodFilter, setPeriodFilter] = useState(30);

  // Toast
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  // Sheet
  const [activeSheet, setActiveSheet] = useState<SheetState | null>(null);

  const showToast = useCallback((msg: string) => {
    setToastMessage(msg);
  }, []);

  const clearStore = useCallback(() => {
    setState(initialAppState);
    setIsLoaded(false);
    setSearchQuery('');
    setPondFilter('all');
    setActivePondDetailId(null);
    setHistoryFilter('all');
    setPeriodFilter(30);
    setActiveSheet(null);
    setToastMessage(null);
  }, []);

  useEffect(() => {
    if (toastMessage) {
      const timer = setTimeout(() => {
        setToastMessage(null);
      }, 2600);
      return () => clearTimeout(timer);
    }
  }, [toastMessage]);

  // Listen to Cloud Firestore in real-time, strictly isolated per user UID
  useEffect(() => {
    if (!user) {
      clearStore();
      setIsLoaded(true);
      return;
    }

    setIsLoaded(false);
    setSearchQuery('');
    setPondFilter('all');
    setActivePondDetailId(null);
    setHistoryFilter('all');
    setPeriodFilter(30);
    setActiveSheet(null);

    const docRef = doc(db, 'user_stores', user.uid);
    const unsubscribe = onSnapshot(
      docRef,
      (docSnap) => {
        if (docSnap.exists()) {
          const data = docSnap.data();
          if (
            data &&
            Array.isArray(data.ponds) &&
            Array.isArray(data.fish) &&
            Array.isArray(data.history)
          ) {
            // Isolasi data: pastikan hanya data yang terikat ke UID user ini yang dimuat
            const userPonds: Pond[] = data.ponds
              .filter((p: Pond) => !p.userId || p.userId === user.uid)
              .map((p: Pond) => ({ ...p, userId: user.uid }));
            const userFish: Fish[] = data.fish
              .filter((f: Fish) => !f.userId || f.userId === user.uid)
              .map((f: Fish) => ({ ...f, userId: user.uid }));
            const userHistory: HistoryEntry[] = data.history
              .filter((h: HistoryEntry) => !h.userId || h.userId === user.uid)
              .map((h: HistoryEntry) => ({ ...h, userId: user.uid }));

            setState({
              userId: user.uid,
              updatedAt: data.updatedAt || new Date().toISOString(),
              ponds: userPonds,
              fish: userFish,
              history: userHistory,
              varietyHistory: Array.isArray(data.varietyHistory) ? data.varietyHistory : [],
            });
          }
        } else {
          // Inisialisasi farm baru yang bersih dan terisolasi khusus untuk akun ini
          const defaultInitialState: AppState = {
            userId: user.uid,
            updatedAt: new Date().toISOString(),
            ponds: [
              { id: `pond-1-${user.uid.slice(0, 6)}`, userId: user.uid, name: 'Kolam Utama', lokasi: 'Area Depan' },
              { id: `pond-2-${user.uid.slice(0, 6)}`, userId: user.uid, name: 'Kolam Karantina', lokasi: 'Area Karantina' },
            ],
            fish: [],
            history: [],
            varietyHistory: ['Kohaku', 'Taisho Sanke', 'Showa Sanshoku', 'Asagi', 'Shiro Utsuri'],
          };
          setDoc(docRef, defaultInitialState).catch(console.error);
          setState(defaultInitialState);
        }
        setIsLoaded(true);
      },
      (error) => {
        console.error('Failed to listen to Firestore user store changes:', error);
        setIsLoaded(true);
      }
    );

    return () => unsubscribe();
  }, [user, clearStore]);

  // Save to Cloud Firestore, bound strictly to user UID
  const saveState = useCallback(async (newState: AppState) => {
    if (!user) return;
    const stateWithUser: AppState = {
      ...newState,
      userId: user.uid,
      updatedAt: new Date().toISOString(),
    };
    setState(stateWithUser);
    try {
      const docRef = doc(db, 'user_stores', user.uid);
      await setDoc(docRef, stateWithUser);
    } catch (e) {
      console.error('Failed to save data to Firestore:', e);
      showToast('Gagal menyimpan data ke Firestore.');
    }
  }, [user, showToast]);

  const openSheet = useCallback((type: SheetType, data?: any) => {
    setActiveSheet({ type, data });
  }, []);

  const closeSheet = useCallback(() => {
    setActiveSheet(null);
  }, []);

  const getPondName = useCallback(
    (id: string): string => {
      const p = state.ponds.find((x) => x.id === id);
      return p ? p.name : '-';
    },
    [state.ponds]
  );

  // Data Actions (Semua menyertakan userId pengguna yang login)
  const addFish = useCallback(
    (fishData: Omit<Fish, 'id' | 'tgl'>) => {
      if (!user) return;
      const newFish: Fish = {
        ...fishData,
        id: uid(),
        userId: user.uid,
        tgl: new Date().toISOString(),
      };
      const pondName = state.ponds.find((p) => p.id === newFish.kolamId)?.name || '-';
      const historyItem: HistoryEntry = {
        id: uid(),
        userId: user.uid,
        ts: new Date().toISOString(),
        tipe: 'masuk',
        judul: 'Ikan masuk',
        ikan: fLabel(newFish),
        jumlah: newFish.jumlah,
        ke: pondName,
      };

      const trimmedVarietas = fishData.varietas.trim();
      let newVarietyHistory = state.varietyHistory || [];
      if (
        trimmedVarietas &&
        !newVarietyHistory.some(
          (v) => v.toLowerCase() === trimmedVarietas.toLowerCase()
        )
      ) {
        newVarietyHistory = [...newVarietyHistory, trimmedVarietas];
      }

      const newState: AppState = {
        ...state,
        userId: user.uid,
        fish: [newFish, ...state.fish],
        history: [historyItem, ...state.history],
        varietyHistory: newVarietyHistory,
      };

      saveState(newState);
      closeSheet();
      showToast('Ikan ditambahkan');
    },
    [state, user, saveState, closeSheet, showToast]
  );

  const editFish = useCallback(
    (id: string, updates: Partial<Fish>, logEntries: { judul: string; detail: string }[]) => {
      if (!user) return;
      const fishItem = state.fish.find((f) => f.id === id);
      if (!fishItem) return;

      const updatedFishList = state.fish.map((f) => (f.id === id ? { ...f, ...updates, userId: user.uid } : f));
      const newLogs: HistoryEntry[] = logEntries.map((log) => ({
        id: uid(),
        userId: user.uid,
        ts: new Date().toISOString(),
        tipe: 'edit_ikan',
        judul: log.judul,
        ikan: fishItem.varietas,
        detail: log.detail,
      }));

      const newState: AppState = {
        ...state,
        userId: user.uid,
        fish: updatedFishList,
        history: [...newLogs, ...state.history],
      };

      saveState(newState);
      closeSheet();
      showToast('Perubahan disimpan');
    },
    [state, user, saveState, closeSheet, showToast]
  );

  const sellFish = useCallback(
    (id: string, count: number, saleInfo: SaleInfo) => {
      if (!user) return;
      const fishItem = state.fish.find((f) => f.id === id);
      if (!fishItem) return;

      const pondName = state.ponds.find((p) => p.id === fishItem.kolamId)?.name || '-';

      let updatedFishList: Fish[];
      if (fishItem.jumlah - count <= 0) {
        updatedFishList = state.fish.filter((f) => f.id !== id);
      } else {
        updatedFishList = state.fish.map((f) =>
          f.id === id ? { ...f, jumlah: f.jumlah - count, userId: user.uid } : f
        );
      }

      const historyItem: HistoryEntry = {
        id: uid(),
        userId: user.uid,
        ts: new Date().toISOString(),
        tipe: 'keluar',
        judul: 'Ikan keluar',
        tujuan: 'terjual',
        ikan: fLabel(fishItem),
        jumlah: count,
        dari: pondName,
        sale: saleInfo,
      };

      const newState: AppState = {
        ...state,
        userId: user.uid,
        fish: updatedFishList,
        history: [historyItem, ...state.history],
      };

      saveState(newState);
      closeSheet();
      showToast('Penjualan dicatat');
    },
    [state, user, saveState, closeSheet, showToast]
  );

  const moveFish = useCallback(
    (id: string, targetPondId: string, count: number) => {
      if (!user) return;
      const fishItem = state.fish.find((f) => f.id === id);
      if (!fishItem) return;

      const sourcePondName = state.ponds.find((p) => p.id === fishItem.kolamId)?.name || '-';
      const targetPondName = state.ponds.find((p) => p.id === targetPondId)?.name || '-';

      let updatedFishList: Fish[];
      if (count === fishItem.jumlah) {
        updatedFishList = state.fish.map((f) => (f.id === id ? { ...f, kolamId: targetPondId, userId: user.uid } : f));
      } else {
        const remainingCount = fishItem.jumlah - count;
        const clonedFish: Fish = {
          ...fishItem,
          id: uid(),
          userId: user.uid,
          jumlah: count,
          kolamId: targetPondId,
        };
        updatedFishList = state.fish.map((f) =>
          f.id === id ? { ...f, jumlah: remainingCount, userId: user.uid } : f
        );
        updatedFishList.push(clonedFish);
      }

      const historyItem: HistoryEntry = {
        id: uid(),
        userId: user.uid,
        ts: new Date().toISOString(),
        tipe: 'keluar',
        judul: 'Ikan keluar',
        tujuan: 'pindah',
        ikan: fLabel(fishItem),
        jumlah: count,
        dari: sourcePondName,
        ke: targetPondName,
      };

      const newState: AppState = {
        ...state,
        userId: user.uid,
        fish: updatedFishList,
        history: [historyItem, ...state.history],
      };

      saveState(newState);
      closeSheet();
      showToast('Ikan dipindahkan');
    },
    [state, user, saveState, closeSheet, showToast]
  );

  const deleteFish = useCallback(
    (id: string) => {
      if (!user) return;
      const fishItem = state.fish.find((f) => f.id === id);
      if (!fishItem) return;

      const pondName = state.ponds.find((p) => p.id === fishItem.kolamId)?.name || '-';
      const updatedFishList = state.fish.filter((f) => f.id !== id);

      const historyItem: HistoryEntry = {
        id: uid(),
        userId: user.uid,
        ts: new Date().toISOString(),
        tipe: 'edit_ikan',
        judul: 'Hapus data ikan',
        ikan: fLabel(fishItem),
        jumlah: fishItem.jumlah,
        detail: `Data dihapus dari ${pondName}`,
      };

      const newState: AppState = {
        ...state,
        userId: user.uid,
        fish: updatedFishList,
        history: [historyItem, ...state.history],
      };

      saveState(newState);
      closeSheet();
      showToast('Data ikan dihapus');
    },
    [state, user, saveState, closeSheet, showToast]
  );

  const toggleDisplay = useCallback(
    (id: string) => {
      if (!user) return;
      const fishItem = state.fish.find((f) => f.id === id);
      if (!fishItem) return;

      const newDisplay = !fishItem.display;
      const updatedFishList = state.fish.map((f) => (f.id === id ? { ...f, display: newDisplay, userId: user.uid } : f));

      const newState: AppState = {
        ...state,
        userId: user.uid,
        fish: updatedFishList,
      };

      saveState(newState);
      closeSheet();
      showToast(newDisplay ? 'Ditampilkan di penjualan' : 'Disembunyikan dari penjualan');
    },
    [state, user, saveState, closeSheet, showToast]
  );

  const addPond = useCallback(
    (name: string, lokasi: string) => {
      if (!user) return;
      const newPond: Pond = {
        id: uid(),
        userId: user.uid,
        name,
        lokasi,
      };

      const historyItem: HistoryEntry = {
        id: uid(),
        userId: user.uid,
        ts: new Date().toISOString(),
        tipe: 'edit_kolam',
        judul: 'Tambah kolam',
        ikan: '',
        detail: `${name} ditambahkan${lokasi ? ' di ' + lokasi : ''}`,
      };

      const newState: AppState = {
        ...state,
        userId: user.uid,
        ponds: [...state.ponds, newPond],
        history: [historyItem, ...state.history],
      };

      saveState(newState);
      closeSheet();
      showToast('Kolam ditambahkan');
    },
    [state, user, saveState, closeSheet, showToast]
  );

  const editPond = useCallback(
    (id: string, name: string, lokasi: string) => {
      if (!user) return;
      const pondItem = state.ponds.find((p) => p.id === id);
      if (!pondItem) return;

      const updatedPonds = state.ponds.map((p) => (p.id === id ? { ...p, name, lokasi, userId: user.uid } : p));
      const logs: HistoryEntry[] = [];

      if (name !== pondItem.name) {
        logs.push({
          id: uid(),
          userId: user.uid,
          ts: new Date().toISOString(),
          tipe: 'edit_kolam',
          judul: 'Ubah nama kolam',
          ikan: '',
          detail: `${pondItem.name} menjadi ${name}`,
        });
      }

      if (lokasi !== pondItem.lokasi) {
        logs.push({
          id: uid(),
          userId: user.uid,
          ts: new Date().toISOString(),
          tipe: 'edit_kolam',
          judul: 'Ubah lokasi kolam',
          ikan: '',
          detail: `${name} pindah ke ${lokasi || '(kosong)'}`,
        });
      }

      const newState: AppState = {
        ...state,
        userId: user.uid,
        ponds: updatedPonds,
        history: [...logs, ...state.history],
      };

      saveState(newState);
      closeSheet();
      showToast('Kolam diperbarui');
    },
    [state, user, saveState, closeSheet, showToast]
  );

  const deletePond = useCallback(
    (id: string) => {
      if (!user) return;
      const pondItem = state.ponds.find((p) => p.id === id);
      if (!pondItem) return;

      const updatedPonds = state.ponds.filter((p) => p.id !== id);
      const historyItem: HistoryEntry = {
        id: uid(),
        userId: user.uid,
        ts: new Date().toISOString(),
        tipe: 'edit_kolam',
        judul: 'Hapus kolam',
        ikan: '',
        detail: `${pondItem.name} dihapus`,
      };

      if (pondFilter === id) setPondFilter('all');
      if (activePondDetailId === id) setActivePondDetailId(null);

      const newState: AppState = {
        ...state,
        userId: user.uid,
        ponds: updatedPonds,
        history: [historyItem, ...state.history],
      };

      saveState(newState);
      closeSheet();
      showToast('Kolam dihapus');
    },
    [state, user, pondFilter, activePondDetailId, saveState, closeSheet, showToast]
  );

  const deleteVarietyHistory = useCallback(
    (name: string) => {
      if (!user) return;
      const trimmed = name.trim().toLowerCase();
      const updatedHistory = (state.varietyHistory || []).filter(
        (v) => v.trim().toLowerCase() !== trimmed
      );
      const newState: AppState = {
        ...state,
        userId: user.uid,
        varietyHistory: updatedHistory,
      };
      saveState(newState);
      closeSheet();
      showToast('Rekomendasi dihapus');
    },
    [state, user, saveState, closeSheet, showToast]
  );

  const wipeData = useCallback(() => {
    if (!user) return;
    const emptyState: AppState = {
      userId: user.uid,
      updatedAt: new Date().toISOString(),
      ponds: [],
      fish: [],
      history: [],
      varietyHistory: [],
    };
    setPondFilter('all');
    setActivePondDetailId(null);
    saveState(emptyState);
    closeSheet();
    showToast('Semua data dihapus');
  }, [user, saveState, closeSheet, showToast]);

  return (
    <StoreContext.Provider
      value={{
        state,
        isLoaded,
        searchQuery,
        setSearchQuery,
        pondFilter,
        setPondFilter,
        activePondDetailId,
        setActivePondDetailId,
        historyFilter,
        setHistoryFilter,
        periodFilter,
        setPeriodFilter,
        toastMessage,
        showToast,
        activeSheet,
        openSheet,
        closeSheet,
        clearStore,
        addFish,
        editFish,
        sellFish,
        moveFish,
        deleteFish,
        toggleDisplay,
        addPond,
        editPond,
        deletePond,
        wipeData,
        deleteVarietyHistory,
        getPondName,
      }}
    >
      {children}
    </StoreContext.Provider>
  );

};

export const useStore = (): StoreContextType => {
  const context = useContext(StoreContext);
  if (!context) {
    throw new Error('useStore must be used within a StoreProvider');
  }
  return context;
};
