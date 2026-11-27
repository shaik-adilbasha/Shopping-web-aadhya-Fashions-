'use client'

import { useEffect, useState } from 'react'
import { getVideo } from '@/lib/video-store'

/** Plays a customer's return video (trial mode: only if it was recorded in this same browser). */
export function ReturnVideo({ videoKey }: { videoKey?: string }) {
  const [url, setUrl] = useState('')
  const [state, setState] = useState<'loading' | 'ok' | 'missing'>('loading')
  useEffect(() => {
    let made = ''
    let alive = true
    if (!videoKey) return setState('missing')
    getVideo(videoKey)
      .then((b) => {
        if (!alive) return
        if (!b) return setState('missing')
        made = URL.createObjectURL(b)
        setUrl(made)
        setState('ok')
      })
      .catch(() => alive && setState('missing'))
    return () => {
      alive = false
      if (made) URL.revokeObjectURL(made)
    }
  }, [videoKey])
  if (state === 'loading') return <p className="text-[11px] text-muted-foreground">Loading video…</p>
  if (state === 'missing')
    return <p className="rounded-lg bg-amber-50 p-2 text-[11px] text-amber-800">The proof video is not available here. In trial mode it is stored only on the customer’s device — a hosted database with file storage is needed to see it from any device.</p>
  return <video src={url} controls playsInline className="max-h-72 w-full rounded-lg bg-black md:w-auto" />
}
