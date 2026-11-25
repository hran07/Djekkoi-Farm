import AsyncStorage from '@react-native-async-storage/async-storage';
import { Todo, TodoPeriod } from './types';
import { getPeriodKey } from './todoPeriod';
import { uid } from './format';

const getStorageKey = (userId: string): string => `todos:${userId}`;

/**
 * Daftar judul dummy bawaan lama yang perlu dibersihkan agar tidak muncul kembali.
 */
const DEFAULT_DUMMY_TITLES = new Set([
  'Beri pakan ikan pagi',
  'Beri pakan ikan sore',
  'Cek kondisi & kejernihan air',
  'Ganti sebagian air kolam',
  'Bersihkan filter kolam',
  'Cek pH & suhu air',
]);

function isDummyTodo(todo: Todo): boolean {
  if (todo.remoteId !== undefined) return true;
  if (DEFAULT_DUMMY_TITLES.has(todo.title)) return true;
  if (todo.title.startsWith('Tugas #')) return true;
  return false;
}

/**
 * Data awal kosong (dummy default dihapus agar pengguna memulai dengan daftar bersih).
 */
export function createDefaultSeed(): Todo[] {
  return [];
}

export interface GetTodosResult {
  todos: Todo[];
  isRemote: boolean;
}

/**
 * Mengambil daftar todo milik pengguna dari AsyncStorage (local-first).
 * - Mengembalikan daftar kosong jika belum ada data.
 * - Membersihkan sisa dummy bawaan secara otomatis jika masih tersimpan dari sesi sebelumnya.
 */
export async function getTodos(
  userId: string,
  _signal?: AbortSignal
): Promise<GetTodosResult> {
  if (!userId) return { todos: [], isRemote: false };
  const key = getStorageKey(userId);
  const raw = await AsyncStorage.getItem(key);

  if (raw === null) {
    await AsyncStorage.setItem(key, JSON.stringify([]));
    return { todos: [], isRemote: true };
  }

  try {
    const parsed: Todo[] = JSON.parse(raw);
    if (!Array.isArray(parsed)) {
      return { todos: [], isRemote: true };
    }

    // Filter keluar dummy data bawaan jika masih ada di storage pengguna
    const cleanTodos = parsed.filter((t) => !isDummyTodo(t));
    if (cleanTodos.length !== parsed.length) {
      await AsyncStorage.setItem(key, JSON.stringify(cleanTodos));
    }

    return { todos: cleanTodos, isRemote: true };
  } catch {
    return { todos: [], isRemote: false };
  }
}

/**
 * Memuat ulang data todo lokal dari storage tanpa menambahkan data dummy server/default.
 */
export async function refreshTodos(
  userId: string,
  _signal?: AbortSignal
): Promise<GetTodosResult> {
  if (!userId) return { todos: [], isRemote: false };
  return getTodos(userId, _signal);
}

/**
 * Menambahkan todo baru untuk pengguna secara lokal.
 */
export async function addTodo(
  userId: string,
  title: string,
  period: TodoPeriod,
  _signal?: AbortSignal
): Promise<Todo> {
  if (!userId) throw new Error('Pengguna tidak valid');
  const trimmedTitle = title.trim().slice(0, 80);
  if (!trimmedTitle) throw new Error('Judul todo tidak boleh kosong');

  const key = getStorageKey(userId);
  const raw = await AsyncStorage.getItem(key);
  let currentTodos: Todo[] = [];
  try {
    currentTodos = raw ? JSON.parse(raw) : [];
    if (!Array.isArray(currentTodos)) currentTodos = [];
  } catch {
    currentTodos = [];
  }

  const newTodo: Todo = {
    id: uid(),
    title: trimmedTitle,
    period,
    lastCompletedKey: null,
    createdAt: new Date().toISOString(),
  };

  const updatedTodos = [newTodo, ...currentTodos.filter((t) => !isDummyTodo(t))];
  await AsyncStorage.setItem(key, JSON.stringify(updatedTodos));

  return newTodo;
}

/**
 * Mengubah status selesai (toggle) dari sebuah todo:
 * Jika sudah selesai di periode saat ini, maka dibatalkan (null).
 * Jika belum selesai, diisi dengan kunci periode saat ini.
 */
export async function toggleTodo(
  userId: string,
  todoId: string,
  _signal?: AbortSignal
): Promise<Todo> {
  if (!userId) throw new Error('Pengguna tidak valid');
  const key = getStorageKey(userId);
  const raw = await AsyncStorage.getItem(key);
  const todos: Todo[] = raw ? JSON.parse(raw) : [];

  const index = todos.findIndex((t) => t.id === todoId);
  if (index === -1) throw new Error('Todo tidak ditemukan');

  const currentTodo = todos[index];
  const currentKey = getPeriodKey(currentTodo.period);
  const isDone = currentTodo.lastCompletedKey === currentKey;
  const newLastCompletedKey = isDone ? null : currentKey;

  const updatedTodo: Todo = {
    ...currentTodo,
    lastCompletedKey: newLastCompletedKey,
  };

  todos[index] = updatedTodo;
  await AsyncStorage.setItem(key, JSON.stringify(todos));

  return updatedTodo;
}

/**
 * Menghapus todo berdasarkan ID secara permanen dari storage lokal.
 */
export async function deleteTodo(userId: string, todoId: string): Promise<void> {
  if (!userId) throw new Error('Pengguna tidak valid');
  const key = getStorageKey(userId);
  const raw = await AsyncStorage.getItem(key);
  const todos: Todo[] = raw ? JSON.parse(raw) : [];

  const updatedTodos = todos.filter((t) => t.id !== todoId);
  await AsyncStorage.setItem(key, JSON.stringify(updatedTodos));
}
