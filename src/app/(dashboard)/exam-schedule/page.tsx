'use client'

import * as React from 'react'
import useSWR from 'swr'
import { SidebarTrigger } from '@/components/ui/sidebar'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import {
  CalendarDays,
  Clock,
  MapPin,
  User,
  RefreshCw,
  Search,
  AlertCircle,
  FileText,
  Building2,
  Navigation,
  Info,
  CheckCircle2,
} from 'lucide-react'
import { fetcher, ENDPOINTS } from '@/lib/api'
import { useProfileStore } from '@/store/useProfileStore'


interface UTSItem {
  nama: string
  waktu: string
  ruang: string
  dosen: string
}

const CAMPUS_LOCATIONS: Record<string, string> = {
  A: 'Jalan Kenari III / 5 Jakarta',
  C: 'Jalan Salemba Raya 53 Jakarta',
  D: 'Jalan Margonda Raya 100 Pondok Cina - Depok',
  E: 'Jalan Akses, Kelapa Dua, Cimanggis',
  G: 'Jalan Akses, Kelapa Dua, Cimanggis',
  H: 'Jalan Akses, Kelapa Dua, Cimanggis',
}

function parseRoom(roomRaw: string) {
  const clean = roomRaw.replace(/\s+/g, '').toUpperCase()
  const campusMatch = clean.match(/^[A-Z]/)
  const numberMatch = clean.match(/\d{3}/)

  if (!campusMatch || !numberMatch) {
    return { campus: '-', location: '-', gedung: '-', lantai: '-', ruang: '-', raw: roomRaw }
  }

  const campus = campusMatch[0]
  const numbers = numberMatch[0]
  return {
    campus: `Kampus ${campus}`,
    location: CAMPUS_LOCATIONS[campus] || 'Lokasi tidak diketahui',
    gedung: numbers[0],
    lantai: numbers[1],
    ruang: numbers[2],
    raw: roomRaw,
  }
}

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

function getSubjectColor(nama: string) {
  const clean = nama.toLowerCase()
  for (const [key, val] of Object.entries(SUBJECT_COLORS)) {
    if (clean.includes(key.toLowerCase()) || key.toLowerCase().includes(clean)) {
      return val
    }
  }
  return DEFAULT_COLOR
}

export default function ExamSchedulePage() {
  const [search, setSearch] = React.useState('')
  const [selectedExam, setSelectedExam] = React.useState<UTSItem | null>(null)
  const [dialogOpen, setDialogOpen] = React.useState(false)
  const { kelas: profileKelas } = useProfileStore()

  const currentClass = (profileKelas || '1KA02').toUpperCase()
  const classParam = (profileKelas || '1ka02').toLowerCase()

  const { data, error, isLoading, isValidating, mutate } = useSWR<{ success: boolean; data: UTSItem[] | null }>(
    ENDPOINTS.uts(classParam),
    fetcher,
    {
      revalidateOnFocus: false,
    }
  )

  const rawExams = Array.isArray(data?.data) ? data.data : []
  const hasData = rawExams.length > 0

  const filteredExams = rawExams.filter(item => {
    if (!search) return true
    const q = search.toLowerCase()
    return (
      item.nama.toLowerCase().includes(q) ||
      item.ruang.toLowerCase().includes(q) ||
      item.dosen.toLowerCase().includes(q)
    )
  })

  const handleExamClick = (exam: UTSItem) => {
    setSelectedExam(exam)
    setDialogOpen(true)
  }

  const roomInfo = selectedExam ? parseRoom(selectedExam.ruang) : null

  return (
    <div className="flex flex-col h-full min-h-screen">
      {/* Topbar */}
      <header className="flex h-16 shrink-0 items-center justify-between gap-2 border-b px-4 lg:px-6 bg-background">
        <div className="flex items-center gap-3">
          <SidebarTrigger />
          <div className="h-4 w-px bg-border" />
          <div>
            <h1 className="font-semibold text-sm">Jadwal UTS & UAS</h1>
            <span className="text-xs text-muted-foreground hidden sm:inline">
              Semester Ganjil 2026/2027 · Kelas {currentClass}
            </span>
          </div>
        </div>


        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            className="h-8 gap-1.5 text-xs"
            onClick={() => mutate()}
            disabled={isValidating}
          >
            <RefreshCw className={`size-3.5 ${isValidating ? 'animate-spin' : ''}`} />
            <span className="hidden sm:inline">Refresh BAAK</span>
          </Button>
        </div>
      </header>

      {/* Main Content */}
      <main className="flex-1 p-4 lg:p-6 overflow-auto">
        <div className="max-w-5xl mx-auto space-y-6">

          {/* Status Header Banner */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-4 rounded-xl border bg-card/60">
            <div className="flex items-center gap-2.5">
              <span className="relative flex h-2.5 w-2.5">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-emerald-500"></span>
              </span>
              <div>
                <p className="text-xs font-semibold">Terkoneksi ke BAAK Gunadarma</p>
                <p className="text-[11px] text-muted-foreground">Endpoint: /jadwal/cariUts?teks={classParam}</p>
              </div>

            </div>

            <Badge variant="outline" className="w-fit text-[11px] font-normal">
              {hasData ? `${filteredExams.length} Jadwal Ujian Tersedia` : 'Belum Ada Jadwal Rilis'}
            </Badge>
          </div>

          {/* Loading State */}
          {isLoading ? (
            <div className="space-y-4">
              <div className="h-9 w-64 bg-muted/40 animate-pulse rounded-lg" />
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                {[1, 2, 3, 4, 5, 6].map(i => (
                  <div key={i} className="h-36 bg-muted/30 animate-pulse rounded-xl border" />
                ))}
              </div>
            </div>
          ) : error ? (
            /* Error State */
            <div className="flex flex-col items-center justify-center p-12 text-center rounded-2xl border border-destructive/20 bg-destructive/5 gap-3">
              <AlertCircle className="size-10 text-destructive" />
              <h3 className="font-semibold text-base">Gagal Memuat Data dari BAAK</h3>
              <p className="text-xs text-muted-foreground max-w-md">
                Terjadi kendala saat menghubungi server BAAK Gunadarma. Silakan coba beberapa saat lagi.
              </p>
              <Button size="sm" variant="outline" onClick={() => mutate()} className="mt-2 text-xs">
                Coba Lagi
              </Button>
            </div>
          ) : !hasData ? (
            /* Empty State (BAAK hasn't released UTS/UAS yet) */
            <div className="flex flex-col items-center justify-center py-16 px-6 text-center rounded-2xl border bg-card gap-4">
              <div className="flex items-center justify-center size-16 rounded-full bg-primary/10 text-primary">
                <CalendarDays className="size-8" />
              </div>
              <div className="space-y-1.5 max-w-md">
                <h3 className="font-bold text-lg text-foreground">Jadwal UTS/UAS Belum Dirilis</h3>
                <p className="text-sm text-muted-foreground leading-relaxed">
                  Pihak BAAK Gunadarma belum menerbitkan jadwal resmi UTS maupun UAS untuk kelas <span className="font-semibold text-foreground">{currentClass}</span>.
                </p>

              </div>

              <div className="flex flex-wrap items-center justify-center gap-2 pt-2">
                <Button
                  size="sm"
                  variant="secondary"
                  className="gap-1.5 text-xs h-9"
                  onClick={() => mutate()}
                  disabled={isValidating}
                >
                  <RefreshCw className={`size-3.5 ${isValidating ? 'animate-spin' : ''}`} />
                  Cek Ulang Sekarang
                </Button>
              </div>

              {/* Informational tips */}
              <div className="mt-6 p-4 rounded-xl bg-muted/30 border text-left max-w-lg w-full flex gap-3 items-start">
                <Info className="size-4 text-muted-foreground shrink-0 mt-0.5" />
                <div className="text-xs text-muted-foreground space-y-1">
                  <p className="font-medium text-foreground">Informasi Seputar Ujian BAAK:</p>
                  <ul className="list-disc pl-4 space-y-0.5">
                    <li>Jadwal UTS biasanya diterbitkan 1–2 minggu sebelum pekan ujian.</li>
                    <li>Sistem ini akan otomatis menampilkan jadwal lengkap setelah BAAK merilisnya.</li>
                    <li>Jangan lupa persiapkan KRS dan Kartu Ujian fisik saat hari H.</li>
                  </ul>
                </div>
              </div>
            </div>
          ) : (
            /* Populated State (When BAAK publishes the schedule) */
            <div className="space-y-4">
              {/* Search Bar */}
              <div className="flex items-center gap-2">
                <div className="relative flex-1 max-w-sm">
                  <Search className="absolute left-2.5 top-2.5 size-4 text-muted-foreground" />
                  <Input
                    placeholder="Cari mata kuliah, ruang, dosen..."
                    value={search}
                    onChange={e => setSearch(e.target.value)}
                    className="pl-8 h-9 text-xs bg-background"
                  />
                </div>
              </div>

              {/* Grid of Exam Cards */}
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                {filteredExams.map((exam, idx) => {
                  const color = getSubjectColor(exam.nama)
                  const isLight = color.bg === '#E8E085'
                  const overlayBg = isLight ? 'rgba(0,0,0,0.08)' : 'rgba(0,0,0,0.22)'

                  return (
                    <div
                      key={idx}
                      onClick={() => handleExamClick(exam)}
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
                      <div className="space-y-3">
                        {/* Time chip & Room */}
                        <div className="flex items-center justify-between gap-2">
                          <span
                            className="inline-flex items-center gap-1 rounded-md px-2 py-0.5 text-[10px] font-bold tracking-wide"
                            style={{ background: overlayBg, color: color.text }}
                          >
                            <Clock className="size-3" />
                            {exam.waktu || 'Waktu Belum Ada'}
                          </span>
                          <span
                            className="inline-flex items-center gap-1 rounded-md px-2 py-0.5 text-[10px] font-bold"
                            style={{ background: overlayBg, color: color.text }}
                          >
                            <MapPin className="size-3" />
                            {exam.ruang || '-'}
                          </span>
                        </div>

                        {/* Course Name */}
                        <div>
                          <h4
                            className="font-bold text-sm leading-snug line-clamp-2"
                            style={{ color: color.text }}
                          >
                            {exam.nama}
                          </h4>
                        </div>
                      </div>

                      {/* Lecturer / Pengawas */}
                      <div className="pt-3 mt-3 border-t border-white/10 flex items-center gap-1.5 text-xs">
                        <User className="size-3 shrink-0" style={{ color: color.sub }} />
                        <span className="truncate italic text-[11px]" style={{ color: color.sub }}>
                          {exam.dosen || 'Pengawas BAAK'}
                        </span>
                      </div>
                    </div>
                  )
                })}
              </div>
            </div>
          )}
        </div>
      </main>

      {/* Room Detail Dialog */}
      {selectedExam && (
        <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
          <DialogContent className="sm:max-w-[425px]">
            <DialogHeader>
              <DialogTitle className="text-lg leading-snug pr-6">
                {selectedExam.nama}
              </DialogTitle>
            </DialogHeader>

            <div className="space-y-4 py-2 mt-2">
              {/* Waktu */}
              <div className="flex items-start gap-3">
                <div className="bg-primary/10 p-2 rounded-md shrink-0">
                  <Clock className="size-5 text-primary" />
                </div>
                <div>
                  <p className="text-[10px] text-muted-foreground font-semibold uppercase tracking-wider">
                    Jadwal Ujian
                  </p>
                  <p className="font-semibold text-sm text-foreground mt-0.5">
                    {selectedExam.waktu}
                  </p>
                </div>
              </div>

              {/* Dosen/Pengawas */}
              <div className="flex items-start gap-3">
                <div className="bg-primary/10 p-2 rounded-md shrink-0">
                  <User className="size-5 text-primary" />
                </div>
                <div>
                  <p className="text-[10px] text-muted-foreground font-semibold uppercase tracking-wider">
                    Pengawas / Dosen
                  </p>
                  <p className="font-semibold text-sm text-foreground mt-0.5">
                    {selectedExam.dosen || 'Pengawas BAAK'}
                  </p>
                </div>
              </div>

              {/* Lokasi Ruang */}
              {roomInfo && roomInfo.campus !== '-' && (
                <div className="bg-muted/40 p-3.5 rounded-xl space-y-2 border">
                  <p className="text-xs font-semibold flex items-center gap-1.5 text-foreground">
                    <Building2 className="size-4 text-primary" /> Detail Lokasi Ruangan
                  </p>
                  <div className="grid grid-cols-3 gap-2 text-center text-xs py-1">
                    <div className="bg-background p-2 rounded-lg border">
                      <span className="text-[10px] text-muted-foreground block">Gedung</span>
                      <span className="font-bold text-sm">{roomInfo.gedung}</span>
                    </div>
                    <div className="bg-background p-2 rounded-lg border">
                      <span className="text-[10px] text-muted-foreground block">Lantai</span>
                      <span className="font-bold text-sm">{roomInfo.lantai}</span>
                    </div>
                    <div className="bg-background p-2 rounded-lg border">
                      <span className="text-[10px] text-muted-foreground block">Ruang</span>
                      <span className="font-bold text-sm">{roomInfo.ruang}</span>
                    </div>
                  </div>
                  <div className="text-xs text-muted-foreground flex items-center gap-1.5 pt-1">
                    <Navigation className="size-3.5 text-primary shrink-0" />
                    <span>{roomInfo.campus} · {roomInfo.location}</span>
                  </div>
                </div>
              )}
            </div>
          </DialogContent>
        </Dialog>
      )}
    </div>
  )
}
