import { NextResponse, type NextRequest } from 'next/server'
import { isOwner } from '@/lib/owner-auth'
import { buildStylePrompt } from '@/lib/style-catalog'

export const maxDuration = 60

/**
 * Owner-only: makes ONE styled picture from a cloth photo.
 * Tries each configured AI service in order; if one is out of credits/limit the next one starts automatically.
 * If every service is used up, the owner is told "credits over". All keys stay on the server.
 * Order: IMAGE_PROVIDER_ORDER (default cloudflare,gemini,stability,replicate). Services without keys are skipped.
 */
type Img = { mime: string; b64: string }
type Out =
  | { image: string }
  | { error: 'limit' | 'failed' | 'blocked'; message: string; retryAfter?: number; detail?: string }
type Prov = { id: string; label: string; ready: () => boolean; run: (prompt: string, full: Img, small: Img) => Promise<Out> }

const env = process.env
const toData = (mime: string, buf: ArrayBuffer | Buffer) => `data:${mime};base64,${Buffer.from(buf as ArrayBuffer).toString('base64')}`
const blobOf = (i: Img) => new Blob([Buffer.from(i.b64, 'base64')], { type: i.mime })

/* ---------- Cloudflare Workers AI (free daily allowance) ---------- */
async function cloudflare(prompt: string, _full: Img, small: Img): Promise<Out> {
  const model = env.CLOUDFLARE_IMAGE_MODEL || '@cf/black-forest-labs/flux-2-klein-4b'
  const url = `https://api.cloudflare.com/client/v4/accounts/${env.CLOUDFLARE_ACCOUNT_ID}/ai/run/${model}`
  let detail = ''
  for (const field of ['input_image_0', 'input_image']) {
    const form = new FormData()
    form.append('prompt', prompt)
    form.append(field, blobOf(small), 'cloth.jpg')
    form.append('width', '768')
    form.append('height', '1024')
    const res = await fetch(url, { method: 'POST', headers: { Authorization: `Bearer ${env.CLOUDFLARE_API_TOKEN}` }, body: form })
    const ctype = res.headers.get('content-type') ?? ''
    if (res.ok && ctype.startsWith('image/')) return { image: toData(ctype, await res.arrayBuffer()) }
    const data = (await res.json().catch(() => ({}))) as { result?: { image?: string }; errors?: { code?: number; message?: string }[] }
    if (res.ok && data.result?.image) return { image: `data:image/png;base64,${data.result.image}` }
    detail = (data.errors ?? []).map((e) => `${e.code ?? ''} ${e.message ?? ''}`).join('; ').slice(0, 250)
    console.error('Cloudflare image error', res.status, detail)
    if (res.status === 429 || /neurons|daily free allocation|4006/i.test(detail)) return { error: 'limit', message: 'daily free allowance used (resets 5:30 AM India time)', detail }
    if (res.status === 401 || res.status === 403) return { error: 'failed', message: 'token rejected — check CLOUDFLARE_ACCOUNT_ID and the Workers AI token', detail }
  }
  return { error: 'failed', message: 'service error', detail }
}

/* ---------- Google Gemini ---------- */
async function gemini(prompt: string, full: Img): Promise<Out> {
  const model = env.GEMINI_IMAGE_MODEL || 'gemini-2.5-flash-image'
  const res = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent`, {
    method: 'POST',
    headers: { 'x-goog-api-key': env.GEMINI_API_KEY!, 'Content-Type': 'application/json' },
    body: JSON.stringify({ contents: [{ parts: [{ text: prompt }, { inline_data: { mime_type: full.mime, data: full.b64 } }] }], generationConfig: { responseModalities: ['TEXT', 'IMAGE'] } }),
  })
  const data = await res.json().catch(() => ({}))
  if (res.status === 429) {
    const detail = String(data?.error?.message ?? '').slice(0, 300)
    const delay = (data?.error?.details as { retryDelay?: string }[] | undefined)?.find((d) => d?.retryDelay)?.retryDelay
    console.error('Gemini 429:', detail)
    return { error: 'limit', message: /limit:\s*0/.test(detail) ? 'no free quota for this model' : 'free limit reached', retryAfter: delay ? Math.ceil(parseFloat(delay)) : undefined, detail }
  }
  if (!res.ok) {
    console.error('Gemini image error', res.status, data?.error?.message)
    return { error: 'failed', message: 'service error', detail: String(data?.error?.message ?? '').slice(0, 200) }
  }
  const parts: { inlineData?: { data?: string; mimeType?: string }; inline_data?: { data?: string; mime_type?: string } }[] = data?.candidates?.[0]?.content?.parts ?? []
  const part = parts.find((p) => p.inlineData?.data || p.inline_data?.data)
  const b64 = part?.inlineData?.data ?? part?.inline_data?.data
  if (!b64) return { error: 'blocked', message: 'the AI could not make this one' }
  return { image: `data:${part?.inlineData?.mimeType ?? part?.inline_data?.mime_type ?? 'image/png'};base64,${b64}` }
}

/* ---------- Stability AI (Style Guide: uses the cloth as the style reference; one-time free credits) ---------- */
async function stability(prompt: string, full: Img): Promise<Out> {
  const form = new FormData()
  form.append('prompt', prompt)
  form.append('image', blobOf(full), 'cloth.jpg')
  form.append('aspect_ratio', '3:4')
  form.append('fidelity', '0.8')
  form.append('output_format', 'jpeg')
  const res = await fetch('https://api.stability.ai/v2beta/stable-image/control/style', {
    method: 'POST',
    headers: { Authorization: `Bearer ${env.STABILITY_API_KEY}`, Accept: 'image/*' },
    body: form,
  })
  const ctype = res.headers.get('content-type') ?? ''
  if (res.ok && ctype.startsWith('image/')) return { image: toData(ctype, await res.arrayBuffer()) }
  const data = (await res.json().catch(() => ({}))) as { name?: string; errors?: string[] }
  const detail = (data.errors ?? [data.name ?? '']).join('; ').slice(0, 200)
  console.error('Stability error', res.status, detail)
  if (res.status === 402 || res.status === 429) return { error: 'limit', message: res.status === 402 ? 'credits used up' : 'rate limit reached', detail }
  if (res.status === 403) return { error: 'blocked', message: 'the AI could not make this one', detail }
  return { error: 'failed', message: 'service error', detail }
}

/* ---------- Replicate (pay-per-image) ---------- */
async function replicate(prompt: string, full: Img): Promise<Out> {
  const model = env.REPLICATE_IMAGE_MODEL || 'black-forest-labs/flux-kontext-pro'
  const headers = { Authorization: `Bearer ${env.REPLICATE_API_TOKEN}`, 'Content-Type': 'application/json' }
  let res = await fetch(`https://api.replicate.com/v1/models/${model}/predictions`, {
    method: 'POST',
    headers: { ...headers, Prefer: 'wait=55' },
    body: JSON.stringify({ input: { prompt, input_image: `data:${full.mime};base64,${full.b64}`, aspect_ratio: '3:4', output_format: 'jpg' } }),
  })
  let data = (await res.json().catch(() => ({}))) as { status?: string; output?: string | string[]; error?: string; detail?: string; urls?: { get?: string } }
  if (res.status === 402 || res.status === 429) {
    console.error('Replicate', res.status, data.detail)
    return { error: 'limit', message: res.status === 402 ? 'credit used up' : 'rate limit reached', detail: String(data.detail ?? '').slice(0, 200) }
  }
  if (!res.ok) {
    console.error('Replicate error', res.status, data.detail)
    return { error: 'failed', message: 'service error', detail: String(data.detail ?? '').slice(0, 200) }
  }
  for (let i = 0; i < 12 && data.status && ['starting', 'processing'].includes(data.status) && data.urls?.get; i++) {
    await new Promise((r) => setTimeout(r, 2500))
    res = await fetch(data.urls.get, { headers })
    data = await res.json().catch(() => ({}))
  }
  const url = Array.isArray(data.output) ? data.output[0] : data.output
  if (data.status !== 'succeeded' || !url) return { error: data.status === 'failed' ? 'blocked' : 'failed', message: 'the AI could not make this one', detail: String(data.error ?? '').slice(0, 200) }
  const img = await fetch(url)
  if (!img.ok) return { error: 'failed', message: 'could not download the result' }
  return { image: toData(img.headers.get('content-type') || 'image/jpeg', await img.arrayBuffer()) }
}

const ALL: Prov[] = [
  { id: 'cloudflare', label: 'Cloudflare', ready: () => !!(env.CLOUDFLARE_ACCOUNT_ID && env.CLOUDFLARE_API_TOKEN), run: (p, f, s) => cloudflare(p, f, s) },
  { id: 'gemini', label: 'Google Gemini', ready: () => !!env.GEMINI_API_KEY, run: (p, f) => gemini(p, f) },
  { id: 'stability', label: 'Stability AI', ready: () => !!env.STABILITY_API_KEY, run: (p, f) => stability(p, f) },
  { id: 'replicate', label: 'Replicate', ready: () => !!env.REPLICATE_API_TOKEN, run: (p, f) => replicate(p, f) },
]

function chain(): Prov[] {
  const order = (env.IMAGE_PROVIDER_ORDER || 'cloudflare,gemini,stability,replicate').split(',').map((s) => s.trim())
  const first = env.IMAGE_PROVIDER
  const ids = [...(first ? [first] : []), ...order].filter((v, i, a) => a.indexOf(v) === i)
  return ids.map((id) => ALL.find((p) => p.id === id)).filter((p): p is Prov => !!p && p.ready())
}

export function GET() {
  const c = chain()
  return NextResponse.json({ enabled: c.length > 0, providers: c.map((p) => p.label) })
}

export async function POST(req: NextRequest) {
  if (!(await isOwner())) return NextResponse.json({ error: 'Please log in as the owner.' }, { status: 401 })
  const providers = chain()
  if (providers.length === 0) return NextResponse.json({ error: 'not-configured', message: 'AI style ideas are not switched on yet. Add at least one AI key (Cloudflare is free) in the settings.' }, { status: 503 })

  const body = (await req.json().catch(() => ({}))) as { image?: string; imageSmall?: string; style?: string; fabric?: string }
  const parse = (s?: string): Img | null => {
    const m = /^data:(image\/(?:png|jpe?g|webp));base64,([A-Za-z0-9+/=]+)$/.exec(s ?? '')
    return m && m[2].length <= 3_500_000 ? { mime: m[1], b64: m[2] } : null
  }
  const full = parse(body.image)
  const small = parse(body.imageSmall) ?? full
  const prompt = buildStylePrompt(String(body.style), body.fabric)
  if (!full || !small || !prompt) return NextResponse.json({ error: 'invalid', message: 'Please upload a clear photo of the cloth (JPG, PNG or WebP).' }, { status: 400 })

  const tried: string[] = []
  let retryAfter: number | undefined
  let allLimit = true
  let lastMessage = ''
  for (const p of providers) {
    try {
      const out = await p.run(prompt, full, small)
      if ('image' in out) return NextResponse.json({ image: out.image, provider: p.label })
      tried.push(`${p.label}: ${out.message}`)
      lastMessage = out.message
      if (out.error !== 'limit') allLimit = false
      if (out.retryAfter) retryAfter = Math.min(retryAfter ?? Infinity, out.retryAfter)
    } catch (e) {
      console.error(p.id, 'request failed', e instanceof Error ? e.message : e)
      tried.push(`${p.label}: could not connect`)
      allLimit = false
    }
  }
  if (allLimit) {
    return NextResponse.json(
      { error: 'credits-over', retryAfter, message: `All AI credits are over for now (${providers.map((p) => p.label).join(', ')}). Free allowances reset daily — Cloudflare at 5:30 AM India time. You can also add credits or another AI key.`, detail: tried.join(' | ') },
      { status: 429 },
    )
  }
  return NextResponse.json({ error: 'failed', message: `Could not make this picture. ${lastMessage ? `(${lastMessage}) ` : ''}Try another photo or style.`, detail: tried.join(' | ') }, { status: 502 })
}
