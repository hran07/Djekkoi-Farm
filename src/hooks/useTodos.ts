import { useCallback, useEffect, useRef, useState } from 'react';
import { Todo, TodoPeriod } from '@/lib/types';
import * as todoApi from '@/lib/todoApi';
import { getPeriodKey } from '@/lib/todoPeriod';
import { useStore } from '@/context/StoreContext';

export interface UseTodosReturn {
  todos: Todo[];
  status: 'loading' | 'success' | 'error';
  syncStatus: 'synced' | 'local';
  reload: (forceRemote?: boolean) => Promise<void>;
  add: (title: string, period: TodoPeriod) => Promise<Todo>;
  toggle: (id: string) => Promise<void>;
  remove: (id: string) => Promise<void>;
}

export function useTodos(userId?: string): UseTodosReturn {
  const [todos, setTodos] = useState<Todo[]>([]);
  const [status, setStatus] = useState<'loading' | 'success' | 'error'>(
    userId ? 'loading' : 'success'
  );
  const [syncStatus, setSyncStatus] = useState<'synced' | 'local'>('local');

  const { showToast } = useStore();
  const abortControllerRef = useRef<AbortController | null>(null);

  useEffect(() => {
    let cancelled = false;
    if (!userId) return;

    // Batalkan request sebelumnya jika ada
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
    }
    const controller = new AbortController();
    abortControllerRef.current = controller;

    const fetchInitial = async () => {
      try {
        const res = await todoApi.getTodos(userId, controller.signal);
        if (!cancelled) {
          setTodos(res.todos);
          setSyncStatus(res.isRemote ? 'synced' : 'local');
          setStatus('success');
        }
      } catch (err: any) {
        if (err?.name === 'AbortError') return;
        if (!cancelled) {
          console.error('[useTodos] Gagal memuat todo:', err);
          setStatus('error');
        }
      }
    };

    fetchInitial();

    return () => {
      cancelled = true;
      if (abortControllerRef.current) {
        abortControllerRef.current.abort();
      }
    };
  }, [userId]);

  const reload = useCallback(
    async (forceRemote: boolean = true) => {
      if (!userId) return;

      if (abortControllerRef.current) {
        abortControllerRef.current.abort();
      }
      const controller = new AbortController();
      abortControllerRef.current = controller;

      try {
        const res = forceRemote
          ? await todoApi.refreshTodos(userId, controller.signal)
          : await todoApi.getTodos(userId, controller.signal);

        setTodos(res.todos);
        setSyncStatus(res.isRemote ? 'synced' : 'local');
        setStatus('success');
      } catch (err: any) {
        if (err?.name === 'AbortError') return;
        console.error('[useTodos] Gagal memuat ulang todo:', err);
        setStatus('error');
      }
    },
    [userId]
  );

  const add = useCallback(
    async (title: string, period: TodoPeriod): Promise<Todo> => {
      if (!userId) throw new Error('Pengguna belum login');
      try {
        const newTodo = await todoApi.addTodo(
          userId,
          title,
          period,
          abortControllerRef.current?.signal
        );
        setTodos((prev) => [newTodo, ...prev]);
        return newTodo;
      } catch (err: any) {
        if (err?.name === 'AbortError') throw err;
        showToast('Gagal menambahkan todo');
        throw err;
      }
    },
    [userId, showToast]
  );

  const toggle = useCallback(
    async (id: string) => {
      if (!userId) return;

      // Optimistic update
      const optimisticTodos = todos.map((t) => {
        if (t.id === id) {
          const currentKey = getPeriodKey(t.period);
          const isDone = t.lastCompletedKey === currentKey;
          return {
            ...t,
            lastCompletedKey: isDone ? null : currentKey,
          };
        }
        return t;
      });

      setTodos(optimisticTodos);

      try {
        await todoApi.toggleTodo(
          userId,
          id,
          abortControllerRef.current?.signal
        );
      } catch (err: any) {
        if (err?.name === 'AbortError') return;
        console.error('[useTodos] Gagal toggle todo:', err);
        // Pertahankan perubahan lokal sesuai spesifikasi local-first
      }
    },
    [userId, todos]
  );

  const remove = useCallback(
    async (id: string) => {
      if (!userId) return;
      const prevTodos = todos;

      // Optimistic update
      setTodos(todos.filter((t) => t.id !== id));

      try {
        await todoApi.deleteTodo(userId, id);
      } catch (err: any) {
        console.error('[useTodos] Gagal menghapus todo:', err);
        setTodos(prevTodos);
        showToast('Gagal menghapus todo');
      }
    },
    [userId, todos, showToast]
  );

  return {
    todos,
    status,
    syncStatus,
    reload,
    add,
    toggle,
    remove,
  };
}
