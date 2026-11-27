'use client'

import Image from 'next/image'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { useMemo, useState } from 'react'
import { BarChart3, ChevronLeft, ChevronRight, LogOut, MessageSquareText, PackageCheck, Pencil, Plus, RotateCcw, Settings as Cog, Store, Trash2, Users, X } from 'lucide-react'
import { toast } from 'sonner'
import { ownerLogout } from '@/app/actions/owner'
import { LogoImage } from '@/components/brand/logo'
import { StyleIdeas } from './style-ideas'
import { ReturnVideo } from './return-video'
import { categories, formatINR, mergedProducts, mergedServices, slugify, type Product, type Service } from '@/lib/catalog'
import { useStore, type BookingStatus, type OrderStatus, type PaymentStatus, type Settings } from '@/lib/store'
import { btnOutline, btnPrimary, inputCls } from '@/lib/wa'
import { cn } from '@/lib/utils'

const NAV = [
  { id: 'sales', label: 'Sales Dashboard', icon: BarChart3 },
  { id: 'customers', label: 'Customer Details', icon: Users },
  { id: 'stocks', label: 'Add / Update Stocks', icon: PackageCheck },
  { id: 'returns', label: 'Returns & Refunds', icon: RotateCcw },
  { id: 'reviews', label: 'Reviews & Ratings', icon: MessageSquareText },
] as const
type Tab = (typeof NAV)[number]['id'] | 'settings'

const card = 'rounded-2xl bg-white p-4 ring-1 ring-border md:p-5'
const pill = (s: string) => cn('rounded-full px-2.5 py-0.5 text-[11px] font-medium', /Paid|Delivered|Completed|Accepted|Approved/.test(s) ? 'bg-green-100 text-green-700' : /Cancel|Reject|Failed/.test(s) ? 'bg-red-100 text-red-700' : 'bg-amber-100 text-amber-700')
const fdate = (d: string) => new Date(d).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })

export function OwnerApp() {
  const router = useRouter()
  const [tab, setTab] = useState<Tab>('sales')
  const [collapsed, setCollapsed] = useState(false)
  const { settings } = useStore()
  const title = tab === 'settings' ? 'Settings' : NAV.find((n) => n.id === tab)!.label
  return (
    <div className="flex min-h-svh bg-background">
      <aside className={cn('sticky top-0 hidden h-svh shrink-0 flex-col bg-plum text-white transition-[width] duration-300 md:flex', collapsed ? 'w-[72px]' : 'w-64')}>
        <div className="flex justify-center px-3 py-5"><LogoImage priority className={collapsed ? 'w-12' : 'w-24'} /></div>
        <nav className="flex flex-1 flex-col gap-1 px-3" aria-label="Owner">
          {NAV.map(({ id, label, icon: Icon }) => (
            <button key={id} type="button" onClick={() => setTab(id)} title={label} aria-current={tab === id ? 'page' : undefined} className={cn('flex items-center gap-3 rounded-xl px-3 py-3 text-sm transition', tab === id ? 'bg-primary text-white' : 'text-white/75 hover:bg-white/10', collapsed && 'justify-center px-0')}>
              <Icon className="size-5 shrink-0" />{!collapsed && label}
            </button>
          ))}
        </nav>
        <button type="button" onClick={() => setCollapsed((c) => !c)} className="m-3 flex items-center justify-center rounded-xl py-2 text-white/70 hover:bg-white/10" aria-label="Toggle sidebar">{collapsed ? <ChevronRight className="size-5" /> : <ChevronLeft className="size-5" />}</button>
      </aside>
      <div className="flex min-w-0 flex-1 flex-col">
        <header className="sticky top-0 z-30 flex items-center justify-between bg-plum px-4 py-3 text-white md:px-8">
          <h1 className="font-serif text-xl">{title}</h1>
          <div className="flex items-center gap-1">
            <Link href="/" className="mr-2 flex items-center gap-1.5 rounded-lg px-3 py-2 text-xs hover:bg-white/10"><Store className="size-4" /> View store</Link>
            <button type="button" onClick={() => setTab('settings')} aria-label="Settings" className={cn('rounded-full p-2 hover:bg-white/10', tab === 'settings' && 'bg-white/15')}><Cog className="size-5" /></button>
            <button type="button" aria-label="Logout" onClick={async () => { await ownerLogout(); router.push('/owner/login') }} className="rounded-full p-2 hover:bg-white/10"><LogOut className="size-5" /></button>
          </div>
        </header>
        <nav className="flex gap-2 overflow-x-auto px-4 pt-3 md:hidden" aria-label="Owner sections">
          {NAV.map((n) => <button key={n.id} type="button" onClick={() => setTab(n.id)} className={cn('shrink-0 rounded-full px-3 py-1.5 text-xs', tab === n.id ? 'bg-primary text-white' : 'bg-white ring-1 ring-border')}>{n.label}</button>)}
        </nav>
        <main className="flex-1 px-4 py-5 md:px-8">
          <p className="mb-4 rounded-xl bg-amber-50 px-4 py-2 text-[11px] text-amber-800">Trial mode: {settings.boutiqueName} data is saved in this browser only. Connect a hosted database to share orders across devices.</p>
          {tab === 'sales' && <Sales />}
          {tab === 'customers' && <Customers />}
          {tab === 'stocks' && <Stocks />}
          {tab === 'returns' && <Returns />}
          {tab === 'reviews' && <Reviews />}
          {tab === 'settings' && <SettingsPanel />}
        </main>
      </div>
    </div>
  )
}

function Sales() {
  const { allOrders, allBookings } = useStore()
  const live = allOrders.filter((o) => o.status !== 'Cancelled')
  const sum = (a: typeof allOrders) => a.reduce((n, o) => n + o.total, 0)
  const now = new Date()
  const today = live.filter((o) => new Date(o.placedAt).toDateString() === now.toDateString())
  const month = live.filter((o) => { const d = new Date(o.placedAt); return d.getMonth() === now.getMonth() && d.getFullYear() === now.getFullYear() })
  const stats = [
    ['Total Sales', formatINR(sum(live))],
    ["Today's Sales", formatINR(sum(today))], ['Monthly Sales', formatINR(sum(month))], ['Total Orders', allOrders.length],
    ['Pending Orders', allOrders.filter((o) => ['Placed', 'Confirmed', 'Packed', 'Shipped'].includes(o.status)).length],
    ['Completed Orders', allOrders.filter((o) => o.status === 'Delivered').length],
    ['Cancelled Orders', allOrders.filter((o) => o.status === 'Cancelled').length],
    ['Pending Payments', allOrders.filter((o) => o.paymentStatus === 'Payment Pending' && o.status !== 'Cancelled').length],
  ]
  const days = Array.from({ length: 7 }, (_, i) => { const d = new Date(); d.setDate(d.getDate() - (6 - i)); return { l: d.toLocaleDateString('en-IN', { weekday: 'short' }), v: sum(live.filter((o) => new Date(o.placedAt).toDateString() === d.toDateString())) } })
  const max = Math.max(1, ...days.map((d) => d.v))
  return (
    <div className="flex flex-col gap-5">
      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">{stats.map(([l, v]) => <div key={l} className={card}><p className="text-xs text-muted-foreground">{l}</p><p className="mt-1 font-serif text-2xl text-ink">{v}</p></div>)}</div>
      <section className={card}>
        <p className="text-sm font-medium">Sales — last 7 days</p>
        <div className="mt-4 flex h-40 items-end gap-3">{days.map((d) => <div key={d.l} className="flex flex-1 flex-col items-center gap-1"><span className="text-[10px] text-muted-foreground">{d.v ? formatINR(d.v) : ''}</span><span className="w-full rounded-t-md bg-primary/80" style={{ height: `${Math.max(3, (d.v / max) * 100)}%` }} /><span className="text-[10px]">{d.l}</span></div>)}</div>
      </section>
      <div className="grid gap-5 lg:grid-cols-2">
        <section className={card}><p className="text-sm font-medium">Recent Orders</p>{allOrders.length === 0 && <p className="mt-3 text-xs text-muted-foreground">No orders yet.</p>}<ul className="mt-3 divide-y divide-border text-xs">{allOrders.slice(0, 6).map((o) => <li key={o.id} className="flex items-center justify-between py-2"><span>#{o.id} · {o.customer.name}</span><span className="flex items-center gap-2">{formatINR(o.total)}<span className={pill(o.paymentStatus)}>{o.paymentStatus}</span></span></li>)}</ul></section>
        <section className={card}><p className="text-sm font-medium">Recent Service Bookings</p>{allBookings.length === 0 && <p className="mt-3 text-xs text-muted-foreground">No bookings yet.</p>}<ul className="mt-3 divide-y divide-border text-xs">{allBookings.slice(0, 6).map((b) => <li key={b.id} className="flex items-center justify-between py-2"><span>{b.service} · {b.name}</span><span className={pill(b.status)}>{b.status}</span></li>)}</ul></section>
      </div>
    </div>
  )
}

function Customers() {
  const { users, allOrders, allBookings } = useStore()
  const [q, setQ] = useState('')
  const [flt, setFlt] = useState<'all' | 'buyers' | 'none'>('all')
  const [open, setOpen] = useState<string | null>(null)
  const rows = users.map((u) => { const os = allOrders.filter((o) => o.userId === u.id); return { u, os, bs: allBookings.filter((b) => b.userId === u.id), total: os.filter((o) => o.status !== 'Cancelled').reduce((n, o) => n + o.total, 0) } })
    .filter((r) => `${r.u.name} ${r.u.email} ${r.u.phone}`.toLowerCase().includes(q.toLowerCase()) && (flt === 'all' || (flt === 'buyers') === r.os.length > 0))
  return (
    <div className="flex flex-col gap-4">
      <div className="flex gap-3"><input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Search name, phone or email" className={inputCls} aria-label="Search customers" /><select value={flt} onChange={(e) => setFlt(e.target.value as typeof flt)} className={inputCls + ' max-w-44'} aria-label="Filter"><option value="all">All customers</option><option value="buyers">With orders</option><option value="none">No orders yet</option></select></div>
      {rows.length === 0 && <p className={card + ' text-center text-sm text-muted-foreground'}>No customers found.</p>}
      {rows.map(({ u, os, bs, total }) => (
        <div key={u.id} className={card}>
          <button type="button" className="flex w-full items-center justify-between text-left" onClick={() => setOpen(open === u.id ? null : u.id)}>
            <span><span className="block text-sm font-medium">{u.name}</span><span className="text-xs text-muted-foreground">+91 {u.phone} · {u.email}</span></span>
            <span className="text-right text-xs"><span className="block font-semibold">{formatINR(total)}</span>{os.length} orders · {bs.length} bookings</span>
          </button>
          {open === u.id && (
            <div className="mt-3 grid gap-3 border-t border-border pt-3 text-xs md:grid-cols-3">
              <div><p className="font-medium">Addresses</p>{u.addresses.length ? u.addresses.map((a) => <p key={a.id} className="mt-1 text-muted-foreground">{a.address}, {a.city}, {a.state} - {a.pincode}</p>) : <p className="mt-1 text-muted-foreground">None saved</p>}</div>
              <div><p className="font-medium">Order history</p>{os.map((o) => <p key={o.id} className="mt-1">#{o.id} · {formatINR(o.total)} · {o.status}</p>)}{!os.length && <p className="mt-1 text-muted-foreground">None</p>}</div>
              <div><p className="font-medium">Booking history</p>{bs.map((b) => <p key={b.id} className="mt-1">{b.service} · {fdate(b.date)} · {b.status}</p>)}{!bs.length && <p className="mt-1 text-muted-foreground">None</p>}</div>
            </div>
          )}
        </div>
      ))}
    </div>
  )
}

function Stocks() {
  const [sub, setSub] = useState<'products' | 'services' | 'orders' | 'bookings' | 'style'>('products')
  return (
    <div className="flex flex-col gap-4">
      <div className="flex flex-wrap gap-2">{(['products', 'services', 'orders', 'bookings', 'style'] as const).map((s) => <button key={s} type="button" onClick={() => setSub(s)} className={cn('rounded-full px-4 py-2 text-xs capitalize', sub === s ? 'bg-primary text-white' : 'bg-white ring-1 ring-border')}>{s === 'style' ? 'Style Ideas (AI)' : s === 'orders' ? 'Order Management' : s === 'bookings' ? 'Booking Management' : s === 'products' ? 'Product Management' : 'Service Management'}</button>)}</div>
      {sub === 'products' && <ProductsAdmin />}
      {sub === 'services' && <ServicesAdmin />}
      {sub === 'orders' && <OrdersAdmin />}
      {sub === 'bookings' && <BookingsAdmin />}
      {sub === 'style' && <StyleIdeas />}
    </div>
  )
}

async function compress(file: File, max = 900): Promise<string> {
  const url = URL.createObjectURL(file)
  const img = await new Promise<HTMLImageElement>((res, rej) => { const i = new window.Image(); i.onload = () => res(i); i.onerror = rej; i.src = url })
  const r = Math.min(1, max / Math.max(img.width, img.height))
  const c = document.createElement('canvas'); c.width = Math.round(img.width * r); c.height = Math.round(img.height * r)
  c.getContext('2d')!.drawImage(img, 0, 0, c.width, c.height)
  URL.revokeObjectURL(url)
  return c.toDataURL('image/jpeg', 0.78)
}
function ImagePicker({ images, onChange, multiple }: { images: string[]; onChange: (i: string[]) => void; multiple?: boolean }) {
  return (
    <div className="flex flex-wrap items-center gap-2">
      {images.map((src, i) => <span key={i} className="relative size-16 overflow-hidden rounded-lg ring-1 ring-border"><Image src={src} alt="" fill sizes="64px" className="object-cover" /><button type="button" aria-label="Remove image" onClick={() => onChange(images.filter((_, j) => j !== i))} className="absolute right-0 top-0 rounded-bl bg-black/60 p-0.5 text-white"><X className="size-3" /></button></span>)}
      <label className="flex size-16 cursor-pointer items-center justify-center rounded-lg border border-dashed border-primary text-primary"><Plus className="size-5" /><input type="file" accept="image/*" multiple={multiple} className="sr-only" onChange={async (e) => { const fs = Array.from(e.target.files ?? []); try { const n = await Promise.all(fs.map((f) => compress(f))); onChange(multiple ? [...images, ...n] : n) } catch { toast.error('Could not read that image.') } e.target.value = '' }} /></label>
    </div>
  )
}
const L = ({ t, children }: { t: string; children: React.ReactNode }) => <label className="flex flex-col gap-1 text-xs text-ink/80">{t}{children}</label>

function ProductsAdmin() {
  const { customProducts, productOv, saveProduct, deleteCustomProduct, patchProduct } = useStore()
  const all = useMemo(() => mergedProducts(customProducts, productOv), [customProducts, productOv])
  const blank = { slug: '', name: '', cat: 'sarees', mrp: '', price: '', stock: '1', desc: '', colors: '', sizes: '', images: [] as string[], featured: false, isNew: false, published: true }
  const [f, setF] = useState<typeof blank | null>(null)
  const [editing, setEditing] = useState<string | null>(null)
  const [showAI, setShowAI] = useState(false)
  const isCustom = (slug: string) => customProducts.some((p) => p.slug === slug)
  const edit = (p: (typeof all)[number]) => { setEditing(p.slug); setF({ slug: p.slug, name: p.name, cat: p.category, mrp: String(p.mrp), price: String(p.price), stock: String(p.stock), desc: p.description, colors: p.colors.map((c) => `${c.name}:${c.hex}`).join(', '), sizes: p.specs?.Sizes ?? '', images: p.images, featured: !!p.featured, isNew: !!p.newArrival, published: p.published !== false }) }
  const submit = (e: React.FormEvent) => {
    e.preventDefault()
    if (!f) return
    const mrp = Number(f.mrp), price = f.price ? Number(f.price) : mrp
    if (!(mrp > 0) || price > mrp) return toast.error('Price must be greater than 0, and discount price cannot exceed price.')
    if (f.images.length === 0) return toast.error('Please upload at least one image.')
    const slug = editing ?? slugify(f.name) + (all.some((p) => p.slug === slugify(f.name)) ? '-' + Date.now().toString().slice(-4) : '')
    const old = all.find((p) => p.slug === editing)
    const colors = f.colors.split(',').map((c) => c.trim()).filter(Boolean).map((c) => { const [name, hex] = c.split(':'); return { name: name.trim(), hex: (hex ?? '#d81b6a').trim() } })
    const p: Product = { slug, name: f.name.trim(), subtitle: old?.subtitle ?? '', category: f.cat as Product['category'], price, mrp, rating: old?.rating ?? 4.5, reviews: old?.reviews ?? 0, images: f.images, colors, description: f.desc, highlights: old?.highlights ?? [], specs: { ...(old?.specs ?? {}), ...(f.sizes ? { Sizes: f.sizes } : {}) }, stock: Math.max(0, parseInt(f.stock) || 0), featured: f.featured, newArrival: f.isNew }
    saveProduct(p, editing ? isCustom(editing) : true)
    patchProduct(slug, { published: f.published })
    toast.success(editing ? 'Product updated' : 'Product added — it is now on the storefront')
    setF(null); setEditing(null)
  }
  return (
    <div className="flex flex-col gap-4">
      {!f && <button type="button" onClick={() => { setEditing(null); setF({ ...blank }) }} className={btnPrimary + ' w-fit gap-2'}><Plus className="size-4" /> Add Product</button>}
      {f && (
        <form onSubmit={submit} className={card + ' grid gap-3 md:grid-cols-2'}>
          <p className="text-sm font-medium md:col-span-2">{editing ? 'Edit product' : 'New product'}</p>
          <L t="Name"><input required minLength={2} value={f.name} onChange={(e) => setF({ ...f, name: e.target.value })} className={inputCls} /></L>
          <L t="Category"><select value={f.cat} onChange={(e) => setF({ ...f, cat: e.target.value })} className={inputCls}>{categories.map((c) => <option key={c.id} value={c.id}>{c.label}</option>)}</select></L>
          <L t="Price (MRP) ₹"><input required type="number" min={1} value={f.mrp} onChange={(e) => setF({ ...f, mrp: e.target.value })} className={inputCls} /></L>
          <L t="Discount price ₹ (optional)"><input type="number" min={1} value={f.price} onChange={(e) => setF({ ...f, price: e.target.value })} className={inputCls} /></L>
          <L t="Stock quantity"><input required type="number" min={0} value={f.stock} onChange={(e) => setF({ ...f, stock: e.target.value })} className={inputCls} /></L>
          <L t="Sizes (comma separated, optional)"><input value={f.sizes} onChange={(e) => setF({ ...f, sizes: e.target.value })} className={inputCls} /></L>
          <L t="Colours (Name:#hex, comma separated)"><input value={f.colors} onChange={(e) => setF({ ...f, colors: e.target.value })} placeholder="Rani Pink:#d81b6a, Green:#1f7a3e" className={inputCls} /></L>
          <div className="flex flex-wrap items-center gap-4 text-xs">{([['featured', 'Featured'], ['isNew', 'New Arrival'], ['published', 'Published']] as const).map(([k, l]) => <label key={k} className="flex items-center gap-2"><input type="checkbox" checked={f[k]} onChange={(e) => setF({ ...f, [k]: e.target.checked })} className="accent-primary" />{l}</label>)}</div>
          <div className="md:col-span-2"><L t="Description"><textarea rows={3} value={f.desc} onChange={(e) => setF({ ...f, desc: e.target.value })} className={inputCls + ' h-auto py-2'} /></L></div>
          <div className="md:col-span-2"><p className="mb-1 text-xs text-ink/80">Images (multiple)</p><ImagePicker multiple images={f.images} onChange={(images) => setF({ ...f, images })} />
            {f.images.length > 0 && <button type="button" onClick={() => setShowAI((v) => !v)} className="mt-2 flex items-center gap-1.5 text-xs text-primary underline">✨ {showAI ? 'Hide AI style ideas' : 'Generate style ideas from this cloth (AI)'}</button>}
          </div>
          {showAI && f.images[0] && <div className="md:col-span-2"><StyleIdeas image={f.images[0]} onAdd={(src) => setF((cur) => (cur ? { ...cur, images: [...cur.images, src] } : cur))} /></div>}
          <div className="flex gap-3 md:col-span-2"><button type="submit" className={btnPrimary}>Save Product</button><button type="button" onClick={() => { setF(null); setEditing(null) }} className={btnOutline}>Cancel</button></div>
        </form>
      )}
      <ul className="flex flex-col gap-2">
        {all.map((p) => (
          <li key={p.slug} className={card + ' flex flex-wrap items-center gap-3 !p-3'}>
            <span className="relative size-14 shrink-0 overflow-hidden rounded-lg"><Image src={p.images[0] || '/placeholder.svg'} alt="" fill sizes="56px" className="object-cover" /></span>
            <span className="min-w-0 flex-1 text-sm"><span className="block truncate">{p.name}</span><span className="text-xs text-muted-foreground">{formatINR(p.price)} · {p.published === false ? 'Unpublished' : 'Published'}</span></span>
            <label className="flex items-center gap-1 text-xs">Stock <input type="number" min={0} value={p.stock} onChange={(e) => patchProduct(p.slug, { stock: Math.max(0, parseInt(e.target.value) || 0) })} className="h-8 w-16 rounded-md border border-input px-2" /></label>
            <button type="button" onClick={() => patchProduct(p.slug, { published: p.published === false })} className="rounded-lg border border-input px-2.5 py-1.5 text-xs">{p.published === false ? 'Publish' : 'Unpublish'}</button>
            <button type="button" aria-label="Edit" onClick={() => edit(p)} className="rounded-lg border border-input p-2 text-primary"><Pencil className="size-4" /></button>
            <button type="button" aria-label="Delete" onClick={() => { if (!window.confirm(`Delete ${p.name}?`)) return; if (isCustom(p.slug)) deleteCustomProduct(p.slug); else patchProduct(p.slug, { published: false }); toast.success(isCustom(p.slug) ? 'Deleted' : 'Removed from storefront') }} className="rounded-lg border border-input p-2 text-destructive"><Trash2 className="size-4" /></button>
          </li>
        ))}
      </ul>
    </div>
  )
}

function ServicesAdmin() {
  const { customServices, serviceOv, saveService, deleteCustomService, patchService } = useStore()
  const all = useMemo(() => mergedServices(customServices, serviceOv), [customServices, serviceOv])
  const [f, setF] = useState<{ slug: string; name: string; tagline: string; price: string; duration: string; desc: string; image: string; includes: string } | null>(null)
  const [editing, setEditing] = useState<string | null>(null)
  const isCustom = (slug: string) => customServices.some((s) => s.slug === slug)
  const submit = (e: React.FormEvent) => {
    e.preventDefault()
    if (!f) return
    if (!f.image) return toast.error('Please upload an image.')
    const slug = editing ?? slugify(f.name) + (all.some((s) => s.slug === slugify(f.name)) ? '-' + Date.now().toString().slice(-4) : '')
    const s: Service = { slug, name: f.name.trim(), tagline: f.tagline, startingPrice: Number(f.price) || 0, image: f.image, description: f.desc, includes: f.includes.split(',').map((x) => x.trim()).filter(Boolean), duration: f.duration }
    saveService(s, editing ? isCustom(editing) : true)
    toast.success('Service saved')
    setF(null); setEditing(null)
  }
  return (
    <div className="flex flex-col gap-4">
      {!f && <button type="button" onClick={() => setF({ slug: '', name: '', tagline: '', price: '', duration: '', desc: '', image: '', includes: '' })} className={btnPrimary + ' w-fit gap-2'}><Plus className="size-4" /> Add Service</button>}
      {f && (
        <form onSubmit={submit} className={card + ' grid gap-3 md:grid-cols-2'}>
          <L t="Service name"><input required value={f.name} onChange={(e) => setF({ ...f, name: e.target.value })} className={inputCls} /></L>
          <L t="Tagline"><input value={f.tagline} onChange={(e) => setF({ ...f, tagline: e.target.value })} className={inputCls} /></L>
          <L t="Starting price ₹"><input required type="number" min={0} value={f.price} onChange={(e) => setF({ ...f, price: e.target.value })} className={inputCls} /></L>
          <L t="Typical duration"><input value={f.duration} onChange={(e) => setF({ ...f, duration: e.target.value })} className={inputCls} /></L>
          <div className="md:col-span-2"><L t="What’s included (comma separated)"><input value={f.includes} onChange={(e) => setF({ ...f, includes: e.target.value })} className={inputCls} /></L></div>
          <div className="md:col-span-2"><L t="Description"><textarea rows={3} value={f.desc} onChange={(e) => setF({ ...f, desc: e.target.value })} className={inputCls + ' h-auto py-2'} /></L></div>
          <div className="md:col-span-2"><p className="mb-1 text-xs">Image</p><ImagePicker images={f.image ? [f.image] : []} onChange={(i) => setF({ ...f, image: i[0] ?? '' })} /></div>
          <div className="flex gap-3 md:col-span-2"><button type="submit" className={btnPrimary}>Save Service</button><button type="button" onClick={() => { setF(null); setEditing(null) }} className={btnOutline}>Cancel</button></div>
        </form>
      )}
      <ul className="flex flex-col gap-2">{all.map((s) => (
        <li key={s.slug} className={card + ' flex flex-wrap items-center gap-3 !p-3'}>
          <span className="relative size-14 shrink-0 overflow-hidden rounded-lg"><Image src={s.image || '/placeholder.svg'} alt="" fill sizes="56px" className="object-cover" /></span>
          <span className="min-w-0 flex-1 text-sm"><span className="block truncate">{s.name}</span><span className="text-xs text-muted-foreground">From {formatINR(s.startingPrice)} · {s.enabled === false ? 'Disabled' : 'Enabled'}</span></span>
          <button type="button" onClick={() => patchService(s.slug, { enabled: s.enabled === false })} className="rounded-lg border border-input px-2.5 py-1.5 text-xs">{s.enabled === false ? 'Enable' : 'Disable'}</button>
          <button type="button" aria-label="Edit" onClick={() => { setEditing(s.slug); setF({ slug: s.slug, name: s.name, tagline: s.tagline, price: String(s.startingPrice), duration: s.duration, desc: s.description, image: s.image, includes: s.includes.join(', ') }) }} className="rounded-lg border border-input p-2 text-primary"><Pencil className="size-4" /></button>
          <button type="button" aria-label="Delete" onClick={() => { if (!window.confirm(`Delete ${s.name}?`)) return; if (isCustom(s.slug)) deleteCustomService(s.slug); else patchService(s.slug, { enabled: false }) }} className="rounded-lg border border-input p-2 text-destructive"><Trash2 className="size-4" /></button>
        </li>))}</ul>
    </div>
  )
}

const ORDER_STATUS: OrderStatus[] = ['Placed', 'Confirmed', 'Packed', 'Shipped', 'Delivered', 'Cancelled']
const PAY_STATUS: PaymentStatus[] = ['Payment Pending', 'Verification Pending', 'Paid', 'Failed', 'Refunded']

function OrdersAdmin() {
  const { allOrders, updateOrder, settings } = useStore()
  const [q, setQ] = useState('')
  const rows = allOrders.filter((o) => `${o.id} ${o.customer.name} ${o.customer.phone} ${o.utr ?? ''}`.toLowerCase().includes(q.toLowerCase()))
  const markPaid = (id: string, total: number) => { if (window.confirm(`Confirm you SEE ${formatINR(total)} credited in your bank/UPI app for this order?`)) updateOrder(id, { paymentStatus: 'Paid' }) }
  return (
    <div className="flex flex-col gap-3">
      <input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Search order ID, name or phone" className={inputCls} />
      {rows.length === 0 && <p className={card + ' text-center text-sm text-muted-foreground'}>No orders yet.</p>}
      {rows.map((o) => (
        <div key={o.id} className={card}>
          <div className="flex flex-wrap justify-between gap-2 text-sm"><span className="font-medium">#{o.id} · {o.customer.name} · +91 {o.customer.phone}</span><span className="font-semibold">{formatINR(o.total)} <span className="text-xs font-normal text-muted-foreground">({o.paymentMethod.toUpperCase()})</span></span></div>
          <p className="mt-1 text-xs text-muted-foreground">{o.items.map((i) => `${i.name} × ${i.qty}`).join(', ')} — {o.address.address}, {o.address.city}, {o.address.state} {o.address.pincode}</p>
          {o.paymentMethod === 'upi' && (o.utr || o.paymentProof) && (
            <div className="mt-2 rounded-xl bg-amber-50 p-3 text-xs text-amber-900">
              <p>Customer’s UPI reference (UTR): <b>{o.utr ?? '—'}</b> · Expected amount: <b>{formatINR(o.total)}</b></p>
              {o.utr && allOrders.some((x) => x.id !== o.id && x.utr === o.utr) && <p className="mt-1 font-medium text-red-700">⚠ This UTR was used on another order — likely fake.</p>}
              <p className="mt-1">Match this UTR and amount in your bank/UPI app before marking Paid.</p>
              {o.paymentProof && (
                <details className="mt-1"><summary className="cursor-pointer text-primary">View screenshot</summary>{/* eslint-disable-next-line @next/next/no-img-element */}<img src={o.paymentProof} alt="Payment screenshot" className="mt-2 max-h-80 rounded-lg" /></details>
              )}
            </div>
          )}
          {o.paymentMethod === 'upi' && ['Payment Pending', 'Verification Pending'].includes(o.paymentStatus) && (
            <div className="mt-2 flex gap-2 text-xs">
              <button type="button" onClick={() => markPaid(o.id, o.total)} className="rounded-md bg-green-600 px-3 py-1.5 text-white">✔ Payment received — mark Paid</button>
              <button type="button" onClick={() => updateOrder(o.id, { paymentStatus: 'Failed' })} className="rounded-md border border-input px-3 py-1.5">✖ Not received</button>
            </div>
          )}
          <div className="mt-3 flex flex-wrap items-center gap-2 text-xs">
            <select value={o.status} onChange={(e) => updateOrder(o.id, { status: e.target.value as OrderStatus })} className="h-8 rounded-md border border-input px-2" aria-label="Order status">{ORDER_STATUS.map((s) => <option key={s}>{s}</option>)}</select>
            <select value={o.paymentStatus} onChange={(e) => { if (e.target.value === 'Paid' && !window.confirm('Mark as Paid only after you have verified the payment in your bank/UPI app. Continue?')) return; updateOrder(o.id, { paymentStatus: e.target.value as PaymentStatus }) }} className="h-8 rounded-md border border-input px-2" aria-label="Payment status">{PAY_STATUS.map((s) => <option key={s}>{s}</option>)}</select>
            <input defaultValue={o.tracking ?? ''} onBlur={(e) => e.target.value !== (o.tracking ?? '') && updateOrder(o.id, { tracking: e.target.value })} placeholder="Tracking / delivery note" className="h-8 min-w-40 flex-1 rounded-md border border-input px-2" />
            {o.cancelRequested && o.status !== 'Cancelled' && <><span className="text-amber-700">Cancellation requested</span><button type="button" onClick={() => updateOrder(o.id, { status: 'Cancelled', cancelRequested: false })} className="rounded-md bg-destructive px-2.5 py-1.5 text-white">Approve cancel</button><button type="button" onClick={() => updateOrder(o.id, { cancelRequested: false })} className="rounded-md border border-input px-2.5 py-1.5">Decline</button></>}
            <a target="_blank" rel="noopener noreferrer" className="rounded-md border border-input px-2.5 py-1.5 text-primary" href={`/api/whatsapp?to=${o.customer.phone.length === 10 ? '91' + o.customer.phone : o.customer.phone}&text=${encodeURIComponent(`Hello ${o.customer.name}, update on your order #${o.id}: ${o.status}.`)}`}>WhatsApp customer</a>
          </div>
          {settings.whatsapp && <a className="mt-2 inline-block text-[11px] text-primary underline" target="_blank" rel="noopener noreferrer" href={`/api/whatsapp?to=${settings.whatsapp}&text=${encodeURIComponent(`New order #${o.id}\n${o.customer.name} (${o.customer.phone})\n${o.items.map((i) => `${i.name} x${i.qty}`).join(', ')}\nTotal ${formatINR(o.total)} — ${o.paymentStatus}`)}`}>Prepare owner WhatsApp note</a>}
        </div>
      ))}
    </div>
  )
}

function BookingsAdmin() {
  const { allBookings, updateBooking } = useStore()
  return (
    <div className="flex flex-col gap-3">
      {allBookings.length === 0 && <p className={card + ' text-center text-sm text-muted-foreground'}>No bookings yet.</p>}
      {allBookings.map((b) => (
        <div key={b.id} className={card}>
          <div className="flex flex-wrap justify-between gap-2 text-sm"><span className="font-medium">{b.service} · {b.name} · +91 {b.phone}</span><span className={pill(b.status)}>{b.status}</span></div>
          <p className="mt-1 text-xs text-muted-foreground">#{b.id} · {fdate(b.date)} · {b.time}{b.notes ? ` · ${b.notes}` : ''}{b.changeRequest ? ` · Customer: ${b.changeRequest}` : ''}</p>
          <div className="mt-3 flex flex-wrap gap-2 text-xs">
            {(['Accepted', 'Rejected', 'Completed'] as BookingStatus[]).map((s) => <button key={s} type="button" onClick={() => updateBooking(b.id, { status: s, changeRequest: undefined })} className="rounded-md border border-input px-2.5 py-1.5 hover:bg-blush">{s === 'Accepted' ? 'Accept' : s === 'Rejected' ? 'Reject' : 'Mark Completed'}</button>)}
            <button type="button" onClick={() => { const d = window.prompt('New date (YYYY-MM-DD)', b.date); if (!d || !/^\d{4}-\d{2}-\d{2}$/.test(d)) return; const t = window.prompt('New time', b.time); if (t) updateBooking(b.id, { date: d, time: t, status: 'Rescheduled', changeRequest: undefined }) }} className="rounded-md border border-input px-2.5 py-1.5 hover:bg-blush">Reschedule</button>
            <input defaultValue={b.ownerNote ?? ''} onBlur={(e) => e.target.value !== (b.ownerNote ?? '') && updateBooking(b.id, { ownerNote: e.target.value })} placeholder="Appointment notes" className="h-8 min-w-40 flex-1 rounded-md border border-input px-2" />
          </div>
        </div>
      ))}
    </div>
  )
}

function Returns() {
  const { returns, updateReturn } = useStore()
  return (
    <div className="flex flex-col gap-3">
      {returns.length === 0 && <p className={card + ' text-center text-sm text-muted-foreground'}>No return or refund requests.</p>}
      {returns.map((r) => (
        <div key={r.id} className={card}>
          <div className="flex flex-wrap justify-between gap-2 text-sm"><span className="font-medium">Order #{r.orderId} · {r.customerName}</span><span className="flex gap-2"><span className={pill(r.status)}>{r.status}</span><span className={pill(r.refundStatus === 'Completed' ? 'Approved' : r.refundStatus)}>Refund: {r.refundStatus}</span></span></div>
          <p className="mt-1 text-xs text-muted-foreground">{r.product} · {fdate(r.date)}<br />Reason: {r.reason}</p>
          {r.description && <p className="mt-2 whitespace-pre-line rounded-lg bg-blush p-3 text-xs text-ink">{r.description}</p>}
          {r.photos && r.photos.length > 0 && <div className="mt-2 flex gap-2">{r.photos.map((p, i) => (/* eslint-disable-next-line @next/next/no-img-element */ <img key={i} src={p} alt={`Return photo ${i + 1}`} className="size-20 rounded-md object-cover ring-1 ring-border" />))}</div>}
          {(r.videoKey || !r.description) && <div className="mt-2">{r.videoKey ? <ReturnVideo videoKey={r.videoKey} /> : <p className="text-[11px] text-amber-700">No proof video (older request).</p>}</div>}
          <div className="mt-3 flex flex-wrap gap-2 text-xs">
            <button type="button" onClick={() => updateReturn(r.id, { status: 'Approved', refundStatus: 'Pending' })} className="rounded-md border border-input px-2.5 py-1.5">Approve</button>
            <button type="button" onClick={() => updateReturn(r.id, { status: 'Rejected', refundStatus: 'Not started' })} className="rounded-md border border-input px-2.5 py-1.5">Reject</button>
            <button type="button" disabled={r.status !== 'Approved'} onClick={() => { if (window.confirm('Mark refund Completed only after the money has actually been sent (confirmed in your payment provider/bank).')) updateReturn(r.id, { refundStatus: 'Completed' }) }} className="rounded-md border border-input px-2.5 py-1.5 disabled:opacity-40">Refund completed</button>
            <input defaultValue={r.note ?? ''} onBlur={(e) => e.target.value !== (r.note ?? '') && updateReturn(r.id, { note: e.target.value })} placeholder="Refund notes" className="h-8 min-w-40 flex-1 rounded-md border border-input px-2" />
          </div>
        </div>
      ))}
    </div>
  )
}

function Reviews() {
  const { allReviews, updateReview } = useStore()
  return (
    <div className="flex flex-col gap-3">
      {allReviews.length === 0 && <p className={card + ' text-center text-sm text-muted-foreground'}>No reviews yet.</p>}
      {allReviews.map((r) => (
        <div key={r.id} className={cn(card, r.hidden && 'opacity-60')}>
          <div className="flex justify-between text-sm"><span className="font-medium">{r.refName} <span className="text-xs text-muted-foreground">({r.kind})</span></span><span className="text-amber-500">{'★'.repeat(r.rating)}{'☆'.repeat(5 - r.rating)}</span></div>
          <p className="text-xs text-muted-foreground">{r.userName} · {fdate(r.date)}</p>
          <p className="mt-2 text-sm">{r.text}</p>
          <div className="mt-3 flex flex-wrap gap-2 text-xs">
            <input defaultValue={r.reply ?? ''} onBlur={(e) => e.target.value !== (r.reply ?? '') && updateReview(r.id, { reply: e.target.value })} placeholder="Write a response" className="h-8 min-w-40 flex-1 rounded-md border border-input px-2" />
            <button type="button" onClick={() => updateReview(r.id, { hidden: !r.hidden })} className="rounded-md border border-input px-2.5 py-1.5">{r.hidden ? 'Show' : 'Hide'}</button>
          </div>
        </div>
      ))}
    </div>
  )
}

function SettingsPanel() {
  const { settings, saveSettings } = useStore()
  const [s, setS] = useState<Settings>(settings)
  const set = (k: keyof Settings) => (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => setS({ ...s, [k]: e.target.type === 'number' ? Number(e.target.value) : e.target.value })
  const text = (k: keyof Settings, label: string, type = 'text') => <L t={label}><input type={type} value={String(s[k])} onChange={set(k)} className={inputCls} /></L>
  return (
    <form onSubmit={(e) => { e.preventDefault(); saveSettings(s); toast.success('Settings saved') }} className={card + ' grid gap-3 md:grid-cols-2'}>
      {text('boutiqueName', 'Boutique name')}{text('phone', 'Contact phone number')}
      {text('whatsapp', 'WhatsApp number (with country code, e.g. 919876543210)')}{text('email', 'Email', 'email')}
      <div className="md:col-span-2"><L t="Shop address"><textarea rows={2} value={s.address} onChange={set('address')} className={inputCls + ' h-auto py-2'} /></L></div>
      <L t="Business hours"><textarea rows={2} value={s.hours} onChange={set('hours')} className={inputCls + ' h-auto py-2'} /></L>
      <L t="Appointment time slots (comma separated)"><textarea rows={2} value={s.appointmentSlots} onChange={set('appointmentSlots')} className={inputCls + ' h-auto py-2'} /></L>
      {text('returnDays', 'Return window (days after delivery)', 'number')}{text('instagram', 'Instagram link')}{text('facebook', 'Facebook link')}
      {text('deliveryCharge', 'Delivery charge ₹ (0 = free)', 'number')}{text('freeDeliveryAbove', 'Free delivery above ₹ (0 = off)', 'number')}
      {text('upiId', 'UPI ID (for manual payment)')}{text('mapUrl', 'Google Maps embed URL (optional)')}
      <div className="md:col-span-2"><p className="mb-1 text-xs">UPI QR image (shown at checkout as a payment instruction)</p><ImagePicker images={s.upiQr ? [s.upiQr] : []} onChange={(i) => setS({ ...s, upiQr: i[0] ?? '' })} /></div>
      <p className="text-[11px] text-muted-foreground md:col-span-2">Razorpay: add RAZORPAY_KEY_ID and RAZORPAY_KEY_SECRET in Vercel environment variables (never in code). Online payment then appears at checkout automatically.</p>
      <div className="flex flex-wrap gap-3 md:col-span-2">
        <button type="submit" className={btnPrimary}>Save Settings</button>
        <button
          type="button"
          className={btnOutline}
          onClick={async () => {
            const r = await fetch('/api/notify-order', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ test: true }) })
            const d = await r.json().catch(() => ({}))
            if (r.ok) toast.success('Test sent — check your WhatsApp.')
            else if (d.reason === 'not-configured') toast.error('WhatsApp alerts are not set up on the server yet (see README).')
            else toast.error(`WhatsApp test failed${d.reason ? ': ' + d.reason : ''}`)
          }}
        >
          Send test WhatsApp alert
        </button>
      </div>
    </form>
  )
}
