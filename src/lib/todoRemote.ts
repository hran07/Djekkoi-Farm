export const BASE_URL = 'https://jsonplaceholder.typicode.com';
const TIMEOUT_MS = 10000;

export interface RemoteTodoItem {
  userId: number;
  id: number;
  title: string;
  completed: boolean;
}

export interface CreateRemoteTodoPayload {
  title: string;
  completed: boolean;
}

export interface PatchRemoteTodoPayload {
  completed: boolean;
}

/**
 * Helper untuk menggabungkan AbortSignal eksternal dengan batas waktu (timeout) 10 detik.
 */
function createTimeoutSignal(timeoutMs: number, externalSignal?: AbortSignal): {
  signal: AbortSignal;
  cleanup: () => void;
} {
  const controller = new AbortController();
  const timer = setTimeout(() => {
    controller.abort(new Error('Request timeout (10 detik terlampaui)'));
  }, timeoutMs);

  let onExternalAbort: (() => void) | undefined;
  if (externalSignal) {
    if (externalSignal.aborted) {
      controller.abort(externalSignal.reason);
    } else {
      onExternalAbort = () => controller.abort(externalSignal.reason);
      externalSignal.addEventListener('abort', onExternalAbort);
    }
  }

  const cleanup = () => {
    clearTimeout(timer);
    if (externalSignal && onExternalAbort) {
      externalSignal.removeEventListener('abort', onExternalAbort);
    }
  };

  return { signal: controller.signal, cleanup };
}

/**
 * GET /todos?_limit=10
 * Mengambil daftar 10 todo awal dari REST API server.
 */
export async function fetchRemoteTodos(signal?: AbortSignal): Promise<RemoteTodoItem[]> {
  const url = `${BASE_URL}/todos?_limit=10`;
  const { signal: combinedSignal, cleanup } = createTimeoutSignal(TIMEOUT_MS, signal);

  try {
    const res = await fetch(url, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
      },
      signal: combinedSignal,
    });

    console.log(`[REST] GET ${url} -> ${res.status} ${res.statusText}`);

    if (!res.ok) {
      throw new Error(`Gagal mengambil data dari server (Status: ${res.status})`);
    }

    const data: RemoteTodoItem[] = await res.json();
    return data;
  } catch (err: any) {
    if (err?.name === 'AbortError') {
      console.log(`[REST] GET ${url} -> Dibatalkan (Aborted)`);
    } else {
      console.warn(`[REST] GET ${url} -> Error: ${err?.message || err}`);
    }
    throw err;
  } finally {
    cleanup();
  }
}

/**
 * POST /todos
 * Mengirim todo baru ke REST API server.
 */
export async function createRemoteTodo(
  payload: CreateRemoteTodoPayload,
  signal?: AbortSignal
): Promise<RemoteTodoItem> {
  const url = `${BASE_URL}/todos`;
  const { signal: combinedSignal, cleanup } = createTimeoutSignal(TIMEOUT_MS, signal);

  try {
    const res = await fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(payload),
      signal: combinedSignal,
    });

    console.log(`[REST] POST ${url} -> ${res.status} ${res.statusText}`);

    if (!res.ok) {
      throw new Error(`Gagal membuat data di server (Status: ${res.status})`);
    }

    const data: RemoteTodoItem = await res.json();
    return data;
  } catch (err: any) {
    if (err?.name === 'AbortError') {
      console.log(`[REST] POST ${url} -> Dibatalkan (Aborted)`);
    } else {
      console.warn(`[REST] POST ${url} -> Error: ${err?.message || err}`);
    }
    throw err;
  } finally {
    cleanup();
  }
}

/**
 * PATCH /todos/{remoteId}
 * Memperbarui status selesai pada todo di REST API server.
 */
export async function patchRemoteTodo(
  remoteId: number,
  payload: PatchRemoteTodoPayload,
  signal?: AbortSignal
): Promise<RemoteTodoItem> {
  const url = `${BASE_URL}/todos/${remoteId}`;
  const { signal: combinedSignal, cleanup } = createTimeoutSignal(TIMEOUT_MS, signal);

  try {
    const res = await fetch(url, {
      method: 'PATCH',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(payload),
      signal: combinedSignal,
    });

    console.log(`[REST] PATCH ${url} -> ${res.status} ${res.statusText}`);

    if (!res.ok) {
      throw new Error(`Gagal memperbarui status di server (Status: ${res.status})`);
    }

    const data: RemoteTodoItem = await res.json();
    return data;
  } catch (err: any) {
    if (err?.name === 'AbortError') {
      console.log(`[REST] PATCH ${url} -> Dibatalkan (Aborted)`);
    } else {
      console.warn(`[REST] PATCH ${url} -> Error: ${err?.message || err}`);
    }
    throw err;
  } finally {
    cleanup();
  }
}

