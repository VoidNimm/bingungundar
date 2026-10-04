'use client'

import * as React from 'react'
import { getStorage } from '@/lib/storage'
import { StoredFileMeta } from '@/lib/storage/types'
import { FileIcon, FileText, FileSpreadsheet, FileVideo, Presentation, Archive, ImageIcon, Film, Music } from 'lucide-react'

interface FilePreviewProps {
  file: StoredFileMeta
  className?: string
  colorText?: string
  fullSize?: boolean // if true, renders full iframe for PDF etc.
}

export function FilePreview({ file, className = "", colorText, fullSize = false }: FilePreviewProps) {
  const [url, setUrl] = React.useState<string | null>(null)

  React.useEffect(() => {
    let objectUrl: string | null = null;
    
    // For thumbnails, only generate for images and videos. 
    // For fullSize, generate for everything.
    const isMedia = file.type.startsWith('image/') || file.type.startsWith('video/');
    if (fullSize || isMedia) {
      getStorage().then(storage => {
        storage.getFileData(file.id, file.category).then(data => {
          if (data) {
            const blob = new Blob([data], { type: file.type || 'application/octet-stream' })
            objectUrl = URL.createObjectURL(blob)
            setUrl(objectUrl)
          }
        }).catch(console.error)
      })
    }

    return () => {
      if (objectUrl) URL.revokeObjectURL(objectUrl)
    }
  }, [file, fullSize])

  if (url) {
    if (file.type.startsWith('image/')) {
      return (
        <img 
          src={url} 
          alt={file.name} 
          className={`${fullSize ? 'object-contain max-h-[80vh]' : 'object-cover'} w-full h-full ${className}`} 
        />
      )
    }

    if (file.type.startsWith('video/')) {
      return (
        <video
          src={url}
          className={`${fullSize ? 'object-contain max-h-[80vh]' : 'object-cover'} w-full h-full ${className}`}
          muted={!fullSize}
          controls={fullSize}
          autoPlay={!fullSize}
          loop={!fullSize}
          playsInline
        />
      )
    }

    if (fullSize && file.type.includes('pdf')) {
      return (
        <iframe src={url} className="w-full h-[80vh] rounded-md border-0" />
      )
    }

    // For other types in fullSize, we might just show an icon with "Preview not supported"
    if (fullSize && !isSupportedPreview(file.type)) {
      return (
        <div className="flex flex-col items-center justify-center p-12 text-muted-foreground h-[400px]">
          <FileIcon className="size-16 mb-4 opacity-50" />
          <p>Preview tidak tersedia untuk format ini.</p>
        </div>
      )
    }
  }

  const t = file.type.toLowerCase()
  let Icon = FileIcon;
  if (t.includes('pdf') || t.includes('word') || t.includes('document')) Icon = FileText;
  else if (t.includes('presentation') || t.includes('powerpoint')) Icon = Presentation;
  else if (t.includes('sheet') || t.includes('excel')) Icon = FileSpreadsheet;
  else if (t.includes('image')) Icon = ImageIcon;
  else if (t.includes('video')) Icon = Film;
  else if (t.includes('audio')) Icon = Music;

  return (
    <div className={`flex items-center justify-center w-full h-full ${className}`}>
      <Icon className="w-1/2 h-1/2 opacity-70" style={{ color: colorText }} />
    </div>
  )
}

function isSupportedPreview(type: string) {
  return type.startsWith('image/') || type.startsWith('video/') || type.includes('pdf');
}
