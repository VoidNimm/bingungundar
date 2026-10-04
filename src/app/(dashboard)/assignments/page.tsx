'use client'

import * as React from 'react'
import { SidebarTrigger } from '@/components/ui/sidebar'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { CheckCircle2, Circle, Trash2, Plus, Clock, Filter } from 'lucide-react'
import { useTaskStore } from '@/store/useTaskStore'

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

export default function AssignmentsPage() {
  const { tasks, addTask, toggleTask, deleteTask, updateTaskProgress } = useTaskStore()

  const [open, setOpen] = React.useState(false)
  const [title, setTitle] = React.useState('')
  const [subject, setSubject] = React.useState(SUBJECTS[0])
  const [dueDate, setDueDate] = React.useState('')
  const [type, setType] = React.useState<'Tugas' | 'Lainnya'>('Tugas')
  const [filterStatus, setFilterStatus] = React.useState('all')
  const [filterSubject, setFilterSubject] = React.useState('all')



  const handleAdd = (e: React.FormEvent) => {
    e.preventDefault()
    if (!title || !dueDate) return
    addTask({ title, subject: type === 'Tugas' ? subject : undefined, dueDate, type })
    setOpen(false)
    setTitle('')
    setDueDate('')
  }

  const getDeadlineBadge = (dateStr: string): { label: string; cls: string } => {
    // Parse as local midnight to avoid UTC-offset issues (e.g. WIB UTC+7)
    const [y, m, d] = dateStr.split('-').map(Number)
    const due = new Date(y, m - 1, d) // local midnight, not UTC
    const todayLocal = new Date(); todayLocal.setHours(0, 0, 0, 0)
    const diff = Math.round((due.getTime() - todayLocal.getTime()) / 86400000)
    if (diff < 0)  return { label: 'Terlewat', cls: 'bg-destructive/10 text-destructive border-destructive/20' }
    if (diff === 0) return { label: 'Hari ini!', cls: 'bg-red-500/10 text-red-500 border-red-500/20' }
    if (diff === 1) return { label: 'Besok', cls: 'bg-amber-500/10 text-amber-500 border-amber-500/20' }
    if (diff <= 7)  return { label: `${diff} hari lagi`, cls: 'bg-amber-500/10 text-amber-500 border-amber-500/20' }
    return { label: `${diff} hari`, cls: 'bg-muted text-muted-foreground border-border/60' }
  }

  const filtered = tasks.filter(task => {
    if (filterStatus === 'completed' && !task.completed) return false
    if (filterStatus === 'pending' && task.completed) return false
    if (filterSubject !== 'all' && task.subject !== filterSubject) return false
    return true
  }).sort((a, b) => new Date(a.dueDate).getTime() - new Date(b.dueDate).getTime())

  return (
    <div className="flex flex-col h-full min-h-screen">
      <header className="flex h-16 shrink-0 items-center justify-between gap-2 border-b px-4 lg:px-6 bg-background">
        <div className="flex items-center gap-3">
          <SidebarTrigger />
          <div className="h-4 w-px bg-border" />
          <h1 className="font-semibold text-sm">Tugas & Catatan</h1>
        </div>
        <Dialog open={open} onOpenChange={setOpen}>
          <button onClick={() => setOpen(true)}>
            <Button size="sm" className="h-8 gap-1">
              <Plus className="size-4" /> Tambah Tugas
            </Button>
          </button>
          <DialogContent>
            <DialogHeader><DialogTitle>Tambah Tugas Baru</DialogTitle></DialogHeader>
            <form onSubmit={handleAdd} className="space-y-4 py-4">
              <div className="space-y-2">
                <label className="text-sm font-medium">Judul Tugas</label>
                <Input value={title} onChange={e => setTitle(e.target.value)} placeholder="Contoh: Makalah Fisika" required />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <label className="text-sm font-medium">Jenis</label>
                  <Select value={type} onValueChange={(v) => { if (v) setType(v as 'Tugas' | 'Lainnya') }}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="Tugas">Tugas Kuliah</SelectItem>
                      <SelectItem value="Lainnya">Lainnya</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                {type === 'Tugas' && (
                  <div className="space-y-2">
                    <label className="text-sm font-medium">Mata Kuliah</label>
                    <Select value={subject} onValueChange={(v) => { if (v) setSubject(v) }}>
                      <SelectTrigger><SelectValue /></SelectTrigger>
                      <SelectContent>
                        {SUBJECTS.map(s => <SelectItem key={s} value={s}>{s}</SelectItem>)}
                      </SelectContent>
                    </Select>
                  </div>
                )}
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium">Tenggat Waktu</label>
                <Input type="date" value={dueDate} onChange={e => setDueDate(e.target.value)} required />
              </div>
              <DialogFooter className="pt-2">
                <Button type="button" variant="outline" onClick={() => setOpen(false)}>Batal</Button>
                <Button type="submit">Simpan</Button>
              </DialogFooter>
            </form>
          </DialogContent>
        </Dialog>
      </header>

      <main className="flex-1 p-4 lg:p-6 overflow-auto">
        <div className="max-w-4xl mx-auto space-y-5">

          {/* ── Filters ── */}
          <div className="flex flex-col sm:flex-row gap-3">
            <div className="flex items-center gap-2 text-sm text-muted-foreground mr-2">
              <Filter className="size-4" /> Filter:
            </div>
            <Select value={filterStatus} onValueChange={(v) => { if (v) setFilterStatus(v) }}>
              <SelectTrigger className="w-[160px] h-9 bg-background">
                <SelectValue placeholder="Status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Semua Status</SelectItem>
                <SelectItem value="pending">Belum Selesai</SelectItem>
                <SelectItem value="completed">Selesai</SelectItem>
              </SelectContent>
            </Select>
            <Select value={filterSubject} onValueChange={(v) => { if (v) setFilterSubject(v) }}>
              <SelectTrigger className="w-[200px] h-9 bg-background">
                <SelectValue placeholder="Mata Kuliah" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Semua Mata Kuliah</SelectItem>
                {SUBJECTS.map(s => <SelectItem key={s} value={s}>{s}</SelectItem>)}
              </SelectContent>
            </Select>
          </div>

          {/* ── Task list ── */}
          <div className="flex flex-col gap-2">
            {filtered.length === 0 ? (
              <div className="text-center py-12 text-muted-foreground bg-background rounded-lg border border-dashed">
                {tasks.length === 0 ? 'Belum ada tugas. Tambah tugas baru di atas!' : 'Tidak ada tugas yang sesuai filter.'}
              </div>
            ) : (
              filtered.map(task => {
                const dl = getDeadlineBadge(task.dueDate)
                const currentProgress = task.progress || 0
                const [y, m, d] = task.dueDate.split('-').map(Number)
                const dueDateFormatted = new Date(y, m - 1, d).toLocaleDateString('id-ID', { day: 'numeric', month: 'short' })

                return (
                  <div
                    key={task.id}
                    className={`group relative flex flex-col gap-2 px-4 py-3 rounded-xl border bg-card transition-all hover:ring-1 hover:ring-foreground/10 ${
                      task.completed ? 'opacity-50' : ''
                    }`}
                  >
                    {/* ── Top row: checkbox · title · badges · date/deadline ── */}
                    <div className="flex items-center gap-3 min-w-0">
                      {/* Checkbox */}
                      <button
                        onClick={() => toggleTask(task.id)}
                        className="shrink-0 text-muted-foreground hover:text-primary transition-colors"
                        aria-label={task.completed ? 'Tandai belum selesai' : 'Tandai selesai'}
                      >
                        {task.completed
                          ? <CheckCircle2 className="size-4 text-primary" />
                          : <Circle className="size-4" />
                        }
                      </button>

                      {/* Title */}
                      <p className={`font-semibold text-sm flex-1 min-w-0 truncate ${task.completed ? 'line-through text-muted-foreground' : 'text-foreground'}`}>
                        {task.title}
                      </p>

                      {/* Mata kuliah badge */}
                      {task.subject && (
                        <span className="hidden sm:inline-flex shrink-0 text-[10px] font-medium px-2 py-0.5 rounded-full bg-muted text-muted-foreground border border-border/60 truncate max-w-[140px]">
                          {task.subject}
                        </span>
                      )}

                      {/* Type badge */}
                      <span className="shrink-0 text-[10px] font-medium px-2 py-0.5 rounded-full bg-muted/60 text-muted-foreground border border-border/40">
                        {task.type}
                      </span>

                      {/* Date + deadline chip */}
                      {!task.completed && (
                        <div className="shrink-0 flex items-center gap-1.5">
                          <span className="text-[10px] text-muted-foreground flex items-center gap-0.5 whitespace-nowrap">
                            <Clock className="size-2.5" />
                            {dueDateFormatted}
                          </span>
                          <span className={`text-[10px] font-semibold px-2 py-0.5 rounded-full border whitespace-nowrap ${dl.cls}`}>
                            {dl.label}
                          </span>
                        </div>
                      )}

                      {/* Delete button - appears on hover */}
                      <button
                        onClick={() => deleteTask(task.id)}
                        className="shrink-0 opacity-0 group-hover:opacity-100 transition-opacity text-muted-foreground hover:text-destructive p-0.5"
                        aria-label="Hapus tugas"
                      >
                        <Trash2 className="size-3.5" />
                      </button>
                    </div>

                    {/* ── Bottom row: progress bar + value ── */}
                    <div className="relative flex items-center gap-2 pl-7">
                      <div className="flex-1 h-1.5 rounded-full bg-muted overflow-hidden">
                        <div
                          className="h-full rounded-full transition-all duration-300"
                          style={{
                            width: `${currentProgress}%`,
                            background: currentProgress >= 100
                              ? 'oklch(0.7 0.17 142)'    // green
                              : currentProgress >= 60
                              ? 'oklch(0.6 0.2 250)'     // primary blue-purple
                              : currentProgress >= 30
                              ? 'oklch(0.75 0.18 70)'    // amber
                              : 'oklch(0.5 0 0)',        // gray
                          }}
                        />
                      </div>
                      <span className="text-[10px] tabular-nums text-muted-foreground w-7 text-right shrink-0">
                        {currentProgress}%
                      </span>

                      {/* Invisible range input overlaid on bar */}
                      {!task.completed && (
                        <input
                          type="range"
                          min="0" max="100" step="5"
                          value={currentProgress}
                          onChange={e => updateTaskProgress(task.id, Number(e.target.value))}
                          className="absolute inset-x-7 top-0 h-1.5 w-[calc(100%-1.75rem-2.25rem)] opacity-0 cursor-pointer z-10"
                          title="Geser untuk mengatur progress"
                        />
                      )}
                    </div>
                  </div>
                )
              })
            )}
          </div>
        </div>
      </main>
    </div>
  )
}
