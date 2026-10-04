import { create } from 'zustand'
import { persist } from 'zustand/middleware'

interface ProfileStore {
  nama: string;
  npm: string;
  kelas: string;
  setProfile: (nama: string, npm: string, kelas: string) => void;
}

export const useProfileStore = create<ProfileStore>()(
  persist(
    (set) => ({
      nama: '',
      npm: '',
      kelas: '1KA02', // Default class
      setProfile: (nama, npm, kelas) => set({ nama, npm, kelas: kelas.toUpperCase() }),
    }),
    { name: 'bingungundar-profile-store' }
  )
)
