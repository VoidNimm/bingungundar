import { create } from 'zustand'
import { persist, createJSONStorage } from 'zustand/middleware'
import { createTauriStorage } from '@/lib/storage/zustand-storage'

export interface JadwalItem {
  nama: string;
  waktu: string;
  jam: string;
  ruang: string;
  dosen: string;
}

interface JadwalStore {
  kelas: string;
  jadwalData: Record<string, JadwalItem[]>;
  lastFetch: number;
  setJadwal: (data: Record<string, JadwalItem[]>, kelas?: string) => void;
  setKelas: (kelas: string) => void;
}

export const useJadwalStore = create<JadwalStore>()(
  persist(
    (set) => ({
      kelas: '1KA02',
      jadwalData: {},
      lastFetch: 0,
      setJadwal: (data, kelas) => set((state) => ({ 
        jadwalData: data, 
        lastFetch: Date.now(),
        ...(kelas ? { kelas: kelas.toUpperCase() } : {})
      })),
      setKelas: (kelas) => set({ kelas: kelas.toUpperCase() })
    }),
    { 
      name: 'bingungundar-jadwal-cache',
      storage: createJSONStorage(() => createTauriStorage('jadwal-cache.json'))
    }
  )
)
