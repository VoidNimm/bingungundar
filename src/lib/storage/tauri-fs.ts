import {
  exists, mkdir, readDir, readFile, writeFile,
  readTextFile, writeTextFile, remove,
  BaseDirectory,
} from '@tauri-apps/plugin-fs';
import { openPath, revealItemInDir } from '@tauri-apps/plugin-opener';
import { documentDir, join } from '@tauri-apps/api/path';
import type { StorageAdapter, StoredFileMeta } from './types';

const ROOT = 'bingungundar';

// Slug → folder name mapping
const SUBJECT_FOLDERS: Record<string, string> = {
  'fisika-kimia': 'Fisika & Kimia Dasar',
  'konsep-si': 'Konsep Sistem & Teknik SI',
  'algoritma': 'Algoritma & Pemrograman',
  'matematika': 'Matematika Dasar',
  'digital': 'Digital Citizenship',
  'isbd': 'Ilmu Sosial & Budaya Dasar',
  'pancasila': 'Pendidikan Pancasila',
  'bisnis': 'Peng. Bisnis & Ekonomi Digital',
};

function categoryFolder(cat: 'catatan' | 'materi'): string {
  return cat === 'catatan' ? 'Catatan' : 'Materi';
}

async function ensureDir(path: string): Promise<void> {
  const dirExists = await exists(path, { baseDir: BaseDirectory.Document });
  if (!dirExists) {
    await mkdir(path, { baseDir: BaseDirectory.Document, recursive: true });
  }
}

/** Manifest file tracks metadata for all files in a category */
async function readManifest(category: 'catatan' | 'materi'): Promise<StoredFileMeta[]> {
  const path = `${ROOT}/${categoryFolder(category)}/manifest.json`;
  try {
    const content = await readTextFile(path, { baseDir: BaseDirectory.Document });
    return JSON.parse(content) as StoredFileMeta[];
  } catch {
    return [];
  }
}

async function writeManifest(category: 'catatan' | 'materi', data: StoredFileMeta[]): Promise<void> {
  const dir = `${ROOT}/${categoryFolder(category)}`;
  await ensureDir(dir);
  await writeTextFile(
    `${dir}/manifest.json`,
    JSON.stringify(data, null, 2),
    { baseDir: BaseDirectory.Document }
  );
}

export const tauriAdapter: StorageAdapter = {
  isNative: () => true,

  async saveFile(meta, data) {
    const id = crypto.randomUUID();
    const folderName = SUBJECT_FOLDERS[meta.subjectSlug] || meta.subjectSlug;
    const catFolder = categoryFolder(meta.category);
    const dir = `${ROOT}/${catFolder}/${folderName}`;

    await ensureDir(dir);

    // Deduplicate filename if needed
    let fileName = meta.name;
    const filePath = `${dir}/${fileName}`;
    const fileExists = await exists(filePath, { baseDir: BaseDirectory.Document });
    if (fileExists) {
      const ext = fileName.lastIndexOf('.') > 0 ? fileName.slice(fileName.lastIndexOf('.')) : '';
      const base = fileName.lastIndexOf('.') > 0 ? fileName.slice(0, fileName.lastIndexOf('.')) : fileName;
      fileName = `${base}_${Date.now()}${ext}`;
    }

    const finalPath = `${dir}/${fileName}`;

    // Write the actual file
    await writeFile(finalPath, new Uint8Array(data), { baseDir: BaseDirectory.Document });

    // Update manifest
    const manifest = await readManifest(meta.category);
    const record: StoredFileMeta = {
      ...meta,
      id,
      name: fileName,
      filePath: finalPath,
      uploadedAt: Date.now(),
    };
    manifest.push(record);
    await writeManifest(meta.category, manifest);

    return id;
  },

  async getFilesBySubject(category, subjectSlug) {
    const manifest = await readManifest(category);
    return manifest.filter(f => f.subjectSlug === subjectSlug);
  },

  async getAllFiles(category) {
    return readManifest(category);
  },

  async getFileData(id, category) {
    const manifest = await readManifest(category);
    const entry = manifest.find(f => f.id === id);
    if (!entry?.filePath) return null;

    try {
      const data = await readFile(entry.filePath, { baseDir: BaseDirectory.Document });
      return data.buffer as ArrayBuffer;
    } catch {
      return null;
    }
  },

  async deleteFile(id, category) {
    const manifest = await readManifest(category);
    const entry = manifest.find(f => f.id === id);
    if (entry?.filePath) {
      try {
        await remove(entry.filePath, { baseDir: BaseDirectory.Document });
      } catch {
        // File might already be deleted from Explorer
      }
    }
    const updated = manifest.filter(f => f.id !== id);
    await writeManifest(category, updated);
  },

  async readJSON<T>(filename: string): Promise<T | null> {
    const path = `${ROOT}/Data/${filename}`;
    try {
      const content = await readTextFile(path, { baseDir: BaseDirectory.Document });
      return JSON.parse(content) as T;
    } catch {
      return null;
    }
  },

  async writeJSON<T>(filename: string, data: T): Promise<void> {
    const dir = `${ROOT}/Data`;
    await ensureDir(dir);
    await writeTextFile(
      `${dir}/${filename}`,
      JSON.stringify(data, null, 2),
      { baseDir: BaseDirectory.Document }
    );
  },

  async revealFileInExplorer(id, category) {
    const manifest = await readManifest(category);
    const entry = manifest.find(f => f.id === id);
    if (entry?.filePath) {
      const docPath = await documentDir();
      const fullPath = await join(docPath, entry.filePath);
      await revealItemInDir(fullPath);
    }
  },
  
  async openInExplorer(category, subjectSlug) {
    const docPath = await documentDir();
    const catFolder = categoryFolder(category);
    let fullPath = await join(docPath, ROOT, catFolder);
      if (subjectSlug) {
        const folderName = SUBJECT_FOLDERS[subjectSlug] || subjectSlug;
        fullPath = await join(fullPath, folderName);
      }
    await openPath(fullPath);
  },
};
