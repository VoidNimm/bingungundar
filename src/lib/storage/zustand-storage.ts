import type { StateStorage } from 'zustand/middleware';
import { getStorage } from './index';

/**
 * Custom Zustand storage yang:
 * - Di Tauri: baca/tulis ke Documents/bingungundar/Data/<name>.json
 * - Di browser: fallback ke localStorage (default behavior)
 */
export function createTauriStorage(jsonFilename: string): StateStorage {
  return {
    getItem: async (name: string): Promise<string | null> => {
      try {
        const storage = await getStorage();
        if (storage.isNative()) {
          const data = await storage.readJSON<{ state: unknown; version: number }>(jsonFilename);
          return data ? JSON.stringify(data) : null;
        }
      } catch { /* fall through */ }
      return localStorage.getItem(name);
    },

    setItem: async (name: string, value: string): Promise<void> => {
      // Always write to localStorage for fast hydration
      localStorage.setItem(name, value);
      // Also write to JSON file if in Tauri
      try {
        const storage = await getStorage();
        if (storage.isNative()) {
          await storage.writeJSON(jsonFilename, JSON.parse(value));
        }
      } catch { /* silently fail */ }
    },

    removeItem: async (name: string): Promise<void> => {
      localStorage.removeItem(name);
    },
  };
}
