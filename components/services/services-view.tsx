'use client'

import Image from 'next/image'
import Link from 'next/link'
import { useState } from 'react'
import { ChevronRight, Clock, MessageCircle } from 'lucide-react'
import { toast } from 'sonner'
import { formatINR, services } from '@/lib/catalog'
import { uid, useStore } from '@/lib/store'
import { btnPrimary, inputCls, waHref } from '@/lib/wa'
import { PageTitle } from '@/components/shop/ui-bits'

export function ServicesView() {
  const { catalogVersion } = useStore()
  return (
    <div className="px-4 pt-6 md:px-8" key={catalogVersion}>
      <PageTitle>Services</PageTitle>
      <span className="mt-2 block h-[3px] w-10 rounded-full bg-primary" aria-hidden="true" />
      <ul className="mt-6 grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
        {services.map((s) => (
          <li key={s.slug} className="group overflow-hidden rounded-2xl bg-white ring-1 ring-border">
            <Link href={`/services/${s.slug}`} className="block">
              <span className="relative block aspect-[16/10] overflow-hidden">
                <Image src={s.image || '/placeholder.svg'} alt={s.name} fill sizes="33vw" className="object-cover transition duration-500 group-hover:scale-105" />
              </span>
              <span className="block p-4">
                <span className="block font-serif text-lg text-ink">{s.name}</span>
                <span className="block text-xs text-muted-foreground">{s.tagline}</span>
                <span className="mt-2 flex items-center justify-between text-sm"><span className="font-semibold">From {formatINR(s.startingPrice)}</span><span className="flex items-center text-primary">Details <ChevronRight className="size-4" /></span></span>
              </span>
            </Link>
          </li>
        ))}
      </ul>
    </div>
  )
}

export function ServiceDetail({ slug }: { slug: string }) {
  const { user, settings, addBooking, ready, catalogVersion } = useStore()
  const service = services.find((s) => s.slug === slug)
  const slots = settings.appointmentSlots.split(',').map((t) => t.trim()).filter(Boolean)
  const [f, setF] = useState({ name: '', phone: '', email: '', date: '', time: '', notes: '' })
  const [done, setDone] = useState<string | null>(null)
  const set = (k: keyof typeof f) => (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => setF((s) => ({ ...s, [k]: e.target.value }))
  if (!service) return <p className="px-4 pt-10 text-center text-sm text-muted-foreground md:px-8" key={catalogVersion}>{ready ? 'This service is not available.' : 'Loading…'}</p>
  const today = new Date().toISOString().slice(0, 10)
  const prefill = () => (user && !f.name ? setF((s) => ({ ...s, name: user.name, phone: user.phone, email: user.email })) : undefined)

  const book = (e: React.FormEvent) => {
    e.preventDefault()
    if (!user) return toast.error('Please log in to book and track your appointment.')
    if (f.phone.replace(/\D/g, '').length !== 10) return toast.error('Enter a valid 10-digit phone number.')
    if (f.date < today) return toast.error('Please choose a future date.')
    const id = uid('BK')
    addBooking({ id, userId: user.id, serviceSlug: service.slug, service: service.name, name: f.name, phone: f.phone, email: f.email, date: f.date, time: f.time, notes: f.notes, status: 'Pending', createdAt: new Date().toISOString() })
    setDone(id)
  }
  const waText = `Hello ${settings.boutiqueName}! I'd like to book: ${service.name}.\nPreferred date: ${f.date || '—'}\nPreferred time: ${f.time || '—'}\nName: ${f.name || '—'}\nPhone: ${f.phone || '—'}\nPlease confirm availability.`

  return (
    <div className="px-4 pt-6 md:px-8" key={catalogVersion} onFocus={prefill}>
      <nav className="flex items-center gap-1.5 text-xs text-muted-foreground"><Link href="/services" className="hover:text-primary">Services</Link><ChevronRight className="size-3" /><span className="text-ink">{service.name}</span></nav>
      <div className="mt-4 grid gap-6 lg:grid-cols-2">
        <div>
          <div className="relative aspect-[4/3] overflow-hidden rounded-2xl ring-1 ring-border"><Image src={service.image || '/placeholder.svg'} alt={service.name} fill sizes="50vw" className="object-cover" /></div>
          <h1 className="mt-5 font-serif text-3xl text-ink">{service.name}</h1>
          <p className="mt-1 text-sm text-muted-foreground">{service.tagline}</p>
          <p className="mt-3 text-xl font-semibold">Starting from {formatINR(service.startingPrice)}</p>
          <p className="mt-1 flex items-center gap-1.5 text-xs text-ink/70"><Clock className="size-3.5" /> Typical time: {service.duration}</p>
          <p className="mt-4 text-sm leading-relaxed text-ink/85">{service.description}</p>
          <ul className="mt-4 grid grid-cols-2 gap-2 text-sm text-ink/85">{service.includes.map((i) => <li key={i} className="flex items-center gap-2"><span className="size-1.5 rounded-full bg-primary" />{i}</li>)}</ul>
        </div>
        <section className="h-fit rounded-2xl bg-white p-5 ring-1 ring-border">
          {done ? (
            <div className="py-6 text-center">
              <p className="font-serif text-2xl text-primary">Booking request sent</p>
              <p className="mt-2 text-sm">Booking ID: <b>#{done}</b></p>
              <p className="mt-1 text-xs text-muted-foreground">Status: Pending. The boutique will confirm your appointment — nothing is confirmed automatically.</p>
              <Link href="/bookings" className={btnPrimary + ' mt-5'}>View My Bookings</Link>
            </div>
          ) : (
            <form onSubmit={book} className="flex flex-col gap-3">
              <h2 className="text-base font-medium">Book Appointment</h2>
              <input required minLength={2} placeholder="Your name" value={f.name} onChange={set('name')} className={inputCls} />
              <input required inputMode="numeric" maxLength={10} placeholder="Phone number" value={f.phone} onChange={set('phone')} className={inputCls} />
              <input required type="email" placeholder="Email" value={f.email} onChange={set('email')} className={inputCls} />
              <select disabled className={inputCls}><option>{service.name}</option></select>
              <div className="grid grid-cols-2 gap-3">
                <input required type="date" min={today} value={f.date} onChange={set('date')} className={inputCls} aria-label="Preferred date" />
                <select required value={f.time} onChange={set('time')} className={inputCls} aria-label="Preferred time"><option value="">Time</option>{slots.map((t) => <option key={t}>{t}</option>)}</select>
              </div>
              <textarea rows={3} placeholder="Additional requirements" value={f.notes} onChange={set('notes')} className={inputCls + ' h-auto py-2'} />
              <button type="submit" className={btnPrimary}>Book Appointment</button>
              {!user && <p className="text-center text-xs text-muted-foreground"><Link href={`/login?next=/services/${service.slug}`} className="text-primary underline">Log in</Link> to submit and track your booking.</p>}
              <a href={waHref(settings.whatsapp, waText)} target="_blank" rel="noopener noreferrer" className="flex h-11 items-center justify-center gap-2 rounded-lg border border-primary text-sm text-primary hover:bg-blush"><MessageCircle className="size-4" /> WhatsApp Enquiry</a>
              {!settings.whatsapp && <p className="text-center text-[11px] text-muted-foreground">WhatsApp number not set yet — the owner adds it in Settings.</p>}
            </form>
          )}
        </section>
      </div>
    </div>
  )
}
