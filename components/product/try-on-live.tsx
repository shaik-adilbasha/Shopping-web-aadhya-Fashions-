'use client'

/**
 * "Check Live" — virtual try-on using the shopper's camera and Decart's Lucy VTON model.
 * The result is an AI-generated preview, not a physical cloth simulation.
 */
import { useCallback, useEffect, useRef, useState } from 'react'
import { Camera, Loader2, X } from 'lucide-react'
import type { Product } from '@/lib/catalog'
import { cn } from '@/lib/utils'

export const TRY_ON_CATEGORIES = ['sarees', 'lehengas', 'blouses-accessories', 'maggam-work', 't-shirts', 'shirts', 'pants']
const MAX_SECONDS = 120 // keeps usage (and cost) bounded per session

type Phase = 'idle' | 'starting' | 'live' | 'error' | 'off'
type RT = { set: (s: { prompt?: string; image?: File; enhance?: boolean }) => Promise<unknown>; disconnect: () => void }

function buildPrompt(p: Product, color?: string) {
  const colour = color ? `${color} ` : ''
  const detail = p.description.split(/[.!\n]/)[0].slice(0, 140).trim()
  if (p.category === 'sarees')
    return `Substitute the current clothing with a ${colour}${p.name} saree, draped in the traditional Nivi style with neat pleats at the waist and the pallu over the left shoulder. Match the exact colour, zari border and woven pattern shown in the reference image. ${detail}.`
  if (p.category === 'lehengas')
    return `Substitute the current outfit with a ${colour}${p.name} lehenga set with a fitted blouse, flared skirt and dupatta, matching the colour, embroidery and pattern in the reference image exactly. ${detail}.`
  if (p.category === 't-shirts')
    return `Substitute the current top with a ${colour}${p.name} t-shirt, matching the exact colour, print and design shown in the reference image. ${detail}.`
  if (p.category === 'shirts')
    return `Substitute the current top with a ${colour}${p.name} shirt, with collar and buttons, matching the exact colour, fabric and pattern shown in the reference image. ${detail}.`
  if (p.category === 'pants')
    return `Substitute the current bottoms with ${colour}${p.name} pants, matching the exact colour, fabric and fit shown in the reference image. ${detail}.`
  return `Substitute the current top with a ${colour}${p.name} blouse, matching the colour, embroidery and pattern in the reference image exactly. ${detail}.`
}

export function TryOnLive({ product, color }: { product: Product; color?: string }) {
  const [open, setOpen] = useState(false)
  const [phase, setPhase] = useState<Phase>('idle')
  const [message, setMessage] = useState('')
  const [refIndex, setRefIndex] = useState(0)
  const [left, setLeft] = useState(MAX_SECONDS)
  const previewRef = useRef<HTMLVideoElement>(null)
  const outRef = useRef<HTMLVideoElement>(null)
  const streamRef = useRef<MediaStream | null>(null)
  const rtRef = useRef<RT | null>(null)
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null)

  const stop = useCallback((next: Phase = 'idle', msg = '') => {
    if (timerRef.current) clearInterval(timerRef.current)
    timerRef.current = null
    try { rtRef.current?.disconnect() } catch {}
    rtRef.current = null
    streamRef.current?.getTracks().forEach((t) => t.stop())
    streamRef.current = null
    if (previewRef.current) previewRef.current.srcObject = null
    if (outRef.current) outRef.current.srcObject = null
    setPhase(next)
    setMessage(msg)
  }, [])

  const close = useCallback(() => { stop(); setOpen(false) }, [stop])

  useEffect(() => {
    if (!open) return
    const onKey = (e: KeyboardEvent) => e.key === 'Escape' && close()
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [open, close])
  useEffect(() => () => stop(), [stop])

  const start = async () => {
    setPhase('starting')
    setMessage('')
    let stage = 'setup'
    try {
      const cfg = await fetch('/api/decart/token').then((r) => r.json()).catch(() => ({ enabled: false }))
      if (!cfg.enabled) return stop('off')
      if (!navigator.mediaDevices?.getUserMedia) return stop('error', 'Your browser does not support camera access. Please use Chrome, Safari or Edge on HTTPS.')

      stage = 'loading-sdk'
      const { createDecartClient, models } = await import('@decartai/sdk')
      const model = models.realtime('lucy-vton-latest')

      stage = 'camera'
      const stream = await navigator.mediaDevices.getUserMedia({
        audio: false,
        video: { frameRate: model.fps, width: model.width, height: model.height, facingMode: 'user' },
      })
      streamRef.current = stream
      if (previewRef.current) {
        previewRef.current.srcObject = stream
        previewRef.current.play().catch(() => {})
      }

      stage = 'garment-image'
      // garment reference image = the product photo the shopper picked
      const blob = await (await fetch(product.images[refIndex] || product.images[0])).blob()
      const file = new File([blob], 'garment.' + (blob.type.split('/')[1] || 'png'), { type: blob.type || 'image/png' })

      const client = createDecartClient({
        apiKeyProvider: async () => {
          const r = await fetch('/api/decart/token', { method: 'POST' })
          const d = await r.json().catch(() => ({}))
          if (!r.ok) throw new Error(`token ${r.status}: ${d.detail || d.error || 'failed'}`)
          return d.apiKey as string
        },
      })
      stage = 'connecting'
      const rt = (await client.realtime.connect(stream, {
        model,
        mirror: 'auto',
        onRemoteStream: (edited: MediaStream) => {
          if (outRef.current) {
            outRef.current.srcObject = edited
            outRef.current.play().catch(() => {})
          }
          setPhase('live')
        },
      })) as unknown as RT
      rtRef.current = rt
      stage = 'applying-outfit'
      await rt.set({ prompt: buildPrompt(product, color), image: file, enhance: false })

      setLeft(MAX_SECONDS)
      timerRef.current = setInterval(() => {
        setLeft((s) => {
          if (s <= 1) {
            stop('idle', `Your ${MAX_SECONDS / 60}-minute preview has ended. Tap Start to try again.`)
            return 0
          }
          return s - 1
        })
      }, 1000)
    } catch (e) {
      console.error('Check Live failed at step:', stage, e)
      const name = e instanceof Error ? e.name : ''
      const detail = e instanceof Error ? e.message.slice(0, 160) : String(e).slice(0, 160)
      const reason =
        name === 'NotAllowedError'
          ? 'Camera permission is blocked. Allow camera access in your browser settings and try again.'
          : name === 'NotFoundError'
            ? 'No camera was found on this device.'
            : name === 'NotReadableError'
              ? 'Your camera is being used by another app or browser tab. Close it and try again.'
              : /token (401|403)|unauthor|invalid.*key|expired/i.test(detail)
                ? 'The AI service rejected the key. It may be wrong or expired — the shop owner should create a new Decart key.'
                : /token 503/.test(detail)
                  ? 'Live try-on is not switched on yet (Decart key missing).'
                  : /402|credit|quota|insufficient|limit/i.test(detail)
                    ? 'The AI service says the account is out of credits or at its limit. The shop owner should check the Decart dashboard.'
                    : 'Could not start the live preview. Please check your internet connection and try again.'
      stop('error', `${reason}  [step: ${stage}${detail ? ' — ' + detail : ''}]`)
    }
  }

  const busy = phase === 'starting' || phase === 'live'
  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="flex h-11 items-center justify-center gap-2 rounded-lg bg-plum text-sm font-medium text-white transition hover:bg-plum/90 col-span-2"
      >
        <Camera className="size-4" /> Check Live — See it on you
      </button>

      {open && (
        <div role="dialog" aria-modal="true" aria-label={`Live try-on for ${product.name}`} className="fixed inset-0 z-[100] flex items-center justify-center bg-black/70 p-3">
          <div className="flex max-h-full w-full max-w-lg flex-col overflow-hidden rounded-2xl bg-white shadow-2xl">
            <div className="flex items-center justify-between px-4 py-3">
              <p className="line-clamp-1 font-serif text-lg text-ink">Try on: {product.name}</p>
              <button type="button" onClick={close} aria-label="Close" className="rounded-full p-1.5 hover:bg-blush"><X className="size-5" /></button>
            </div>

            <div className="relative h-[52vh] bg-black md:h-[56vh]">
              <video ref={previewRef} muted playsInline className={cn('absolute inset-0 size-full -scale-x-100 object-contain', phase === 'live' && 'hidden')} />
              <video ref={outRef} muted playsInline className={cn('absolute inset-0 size-full object-contain', phase !== 'live' && 'hidden')} />
              {(phase === 'idle' || phase === 'error' || phase === 'off') && (
                <div className="absolute inset-0 flex flex-col items-center justify-center gap-2 bg-black/60 px-6 text-center text-sm text-white">
                  <Camera className="size-9 opacity-80" />
                  {phase === 'off' ? (
                    <p>Live try-on is not switched on yet. The shop owner needs to add the Decart API key (DECART_API_KEY) in the website settings.</p>
                  ) : phase === 'error' ? (
                    <p role="alert">{message}</p>
                  ) : (
                    <p>{message || (product.category === 'pants' ? 'Stand back so your whole body is in view, in good light, then tap Start.' : 'Stand in good light with your upper body in view, then tap Start.')}</p>
                  )}
                </div>
              )}
              {phase === 'starting' && (
                <div className="absolute inset-0 flex flex-col items-center justify-center gap-2 bg-black/50 text-sm text-white">
                  <Loader2 className="size-8 animate-spin" /> Getting your preview ready…
                </div>
              )}
              {phase === 'live' && <span className="absolute right-3 top-3 rounded-full bg-black/60 px-2.5 py-1 text-xs text-white">{Math.floor(left / 60)}:{String(left % 60).padStart(2, '0')}</span>}
            </div>

            <div className="flex flex-col gap-3 p-4">
              {product.images.length > 1 && (
                <div className="flex items-center gap-2">
                  <span className="text-xs text-ink/70">Photo used:</span>
                  {product.images.slice(0, 4).map((src, i) => (
                    <button key={i} type="button" disabled={busy} onClick={() => setRefIndex(i)} aria-label={`Use photo ${i + 1}`} aria-pressed={refIndex === i} className={cn('size-10 overflow-hidden rounded-md ring-1 ring-border disabled:opacity-50', refIndex === i && 'ring-2 ring-primary')}>
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img src={src} alt="" className="size-full object-cover" />
                    </button>
                  ))}
                </div>
              )}
              <div className="flex gap-3">
                {busy ? (
                  <button type="button" onClick={() => stop()} className="h-11 flex-1 rounded-lg border border-primary text-sm font-medium text-primary hover:bg-blush">Stop</button>
                ) : (
                  <button type="button" onClick={start} className="h-11 flex-1 rounded-lg bg-primary text-sm font-medium text-white hover:bg-primary/90">Start Live Try-On</button>
                )}
              </div>
              <p className="text-[11px] leading-relaxed text-muted-foreground">
                This is an AI preview. Drape, fit, fabric and pattern may look slightly different from the real product. Your live camera video is sent to Decart’s AI service to create the preview; we do not save it. A preview lasts up to {MAX_SECONDS / 60} minutes.
              </p>
            </div>
          </div>
        </div>
      )}
    </>
  )
}
