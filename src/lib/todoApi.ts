import AsyncStorage from '@react-native-async-storage/async-storage';
import { Alert } from 'react-native';
import { Todo, TodoPeriod } from './types';
import { getPeriodKey } from './todoPeriod';
import { uid } from './format';
import {
  fetchRemoteTodos,
  createRemoteTodo,
  patchRemoteTodo,
} from './todoRemote';

const getStorageKey = (userId: string): string => `todos:${userId}`;

/**
 * Data awal (seeding) lokal saat pengguna belum memiliki data di storage dan server gagal diakses.
 */
export function createDefaultSeed(): Todo[] {
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

export interface GetTodosResult {
  todos: Todo[];
  isRemote: boolean;
}

/**
 * Mengambil daftar todo milik pengguna dari AsyncStorage (local-first).
 * - Jika data storage belum ada (`raw === null`), melakukan GET ke REST API (fetchRemoteTodos).
 * - Hasil dipetakan ke interface Todo dengan period bergantian harian/mingguan dan remoteId = id server.
 * - Jika GET gagal/timeout, fallback ke seed perawatan kolam dan menampilkan Alert.
 */
export async function getTodos(
  userId: string,
  signal?: AbortSignal
): Promise<GetTodosResult> {
  if (!userId) return { todos: [], isRemote: false };
  const key = getStorageKey(userId);
  const raw = await AsyncStorage.getItem(key);

  // Jika sudah tersimpan di storage lokal, gunakan data lokal (local-first)
  if (raw !== null) {
    try {
      const parsed = JSON.parse(raw);
      return { todos: Array.isArray(parsed) ? parsed : [], isRemote: true };
    } catch {
      return { todos: [], isRemote: false };
    }
  }

  // Key belum ada di storage: lakukan GET ke REST API server
  try {
    const remoteList = await fetchRemoteTodos(signal);
    const mappedTodos: Todo[] = remoteList.map((item, index) => ({
      id: uid(),
      // Judul dipetakan ke format 'Tugas #<id>: ...' dipotong maksimal 40 karakter
      title: `Tugas #${item.id}: ${item.title}`.slice(0, 40),
      period: index % 2 === 0 ? 'harian' : 'mingguan',
      lastCompletedKey: null,
      createdAt: new Date().toISOString(),
      remoteId: item.id,
    }));

    await AsyncStorage.setItem(key, JSON.stringify(mappedTodos));
    return { todos: mappedTodos, isRemote: true };
  } catch (err: any) {
    if (err?.name !== 'AbortError') {
      Alert.alert(
        'Gagal memuat dari server',
        'Tidak dapat terhubung ke server. Memakai data lokal.'
      );
    }
    const seed = createDefaultSeed();
    await AsyncStorage.setItem(key, JSON.stringify(seed));
    return { todos: seed, isRemote: false };
  }
}

/**
 * Memanggil ulang GET ke server dan menggabungkan hasilnya dengan data lokal.
 * Tidak menimpa todo buatan user, lastCompletedKey, maupun period yang sudah diubah.
 */
export async function refreshTodos(
  userId: string,
  signal?: AbortSignal
): Promise<GetTodosResult> {
  if (!userId) return { todos: [], isRemote: false };
  const key = getStorageKey(userId);

  // Ambil data lokal saat ini
  const raw = await AsyncStorage.getItem(key);
  let localTodos: Todo[] = [];
  try {
    localTodos = raw ? JSON.parse(raw) : [];
  } catch {
    localTodos = [];
  }

  try {
    const remoteList = await fetchRemoteTodos(signal);

    // Set of existing remoteIds in local storage
    const localRemoteIdMap = new Map<number, Todo>();
    localTodos.forEach((t) => {
      if (t.remoteId !== undefined) {
        localRemoteIdMap.set(t.remoteId, t);
      }
    });

    // Gabungkan: jika remoteId sudah ada di lokal, pertahankan data lokal (lastCompletedKey, period, dll.)
    // Jika ada remoteId baru dari server yang belum ada di lokal, tambahkan.
    const mergedRemoteTodos: Todo[] = remoteList.map((item, index) => {
      const existing = localRemoteIdMap.get(item.id);
      if (existing) {
        return existing;
      }
      return {
        id: uid(),
        title: `Tugas #${item.id}: ${item.title}`.slice(0, 40),
        period: index % 2 === 0 ? 'harian' : 'mingguan',
        lastCompletedKey: null,
        createdAt: new Date().toISOString(),
        remoteId: item.id,
      };
    });

    // Todo lokal yang dibuat user sendiri (tidak punya remoteId atau remoteId > 200)
    const userCreatedTodos = localTodos.filter(
      (t) => t.remoteId === undefined || t.remoteId > 200
    );

    const mergedAll: Todo[] = [...userCreatedTodos, ...mergedRemoteTodos];

    await AsyncStorage.setItem(key, JSON.stringify(mergedAll));
    return { todos: mergedAll, isRemote: true };
  } catch (err: any) {
    if (err?.name !== 'AbortError') {
      Alert.alert(
        'Gagal menyinkronkan',
        'Tidak dapat terhubung ke server. Menggunakan data lokal saat ini.'
      );
    }
    return { todos: localTodos, isRemote: false };
  }
}

/**
 * Menambahkan todo baru:
 * - Menyimpan ke storage lokal terlebih dahulu.
 * - Mengirim POST ke REST API server via createRemoteTodo.
 * - Simpan id balasan ke remoteId (HANYA catatan).
 * - Jika POST gagal, tampilkan Alert dan tetap pertahankan penyimpanan lokal.
 */
export async function addTodo(
  userId: string,
  title: string,
  period: TodoPeriod,
  signal?: AbortSignal
): Promise<Todo> {
  if (!userId) throw new Error('Pengguna tidak valid');
  const trimmedTitle = title.trim().slice(0, 80);
  if (!trimmedTitle) throw new Error('Judul todo tidak boleh kosong');

  const key = getStorageKey(userId);
  const raw = await AsyncStorage.getItem(key);
  const currentTodos: Todo[] = raw ? JSON.parse(raw) : [];

  // Simpan secara lokal terlebih dahulu
  const newTodo: Todo = {
    id: uid(),
    title: trimmedTitle,
    period,
    lastCompletedKey: null,
    createdAt: new Date().toISOString(),
  };

  let updatedTodos = [newTodo, ...currentTodos];
  await AsyncStorage.setItem(key, JSON.stringify(updatedTodos));

  // Kirim POST ke REST API server
  try {
    const remoteRes = await createRemoteTodo(
      { title: trimmedTitle, completed: false },
      signal
    );
    // Simpan id balasan ke remoteId hanya sebagai catatan (tidak untuk di-PATCH)
    newTodo.remoteId = remoteRes.id;
    updatedTodos = updatedTodos.map((t) => (t.id === newTodo.id ? newTodo : t));
    await AsyncStorage.setItem(key, JSON.stringify(updatedTodos));
  } catch (err: any) {
    if (err?.name !== 'AbortError') {
      console.warn('[addTodo] POST remote error:', err?.message || err);
      Alert.alert(
        'Gagal mengirim ke server',
        'Aktivitas berhasil disimpan di perangkat lokal, namun sinkronisasi server gagal.'
      );
    }
  }

  return newTodo;
}

/**
 * Mengubah status selesai (toggle) dari sebuah todo:
 * - Memperbarui status di storage lokal terlebih dahulu (optimistic).
 * - Jika remoteId <= 200, kirim PATCH ke server.
 * - Jika remoteId tidak ada atau > 200, lewati PATCH tanpa error.
 * - Jika PATCH gagal, tampilkan Alert dan tetap pertahankan perubahan lokal.
 */
export async function toggleTodo(
  userId: string,
  todoId: string,
  signal?: AbortSignal
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

  // Kirim PATCH jika todo memiliki remoteId dari server awal (id <= 200)
  if (updatedTodo.remoteId !== undefined && updatedTodo.remoteId <= 200) {
    try {
      const nextCompletedStatus = newLastCompletedKey !== null;
      await patchRemoteTodo(
        updatedTodo.remoteId,
        { completed: nextCompletedStatus },
        signal
      );
    } catch (err: any) {
      if (err?.name !== 'AbortError') {
        console.warn('[toggleTodo] PATCH remote error:', err?.message || err);
        Alert.alert(
          'Gagal memperbarui server',
          'Status berhasil diubah di perangkat lokal, namun gagal disinkronkan ke server.'
        );
      }
    }
  }

  return updatedTodo;
}

/**
 * Menghapus todo berdasarkan ID.
 */
export async function deleteTodo(userId: string, todoId: string): Promise<void> {
  if (!userId) throw new Error('Pengguna tidak valid');
  const key = getStorageKey(userId);
  const raw = await AsyncStorage.getItem(key);
  const todos: Todo[] = raw ? JSON.parse(raw) : [];

  const updatedTodos = todos.filter((t) => t.id !== todoId);
  await AsyncStorage.setItem(key, JSON.stringify(updatedTodos));
}
