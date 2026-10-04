/**
 * IndexedDB wrapper for storing course materials (files) locally.
 * DB: bingungundar | Store: materi
 */

export interface MateriFile {
  id: string
  name: string
  type: string
  size: number
  subject: string
  uploadedAt: number
  blob: Blob
}

export type MateriMeta = Omit<MateriFile, 'blob'>

const DB_NAME = 'bingungundar'
const STORE = 'materi'
const VERSION = 1

function openDB(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    const req = indexedDB.open(DB_NAME, VERSION)
    req.onupgradeneeded = () => {
      const db = req.result
      if (!db.objectStoreNames.contains(STORE)) {
        db.createObjectStore(STORE, { keyPath: 'id' })
      }
    }
    req.onsuccess = () => resolve(req.result)
    req.onerror = () => reject(req.error)
  })
}

export async function saveMateri(file: MateriFile): Promise<void> {
  const db = await openDB()
  return new Promise((resolve, reject) => {
    const tx = db.transaction(STORE, 'readwrite')
    tx.objectStore(STORE).put(file)
    tx.oncomplete = () => resolve()
    tx.onerror = () => reject(tx.error)
  })
}

export async function getAllMateri(): Promise<MateriFile[]> {
  const db = await openDB()
  return new Promise((resolve, reject) => {
    const tx = db.transaction(STORE, 'readonly')
    const req = tx.objectStore(STORE).getAll()
    req.onsuccess = () => resolve(req.result as MateriFile[])
    req.onerror = () => reject(req.error)
  })
}

export async function deleteMateri(id: string): Promise<void> {
  const db = await openDB()
  return new Promise((resolve, reject) => {
    const tx = db.transaction(STORE, 'readwrite')
    tx.objectStore(STORE).delete(id)
    tx.oncomplete = () => resolve()
    tx.onerror = () => reject(tx.error)
  })
}

export function formatSize(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`
}

export function getFileIcon(type: string): string {
  if (type.includes('pdf')) return '📄'
  if (type.includes('word') || type.includes('document')) return '📝'
  if (type.includes('presentation') || type.includes('powerpoint')) return '📊'
  if (type.includes('sheet') || type.includes('excel')) return '📈'
  if (type.includes('image')) return '🖼️'
  if (type.includes('video')) return '🎬'
  if (type.includes('audio')) return '🎵'
  if (type.includes('zip') || type.includes('rar') || type.includes('7z')) return '🗜️'
  if (type.includes('text')) return '📃'
  return '📁'
}

export function getFileColor(type: string): string {
  if (type.includes('pdf')) return 'border-l-red-500'
  if (type.includes('word') || type.includes('document')) return 'border-l-blue-500'
  if (type.includes('presentation') || type.includes('powerpoint')) return 'border-l-orange-500'
  if (type.includes('sheet') || type.includes('excel')) return 'border-l-green-500'
  if (type.includes('image')) return 'border-l-purple-500'
  if (type.includes('video')) return 'border-l-pink-500'
  return 'border-l-muted-foreground'
}
