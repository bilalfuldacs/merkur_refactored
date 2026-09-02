import { useEffect, useState } from 'react'
import { apiFile } from '@/api'

export function useAuthFileUrl(path: string | null): string | null {
  const [src, setSrc] = useState<string | null>(null)

  useEffect(() => {
    if (!path) {
      setSrc(null)
      return
    }

    let objectUrl: string | null = null
    let cancelled = false

    void apiFile(path)
      .then((blob) => {
        if (cancelled) {
          return
        }
        objectUrl = URL.createObjectURL(blob)
        setSrc(objectUrl)
      })
      .catch(() => {
        if (!cancelled) {
          setSrc(null)
        }
      })

    return () => {
      cancelled = true
      if (objectUrl) {
        URL.revokeObjectURL(objectUrl)
      }
    }
  }, [path])

  return src
}

export function formatDocSize(bytes: number | null | undefined): string {
  if (!bytes || bytes <= 0) {
    return ''
  }
  const mb = bytes / 1024 / 1024
  if (mb < 0.1) {
    return `${Math.max(1, Math.round(bytes / 1024))} KB`
  }
  return `${mb.toFixed(1)} MB`
}

export function formatDocDate(value: string | null | undefined): string {
  if (!value) {
    return ''
  }
  const then = new Date(value).getTime()
  if (Number.isNaN(then)) {
    return value
  }
  const sec = Math.max(0, Math.round((Date.now() - then) / 1000))
  if (sec < 45) {
    return 'just now'
  }
  if (sec < 3600) {
    const minutes = Math.max(1, Math.floor(sec / 60))
    return `${minutes} min ago`
  }
  if (sec < 86400) {
    const hours = Math.floor(sec / 3600)
    return hours === 1 ? '1 hour ago' : `${hours} hours ago`
  }
  if (sec < 172800) {
    return 'yesterday'
  }
  return new Date(value).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' })
}

export function completenessLabel(value: boolean | number | string | null | undefined): 'Complete' | 'Excerpt' | null {
  if (value === true || value === 1 || value === '1') {
    return 'Complete'
  }
  if (value === false || value === 0 || value === '0') {
    return 'Excerpt'
  }
  return null
}

export function creatorName(person: { firstname?: string | null; lastname?: string | null; username?: string | null } | null | undefined): string {
  if (!person) {
    return ''
  }
  const name = [person.firstname, person.lastname].filter(Boolean).join(' ')
  return name || person.username || ''
}
