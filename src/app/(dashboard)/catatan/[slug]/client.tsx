'use client'

import React, { useEffect, useState, useRef, useCallback } from 'react'
import Link from 'next/link'
import { FilePreview } from '@/components/file-preview'
import { 
  ChevronLeft, 
  UploadCloud, 
  FileText, 
  FileSpreadsheet, 
  Presentation, 
  Image as ImageIcon, 
  File as FileIcon,
  FolderOpen,
  Trash2,
  Eye,
  X,
  Loader2
} from 'lucide-react'
import { SidebarTrigger } from '@/components/ui/sidebar'
import { Button, buttonVariants } from '@/components/ui/button'
import { OpenInExplorerButton } from '@/components/open-in-explorer-button'
import { getStorage, type StoredFileMeta } from '@/lib/storage'

const SUBJECTS = [
  { name: 'Fisika & Kimia Dasar', slug: 'fisika-kimia', color: '#030164' },
  { name: 'Konsep Sistem & Teknik SI', slug: 'konsep-si', color: '#363199' },
  { name: 'Algoritma & Pemrograman', slug: 'algoritma', color: '#2D7495' },
  { name: 'Matematika Dasar', slug: 'matematika', color: '#E8E085' },
  { name: 'Digital Citizenship', slug: 'digital', color: '#1a1a2e' },
  { name: 'Ilmu Sosial & Budaya Dasar', slug: 'isbd', color: '#2d1a33' },
  { name: 'Pendidikan Pancasila', slug: 'pancasila', color: '#1a2d1a' },
  { name: 'Peng. Bisnis & Ekonomi Digital', slug: 'bisnis', color: '#2d1a1a' },
]

function formatSize(bytes: number) {
  if (bytes === 0) return '0 B'
  const k = 1024
  const sizes = ['B', 'KB', 'MB', 'GB']
  const i = Math.floor(Math.log(bytes) / Math.log(k))
  return parseFloat((bytes / Math.pow(k, i)).toFixed(1)) + ' ' + sizes[i]
}

function formatDate(ms: number) {
  return new Intl.DateTimeFormat('id-ID', { day: 'numeric', month: 'short', year: 'numeric' }).format(new Date(ms))
}

function getFileKind(type: string, name: string): 'image' | 'pdf' | 'docx' | 'pptx' | 'xlsx' | 'txt' | 'other' {
  const n = name.toLowerCase()
  if (type.startsWith('image/')) return 'image'
  if (type === 'application/pdf' || n.endsWith('.pdf')) return 'pdf'
  if (n.endsWith('.docx') || n.endsWith('.doc') || type.includes('word')) return 'docx'
  if (n.endsWith('.pptx') || n.endsWith('.ppt') || type.includes('presentation')) return 'pptx'
  if (n.endsWith('.xlsx') || n.endsWith('.xls') || type.includes('spreadsheet') || type.includes('excel')) return 'xlsx'
  if (n.endsWith('.txt') || type === 'text/plain') return 'txt'
  return 'other'
}

function FileTypeIcon({ type, name, size = 'md' }: { type: string; name: string; size?: 'sm' | 'md' | 'lg' }) {
  const sz = size === 'lg' ? 'size-10' : size === 'sm' ? 'size-4' : 'size-5'
  const kind = getFileKind(type, name)
  if (kind === 'image') return <ImageIcon className={`${sz} text-purple-400`} />
  if (kind === 'pdf') return <FileText className={`${sz} text-red-400`} />
  if (kind === 'docx') return <FileText className={`${sz} text-blue-400`} />
  if (kind === 'pptx') return <Presentation className={`${sz} text-orange-400`} />
  if (kind === 'xlsx') return <FileSpreadsheet className={`${sz} text-emerald-400`} />
  if (kind === 'txt') return <FileText className={`${sz} text-zinc-400`} />
  return <FileIcon className={`${sz} text-zinc-500`} />
}

// ─── Preview Panel ──────────────────────────────────────────────────────────
function FilePreviewPanel({ file, onClose }: { file: StoredFileMeta; onClose: () => void }) {
  const [previewUrl, setPreviewUrl] = useState<string | null>(null)
  const [docxHtml, setDocxHtml] = useState<string | null>(null)
  const [txtContent, setTxtContent] = useState<string | null>(null)
  const [loading, setLoading] = useState(true)
  const kind = getFileKind(file.type, file.name)

  useEffect(() => {
    let url: string | null = null
    setLoading(true)
    setPreviewUrl(null)
    setDocxHtml(null)
    setTxtContent(null)

    const prepare = async () => {
      const storage = await getStorage()
      const arrayBuf = await storage.getFileData(file.id, file.category)
      if (!arrayBuf) {
        setLoading(false)
        return
      }
      const blob = new Blob([arrayBuf], { type: file.type })

      if (kind === 'image' || kind === 'pdf') {
        url = URL.createObjectURL(blob)
        setPreviewUrl(url)
        setLoading(false)
      } else if (kind === 'docx') {
        try {
          const mammoth = (await import('mammoth')).default
          const result = await mammoth.convertToHtml({ arrayBuffer: arrayBuf })
          setDocxHtml(result.value)
        } catch {
          setDocxHtml('<p class="text-muted-foreground">Gagal membaca dokumen Word.</p>')
        }
        setLoading(false)
      } else if (kind === 'txt') {
        const text = await blob.text()
        setTxtContent(text)
        setLoading(false)
      } else {
        setLoading(false)
      }
    }

    prepare()

    return () => { if (url) URL.revokeObjectURL(url) }
  }, [file.id, kind])

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm p-4"
      onClick={onClose}
    >
      <div
        className="relative bg-card rounded-2xl shadow-2xl w-full max-w-4xl max-h-[90vh] flex flex-col overflow-hidden"
        onClick={e => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center gap-3 px-5 py-3 border-b shrink-0">
          <FileTypeIcon type={file.type} name={file.name} size="sm" />
          <div className="flex-1 min-w-0">
            <p className="font-semibold text-sm truncate">{file.name}</p>
            <p className="text-xs text-muted-foreground">{formatSize(file.size)} · {formatDate(file.uploadedAt)}</p>
          </div>
          <button
            onClick={onClose}
            className="shrink-0 p-1.5 rounded-lg text-muted-foreground hover:text-foreground hover:bg-muted transition-colors"
          >
            <X className="size-4" />
          </button>
        </div>

        {/* Body */}
        <div className="flex-1 overflow-auto min-h-0">
          {loading && (
            <div className="flex items-center justify-center h-64">
              <Loader2 className="size-8 animate-spin text-muted-foreground" />
            </div>
          )}

          {/* Image */}
          {!loading && kind === 'image' && previewUrl && (
            <div className="flex items-center justify-center p-4 bg-muted/20 min-h-[400px]">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={previewUrl}
                alt={file.name}
                className="max-w-full max-h-[70vh] object-contain rounded-lg shadow"
              />
            </div>
          )}

          {/* PDF */}
          {!loading && kind === 'pdf' && previewUrl && (
            <iframe
              src={previewUrl}
              className="w-full h-[70vh]"
              title={file.name}
            />
          )}

          {/* DOCX */}
          {!loading && kind === 'docx' && docxHtml !== null && (
            <div
              className="prose prose-sm dark:prose-invert max-w-none p-6 text-foreground"
              dangerouslySetInnerHTML={{ __html: docxHtml }}
            />
          )}

          {/* TXT */}
          {!loading && kind === 'txt' && txtContent !== null && (
            <pre className="p-6 text-sm text-foreground whitespace-pre-wrap font-mono leading-relaxed">
              {txtContent}
            </pre>
          )}

          {/* PPT / XLS / other — no preview */}
          {!loading && (kind === 'pptx' || kind === 'xlsx' || kind === 'other') && (
            <div className="flex flex-col items-center justify-center h-64 gap-4 text-muted-foreground">
              <FileTypeIcon type={file.type} name={file.name} size="lg" />
              <div className="text-center">
                <p className="font-medium text-foreground">Preview tidak tersedia</p>
                <p className="text-sm mt-1">
                  {kind === 'pptx' ? 'File PowerPoint' : kind === 'xlsx' ? 'File Excel' : 'Tipe file ini'} tidak dapat ditampilkan langsung di browser.
                </p>
                <p className="text-xs mt-0.5">Gunakan tombol Download untuk membuka di aplikasi.</p>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

// ─── Main Page ───────────────────────────────────────────────────────────────
export default function CatatanSubjectClient({ slug }: { slug: string }) {
  const subject = SUBJECTS.find(s => s.slug === slug)

  const [files, setFiles] = useState<StoredFileMeta[]>([])
  const [loading, setLoading] = useState(true)
  const [isDragging, setIsDragging] = useState(false)
  const [previewFile, setPreviewFile] = useState<StoredFileMeta | null>(null)
  
  const fileInputRef = useRef<HTMLInputElement>(null)

  const loadFiles = useCallback(async () => {
    setLoading(true)
    try {
      const storage = await getStorage()
      const data = await storage.getFilesBySubject('catatan', slug)
      setFiles(data.sort((a, b) => b.uploadedAt - a.uploadedAt))
    } catch (error) {
      console.error('Error loading files:', error)
    } finally {
      setLoading(false)
    }
  }, [slug])

  useEffect(() => {
    if (subject) loadFiles()
    else setLoading(false)
  }, [slug, subject, loadFiles])

  const handleFileUpload = async (uploadFiles: FileList | null) => {
    if (!uploadFiles || uploadFiles.length === 0) return
    for (let i = 0; i < uploadFiles.length; i++) {
      const file = uploadFiles[i]
      try {
        const storage = await getStorage()
        const arrayBuffer = await file.arrayBuffer()
        await storage.saveFile({
          subjectSlug: slug,
          subjectName: subject?.name || slug,
          name: file.name,
          category: 'catatan',
          type: file.type || 'application/octet-stream',
          size: file.size,
          uploadedAt: Date.now()
        }, arrayBuffer)
      } catch (error) {
        console.error('Failed to save file', file.name, error);
      }
    }
    await loadFiles()
  }

  const handleDelete = async (id: string) => {
    if (confirm('Yakin ingin menghapus catatan ini?')) {
      try {
        const storage = await getStorage()
        await storage.deleteFile(id, 'catatan')
        await loadFiles()
      } catch (error) {
        console.error('Failed to delete file', error)
      }
    }
  }

  const handleReveal = async (file: StoredFileMeta) => {
    try {
      const storage = await getStorage()
      if (storage.isNative()) {
        await storage.revealFileInExplorer(file.id, 'catatan')
      } else {
        const data = await storage.getFileData(file.id, file.category)
        if (!data) return
        
        const blob = new Blob([data], { type: file.type })
        const url = URL.createObjectURL(blob)
        const a = document.createElement('a')
        a.href = url
        a.download = file.name
        document.body.appendChild(a)
        a.click()
        document.body.removeChild(a)
        URL.revokeObjectURL(url)
      }
    } catch (error) {
      console.error('Download failed', error)
    }
  }

  if (!subject) {
    return (
      <div className="flex flex-col min-h-screen items-center justify-center p-6">
        <h2 className="text-2xl font-bold mb-4">Mata Kuliah Tidak Ditemukan</h2>
        <Link href="/catatan">
          <button className={buttonVariants()}>Kembali ke Catatan</button>
        </Link>
      </div>
    )
  }

  return (
    <div className="flex flex-col min-h-screen">
      {previewFile && (
        <FilePreviewPanel file={previewFile} onClose={() => setPreviewFile(null)} />
      )}

      <header className="flex h-14 items-center gap-4 border-b px-6 lg:h-[60px]">
        <SidebarTrigger />
        <Link href="/catatan">
          <button className={buttonVariants({ variant: 'ghost', size: 'icon', className: 'shrink-0' })}>
            <ChevronLeft className="size-5" />
            <span className="sr-only">Kembali</span>
          </button>
        </Link>
        <h1 className="font-semibold text-lg line-clamp-1">{subject.name}</h1>
        <div className="flex-1" />
        <OpenInExplorerButton category="catatan" slug={slug} />
      </header>

      <main className="flex-1 p-6 max-w-5xl mx-auto w-full flex flex-col gap-8">
        
        {/* Upload Zone */}
        <section>
          <div 
            className={`border-2 border-dashed rounded-xl p-8 flex flex-col items-center justify-center text-center transition-colors cursor-pointer ${
              isDragging ? 'border-primary bg-primary/5' : 'border-border bg-muted/20 hover:bg-muted/50'
            }`}
            onDragOver={(e) => { e.preventDefault(); setIsDragging(true) }}
            onDragEnter={(e) => { e.preventDefault(); setIsDragging(true) }}
            onDragLeave={(e) => { e.preventDefault(); setIsDragging(false) }}
            onDrop={(e) => {
              e.preventDefault()
              setIsDragging(false)
              handleFileUpload(e.dataTransfer.files)
            }}
            onClick={() => fileInputRef.current?.click()}
            role="button"
            tabIndex={0}
          >
            <div className="bg-background border rounded-full p-4 mb-4 shadow-sm">
              <UploadCloud className="size-8 text-muted-foreground" />
            </div>
            <h3 className="font-semibold text-lg mb-1">Upload Catatan</h3>
            <p className="text-sm text-muted-foreground max-w-sm mb-4">
              Drag & drop file di sini atau klik untuk browse. PDF, Word, Excel, PPT, TXT, dan Gambar.
            </p>
            <Button variant="secondary" onClick={(e) => { e.stopPropagation(); fileInputRef.current?.click() }}>
              Pilih File
            </Button>
            <input 
              type="file" 
              className="hidden" 
              ref={fileInputRef}
              multiple
              accept=".pdf,.ppt,.pptx,.doc,.docx,.xls,.xlsx,.txt,.png,.jpg,.jpeg"
              onChange={(e) => handleFileUpload(e.target.files)}
            />
          </div>
        </section>

        {/* File List */}
        <section className="flex flex-col gap-4">
          <h3 className="font-semibold text-lg">
            Daftar Catatan
            {files.length > 0 && <span className="ml-2 text-sm font-normal text-muted-foreground">({files.length} file)</span>}
          </h3>
          
          {loading ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {[1, 2, 3, 4].map(i => (
                <div key={i} className="h-20 bg-muted/40 animate-pulse rounded-xl border" />
              ))}
            </div>
          ) : files.length === 0 ? (
            <div className="border border-dashed rounded-xl p-12 flex flex-col items-center justify-center text-center text-muted-foreground">
              <FileIcon className="size-12 mb-4 opacity-50" />
              <p>Belum ada catatan untuk mata kuliah ini</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {files.map(file => {
                const kind = getFileKind(file.type, file.name)
                const canPreview = kind !== 'other'
                return (
                  <div 
                    key={file.id} 
                    onClick={() => setPreviewFile(file)}
                      className="flex items-center gap-3.5 p-3.5 rounded-xl border bg-card hover:bg-muted/30 transition-all group cursor-pointer"
                  >
                    {/* Icon / Preview thumbnail for images */}
                    <div className="size-12 bg-background rounded-lg border shrink-0 overflow-hidden">
                        <FilePreview file={file} />
                      </div>
                    
                    <div className="flex-1 min-w-0">
                      <h4 className="font-semibold text-sm truncate" title={file.name}>{file.name}</h4>
                      <div className="flex items-center gap-2 text-xs text-muted-foreground mt-0.5">
                        <span className="uppercase font-bold text-[10px]">{file.name.split('.').pop()}</span>
                        <span>•</span>
                        <span>{formatSize(file.size)}</span>
                        <span>•</span>
                        <span>{formatDate(file.uploadedAt)}</span>
                      </div>
                    </div>

                    <div className="flex items-center gap-0.5 shrink-0">
                      {/* Preview Button */}
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => setPreviewFile(file)}
                        title={canPreview ? 'Preview' : 'Preview tidak tersedia'}
                        className={`size-8 transition-opacity ${
                          canPreview 
                            ? 'opacity-100 sm:opacity-0 sm:group-hover:opacity-100' 
                            : 'opacity-40 sm:opacity-0 sm:group-hover:opacity-40 cursor-not-allowed'
                        }`}
                      >
                        <Eye className="size-4" />
                      </Button>

                      <Button 
                        variant="ghost" 
                        size="icon" 
                        onClick={(e) => { e.stopPropagation(); handleReveal(file); }}
                        title="Buka di Explorer"
                        className="size-8 opacity-100 sm:opacity-0 sm:group-hover:opacity-100 transition-opacity"
                      >
                        <FolderOpen className="size-4" />
                      </Button>

                      <Button 
                        variant="ghost" 
                        size="icon" 
                        className="size-8 text-destructive hover:text-destructive hover:bg-destructive/10 opacity-100 sm:opacity-0 sm:group-hover:opacity-100 transition-opacity"
                        onClick={(e) => { e.stopPropagation(); handleDelete(file.id); }}
                        title="Hapus"
                      >
                        <Trash2 className="size-4" />
                      </Button>
                    </div>
                  </div>
                )
              })}
            </div>
          )}
        </section>
      </main>
    </div>
  )
}
