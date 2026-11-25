import * as SecureStore from 'expo-secure-store';
import AsyncStorage from '@react-native-async-storage/async-storage';

export const CHUNK_SIZE = 1800;

/**
 * Sanitizes a storage key to conform to SecureStore requirements.
 * SecureStore only accepts alphanumeric characters, '.', '-', and '_'.
 * All other characters (such as ':', '[', ']', spaces, etc.) are replaced with '_'.
 */
export function sanitizeKey(key: string): string {
  if (!key || typeof key !== 'string') {
    return '_';
  }
  const sanitized = key.replace(/[^a-zA-Z0-9._-]/g, '_');
  return sanitized.length > 0 ? sanitized : '_';
}

/**
 * Low-level read from SecureStore, handling chunk recombination if metadata exists.
 */
export async function rawGetItem(key: string): Promise<string | null> {
  const sKey = sanitizeKey(key);
  const metaKey = `${sKey}.chunks`;

  const meta = await SecureStore.getItemAsync(metaKey);
  if (meta !== null) {
    const count = parseInt(meta, 10);
    if (!isNaN(count) && count > 0) {
      const chunks: string[] = [];
      for (let i = 0; i < count; i++) {
        const chunk = await SecureStore.getItemAsync(`${sKey}.chunk.${i}`);
        if (chunk === null) {
          console.warn(`[secureStoragePersistence] Missing chunk ${i} for key: ${sKey}`);
          return null;
        }
        chunks.push(chunk);
      }
      return chunks.join('');
    }
  }

  // If no chunks metadata found, read directly from unchunked key
  return await SecureStore.getItemAsync(sKey);
}

/**
 * Low-level write to SecureStore, splitting into chunks if > CHUNK_SIZE.
 * Ensures no leftover chunks remain if the new value is shorter than the old one.
 */
export async function rawSetItem(key: string, value: string): Promise<void> {
  const sKey = sanitizeKey(key);
  const metaKey = `${sKey}.chunks`;

  if (typeof value !== 'string') {
    value = String(value);
  }

  // Check previous chunk count so we can clean up any leftover chunks
  let prevCount = 0;
  try {
    const prevMeta = await SecureStore.getItemAsync(metaKey);
    if (prevMeta !== null) {
      const parsed = parseInt(prevMeta, 10);
      if (!isNaN(parsed) && parsed > 0) {
        prevCount = parsed;
      }
    }
  } catch {
    // Ignore error reading previous metadata
  }

  if (value.length > CHUNK_SIZE) {
    const numChunks = Math.ceil(value.length / CHUNK_SIZE);

    // Write all new chunks
    for (let i = 0; i < numChunks; i++) {
      const chunk = value.slice(i * CHUNK_SIZE, (i + 1) * CHUNK_SIZE);
      await SecureStore.setItemAsync(`${sKey}.chunk.${i}`, chunk);
    }

    // Write chunk count metadata
    await SecureStore.setItemAsync(metaKey, String(numChunks));

    // Clean up any remaining chunks if the previous value had more chunks
    const maxCleanup = Math.max(prevCount, numChunks + 10);
    for (let i = numChunks; i < maxCleanup; i++) {
      try {
        await SecureStore.deleteItemAsync(`${sKey}.chunk.${i}`);
      } catch {
        // Ignore deletion errors for non-existent chunks
      }
    }

    // Clean up unchunked direct key if it previously existed
    try {
      await SecureStore.deleteItemAsync(sKey);
    } catch {
      // Ignore
    }
  } else {
    // Value <= CHUNK_SIZE: store directly in unchunked key
    await SecureStore.setItemAsync(sKey, value);

    // Clean up all old chunks and metadata if they existed
    const maxCleanup = Math.max(prevCount, 10);
    for (let i = 0; i < maxCleanup; i++) {
      try {
        await SecureStore.deleteItemAsync(`${sKey}.chunk.${i}`);
      } catch {
        // Ignore
      }
    }

    try {
      await SecureStore.deleteItemAsync(metaKey);
    } catch {
      // Ignore
    }
  }
}

/**
 * Low-level removal from SecureStore, deleting all chunks, metadata, and unchunked key.
 */
export async function rawRemoveItem(key: string): Promise<void> {
  const sKey = sanitizeKey(key);
  const metaKey = `${sKey}.chunks`;

  let prevCount = 0;
  try {
    const prevMeta = await SecureStore.getItemAsync(metaKey);
    if (prevMeta !== null) {
      const parsed = parseInt(prevMeta, 10);
      if (!isNaN(parsed) && parsed > 0) {
        prevCount = parsed;
      }
    }
  } catch {
    // Ignore
  }

  const maxCleanup = Math.max(prevCount, 10);
  for (let i = 0; i < maxCleanup; i++) {
    try {
      await SecureStore.deleteItemAsync(`${sKey}.chunk.${i}`);
    } catch {
      // Ignore
    }
  }

  try {
    await SecureStore.deleteItemAsync(metaKey);
  } catch {
    // Ignore
  }

  try {
    await SecureStore.deleteItemAsync(sKey);
  } catch {
    // Ignore
  }
}

// Memoized migration promise
let migrationPromise: Promise<void> | null = null;

/**
 * Migrates existing Firebase Auth keys from AsyncStorage to SecureStore.
 * Step 1: Scan AsyncStorage for keys starting with 'firebase:'.
 * Step 2: Copy each value to SecureStore via rawSetItem.
 * Step 3: Verify that rawGetItem returns the exact same value.
 * Step 4: Delete from AsyncStorage only after verification passes.
 * If any step fails for a key, the old key in AsyncStorage is preserved.
 */
export async function migrateFromAsyncStorage(): Promise<void> {
  try {
    const allKeys = await AsyncStorage.getAllKeys();
    const firebaseKeys = allKeys.filter((k) => k.startsWith('firebase:'));

    if (firebaseKeys.length === 0) {
      return;
    }

    for (const rawKey of firebaseKeys) {
      try {
        const rawValue = await AsyncStorage.getItem(rawKey);
        if (rawValue === null) {
          continue;
        }

        // Store into SecureStore with key sanitization & chunking
        await rawSetItem(rawKey, rawValue);

        // Verify that the stored value matches exactly
        const verifiedValue = await rawGetItem(rawKey);

        if (verifiedValue === rawValue) {
          // Verification passed: safely remove from AsyncStorage
          await AsyncStorage.removeItem(rawKey);
        } else {
          console.warn(
            `[secureStoragePersistence] Migration verification failed for key: ${sanitizeKey(rawKey)}`
          );
        }
      } catch (keyError) {
        console.warn(
          `[secureStoragePersistence] Failed migrating key: ${sanitizeKey(rawKey)}`,
          keyError
        );
        // Do not delete from AsyncStorage if migration failed
      }
    }
  } catch (error) {
    console.warn('[secureStoragePersistence] Automatic migration failed:', error);
  }
}

/**
 * Ensures migration runs lazily on the first getItem call and is memoized.
 */
export function ensureMigrated(): Promise<void> {
  if (!migrationPromise) {
    migrationPromise = migrateFromAsyncStorage();
  }
  return migrationPromise;
}

/**
 * Reset migration state (useful for testing).
 */
export function resetMigrationForTesting(): void {
  migrationPromise = null;
}

export interface SecureStoragePersistenceAdapter {
  getItem: (key: string) => Promise<string | null>;
  setItem: (key: string, value: string) => Promise<void>;
  removeItem: (key: string) => Promise<void>;
}

/**
 * Firebase Auth persistence adapter backed by expo-secure-store.
 * Compatible with Firebase's getReactNativePersistence().
 */
export const secureStoragePersistence: SecureStoragePersistenceAdapter = {
  async getItem(key: string): Promise<string | null> {
    try {
      await ensureMigrated();
      return await rawGetItem(key);
    } catch (error) {
      console.warn(
        `[secureStoragePersistence] getItem failed for key: ${sanitizeKey(key)}`,
        error
      );
      return null;
    }
  },

  async setItem(key: string, value: string): Promise<void> {
    try {
      await rawSetItem(key, value);
    } catch (error) {
      console.warn(
        `[secureStoragePersistence] setItem failed for key: ${sanitizeKey(key)}`,
        error
      );
    }
  },

  async removeItem(key: string): Promise<void> {
    try {
      await rawRemoveItem(key);
    } catch (error) {
      console.warn(
        `[secureStoragePersistence] removeItem failed for key: ${sanitizeKey(key)}`,
        error
      );
    }
  },
};

export default secureStoragePersistence;
