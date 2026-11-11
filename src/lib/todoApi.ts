import AsyncStorage from '@react-native-async-storage/async-storage';
import { Todo, TodoPeriod } from './types';
import { getPeriodKey } from './todoPeriod';
import { uid } from './format';

const getStorageKey = (userId: string): string => `todos:${userId}`;

/**
 * Data awal (seeding) saat pengguna belum memiliki data todo di storage.
 */
function createDefaultSeed(): Todo[] {
  const now = new Date().toISOString();
  return [
    {
      id: uid(),
      title: 'Beri pakan ikan pagi',
      period: 'harian',
      lastCompletedKey: null,
      createdAt: now,
    },
    {
      id: uid(),
      title: 'Beri pakan ikan sore',
      period: 'harian',
      lastCompletedKey: null,
      createdAt: now,
    },
    {
      id: uid(),
      title: 'Cek kondisi & kejernihan air',
      period: 'harian',
      lastCompletedKey: null,
      createdAt: now,
    },
    {
      id: uid(),
      title: 'Ganti sebagian air kolam',
      period: 'mingguan',
      lastCompletedKey: null,
      createdAt: now,
    },
    {
      id: uid(),
      title: 'Bersihkan filter kolam',
      period: 'mingguan',
      lastCompletedKey: null,
      createdAt: now,
    },
    {
      id: uid(),
      title: 'Cek pH & suhu air',
      period: 'mingguan',
      lastCompletedKey: null,
      createdAt: now,
    },
  ];
}

/**
 * Mengambil daftar todo milik pengguna.
 * Jika belum ada data (key null), otomatis melakukan seeding default.
 */
export async function getTodos(userId: string): Promise<Todo[]> {
  if (!userId) return [];
  const key = getStorageKey(userId);
  const raw = await AsyncStorage.getItem(key);

  if (raw === null) {
    const seed = createDefaultSeed();
    await AsyncStorage.setItem(key, JSON.stringify(seed));
    return seed;
  }

  try {
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

/**
 * Menambahkan todo baru untuk pengguna.
 */
export async function addTodo(
  userId: string,
  title: string,
  period: TodoPeriod
): Promise<Todo> {
  if (!userId) throw new Error('Pengguna tidak valid');
  const trimmedTitle = title.trim().slice(0, 80);
  if (!trimmedTitle) throw new Error('Judul todo tidak boleh kosong');

  const todos = await getTodos(userId);
  const newTodo: Todo = {
    id: uid(),
    title: trimmedTitle,
    period,
    lastCompletedKey: null,
    createdAt: new Date().toISOString(),
  };

  const updatedTodos = [newTodo, ...todos];
  await AsyncStorage.setItem(getStorageKey(userId), JSON.stringify(updatedTodos));
  return newTodo;
}

/**
 * Mengubah status selesai (toggle) dari sebuah todo.
 * Jika sudah selesai di periode saat ini, maka dibatalkan (null).
 * Jika belum selesai, diisi dengan kunci periode saat ini.
 */
export async function toggleTodo(userId: string, todoId: string): Promise<Todo> {
  if (!userId) throw new Error('Pengguna tidak valid');
  const todos = await getTodos(userId);
  const index = todos.findIndex((t) => t.id === todoId);
  if (index === -1) throw new Error('Todo tidak ditemukan');

  const currentTodo = todos[index];
  const currentKey = getPeriodKey(currentTodo.period);
  const isDone = currentTodo.lastCompletedKey === currentKey;

  const updatedTodo: Todo = {
    ...currentTodo,
    lastCompletedKey: isDone ? null : currentKey,
  };

  todos[index] = updatedTodo;
  await AsyncStorage.setItem(getStorageKey(userId), JSON.stringify(todos));
  return updatedTodo;
}

/**
 * Menghapus todo berdasarkan ID.
 */
export async function deleteTodo(userId: string, todoId: string): Promise<void> {
  if (!userId) throw new Error('Pengguna tidak valid');
  const todos = await getTodos(userId);
  const updatedTodos = todos.filter((t) => t.id !== todoId);
  await AsyncStorage.setItem(getStorageKey(userId), JSON.stringify(updatedTodos));
}

