'use client'

import { useState, useEffect } from 'react'
import { FolderOpen } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { getStorage } from '@/lib/storage'

export function OpenInExplorerButton({ category, slug }: { category: 'catatan' | 'materi'; slug?: string }) {
  const [isNative, setIsNative] = useState(false)

  useEffect(() => {
    getStorage().then(s => setIsNative(s.isNative()))
  }, [])

  if (!isNative) return null

  return (
    <Button
      variant="outline"
      size="sm"
      onClick={async () => {
        const storage = await getStorage()
        await storage.openInExplorer(category, slug)
      }}
    >
      <FolderOpen className="size-4 mr-2" />
      Buka di Explorer
    </Button>
  )
}
