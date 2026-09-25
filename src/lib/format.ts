const MONTHS_ID = [
  'Januari',
  'Februari',
  'Maret',
  'April',
  'Mei',
  'Juni',
  'Juli',
  'Agustus',
  'September',
  'Oktober',
  'November',
  'Desember',
];

const DAYS_ID = [
  'Minggu',
  'Senin',
  'Selasa',
  'Rabu',
  'Kamis',
  'Jumat',
  'Sabtu',
];

export function uid(): string {
  return Math.random().toString(36).slice(2, 9) + Date.now().toString(36).slice(-4);
}

export function rp(n: number): string {
  const num = Math.round(Number(n) || 0);
  const isNegative = num < 0;
  const absStr = Math.abs(num).toString();
  let result = '';
  for (let i = 0; i < absStr.length; i++) {
    if (i > 0 && (absStr.length - i) % 3 === 0) {
      result += '.';
    }
    result += absStr[i];
  }
  return `${isNegative ? '-' : ''}Rp ${result}`;
}

export function fdate(isoString: string): string {
  const d = new Date(isoString);
  if (isNaN(d.getTime())) return '-';
  const day = d.getDate();
  const month = MONTHS_ID[d.getMonth()];
  const year = d.getFullYear();
  return `${day} ${month} ${year}`;
}

export function ftodayWithDay(): string {
  const d = new Date();
  const dayName = DAYS_ID[d.getDay()];
  const day = d.getDate();
  const month = MONTHS_ID[d.getMonth()];
  return `${dayName}, ${day} ${month}`;
}

export function ftime(isoString: string): string {
  const d = new Date(isoString);
  if (isNaN(d.getTime())) return '-';
  const hours = d.getHours().toString().padStart(2, '0');
  const mins = d.getMinutes().toString().padStart(2, '0');
  return `${hours}.${mins}`;
}

export function fLabel(f: { varietas: string; ukuran: number; grade: string }): string {
  return `${f.varietas} ${f.ukuran} cm (Grade ${f.grade})`;
}

export { STORAGE_KEY } from '@/constants/theme';

export function sum<T>(a: T[], f: (x: T) => number): number {
  return a.reduce((s, x) => s + (f(x) || 0), 0);
}
