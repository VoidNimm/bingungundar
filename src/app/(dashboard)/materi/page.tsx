'use client'

import * as React from 'react'
import Image from 'next/image'
import { FilePreview } from '@/components/file-preview'
import { SidebarTrigger } from '@/components/ui/sidebar'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog'
import { ScrollArea } from '@/components/ui/scroll-area'
import {
  Upload,
  Trash2,
  FolderOpen,
  Search,
  FileText,
  FileSpreadsheet,
  Presentation,
  Image as ImageIcon,
  Film,
  Music,
  File as FileIcon,
  X,
} from 'lucide-react'
import { OpenInExplorerButton } from '@/components/open-in-explorer-button'
import { getStorage, type StoredFileMeta } from '@/lib/storage'

function formatSize(bytes: number) {
  if (bytes === 0) return '0 B'
  const k = 1024
  const sizes = ['B', 'KB', 'MB', 'GB']
  const i = Math.floor(Math.log(bytes) / Math.log(k))
  return parseFloat((bytes / Math.pow(k, i)).toFixed(1)) + ' ' + sizes[i]
}

const SUBJECTS = [
  'Fisika & Kimia Dasar',
  'Konsep Sistem & Teknik SI',
  'Algoritma & Pemrograman',
  'Matematika Dasar',
  'Digital Citizenship',
  'Ilmu Sosial & Budaya Dasar',
  'Pendidikan Pancasila',
  'Peng. Bisnis & Ekonomi Digital',
  'Lainnya',
]

const SUBJECT_COLORS: Record<string, { bg: string; accent: string; text: string; sub: string }> = {
  'Fisika & Kimia Dasar':           { bg: '#030164', accent: '#1a1aff', text: '#ffffff', sub: 'rgba(255,255,255,0.7)' },
  'Konsep Sistem & Teknik SI':      { bg: '#363199', accent: '#5753d0', text: '#ffffff', sub: 'rgba(255,255,255,0.7)' },
  'Algoritma & Pemrograman':        { bg: '#2D7495', accent: '#46a0c4', text: '#ffffff', sub: 'rgba(255,255,255,0.7)' },
  'Matematika Dasar':               { bg: '#E8E085', accent: '#c6bc00', text: '#1a1a00', sub: 'rgba(0,0,0,0.6)' },
  'Digital Citizenship':            { bg: '#1a1a2e', accent: '#4444aa', text: '#ffffff', sub: 'rgba(255,255,255,0.7)' },
  'Ilmu Sosial & Budaya Dasar':     { bg: '#2d1a33', accent: '#8844aa', text: '#ffffff', sub: 'rgba(255,255,255,0.7)' },
  'Pendidikan Pancasila':           { bg: '#1a2d1a', accent: '#3b823b', text: '#ffffff', sub: 'rgba(255,255,255,0.7)' },
  'Peng. Bisnis & Ekonomi Digital': { bg: '#2d1a1a', accent: '#aa4444', text: '#ffffff', sub: 'rgba(255,255,255,0.7)' },
}

const DEFAULT_COLOR = { bg: '#181b22', accent: '#3b82f6', text: '#ffffff', sub: 'rgba(255,255,255,0.7)' }

function RenderFileIcon({ type, className }: { type: string; className?: string }) {
  const t = type.toLowerCase()
  if (t.includes('pdf') || t.includes('word') || t.includes('document')) return <FileText className={className} />
  if (t.includes('presentation') || t.includes('powerpoint')) return <Presentation className={className} />
  if (t.includes('sheet') || t.includes('excel')) return <FileSpreadsheet className={className} />
  if (t.includes('image')) return <ImageIcon className={className} />
  if (t.includes('video')) return <Film className={className} />
  if (t.includes('audio')) return <Music className={className} />
  return <FileIcon className={className} />
}

const ACCEPTED = [
  '.pdf', '.doc', '.docx', '.ppt', '.pptx',
  '.xls', '.xlsx', '.txt', '.zip', '.rar',
  '.jpg', '.jpeg', '.png', '.mp4', '.mp3',
].join(',')

export default function MateriPage() {
  const [files, setFiles] = React.useState<StoredFileMeta[]>([])
  const [loading, setLoading] = React.useState(true)
  const [dragging, setDragging] = React.useState(false)
  const [uploadOpen, setUploadOpen] = React.useState(false)
  const [pendingFiles, setPendingFiles] = React.useState<File[]>([])
  const [pendingSubject, setPendingSubject] = React.useState(SUBJECTS[0])
  const [saving, setSaving] = React.useState(false)
  const [search, setSearch] = React.useState('')
  const [filterSubject, setFilterSubject] = React.useState('all')
  const [filterType, setFilterType] = React.useState('all')
  const [previewFile, setPreviewFile] = React.useState<StoredFileMeta | null>(null)

  const inputRef = React.useRef<HTMLInputElement>(null)

  const loadFiles = async () => {
    const storage = await getStorage()
    const all = await storage.getAllFiles('materi')
    setFiles(all)
  }

  // Load from IndexedDB on mount
  React.useEffect(() => {
    loadFiles().finally(() => setLoading(false))
  }, [])

  // Drag & drop handlers
  const onDrop = (e: React.DragEvent) => {
    e.preventDefault()
    setDragging(false)
    const dropped = Array.from(e.dataTransfer.files)
    if (dropped.length > 0) {
      setPendingFiles(dropped)
      setUploadOpen(true)
    }
  }

  const onFileInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selected = Array.from(e.target.files || [])
    if (selected.length > 0) {
      setPendingFiles(selected)
      setUploadOpen(true)
    }
    // reset so the same file can be picked again
    e.target.value = ''
  }

  const handleSave = async () => {
    setSaving(true)
    for (const file of pendingFiles) {
      const storage = await getStorage()
      const arrayBuffer = await file.arrayBuffer()
      await storage.saveFile({
        subjectSlug: '', // or a slug if you map it
        subjectName: pendingSubject,
        name: file.name,
        category: 'materi',
        type: file.type || 'application/octet-stream',
        size: file.size,
        uploadedAt: Date.now(),
      }, arrayBuffer)
    }
    await loadFiles()
    setSaving(false)
    setUploadOpen(false)
    setPendingFiles([])
  }

  const handleDelete = async (id: string) => {
    const storage = await getStorage()
    await storage.deleteFile(id, 'materi')
    await loadFiles()
  }

  const handleReveal = async (file: StoredFileMeta) => {
    const storage = await getStorage()
    if (storage.isNative()) {
      await storage.revealFileInExplorer(file.id, 'materi')
    } else {
      const data = await storage.getFileData(file.id, file.category)
      if (!data) return
      const blob = new Blob([data], { type: file.type })
      const url = URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = file.name
      a.click()
      URL.revokeObjectURL(url)
    }
  }

  // Filtered list
  const filtered = files.filter(f => {
    if (search && !f.name.toLowerCase().includes(search.toLowerCase())) return false
    if (filterSubject !== 'all' && f.subjectName !== filterSubject) return false
    if (filterType === 'pdf' && !f.type.includes('pdf')) return false
    if (filterType === 'word' && !(f.type.includes('word') || f.type.includes('document'))) return false
    if (filterType === 'ppt' && !(f.type.includes('presentation') || f.type.includes('powerpoint'))) return false
    if (filterType === 'excel' && !(f.type.includes('sheet') || f.type.includes('excel'))) return false
    if (filterType === 'image' && !f.type.includes('image')) return false
    return true
  }).sort((a, b) => b.uploadedAt - a.uploadedAt)

  return (
    <div className="flex flex-col h-full min-h-screen">
      {/* Topbar */}
      <header className="flex h-16 shrink-0 items-center justify-between gap-2 border-b px-4 lg:px-6 bg-background">
        <div className="flex items-center gap-3">
          <SidebarTrigger />
          <div className="h-4 w-px bg-border" />
          <div className="flex flex-col">
            <h1 className="font-semibold text-sm">Materi Kuliah</h1>
            <span className="text-xs text-muted-foreground">{files.length} file tersimpan</span>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <OpenInExplorerButton category="materi" />
          <Button size="sm" className="h-8 gap-1.5" onClick={() => inputRef.current?.click()}>
            <Upload className="size-3.5" />
            Upload Materi
          </Button>
        </div>
        <input
          ref={inputRef}
          type="file"
          multiple
          accept={ACCEPTED}
          className="hidden"
          onChange={onFileInputChange}
        />
      </header>

      <main className="flex-1 p-4 lg:p-6 overflow-auto">
        <div className="max-w-5xl mx-auto space-y-5">

          {/* Filter bar */}
          <div className="flex flex-wrap gap-2 items-center">
            <div className="relative flex-1 min-w-[180px]">
              <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 size-3.5 text-muted-foreground" />
              <Input
                placeholder="Cari nama file..."
                value={search}
                onChange={e => setSearch(e.target.value)}
                className="pl-8 h-9 bg-background"
              />
            </div>
            <Select value={filterSubject} onValueChange={v => { if (v) setFilterSubject(v) }}>
              <SelectTrigger className="w-[200px] h-9 bg-background">
                <SelectValue placeholder="Mata Kuliah" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Semua Mata Kuliah</SelectItem>
                {SUBJECTS.map(s => <SelectItem key={s} value={s}>{s}</SelectItem>)}
              </SelectContent>
            </Select>
            <Select value={filterType} onValueChange={v => { if (v) setFilterType(v) }}>
              <SelectTrigger className="w-[140px] h-9 bg-background">
                <SelectValue placeholder="Tipe File" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Semua Tipe</SelectItem>
                <SelectItem value="pdf">PDF</SelectItem>
                <SelectItem value="word">Word</SelectItem>
                <SelectItem value="ppt">PowerPoint</SelectItem>
                <SelectItem value="excel">Excel</SelectItem>
                <SelectItem value="image">Gambar</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Drop Zone (when no files / always visible) */}
          <div
            onDragOver={e => { e.preventDefault(); setDragging(true) }}
            onDragLeave={() => setDragging(false)}
            onDrop={onDrop}
            onClick={() => inputRef.current?.click()}
            className={`
              flex flex-col items-center justify-center gap-3 p-8 rounded-xl border-2 border-dashed cursor-pointer
              transition-colors duration-200
              ${dragging
                ? 'border-primary bg-primary/5'
                : 'border-border/60 bg-muted/10 hover:border-primary/40 hover:bg-muted/20'}
            `}
          >
            <div className="flex items-center justify-center size-12 rounded-full bg-muted">
              <FolderOpen className={`size-6 ${dragging ? 'text-primary' : 'text-muted-foreground'}`} />
            </div>
            <div className="text-center">
              <p className="font-medium text-sm text-foreground">
                {dragging ? 'Lepas file di sini' : 'Drag & drop atau klik untuk upload'}
              </p>
              <p className="text-xs text-muted-foreground mt-1">
                PDF, Word, PPT, Excel, gambar, video, ZIP — tersimpan lokal di browser
              </p>
            </div>
          </div>

          {/* File list */}
          {loading ? (
            <div className="text-center py-8 text-muted-foreground text-sm">Memuat...</div>
          ) : filtered.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground text-sm">
              {files.length === 0 ? 'Belum ada materi. Upload file di atas!' : 'Tidak ada file yang sesuai filter.'}
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
              {filtered.map(file => {
                const color = SUBJECT_COLORS[file.subjectName] || DEFAULT_COLOR
                const isLight = color.bg === '#E8E085'
                const overlayBg = isLight ? 'rgba(0,0,0,0.08)' : 'rgba(0,0,0,0.22)'
                const borderColor = isLight ? 'rgba(0,0,0,0.08)' : 'rgba(255,255,255,0.1)'

                return (
                  <div
                    key={file.id}
                    onClick={() => setPreviewFile(file)}
                      className="group relative flex flex-col justify-between rounded-xl overflow-hidden p-4 transition-all duration-200 cursor-pointer"
                    style={{
                      background: color.bg,
                      boxShadow: '0 2px 10px rgba(0,0,0,0.35)',
                    }}
                    onMouseEnter={e => {
                      (e.currentTarget as HTMLDivElement).style.boxShadow = `0 8px 24px rgba(0,0,0,0.5), 0 0 0 1px ${color.accent}55`
                      ;(e.currentTarget as HTMLDivElement).style.transform = 'translateY(-2px) scale(1.015)'
                    }}
                    onMouseLeave={e => {
                      (e.currentTarget as HTMLDivElement).style.boxShadow = '0 2px 10px rgba(0,0,0,0.35)'
                      ;(e.currentTarget as HTMLDivElement).style.transform = 'none'
                    }}
                  >
                    <div className="flex flex-col gap-3">
                      {/* Top Row: File icon & Info */}
                      <div className="flex items-start gap-3">
                        <div
                          className="flex items-center justify-center size-10 rounded-lg shrink-0 mt-0.5"
                          style={{ background: overlayBg, color: color.text }}
                        >
                          <FilePreview file={file} colorText={color.text} />
                        </div>
                        <div className="flex-1 min-w-0">
                          <p
                            className="font-bold text-sm leading-snug line-clamp-2 break-all"
                            style={{ color: color.text }}
                          >
                            {file.name}
                          </p>
                          <p className="text-[11px] mt-1 font-medium" style={{ color: color.sub }}>
                            {formatSize(file.size)} · {new Date(file.uploadedAt).toLocaleDateString('id-ID', { day: 'numeric', month: 'short', year: 'numeric' })}
                          </p>
                        </div>
                      </div>

                      {/* Subject chip */}
                      <div className="flex items-center gap-1.5 flex-wrap">
                        <span
                          className="inline-flex items-center rounded-md px-2 py-0.5 text-[10px] font-bold tracking-wide"
                          style={{ background: overlayBg, color: color.text }}
                        >
                          {file.subjectName}
                        </span>
                      </div>
                    </div>

                    {/* Actions */}
                    <div
                      className="flex items-center gap-2 pt-3 mt-3 border-t"
                      style={{ borderColor }}
                    >
                      <button
                        onClick={(e) => { e.stopPropagation(); handleReveal(file); }}
                        className="flex-1 flex items-center justify-center gap-1.5 h-8 rounded-lg text-xs font-semibold transition-all hover:opacity-90 active:scale-95"
                        style={{
                          background: overlayBg,
                          color: color.text,
                        }}
                      >
                        <FolderOpen className="size-3.5" />
                        Buka di Explorer
                      </button>
                      <button
                        onClick={(e) => { e.stopPropagation(); handleDelete(file.id); }}
                        className="flex items-center justify-center size-8 rounded-lg transition-all hover:bg-red-500/20 text-red-400 active:scale-95 shrink-0"
                        title="Hapus file"
                      >
                        <Trash2 className="size-3.5" />
                      </button>
                    </div>
                  </div>
                )
              })}
            </div>
          )}
        </div>
      </main>

      {/* Upload confirm Dialog */}
      <Dialog open={uploadOpen} onOpenChange={setUploadOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Upload {pendingFiles.length} File</DialogTitle>
          </DialogHeader>

          <div className="space-y-4 py-2">
            {/* File list preview */}
            <ScrollArea className="max-h-48 rounded-lg border border-border/60 bg-muted/20">
              <div className="p-3 space-y-2">
                {pendingFiles.map((f, i) => (
                  <div key={i} className="flex items-center gap-2 text-sm">
                    <RenderFileIcon type={f.type || ''} className="size-4 shrink-0 text-muted-foreground" />
                    <span className="flex-1 truncate text-foreground">{f.name}</span>
                    <span className="text-muted-foreground text-[11px] shrink-0">{formatSize(f.size)}</span>
                    <button
                      className="text-muted-foreground hover:text-destructive"
                      onClick={() => setPendingFiles(prev => prev.filter((_, idx) => idx !== i))}
                    >
                      <X className="size-3.5" />
                    </button>
                  </div>
                ))}
              </div>
            </ScrollArea>

            {/* Subject picker */}
            <div className="space-y-1.5">
              <label className="text-sm font-medium">Mata Kuliah</label>
              <Select value={pendingSubject} onValueChange={v => { if (v) setPendingSubject(v) }}>
                <SelectTrigger className="w-full h-9 bg-background">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent className="max-h-56">
                  {SUBJECTS.map(s => <SelectItem key={s} value={s}>{s}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => { setUploadOpen(false); setPendingFiles([]) }}>
              Batal
            </Button>
            <Button onClick={handleSave} disabled={saving || pendingFiles.length === 0}>
              {saving ? 'Menyimpan...' : `Simpan ${pendingFiles.length} File`}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Preview Dialog */}
      <Dialog open={!!previewFile} onOpenChange={open => !open && setPreviewFile(null)}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-hidden p-0 border-none bg-black/95">
          {previewFile && (
            <div className="relative w-full h-full min-h-[500px] flex items-center justify-center p-4">
              <FilePreview file={previewFile} fullSize className="w-full h-full" />
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  )
}
