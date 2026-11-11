import { Todo, TodoPeriod } from './types';

/**
 * Menghasilkan kunci periode untuk penentuan status selesai todo.
 * - Harian: "YYYY-MM-DD" waktu lokal
 * - Mingguan: "YYYY-Www" (ISO week, Senin sebagai hari pertama)
 */
export function getPeriodKey(period: TodoPeriod, date: Date = new Date()): string {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');

  if (period === 'harian') {
    return `${year}-${month}-${day}`;
  }

  // Mingguan: ISO 8601 week number (dimulai Senin)
  const target = new Date(date.getFullYear(), date.getMonth(), date.getDate());
  // In JS getDay(): 0 = Sun, 1 = Mon, ..., 6 = Sat
  // Convert to ISO day-of-week: 1 = Mon, ..., 7 = Sun
  const dayNr = ((target.getDay() + 6) % 7) + 1;

  // Atur ke hari Kamis dalam minggu yang sama (target - dayNr + 4)
  target.setDate(target.getDate() - dayNr + 4);

  // Tahun ISO week adalah tahun dari hari Kamis tersebut
  const isoYear = target.getFullYear();

  // Kamis pertama tahun tersebut
  const firstThursday = new Date(isoYear, 0, 4);
  const firstThursdayDayNr = ((firstThursday.getDay() + 6) % 7) + 1;
  firstThursday.setDate(firstThursday.getDate() - firstThursdayDayNr + 4);

  // Hitung jumlah minggu penuh
  const weekNumber = 1 + Math.round(((target.getTime() - firstThursday.getTime()) / 86400000) / 7);

  return `${isoYear}-W${String(weekNumber).padStart(2, '0')}`;
}

/**
 * Menentukan apakah sebuah todo berstatus selesai pada tanggal/waktu yang diberikan.
 */
export function isTodoDone(todo: Todo, date: Date = new Date()): boolean {
  if (!todo.lastCompletedKey) return false;
  return todo.lastCompletedKey === getPeriodKey(todo.period, date);
}

