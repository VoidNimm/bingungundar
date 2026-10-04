import type { StorageAdapter, StoredFileMeta } from './types';

// Import existing IndexedDB functions
import {
  saveCatatan, getCatatanBySubject, getAllCatatan,
  getCatatanFile, deleteCatatan,
  type CatatanFile
} from '@/lib/catatan-db';
import { saveMateri, getAllMateri, deleteMateri, type MateriFile } from '@/lib/materi-db';

/** Fallback adapter: wraps existing IndexedDB code untuk backwards compatibility */
export const indexedDBAdapter: StorageAdapter = {
  isNative: () => false,

  async saveFile(meta, data) {
    if (meta.category === 'catatan') {
      return saveCatatan({
        subjectSlug: meta.subjectSlug,
        name: meta.name,
        type: meta.type,
        size: meta.size,
        data,
        uploadedAt: Date.now(),
        notes: meta.notes,
      });
    } else {
      const id = crypto.randomUUID();
      const blob = new Blob([data], { type: meta.type });
      await saveMateri({
        id, name: meta.name, type: meta.type,
        size: meta.size, subject: meta.subjectName,
        uploadedAt: Date.now(), blob,
      });
      return id;
    }
  },

  async getFilesBySubject(category, subjectSlug) {
    if (category === 'catatan') {
      const files = await getCatatanBySubject(subjectSlug);
      return files.map(f => catatanToMeta(f));
    } else {
      const all = await getAllMateri();
      // materi-db doesn't have slug, filter by subject name
      return all.map(m => materiToMeta(m));
    }
  },

  async getAllFiles(category) {
    if (category === 'catatan') {
      return (await getAllCatatan()).map(catatanToMeta);
    } else {
      return (await getAllMateri()).map(materiToMeta);
    }
  },

  async getFileData(id, category) {
    if (category === 'catatan') {
      const file = await getCatatanFile(id);
      return file?.data ?? null;
    } else {
      const all = await getAllMateri();
      const m = all.find(x => x.id === id);
      if (!m) return null;
      return await m.blob.arrayBuffer();
    }
  },

  async deleteFile(id, category) {
    if (category === 'catatan') {
      await deleteCatatan(id);
    } else {
      await deleteMateri(id);
    }
  },

  async readJSON<T>(filename: string): Promise<T | null> {
    try {
      const raw = localStorage.getItem(`bingungundar-${filename}`);
      return raw ? JSON.parse(raw) : null;
    } catch { return null; }
  },

  async writeJSON<T>(filename: string, data: T): Promise<void> {
    localStorage.setItem(`bingungundar-${filename}`, JSON.stringify(data));
  },

  async openInExplorer() {
    // No-op di browser
    console.warn('openInExplorer not available in browser mode');
  },
  async revealFileInExplorer() {
    console.warn('revealFileInExplorer not available in browser mode');
  },
};

function catatanToMeta(f: CatatanFile): StoredFileMeta {
  return {
    id: f.id, name: f.name, type: f.type, size: f.size,
    subjectSlug: f.subjectSlug, subjectName: '',
    category: 'catatan', uploadedAt: f.uploadedAt, notes: f.notes,
  };
}

function materiToMeta(m: MateriFile): StoredFileMeta {
  return {
    id: m.id, name: m.name, type: m.type, size: m.size,
    subjectSlug: '', subjectName: m.subject,
    category: 'materi', uploadedAt: m.uploadedAt,
  };
}
