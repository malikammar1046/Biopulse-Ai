/**
 * BioPulse AI Mobile — Resilient Persistent Storage
 *
 * Universal persistent storage layer across Web, iOS, and Android.
 * - On Web: Uses browser `localStorage`
 * - On Native (Expo / React Native): Uses `expo-file-system` in `documentDirectory`
 * - In-memory fallback if file system or storage is restricted
 */

import { Platform } from 'react-native';

let memoryCache: Record<string, string> = {};

// Lazy-load expo-file-system on native
let FileSystem: typeof import('expo-file-system') | null = null;
if (Platform.OS !== 'web') {
  try {
    FileSystem = require('expo-file-system');
  } catch (e) {
    console.warn('[BioPulse Storage] expo-file-system not available, using in-memory cache:', e);
  }
}

function getFilePath(key: string): string | null {
  if (Platform.OS === 'web' || !FileSystem || !FileSystem.documentDirectory) {
    return null;
  }
  const sanitized = key.replace(/[^a-zA-Z0-9_-]/g, '_');
  return `${FileSystem.documentDirectory}biopulse_${sanitized}.json`;
}

export const persistentStorage = {
  async getItem(key: string): Promise<string | null> {
    if (Platform.OS === 'web') {
      try {
        if (typeof localStorage !== 'undefined') {
          return localStorage.getItem(key);
        }
      } catch {
        // Fallback to memory
      }
      return memoryCache[key] ?? null;
    }

    const filePath = getFilePath(key);
    if (filePath && FileSystem) {
      try {
        const info = await FileSystem.getInfoAsync(filePath);
        if (info.exists) {
          const content = await FileSystem.readAsStringAsync(filePath);
          memoryCache[key] = content;
          return content;
        }
        return null;
      } catch (err) {
        console.warn(`[BioPulse Storage] Error reading ${key} from file:`, err);
      }
    }

    return memoryCache[key] ?? null;
  },

  async setItem(key: string, value: string): Promise<void> {
    memoryCache[key] = value;

    if (Platform.OS === 'web') {
      try {
        if (typeof localStorage !== 'undefined') {
          localStorage.setItem(key, value);
        }
      } catch {
        // Fallback to memory
      }
      return;
    }

    const filePath = getFilePath(key);
    if (filePath && FileSystem) {
      try {
        await FileSystem.writeAsStringAsync(filePath, value);
      } catch (err) {
        console.warn(`[BioPulse Storage] Error writing ${key} to file:`, err);
      }
    }
  },

  async removeItem(key: string): Promise<void> {
    delete memoryCache[key];

    if (Platform.OS === 'web') {
      try {
        if (typeof localStorage !== 'undefined') {
          localStorage.removeItem(key);
        }
      } catch {
        // Ignore
      }
      return;
    }

    const filePath = getFilePath(key);
    if (filePath && FileSystem) {
      try {
        const info = await FileSystem.getInfoAsync(filePath);
        if (info.exists) {
          await FileSystem.deleteAsync(filePath, { idempotent: true });
        }
      } catch (err) {
        console.warn(`[BioPulse Storage] Error deleting ${key} file:`, err);
      }
    }
  },
};

export const safeStorage = persistentStorage;
