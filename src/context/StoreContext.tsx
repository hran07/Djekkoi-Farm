import React, { createContext, useContext, useEffect, useState, useCallback } from 'react';
import { doc, onSnapshot, setDoc } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { AppState, Fish, HistoryEntry, Pond, SaleInfo } from '@/lib/types';
import { fLabel, uid } from '@/lib/format';

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

  useEffect(() => {
    if (toastMessage) {
      const timer = setTimeout(() => {
        setToastMessage(null);
      }, 2600);
      return () => clearTimeout(timer);
    }
  }, [toastMessage]);

  // Listen to Cloud Firestore in real-time
  useEffect(() => {
    const docRef = doc(db, 'app_data', 'main_store');
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
            setState({
              ponds: data.ponds,
              fish: data.fish,
              history: data.history,
              varietyHistory: Array.isArray(data.varietyHistory) ? data.varietyHistory : [],
            });
          }
        }
        setIsLoaded(true);
      },
      (error) => {
        console.error('Failed to listen to Firestore changes:', error);
        setIsLoaded(true);
      }
    );

    return () => unsubscribe();
  }, []);

  // Save to Cloud Firestore
  const saveState = useCallback(async (newState: AppState) => {
    setState(newState);
    try {
      const docRef = doc(db, 'app_data', 'main_store');
      await setDoc(docRef, newState);
    } catch (e) {
      console.error('Failed to save data to Firestore:', e);
      showToast('Gagal menyimpan data ke Firestore.');
    }
  }, [showToast]);

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

  // Data Actions
  const addFish = useCallback(
    (fishData: Omit<Fish, 'id' | 'tgl'>) => {
      const newFish: Fish = {
        ...fishData,
        id: uid(),
        tgl: new Date().toISOString(),
      };
      const pondName = state.ponds.find((p) => p.id === newFish.kolamId)?.name || '-';
      const historyItem: HistoryEntry = {
        id: uid(),
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
        fish: [newFish, ...state.fish],
        history: [historyItem, ...state.history],
        varietyHistory: newVarietyHistory,
      };

      saveState(newState);
      closeSheet();
      showToast('Ikan ditambahkan');
    },
    [state, saveState, closeSheet, showToast]
  );


  const editFish = useCallback(
    (id: string, updates: Partial<Fish>, logEntries: { judul: string; detail: string }[]) => {
      const fishItem = state.fish.find((f) => f.id === id);
      if (!fishItem) return;

      const updatedFishList = state.fish.map((f) => (f.id === id ? { ...f, ...updates } : f));
      const newLogs: HistoryEntry[] = logEntries.map((log) => ({
        id: uid(),
        ts: new Date().toISOString(),
        tipe: 'edit_ikan',
        judul: log.judul,
        ikan: fishItem.varietas,
        detail: log.detail,
      }));

      const newState: AppState = {
        ...state,
        fish: updatedFishList,
        history: [...newLogs, ...state.history],
      };

      saveState(newState);
      closeSheet();
      showToast('Perubahan disimpan');
    },
    [state, saveState, closeSheet, showToast]
  );

  const sellFish = useCallback(
    (id: string, count: number, saleInfo: SaleInfo) => {
      const fishItem = state.fish.find((f) => f.id === id);
      if (!fishItem) return;

      const pondName = state.ponds.find((p) => p.id === fishItem.kolamId)?.name || '-';

      let updatedFishList: Fish[];
      if (fishItem.jumlah - count <= 0) {
        updatedFishList = state.fish.filter((f) => f.id !== id);
      } else {
        updatedFishList = state.fish.map((f) =>
          f.id === id ? { ...f, jumlah: f.jumlah - count } : f
        );
      }

      const historyItem: HistoryEntry = {
        id: uid(),
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
        fish: updatedFishList,
        history: [historyItem, ...state.history],
      };

      saveState(newState);
      closeSheet();
      showToast('Penjualan dicatat');
    },
    [state, saveState, closeSheet, showToast]
  );

  const moveFish = useCallback(
    (id: string, targetPondId: string, count: number) => {
      const fishItem = state.fish.find((f) => f.id === id);
      if (!fishItem) return;

      const sourcePondName = state.ponds.find((p) => p.id === fishItem.kolamId)?.name || '-';
      const targetPondName = state.ponds.find((p) => p.id === targetPondId)?.name || '-';

      let updatedFishList: Fish[];
      if (count === fishItem.jumlah) {
        updatedFishList = state.fish.map((f) => (f.id === id ? { ...f, kolamId: targetPondId } : f));
      } else {
        const remainingCount = fishItem.jumlah - count;
        const clonedFish: Fish = {
          ...fishItem,
          id: uid(),
          jumlah: count,
          kolamId: targetPondId,
        };
        updatedFishList = state.fish.map((f) =>
          f.id === id ? { ...f, jumlah: remainingCount } : f
        );
        updatedFishList.push(clonedFish);
      }

      const historyItem: HistoryEntry = {
        id: uid(),
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
        fish: updatedFishList,
        history: [historyItem, ...state.history],
      };

      saveState(newState);
      closeSheet();
      showToast('Ikan dipindahkan');
    },
    [state, saveState, closeSheet, showToast]
  );

  const deleteFish = useCallback(
    (id: string) => {
      const fishItem = state.fish.find((f) => f.id === id);
      if (!fishItem) return;

      const pondName = state.ponds.find((p) => p.id === fishItem.kolamId)?.name || '-';
      const updatedFishList = state.fish.filter((f) => f.id !== id);

      const historyItem: HistoryEntry = {
        id: uid(),
        ts: new Date().toISOString(),
        tipe: 'edit_ikan',
        judul: 'Hapus data ikan',
        ikan: fLabel(fishItem),
        jumlah: fishItem.jumlah,
        detail: `Data dihapus dari ${pondName}`,
      };

      const newState: AppState = {
        ...state,
        fish: updatedFishList,
        history: [historyItem, ...state.history],
      };

      saveState(newState);
      closeSheet();
      showToast('Data ikan dihapus');
    },
    [state, saveState, closeSheet, showToast]
  );

  const toggleDisplay = useCallback(
    (id: string) => {
      const fishItem = state.fish.find((f) => f.id === id);
      if (!fishItem) return;

      const newDisplay = !fishItem.display;
      const updatedFishList = state.fish.map((f) => (f.id === id ? { ...f, display: newDisplay } : f));

      const newState: AppState = {
        ...state,
        fish: updatedFishList,
      };

      saveState(newState);
      closeSheet();
      showToast(newDisplay ? 'Ditampilkan di penjualan' : 'Disembunyikan dari penjualan');
    },
    [state, saveState, closeSheet, showToast]
  );

  const addPond = useCallback(
    (name: string, lokasi: string) => {
      const newPond: Pond = {
        id: uid(),
        name,
        lokasi,
      };

      const historyItem: HistoryEntry = {
        id: uid(),
        ts: new Date().toISOString(),
        tipe: 'edit_kolam',
        judul: 'Tambah kolam',
        ikan: '',
        detail: `${name} ditambahkan${lokasi ? ' di ' + lokasi : ''}`,
      };

      const newState: AppState = {
        ...state,
        ponds: [...state.ponds, newPond],
        history: [historyItem, ...state.history],
      };

      saveState(newState);
      closeSheet();
      showToast('Kolam ditambahkan');
    },
    [state, saveState, closeSheet, showToast]
  );

  const editPond = useCallback(
    (id: string, name: string, lokasi: string) => {
      const pondItem = state.ponds.find((p) => p.id === id);
      if (!pondItem) return;

      const updatedPonds = state.ponds.map((p) => (p.id === id ? { ...p, name, lokasi } : p));
      const logs: HistoryEntry[] = [];

      if (name !== pondItem.name) {
        logs.push({
          id: uid(),
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
          ts: new Date().toISOString(),
          tipe: 'edit_kolam',
          judul: 'Ubah lokasi kolam',
          ikan: '',
          detail: `${name} pindah ke ${lokasi || '(kosong)'}`,
        });
      }

      const newState: AppState = {
        ...state,
        ponds: updatedPonds,
        history: [...logs, ...state.history],
      };

      saveState(newState);
      closeSheet();
      showToast('Kolam diperbarui');
    },
    [state, saveState, closeSheet, showToast]
  );

  const deletePond = useCallback(
    (id: string) => {
      const pondItem = state.ponds.find((p) => p.id === id);
      if (!pondItem) return;

      const updatedPonds = state.ponds.filter((p) => p.id !== id);
      const historyItem: HistoryEntry = {
        id: uid(),
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
        ponds: updatedPonds,
        history: [historyItem, ...state.history],
      };

      saveState(newState);
      closeSheet();
      showToast('Kolam dihapus');
    },
    [state, pondFilter, activePondDetailId, saveState, closeSheet, showToast]
  );

  const deleteVarietyHistory = useCallback(
    (name: string) => {
      const trimmed = name.trim().toLowerCase();
      const updatedHistory = (state.varietyHistory || []).filter(
        (v) => v.trim().toLowerCase() !== trimmed
      );
      const newState: AppState = {
        ...state,
        varietyHistory: updatedHistory,
      };
      saveState(newState);
      closeSheet();
      showToast('Rekomendasi dihapus');
    },
    [state, saveState, closeSheet, showToast]
  );

  const wipeData = useCallback(() => {
    const emptyState: AppState = {
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
  }, [saveState, closeSheet, showToast]);

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
