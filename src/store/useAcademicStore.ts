/**
 * Shared Zustand stores persisted to localStorage.
 * - useCoursesStore  → Mata Kuliah & Dosen
 * - useAttendanceStore → Presensi
 */

import { create } from 'zustand'
import { persist, createJSONStorage } from 'zustand/middleware'
import { createTauriStorage } from '@/lib/storage/zustand-storage'

// ─── Mata Kuliah ─────────────────────────────────────────────────────────────

export interface Course {
  id: string
  nama: string       // Mata kuliah name
  dosen: string
  ruang: string
  sks: number
  hari: string
  jam: string
  catatan?: string
}

interface CoursesState {
  courses: Course[]
  addCourse: (c: Omit<Course, 'id'>) => void
  updateCourse: (id: string, c: Partial<Omit<Course, 'id'>>) => void
  deleteCourse: (id: string) => void
}

export const useCoursesStore = create<CoursesState>()(
  persist(
    (set) => ({
      courses: [],
      addCourse: (c) => set((s) => ({
        courses: [...s.courses, { ...c, id: crypto.randomUUID() }],
      })),
      updateCourse: (id, c) => set((s) => ({
        courses: s.courses.map(x => x.id === id ? { ...x, ...c } : x),
      })),
      deleteCourse: (id) => set((s) => ({
        courses: s.courses.filter(x => x.id !== id),
      })),
    }),
    { 
      name: 'bingungundar-courses',
      storage: createJSONStorage(() => createTauriStorage('courses.json'))
    }
  )
)

// ─── Presensi ─────────────────────────────────────────────────────────────────

export type AttendanceStatus = 'hadir' | 'izin' | 'sakit' | 'alpha'

export interface AttendanceRecord {
  id: string
  courseId: string
  courseName: string
  date: string          // ISO date string YYYY-MM-DD
  status: AttendanceStatus
  catatan?: string
}

interface AttendanceState {
  records: AttendanceRecord[]
  addRecord: (r: Omit<AttendanceRecord, 'id'>) => void
  updateRecord: (id: string, status: AttendanceStatus) => void
  deleteRecord: (id: string) => void
}

export const useAttendanceStore = create<AttendanceState>()(
  persist(
    (set) => ({
      records: [],
      addRecord: (r) => set((s) => ({
        records: [...s.records, { ...r, id: crypto.randomUUID() }],
      })),
      updateRecord: (id, status) => set((s) => ({
        records: s.records.map(x => x.id === id ? { ...x, status } : x),
      })),
      deleteRecord: (id) => set((s) => ({
        records: s.records.filter(x => x.id !== id),
      })),
    }),
    { 
      name: 'bingungundar-attendance',
      storage: createJSONStorage(() => createTauriStorage('attendance.json'))
    }
  )
)
