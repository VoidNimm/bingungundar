'use client'

import * as React from 'react'
import { SidebarTrigger } from '@/components/ui/sidebar'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Progress } from '@/components/ui/progress'
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
import { Input } from '@/components/ui/input'
import { Plus, Trash2, CheckCircle, XCircle, AlertCircle, MinusCircle, TrendingUp } from 'lucide-react'
import { useAttendanceStore, AttendanceStatus } from '@/store/useAcademicStore'

const STATUS_CONFIG: Record<AttendanceStatus, { label: string; icon: React.ElementType; cls: string; dot: string }> = {
  hadir:  { label: 'Hadir',  icon: CheckCircle,  cls: 'text-emerald-500', dot: 'bg-emerald-500' },
  izin:   { label: 'Izin',   icon: AlertCircle,  cls: 'text-amber-500',   dot: 'bg-amber-500' },
  sakit:  { label: 'Sakit',  icon: MinusCircle,  cls: 'text-blue-400',    dot: 'bg-blue-400' },
  alpha:  { label: 'Alpha',  icon: XCircle,      cls: 'text-destructive', dot: 'bg-destructive' },
}

const DEFAULT_SUBJECTS = [
  'Fisika & Kimia Dasar',
  'Konsep Sistem & Teknik SI',
  'Algoritma & Pemrograman',
  'Matematika Dasar',
  'Digital Citizenship',
  'Ilmu Sosial & Budaya Dasar',
  'Pendidikan Pancasila',
  'Peng. Bisnis & Ekonomi Digital',
]

const courseOptions = DEFAULT_SUBJECTS.map(s => ({ id: s, nama: s }))

export default function AttendancePage() {
  const { records, addRecord, updateRecord, deleteRecord } = useAttendanceStore()
  const [open, setOpen] = React.useState(false)
  const [form, setForm] = React.useState({
    courseId: '',
    courseName: '',
    date: new Date().toISOString().slice(0, 10),
    status: 'hadir' as AttendanceStatus,
    catatan: '',
  })
  const [filterCourse, setFilterCourse] = React.useState('all')

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault()
    if (!form.date) return
    const courseName = form.courseId
      ? courseOptions.find(c => c.id === form.courseId)?.nama || form.courseName
      : form.courseName
    if (!courseName) return
    addRecord({ ...form, courseName })
    setOpen(false)
    setForm({
      courseId: '',
      courseName: '',
      date: new Date().toISOString().slice(0, 10),
      status: 'hadir',
      catatan: '',
    })
  }

  const filtered = filterCourse === 'all'
    ? records
    : records.filter(r => r.courseId === filterCourse || r.courseName === filterCourse)

  // Sort newest first
  const sorted = [...filtered].sort((a, b) => b.date.localeCompare(a.date))

  // ── Stats per course ──────────────────────────────────────────────────────
  const courseNames = [...new Set(records.map(r => r.courseName))]

  const getStats = (name: string) => {
    const recs = records.filter(r => r.courseName === name)
    const total = recs.length
    const hadir = recs.filter(r => r.status === 'hadir').length
    const pct = total === 0 ? 0 : Math.round((hadir / total) * 100)
    return { total, hadir, pct }
  }

  // Overall
  const totalAll = records.length
  const hadirAll = records.filter(r => r.status === 'hadir').length
  const pctAll = totalAll === 0 ? 0 : Math.round((hadirAll / totalAll) * 100)

  return (
    <div className="flex flex-col h-full min-h-screen">
      <header className="flex h-16 shrink-0 items-center justify-between gap-2 border-b px-4 lg:px-6 bg-background">
        <div className="flex items-center gap-3">
          <SidebarTrigger />
          <div className="h-4 w-px bg-border" />
          <div>
            <h1 className="font-semibold text-sm">Presensi Kuliah</h1>
            <span className="text-xs text-muted-foreground">{records.length} catatan tersimpan</span>
          </div>
        </div>
        <button onClick={() => setOpen(true)}>
          <Button size="sm" className="h-8 gap-1.5">
            <Plus className="size-3.5" /> Catat Kehadiran
          </Button>
        </button>
      </header>

      <main className="flex-1 p-4 lg:p-6 overflow-auto">
        <div className="max-w-4xl mx-auto space-y-5">

          {/* ── Overall progress card ── */}
          {records.length > 0 && (
            <Card className="p-5">
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-2">
                  <TrendingUp className="size-4 text-primary" />
                  <span className="font-semibold text-sm">Kehadiran Keseluruhan</span>
                </div>
                <span className={`text-2xl font-bold tabular-nums ${pctAll >= 75 ? 'text-emerald-500' : pctAll >= 50 ? 'text-amber-500' : 'text-destructive'}`}>
                  {pctAll}%
                </span>
              </div>
              <Progress value={pctAll} className="h-2.5" />
              <div className="flex gap-4 mt-3 text-xs text-muted-foreground flex-wrap">
                <span className="text-emerald-500 font-medium">✓ {records.filter(r=>r.status==='hadir').length} hadir</span>
                <span className="text-amber-500 font-medium">! {records.filter(r=>r.status==='izin').length} izin</span>
                <span className="text-blue-400 font-medium">~ {records.filter(r=>r.status==='sakit').length} sakit</span>
                <span className="text-destructive font-medium">✗ {records.filter(r=>r.status==='alpha').length} alpha</span>
                <span className="ml-auto">Batas minimum kehadiran: 75%</span>
              </div>
            </Card>
          )}

          {/* ── Per-course progress ── */}
          {courseNames.length > 0 && (
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
              {courseNames.map(name => {
                const s = getStats(name)
                return (
                  <Card key={name} className="p-3">
                    <p className="text-[11px] font-medium text-foreground truncate mb-2">{name}</p>
                    <div className="flex items-center gap-2">
                      <Progress value={s.pct} className="h-1.5 flex-1" />
                      <span className={`text-xs font-bold tabular-nums shrink-0 ${s.pct >= 75 ? 'text-emerald-500' : s.pct >= 50 ? 'text-amber-500' : 'text-destructive'}`}>
                        {s.pct}%
                      </span>
                    </div>
                    <p className="text-[10px] text-muted-foreground mt-1">{s.hadir}/{s.total} pertemuan</p>
                  </Card>
                )
              })}
            </div>
          )}

          {/* ── Filter ── */}
          {records.length > 0 && (
            <Select value={filterCourse} onValueChange={v => { if (v) setFilterCourse(v) }}>
              <SelectTrigger className="w-[220px] h-9 bg-background">
                <SelectValue placeholder="Filter Mata Kuliah" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Semua Mata Kuliah</SelectItem>
                {courseNames.map(n => <SelectItem key={n} value={n}>{n}</SelectItem>)}
              </SelectContent>
            </Select>
          )}

          {/* ── Record list ── */}
          {sorted.length === 0 ? (
            <div className="flex flex-col items-center justify-center min-h-[300px] text-center gap-4">
              <div className="flex items-center justify-center size-16 rounded-full bg-muted">
                <CheckCircle className="size-8 text-muted-foreground/40" />
              </div>
              <div>
                <p className="font-medium">Belum ada catatan presensi</p>
                <p className="text-muted-foreground text-sm mt-1">Catat kehadiran kuliah Anda di sini</p>
              </div>
            </div>
          ) : (
            <div className="space-y-2">
              {sorted.map(r => {
                const cfg = STATUS_CONFIG[r.status]
                const Icon = cfg.icon
                return (
                  <Card key={r.id} className="transition-all hover:shadow-sm">
                    <CardContent className="p-3 flex items-center gap-3">
                      <div className={`shrink-0 ${cfg.cls}`}>
                        <Icon className="size-5" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="font-medium text-sm truncate">{r.courseName}</p>
                        <p className="text-xs text-muted-foreground">
                          {new Date(r.date).toLocaleDateString('id-ID', { weekday: 'short', day: 'numeric', month: 'short', year: 'numeric' })}
                          {r.catatan && ` · ${r.catatan}`}
                        </p>
                      </div>
                      <div className="flex items-center gap-2 shrink-0">
                        <Select value={r.status} onValueChange={v => { if (v) updateRecord(r.id, v as AttendanceStatus) }}>
                          <SelectTrigger className="h-7 w-[90px] text-xs border-0 bg-muted">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            {(Object.keys(STATUS_CONFIG) as AttendanceStatus[]).map(s => (
                              <SelectItem key={s} value={s}>{STATUS_CONFIG[s].label}</SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                        <Button variant="ghost" size="icon" className="size-7 text-muted-foreground hover:text-destructive" onClick={() => deleteRecord(r.id)}>
                          <Trash2 className="size-3.5" />
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                )
              })}
            </div>
          )}
        </div>
      </main>

      {/* Add Dialog */}
      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent>
          <DialogHeader><DialogTitle>Catat Kehadiran</DialogTitle></DialogHeader>
          <form onSubmit={handleSave} className="space-y-4 py-2">
            <div className="space-y-2">
              <label className="text-sm font-medium">Mata Kuliah</label>
              <Select
                value={form.courseId || undefined}
                onValueChange={v => {
                  if (v) {
                    const found = courseOptions.find(c => c.id === v)
                    setForm(f => ({ ...f, courseId: v, courseName: found?.nama || v }))
                  }
                }}
              >
                <SelectTrigger className="w-full h-9 bg-background">
                  <SelectValue placeholder="Pilih mata kuliah..." />
                </SelectTrigger>
                <SelectContent className="max-h-56">
                  {courseOptions.map(c => (
                    <SelectItem key={c.id} value={c.id}>
                      {c.nama}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <label className="text-sm font-medium">Tanggal</label>
                <Input type="date" value={form.date} onChange={e => setForm(f => ({ ...f, date: e.target.value }))} required />
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium">Status</label>
                <Select value={form.status} onValueChange={v => { if (v) setForm(f => ({ ...f, status: v as AttendanceStatus })) }}>
                  <SelectTrigger className="w-full h-9 bg-background">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {(Object.keys(STATUS_CONFIG) as AttendanceStatus[]).map(s => (
                      <SelectItem key={s} value={s}>{STATUS_CONFIG[s].label}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium">Catatan (opsional)</label>
              <Input value={form.catatan} onChange={e => setForm(f => ({ ...f, catatan: e.target.value }))} placeholder="cth. Dosen tidak hadir" />
            </div>
            <DialogFooter className="pt-2">
              <Button type="button" variant="outline" onClick={() => setOpen(false)}>Batal</Button>
              <Button type="submit">Simpan</Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  )
}
