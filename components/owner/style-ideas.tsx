'use client'

import { useEffect, useState } from 'react'
import { Download, Loader2, Plus, RefreshCw, Sparkles } from 'lucide-react'
import { toast } from 'sonner'
import { FABRICS, MAX_STYLES_PER_RUN, STYLES } from '@/lib/style-catalog'
import { compressDataUrl, compressImage } from '@/lib/image'
import { btnPrimary, inputCls } from '@/lib/wa'
import { cn } from '@/lib/utils'

type Result = { status: 'loading' | 'done' | 'error'; image?: string; message?: string; provider?: string }
const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms))

/** Owner tool: upload a cloth photo, tick the outfit styles, and generate AI concept pictures. */
export function StyleIdeas({ image, onAdd }: { image?: string; onAdd?: (dataUrl: string) => void }) {
  const [cloth, setCloth] = useState('')
  const [small, setSmall] = useState('')
  const [fabric, setFabric] = useState('')
  const [sel, setSel] = useState<string[]>(['saree', 'lehenga', 'umbrella-cut'])
  const [results, setResults] = useState<Record<string, Result>>({})
  const [running, setRunning] = useState(false)
  const [enabled, setEnabled] = useState<boolean | null>(null)

  useEffect(() => {
    fetch('/api/style-ideas').then((r) => r.json()).then((d) => setEnabled(!!d.enabled)).catch(() => setEnabled(false))
  }, [])

  // use the product's first photo when opened from the product form
  useEffect(() => {
    if (!image) return
    compressDataUrl(image, 1024, 0.85).then(setCloth).catch(() => {})
  }, [image])

  // a 512px copy for providers that only accept small reference images
  useEffect(() => {
    if (!cloth) return setSmall('')
    compressDataUrl(cloth, 512, 0.85).then(setSmall).catch(() => {})
  }, [cloth])

  const toggle = (id: string) =>
    setSel((s) => (s.includes(id) ? s.filter((x) => x !== id) : s.length >= MAX_STYLES_PER_RUN ? (toast.info(`You can pick up to ${MAX_STYLES_PER_RUN} styles at a time.`), s) : [...s, id]))

  const makeOne = async (id: string): Promise<{ r: 'ok' | 'limit' | 'fail'; retryAfter?: number }> => {
    setResults((r) => ({ ...r, [id]: { status: 'loading' } }))
    try {
      const res = await fetch('/api/style-ideas', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ image: cloth, imageSmall: small, style: id, fabric }) })
      const d = await res.json().catch(() => ({}))
      if (res.ok && d.image) {
        setResults((r) => ({ ...r, [id]: { status: 'done', image: d.image, provider: d.provider } }))
        return { r: 'ok' }
      }
      setResults((r) => ({ ...r, [id]: { status: 'error', message: d.message ?? 'Something went wrong.' } }))
      return d.error === 'limit' || d.error === 'credits-over' ? { r: 'limit', retryAfter: d.retryAfter } : { r: 'fail' }
    } catch {
      setResults((r) => ({ ...r, [id]: { status: 'error', message: 'Could not reach the server.' } }))
      return { r: 'fail' }
    }
  }

  const generate = async () => {
    if (!cloth) return toast.error('Please upload a photo of the cloth first.')
    if (sel.length === 0) return toast.error('Please pick at least one style.')
    setRunning(true)
    for (let i = 0; i < sel.length; i++) {
      const id = sel[i]
      let out = await makeOne(id)
      // per-minute free limit: wait the time Google asks for (up to 70s) and retry once
      if (out.r === 'limit' && out.retryAfter && out.retryAfter <= 70) {
        toast.info(`Free limit reached — waiting ${out.retryAfter}s, then continuing…`)
        await sleep((out.retryAfter + 2) * 1000)
        out = await makeOne(id)
      }
      if (out.r === 'limit') {
        toast.error('AI credits are over. See the message on the picture.')
        break
      }
      if (i < sel.length - 1) await sleep(6000) // go gently, so the free per-minute limit is not hit
    }
    setRunning(false)
  }

  return (
    <div className="flex flex-col gap-4 rounded-2xl bg-white p-4 ring-1 ring-border md:p-5">
      <div>
        <p className="flex items-center gap-2 text-sm font-medium"><Sparkles className="size-4 text-primary" /> AI Style Ideas</p>
        <p className="mt-1 text-xs text-muted-foreground">See how a cloth could look as different outfits. These are AI concept pictures — the real stitched outfit can look a little different.</p>
        {enabled === false && <p className="mt-2 rounded-lg bg-amber-50 p-3 text-xs text-amber-800">Not switched on yet: add at least one AI key in your settings (.env.local and Vercel) — <b>Cloudflare</b> (free) is the best to start — then restart.</p>}
      </div>

      {!image && (
        <label className="flex flex-col gap-1 text-xs text-ink/80">
          Cloth photo (clear photo of the cloth only — no faces)
          <input type="file" accept="image/*" className="text-xs" onChange={async (e) => { const f = e.target.files?.[0]; if (f) { try { setCloth(await compressImage(f, 1024, 0.85)); setResults({}) } catch { toast.error('Could not read that image.') } } }} />
        </label>
      )}
      {cloth && (
        // eslint-disable-next-line @next/next/no-img-element
        <img src={cloth} alt="Cloth" className="size-24 rounded-lg object-cover ring-1 ring-border" />
      )}

      <label className="flex max-w-xs flex-col gap-1 text-xs text-ink/80">
        Fabric type (optional)
        <select value={fabric} onChange={(e) => setFabric(e.target.value)} className={inputCls}>
          <option value="">Not sure</option>
          {FABRICS.map((f) => <option key={f}>{f}</option>)}
        </select>
      </label>

      <div>
        <p className="mb-2 text-xs text-ink/80">Choose styles ({sel.length}/{MAX_STYLES_PER_RUN})</p>
        <div className="flex flex-wrap gap-2" role="group" aria-label="Outfit styles">
          {STYLES.map((s) => (
            <button key={s.id} type="button" aria-pressed={sel.includes(s.id)} onClick={() => toggle(s.id)} title={s.hint} className={cn('rounded-full px-3 py-1.5 text-xs transition', sel.includes(s.id) ? 'bg-primary text-white' : 'bg-blush text-primary hover:bg-rose-soft')}>
              {s.label}
            </button>
          ))}
        </div>
      </div>

      <button type="button" onClick={generate} disabled={running || enabled === false} className={btnPrimary + ' w-fit gap-2'}>
        {running ? <Loader2 className="size-4 animate-spin" /> : <Sparkles className="size-4" />} {running ? 'Generating… (about 10–30 sec each)' : 'Generate style ideas'}
      </button>

      {sel.some((id) => results[id]) && (
        <ul className="grid grid-cols-2 gap-3 md:grid-cols-3">
          {sel.filter((id) => results[id]).map((id) => {
            const s = STYLES.find((x) => x.id === id)!
            const r = results[id]
            return (
              <li key={id} className="overflow-hidden rounded-xl ring-1 ring-border">
                <div className="relative aspect-[3/4] bg-blush">
                  {r.status === 'loading' && <span className="absolute inset-0 flex items-center justify-center"><Loader2 className="size-7 animate-spin text-primary" /></span>}
                  {r.status === 'error' && <span className="absolute inset-0 flex items-center justify-center p-3 text-center text-xs text-destructive">{r.message}</span>}
                  {r.status === 'done' && r.image && (
                    <>
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img src={r.image} alt={`${s.label} style idea`} className="size-full object-cover" />
                      <span className="absolute left-1.5 top-1.5 rounded bg-black/55 px-1.5 py-0.5 text-[9px] text-white">AI concept</span>
                    </>
                  )}
                </div>
                <div className="flex items-center justify-between gap-1 p-2 text-xs">
                  <span className="min-w-0"><span className="block font-medium">{s.label}</span>{r.provider && <span className="block truncate text-[10px] text-muted-foreground">via {r.provider}</span>}</span>
                  <span className="flex gap-1">
                    {r.status === 'done' && r.image && (
                      <>
                        <a href={r.image} download={`${s.id}-style-idea.png`} aria-label="Download" className="rounded-md border border-input p-1.5"><Download className="size-3.5" /></a>
                        {onAdd && <button type="button" aria-label="Add to product photos" title="Add to product photos" onClick={async () => { onAdd(await compressDataUrl(r.image!, 900, 0.8)); toast.success('Added to product photos') }} className="rounded-md border border-input p-1.5 text-primary"><Plus className="size-3.5" /></button>}
                      </>
                    )}
                    {r.status !== 'loading' && <button type="button" aria-label="Generate again" disabled={running} onClick={() => void makeOne(id)} className="rounded-md border border-input p-1.5 disabled:opacity-50"><RefreshCw className="size-3.5" /></button>}
                  </span>
                </div>
              </li>
            )
          })}
        </ul>
      )}
    </div>
  )
}
