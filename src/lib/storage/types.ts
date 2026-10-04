/** Metadata file yang tersimpan (tanpa binary data) */
export interface StoredFileMeta {
  id: string;
  name: string;          // "slide_pertemuan_1.pdf"
  type: string;          // MIME type
  size: number;          // bytes
  subjectSlug: string;   // "algoritma"
  subjectName: string;   // "Algoritma & Pemrograman"
  category: 'catatan' | 'materi';
  uploadedAt: number;    // Date.now()
  notes?: string;
  /** Relative path inside Documents/bingungundar/ — hanya untuk Tauri */
  filePath?: string;     // "Catatan/Algoritma & Pemrograman/slide.pdf"
}

/** Abstraksi storage adapter */
export interface StorageAdapter {
  // File operations
  saveFile(meta: Omit<StoredFileMeta, 'id' | 'filePath'>, data: ArrayBuffer): Promise<string>;
  getFilesBySubject(category: 'catatan' | 'materi', subjectSlug: string): Promise<StoredFileMeta[]>;
  getAllFiles(category: 'catatan' | 'materi'): Promise<StoredFileMeta[]>;
  getFileData(id: string, category: 'catatan' | 'materi'): Promise<ArrayBuffer | null>;
  deleteFile(id: string, category: 'catatan' | 'materi'): Promise<void>;

  // JSON data operations (untuk tasks, attendance, jadwal cache)
  readJSON<T>(filename: string): Promise<T | null>;
  writeJSON<T>(filename: string, data: T): Promise<void>;

  // Utility
  openInExplorer(category: 'catatan' | 'materi', subjectSlug?: string): Promise<void>;
  revealFileInExplorer(id: string, category: 'catatan' | 'materi'): Promise<void>;
  isNative(): boolean;
}
