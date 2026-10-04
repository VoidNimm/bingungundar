'use client'

import React, { useEffect, useState } from 'react'
import Link from 'next/link'
import { Folder } from 'lucide-react'
import { SidebarTrigger } from '@/components/ui/sidebar'
import { getStorage } from '@/lib/storage'

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
export default function CatatanPage() {
  const [counts, setCounts] = useState<Record<string, number>>({})
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    async function loadCounts() {
      try {
        const storage = await getStorage()
        const allFiles = await storage.getAllFiles('catatan')
        const newCounts: Record<string, number> = {}
        allFiles.forEach(file => {
          newCounts[file.subjectSlug] = (newCounts[file.subjectSlug] || 0) + 1
        })
        setCounts(newCounts)
      } catch (error) {
        console.error('Error loading catatan counts:', error)
      } finally {
        setLoading(false)
      }
    }
    loadCounts()
  }, [])

  return (
    <div className="flex flex-col min-h-screen">
      <header className="flex h-14 items-center gap-4 border-b px-6 lg:h-[60px]">
        <SidebarTrigger />
        <h1 className="font-semibold text-lg">Catatan</h1>
      </header>
      <main className="flex-1 p-6">
        <div className="grid gap-4 grid-cols-1 sm:grid-cols-2 lg:grid-cols-4">
          {SUBJECTS.map((subject) => {
            const count = counts[subject.slug] || 0
            const isLightColor = subject.slug === 'matematika'
            const textColor = isLightColor ? 'text-zinc-900' : 'text-white'
            const iconColor = isLightColor ? 'text-zinc-800' : 'text-white/80'
            const descColor = isLightColor ? 'text-zinc-700' : 'text-white/70'

            return (
              <Link
                key={subject.slug}
                href={`/catatan/${subject.slug}`}
                className="group relative overflow-hidden rounded-xl p-6 transition-all hover:scale-[1.02] active:scale-95"
                style={{ backgroundColor: subject.color }}
              >
                <div className="flex flex-col gap-4">
                  <div className={`p-3 w-fit rounded-lg bg-black/10 backdrop-blur-sm ${iconColor}`}>
                    <Folder className="size-6" />
                  </div>
                  <div>
                    <h3 className={`font-semibold text-lg leading-tight mb-1 ${textColor}`}>
                      {subject.name}
                    </h3>
                    {!loading && (
                      <p className={`text-sm font-medium ${descColor}`}>
                        {count} file
                      </p>
                    )}
                  </div>
                </div>
                
                {/* Decorative background circle */}
                <div className="absolute -bottom-8 -right-8 size-32 rounded-full bg-white/5 transition-transform group-hover:scale-150" />
              </Link>
            )
          })}
        </div>
      </main>
    </div>
  )
}
