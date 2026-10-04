'use client'

import * as React from 'react'
import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { SidebarTrigger } from '@/components/ui/sidebar'
import { useProfileStore } from '@/store/useProfileStore'
import { Save } from 'lucide-react'

export default function SettingsPage() {
  const { nama, npm, kelas, setProfile } = useProfileStore()
  
  const [formNama, setFormNama] = React.useState(nama)
  const [formNpm, setFormNpm] = React.useState(npm)
  const [formKelas, setFormKelas] = React.useState(kelas)
  const [isSaved, setIsSaved] = React.useState(false)

  React.useEffect(() => {
    setFormNama(nama)
    setFormNpm(npm)
    setFormKelas(kelas)
  }, [nama, npm, kelas])

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault()
    setProfile(formNama, formNpm, formKelas)
    setIsSaved(true)
    setTimeout(() => setIsSaved(false), 2000)
  }

  return (
    <div className="flex flex-col h-full min-h-screen">
      <header className="flex h-16 shrink-0 items-center gap-2 border-b px-4 lg:px-6 bg-background">
        <SidebarTrigger />
        <div className="h-4 w-px bg-border" />
        <h1 className="font-semibold text-sm">Pengaturan</h1>
      </header>

      <main className="flex-1 p-4 lg:p-6 overflow-auto bg-muted/20">
        <div className="max-w-2xl mx-auto space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Profil Mahasiswa</CardTitle>
              <CardDescription>
                Atur nama, NPM, dan kelas Anda. Jadwal akan menyesuaikan dengan kelas yang diisi di sini.
              </CardDescription>
            </CardHeader>
            <form onSubmit={handleSave}>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <label htmlFor="nama" className="text-sm font-medium">Nama</label>
                  <Input 
                    id="nama" 
                    placeholder="Contoh: Akmal Ghanim" 
                    value={formNama} 
                    onChange={e => setFormNama(e.target.value)} 
                  />
                </div>
                <div className="space-y-2">
                  <label htmlFor="npm" className="text-sm font-medium">NPM</label>
                  <Input 
                    id="npm" 
                    placeholder="Contoh: 09093229" 
                    value={formNpm} 
                    onChange={e => setFormNpm(e.target.value)} 
                  />
                </div>
                <div className="space-y-2">
                  <label htmlFor="kelas" className="text-sm font-medium">Kelas</label>
                  <Input 
                    id="kelas" 
                    placeholder="Contoh: 1KA02" 
                    value={formKelas} 
                    onChange={e => setFormKelas(e.target.value)} 
                  />
                </div>
              </CardContent>
              <CardFooter className="border-t px-6 py-4">
                <Button type="submit" disabled={isSaved}>
                  {isSaved ? 'Tersimpan!' : (
                    <>
                      <Save className="w-4 h-4 mr-2" />
                      Simpan Perubahan
                    </>
                  )}
                </Button>
              </CardFooter>
            </form>
          </Card>
        </div>
      </main>
    </div>
  )
}
