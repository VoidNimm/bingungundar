'use client'

import * as React from 'react'
import useSWR from 'swr'
import { fetcher, ENDPOINTS } from '@/lib/api'
import { MapPin, AlertCircle, CalendarDays, Filter, User, Clock, Building2, Layers, DoorOpen, Map } from 'lucide-react'
import { SidebarTrigger } from '@/components/ui/sidebar'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Card } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Skeleton } from '@/components/ui/skeleton'
import { Button } from '@/components/ui/button'
import { ScrollArea } from '@/components/ui/scroll-area'



import { useJadwalStore, JadwalItem as StoreJadwalItem } from '@/store/useJadwalStore'
import { useProfileStore } from '@/store/useProfileStore'

const DAYS = ['senin', 'selasa', 'rabu', 'kamis', 'jumat', 'sabtu'] as const

const DAY_COLORS: Record<string, { bg: string; accent: string; text: string; sub: string }> = {
  senin:  { bg: '#030164', accent: '#1a1aff', text: '#ffffff', sub: 'rgba(255,255,255,0.65)' },
  selasa: { bg: '#363199', accent: '#5753d0', text: '#ffffff', sub: 'rgba(255,255,255,0.65)' },
  rabu:   { bg: '#2D7495', accent: '#46a0c4', text: '#ffffff', sub: 'rgba(255,255,255,0.65)' },
  kamis:  { bg: '#E8E085', accent: '#c6bc00', text: '#1a1a00', sub: 'rgba(0,0,0,0.55)' },
  jumat:  { bg: '#1a1a2e', accent: '#4444aa', text: '#ffffff', sub: 'rgba(255,255,255,0.65)' },
  sabtu:  { bg: '#2d1a33', accent: '#8844aa', text: '#ffffff', sub: 'rgba(255,255,255,0.65)' },
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
     raw: roomRaw
  }
}

type JadwalItem = StoreJadwalItem;

export default function SchedulePage() {
  const { jadwalData, setJadwal, lastFetch, kelas: storeKelas } = useJadwalStore()
  const { nama, npm, kelas: profileKelas } = useProfileStore()
  
  const currentClass = (profileKelas || '1KA02').toUpperCase()
  const endpoint = ENDPOINTS.jadwal(currentClass.toLowerCase())

  const { data, error, isLoading } = useSWR(endpoint, fetcher, {
    onSuccess: (d) => {
      const activeKelas = d?.data?.kelas || currentClass
      if (d?.data?.jadwal) {
        setJadwal(d.data.jadwal, activeKelas)
      }
    },
    revalidateOnFocus: false, // Prevent aggressive re-fetching
  })

  // Use cached data if available and matches currentClass, otherwise fallback to newly fetched
  const hasCache = Object.keys(jadwalData).length > 0 && storeKelas === currentClass
  const jadwal = hasCache ? jadwalData : (data?.data?.jadwal || {})
  const isActuallyLoading = isLoading && !hasCache


  const [view, setView] = React.useState('grid')
  const [selectedDays, setSelectedDays] = React.useState<string[]>([...DAYS])
  const [selectedClass, setSelectedClass] = React.useState<{ cls: JadwalItem, day: string } | null>(null)
  const [detailOpen, setDetailOpen] = React.useState(false)

  const toggleDay = (day: string) => {
    setSelectedDays(prev => 
      prev.includes(day) ? prev.filter(d => d !== day) : [...prev, day]
    )
  }

  const handleClassClick = (cls: JadwalItem, day: string) => {
    setSelectedClass({ cls, day })
    setDetailOpen(true)
  }

  const renderContent = () => {
    if (isActuallyLoading) return <ScheduleSkeleton />
    if (error && !hasCache) return (
      <Card className="flex flex-col items-center justify-center p-8 text-center text-muted-foreground min-h-[400px]">
        <AlertCircle className="size-12 mb-4 text-destructive" />
        <h3 className="text-lg font-semibold text-foreground">Gagal memuat jadwal</h3>
        <p className="text-sm">Pastikan server API berjalan (Go Backend)</p>
      </Card>
    )

    if (view === 'grid') {
      const HOUR_HEIGHT = 54
      const TOTAL_HOURS = 12 // 07:00 - 19:00 (18:00 has full hour slot!)
      const GRID_HEIGHT = TOTAL_HOURS * HOUR_HEIGHT // 648px
      // Rest images pick randomly per render
      const restImages = ['/image/rest/claude-eat.png', '/image/rest/rest-man.png']
      const tiredImages = ['/image/tired/tired-man.png', '/image/tired/go-home.png']

      return (
        <ScrollArea orientation="horizontal" className="relative border rounded-xl bg-card w-full">
          <div className="min-w-[760px]">

            {/* Header */}
            <div className="flex border-b border-border/60">
              <div className="w-[56px] shrink-0 border-r border-border/60" />
              {DAYS.map(day => (
                <div 
                  key={day} 
                  className={`flex-1 p-2 text-center text-xs font-medium text-muted-foreground uppercase tracking-widest border-r border-border/60 last:border-r-0 ${!selectedDays.includes(day) && 'hidden'}`}
                >
                  {day}
                </div>
              ))}
            </div>

            {/* Grid Body: 12 hours (07:00–19:00) × 54px = 648px */}
            <div className="relative" style={{ height: `${GRID_HEIGHT}px` }}>
              {/* Hour grid lines + time labels */}
              {Array.from({ length: 13 }).map((_, i) => (
                <div 
                  key={i} 
                  className="absolute w-full flex pointer-events-none"
                  style={{ top: `${i * HOUR_HEIGHT}px` }}
                >
                  <div className="w-[56px] shrink-0 border-r border-border/60 text-[10px] text-muted-foreground text-right pr-2 -mt-2">
                    {String(i + 7).padStart(2, '0')}:00
                  </div>
                  <div className="flex-1 border-t border-border/60" />
                </div>
              ))}

              {/* ── REST ZONE 12:00–13:00 (top: 5 * HOUR_HEIGHT, h: HOUR_HEIGHT) ── */}
              <div 
                className="absolute left-[56px] right-0 z-10 pointer-events-none overflow-hidden border-dashed border-y border-border/60 bg-muted/10"
                style={{ top: `${(12 - 7) * HOUR_HEIGHT}px`, height: `${HOUR_HEIGHT}px` }}
              >
                <div className="relative w-full h-full flex items-center">
                  <span className="absolute left-1/2 -translate-x-1/2 text-muted-foreground/50 text-[9px] uppercase tracking-[0.2em] select-none">
                    Istirahat · 12:00–13:00
                  </span>
                  {restImages.map((src, i) => (
                    <img
                      key={i}
                      src={src}
                      alt="rest"
                      className="absolute bottom-0 object-contain select-none pointer-events-none"
                      style={{
                        height: '48px',
                        width: 'auto',
                        left: i === 0 ? '8%' : '72%',
                        imageRendering: 'pixelated',
                      }}
                    />
                  ))}
                </div>
              </div>

              {/* ── TIRED ZONE 17:00–18:00 (top: 10 * HOUR_HEIGHT, h: HOUR_HEIGHT) ── */}
              <div 
                className="absolute left-[56px] right-0 z-10 pointer-events-none overflow-hidden border-dashed border-y border-border/60 bg-muted/10"
                style={{ top: `${(17 - 7) * HOUR_HEIGHT}px`, height: `${HOUR_HEIGHT}px` }}
              >
                <div className="relative w-full h-full flex items-center">
                  <span className="absolute left-1/2 -translate-x-1/2 text-muted-foreground/50 text-[9px] uppercase tracking-[0.2em] select-none">
                    Pulang · 17:00–18:00
                  </span>
                  {tiredImages.map((src, i) => (
                    <img
                      key={i}
                      src={src}
                      alt="tired"
                      className="absolute bottom-0 object-contain select-none pointer-events-none"
                      style={{
                        height: '48px',
                        width: 'auto',
                        left: i === 0 ? '20%' : '58%',
                        imageRendering: 'pixelated',
                      }}
                    />
                  ))}
                </div>
              </div>

              {/* Course Cards */}
              <div className="absolute top-0 left-[56px] right-0 bottom-0 flex">
                {DAYS.map(day => {
                  if (!selectedDays.includes(day)) return null;
                  const classes: JadwalItem[] = jadwal[day] || [];
                  return (
                    <div key={day} className="flex-1 relative border-r border-border/60 last:border-r-0">
                      {day === 'sabtu' && (
                        <div 
                          className="absolute inset-x-0 flex flex-col items-center justify-center opacity-60 pointer-events-none select-none z-0"
                          style={{ top: `${2 * HOUR_HEIGHT}px`, height: `${3 * HOUR_HEIGHT}px` }}
                        >
                          <img 
                            src="/image/tired/vacation.png" 
                            alt="vacation" 
                            className="object-contain"
                            style={{ imageRendering: 'pixelated', maxHeight: '64px' }}
                          />
                          <span className="text-[9px] text-muted-foreground/70 font-semibold mt-2 tracking-widest uppercase">harusnya libur</span>
                        </div>
                      )}
                      {classes.map((cls, idx) => {
                        const [start, end] = cls.jam.split(' - ')
                        const [startH, startM] = start.split(':').map(Number)
                        const [endH, endM] = end.split(':').map(Number)
                        
                        const top = (startH - 7) * HOUR_HEIGHT + (startM / 60) * HOUR_HEIGHT
                        const durationMins = (endH - startH) * 60 + (endM - startM)
                        const height = (durationMins / 60) * HOUR_HEIGHT
                        const color = DAY_COLORS[day] ?? { hex: '#94a3b8', glow: 'rgba(148,163,184,0.2)', bg: 'rgba(148,163,184,0.06)' }
                        const isTall = height >= 95
                        const isMedium = height >= 48
                        const isShort = height < 48
                        const courseName = cls.nama.replace(/\*|\/\*\*/g, '').trim()



                        return (
                          <div
                            key={idx}
                            onClick={() => handleClassClick(cls, day)}
                            className="absolute left-1 right-1 cursor-pointer group/card"
                            style={{ top: `${top}px`, height: `${height}px`, zIndex: 5 }}
                          >
                            <div
                              className="w-full h-full rounded-xl overflow-hidden flex flex-col transition-all duration-200 group-hover/card:scale-[1.025] group-hover/card:-translate-y-px"
                              style={{
                                background: color.bg,
                                boxShadow: `0 2px 8px rgba(0,0,0,0.35)`,
                                padding: isShort ? '4px 8px' : '8px 9px 7px',
                              }}
                              onMouseEnter={e => {
                                (e.currentTarget as HTMLDivElement).style.boxShadow = `0 6px 20px rgba(0,0,0,0.5), 0 0 0 1px ${color.accent}55`
                              }}
                              onMouseLeave={e => {
                                (e.currentTarget as HTMLDivElement).style.boxShadow = `0 2px 8px rgba(0,0,0,0.35)`
                              }}
                            >
                              {/* Course name + time chip row */}
                              <div className="flex items-start justify-between gap-1 min-w-0">
                                <p
                                  className="font-bold leading-[1.3] min-w-0 flex-1"
                                  style={{
                                    fontSize: isShort ? '10px' : '11px',
                                    color: color.text,
                                    display: '-webkit-box',
                                    WebkitLineClamp: isShort ? 1 : isTall ? 3 : 2,
                                    WebkitBoxOrient: 'vertical',
                                    overflow: 'hidden',
                                  }}
                                >
                                  {courseName}
                                </p>
                                {!isShort && (
                                  <span
                                    className="shrink-0 rounded-md text-[8px] font-semibold tabular-nums leading-none px-1 py-0.5 mt-px"
                                    style={{
                                      background: 'rgba(0,0,0,0.25)',
                                      color: color.text,
                                      letterSpacing: '0.02em',
                                    }}
                                  >
                                    {start}
                                  </span>
                                )}
                              </div>

                              {/* Room pill */}
                              {isMedium && (
                                <div className="flex items-center gap-1 mt-1.5">
                                  <div
                                    className="flex items-center gap-0.5 rounded-md px-1.5 py-0.5"
                                    style={{ background: 'rgba(0,0,0,0.22)' }}
                                  >
                                    <MapPin className="size-2 shrink-0" style={{ color: color.text }} />
                                    <span
                                      className="text-[9px] font-bold tracking-wide"
                                      style={{ color: color.text }}
                                    >
                                      {cls.ruang}
                                    </span>
                                  </div>
                                </div>
                              )}

                              {/* Lecturer */}
                              {isTall && (
                                <p
                                  className="text-[9px] leading-tight mt-1 truncate italic"
                                  style={{ color: color.sub }}
                                >
                                  {cls.dosen}
                                </p>
                              )}
                            </div>
                          </div>
                        )
                      })}
                    </div>
                  )
                })}
              </div>
            </div>
          </div>
        </ScrollArea>
      )


    }

    return (
      <Tabs defaultValue={DAYS.find(d => (jadwal[d] && jadwal[d].length > 0)) || 'senin'} className="w-full">
        <TabsList className="mb-4 flex-wrap h-auto">
          {DAYS.map(day => (
            <TabsTrigger key={day} value={day} disabled={!jadwal[day] || jadwal[day].length === 0} className="capitalize">
              {day}
            </TabsTrigger>
          ))}
        </TabsList>
        {DAYS.map(day => {
          const classes: JadwalItem[] = jadwal[day] || [];
          return (
            <TabsContent key={day} value={day} className="space-y-3 mt-0">
              {classes.length === 0 ? (
                <p className="text-muted-foreground text-sm py-4">Tidak ada jadwal.</p>
              ) : (
                classes.map((cls, idx) => {
                  const color = DAY_COLORS[day] ?? { hex: '#94a3b8', glow: 'rgba(148,163,184,0.2)', bg: 'rgba(148,163,184,0.06)' }
                  return (
                  <div
                    key={idx}
                    onClick={() => handleClassClick(cls, day)}
                    className="flex flex-col sm:flex-row sm:items-center gap-4 rounded-xl p-4 cursor-pointer transition-all duration-200"
                    style={{
                      background: color.bg,
                      boxShadow: '0 2px 8px rgba(0,0,0,0.3)',
                    }}
                    onMouseEnter={e => {
                      (e.currentTarget as HTMLDivElement).style.boxShadow = `0 6px 20px rgba(0,0,0,0.45), 0 0 0 1px ${color.accent}55`
                    }}
                    onMouseLeave={e => {
                      (e.currentTarget as HTMLDivElement).style.boxShadow = '0 2px 8px rgba(0,0,0,0.3)'
                    }}
                  >
                    <span
                      className="w-fit text-sm font-bold tabular-nums rounded-lg px-3 py-1.5 shrink-0"
                      style={{ background: 'rgba(0,0,0,0.25)', color: color.text }}
                    >
                      {cls.jam}
                    </span>
                    <div className="flex-1 min-w-0">
                      <h4 className="font-bold truncate text-sm" style={{ color: color.text }}>{cls.nama.replace(/\*|\/\*\*/g, '').trim()}</h4>
                      <div className="flex items-center gap-3 text-xs mt-1">
                        <span className="flex items-center gap-1 font-semibold" style={{ color: color.sub }}>
                          <MapPin className="size-3" /> {cls.ruang}
                        </span>
                        <span className="truncate" style={{ color: color.sub }}>• {cls.dosen}</span>
                      </div>
                    </div>
                  </div>
                  )
                })
              )}
            </TabsContent>
          )
        })}
      </Tabs>
    )
  }

  const renderDialog = () => {
    if (!selectedClass) return null;
    const { cls, day } = selectedClass;
    const roomInfo = parseRoom(cls.ruang);
    const cleanName = cls.nama.replace(/\*|\/\*\*/g, '').trim();

    return (
      <Dialog open={detailOpen} onOpenChange={setDetailOpen}>
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle className="text-xl leading-snug pr-6">{cleanName}</DialogTitle>
          </DialogHeader>

          <div className="space-y-4 py-2 mt-2">
            {/* Dosen & Waktu */}
            <div className="grid grid-cols-1 gap-4">
              <div className="flex items-start gap-3">
                <div className="bg-primary/10 p-2 rounded-md shrink-0">
                  <User className="size-5 text-primary" />
                </div>
                <div>
                  <p className="text-[10px] text-muted-foreground font-semibold uppercase tracking-wider mb-0.5">Dosen Pengajar</p>
                  <p className="font-medium text-sm text-foreground">{cls.dosen}</p>
                </div>
              </div>

              <div className="flex items-start gap-3">
                <div className="bg-primary/10 p-2 rounded-md shrink-0">
                  <Clock className="size-5 text-primary" />
                </div>
                <div>
                  <p className="text-[10px] text-muted-foreground font-semibold uppercase tracking-wider mb-0.5">Waktu Kuliah</p>
                  <p className="font-medium text-sm text-foreground capitalize">{day}, {cls.jam}</p>
                  <p className="text-xs text-muted-foreground mt-0.5">Jam ke-{cls.waktu.replace(/\//g, ', ')}</p>
                </div>
              </div>
            </div>

            {/* Lokasi */}
            <div className="mt-6 pt-4 border-t border-border/60">
              <p className="text-[10px] text-muted-foreground font-semibold uppercase tracking-wider mb-3">Informasi Lokasi</p>

              <div className="bg-muted/30 border border-border/50 rounded-lg p-3 space-y-4">
                <div className="flex items-start gap-3">
                  <Map className="size-4 text-muted-foreground mt-0.5 shrink-0" />
                  <div>
                    <p className="font-medium text-sm text-foreground">{roomInfo.campus}</p>
                    <p className="text-xs text-muted-foreground mt-0.5 leading-relaxed">{roomInfo.location}</p>
                  </div>
                </div>

                <div className="grid grid-cols-3 gap-2 pt-3 border-t border-border/50">
                  <div className="flex flex-col items-center justify-center p-2 bg-background rounded-md border border-border/50 shadow-sm">
                    <Building2 className="size-4 text-muted-foreground mb-1.5" />
                    <span className="text-[10px] text-muted-foreground">Gedung</span>
                    <span className="font-semibold text-sm mt-0.5">{roomInfo.gedung}</span>
                  </div>
                  <div className="flex flex-col items-center justify-center p-2 bg-background rounded-md border border-border/50 shadow-sm">
                    <Layers className="size-4 text-muted-foreground mb-1.5" />
                    <span className="text-[10px] text-muted-foreground">Lantai</span>
                    <span className="font-semibold text-sm mt-0.5">{roomInfo.lantai}</span>
                  </div>
                  <div className="flex flex-col items-center justify-center p-2 bg-background rounded-md border border-border/50 shadow-sm">
                    <DoorOpen className="size-4 text-muted-foreground mb-1.5" />
                    <span className="text-[10px] text-muted-foreground">Ruang</span>
                    <span className="font-semibold text-sm mt-0.5">{roomInfo.ruang}</span>
                  </div>
                </div>
              </div>
            </div>

          </div>
        </DialogContent>
      </Dialog>
    )
  }

  return (
    <div className="flex flex-col h-full min-h-screen">
      <header className="flex h-16 shrink-0 items-center justify-between gap-2 border-b px-4 lg:px-6 bg-background">
        <div className="flex items-center gap-3">
          <SidebarTrigger />
          <div className="h-4 w-px bg-border" />
          <div className="flex flex-col">
            <h1 className="font-semibold text-sm">Jadwal Kuliah</h1>
            <span className="text-xs text-muted-foreground">Semester Ganjil 2026/2027 · Kelas {currentClass}</span>
          </div>

        </div>
        
        <div className="flex items-center gap-2">
          <DropdownMenu>
            <DropdownMenuTrigger>
              <Button variant="outline" size="sm" className="hidden sm:flex h-8 gap-1">
                <Filter className="size-3.5" /> Hari
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              {DAYS.map(day => (
                <DropdownMenuItem
                  key={day}
                  onClick={() => toggleDay(day)}
                  className="capitalize gap-2 cursor-pointer"
                >
                  <span className={`size-3.5 rounded border flex items-center justify-center shrink-0 ${selectedDays.includes(day) ? 'bg-primary border-primary' : 'border-muted-foreground/40'}`}>
                    {selectedDays.includes(day) && <span className="size-2 rounded-[2px] bg-primary-foreground block" />}
                  </span>
                  {day}
                </DropdownMenuItem>
              ))}
            </DropdownMenuContent>
          </DropdownMenu>

          <Tabs value={view} onValueChange={setView} className="h-8">
            <TabsList className="h-8">
              <TabsTrigger value="grid" className="text-xs h-6 px-3">Grid</TabsTrigger>
              <TabsTrigger value="list" className="text-xs h-6 px-3">List</TabsTrigger>
            </TabsList>
          </Tabs>
        </div>
      </header>
      
      <main className="flex-1 p-4 lg:p-5 overflow-auto">
        <div className="mb-6">
          <h2 className="text-2xl font-bold tracking-tight">Hi, {nama || 'Mahasiswa'} 👋</h2>
          <p className="text-muted-foreground mt-1 text-sm">NPM: {npm || '-'} • Kelas: {currentClass}</p>
        </div>
        {renderContent()}
      </main>

      
      {renderDialog()}
    </div>
  )
}

function ScheduleSkeleton() {
  return (
    <div className="border rounded-xl bg-card overflow-hidden">
      <div className="flex border-b border-border/60 p-2 gap-2">
        <Skeleton className="w-[56px] h-4" />
        {Array.from({length: 6}).map((_, i) => <Skeleton key={i} className="flex-1 h-4" />)}
      </div>
      <div className="h-[400px] p-4 flex gap-4">
        <div className="w-[56px] space-y-12">
          {Array.from({length: 6}).map((_, i) => <Skeleton key={i} className="w-10 h-3 ml-auto" />)}
        </div>
        <div className="flex-1 grid grid-cols-6 gap-2">
          <Skeleton className="h-24 w-full rounded-md" />
          <Skeleton className="h-32 w-full rounded-md mt-12" />
          <Skeleton className="h-20 w-full rounded-md mt-32" />
        </div>
      </div>
    </div>
  )
}
