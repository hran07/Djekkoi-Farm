import { useCallback, useEffect, useState } from 'react';
import { Todo, TodoPeriod } from '@/lib/types';
import * as todoApi from '@/lib/todoApi';
import { getPeriodKey } from '@/lib/todoPeriod';
import { useStore } from '@/context/StoreContext';

export interface UseTodosReturn {
  todos: Todo[];
  status: 'loading' | 'success' | 'error';
  reload: () => Promise<void>;
  add: (title: string, period: TodoPeriod) => Promise<Todo>;
  toggle: (id: string) => Promise<void>;
  remove: (id: string) => Promise<void>;
}

export function useTodos(userId?: string): UseTodosReturn {
  const [todos, setTodos] = useState<Todo[]>([]);
  const [status, setStatus] = useState<'loading' | 'success' | 'error'>(
    userId ? 'loading' : 'success'
  );
  const { showToast } = useStore();

  useEffect(() => {
    let cancelled = false;
    if (!userId) return;

    const fetchInitial = async () => {
      try {
        const data = await todoApi.getTodos(userId);
        if (!cancelled) {
          setTodos(data);
          setStatus('success');
        }
      } catch (err) {
        if (!cancelled) {
          console.error('[useTodos] Gagal memuat todo:', err);
          setStatus('error');
        }
      }
    };

    fetchInitial();

    return () => {
      cancelled = true;
    };
  }, [userId]);

  const reload = useCallback(async () => {
    if (!userId) return;
    try {
      const data = await todoApi.getTodos(userId);
      setTodos(data);
      setStatus('success');
    } catch (err) {
      console.error('[useTodos] Gagal memuat ulang todo:', err);
      setStatus('error');
    }
  }, [userId]);

  const add = useCallback(
    async (title: string, period: TodoPeriod): Promise<Todo> => {
      if (!userId) throw new Error('Pengguna belum login');
      try {
        const newTodo = await todoApi.addTodo(userId, title, period);
        setTodos((prev) => [newTodo, ...prev]);
        return newTodo;
      } catch (err) {
        showToast('Gagal menambahkan todo');
        throw err;
      }
    },
    [userId, showToast]
  );

  const toggle = useCallback(
    async (id: string) => {
      if (!userId) return;
      const prevTodos = todos;

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
        await todoApi.toggleTodo(userId, id);
      } catch (err) {
        console.error('[useTodos] Gagal toggle todo:', err);
        setTodos(prevTodos);
        showToast('Gagal memperbarui status todo');
      }
    },
    [userId, todos, showToast]
  );

  const remove = useCallback(
    async (id: string) => {
      if (!userId) return;
      const prevTodos = todos;

      // Optimistic update
      setTodos(todos.filter((t) => t.id !== id));

      try {
        await todoApi.deleteTodo(userId, id);
      } catch (err) {
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
    reload,
    add,
    toggle,
    remove,
  };
}
