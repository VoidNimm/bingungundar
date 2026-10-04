import type { StorageAdapter } from './types';

export type { StorageAdapter, StoredFileMeta } from './types';

let _adapter: StorageAdapter | null = null;

/** Detect apakah berjalan di Tauri atau browser biasa */
function isTauri(): boolean {
  return typeof window !== 'undefined' && '__TAURI_INTERNALS__' in window;
}

/** Lazy-load adapter yang sesuai */
export async function getStorage(): Promise<StorageAdapter> {
  if (_adapter) return _adapter;

  if (isTauri()) {
    const { tauriAdapter } = await import('./tauri-fs');
    _adapter = tauriAdapter;
  } else {
    const { indexedDBAdapter } = await import('./indexeddb');
    _adapter = indexedDBAdapter;
  }
  return _adapter;
}

/** React hook helper — returns adapter sync after first load */
export function useStorageSync(): StorageAdapter | null {
  // This is for cases where we need synchronous access
  return _adapter;
}
