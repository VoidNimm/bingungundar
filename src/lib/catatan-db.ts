export interface CatatanFile {
  id: string;
  subjectSlug: string; // slug of subject e.g. 'fisika-kimia'
  name: string; // file name
  type: string; // MIME type
  size: number;
  data: ArrayBuffer;
  uploadedAt: number; // Date.now()
  notes?: string; // optional text note about file
}

const DB_NAME = 'catatan-db';
const STORE_NAME = 'catatan-store';
const DB_VERSION = 1;

let dbPromise: Promise<IDBDatabase> | null = null;

function getDB(): Promise<IDBDatabase> {
  if (typeof window === 'undefined') {
    return Promise.reject(new Error('IndexedDB is not available on server'));
  }
  
  if (!dbPromise) {
    dbPromise = new Promise((resolve, reject) => {
      const request = indexedDB.open(DB_NAME, DB_VERSION);
      
      request.onerror = () => reject(request.error);
      
      request.onsuccess = () => resolve(request.result);
      
      request.onupgradeneeded = (event) => {
        const db = (event.target as IDBOpenDBRequest).result;
        if (!db.objectStoreNames.contains(STORE_NAME)) {
          const store = db.createObjectStore(STORE_NAME, { keyPath: 'id' });
          store.createIndex('subjectSlug', 'subjectSlug', { unique: false });
        }
      };
    });
  }
  return dbPromise;
}

export async function saveCatatan(file: Omit<CatatanFile, 'id'>): Promise<string> {
  const db = await getDB();
  const id = crypto.randomUUID();
  const record: CatatanFile = { ...file, id };
  
  return new Promise((resolve, reject) => {
    const tx = db.transaction(STORE_NAME, 'readwrite');
    const store = tx.objectStore(STORE_NAME);
    const request = store.add(record);
    
    request.onsuccess = () => resolve(id);
    request.onerror = () => reject(request.error);
  });
}

export async function getCatatanBySubject(subjectSlug: string): Promise<CatatanFile[]> {
  try {
    const db = await getDB();
    return new Promise((resolve, reject) => {
      const tx = db.transaction(STORE_NAME, 'readonly');
      const store = tx.objectStore(STORE_NAME);
      const index = store.index('subjectSlug');
      const request = index.getAll(subjectSlug);
      
      request.onsuccess = () => resolve(request.result || []);
      request.onerror = () => reject(request.error);
    });
  } catch (error) {
    console.warn('Failed to get catatan by subject:', error);
    return [];
  }
}

export async function getAllCatatan(): Promise<CatatanFile[]> {
  try {
    const db = await getDB();
    return new Promise((resolve, reject) => {
      const tx = db.transaction(STORE_NAME, 'readonly');
      const store = tx.objectStore(STORE_NAME);
      const request = store.getAll();
      
      request.onsuccess = () => resolve(request.result || []);
      request.onerror = () => reject(request.error);
    });
  } catch (error) {
    console.warn('Failed to get all catatan:', error);
    return [];
  }
}

export async function deleteCatatan(id: string): Promise<void> {
  const db = await getDB();
  return new Promise((resolve, reject) => {
    const tx = db.transaction(STORE_NAME, 'readwrite');
    const store = tx.objectStore(STORE_NAME);
    const request = store.delete(id);
    
    request.onsuccess = () => resolve();
    request.onerror = () => reject(request.error);
  });
}

export async function getCatatanFile(id: string): Promise<CatatanFile | undefined> {
  try {
    const db = await getDB();
    return new Promise((resolve, reject) => {
      const tx = db.transaction(STORE_NAME, 'readonly');
      const store = tx.objectStore(STORE_NAME);
      const request = store.get(id);
      
      request.onsuccess = () => resolve(request.result);
      request.onerror = () => reject(request.error);
    });
  } catch (error) {
    console.warn('Failed to get catatan file:', error);
    return undefined;
  }
}
