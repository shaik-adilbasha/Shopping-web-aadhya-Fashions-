'use client'

import { useEffect, useState } from 'react'
import { CheckCircle2, Circle, Video } from 'lucide-react'
import { toast } from 'sonner'
import { compressImage } from '@/lib/image'
import { useStore, type Order } from '@/lib/store'
import { saveVideo } from '@/lib/video-store'
import { btnOutline, btnPrimary, inputCls } from '@/lib/wa'

const REASONS = ['Damaged / defective', 'Wrong item received', 'Not as described / colour different', 'Size or fit problem', 'Missing parts', 'Other']
const MAX_MB = 40
const MIN_SEC = 3
const MAX_SEC = 120
const MIN_DESC = 30

function readDuration(file: File) {
  return new Promise<number>((res, rej) => {
    const v = document.createElement('video')
    const url = URL.createObjectURL(file)
    v.preload = 'metadata'
    v.onloadedmetadata = () => { URL.revokeObjectURL(url); res(v.duration) }
    v.onerror = () => { URL.revokeObjectURL(url); rej(new Error('unreadable')) }
    v.src = url
  })
}

/** Return request: detailed description + proof video are REQUIRED. */
export function ReturnForm({ order, onDone }: { order: Order; onDone: () => void }) {
  const { addReturn } = useStore()
  const [items, setItems] = useState<string[]>(order.items.length === 1 ? [order.items[0].slug] : [])
  const [reason, setReason] = useState('')
  const [desc, setDesc] = useState('')
  const [video, setVideo] = useState<File | null>(null)
  const [preview, setPreview] = useState('')
  const [photos, setPhotos] = useState<string[]>([])
  const [busy, setBusy] = useState(false)

  useEffect(() => () => { if (preview) URL.revokeObjectURL(preview) }, [preview])

  const pickVideo = async (f?: File) => {
    if (!f) return
    if (!f.type.startsWith('video/')) return toast.error('Please choose a video file.')
    if (f.size > MAX_MB * 1024 * 1024) return toast.error(`The video is too big. Please keep it under ${MAX_MB} MB (about 1 minute on a phone).`)
    try {
      const d = await readDuration(f)
      if (d < MIN_SEC) return toast.error(`The video is too short. Please record at least ${MIN_SEC} seconds.`)
      if (d > MAX_SEC) return toast.error(`The video is too long. Please keep it under ${MAX_SEC / 60} minutes.`)
    } catch {
      return toast.error('This video could not be read. Please try an MP4 video.')
    }
    if (preview) URL.revokeObjectURL(preview)
    setVideo(f)
    setPreview(URL.createObjectURL(f))
  }

  const checks = [
    { ok: items.length > 0, text: 'Choose the item(s) you are returning' },
    { ok: !!reason, text: 'Choose a reason' },
    { ok: desc.trim().length >= MIN_DESC, text: `Describe the problem in detail (at least ${MIN_DESC} characters)` },
    { ok: !!video, text: 'Add a video showing the product and the problem' },
  ]
  const ready = checks.every((c) => c.ok)

  const submit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!ready || !video) return toast.error('Please complete all the steps in the checklist.')
    setBusy(true)
    try {
      const key = `rv_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`
      await saveVideo(key, video)
      addReturn({
        orderId: order.id,
        userId: order.userId,
        customerName: order.customer.name,
        product: order.items.filter((i) => items.includes(i.slug)).map((i) => i.name).join(', '),
        reason,
        description: desc.trim(),
        photos,
        videoKey: key,
        videoName: video.name,
      })
      toast.success('Return request sent with your video. The shop will review it.')
      onDone()
    } catch {
      toast.error('Could not save the video on this device. Free some space or try a shorter video.')
      setBusy(false)
    }
  }

  return (
    <form onSubmit={submit} className="mt-3 flex flex-col gap-3 rounded-xl bg-blush/60 p-4 text-xs">
      <p className="text-sm font-medium text-ink">Return request</p>
      <p className="text-ink/80">A detailed description and a video are required, so the shop can check your return quickly.</p>

      {order.items.length > 1 && (
        <fieldset className="flex flex-col gap-1">
          <legend className="mb-1 text-ink/80">Which item(s)?</legend>
          {order.items.map((i) => (
            <label key={i.slug} className="flex items-center gap-2">
              <input type="checkbox" checked={items.includes(i.slug)} onChange={(e) => setItems((s) => (e.target.checked ? [...s, i.slug] : s.filter((x) => x !== i.slug)))} className="accent-primary" />
              {i.name} × {i.qty}
            </label>
          ))}
        </fieldset>
      )}

      <label className="flex flex-col gap-1 text-ink/80">
        Reason
        <select value={reason} onChange={(e) => setReason(e.target.value)} className={inputCls}>
          <option value="">Choose a reason</option>
          {REASONS.map((r) => <option key={r}>{r}</option>)}
        </select>
      </label>

      <label className="flex flex-col gap-1 text-ink/80">
        Detailed description ({desc.trim().length}/{MIN_DESC} minimum)
        <textarea rows={4} value={desc} onChange={(e) => setDesc(e.target.value)} placeholder="What is wrong? Where is the damage or difference? When did you notice it?" className={inputCls + ' h-auto py-2'} />
      </label>

      <div className="flex flex-col gap-2">
        <p className="text-ink/80">Proof video (required)</p>
        <ul className="list-disc pl-4 text-[11px] text-ink/70">
          <li>Show the parcel and its label, then open it on camera.</li>
          <li>Show the product clearly, including tags and the problem.</li>
          <li>{MIN_SEC} seconds to {MAX_SEC / 60} minutes, under {MAX_MB} MB.</li>
        </ul>
        <label className="flex w-fit cursor-pointer items-center gap-2 rounded-lg border border-primary bg-white px-3 py-2 text-primary hover:bg-blush">
          <Video className="size-4" /> {video ? 'Change video' : 'Record or choose a video'}
          <input type="file" accept="video/*" className="sr-only" onChange={(e) => { void pickVideo(e.target.files?.[0]); e.target.value = '' }} />
        </label>
        {preview && <video src={preview} controls playsInline className="max-h-56 w-full rounded-lg bg-black" />}
      </div>

      <label className="flex flex-col gap-1 text-ink/80">
        Photos (optional, up to 3)
        <input type="file" accept="image/*" multiple className="text-xs" onChange={async (e) => { const fs = Array.from(e.target.files ?? []).slice(0, 3 - photos.length); try { const n = await Promise.all(fs.map((f) => compressImage(f, 800, 0.75))); setPhotos((p) => [...p, ...n].slice(0, 3)) } catch { toast.error('Could not read that photo.') } e.target.value = '' }} />
      </label>
      {photos.length > 0 && (
        <div className="flex gap-2">{photos.map((p, i) => (
          // eslint-disable-next-line @next/next/no-img-element
          <img key={i} src={p} alt={`Return photo ${i + 1}`} className="size-14 rounded-md object-cover ring-1 ring-border" />
        ))}</div>
      )}

      <ul className="flex flex-col gap-1">
        {checks.map((c) => (
          <li key={c.text} className={c.ok ? 'flex items-center gap-1.5 text-green-700' : 'flex items-center gap-1.5 text-ink/60'}>
            {c.ok ? <CheckCircle2 className="size-3.5" /> : <Circle className="size-3.5" />} {c.text}
          </li>
        ))}
      </ul>

      <div className="flex gap-2">
        <button type="submit" disabled={!ready || busy} className={btnPrimary + ' h-10 disabled:opacity-50'}>{busy ? 'Saving…' : 'Submit Return Request'}</button>
        <button type="button" onClick={onDone} className={btnOutline + ' h-10'}>Cancel</button>
      </div>
    </form>
  )
}
