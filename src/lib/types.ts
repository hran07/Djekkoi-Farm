export interface Pond {
  id: string;
  name: string;
  lokasi: string;
}

export interface Fish {
  id: string;
  foto: string | null;
  varietas: string;
  asal: string;
  jumlah: number;
  ukuran: number;
  grade: string;
  kelamin: string;
  kondisi: string;
  hargaBeli: number;
  hargaJual: number;
  kolamId: string;
  catatan: string;
  display: boolean;
  tgl: string; // ISO string
}

export interface SaleInfo {
  harga: number;
  beli: number;
  pembeli: string;
  metode: string;
  catatan: string;
  bukti: string | null;
}

export interface HistoryEntry {
  id: string;
  ts: string; // ISO string
  tipe: 'masuk' | 'keluar' | 'edit_ikan' | 'edit_kolam';
  judul: string;
  ikan: string;
  jumlah?: number;
  ke?: string;
  dari?: string;
  tujuan?: 'terjual' | 'pindah';
  detail?: string;
  sale?: SaleInfo;
}

export interface AppState {
  ponds: Pond[];
  fish: Fish[];
  history: HistoryEntry[];
  varietyHistory: string[];
}

